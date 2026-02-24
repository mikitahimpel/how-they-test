# Test Utilities

React's test infrastructure is built on the `internal-test-utils` package and several custom helpers across the monorepo.

## internal-test-utils

The central testing package providing async test helpers:

### act()

Wraps rendering operations to ensure all effects and state updates are flushed:

```javascript
// packages/internal-test-utils/ReactInternalTestUtils.js
import {act} from 'internal-test-utils';

it('should flush effects', async () => {
  function App() {
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
      Scheduler.log('Effect: ' + count);
    });
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
  }

  const root = ReactDOM.createRoot(container);
  await act(() => {
    root.render(<App />);
  });

  assertLog(['Effect: 0']);
  expect(container.textContent).toBe('0');
});
```

### waitForAll

Flushes all pending Scheduler work and asserts the expected log:

```javascript
it('should complete all work', async () => {
  function App() {
    Scheduler.log('Render');
    return <div>Done</div>;
  }

  ReactNoop.render(<App />);
  await waitForAll(['Render']);

  expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Done</div>);
});
```

### waitFor

Flushes work until the expected logs appear (partial flush):

```javascript
it('should yield between renders', async () => {
  function Item({value}) {
    Scheduler.log(value);
    return <li>{value}</li>;
  }

  React.startTransition(() => {
    ReactNoop.render(
      <ul>
        <Item value="A" />
        <Item value="B" />
        <Item value="C" />
      </ul>
    );
  });

  // Only flush until 'B' is logged
  await waitFor(['A', 'B']);
  // 'C' hasn't rendered yet
});
```

### waitForPaint

Flushes until the next paint (browser yield point):

```javascript
it('should yield to the browser', async () => {
  function App() {
    Scheduler.log('Render');
    return <div>Hello</div>;
  }

  React.startTransition(() => {
    ReactNoop.render(<App />);
  });

  await waitForPaint(['Render']);
  // Work up to the next paint has been flushed
});
```

### assertLog

Asserts the Scheduler log matches expected entries:

```javascript
it('should log in order', async () => {
  Scheduler.log('A');
  Scheduler.log('B');
  Scheduler.log('C');

  assertLog(['A', 'B', 'C']);
});
```

### assertConsoleErrorDev / assertConsoleWarnDev

Assert expected development-mode warnings:

```javascript
it('should warn about missing keys', async () => {
  function App() {
    return [1, 2, 3].map(i => <div>{i}</div>);
  }

  const root = ReactDOM.createRoot(container);
  await act(() => {
    root.render(<App />);
  });

  assertConsoleErrorDev([
    'Each child in a list should have a unique "key" prop',
  ]);
});
```

## DOM Test Helpers

Custom helpers for DOM-based tests:

```javascript
// packages/react-dom/src/__tests__/utils/ReactDOMTestUtils.js

// Simulate events with proper bubbling
function dispatchClickEvent(element) {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
}

// Create a fresh container for each test
function createContainer() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

// Cleanup
function removeContainer(container) {
  document.body.removeChild(container);
}
```

## Concurrent Testing Helpers

Utilities for testing concurrent features:

```javascript
// Testing Suspense with manual promise resolution
function createTextResource() {
  const cache = new Map();

  return {
    read(text) {
      if (cache.has(text)) {
        const entry = cache.get(text);
        if (entry.status === 'resolved') return entry.value;
        throw entry.promise;
      }
      const entry = {status: 'pending'};
      entry.promise = new Promise(resolve => {
        entry.resolve = (value) => {
          entry.status = 'resolved';
          entry.value = value;
          resolve();
        };
      });
      cache.set(text, entry);
      throw entry.promise;
    },
    resolve(text) {
      cache.get(text).resolve(text);
    },
  };
}

it('should suspend and resume', async () => {
  const resource = createTextResource();

  function AsyncText({text}) {
    const value = resource.read(text);
    Scheduler.log(value);
    return <span>{value}</span>;
  }

  function App() {
    return (
      <React.Suspense fallback={<span>Loading...</span>}>
        <AsyncText text="Hello" />
      </React.Suspense>
    );
  }

  ReactNoop.render(<App />);
  await waitForAll([]);
  expect(ReactNoop.getChildrenAsJSX()).toEqual(<span>Loading...</span>);

  await act(() => resource.resolve('Hello'));
  assertLog(['Hello']);
  expect(ReactNoop.getChildrenAsJSX()).toEqual(<span>Hello</span>);
});
```

## Testing Patterns Summary

| Utility | Purpose |
|---|---|
| `act()` | Flush all pending work (effects, state) |
| `waitForAll(log)` | Flush all Scheduler work, assert log |
| `waitFor(log)` | Partial flush, assert log up to a point |
| `waitForPaint(log)` | Flush to next paint, assert log |
| `assertLog(log)` | Assert Scheduler log without flushing |
| `assertConsoleErrorDev(msgs)` | Assert development console.error calls |
| `assertConsoleWarnDev(msgs)` | Assert development console.warn calls |
