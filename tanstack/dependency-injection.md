# Dependency Injection

TanStack libraries are designed so that all dependencies flow through constructor options or function parameters. This is why `vi.mock()` is almost never needed.

## TanStack Query: QueryClient as the Injection Root

Everything flows through `QueryClient`. Tests create a fresh one per test:

```typescript
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
```

The `queryFn` itself is injected — it's just a function you pass:

```typescript
const queryFn = vi.fn().mockResolvedValue('data')

const observer = new QueryObserver(queryClient, {
  queryKey: ['todos'],
  queryFn,              // injected
  staleTime: 1000,      // injected
  retry: false,         // injected
})
```

For React tests, the client is provided via context (like Pinia's `setActivePinia`):

```typescript
function renderWithClient(client: QueryClient, ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  )
}
```

## TanStack Table: Everything Through Options

`createTable()` accepts all behavior through its options object:

```typescript
const table = createTable<Person>({
  enableRowSelection: true,
  onStateChange() {},           // injected
  renderFallbackValue: '',
  data,                         // injected
  getSubRows: (row) => row.subRows,  // injected
  state: {
    rowSelection: { '0': true, '2': true },  // injected
  },
  columns,                      // injected
  getCoreRowModel: getCoreRowModel(),
})
```

No mocking needed — you control all inputs:
- Data is passed directly
- Columns define the shape
- State is injected
- Row model functions are passed in
- Callbacks like `onStateChange` are `vi.fn()` when needed

## TanStack Virtual: Platform Abstraction Through Callbacks

The `Virtualizer` accepts all platform-specific operations as callbacks:

```typescript
const virtualizer = new Virtualizer({
  count: 100,
  getScrollElement: () => null,        // injected
  estimateSize: () => 50,              // injected
  scrollToFn: vi.fn(),                 // injected
  observeElementRect: vi.fn(),         // injected
  observeElementOffset: vi.fn(),       // injected
})
```

This is the same pattern as Vue's `createRenderer(nodeOps)` — platform operations are parameters, not imports. The core doesn't know if it's running in React, Vue, or a test.

## TanStack Form: Direct Instantiation

```typescript
const form = new FormApi({
  defaultValues: {
    name: 'test',
    age: 25,
  },
})
form.mount()
```

Validators are injected through options:

```typescript
const form = new FormApi({
  defaultValues: { name: '' },
  validators: {
    onChange: ({ value }) =>
      value.name.length < 3 ? 'Name too short' : undefined,
  },
})
```

No need to mock a validation library — it's just a function.

## TanStack Router: History Injection

The critical DI point: `createMemoryHistory()` replaces `createBrowserHistory()` in tests:

```typescript
const history = createMemoryHistory({ initialEntries: ['/'] })

const rootRoute = createRootRoute({})
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  loader: async () => {
    await sleep(WAIT_TIME)
    return { data: 'loaded' }
  },
  component: () => <div>Index page</div>,
})

const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute]),
  history,             // injected — no browser needed
})
```

Route definitions themselves are the injection mechanism:
- `loader` functions are injected per-route
- `component` functions are injected per-route
- `beforeLoad` guards are injected per-route

## The Common API Shape

Every TanStack library follows the same constructor pattern:

```typescript
// Query
new QueryClient(options?)
new QueryObserver(client, options)

// Table
createTable(options)

// Virtual
new Virtualizer(options)

// Form
new FormApi(options)

// Router
createRouter(options)
```

The `options` object is the DI container. Tests pass test-friendly options. Production code passes real options. No mocking infrastructure needed.

## Comparison with Vue Ecosystem Approach

| Vue Ecosystem | TanStack |
|---|---|
| `createRenderer(nodeOps)` | `new Virtualizer({ observeElementRect, scrollToFn })` |
| `parse(template, { onError })` | `new FormApi({ validators: { onChange } })` |
| `configFile: false` + inline config | `new QueryClient()` with inline options |
| Vue `provide/inject` | `QueryClientProvider` / React Context |
| `createPinia()` per test | `new QueryClient()` per test |

Same principle, different APIs: **make dependencies parameters, not imports**.
