# Module Re-requiring

React's most distinctive testing pattern — every test freshly requires React modules to avoid shared mutable state between tests.

## The Pattern

```javascript
// packages/react-dom/src/__tests__/ReactDOM-test.js
let React;
let ReactDOM;
let act;

beforeEach(() => {
  jest.resetModules();
  React = require('react');
  ReactDOM = require('react-dom');
  act = require('internal-test-utils').act;
});
```

## Why Module Re-requiring?

React maintains significant internal state:

1. **Reconciler state** — The fiber tree, work-in-progress queue, and scheduler state
2. **Hook state** — The hooks dispatcher, current fiber reference
3. **Feature flags** — `__DEV__`, `__EXPERIMENTAL__`, and build-specific flags
4. **Warning deduplication** — React deduplicates warnings by key, so a warning in test A would be silently swallowed in test B

By calling `jest.resetModules()` and re-requiring, each test starts with a completely fresh React instance.

## Typical Test Structure

```javascript
// packages/react/src/__tests__/ReactHooks-test.js
let React;
let useState;
let useEffect;
let ReactNoop;
let Scheduler;
let act;
let waitForAll;
let assertLog;

beforeEach(() => {
  jest.resetModules();
  React = require('react');
  useState = React.useState;
  useEffect = React.useEffect;
  ReactNoop = require('react-noop-renderer');
  Scheduler = require('scheduler');
  act = require('internal-test-utils').act;
  waitForAll = require('internal-test-utils').waitForAll;
  assertLog = require('internal-test-utils').assertLog;
});
```

## Variable Declarations at Module Scope

Variables are declared with `let` at module scope, then assigned in `beforeEach`:

```javascript
// This is critical — 'let' not 'const'
let React;           // Reassigned every test
let ReactDOM;        // Reassigned every test
let container;       // Fresh DOM container

beforeEach(() => {
  jest.resetModules();
  React = require('react');
  ReactDOM = require('react-dom');

  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
});
```

## Component Definitions Inside Tests

Because React is re-required, components must be defined after the require:

```javascript
it('should handle state updates', async () => {
  // Component defined INSIDE the test, using the fresh React
  function Counter() {
    const [count, setCount] = React.useState(0);
    return (
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    );
  }

  const root = ReactDOM.createRoot(container);
  await act(() => {
    root.render(<Counter />);
  });

  expect(container.textContent).toBe('Count: 0');
});
```

## Conditional Requires

Some tests conditionally require modules based on feature flags:

```javascript
beforeEach(() => {
  jest.resetModules();
  React = require('react');

  // Only available in experimental builds
  if (__EXPERIMENTAL__) {
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
  }
});
```

## Trade-offs

**Benefits:**
- Complete test isolation — no shared state bugs
- Each test can test different React configurations
- Warning deduplication doesn't affect other tests
- Concurrent mode state is fully reset

**Costs:**
- Slower test startup (module re-evaluation per test)
- More verbose setup code
- Components must be defined inside `beforeEach` or `it` blocks
- All React imports must use `require()`, not `import`
