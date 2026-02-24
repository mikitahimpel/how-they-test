---
name: test-patterns
description: Testing best practices and patterns extracted from 7 major open-source ecosystems. Use when writing tests, reviewing test code, choosing mocking strategies, setting up test infrastructure, or asking "how should I test this?". Triggers on tasks involving unit tests, integration tests, mocking, dependency injection, async testing, or test organization.
argument-hint: "<file-or-pattern-to-test>"
metadata:
  author: how-they-test
  version: "1.0.0"
---

# How They Test — Best Practices for Application Testing

Patterns distilled from 47,000+ test cases across major open-source projects.

**First**: Detect the project's test runner from `package.json` — look for `vitest`, `jest`, `@jest/globals`, or check for `bun:test` / `node:test` usage. See `references/runner-apis.md` for the API translation table.

## Principles

### 1. Make Dependencies Injectable

Pass dependencies as parameters, not imports. See `references/dependency-injection.md`.

```typescript
// AVOID — fragile module mocking
jest.mock('./emailService', () => ({ send: jest.fn() }))

// PREFER — dependency is a parameter, testable with any runner
function createAuthService(email: EmailService, db: Database) {
  return {
    async signUp(user: NewUser) {
      await db.insert('users', user)
      await email.send(user.email, 'Welcome!')
    }
  }
}

const email = { send: jest.fn() }
const db = { insert: jest.fn().mockResolvedValue({ id: 1 }) }
const auth = createAuthService(email, db)
```

### 2. Prefer Mock Functions Over Module Mocking

Use `jest.fn()` / `vi.fn()` for callbacks and injected deps. Use `spyOn` for browser/global APIs. Reserve module mocking (`jest.mock`) as absolute last resort. See `references/mocking-patterns.md`.

### 3. Isolate Every Test

Fresh instances per test. Never share mutable state. Always restore mocks and timers in `afterEach`. This is the #1 fix for flaky suites.

### 4. Test at the Right Level

- **Pure logic** (validators, formatters, state machines) → unit test, no DOM
- **Components** (rendering, interaction) → integration with Testing Library
- **User journeys** (sign up, checkout) → E2E with Playwright
- **API routes** → request injection (supertest, `.inject()`) — no real server

### 5. Handle Async Correctly

Never `sleep()`. Use retry assertions (`waitFor`, `findBy*`). Use fake timers for time-dependent code — always async variant, always restore. See `references/async-patterns.md`.

### 6. Fail on Unexpected Warnings

Spy on `console.warn`/`console.error`, fail if they fire without being explicitly expected. See `references/mocking-patterns.md`.

### 7. Build Small Test Helpers

One `test-utils.ts` file with: render wrappers (providers), unique ID generators, deferred promises. Don't build a framework. See `references/test-helpers.md`.

## Reference Files

- `references/runner-apis.md` — API translation table across Vitest, Jest, node:test, bun:test
- `references/dependency-injection.md` — Injectable patterns: options objects, constructors, factories, framework DI
- `references/mocking-patterns.md` — Interface mocks, MSW, request injection, console spies
- `references/async-patterns.md` — Polling/retry, controlled promises, streams, fake timers
- `references/test-organization.md` — File structure, naming, multi-environment testing
- `references/test-helpers.md` — Reusable utilities: render wrappers, deferred promises, test IDs
- `references/advanced-patterns.md` — Type-level testing, assertion counting, fixtures, E2E harnesses
