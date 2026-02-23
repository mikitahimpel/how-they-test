# TanStack Testing Conventions

Analysis of testing patterns across TanStack projects: Query, Router, Table, Form, and Virtual.

> **Attribution**: These conventions are shaped by the core team and contributors of each TanStack project. Tanner Linsley, as project lead, drives the core/adapter architecture that makes much of the testing approach possible, but the patterns reflect collaborative work across many contributors.

## Documents

- [overview.md](./overview.md) — Philosophy and core principles
- [test-organization.md](./test-organization.md) — File structure, naming, vitest configs
- [core-adapter-split.md](./core-adapter-split.md) — Framework-agnostic core vs framework adapters
- [mocking-patterns.md](./mocking-patterns.md) — What mocking is used and when
- [dependency-injection.md](./dependency-injection.md) — How DI replaces mocking
- [test-utilities.md](./test-utilities.md) — Shared helpers, render wrappers, test data
- [async-testing.md](./async-testing.md) — Fake timers, waitFor, async patterns
- [type-testing.md](./type-testing.md) — Compile-time type tests with expectTypeOf
- [per-project-breakdown.md](./per-project-breakdown.md) — Detailed patterns per project
