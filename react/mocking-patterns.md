# Mocking Patterns

React's mocking approach is distinctive — instead of mocking modules at the import level, it relies on module re-requiring, the Scheduler mock, and custom console interception.

## Scheduler Mock

The Scheduler package has a mock implementation that gives tests full control over async scheduling:

```javascript
// packages/scheduler/src/forks/SchedulerMock.js
// Replaces the real scheduler in test environments

let React;
let Scheduler;
let waitForAll;
let waitFor;
let assertLog;

beforeEach(() => {
  jest.resetModules();
  React = require('react');
  Scheduler = require('scheduler');
  const utils = require('internal-test-utils');
  waitForAll = utils.waitForAll;
  waitFor = utils.waitFor;
  assertLog = utils.assertLog;
});
```

### Logging Work

Tests use `Scheduler.log()` to trace rendering:

```javascript
function App({name}) {
  Scheduler.log('Render App: ' + name);
  return <div>{name}</div>;
}

it('should render in order', async () => {
  ReactNoop.render(<App name="hello" />);
  await waitForAll(['Render App: hello']);
});
```

### Partial Flushing

Tests can flush work incrementally to test concurrent behavior:

```javascript
it('should support time slicing', async () => {
  function SlowComponent({value}) {
    Scheduler.log('Slow: ' + value);
    return <div>{value}</div>;
  }

  React.startTransition(() => {
    ReactNoop.render(
      <>
        <SlowComponent value="a" />
        <SlowComponent value="b" />
        <SlowComponent value="c" />
      </>
    );
  });

  // Only flush first two renders
  await waitFor(['Slow: a', 'Slow: b']);

  // Remaining work hasn't completed
  // Can interrupt with higher priority work here

  // Flush remaining
  await waitForAll(['Slow: c']);
});
```

## @gate Pragma

The `@gate` pragma filters tests based on feature flags:

```javascript
// @gate experimental
it('should support useFormStatus', async () => {
  // This test only runs in experimental builds
});

// @gate __DEV__
it('should warn in development', () => {
  // This test only runs in development mode
});

// @gate !__DEV__
it('should not warn in production', () => {
  // This test only runs in production mode
});

// @gate www
it('should work on Facebook', () => {
  // Only runs in the Facebook build
});
```

The pragma is processed by a custom Jest transformer:

```javascript
// scripts/jest/preprocessor.js
// Transforms @gate annotations into conditional describes
// @gate experimental → if (!__EXPERIMENTAL__) { it.skip(...) }
```

## Console Interception

React tests systematically assert console warnings and errors:

```javascript
// packages/react-dom/src/__tests__/ReactDOM-test.js
it('should warn about invalid DOM nesting', async () => {
  function App() {
    return <p><div>Nested</div></p>;
  }

  const root = ReactDOM.createRoot(container);
  await act(() => {
    root.render(<App />);
  });

  assertConsoleErrorDev([
    'In HTML, <div> cannot be a descendant of <p>',
  ]);
});
```

### assertConsoleErrorDev / assertConsoleWarnDev

Custom assertion helpers that verify console output:

```javascript
// packages/internal-test-utils/consoleMock.js
export function assertConsoleErrorDev(expectedMessages) {
  const errors = capturedErrors;
  expect(errors.length).toBe(expectedMessages.length);
  expectedMessages.forEach((msg, i) => {
    expect(errors[i]).toContain(msg);
  });
  // Clear captured errors
  capturedErrors.length = 0;
}
```

If a test produces unexpected warnings/errors, it fails. If a test expects warnings/errors that don't appear, it also fails.

## jest.mock() for Externals

While React avoids `jest.mock()` for its own modules (preferring re-requiring), it uses it for external dependencies:

```javascript
// packages/react-dom/src/__tests__/ReactDOMFizzServer-test.js
jest.mock('react-dom/server', () => {
  // Use the streaming server renderer
  return require('react-dom/server.browser');
});
```

## Environment Mocking

Tests mock browser APIs when needed:

```javascript
// packages/react-dom/src/__tests__/ReactDOMFloat-test.js
let originalCreateElement;

beforeEach(() => {
  originalCreateElement = document.createElement;
  document.createElement = function(tag) {
    const el = originalCreateElement.call(document, tag);
    // Track created elements
    createdElements.push(el);
    return el;
  };
});

afterEach(() => {
  document.createElement = originalCreateElement;
});
```

## Error Boundary Testing

React has a specific pattern for testing error boundaries:

```javascript
it('should catch errors in child components', async () => {
  class ErrorBoundary extends React.Component {
    state = {error: null};
    static getDerivedStateFromError(error) {
      return {error};
    }
    render() {
      if (this.state.error) {
        return <div>Error: {this.state.error.message}</div>;
      }
      return this.props.children;
    }
  }

  function BrokenComponent() {
    throw new Error('Boom');
  }

  const root = ReactDOM.createRoot(container);
  await act(() => {
    root.render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
  });

  expect(container.textContent).toBe('Error: Boom');
});
```
