# ReactNoop Renderer

ReactNoop is a headless React renderer built specifically for testing the reconciler. It implements the same host config interface as `react-dom` but renders to an in-memory tree instead of the DOM.

## What Is ReactNoop?

```
packages/react-noop-renderer/
  src/
    createReactNoop.js     # Factory for creating noop renderers
    ReactNoop.js           # Default noop renderer
    ReactNoopFlightClient.js
    ReactNoopFlightServer.js
```

ReactNoop renders to plain JavaScript objects rather than DOM nodes:

```javascript
// Instead of <div className="foo">hello</div>
// ReactNoop produces:
{
  type: 'div',
  props: { className: 'foo' },
  children: ['hello'],
}
```

## Why ReactNoop?

1. **Speed** — No DOM overhead, no browser APIs
2. **Determinism** — No layout, painting, or async browser behavior
3. **Inspectability** — The entire render tree is a plain object you can snapshot
4. **Concurrent testing** — Works with the Scheduler mock for deterministic async testing

## Basic Usage

```javascript
// packages/react-reconciler/src/__tests__/ReactFiber-test.js
let React;
let ReactNoop;
let Scheduler;

beforeEach(() => {
  jest.resetModules();
  React = require('react');
  ReactNoop = require('react-noop-renderer');
  Scheduler = require('scheduler');
});

it('should render a component', async () => {
  function App() {
    return <div>Hello</div>;
  }

  ReactNoop.render(<App />);
  await waitForAll([]);

  expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
});
```

## Tree Inspection

ReactNoop provides methods to inspect the rendered tree:

```javascript
it('should update children', async () => {
  function App({items}) {
    return (
      <ul>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
    );
  }

  ReactNoop.render(<App items={['a', 'b']} />);
  await waitForAll([]);

  // Get children as JSX for assertion
  expect(ReactNoop.getChildrenAsJSX()).toEqual(
    <ul>
      <li>a</li>
      <li>b</li>
    </ul>
  );

  // Or get as plain objects
  const children = ReactNoop.getChildren();
  expect(children[0].type).toBe('ul');
  expect(children[0].children.length).toBe(2);
});
```

## Concurrent Mode Testing

ReactNoop + Scheduler mock enables deterministic concurrent rendering:

```javascript
// packages/react-reconciler/src/__tests__/ReactSuspense-test.js
it('should suspend and resume', async () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });

  function AsyncComponent() {
    if (!resolved) throw promise;
    return <div>Loaded</div>;
  }

  function App() {
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <AsyncComponent />
      </React.Suspense>
    );
  }

  ReactNoop.render(<App />);
  await waitForAll([]);

  // Should show fallback
  expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Loading...</div>);

  // Resolve the data
  await act(() => resolve());
  await waitForAll([]);

  // Should show content
  expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Loaded</div>);
});
```

## Scheduler Integration

ReactNoop integrates with the Scheduler mock for priority-based testing:

```javascript
it('should process high priority updates first', async () => {
  function App({step}) {
    Scheduler.log('Render: ' + step);
    return <div>{step}</div>;
  }

  // Low priority update
  React.startTransition(() => {
    ReactNoop.render(<App step={1} />);
  });

  // Don't finish yet
  await waitFor(['Render: 1']);

  // High priority update interrupts
  ReactNoop.flushSync(() => {
    ReactNoop.render(<App step={2} />);
  });

  assertLog(['Render: 2']);

  // Verify high priority won
  expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>2</div>);
});
```

## Multiple Roots

ReactNoop supports multiple concurrent roots:

```javascript
it('should handle multiple roots', async () => {
  const rootA = ReactNoop.createRoot();
  const rootB = ReactNoop.createRoot();

  await act(() => {
    rootA.render(<div>A</div>);
    rootB.render(<div>B</div>);
  });

  expect(rootA.getChildrenAsJSX()).toEqual(<div>A</div>);
  expect(rootB.getChildrenAsJSX()).toEqual(<div>B</div>);
});
```

## Host Config

ReactNoop implements the same `HostConfig` interface as `react-dom`:

```javascript
// packages/react-noop-renderer/src/createReactNoop.js
const hostConfig = {
  createInstance(type, props) {
    return {type, props, children: []};
  },
  createTextInstance(text) {
    return {text};
  },
  appendChildToContainer(container, child) {
    container.children.push(child);
  },
  commitUpdate(instance, type, oldProps, newProps) {
    instance.props = newProps;
  },
  // ... all other host config methods
};
```

This is what makes ReactNoop so valuable — it tests the actual reconciler code path, not a simplified simulation.
