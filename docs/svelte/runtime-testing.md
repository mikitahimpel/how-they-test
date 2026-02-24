# Runtime Testing

Runtime tests verify that compiled Svelte components behave correctly when mounted in the DOM. They cover reactivity, event handling, transitions, bindings, and lifecycle.

## Multi-Variant Execution

Each runtime test runs in **up to 4 variants**:

| Variant | Description |
|---|---|
| `dom` | Client-side rendering, mount from scratch |
| `hydrate` | Server-render first, then hydrate on client |
| `ssr` | Server-side rendering only |
| `async-ssr` | Async server-side rendering |

The test infrastructure compiles each component for both client and server, then runs the appropriate variant.

## The `_config.js` Contract

Each runtime test sample exports a config object:

```typescript
// RuntimeTest interface (simplified)
export interface RuntimeTest {
  mode?: Array<'server' | 'async-server' | 'client' | 'hydrate'>;
  html?: string;            // Expected initial HTML
  ssrHtml?: string;         // Expected SSR HTML (if different)
  compileOptions?: Partial<CompileOptions>;
  props?: Record<string, any>;

  test?: (args: {
    assert: Assert;
    component: any;         // Component instance
    target: HTMLElement;     // Mount target
    window: Window;
    logs: any[];
    warnings: any[];
    raf: { tick: (ms: number) => void };
    variant: 'dom' | 'hydrate';
  }) => void | Promise<void>;
}
```

## Example: Testing Reactivity

```javascript
// runtime-runes/samples/accessors-props/_config.js
import { test } from '../../test';
import { flushSync } from 'svelte';

export default test({
  html: '<p>0</p>',

  async test({ assert, target, instance }) {
    const p = target.querySelector('p');

    flushSync(() => {
      instance.count++;
    });

    assert.equal(p.innerHTML, '1');
  }
});
```

```svelte
<!-- runtime-runes/samples/accessors-props/main.svelte -->
<script>
  let { count = 0 } = $props();
  export { count }
</script>
<p>{count}</p>
```

## Signal Tests

Low-level unit tests for the reactivity system. Each test runs in **both legacy and runes mode**:

```typescript
// packages/svelte/tests/signals/test.ts
function test(text, fn) {
  it(`${text} (legacy mode)`, run_test(false, fn));
  it(`${text} (runes mode)`, run_test(true, fn));
}

test('effect with state and derived', () => {
  const log = [];
  let count = state(0);
  let double = derived(() => $.get(count) * 2);

  effect(() => {
    log.push(`${$.get(count)}:${$.get(double)}`);
  });

  return () => {
    flushSync(() => set(count, 1));
    assert.deepEqual(log, ['0:0', '1:2']);
  };
});
```

## Store Tests

Classic Vitest `describe`/`it` tests for the Svelte store API:

```typescript
// packages/svelte/tests/store/test.ts
describe('writable', () => {
  it('creates a writable store', () => {
    const count = writable(0);
    const values = [];

    const unsubscribe = count.subscribe((value) => {
      values.push(value);
    });

    count.set(1);
    count.update((n) => n + 1);
    unsubscribe();

    assert.deepEqual(values, [0, 1, 2]);
  });
});
```

## Browser-Specific Tests

Tests that require real browser APIs use Playwright:

```
packages/svelte/tests/runtime-browser/
  test.ts              # Playwright test runner
  test-ssr.ts          # SSR variant in browser
  samples/
    ...
```

These test features that jsdom can't simulate — like actual CSS transitions, IntersectionObserver, or media queries.

## Runtime Test Categories

| Directory | What it tests |
|---|---|
| `runtime-runes/` | Runes-mode reactivity (`$state`, `$derived`, `$effect`) |
| `runtime-legacy/` | Legacy mode (pre-runes reactive declarations) |
| `runtime-production/` | Production mode (no dev warnings) |
| `runtime-browser/` | Browser-only features (Playwright) |
| `runtime-xhtml/` | XHTML namespace handling |
| `hydration/` | Server-to-client hydration |
| `motion/` | Transitions and animations |
| `signals/` | Low-level reactivity primitives |
| `store/` | Svelte store API |
