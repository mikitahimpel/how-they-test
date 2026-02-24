# Overview

React's testing approach is uniquely shaped by two architectural decisions: the module re-requiring pattern (each test gets a fresh React) and the ReactNoop renderer (a headless renderer for testing reconciler logic without DOM overhead).

## Testing Stack

| Tool | Role |
|---|---|
| Jest 29 | Test framework and runner |
| Custom Jest CLI | Monorepo-specific configuration |
| ReactNoop | Headless renderer for reconciler tests |
| Scheduler mock | Deterministic async scheduling |
| `internal-test-utils` | Custom test helpers (act, waitFor) |

## Philosophy

1. **Fresh module state per test** — `jest.resetModules()` + re-require prevents shared mutable state
2. **Test the reconciler, not the DOM** — ReactNoop enables fast, deterministic reconciler testing
3. **Feature gates control test execution** — `@gate` pragma filters tests based on build flags
4. **Console assertions are first-class** — warnings and errors are asserted, not ignored
5. **Concurrent mode tested from day one** — Scheduler mock enables deterministic concurrent testing

## Test Categories

```
packages/
  react/src/__tests__/                  # Core API tests
  react-dom/src/__tests__/              # DOM renderer tests
  react-reconciler/src/__tests__/       # Reconciler logic
  react-server/src/__tests__/           # Server rendering
  react-server-dom-webpack/src/__tests__/ # RSC (React Server Components)
  scheduler/src/__tests__/              # Scheduler algorithm
  use-sync-external-store/src/__tests__/  # useSyncExternalStore
  react-devtools-shared/src/__tests__/  # DevTools
```

## Build Variants

React tests run against multiple build configurations:

| Variant | Description |
|---|---|
| Development | Full warnings and checks enabled |
| Production | Warnings stripped, production code paths |
| Experimental | Unstable APIs and concurrent features |
| WWW (Facebook) | Facebook-internal build with custom flags |

The `@gate` pragma controls which tests run in which variants:

```javascript
// @gate experimental
it('should support useFormStatus', () => {
  // Only runs in experimental builds
});

// @gate !experimental
it('should warn on experimental API usage', () => {
  // Only runs in stable builds
});
```

## Scale

The React monorepo has thousands of test files covering every aspect of the framework — from low-level fiber reconciliation to high-level hooks, from server rendering to concurrent features. The `react-dom` package alone has hundreds of test files for DOM events, attributes, hydration, and rendering.
