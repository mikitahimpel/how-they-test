# Per-Project Breakdown

## facebook/react (Monorepo)

| Aspect | Detail |
|---|---|
| Framework | Jest 29 with custom CLI |
| Test style | Module re-requiring, inline components |
| Renderer | ReactNoop (headless) + ReactDOM |
| Scheduling | Mock Scheduler for deterministic testing |
| Feature flags | `@gate` pragma system |
| Console | `assertConsoleErrorDev` / `assertConsoleWarnDev` |

### Package Test Breakdown

#### react (Core)

```
packages/react/src/__tests__/
  ReactElement-test.js        # createElement, JSX
  ReactJSX-test.js            # JSX runtime
  ReactChildren-test.js       # Children utilities
  ReactContext-test.js         # Context API
  ReactMemo-test.js            # React.memo
  ReactForwardRef-test.js     # forwardRef
  ReactLazy-test.js            # React.lazy
  ReactStartTransition-test.js # Concurrent transitions
```

| Focus | Key Patterns |
|---|---|
| Element creation | Direct createElement/JSX calls, snapshot comparison |
| Context | Provider/Consumer rendering, nested contexts |
| Memo | Re-render avoidance, custom comparison functions |
| Lazy | Suspense integration, module loading simulation |

#### react-dom (DOM Renderer)

```
packages/react-dom/src/__tests__/
  ReactDOM-test.js              # Core render/unmount
  ReactDOMRoot-test.js          # createRoot API
  ReactDOMFloat-test.js         # Resource preloading
  ReactDOMForm-test.js          # Form actions
  ReactDOMFizzServer-test.js    # Streaming SSR
  ReactDOMServerRendering-test.js  # Static SSR
  ReactDOMHydration-test.js     # Client hydration
  ReactDOMInput-test.js         # Controlled inputs
  ReactDOMSelect-test.js        # Select elements
  ReactDOMTextarea-test.js      # Textarea elements
  ReactDOMComponent-test.js     # DOM properties/attributes
  ReactDOMEventListener-test.js # Event delegation
  ReactDOMSuspensePlaceholder-test.js # Suspense fallbacks
  ReactDOMServerPartialHydration-test.js # Selective hydration
```

| Focus | Key Patterns |
|---|---|
| Rendering | Container rendering, root API, concurrent mode |
| Forms | Controlled/uncontrolled inputs, form actions |
| SSR | Streaming HTML, hydration mismatch detection |
| Events | Synthetic event dispatch, delegation, priorities |
| Float | `<link>`, `<script>`, `<style>` resource management |

#### react-reconciler (Fiber Engine)

```
packages/react-reconciler/src/__tests__/
  ReactFiber-test.js            # Core fiber operations
  ReactHooks-test.js            # All hooks
  ReactSuspense-test.js         # Suspense boundaries
  ReactSuspenseList-test.js     # SuspenseList coordination
  ReactTransition-test.js       # useTransition, startTransition
  ReactConcurrentErrorRecovery-test.js # Error recovery
  ReactIncrementalUpdates-test.js     # Update batching
  ReactIncrementalScheduling-test.js  # Priority scheduling
  useMutableSource-test.js      # External store integration
```

| Focus | Key Patterns |
|---|---|
| Hooks | useState, useEffect, useCallback, useMemo, useRef |
| Suspense | Fallback rendering, nested suspense, retry |
| Concurrent | Time slicing, priority interruption, transitions |
| Error | Error boundaries, recovery, getDerivedStateFromError |

#### scheduler

```
packages/scheduler/src/__tests__/
  Scheduler-test.js             # Priority queue
  SchedulerProfiling-test.js    # Profiling integration
```

Tests the scheduling algorithm — priority levels, time slicing, task cancellation.

#### react-server-dom-webpack (RSC)

```
packages/react-server-dom-webpack/src/__tests__/
  ReactFlightDOM-test.js        # Server Components streaming
  ReactFlightDOMBrowser-test.js # Browser client
  ReactFlightDOMEdge-test.js    # Edge runtime
  ReactFlightDOMReply-test.js   # Server actions
```

Tests the React Server Components protocol — serialization, streaming, client references.

### Test Commands

```bash
# All tests
yarn test

# Specific package
yarn test --selectProjects react-dom

# By test name
yarn test --testPathPattern="ReactHooks"

# Production build
yarn test --build

# Experimental features
yarn test --experimental

# Watch mode
yarn test --persistent
```

### Build Variants Tested

| Variant | Flags | Purpose |
|---|---|---|
| Source (dev) | `__DEV__=true` | Development warnings and checks |
| Build (prod) | `__DEV__=false` | Production code paths |
| Experimental | `__EXPERIMENTAL__=true` | Unstable APIs |
| WWW | `__WWW__=true` | Facebook-internal build |

## Common Conventions Across React

1. **Module re-requiring** — `jest.resetModules()` + `require()` in every `beforeEach`
2. **ReactNoop** for reconciler tests, ReactDOM for integration tests
3. **Scheduler.log()** for tracing render work
4. **`@gate` pragma** for feature-flag-conditional tests
5. **Console assertion** — all warnings/errors must be explicitly asserted
6. **No module mocking for React internals** — re-requiring provides isolation
7. **Components defined inside tests** — because React is re-required fresh
8. **Custom `internal-test-utils`** — `act()`, `waitForAll()`, `waitFor()`, `assertLog()`
