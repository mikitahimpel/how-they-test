# Per-Project Breakdown

## Vue 3 (vuejs/core)

| Aspect | Detail |
|---|---|
| **Framework** | Vitest 4.x |
| **Test suites** | 3 projects: unit (Node), unit-jsdom (jsdom), e2e (jsdom + isolation) |
| **Test location** | `packages/*/__tests__/*.spec.ts` |
| **`vi.mock()` usage** | 1 instance (compiler-sfc warning utility) |
| **Primary mock tool** | `vi.fn()` for callbacks/getters |
| **DOM strategy** | Custom `@vue/runtime-test` package with plain JS objects |
| **Key utility** | `serializeInner()` for DOM assertion |
| **Warning system** | Custom `toHaveBeenWarned()` matcher + mandatory assertion enforcement |
| **Snapshot usage** | Moderate (compiler output, SFC compilation) |
| **Feature flags** | `__DEV__`, `__TEST__`, `__FEATURE_OPTIONS_API__`, etc. |

### Notable Patterns

- `@vue/runtime-test` is the architectural centerpiece — eliminates DOM mocking entirely
- Reactivity tests use zero mocks — direct integration with real implementations
- Compiler tests use `toMatchObject()` for partial AST matching
- Error handling tested via `onError` callback injection
- Global `afterEach` fails tests with unasserted `console.warn` calls

---

## Vite (vitejs/vite)

| Aspect | Detail |
|---|---|
| **Framework** | Vitest 4.x |
| **Test suites** | 2 configs: `vitest.config.ts` (unit), `vitest.config.e2e.ts` (playground) |
| **Test location** | Unit: `packages/vite/src/node/__tests__/`, E2e: `playground/**/__tests__/` |
| **`vi.mock()` usage** | 0 instances |
| **Primary mock tool** | `vi.fn()` for logger spies |
| **FS strategy** | Virtual Rollup/Vite plugins serve content from strings |
| **Config strategy** | `configFile: false` with inline config objects |
| **Server strategy** | Real `createServer()` in `middlewareMode` with `ws: false` |
| **Build strategy** | Real `build()` with `write: false` for in-memory output |
| **E2e approach** | 60+ playground projects with Playwright |
| **Dual-mode** | E2e tests run in both dev-serve and build-preview modes |

### Notable Patterns

- Zero import mocking — everything uses real instances with controlled config
- Virtual plugins are the "mock" mechanism for file system
- `onTestFinished(() => server.close())` for cleanup
- Playground files copied to `playground-temp/` so tests can mutate for HMR
- `~utils` path alias for test utility imports
- Port tests create real HTTP servers

---

## Vitest (vitest-dev/vitest)

| Aspect | Detail |
|---|---|
| **Framework** | Itself (dogfooding) |
| **Test suites** | 14 categorized directories under `test/` |
| **Test location** | `test/core/test/`, `test/cli/`, `test/snapshots/`, etc. |
| **`vi.mock()` usage** | Yes — testing its own mocking infrastructure |
| **`__mocks__/` dirs** | Yes — `test/core/__mocks__/` with axios, fs, etc. |
| **Primary tool** | `runVitest()` — spawns child Vitest instances |
| **Inline testing** | `runInlineTests()` — creates temp projects, runs tests, inspects results |
| **Multi-pool** | Core tests run across threads, forks, and vmThreads simultaneously |
| **UI testing** | Playwright for the Vitest UI |

### Notable Patterns

- Each test subdirectory is its own pnpm workspace package
- `runVitest()` starts Vitest programmatically, captures stdout/stderr
- `runInlineTests()` creates entire projects from object literals
- `useFS()` for temporary file systems with auto-cleanup
- `buildTestTree()` / `buildErrorTree()` for structured result assertion
- `replaceRoot()` normalizes paths for cross-platform snapshots
- Tests validate Jest API compatibility layer

---

## Vue Router (vuejs/router)

| Aspect | Detail |
|---|---|
| **Framework** | Vitest |
| **Test location** | `packages/router/__tests__/` |
| **`vi.mock()` usage** | 0 instances |
| **Key helper** | `createMockedRoute()` — reactive mock route via provide/inject |
| **Organization** | Subdirectories: `guards/` (14 files), `history/`, `matcher/` |
| **Component testing** | Snapshot tests for `RouterLink` and `RouterView` |

### Notable Patterns

- `createMockedRoute()` creates reactive route objects injected via Vue's provide/inject
- Tests mount components with mock route `provides`, not module mocks
- History implementations tested per-variant: hash, html5, memory
- Navigation guards tested through real router instances
- `mount.ts` provides shared mounting utilities

---

## Pinia (vuejs/pinia)

| Aspect | Detail |
|---|---|
| **Framework** | Vitest |
| **Test location** | `packages/pinia/__tests__/` |
| **`vi.mock()` usage** | 0 instances |
| **Isolation** | `setActivePinia(createPinia())` per test |
| **Warning system** | `mockWarn()` — custom composable with `toHaveBeenWarned()` matcher |
| **Fixture stores** | `__tests__/pinia/stores/cart.ts`, `user.ts`, `combined.ts` |

### Notable Patterns

- Every test file calls `mockWarn()` at describe level
- `beforeEach` creates fresh Pinia — no shared state, no mocks needed
- Store definitions inline in test files or imported from fixture stores
- Subscription and action tracking tested via `vi.fn()` callbacks
- `createTestingPinia()` provided as official testing utility for end users

---

## VitePress (vuejs/vitepress)

| Aspect | Detail |
|---|---|
| **Framework** | Vitest |
| **Test location** | `__tests__/{unit,e2e,init}/` |
| **Organization** | Three-tier: unit, e2e, init (CLI scaffolding) |
| **Snapshot usage** | PostCSS output snapshots |

### Notable Patterns

- Clearest separation of test tiers among all projects
- Unit tests for pure functions (markdown plugins, composables, utilities)
- E2e tests use a real `.vitepress/` config with custom theme
- Init tests validate CLI project scaffolding
- Each tier has its own `vitest.config.ts`

---

## Cross-Project Summary

| Pattern | Vue 3 | Vite | Vitest | Router | Pinia | VitePress |
|---|---|---|---|---|---|---|
| `vi.mock()` | 1x | 0 | Yes* | 0 | 0 | 0 |
| `vi.fn()` | Heavy | Light | Heavy | Light | Light | Light |
| `vi.spyOn()` | Console | Console | Heavy | — | Console | — |
| Custom runtime | Yes | — | — | — | — | — |
| Virtual plugins | — | Yes | — | — | — | — |
| provide/inject | — | — | — | Yes | — | — |
| Fresh instances | — | Yes | Yes | Yes | Yes | — |
| Playground e2e | — | 60+ | — | — | — | — |
| Snapshot testing | Moderate | — | Heavy | Light | — | Light |
| Custom matchers | Warnings | — | Trees | — | Warnings | — |

*Vitest uses `vi.mock()` because it's testing its own mocking infrastructure.
