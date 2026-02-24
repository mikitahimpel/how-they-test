# Fastify Ecosystem

Testing conventions across Fastify, fastify-cors, fastify-sensible, fastify-autoload, and the broader plugin ecosystem.

## Key Characteristics

- **`node:test`** as the test framework (migrated from tap in v5)
- **`borp`** as the test runner (created by the Fastify team)
- **`.inject()`** as the primary HTTP testing pattern — no real server needed
- **Fresh instance per test** — no shared state between tests
- **`proxyquire`** for module-level mocking — no heavy mock frameworks
- **100% coverage** enforced in many repos via `c8 --100`
- **`t.plan(N)`** assertion counting used extensively

## Documentation

- [Overview](./overview.md) — Philosophy, test pyramid, and key principles
- [Test Organization](./test-organization.md) — Directory structure and file naming
- [The Inject Pattern](./inject-pattern.md) — Fastify's built-in HTTP testing
- [Plugin Testing](./plugin-testing.md) — Testing plugins, encapsulation, and decorators
- [Mocking Patterns](./mocking-patterns.md) — proxyquire, fake timers, and custom factories
- [Test Utilities](./test-utilities.md) — Helper functions and shared test infrastructure
- [Per-Project Breakdown](./per-project-breakdown.md) — Conventions by repository
