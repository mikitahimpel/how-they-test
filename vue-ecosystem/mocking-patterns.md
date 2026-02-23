# Mocking Patterns That ARE Used

While import mocking is avoided, these mocking techniques are used extensively.

## 1. `vi.fn()` — Spy Functions (Most Common)

The primary mocking tool across all projects. Used for tracking calls to callbacks, getters, and handlers.

### Tracking Computed Getter Invocations

```typescript
// packages/reactivity/__tests__/computed.spec.ts
const getter = vi.fn(() => value.foo)
const cValue = computed(getter)

// Lazy evaluation — getter not called until .value accessed
expect(getter).not.toHaveBeenCalled()

cValue.value
expect(getter).toHaveBeenCalledTimes(1)

// Cached — getter not called again
cValue.value
expect(getter).toHaveBeenCalledTimes(1)

// Invalidated — getter called again after dependency change
value.foo = 2
cValue.value
expect(getter).toHaveBeenCalledTimes(2)
```

### Tracking Error Callbacks

```typescript
// packages/compiler-core/__tests__/parse.spec.ts
const onError = vi.fn()
parseWithElementTransform(`<div v-bind/>`, { onError })

expect(onError).toHaveBeenCalled()
expect(onError.mock.calls[0][0]).toMatchObject({
  code: ErrorCodes.X_V_BIND_NO_EXPRESSION,
})
```

### Tracking Plugin Hook Calls

```typescript
// packages/vite/src/node/__tests__/plugins/index.spec.ts
const resolveId = vi.fn()
const load = vi.fn()

const config = getConfigWithPlugin([{
  name: 'test',
  resolveId: { filter: { id: /\.js$/ }, handler: resolveId },
  load: { filter: { id: '**/*.js' }, handler: load },
}])

// ... trigger resolution ...

expect(resolveId).toHaveBeenCalledWith(expect.objectContaining({ id: 'foo.js' }))
expect(load).not.toHaveBeenCalled()
```

### Mock Logger

```typescript
// packages/vite/src/node/__tests__/plugins/import.spec.ts
const config: any = {
  command: 'serve',
  logger: {
    warn: vi.fn(),
  },
}

beforeEach(() => {
  config.logger.warn.mockClear()
})

it('warns about invalid imports', () => {
  // ... trigger warning ...
  expect(config.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('should not be imported')
  )
})
```

## 2. `vi.spyOn()` — Method Interception

Used when you need to intercept calls to methods on existing objects.

### Console Methods

```typescript
// packages/runtime-core/__tests__/errorHandling.spec.ts
const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

// ... trigger warning ...

expect(spy).toHaveBeenCalledWith(expect.stringContaining('warning message'))
spy.mockRestore()
```

### Lifecycle / Instance Methods

```typescript
vi.spyOn(instance, 'getOnlyProp', 'get').mockReturnValue(456)
expect(instance.getOnlyProp).toEqual(456)
```

## 3. Inline Targeted Mocks

When jsdom lacks specific browser APIs, targeted mocks are created inline — never module-level.

### CSS Style Mock

```typescript
// packages/runtime-dom/__tests__/patchStyle.spec.ts
function mockElementWithStyle() {
  // "JSDOM doesn't support custom properties on style object
  //  so we have to mock it here"
  const style = {
    setProperty: vi.fn(),
    getPropertyValue: vi.fn(),
  }
  return { style }
}
```

### Event Mock

```typescript
// Trigger events on test runtime nodes directly
import { triggerEvent } from '@vue/runtime-test'
triggerEvent(el, 'click')
```

## 4. Automatic Module Mocks (`__mocks__/` — Vitest Only)

Vitest (testing itself) uses `__mocks__/` directories for automatic module replacement:

```
test/core/__mocks__/
  axios/           # Mock for axios
  fs.cjs           # CommonJS fs mock
  fs/              # Directory-based fs mock
  timers.ts        # Timer mock
  virtual-module.ts
```

This is used specifically because Vitest needs to test its own mocking infrastructure — it's dogfooding, not a general recommendation.

## 5. Timer Mocking

```typescript
// test/core/test/timers.test.ts
vi.useFakeTimers()

setTimeout(callback, 1000)
vi.advanceTimersByTime(1000)
expect(callback).toHaveBeenCalled()

vi.useRealTimers()
```

## What's NOT Used

| Technique | Used? |
|---|---|
| `vi.mock()` for module imports | Almost never (1 instance in Vue 3) |
| `vi.mock()` with factory function | Only in Vitest self-tests |
| `vi.stubGlobal()` | Rare |
| `vi.stubEnv()` | Not observed |
| Third-party mock libraries (sinon, testdouble) | Never |
| `proxyquire` / `rewire` / `inject-loader` | Never |
| Manual mock files for business logic | Never |

## Mock Cleanup

Consistent use of `beforeEach` / `afterEach` for cleanup:

```typescript
beforeEach(() => {
  config.logger.warn.mockClear()
})

// Or via Vitest's built-in
afterEach(() => {
  vi.restoreAllMocks()
})

// Or via onTestFinished for inline cleanup
onTestFinished(() => server.close())
```
