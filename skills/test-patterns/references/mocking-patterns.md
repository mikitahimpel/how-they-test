# Mocking Patterns

## Interface-Based Mocks (No Framework Needed)

When a dependency has a clear interface, create a mock class implementing it. Works with any test runner.

```typescript
// Your app's interface
interface PaymentGateway {
  charge(amount: number, token: string): Promise<{ id: string; status: string }>
  refund(chargeId: string): Promise<void>
}

// Test mock — implements the same interface
class MockPaymentGateway implements PaymentGateway {
  charges: Array<{ amount: number; token: string }> = []
  shouldFail = false

  async charge(amount: number, token: string) {
    if (this.shouldFail) throw new Error('Payment failed')
    this.charges.push({ amount, token })
    return { id: `ch_${this.charges.length}`, status: 'succeeded' }
  }

  async refund(chargeId: string) { /* no-op */ }
}

// Test
const gateway = new MockPaymentGateway()
const checkout = new CheckoutService(gateway)  // inject via constructor
await checkout.process(cart)
expect(gateway.charges).toHaveLength(1)
expect(gateway.charges[0].amount).toBe(99_00)
```

## HTTP Mocking with MSW

Mock at the network boundary — tests don't know or care how your code makes requests. Works with fetch, axios, got, or any HTTP client. Compatible with all runners.

```typescript
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json([{ id: 1, name: 'Alice' }])
  }),
  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 2, ...body }, { status: 201 })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Override for a specific test
it('shows error on server failure', async () => {
  server.use(http.get('/api/users', () => HttpResponse.json(null, { status: 500 })))
  render(<UserList />)
  await screen.findByText('Failed to load users')
})
```

## Request Injection (No Real Server)

Test API routes without starting a server. Faster, no port conflicts.

```typescript
// Fastify
const app = buildApp()
const res = await app.inject({ method: 'GET', url: '/api/health' })
expect(res.statusCode).toBe(200)

// Express (with supertest)
import request from 'supertest'
const res = await request(app).get('/api/health').expect(200)

// Next.js API routes (direct function call)
const req = new Request('http://localhost/api/users', { method: 'GET' })
const res = await GET(req)
expect(res.status).toBe(200)
```

## Console Spying

Capture warnings and errors. Fail on unexpected ones to catch silent bugs.

```typescript
let warnSpy: ReturnType<typeof jest.spyOn>

beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  // also: jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  // Unexpected warnings = potential bugs
  if (warnSpy.mock.calls.length > 0) {
    throw new Error(`Unexpected warnings:\n${warnSpy.mock.calls.map(c => c[0]).join('\n')}`)
  }
  warnSpy.mockRestore()
})

// When a warning IS expected
it('warns on deprecated prop', () => {
  render(<Button type="danger" />)
  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('deprecated'))
  warnSpy.mockClear() // clear so afterEach doesn't fail
})
```

Note for node:test: use `mock.method(console, 'warn', () => {})`. For bun:test: use `jest.spyOn()` (Jest-compatible).
