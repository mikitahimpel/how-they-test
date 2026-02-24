# Test Utilities

Fastify's core repo maintains shared test utilities in dedicated helper files alongside the tests.

## `test/helper.js` — Shared Utilities

```typescript
// test/helper.js
const { promisify } = require('node:util')
const dns = require('node:dns')

module.exports.sleep = promisify(setTimeout)

// Get server URL handling IPv4/IPv6
module.exports.getServerUrl = function (app) {
  const { address, port } = app.server.address()
  return address === '::1'
    ? `http://[${address}]:${port}`
    : `http://${address}:${port}`
}

// Resolve localhost to correct loopback address
module.exports.getLoopbackHost = async () => {
  const lookup = await dns.promises.lookup('localhost')
  return lookup.address
}

// Custom content-type parser for testing raw bodies
module.exports.plainTextParser = function (request, callback) {
  let body = ''
  request.setEncoding('utf8')
  request.on('data', (chunk) => { body += chunk })
  request.on('end', () => callback(null, body))
}
```

### Reusable Payload Method Tests

```typescript
// test/helper.js
module.exports.payloadMethod = function (method, t) {
  const fastify = require('..')()

  fastify[method.toLowerCase()]('/', (req, reply) => {
    reply.send(req.body)
  })

  // Standardized assertions for POST/PUT/PATCH etc.
  fastify.inject({
    method: method,
    url: '/',
    payload: { hello: 'world' }
  }, (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 200)
    t.assert.deepStrictEqual(JSON.parse(res.payload), { hello: 'world' })
  })
}
```

## `test/toolkit.js` — Callback Coordination

A utility for tests that need to wait for multiple async callbacks:

```typescript
// test/toolkit.js
exports.waitForCb = function (options) {
  let count = options.steps || 1
  let done = false
  let iResolve, iReject

  function stepIn () {
    if (done) {
      iReject(new Error('Unexpected done call'))
      return
    }
    if (--count) return
    done = true
    iResolve()
  }

  const patience = new Promise((resolve, reject) => {
    iResolve = resolve
    iReject = reject
  })

  return { stepIn, patience }
}
```

Usage:

```typescript
// test/hooks.test.js
const { waitForCb } = require('./toolkit')

test('multiple hooks fire in order', async (t) => {
  const { stepIn, patience } = waitForCb({ steps: 3 })

  fastify.addHook('onRequest', async () => { stepIn() })
  fastify.addHook('preHandler', async () => { stepIn() })
  fastify.addHook('onResponse', async () => { stepIn() })

  fastify.inject({ method: 'GET', url: '/' })
  await patience
})
```

## `test/toolkit.js` — Partial Deep Comparison

Similar to Jest's `expect.objectContaining()`:

```typescript
// test/toolkit.js
exports.partialDeepStrictEqual = function (actual, expected) {
  for (const key of Object.keys(expected)) {
    if (typeof expected[key] === 'object' && expected[key] !== null) {
      partialDeepStrictEqual(actual[key], expected[key])
    } else {
      assert.strictEqual(actual[key], expected[key])
    }
  }
}
```

## `test/plugin.helper.js` — Reusable Test Plugin

A minimal plugin for testing encapsulation and decorator behavior:

```typescript
// test/plugin.helper.js
const fp = require('fastify-plugin')

module.exports = fp(function (fastify, opts, done) {
  fastify.decorate('test', () => {})
  done()
})
```

## Common Test Patterns

### Fresh Instance Per Test

```typescript
test('feature A', async (t) => {
  const fastify = Fastify()   // fresh instance
  t.after(() => fastify.close())
  // ...
})

test('feature B', async (t) => {
  const fastify = Fastify()   // another fresh instance
  t.after(() => fastify.close())
  // ...
})
```

### Assertion Counting with `t.plan()`

```typescript
test('all assertions run', (t, done) => {
  t.plan(3)   // test fails if fewer or more assertions fire
  const fastify = Fastify()

  fastify.inject({ method: 'GET', url: '/' }, (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 200)
    t.assert.ok(res.headers['content-type'])
    done()
  })
})
```
