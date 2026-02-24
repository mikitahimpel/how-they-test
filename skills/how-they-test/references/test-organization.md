# Test Organization

## File Structure

**Co-located** — tests live next to source. Best for libraries and component-heavy projects.

```
src/
  components/
    Button.tsx
    Button.test.tsx
  utils/
    format.ts
    format.test.ts
```

**Separate directory** — tests mirror source structure. Best for apps with complex test setup or mixed test types.

```
src/
  routes/
    users.ts
  services/
    auth.ts
test/
  routes/
    users.test.ts
  services/
    auth.test.ts
  helpers/
    test-utils.ts
```

Choose one pattern and be consistent. Either works — the key is that every source file's test is predictably locatable.

## Naming Conventions

Follow your runner's defaults and your team's existing convention:

| Pattern | Typical usage |
|---|---|
| `*.test.ts` | Most common default (Jest, Vitest, bun:test, node:test) |
| `*.spec.ts` | Common in Angular and Vue projects |
| `*.e2e.ts` | End-to-end tests, typically run separately |
| `*.test-d.ts` | Type-level tests (compile-time only) |

## Test Helpers File

Keep a single `test-utils.ts` (or `test/helpers.ts`) with shared utilities. Don't over-abstract — only extract helpers used by 3+ test files.

```typescript
// test-utils.ts
export function createTestUser(overrides?: Partial<User>): User {
  return { id: createTestId(), name: 'Test User', email: 'test@example.com', ...overrides }
}

export function renderWithApp(ui: ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>)
}
```

## Multi-Environment Testing

Run the same tests against different configurations to catch environment-specific bugs.

```typescript
// describe.each works in Jest, Vitest, and bun:test
describe.each([
  { env: 'development' },
  { env: 'production' },
])('$env', ({ env }) => {
  beforeAll(() => { process.env.NODE_ENV = env })
  it('renders without errors', () => { /* same assertion */ })
})

// For node:test — use a loop
for (const env of ['development', 'production']) {
  describe(`${env}`, () => {
    it('renders without errors', () => { /* same assertion */ })
  })
}
```

Practical examples of what to vary:
- Dev vs production builds (different error handling, logging)
- SSR vs client rendering
- Different API versions or feature flags
- With/without JavaScript (for SSR apps)
