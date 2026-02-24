# Mocking Patterns

Fastify avoids heavy mocking frameworks. The core repo uses no sinon, no jest mocks — just three targeted tools: `proxyquire` for module replacement, `@sinonjs/fake-timers` for time manipulation, and Fastify's own plugin system for behavior injection.

## 1. `proxyquire` — Module-Level Mocking

The primary mocking strategy. Replaces Node.js modules at require time to control dependencies.

### Mocking DNS Resolution

```typescript
// test/internals/server.test.js
const proxyquire = require('proxyquire')

test('DNS errors do not stop the main server', async (t) => {
  const { createServer } = proxyquire('../../lib/server', {
    'node:dns': {
      lookup: (hostname, options, cb) => {
        cb(new Error('DNS error'))
      }
    }
  })

  const { server, listen } = createServer({}, handler)
  await listen.call(Fastify(), { port: 0, host: 'localhost' })
  server.close()
  t.assert.ok(true, 'server started despite DNS error')
})
```

### Mocking Stream Internals

```typescript
// test/stream.2.test.js
const reply = proxyquire('../lib/reply', {
  'node:stream': {
    finished: (...args) => {
      if (args.length === 2) {
        args[1](new Error('test-error'))
      }
    }
  }
})
```

### Why proxyquire?

- Replaces modules only for the specific require call — no global pollution
- Works at the module boundary, not inside function bodies
- Easy to reason about — you see exactly what's replaced in the test setup

## 2. `@sinonjs/fake-timers` — Timer Mocking

The only sinon component used. Controls `setTimeout`, `setInterval`, `Date.now()`.

### Testing Plugin Timeouts

```typescript
// test/plugin.4.test.js
const fakeTimer = require('@sinonjs/fake-timers')

test('pluginTimeout default', (t, done) => {
  const clock = fakeTimer.install({
    shouldClearNativeTimers: true
  })

  const fastify = Fastify()
  fastify.register(function (app, opts, pluginDone) {
    // Never call pluginDone — simulates a stuck plugin
    clock.tick(10000)
  })

  fastify.ready((err) => {
    t.assert.ok(err)
    t.assert.strictEqual(err.code, 'FST_ERR_PLUGIN_TIMEOUT')
    clock.uninstall()
    done()
  })
})
```

Key pattern: install → tick → assert → uninstall. Always uninstall in cleanup.

## 3. Custom `serverFactory` — Mock Server Injection

Fastify's `serverFactory` option lets you wrap or replace the HTTP server:

```typescript
// test/custom-http-server.test.js
const fastify = Fastify({
  serverFactory: (handler, opts) => {
    const server = http.createServer((req, res) => {
      req.custom = true
      handler(req, res)
    })
    return server
  }
})
```

This injects custom behavior at the server level without mocking modules.

## 4. Plugin System as Mocking

Fastify's plugin encapsulation naturally supports dependency injection. Instead of mocking, register a plugin that provides the dependency:

```typescript
// test/decorator.test.js
test('inject dependency via decorator', async (t) => {
  const fastify = Fastify()

  // "Mock" a database via decorator
  fastify.decorate('db', {
    query: async () => [{ id: 1, name: 'test' }]
  })

  fastify.get('/users', async function (req) {
    return this.db.query('SELECT * FROM users')
  })

  const res = await fastify.inject({ method: 'GET', url: '/users' })
  t.assert.deepStrictEqual(res.json(), [{ id: 1, name: 'test' }])
})
```

## What Fastify Does NOT Use

| Tool | Why not |
|---|---|
| sinon (full) | Too heavy — only fake-timers extracted |
| jest.mock() | Not using Jest as a framework |
| vi.mock() | Not using Vitest in core |
| nock | `.inject()` eliminates the need for HTTP mocking |
| msw | Same — inject handles HTTP simulation |

The `.inject()` pattern makes most HTTP mocking tools unnecessary. Module-level concerns are handled by `proxyquire`.
