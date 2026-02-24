# Test Utilities and Helpers

## Next.js: `test/lib/next-test-utils.ts`

The core utility file for Next.js testing:

### HTTP Helpers

```typescript
export async function renderViaHTTP(appPort, pathname, query) {
  return fetchViaHTTP(appPort, pathname, query).then(res => res.text())
}

export async function fetchViaHTTP(appPort, pathname, query, opts) {
  const url = `http://localhost:${appPort}${pathname}?${qs.stringify(query)}`
  return fetch(url, opts)
}
```

### Port Allocation

```typescript
export async function findPort(): Promise<number> {
  // Finds an available port
}

export function getRandomPort(): number {
  // Returns a random high port
}
```

### Polling and Waiting

```typescript
// Polls until assertion passes or times out
export async function check(fn: () => Promise<string>, expected: string | RegExp) {
  let result
  let lastError
  for (let i = 0; i < 30; i++) {
    try {
      result = await fn()
      if (typeof expected === 'string' ? result === expected : expected.test(result)) {
        return
      }
    } catch (err) {
      lastError = err
    }
    await waitFor(1000)
  }
  throw new Error(`check() timed out. Last result: ${result}`)
}

// Simple delay wrapper
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Polls with custom assertion function
export async function retry(fn: () => Promise<void>, timeout = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try { await fn(); return } catch {}
    await waitFor(500)
  }
  await fn() // final attempt — throws on failure
}
```

### Error Overlay (Redbox) Helpers

```typescript
export async function waitForRedbox(browser) {
  // Waits for the Next.js error overlay to appear
}

export async function getRedboxSource(browser) {
  // Extracts the source code shown in the error overlay
}

export async function getRedboxDescription(browser) {
  // Extracts the error description from the overlay
}
```

### Custom Server

```typescript
export function initNextServerScript(script, onStdout, env) {
  // Spawns a custom server.js with Next.js and waits for ready signal
}
```

---

## SWR: `test/utils.tsx`

### Core Helpers

```typescript
// Promise-based delay
export function sleep(time: number) {
  return new Promise(resolve => setTimeout(resolve, time))
}

// Create a delayed response (simulates network latency)
export const createResponse = <T,>(
  response: T,
  { delay } = { delay: 10 }
): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(response), delay))
}

// Unique test key generator
export const createKey = () => 'swr-key-' + ~~(Math.random() * 1e7)

// Advance one tick
export const nextTick = () => act(() => sleep(1))

// Trigger window focus events
export const focusOn = (element) => act(async () => {
  fireEvent.focus(element)
})
```

### Browser API Mocks

```typescript
// Mock document.visibilityState
export const mockVisibilityHidden = () => {
  const spy = jest.spyOn(document, 'visibilityState', 'get')
  spy.mockImplementation(() => 'hidden')
  return () => spy.mockRestore()
}

// Assert no hydration errors occurred
export const mockConsoleForHydrationErrors = () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  return () => {
    const hydrationError = console.error.mock.calls.find(([err]) =>
      err?.message?.includes('Text content does not match')
    )
    expect(hydrationError).toBeFalsy()
    console.error.mockRestore()
  }
}
```

### React Batching Control

```typescript
// Disable React 18 automatic batching for fine-grained timing control
export async function executeWithoutBatching(fn) {
  // Forces synchronous updates in React 18
}
```

---

## AI SDK: Multiple Utility Packages

### `@ai-sdk/provider-utils/test`

```typescript
// Unique ID generator for deterministic tests
export function mockId({ prefix = 'id' } = {}): () => string {
  let counter = 0
  return () => `${prefix}-${counter++}`
}

// Convert array to ReadableStream (for testing streaming)
export function convertArrayToReadableStream<T>(
  values: T[]
): ReadableStream<T> {
  return new ReadableStream({
    start(controller) {
      for (const value of values) controller.enqueue(value)
      controller.close()
    },
  })
}

// Convert ReadableStream back to array (for assertions)
export function convertReadableStreamToArray<T>(
  stream: ReadableStream<T>
): Promise<T[]> {
  return new Promise((resolve) => {
    const chunks: T[] = []
    const reader = stream.getReader()
    function read() {
      reader.read().then(({ done, value }) => {
        if (done) { resolve(chunks); return }
        chunks.push(value)
        read()
      })
    }
    read()
  })
}

// Convert AsyncIterable to array (for testing async generators)
export function convertAsyncIterableToArray<T>(
  iterable: AsyncIterable<T>
): Promise<T[]> {
  return new Promise(async (resolve) => {
    const result: T[] = []
    for await (const item of iterable) result.push(item)
    resolve(result)
  })
}
```

### Sequential Mock Values

```typescript
// Returns values in sequence, sticking to the last value
export function mockValues<T>(...values: T[]): () => T {
  let counter = 0
  return () => values[counter++] ?? values[values.length - 1]
}

// Usage:
const getId = mockValues('id-1', 'id-2', 'id-3')
getId() // 'id-1'
getId() // 'id-2'
getId() // 'id-3'
getId() // 'id-3' (sticks to last)
```

### Public Test Exports

AI SDK exports its mock utilities for library consumers:

```typescript
// ai/test — public API
export { MockLanguageModelV3 } from '../src/test/mock-language-model-v3'
export { MockEmbeddingModelV3 } from '../src/test/mock-embedding-model-v3'
export { MockImageModelV3 } from '../src/test/mock-image-model-v3'
export { MockProviderV3 } from '../src/test/mock-provider-v3'
export { MockSpeechModelV3 } from '../src/test/mock-speech-model-v3'
export { mockValues } from '../src/test/mock-values'
```

---

## Fixture Patterns

### Next.js: Complete Applications

Each test fixture is a self-contained Next.js app directory. The `nextTestSetup` copies it to a temp dir, installs deps, and boots it.

### AI SDK: Captured API Responses

```
__fixtures__/
  openai-text.json                    # Full JSON response body
  openai-text.chunks.txt              # SSE stream (one chunk per line)
  azure-model-router.1.chunks.txt     # Multi-turn conversation chunks
```

These are real captured responses from provider APIs, used to test parsing and transformation.

### SWR: Inline in Tests

SWR tests define data inline — no fixture files:

```typescript
it('should revalidate', async () => {
  let value = 0
  const fetcher = () => createResponse(value++, { delay: 50 })
  // ...
})
```
