# Advanced Patterns

## Type-Level Testing

Verify TypeScript generics and inference are correct at compile time. Runtime tests can't catch `any` leaking through your types.

```typescript
// Vitest: natively supports expectTypeOf
// Jest/bun:test: install 'expect-type' package
import { expectTypeOf } from 'vitest' // or from 'expect-type'

it('returns typed response', () => {
  const result = parseApiResponse<User>(rawData)
  expectTypeOf(result).toEqualTypeOf<User>()
  expectTypeOf(result).not.toBeAny()
})

it('infers generic from argument', () => {
  const store = createStore({ count: 0 })
  expectTypeOf(store.getState().count).toBeNumber()
})
```

Useful for: utility types, generic functions, builder patterns, API response parsers.

## Assertion Counting

Ensure all expected assertions actually fire — critical for callback and event-driven code.

```typescript
// Jest / Vitest / bun:test
it('calls all lifecycle hooks', async () => {
  expect.assertions(3)  // test FAILS if fewer assertions run
  plugin.onInit(() => expect(true).toBe(true))
  plugin.onReady(() => expect(true).toBe(true))
  plugin.onClose(() => expect(true).toBe(true))
  await plugin.start()
  await plugin.stop()
})

// node:test
test('calls all lifecycle hooks', (t) => {
  t.plan(3)  // same concept
  // ...
})
```

## Fixture-Based Testing

For code generators, CLI tools, config parsers — anything with input→output transformation.

```
test/fixtures/
  basic-config/
    input.json
    expected-output.ts
  nested-config/
    input.json
    expected-output.ts
```

```typescript
import { readdirSync, readFileSync } from 'fs'

const fixtures = readdirSync('test/fixtures')

for (const fixture of fixtures) {
  it(`processes ${fixture}`, () => {
    const input = JSON.parse(readFileSync(`test/fixtures/${fixture}/input.json`, 'utf8'))
    const expected = readFileSync(`test/fixtures/${fixture}/expected-output.ts`, 'utf8')
    expect(generate(input)).toBe(expected)
  })
}
```

## E2E Test Harness

Wrap complex setup behind a factory so tests stay clean.

```typescript
function createTestApp(options?: { seed?: boolean }) {
  let baseUrl: string
  let cleanup: () => Promise<void>

  beforeAll(async () => {
    const { url, stop, db } = await startTestServer()
    if (options?.seed) await db.seed()
    baseUrl = url
    cleanup = stop
  })

  afterAll(() => cleanup())

  return {
    fetch: (path: string, init?: RequestInit) => fetch(`${baseUrl}${path}`, init),
    url: () => baseUrl,
  }
}

// Tests read cleanly
const app = createTestApp({ seed: true })

it('lists users', async () => {
  const res = await app.fetch('/api/users')
  const users = await res.json()
  expect(users).toHaveLength(3)
})

it('creates a user', async () => {
  const res = await app.fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice' }),
  })
  expect(res.status).toBe(201)
})
```
