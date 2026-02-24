# Test Runner API Reference

Translate between runners. Detect the project's runner from `package.json` or import statements, then use the matching API.

## Detection

| Runner | How to identify |
|---|---|
| **Vitest** | `vitest` in devDependencies, `import { vi } from 'vitest'` |
| **Jest** | `jest` in devDependencies, `jest.config.*`, `@jest/globals` |
| **bun:test** | `import { test } from 'bun:test'`, `bun test` in scripts |
| **node:test** | `import { test } from 'node:test'`, `--test` in scripts |

## API Translation

| Concept | Vitest | Jest | node:test | bun:test |
|---|---|---|---|---|
| Mock function | `vi.fn()` | `jest.fn()` | `mock.fn()` | `jest.fn()` |
| Spy on method | `vi.spyOn(obj, 'm')` | `jest.spyOn(obj, 'm')` | `mock.method(obj, 'm')` | `jest.spyOn(obj, 'm')` |
| Mock module | `vi.mock('./mod')` | `jest.mock('./mod')` | experimental | `jest.mock('./mod')` |
| Fake timers on | `vi.useFakeTimers()` | `jest.useFakeTimers()` | `mock.timers.enable()` | `jest.useFakeTimers()` |
| Advance async | `vi.advanceTimersByTimeAsync(ms)` | `jest.advanceTimersByTimeAsync(ms)` | `mock.timers.tick(ms)` | `jest.advanceTimersByTime(ms)` |
| Restore timers | `vi.useRealTimers()` | `jest.useRealTimers()` | `mock.timers.reset()` | `jest.useRealTimers()` |
| Restore mocks | `vi.restoreAllMocks()` | `jest.restoreAllMocks()` | automatic per test | `jest.restoreAllMocks()` |
| Reset modules | `vi.resetModules()` | `jest.resetModules()` | N/A | N/A |
| Assertion count | `expect.assertions(n)` | `expect.assertions(n)` | `t.plan(n)` | `expect.assertions(n)` |
| Parameterized | `describe.each([...])` | `describe.each([...])` | loop + `describe` | `describe.each([...])` |

## Lifecycle Hooks

All four runners support `beforeEach`, `afterEach`, `beforeAll`, `afterAll` with the same names.

node:test also supports `t.before()`, `t.after()`, `t.beforeEach()`, `t.afterEach()` scoped to the test context.

## Common afterEach Pattern

```typescript
// Vitest
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

// Jest / bun:test
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks() })

// node:test — mocks auto-restore, but timers need manual reset
afterEach(() => { mock.timers.reset() })
```

## Assertions

Vitest, Jest, and bun:test all use the same `expect()` API. node:test uses `assert` from `node:assert` or `t.assert`, but also supports `expect` patterns via third-party libraries.
