# Testing by Subsystem

How different types of code are tested across Vue ecosystem projects.

## Reactivity System (Vue 3)

**No mocking at all.** Tests import real implementations and verify behavior through observable side effects.

```typescript
import { reactive } from '../src/reactive'
import { effect } from '../src/effect'
import { computed } from '../src/computed'
import { ref } from '../src/ref'

it('should observe basic properties', () => {
  let dummy
  const counter = reactive({ num: 0 })
  effect(() => (dummy = counter.num))

  expect(dummy).toBe(0)
  counter.num = 7
  expect(dummy).toBe(7)
})

it('should handle computed dependencies', () => {
  const value = reactive({ foo: 1 })
  const getter = vi.fn(() => value.foo)
  const cValue = computed(getter)

  // Lazy — not computed until accessed
  expect(getter).not.toHaveBeenCalled()

  expect(cValue.value).toBe(1)
  expect(getter).toHaveBeenCalledTimes(1)

  // Cached — not recomputed when accessed again
  cValue.value
  expect(getter).toHaveBeenCalledTimes(1)

  // Invalidated — recomputed after dependency change
  value.foo = 2
  expect(cValue.value).toBe(2)
  expect(getter).toHaveBeenCalledTimes(2)
})
```

Key pattern: `vi.fn()` wraps getters/setters to count invocations and verify caching/lazy evaluation behavior. No modules are mocked.

## Components / Runtime (Vue 3)

Uses `@vue/runtime-test` — a custom lightweight test runtime with plain JS objects instead of DOM nodes.

```typescript
import {
  h, render, nodeOps, nextTick,
  serializeInner, ref, reactive
} from '@vue/runtime-test'

it('should update on state change', async () => {
  const count = ref(0)
  const Comp = {
    setup() {
      return () => h('div', count.value)
    }
  }

  const root = nodeOps.createElement('div')
  render(h(Comp), root)
  expect(serializeInner(root)).toBe('<div>0</div>')

  count.value++
  await nextTick()
  expect(serializeInner(root)).toBe('<div>1</div>')
})
```

Components are defined as plain objects with `setup()` functions. Assertions use `serializeInner()` to convert the test DOM tree to HTML strings.

## Compiler (Vue 3)

Parse template strings into AST, then assert on the tree structure. Uses `toMatchObject()` for partial AST matching.

```typescript
test('simple div', () => {
  const ast = baseParse('<div>hello</div>')
  const element = ast.children[0] as ElementNode

  expect(element).toStrictEqual({
    type: NodeTypes.ELEMENT,
    tag: 'div',
    children: [{ type: NodeTypes.TEXT, content: 'hello' }],
    // ... position info
  })
})
```

Transform tests use locally-defined helper functions:

```typescript
function parseWithElementTransform(template, options = {}) {
  const ast = parse(`<div>${template}</div>`)
  transform(ast, {
    nodeTransforms: [transformElement, transformText],
    ...options,
  })
  return ast.children[0].codegenNode
}

test('v-bind with expression', () => {
  const { node } = parseWithBind(`<div v-bind:id="foo"/>`)
  expect(node.props).toMatchObject(/* ... */)
})
```

Error handling tested via injected `onError` callbacks (not module mocking):

```typescript
const onError = vi.fn()
baseParse('invalid template', { onError })
expect(onError).toHaveBeenCalledWith(
  expect.objectContaining({ code: ErrorCodes.X_INVALID_END_TAG })
)
```

## SFC Compiler (Vue 3)

Uses shared utilities from `__tests__/utils.ts`:

```typescript
import { compileSFCScript, assertCode, mockId } from './utils'

test('should compile <script setup>', () => {
  const { content } = compileSFCScript(`
    <script setup>
    import { ref } from 'vue'
    const count = ref(0)
    </script>
  `)

  // Validate generated code is syntactically valid
  assertCode(content)

  // Snapshot test the output
  expect(content).toMatchSnapshot()
})
```

## DOM-Specific Code (Vue 3)

Runs under jsdom. Creates targeted inline mocks only when jsdom lacks specific APIs:

```typescript
// packages/runtime-dom/__tests__/patchStyle.spec.ts
function mockElementWithStyle() {
  const style = {
    setProperty: vi.fn(),
    getPropertyValue: vi.fn(),
  }
  return { style }
}

test('should set CSS custom properties', () => {
  const el = mockElementWithStyle()
  patchStyle(el, null, { '--custom': 'red' })
  expect(el.style.setProperty).toHaveBeenCalledWith('--custom', 'red')
})
```

## Build Tools / Plugins (Vite)

Tests create real plugin instances and call hooks through real bundlers:

```typescript
// CSS plugin
const { transform } = await createCssPluginTransform({
  configFile: false,
  resolve: { alias: [/* ... */] }
})
const result = await transform(`.foo { color: red }`, 'style.css')
expect(result.code).toContain(/* ... */)

// Define plugin — runs through real Rolldown bundler
async function createDefinePluginTransform(define = {}) {
  const config = await resolveConfig({ configFile: false, define }, 'serve')
  return async (code: string) => {
    const bundler = await rolldown({
      input: 'entry.js',
      plugins: [
        virtualEntryPlugin(code),
        definePlugin(config),
      ],
    })
    return (await bundler.generate()).output[0].code
  }
}
```

## Dev Server (Vite)

Real server instances in middleware mode:

```typescript
const server = await createServer({
  configFile: false,
  root: import.meta.dirname,
  plugins: [plugin],
  server: { middlewareMode: true, ws: false },
})
onTestFinished(() => server.close())

// Call server methods, inspect responses
const module = await server.transformRequest('/test.js')
expect(module.code).toContain(/* ... */)
```

## Port Detection (Vite)

Creates real HTTP servers to test port fallback:

```typescript
// packages/vite/src/node/__tests__/http.spec.ts
// No mocking of net.listen — creates actual servers
const server = http.createServer()
await new Promise(resolve => server.listen(3000, resolve))
// Test that Vite falls back to next port
const config = await resolveConfig({ server: { port: 3000 } })
// ...
server.close()
```

## Stores (Pinia)

Fresh Pinia instance per test, real stores:

```typescript
describe('Store', () => {
  mockWarn()

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const useStore = defineStore('main', {
    state: () => ({ a: true, nested: { foo: 'foo' } }),
    actions: {
      toggle() { this.a = !this.a }
    }
  })

  it('sets initial state', () => {
    const store = useStore()
    expect(store.$state).toEqual({ a: true, nested: { foo: 'foo' } })
  })

  it('runs actions', () => {
    const store = useStore()
    store.toggle()
    expect(store.a).toBe(false)
  })
})
```

## Routing (Vue Router)

History implementations tested per-variant:

```typescript
// __tests__/history/
hash.spec.ts      // Hash-based routing
html5.spec.ts     // HTML5 history API
memory.spec.ts    // In-memory (SSR)
```

Navigation guards tested through real router instances with controlled route configurations:

```typescript
// __tests__/guards/beforeEach.spec.ts
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
  ]
})

const guard = vi.fn()
router.beforeEach(guard)

await router.push('/about')
expect(guard).toHaveBeenCalledWith(
  expect.objectContaining({ path: '/about' }),
  expect.objectContaining({ path: '/' }),
  expect.any(Function)
)
```
