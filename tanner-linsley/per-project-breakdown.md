# Per-Project Breakdown

## TanStack Query

| Aspect | Detail |
|---|---|
| **Framework** | Vitest 4.x |
| **Core tests** | 23 files in `query-core/src/__tests__/` |
| **React adapter tests** | 35 files |
| **Vue adapter tests** | 19 files |
| **Solid adapter tests** | 16 files |
| **`vi.mock()` usage** | Only in Vue adapter (mocking delegation wrappers) |
| **Primary mock tool** | `vi.fn()` for queryFn/callbacks, `vi.spyOn()` for browser APIs |
| **Async strategy** | `vi.useFakeTimers()` + `advanceTimersByTimeAsync` |
| **Shared utils** | Dedicated `@tanstack/query-test-utils` package |
| **React utils** | `renderWithClient()`, `setIsServer()`, `mockOnlineManagerIsOnline()` |
| **Type tests** | Yes (`.test-d.tsx`) |
| **Isolation** | Fresh `QueryClient` per test |

### Notable Patterns

- `queryKey()` auto-incrementing function prevents key collisions
- `mockVisibilityState()` as a reusable spy helper
- `renderWithClient()` wraps components in `QueryClientProvider`
- Core tests verify caching, GC, deduplication, retry — all without framework
- React tests focus on hook lifecycle, Suspense, SSR

---

## TanStack Router

| Aspect | Detail |
|---|---|
| **Framework** | Vitest 4.x |
| **Test location** | `react-router/tests/` (40+ files) |
| **`vi.mock()` usage** | 0 instances |
| **Primary mock tool** | `vi.fn()` for loaders/callbacks, `vi.stubGlobal()` for IntersectionObserver |
| **History strategy** | `createMemoryHistory()` — no browser needed |
| **Async strategy** | `findByText` (implicit waiting), `sleep()` |
| **Type tests** | Yes |
| **Benchmarks** | Yes (`link.bench.tsx` with `vitest bench`) |
| **E2E** | Playwright |

### Notable Patterns

- Routes defined inline per test with `createRootRoute()` + `createRoute()`
- `createMemoryHistory({ initialEntries: ['/'] })` replaces browser history
- Loader functions tested through real router instances
- `getIntersectionObserverMock()` for link preloading tests
- Benchmark tests for Link rendering performance

```typescript
const history = createMemoryHistory({ initialEntries: ['/'] })
const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, aboutRoute]),
  history,
})

render(<RouterProvider router={router} />)
await screen.findByText('Index page')
```

---

## TanStack Table

| Aspect | Detail |
|---|---|
| **Framework** | Vitest 1.x |
| **Test location** | `table-core/tests/`, `react-table/tests/` |
| **`vi.mock()` usage** | 0 instances |
| **Primary mock tool** | Minimal — mostly assertion-based |
| **Test data** | Faker.js via `makeTestData.ts` |
| **Environment** | Core: `node`, React: `jsdom` |
| **Type tests** | Yes |

### Notable Patterns

- `makeData(...lens)` generates nested test data with Faker
- Core tests create `createTable()` with full options — no mocking
- Tests verify row selection, column filtering, grouping through direct API calls

```typescript
const table = createTable<Person>({
  enableRowSelection: true,
  onStateChange() {},
  renderFallbackValue: '',
  data: makeData(10, 3),
  getSubRows: (row) => row.subRows,
  state: { rowSelection: {} },
  columns,
  getCoreRowModel: getCoreRowModel(),
})

expect(table.getRowModel().rows).toHaveLength(10)
```

---

## TanStack Form

| Aspect | Detail |
|---|---|
| **Framework** | Vitest 3.x |
| **Core tests** | 17 files in `form-core/tests/` |
| **React adapter tests** | 8 files |
| **Vue adapter tests** | 3 files |
| **Solid adapter tests** | 5 files |
| **Svelte adapter tests** | 3 files |
| **`vi.mock()` usage** | 0 instances |
| **Primary mock tool** | `vi.fn()` for validators/callbacks |
| **Type tests** | Yes |

### Notable Patterns

- Core tests instantiate `FormApi` directly with inline default values
- Validators are plain functions passed as options
- Framework tests render real form components with user interactions
- `@testing-library/user-event` for typing, clicking, submitting

```typescript
// Core test
const form = new FormApi({
  defaultValues: { name: 'test' },
  validators: {
    onChange: ({ value }) =>
      value.name === '' ? 'Required' : undefined,
  },
})
form.mount()

// React test
const { findByPlaceholderText, getByText } = render(<TestForm />)
await user.type(await findByPlaceholderText('Name'), 'John')
await user.click(getByText('Submit'))
```

---

## TanStack Virtual

| Aspect | Detail |
|---|---|
| **Framework** | Vitest 2.x |
| **Core tests** | 1 file in `virtual-core/tests/` |
| **React tests** | Unit + E2E (Playwright) |
| **`vi.mock()` usage** | 0 instances |
| **Primary mock tool** | `vi.fn()` for scroll/observe callbacks |
| **E2E** | Playwright with Vite dev server |

### Notable Patterns

- Core `Virtualizer` tested by injecting all platform ops as callbacks
- Playwright E2E for real scroll behavior verification
- Vite app built and previewed for E2E tests

```typescript
// Core test
const virtualizer = new Virtualizer({
  count: 100,
  getScrollElement: () => null,
  estimateSize: () => 50,
  scrollToFn: vi.fn(),
  observeElementRect: vi.fn(),
  observeElementOffset: vi.fn(),
})

// E2E via Playwright
const page = await browser.newPage()
await page.goto('http://localhost:3000')
await page.evaluate(() => window.scrollTo(0, 5000))
```

---

## Cross-Project Summary

| Pattern | Query | Router | Table | Form | Virtual |
|---|---|---|---|---|---|
| `vi.mock()` | Vue only | 0 | 0 | 0 | 0 |
| `vi.fn()` | Heavy | Moderate | Light | Moderate | Moderate |
| `vi.spyOn()` | Browser APIs | Global APIs | — | — | — |
| Fake timers | Primary | Occasional | — | Occasional | — |
| Testing Library | React/Vue/Solid | React | React | React/Vue/Solid/Svelte | — |
| Type tests | Yes | Yes | Yes | Yes | Yes |
| Playwright E2E | — | Yes | — | — | Yes |
| Benchmarks | — | Yes | — | — | — |
| Shared test pkg | Yes (`query-test-utils`) | No | No | No | No |
| Faker for data | — | — | Yes | — | — |
| Core/adapter split | 4 adapters | 1 adapter | 1 adapter | 4 adapters | 1 adapter |
