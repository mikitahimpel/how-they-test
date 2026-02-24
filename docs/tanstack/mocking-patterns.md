# Mocking Patterns

## `vi.mock()` Usage: Rare

Import-level mocking is almost absent across TanStack projects. The one notable exception is the **Vue Query adapter**:

```typescript
// packages/vue-query/src/__tests__/useQuery.test.ts
vi.mock('../useQueryClient')
vi.mock('../useBaseQuery')

test('should properly execute query', () => {
  useQuery({ queryKey: ['key0'], queryFn, staleTime: 1000 })
  expect(useBaseQuery).toBeCalledWith(
    QueryObserver,
    { queryKey: ['key0'], queryFn, staleTime: 1000 },
    undefined,
  )
})
```

```typescript
// packages/vue-query/src/__tests__/vueQueryPlugin.test.ts
vi.mock('../devtools/devtools')
vi.mock('../useQueryClient')
vi.mock('../useBaseQuery')
```

This is used because Vue's composition API wrappers are thin delegation layers — the test verifies the delegation happens correctly. React, Solid, and Svelte adapters don't use this pattern.

## `vi.fn()` — Primary Mocking Tool

Used everywhere for callbacks, query functions, and event handlers:

### Query Functions

```typescript
// packages/query-core/src/__tests__/queryObserver.test.tsx
const queryFn = vi.fn<(...args: Array<unknown>) => string>().mockReturnValue('data')
const observer = new QueryObserver(queryClient, {
  queryKey: key,
  queryFn,
})
const unsubscribe = observer.subscribe(vi.fn())
```

### Subscription Callbacks

```typescript
const callback = vi.fn()
const unsubscribe = observer.subscribe(callback)

// ... trigger state change ...

expect(callback).toHaveBeenCalledWith(
  expect.objectContaining({ data: 'test' })
)
unsubscribe()
```

### Scroll/DOM Callbacks (Virtual)

```typescript
// packages/virtual-core/tests/index.test.ts
const virtualizer = new Virtualizer({
  count: 100,
  getScrollElement: () => null,
  estimateSize: () => 50,
  scrollToFn: vi.fn(),
  observeElementRect: vi.fn(),
  observeElementOffset: vi.fn(),
})
```

### Event Handlers

```typescript
const onClick = vi.fn()
render(<Link to="/about" onClick={onClick}>About</Link>)
fireEvent.click(screen.getByText('About'))
expect(onClick).toHaveBeenCalled()
```

## `vi.spyOn()` — Targeted Method Interception

Used for browser APIs and specific object methods:

### Global Event Listeners

```typescript
// packages/query-core/src/__tests__/focusManager.test.tsx
const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener')
focusManager.setEventListener(() => {
  return () => {} // cleanup
})
expect(removeEventListenerSpy).toHaveBeenCalledTimes(1)
```

### Document Visibility

```typescript
// packages/query-test-utils/src/mockVisibilityState.ts
export const mockVisibilityState = (
  value: DocumentVisibilityState,
): MockInstance<() => DocumentVisibilityState> =>
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(value)
```

### Online Manager

```typescript
// packages/react-query/src/__tests__/utils.tsx
export function mockOnlineManagerIsOnline(value: boolean) {
  return vi.spyOn(onlineManager, 'isOnline').mockReturnValue(value)
}
```

## `vi.stubGlobal()` — Browser API Stubs

Used when tests need to provide browser APIs that don't exist in jsdom:

```typescript
// packages/react-router/tests/link.test.tsx
const io = getIntersectionObserverMock({ observe, disconnect })
vi.stubGlobal('IntersectionObserver', io)
```

## `vi.useFakeTimers()` — Time Control

The primary pattern for testing async behavior:

```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('should refetch after staleTime', async () => {
  const queryFn = vi.fn().mockResolvedValue('data')
  const observer = new QueryObserver(queryClient, {
    queryKey: key,
    queryFn,
    staleTime: 1000,
  })

  observer.subscribe(vi.fn())
  await vi.advanceTimersByTimeAsync(1001)

  expect(queryFn).toHaveBeenCalledTimes(2) // initial + refetch
})
```

## What's NOT Used

| Technique | Used? |
|---|---|
| `vi.mock()` for core library modules | No |
| `vi.mock()` for React/Solid/Svelte adapters | No |
| `vi.mock()` for Vue adapters | Yes (exception) |
| Third-party mock libraries | No |
| `vi.mock('fs')` / `vi.mock('path')` | No |
| Manual mock files (`__mocks__/`) | No |
| `vi.stubEnv()` | No |

## Summary

The mocking surface is tiny because the architecture eliminates the need:

```
vi.fn()          → callbacks, query functions, event handlers
vi.spyOn()       → document.visibilityState, onlineManager, event listeners
vi.useFakeTimers → all time-dependent behavior
vi.stubGlobal    → IntersectionObserver, scrollTo

vi.mock()        → almost never (Vue adapter only)
```
