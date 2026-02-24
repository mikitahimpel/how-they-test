# Fastify Testing Overview

## Philosophy

Fastify's testing approach is defined by two principles: **inject over listen** and **no mocking frameworks**. The `.inject()` method — powered by `light-my-request` — lets you simulate HTTP requests without binding to a network port. Combined with fresh instances per test and Node.js's built-in test runner, this creates fast, isolated, deterministic tests.

## The Testing Pyramid

```
         /    E2E     \          Real HTTP with listen({ port: 0 })
        /--------------\
       /  Plugin Tests   \      .inject() with registered plugins
      /--------------------\
     /     Unit Tests        \  .inject() on fresh Fastify instances
    /--------------------------\
```

Unit tests dominate. Plugin tests verify encapsulation and decorator behavior. E2E tests are rare — only used when connection-level behavior matters (HTTP/2, HTTPS, keep-alive).

## Test Stack

| Tool | Purpose |
|---|---|
| `node:test` | Test framework (built-in) |
| `borp` | Test runner with coverage support |
| `c8` | Coverage reporting (100% enforced) |
| `proxyquire` | Module-level dependency replacement |
| `@sinonjs/fake-timers` | Timer mocking (only sinon component used) |
| `tsd` | TypeScript type testing |

## Key Conventions

1. **`'use strict'`** at the top of every test file
2. **`t.plan(N)`** for assertion counting — ensures all expected assertions run
3. **`t.after(() => fastify.close())`** for cleanup
4. **Fresh `Fastify()` per test** — no shared state between tests
5. **`.inject()` over `.listen()`** — avoid real servers unless testing connection behavior
6. **`{ port: 0 }`** when a real server is needed — OS picks a free port
7. **No sinon, no jest mocks** — only `proxyquire` for module substitution

## Evolution

Fastify historically used **tap** as its test framework. During the v5 development cycle, the team migrated to `node:test` — the built-in Node.js test runner. The **borp** test runner was created by Fastify team members as a minimal wrapper that runs `node:test` files with coverage support.

This migration reflects Fastify's broader philosophy: prefer built-in platform capabilities over third-party dependencies.
