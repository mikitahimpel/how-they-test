# Dependency Injection for Testability

The single most impactful practice: make dependencies parameters, not hardcoded imports.

## Options Objects

Pass all dependencies through a single options/config object.

```typescript
interface ServiceOptions {
  db: Database
  cache: CacheClient
  logger: Logger
}

function createUserService({ db, cache, logger }: ServiceOptions) {
  return {
    async getUser(id: string) {
      const cached = await cache.get(`user:${id}`)
      if (cached) return cached
      logger.info(`Cache miss for user ${id}`)
      const user = await db.query('SELECT * FROM users WHERE id = $1', [id])
      await cache.set(`user:${id}`, user)
      return user
    }
  }
}

// Test — all dependencies are plain mock objects
const db = { query: jest.fn().mockResolvedValue({ id: '1', name: 'Alice' }) }
const cache = { get: jest.fn().mockResolvedValue(null), set: jest.fn() }
const logger = { info: jest.fn() }
const service = createUserService({ db, cache, logger })
```

## Constructor Injection

Classic OOP pattern — pass dependencies to the constructor.

```typescript
class OrderProcessor {
  constructor(
    private gateway: PaymentGateway,
    private inventory: InventoryService,
    private mailer: EmailService
  ) {}

  async process(order: Order) {
    await this.inventory.reserve(order.items)
    const charge = await this.gateway.charge(order.total, order.paymentToken)
    await this.mailer.send(order.email, `Order confirmed: ${charge.id}`)
    return charge
  }
}

// Test
const processor = new OrderProcessor(mockGateway, mockInventory, mockMailer)
```

## Factory Functions

Return a configured instance. The factory params are the injection point.

```typescript
function buildRouter(auth: AuthMiddleware, rateLimit: RateLimitMiddleware) {
  const router = express.Router()
  router.use(rateLimit)
  router.get('/profile', auth, getProfile)
  return router
}

// Test — inject permissive middleware
const noAuth = (req, res, next) => { req.user = testUser; next() }
const noLimit = (req, res, next) => next()
const router = buildRouter(noAuth, noLimit)
```

## Framework DI

```typescript
// Angular — replace providers in TestBed
TestBed.configureTestingModule({
  providers: [{ provide: HttpClient, useClass: MockHttpClient }]
})

// Vue — provide/inject
const wrapper = mount(Component, {
  global: { provide: { apiClient: mockClient } }
})

// React — context as DI
render(
  <ApiContext.Provider value={mockClient}>
    <UserProfile />
  </ApiContext.Provider>
)
```

## The Rule

If you find yourself reaching for `jest.mock()` or `vi.mock()`, ask: "Can I pass this dependency as a parameter instead?" The answer is almost always yes — and the result is simpler tests that work with any runner.
