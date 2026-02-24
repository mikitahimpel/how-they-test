# Overview: Vue Ecosystem Testing Philosophy

## Core Principles

### 1. Architecture Over Mocking

The single most defining trait: code is designed to be testable through its API surface, not forced into testability through module mocking. Dependencies are parameters, not hardcoded imports.

### 2. Real Instances, Controlled Inputs

Tests use real implementations wherever possible. Instead of mocking a server, create a real server in middleware mode. Instead of mocking a build pipeline, run a real build with `write: false`. Instead of mocking the DOM, use a lightweight custom runtime.

### 3. Minimal Test Infrastructure

No DI containers, no decorators, no complex test frameworks beyond Vitest. Test utilities are small, focused, and project-specific. The architecture itself provides the "injection" mechanism.

### 4. Vitest Everywhere

Every project uses Vitest exclusively. No Jest, no Mocha, no custom runners. Vitest itself dogfoods by running sub-instances of itself.

### 5. Tests Live Next to Code

Co-located `__tests__/` directories within each package. No top-level `tests/` or `spec/` directories for unit tests.

## Anti-Patterns (Things He Avoids)

- `vi.mock()` / `jest.mock()` for import-level module mocking (extremely rare)
- Heavy mocking libraries (no `sinon`, no `proxyquire`, no `rewire`)
- Mocking the file system (virtual plugins instead)
- Mocking the DOM for non-DOM tests (custom runtime instead)
- Centralized test utility libraries (helpers are local to packages)
- Over-abstracted test factories or builders

## The Testing Pyramid

```
         /  E2E  \          Playwright, real browsers, playground projects
        /----------\
       / Integration \      Real instances, controlled config, sub-processes
      /----------------\
     /    Unit Tests     \  Direct imports, vi.fn() for spies, no mocks
    /----------------------\
```

Unit tests dominate. Integration tests use real instances. E2e tests are playground-based real applications.
