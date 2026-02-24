# Test Helpers

Keep a single `test-utils.ts` (or `test/helpers.ts`) with reusable utilities. Only extract helpers used by 3+ test files — don't over-abstract.

## Unique IDs

Prevent collision between tests, especially with parallel execution.

```typescript
let idCounter = 0
export function createTestId(prefix = 'test') {
  return `${prefix}-${idCounter++}`
}

// Usage
const userId = createTestId('user')   // 'user-0'
const orderId = createTestId('order') // 'order-1'
```

## Render Wrappers

Wrap components with all required providers so individual tests don't repeat boilerplate.

```typescript
// React example
export function renderWithApp(ui: ReactElement, options?: { user?: User }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })

  return render(
    <QueryClientProvider client={client}>
      <AuthProvider user={options?.user ?? createTestUser()}>
        {ui}
      </AuthProvider>
    </QueryClientProvider>
  )
}

// Vue example
export function mountWithApp(component: Component, props?: Record<string, any>) {
  return mount(component, {
    props,
    global: {
      plugins: [createTestingPinia(), router],
      provide: { apiClient: mockClient }
    }
  })
}
```

## Deferred Promises

Control when async operations resolve — essential for testing loading/error states.

```typescript
export function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// Usage
const { promise, resolve } = createDeferred<User>()
const fetchUser = jest.fn().mockReturnValue(promise)
render(<Profile fetchUser={fetchUser} />)
expect(screen.getByText('Loading...')).toBeInTheDocument()

resolve({ name: 'Alice' })
await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
```

## Test Factories

Create valid test data with sensible defaults and easy overrides.

```typescript
export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: createTestId('user'),
    name: 'Test User',
    email: 'test@example.com',
    role: 'member',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}

export function createTestOrder(overrides?: Partial<Order>): Order {
  return {
    id: createTestId('order'),
    userId: createTestId('user'),
    items: [{ sku: 'ITEM-1', quantity: 1, price: 10_00 }],
    total: 10_00,
    status: 'pending',
    ...overrides,
  }
}

// Usage — only specify what matters for this test
const admin = createTestUser({ role: 'admin' })
const bigOrder = createTestOrder({ total: 999_00 })
```
