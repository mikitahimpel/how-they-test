# Vue Ecosystem Testing Conventions

Analysis of testing patterns across projects in the Vue ecosystem: Vue 3, Vite, Vitest, Vue Router, Pinia, and VitePress.

> **Attribution**: These conventions are shaped by the core teams and contributors of each project, not any single individual. Evan You, as project lead, influences architectural decisions that affect testability, but the testing patterns reflect collaborative work across many contributors.

## Documents

- [overview.md](./overview.md) — High-level philosophy and principles
- [test-organization.md](./test-organization.md) — File structure, naming, project layout
- [no-import-mocks.md](./no-import-mocks.md) — Why and how import mocking is avoided
- [architectural-di.md](./architectural-di.md) — Dependency injection through API design
- [mocking-patterns.md](./mocking-patterns.md) — What mocking IS used and when
- [test-utilities.md](./test-utilities.md) — Shared helpers, custom matchers, setup files
- [testing-by-subsystem.md](./testing-by-subsystem.md) — How each type of code is tested
- [e2e-and-integration.md](./e2e-and-integration.md) — Playground-based e2e, Playwright, multi-mode testing
- [per-project-breakdown.md](./per-project-breakdown.md) — Detailed patterns per project
