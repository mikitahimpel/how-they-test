# Core/Adapter Split

The defining architectural decision across all TanStack projects. Every library separates framework-agnostic core logic from thin framework adapters.

## The Pattern

```
packages/
  query-core/          # Pure logic: QueryClient, QueryCache, QueryObserver
  react-query/         # React hooks: useQuery, useMutation (thin wrappers)
  vue-query/           # Vue composables: useQuery (thin wrappers)
  solid-query/         # Solid primitives: createQuery (thin wrappers)
  svelte-query/        # Svelte stores: createQuery (thin wrappers)
```

## Why It Matters for Testing

### Core Tests: No Framework, No DOM

Core packages test pure business logic — caching, invalidation, state machines, data structures. No `render()`, no `screen.getByText()`, no Testing Library.

```typescript
// packages/query-core/src/__tests__/queryClient.test.tsx
let queryClient: QueryClient
let queryCache: QueryCache

beforeEach(() => {
  vi.useFakeTimers()
  queryClient = new QueryClient()
  queryCache = queryClient.getQueryCache()
  queryClient.mount()
})

afterEach(() => {
  queryClient.clear()
  vi.useRealTimers()
})

test('should return existing query data', async () => {
  const key = queryKey()
  queryClient.setQueryData(key, 'data')
  expect(queryClient.getQueryData(key)).toBe('data')
})
```

### Adapter Tests: Real Components, Real Rendering

Framework adapter tests render actual components using the appropriate Testing Library:

```typescript
// packages/react-query/src/__tests__/useQuery.test.tsx
function Page() {
  const { data = 'default' } = useQuery({
    queryKey: key,
    queryFn: () => sleep(10).then(() => 'test'),
  })
  return <div><h1>{data}</h1></div>
}

const rendered = renderWithClient(queryClient, <Page />)
expect(rendered.getByText('default')).toBeInTheDocument()
```

## Project-by-Project Split

### TanStack Query

| Layer | Tests | What They Cover |
|---|---|---|
| `query-core` (23 files) | QueryClient, QueryObserver, QueryCache, MutationCache, FocusManager, OnlineManager | Caching, invalidation, refetching, gc, deduplication |
| `react-query` (35 files) | useQuery, useMutation, useSuspenseQuery, QueryClientProvider | Hook lifecycle, Suspense integration, SSR |
| `vue-query` (19 files) | useQuery, useQueryClient, vueQueryPlugin | Composition API wrappers, plugin setup |
| `solid-query` (16 files) | createQuery, createMutation | Solid reactive primitives |

### TanStack Form

| Layer | Tests | What They Cover |
|---|---|---|
| `form-core` (17 files) | FormApi, FieldApi, validation, merging | State management, validation lifecycle, field arrays |
| `react-form` (8 files) | useForm, field rendering | React hook integration, controlled inputs |
| `vue-form` (3 files) | useForm with defineComponent | Vue composition API |
| `solid-form` (5 files) | createForm | Solid reactive integration |
| `svelte-form` (3 files) | mount/unmount components | Svelte component lifecycle |

### TanStack Table

| Layer | Tests | What They Cover |
|---|---|---|
| `table-core` (4+ files) | createTable, RowSelection, ColumnFiltering, Grouping | Core data operations |
| `react-table` | useReactTable with rendered components | React rendering, feature integration |

### TanStack Router

| Layer | Tests | What They Cover |
|---|---|---|
| `router-core` | createRouter, route matching, search params | Route resolution, params parsing |
| `react-router` (40+ files) | Link, loaders, redirects, navigation | Component rendering, navigation lifecycle |

### TanStack Virtual

| Layer | Tests | What They Cover |
|---|---|---|
| `virtual-core` (1 file) | Virtualizer constructor, measurements | Scroll math, size estimation |
| `react-virtual` + e2e | useVirtualizer + Playwright | Rendering, scroll behavior |

## The Testing Ratio

Most of the "real" testing happens at the core layer. Adapter tests are primarily integration tests that verify:
1. The wrapper correctly delegates to the core
2. Framework-specific lifecycle (mount/unmount/reactivity) works
3. The rendering output is correct

This means the majority of logic can be tested **without any DOM or framework** — fast, simple, no mocking needed.
