# Per-Project Breakdown

## fastify/fastify (Core)

| Aspect | Detail |
|---|---|
| Framework | `node:test` |
| Runner | `borp` |
| Coverage | `c8` with HTML reporter |
| Test count | ~221 test files |
| Style | `test()` flat, some `describe` blocks |
| Key pattern | `.inject()`, `proxyquire`, `t.plan()` |
| Mocking | `proxyquire`, `@sinonjs/fake-timers` |

```json
// package.json scripts
{
  "unit": "borp",
  "test": "npm run lint && npm run unit && npm run test:typescript",
  "test:typescript": "tsd"
}
```

## fastify/fastify-cors

| Aspect | Detail |
|---|---|
| Framework | `node:test` |
| Runner | `node --test` directly |
| Coverage | `c8 --100` (100% enforced) |
| Style | `test()` flat |
| Key pattern | `.inject()` with CORS header assertions |

Tests focus on verifying correct CORS headers for different configurations:

```typescript
// test/cors.test.js
test('preflight request', async (t) => {
  const fastify = Fastify()
  fastify.register(cors)

  const res = await fastify.inject({
    method: 'OPTIONS',
    url: '/',
    headers: {
      'access-control-request-method': 'GET',
      origin: 'https://example.com'
    }
  })

  t.assert.strictEqual(res.statusCode, 204)
  t.assert.strictEqual(res.headers['access-control-allow-origin'], '*')
})
```

## fastify/fastify-sensible

| Aspect | Detail |
|---|---|
| Framework | `node:test` |
| Runner | `borp` |
| Style | `test()` flat |
| Key pattern | `.ready()` + decorator inspection |

Tests verify that sensible adds the expected decorators and error handlers:

```typescript
// test/sensible.test.js
test('decorators are added', async (t) => {
  const fastify = Fastify()
  fastify.register(require('..'))
  await fastify.ready()

  t.assert.ok(fastify.httpErrors)
  t.assert.ok(fastify.assert)
})
```

## fastify/fastify-autoload

| Aspect | Detail |
|---|---|
| Framework | `node:test` + Jest + Vitest |
| Runner | `borp` + `jest` + `vitest` |
| Style | `describe/it` BDD |
| Key pattern | `.inject()` after `.ready()` |

Exception to the standard Fastify pattern — tests are organized by module system and also run under multiple test runners to verify compatibility:

```typescript
// test/commonjs/basic.js
const { after, before, describe, it } = require('node:test')

describe('basic', function () {
  const app = Fastify()

  before(async function () {
    app.register(require('./basic/app'))
    await app.ready()
  })

  after(async function () {
    await app.close()
  })

  it('should respond correctly', async function () {
    const res = await app.inject({ url: '/something' })
    assert.strictEqual(res.statusCode, 200)
  })
})
```

## Common Patterns Across All Repos

1. **`'use strict'`** at the top of every file
2. **Fresh `Fastify()` instance per test** — never shared
3. **`.inject()` is the default** — real servers only when needed
4. **`t.after(() => fastify.close())`** for cleanup
5. **`{ port: 0 }`** when a real server is required
6. **`t.plan(N)`** for assertion counting
7. **No shared state** between tests
8. **`fastify-plugin` (fp)** wrapper for testing non-encapsulated plugins
9. **100% coverage** enforced in many repos
10. **TypeScript types** tested separately with `tsd`
