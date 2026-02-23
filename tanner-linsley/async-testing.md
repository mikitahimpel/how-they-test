# Async Testing Patterns

Async behavior is central to TanStack Query, Router, and Form. Here's how they test it.

## Pattern 1: Fake Timers + `advanceTimersByTimeAsync` (Primary)

The most common pattern across Query and Form:

```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('should refetch after staleTime', async () => {
  const key = queryKey()
  const queryFn = vi.fn().mockResolvedValue('data')

  function Page() {
    const state = useQuery({
      queryKey: key,
      queryFn,
      staleTime: 1000,
    })
    return <span>{state.data}</span>
  }

  const rendered = renderWithClient(queryClient, <Page />)

  // Advance past the staleTime
  await vi.advanceTimersByTimeAsync(1001)

  expect(queryFn).toHaveBeenCalledTimes(2)
  rendered.getByText('data')
})
```

### Why `advanceTimersByTimeAsync` (not `advanceTimersByTime`)

The async variant flushes microtasks (Promises) between timer ticks. Since query functions return Promises, the synchronous `advanceTimersByTime` would advance timers but not resolve the Promises.

```typescript
// This works — flushes microtasks
await vi.advanceTimersByTimeAsync(1000)

// This would NOT work for async query functions
vi.advanceTimersByTime(1000)
```

## Pattern 2: `waitFor` from Testing Library

Used when you don't control the timing precisely:

```typescript
// packages/react-form/tests/useForm.test.tsx
test('should handle submitting', async () => {
  const { findByPlaceholderText, getByText } = render(<Comp />)

  const input = await findByPlaceholderText('First name')
  await user.clear(input)
  await user.type(input, 'OtherName')
  await user.click(getByText('Submit'))

  await waitFor(() =>
    expect(getByText('Submitted data: OtherName')).toBeInTheDocument()
  )
})
```

## Pattern 3: `findByText` (Implicit Waiting)

Testing Library's `findBy*` queries have built-in retry/wait behavior:

```typescript
// packages/react-router/tests/loaders.test.tsx
test('loader resolves before rendering', async () => {
  render(<RouterProvider router={router} />)

  // findByText waits until the element appears (after loader resolves)
  const element = await screen.findByText('Index page')
  expect(element).toBeInTheDocument()
})
```

## Pattern 4: Direct Promise Resolution (Core Tests)

Core packages test async operations without any framework:

```typescript
// packages/query-core/src/__tests__/queryObserver.test.tsx
test('should fetch data', async () => {
  const key = queryKey()
  const observer = new QueryObserver(queryClient, {
    queryKey: key,
    queryFn: () => Promise.resolve('data'),
  })

  const { data } = await observer.refetch()
  expect(data).toBe('data')
})
```

## Pattern 5: Callback Counting with Fake Timers

Verifying how many times a query refetches:

```typescript
test('should not refetch if staleTime not exceeded', async () => {
  const queryFn = vi.fn().mockResolvedValue('data')

  const observer = new QueryObserver(queryClient, {
    queryKey: queryKey(),
    queryFn,
    staleTime: 5000,
  })

  observer.subscribe(vi.fn())
  await vi.advanceTimersByTimeAsync(100) // resolve initial

  expect(queryFn).toHaveBeenCalledTimes(1)

  // Trigger a window focus event
  focusManager.setFocused(true)
  await vi.advanceTimersByTimeAsync(0)

  // Should NOT refetch — still within staleTime
  expect(queryFn).toHaveBeenCalledTimes(1)

  // Advance past staleTime
  await vi.advanceTimersByTimeAsync(5000)
  focusManager.setFocused(true)
  await vi.advanceTimersByTimeAsync(0)

  // NOW it should refetch
  expect(queryFn).toHaveBeenCalledTimes(2)
})
```

## Pattern 6: `sleep()` Utility for Controlled Delays

```typescript
import { sleep } from '@tanstack/query-test-utils'

test('should show loading then data', async () => {
  function Page() {
    const { data, status } = useQuery({
      queryKey: key,
      queryFn: async () => {
        await sleep(10)    // controlled delay
        return 'fetched'
      },
    })
    return <span>{status}: {data}</span>
  }

  renderWithClient(queryClient, <Page />)
  // initially loading
  screen.getByText('pending:')

  await vi.advanceTimersByTimeAsync(11)
  // now resolved
  screen.getByText('success: fetched')
})
```

## Pattern 7: Testing Retry Behavior

```typescript
test('should retry failed queries', async () => {
  let count = 0
  const queryFn = vi.fn().mockImplementation(() => {
    count++
    if (count < 3) return Promise.reject(new Error('fail'))
    return Promise.resolve('success')
  })

  const observer = new QueryObserver(queryClient, {
    queryKey: queryKey(),
    queryFn,
    retry: 3,
    retryDelay: 100,
  })

  observer.subscribe(vi.fn())

  // Advance through retries
  await vi.advanceTimersByTimeAsync(100) // 1st retry
  await vi.advanceTimersByTimeAsync(100) // 2nd retry
  await vi.advanceTimersByTimeAsync(100) // 3rd retry (succeeds)

  expect(queryFn).toHaveBeenCalledTimes(3)
  expect(observer.getCurrentResult().data).toBe('success')
})
```

## Cleanup Pattern

Consistent cleanup across all async tests:

```typescript
afterEach(() => {
  queryClient.clear()     // clear cache
  vi.useRealTimers()      // restore real timers
  vi.restoreAllMocks()    // restore all spies
})
```
