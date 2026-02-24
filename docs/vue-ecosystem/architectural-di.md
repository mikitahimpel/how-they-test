# Architectural Dependency Injection

Vue ecosystem projects don't use DI containers, decorators, or frameworks. Instead, the APIs themselves are designed with injection points — dependencies are parameters.

## Pattern 1: Renderer Abstraction (Vue 3)

The most significant example. Vue 3's renderer is a factory that accepts its platform dependencies:

```typescript
// packages/runtime-core/src/renderer.ts
export function createRenderer<
  HostNode,
  HostElement extends HostNode
>(options: RendererOptions<HostNode, HostElement>) {
  // The entire renderer is generic over its host environment
  const {
    insert,
    remove,
    patchProp,
    createElement,
    createText,
    createComment,
    setText,
    setElementText,
    parentNode,
    nextSibling,
  } = options

  // All DOM operations go through these injected functions
  function mountElement(vnode, container) {
    const el = createElement(vnode.type)   // injected
    insert(el, container)                   // injected
  }

  return { render, createApp }
}
```

### Production Runtime

```typescript
// packages/runtime-dom/src/index.ts
import { nodeOps } from './nodeOps'     // Real DOM operations
import { patchProp } from './patchProp' // Real DOM prop patching
const { render } = createRenderer({ ...nodeOps, patchProp })
```

### Test Runtime

```typescript
// packages/runtime-test/src/index.ts
import { nodeOps } from './nodeOps'     // Plain JS objects
import { patchProp } from './patchProp' // Object property setting
const { render } = createRenderer({ ...nodeOps, patchProp })
```

### Test Runtime nodeOps

The test runtime uses plain JavaScript objects instead of DOM elements:

```typescript
// packages/runtime-test/src/nodeOps.ts
export function createElement(tag: string): TestElement {
  const node: TestElement = {
    id: nodeId++,
    type: NodeTypes.ELEMENT,
    tag,
    children: [],
    props: {},
    parentNode: null,
    eventListeners: null,
  }
  markRaw(node)  // prevent Vue reactivity from tracking test nodes
  return node
}

export function insert(child, parent, ref?) {
  // Array manipulation instead of real DOM insertion
  const refIndex = ref ? parent.children.indexOf(ref) : -1
  if (refIndex !== -1) {
    parent.children.splice(refIndex, 0, child)
  } else {
    parent.children.push(child)
  }
  child.parentNode = parent
}
```

### Test Assertions

```typescript
// Serialize test DOM tree to HTML string for assertions
import { serializeInner } from '@vue/runtime-test'

expect(serializeInner(root)).toBe('<div>hello</div>')

// Record all DOM operations for inspection
import { dumpOps } from '@vue/runtime-test'
const ops = dumpOps()
expect(ops).toEqual([
  { type: 'create', nodeType: 'element', tag: 'div' },
  { type: 'insert', parent: root },
])
```

## Pattern 2: Plugin-Based Extension (Vite)

Vite's entire architecture is plugin-driven. The plugin interface itself serves as the DI mechanism:

```typescript
// Vite's plugin interface
interface Plugin {
  name: string
  resolveId?(id: string): string | null    // Override module resolution
  load?(id: string): string | null          // Override file loading
  transform?(code: string, id: string): string | null  // Override transforms
}
```

Tests inject behavior through plugins instead of mocking internals:

```typescript
// Test: provide virtual modules via plugin
const result = await build({
  configFile: false,
  build: { write: false },
  plugins: [{
    name: 'test-fixture',
    resolveId(id) {
      if (id === 'my-module') return '\0virtual:my-module'
    },
    load(id) {
      if (id === '\0virtual:my-module') {
        return `export const value = 42`
      }
    },
  }],
})
```

No `vi.mock('fs')`, no `vi.mock('path')` — the plugin system handles it.

## Pattern 3: Options Objects (Vue 3 Compiler)

Compiler functions accept options that control behavior:

```typescript
// packages/compiler-core/src/parse.ts
export function baseParse(content: string, options: ParserOptions = {}) {
  // Error handling is injected via options
  const onError = options.onError || defaultOnError
  const onWarn = options.onWarn || defaultOnWarn
  // ...
}

// packages/compiler-core/src/transform.ts
export function transform(root: RootNode, options: TransformOptions) {
  // Transforms are injected via options
  const nodeTransforms = options.nodeTransforms || []
  const directiveTransforms = options.directiveTransforms || {}
  // ...
}
```

Tests compose exactly the transforms they want to test:

```typescript
function parseWithElementTransform(template, options = {}) {
  const ast = parse(`<div>${template}</div>`)
  transform(ast, {
    nodeTransforms: [transformElement, transformText],  // only what's needed
    ...options,
  })
  return ast.children[0].codegenNode
}

function parseWithBind(template, options = {}) {
  return parseWithElementTransform(template, {
    directiveTransforms: { bind: transformBind },  // inject specific directive
    ...options,
  })
}
```

## Pattern 4: Vue provide/inject (Vue Router)

Vue Router injects route state into the component tree via Vue's provide API:

```typescript
// In the real router
app.provide(routeLocationKey, currentRoute)
app.provide(routerKey, router)

// In tests — createMockedRoute() helper
export function createMockedRoute(initialValue) {
  const routeRef = shallowRef(initialValue)

  // Create reactive proxy
  const route = {}
  for (let key in initialValue) {
    Object.defineProperty(route, key, {
      enumerable: true,
      get: () => routeRef.value[key],
    })
  }

  return {
    value: shallowReactive(route),
    set(newRoute) {
      routeRef.value = newRoute
      return nextTick()
    },
    provides: {
      [routeLocationKey]: route,
      [routerViewLocationKey]: routeRef,
    },
  }
}
```

Components under test receive route data through the same provide/inject mechanism they use in production — no import mocking needed.

## Pattern 5: Factory Functions (Pinia)

Pinia stores are created via factory functions, so tests just create fresh instances:

```typescript
// Define store (factory pattern — not a singleton)
const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() { this.count++ },
  },
})

// Test: fresh Pinia instance per test
beforeEach(() => {
  setActivePinia(createPinia())
})

it('increments', () => {
  const store = useCounterStore()  // fresh store, no shared state
  store.increment()
  expect(store.count).toBe(1)
})
```

The `createPinia()` function is the factory. Each test gets its own Pinia instance. No mocking needed because there's no shared state to clean up.

## The Design Principle

All these patterns share one trait: **the code declares what it needs, and the caller provides it**.

```
Tight coupling (needs mocks):     Loose coupling (no mocks needed):
┌──────────┐                      ┌──────────┐
│ Function │─── imports ──→ Dep   │ Function │◄── caller passes ── Dep
└──────────┘                      └──────────┘
```

This is classic dependency inversion — but achieved through plain function parameters, options objects, and plugin interfaces rather than DI containers or decorators.
