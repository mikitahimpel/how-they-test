# Test Utilities and Helpers

## Global Setup: Warning Assertion System (Vue 3 + Pinia)

Both Vue 3 and Pinia implement a custom system that **fails tests if warnings go unasserted**.

### Vue 3: `scripts/setup-vitest.ts`

Registered via `setupFiles` in vitest config:

```typescript
// Custom matchers
expect.extend({
  toHaveBeenWarned(received: string) { /* ... */ },
  toHaveBeenWarnedLast(received: string) { /* ... */ },
  toHaveBeenWarnedTimes(received: string, n: number) { /* ... */ },
})

// Intercept console.warn before every test
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

// After every test, fail if any warnings were not explicitly asserted
afterEach(() => {
  const unassertedWarnings = console.warn.mock.calls
    .filter(call => !assertedWarnings.has(call))
  if (unassertedWarnings.length) {
    throw new Error(
      `Test emitted warnings that were not asserted:\n` +
      unassertedWarnings.map(w => `  - ${w}`).join('\n')
    )
  }
})
```

Usage in tests:

```typescript
it('warns when prop is invalid', () => {
  // ... do something that triggers a warning ...
  expect('Invalid prop').toHaveBeenWarned()
})

it('warns exactly twice', () => {
  // ...
  expect('Duplicate key').toHaveBeenWarnedTimes(2)
})
```

### Pinia: `vitest-mock-warn.ts`

Same pattern, packaged as a composable:

```typescript
export function mockWarn() {
  let mockInstance: MockInstance

  expect.extend({
    toHaveBeenWarned(received: string | RegExp) { /* ... */ },
    toHaveBeenWarnedTimes(received, n) { /* ... */ },
    toHaveBeenWarnedLast(received) { /* ... */ },
  })

  beforeEach(() => {
    asserted.clear()
    mockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    const unassertedLogs = mockInstance.mock.calls
      .map(args => String(args[0]))
      .filter(msg => !wasAsserted(msg))
    if (unassertedLogs.length) {
      throw new Error(`Test threw unexpected warnings:\n${unassertedLogs.join('\n')}`)
    }
  })
}

// Used per-file
describe('Store', () => {
  mockWarn()  // activate warning interception
  // ...
})
```

## Per-Package Test Utilities

### compiler-sfc: `__tests__/utils.ts`

```typescript
// Wrap SFC compilation for easy test usage
export function compileSFCScript(src: string, options?: Partial<SFCScriptCompileOptions>) {
  const { descriptor } = parse(src)
  return compileScript(descriptor, { id: mockId, ...options })
}

// Validate generated code is syntactically valid via Babel
export function assertCode(code: string) {
  try {
    babelParse(code, { sourceType: 'module', plugins: ['typescript'] })
  } catch (e) {
    console.log(code)
    throw e
  }
}

// Stable mock ID for snapshot consistency
export const mockId = 'xxxxxxxx'

// Source map position helper
export function getPositionInCode(code: string, token: string, offset = 0) {
  const index = code.indexOf(token)
  const lines = code.slice(0, index + offset).split('\n')
  return { line: lines.length, column: lines[lines.length - 1].length }
}
```

### Per-File Helper Functions

Tests define local helpers tailored to the specific transform or feature being tested:

```typescript
// packages/compiler-core/__tests__/transforms/transformElement.spec.ts
function parseWithElementTransform(template: string, options = {}) {
  const ast = parse(`<div>${template}</div>`)
  transform(ast, {
    nodeTransforms: [transformElement, transformText],
    ...options,
  })
  const codegenNode = (ast.children[0] as ElementNode).codegenNode
  return { root: ast, node: codegenNode }
}

function parseWithBind(template: string, options = {}) {
  return parseWithElementTransform(template, {
    directiveTransforms: { bind: transformBind },
    ...options,
  })
}
```

## Vitest Self-Testing Utilities

### `test/test-utils/index.ts` (646 lines)

| Function | Purpose |
|---|---|
| `runVitest(config, filters, options)` | Starts a child Vitest instance programmatically |
| `runVitestCli(options, ...args)` | Runs Vitest as a subprocess via CLI |
| `runInlineTests(structure, config)` | Creates temp file system, runs tests, cleans up |
| `useFS(root, structure)` | Creates virtual test file system with auto-cleanup |
| `createFile(file, content)` | Creates file with `onTestFinished` cleanup |
| `editFile(file, callback)` | Edits file with auto-restore on test completion |
| `buildTestTree(testModules)` | Builds hierarchical result trees for assertion |
| `buildErrorTree(testModules)` | Builds error-only trees for failure assertions |
| `replaceRoot(string, root)` | Sanitizes paths for cross-platform snapshots |
| `stripIndent(str)` | Normalizes indentation in template strings |

### `runInlineTests()` Pattern

Creates an entire project on disk, runs Vitest against it, inspects results:

```typescript
const { testTree, exitCode } = await runInlineTests({
  'math.test.ts': `
    import { expect, test } from 'vitest'
    test('adds', () => { expect(1 + 1).toBe(2) })
    test('fails', () => { expect(1 + 1).toBe(3) })
  `,
})

expect(exitCode).toBe(1)
expect(testTree()).toMatchInlineSnapshot(`
  ✓ math.test.ts > adds
  ✗ math.test.ts > fails
`)
```

### `useFS()` — Virtual File System

```typescript
const fs = useFS('/tmp/test-project', {
  'src/index.ts': `export const x = 1`,
  'src/utils.ts': `export function add(a, b) { return a + b }`,
  'test/index.test.ts': `
    import { x } from '../src/index'
    test('x is 1', () => expect(x).toBe(1))
  `,
})

// Files are created on disk, cleaned up after test finishes
```

## Vite E2e Test Utilities

### `playground/test-utils.ts`

```typescript
// DOM helpers
export function getColor(el: string) { /* computed style */ }
export function getBgColor(el: string) { /* computed background */ }

// File mutation for HMR testing
export function editFile(filename: string, replacer: (content: string) => string) {
  // Reads file, applies replacer, writes back
  // Used to trigger HMR updates during e2e tests
}
export function addFile(filename: string, content: string) { /* ... */ }
export function removeFile(filename: string) { /* ... */ }

// Build output inspection
export function findAssetFile(match: string | RegExp) { /* ... */ }
export function listAssets() { /* ... */ }
export function readManifest() { /* ... */ }

// Async coordination
export function untilBrowserLogAfter(
  operation: () => Promise<void>,
  target: string | RegExp,
) {
  // Waits for specific browser console.log after an operation
  // Used to verify HMR update completion
}
```

### `playground/vitestSetup.ts`

Per-file setup that starts a real Vite dev server or build:

```typescript
// Exports mutable state
export let page: Page
export let browser: Browser
export let serverLogs: string[]
export let browserLogs: string[]
export let browserErrors: Error[]

// Imported via path alias
// import { page, editFile } from '~utils'
```

Configured in `vitest.config.e2e.ts`:

```typescript
resolve: {
  alias: {
    '~utils': resolve(import.meta.dirname, './playground/test-utils'),
  },
}
```
