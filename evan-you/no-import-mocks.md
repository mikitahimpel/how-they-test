# Why and How Import Mocking Is Avoided

## The Rule

Across all of Evan You's projects, `vi.mock()` for module-level import mocking is almost never used:

- **Vue 3**: Found in exactly **1 place** (compiler-sfc warning utility)
- **Vite**: **0 instances**
- **Vue Router**: **0 instances** (uses provide/inject helpers instead)
- **Pinia**: **0 instances** (uses `createPinia()` per test)

## Why Avoid Import Mocks?

Import mocking (`vi.mock()`, `jest.mock()`) has several downsides:

1. **Couples tests to implementation** — tests break when you refactor imports even if behavior is unchanged
2. **Hoisting complexity** — mock declarations are hoisted above imports, creating confusing execution order
3. **Fragile** — changing a module's export shape requires updating all mocks
4. **Hides design problems** — if you need to mock an import, the code may have too-tight coupling
5. **Hard to maintain** — mock implementations drift from real implementations

## What Replaces Import Mocks

### Pattern 1: Strategy Pattern / Parameterized Dependencies

Pass the dependency as a function parameter or config option.

```typescript
// BAD: Hardcoded import that requires vi.mock()
import { domOps } from './dom'
function render(vnode) {
  domOps.createElement(vnode.tag)  // tightly coupled
}

// GOOD: Dependency as parameter (Vue 3's actual approach)
function createRenderer(nodeOps, patchProp) {
  function render(vnode) {
    nodeOps.createElement(vnode.tag)  // injected
  }
  return { render }
}
```

### Pattern 2: Callback Injection

Accept behavior-modifying callbacks as options.

```typescript
// BAD: Import a logger module, then vi.mock() it in tests
import { logError } from './logger'
function parse(template) {
  if (invalid) logError(error)
}

// GOOD: Accept callback as option (Vue 3 compiler's actual approach)
function parse(template, { onError } = {}) {
  if (invalid) onError?.(error)
}

// Test: just pass vi.fn()
const onError = vi.fn()
parse('<div v-bind/>', { onError })
expect(onError).toHaveBeenCalled()
```

### Pattern 3: Plugin Architecture

Use plugin hooks instead of mocking module internals.

```typescript
// BAD: Mock fs to test file reading
vi.mock('fs', () => ({ readFile: vi.fn(() => 'content') }))

// GOOD: Virtual plugin that serves content (Vite's actual approach)
await build({
  plugins: [{
    name: 'test',
    resolveId(id) { if (id === 'entry.js') return '\0' + id },
    load(id) { if (id === '\0entry.js') return 'console.log("hello")' },
  }],
})
```

### Pattern 4: Config Bypass

Bypass file-based config loading with inline config.

```typescript
// BAD: Mock the config loader
vi.mock('./loadConfig', () => ({ load: () => mockConfig }))

// GOOD: Skip config file entirely (Vite's actual approach)
const server = await createServer({
  configFile: false,
  root: import.meta.dirname,
  plugins: [myPlugin],
})
```

### Pattern 5: Framework-Level provide/inject

Use Vue's own DI mechanism for component tree dependencies.

```typescript
// BAD: Mock the router module
vi.mock('vue-router', () => ({ useRoute: () => mockRoute }))

// GOOD: Provide mock via Vue's DI (Vue Router's actual approach)
const mockRoute = createMockedRoute({ path: '/', params: {} })
mount(MyComponent, {
  global: { provide: mockRoute.provides }
})
```

### Pattern 6: Fresh Instance Per Test

Create a new instance for every test — no shared state to mock.

```typescript
// BAD: Mock store state/actions
vi.mock('./store', () => ({ useStore: () => mockStore }))

// GOOD: Real store, clean state (Pinia's actual approach)
beforeEach(() => {
  setActivePinia(createPinia())
})
```

## The One Exception

In Vue 3's `compiler-sfc/__tests__/compileScript.spec.ts`:

```typescript
vi.mock('../src/warn', () => ({
  warn: vi.fn(),
  warnOnce: vi.fn(),
}))
```

This mocks an internal warning utility to silence and track warnings during SFC compilation tests. It's the only confirmed `vi.mock()` usage across the entire Vue 3 codebase — and it's for a cross-cutting concern (logging), not business logic.

## Summary

The principle is simple: **make dependencies parameters, not imports**. When your function takes its dependencies as arguments, options, or plugins, tests naturally supply test versions without any mocking infrastructure.

| Instead of... | Do... |
|---|---|
| `vi.mock('./dom')` | `createRenderer(nodeOps)` |
| `vi.mock('./logger')` | `parse(template, { onError })` |
| `vi.mock('fs')` | Virtual plugin with `load()` hook |
| `vi.mock('./config')` | `{ configFile: false, ...config }` |
| `vi.mock('vue-router')` | `provide()` the mock route |
| `vi.mock('./store')` | `setActivePinia(createPinia())` |
