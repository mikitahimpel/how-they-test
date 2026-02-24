# Async Testing Patterns

## Never Sleep — Use Retry Assertions

Arbitrary `await sleep(500)` makes tests slow and flaky. Use assertions that retry.

```typescript
// Testing Library: waitFor retries until passing or timeout
await waitFor(() => expect(screen.getByText('loaded')).toBeInTheDocument())

// Testing Library: findBy* has built-in retry
const heading = await screen.findByText('Dashboard')

// Custom polling utility (works with any runner)
async function waitUntil(fn: () => boolean, timeout = 5000, interval = 50) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (fn()) return
    await new Promise(r => setTimeout(r, interval))
  }
  throw new Error('waitUntil timed out')
}
```

## Control Promise Resolution

Test loading and error states by controlling when async operations complete.

```typescript
// Create a promise you control
function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

// Test loading → success transition
const { promise, resolve } = createDeferred<User>()
const fetchUser = jest.fn().mockReturnValue(promise)

render(<UserProfile fetchUser={fetchUser} />)
expect(screen.getByText('Loading...')).toBeInTheDocument()

resolve({ name: 'Alice' })
await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
```

## Fake Timers

For debounce, throttle, retry logic, polling intervals, or any time-dependent behavior.

```typescript
// Setup and teardown — ALWAYS restore in afterEach
beforeEach(() => jest.useFakeTimers())   // or vi.useFakeTimers()
afterEach(() => jest.useRealTimers())

// Advance time — use ASYNC variant when Promises are involved
await jest.advanceTimersByTimeAsync(1000)

// node:test
import { mock } from 'node:test'
mock.timers.enable()
mock.timers.tick(1000)
mock.timers.reset()

// bun:test (Jest-compatible API)
jest.useFakeTimers()
jest.advanceTimersByTime(1000)
jest.useRealTimers()
```

## Testing Streams

Useful for AI/LLM responses, file processing, or Server-Sent Events.

```typescript
function arrayToStream<T>(values: T[]): ReadableStream<T> {
  return new ReadableStream({
    start(controller) {
      values.forEach(v => controller.enqueue(v))
      controller.close()
    }
  })
}

async function streamToArray<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader()
  const result: T[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result.push(value)
  }
  return result
}

// Usage
const stream = generateResponse(arrayToStream(['Hello', ' ', 'World']))
const chunks = await streamToArray(stream)
expect(chunks.join('')).toBe('Hello World')
```

## React: Wrap State Updates in act()

```typescript
import { act } from 'react'

await act(() => root.render(<App />))
await act(() => fireEvent.click(button))
await act(() => jest.advanceTimersByTimeAsync(1000))
```

Note: Testing Library's `fireEvent`, `userEvent`, and `waitFor` handle `act()` internally. You only need explicit `act()` for manual renders or timer advancement.
