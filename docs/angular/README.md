# Angular Ecosystem

Testing conventions across the Angular framework — core, compiler, router, forms, HTTP, CDK, and Angular Material.

## Key Characteristics

- **Jasmine + Karma** as the primary test framework (migrating toward Vitest)
- **Bazel** build system orchestrating thousands of tests
- **TestBed** as the universal testing API for dependency injection and component setup
- **Co-located `test/` directories** with `_spec.ts` naming convention
- **Component Harness** pattern for reusable, implementation-agnostic component testing
- **Integration test apps** for end-to-end framework validation

## Documents

- [Overview](./overview.md) — Philosophy, tools, and high-level patterns
- [Test Organization](./test-organization.md) — File structure, naming, and Bazel integration
- [TestBed Patterns](./testbed-patterns.md) — The TestBed API and DI-based testing
- [Component Testing](./component-testing.md) — Component Harness, fixture patterns, and DOM testing
- [Mocking Patterns](./mocking-patterns.md) — Jasmine spies, providers, and HTTP mocking
- [Test Utilities](./test-utilities.md) — Custom helpers across the Angular monorepo
- [Per-Project Breakdown](./per-project-breakdown.md) — Package-by-package testing details
