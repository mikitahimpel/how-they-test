# Plugin Testing

Fastify's plugin system is its core architectural pattern. Testing plugins involves verifying encapsulation, decorator behavior, hook execution, and plugin lifecycle.

## Standard Plugin Test Pattern

Create a fresh Fastify instance, register the plugin, use `.inject()`:

```typescript
// fastify-cors: test/cors.test.js
const { test } = require('node:test')
const Fastify = require('fastify')
const cors = require('../')

test('Should add cors headers', async (t) => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(cors)

  fastify.get('/', (_req, reply) => {
    reply.send('ok')
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/'
  })

  t.assert.strictEqual(res.statusCode, 200)
  t.assert.strictEqual(res.payload, 'ok')
  t.assert.strictEqual(res.headers['access-control-allow-origin'], '*')
  t.assert.ok(res.headers['access-control-allow-methods'])
})
```

## Testing Encapsulation

Fastify plugins are encapsulated by default — decorators, hooks, and routes registered inside a plugin don't leak to the parent scope:

```typescript
// test/register.test.js
test('plugin encapsulation', async (t) => {
  const fastify = Fastify()

  fastify.register(function (instance, opts, done) {
    t.assert.notStrictEqual(instance, fastify)
    t.assert.ok(Object.prototype.isPrototypeOf.call(fastify, instance))
    instance.get('/first', (req, reply) => {
      reply.send({ hello: 'world' })
    })
    done()
  })

  const res = await fastify.inject({ method: 'GET', url: '/first' })
  t.assert.strictEqual(res.statusCode, 200)
})
```

## Testing Decorators

```typescript
// test/decorator.test.js
test('decorators should be encapsulated', (t, done) => {
  const fastify = Fastify()

  fastify.register((instance, opts, done) => {
    instance.decorate('test', () => 'hello')
    t.assert.ok(instance.test)
    t.assert.strictEqual(instance.test(), 'hello')
    done()
  })

  fastify.ready(() => {
    t.assert.strictEqual(fastify.test, undefined)
    done()
  })
})
```

## Testing with `fastify-plugin`

The `fastify-plugin` (fp) wrapper breaks encapsulation — decorators become available to the parent scope. This is how shared plugins work:

```typescript
// test/plugin.helper.js
const fp = require('fastify-plugin')

module.exports = fp(function (fastify, opts, done) {
  fastify.decorate('test', () => 'shared')
  done()
})
```

```typescript
// test/register.test.js
const pluginHelper = require('./plugin.helper')

test('fastify-plugin exposes decorators', (t, done) => {
  const fastify = Fastify()
  fastify.register(pluginHelper)

  fastify.ready(() => {
    t.assert.ok(fastify.test)
    t.assert.strictEqual(fastify.test(), 'shared')
    done()
  })
})
```

## Testing Plugin Timeouts

```typescript
// test/plugin.4.test.js
test('plugin timeout fires on stuck plugins', (t, done) => {
  const fastify = Fastify({ pluginTimeout: 10 })

  fastify.register(function (app, opts, pluginDone) {
    // intentionally never call pluginDone()
  })

  fastify.ready((err) => {
    t.assert.ok(err)
    t.assert.strictEqual(err.code, 'FST_ERR_PLUGIN_TIMEOUT')
    done()
  })
})
```

## Testing Hooks

```typescript
// test/hooks-async.test.js
test('onRequest hook', async (t) => {
  const fastify = Fastify()
  const order = []

  fastify.addHook('onRequest', async (req) => {
    order.push('onRequest')
  })

  fastify.get('/', async () => {
    order.push('handler')
    return { ok: true }
  })

  await fastify.inject({ method: 'GET', url: '/' })
  t.assert.deepStrictEqual(order, ['onRequest', 'handler'])
})
```

## Testing Plugin Options

```typescript
// fastify-cors: test/cors.test.js
test('custom cors options', async (t) => {
  const fastify = Fastify()
  fastify.register(cors, {
    origin: 'https://example.com',
    methods: ['GET', 'POST']
  })

  fastify.get('/', (_req, reply) => reply.send('ok'))

  const res = await fastify.inject({ method: 'GET', url: '/' })
  t.assert.strictEqual(
    res.headers['access-control-allow-origin'],
    'https://example.com'
  )
})
```
