# The Inject Pattern

The `.inject()` method is the most important testing pattern in the Fastify ecosystem. Powered by `light-my-request`, it simulates HTTP requests without binding to a network port — making tests fast, isolated, and deterministic.

## Basic Usage

### Async/Await (Preferred)

```typescript
// test/inject.test.js
const { test } = require('node:test')
const Fastify = require('fastify')

test('inject get request', async (t) => {
  const fastify = Fastify()

  fastify.get('/', async () => {
    return { hello: 'world' }
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/'
  })

  t.assert.strictEqual(res.statusCode, 200)
  t.assert.deepStrictEqual(res.json(), { hello: 'world' })
  t.assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
})
```

### Callback Style

```typescript
// test/inject.test.js
test('inject with callback', (t, done) => {
  t.plan(3)
  const fastify = Fastify()

  fastify.get('/', (req, reply) => {
    reply.send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 200)
    t.assert.deepStrictEqual(JSON.parse(res.payload), { hello: 'world' })
    done()
  })
})
```

## Key Behaviors

- **No `.listen()` needed** — inject works before the server starts
- **Automatically calls `.ready()`** if not yet called
- Returns a response object with:
  - `statusCode` — HTTP status code
  - `headers` — response headers
  - `payload` — response body as string
  - `rawPayload` — response body as Buffer
  - `json()` — parsed JSON response

## Inject Options

```typescript
// test/inject.test.js
const res = await fastify.inject({
  method: 'POST',
  url: '/users',
  payload: { name: 'Alice' },
  headers: {
    'content-type': 'application/json',
    authorization: 'Bearer token123'
  },
  query: { include: 'profile' }
})
```

## Testing Different HTTP Methods

```typescript
// test/http-methods/get.test.js
test('GET request', async (t) => {
  const fastify = Fastify()
  fastify.get('/items', async () => [{ id: 1 }])

  const res = await fastify.inject({ method: 'GET', url: '/items' })
  t.assert.strictEqual(res.statusCode, 200)
})
```

```typescript
// test/http-methods/post.test.js
test('POST request', async (t) => {
  const fastify = Fastify()
  fastify.post('/items', async (req) => {
    return { id: 1, ...req.body }
  })

  const res = await fastify.inject({
    method: 'POST',
    url: '/items',
    payload: { name: 'new item' }
  })
  t.assert.strictEqual(res.statusCode, 200)
  t.assert.deepStrictEqual(res.json(), { id: 1, name: 'new item' })
})
```

## When to Use a Real Server

Some tests require actual network connections — HTTP/2, HTTPS, keep-alive behavior, streaming. In these cases, use `listen({ port: 0 })`:

```typescript
// test/async-await.test.js
test('real server test', async (t) => {
  const fastify = Fastify()
  fastify.get('/', async () => ({ hello: 'world' }))

  const address = await fastify.listen({ port: 0 })
  t.after(() => fastify.close())

  const result = await fetch(address)
  t.assert.strictEqual(result.status, 200)
  t.assert.deepStrictEqual(await result.json(), { hello: 'world' })
})
```

Key: `{ port: 0 }` tells the OS to pick a free port, avoiding port conflicts in parallel test runs.
