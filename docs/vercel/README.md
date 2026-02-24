# Vercel Ecosystem Testing Conventions

Analysis of testing patterns across Vercel's open-source projects: Next.js, SWR, and Vercel AI SDK.

> **Attribution**: These conventions are shaped by the Vercel team and open-source contributors. The testing infrastructure reflects a large engineering organization with hundreds of contributors across multiple projects.

## Documents

- [overview.md](./overview.md) — Philosophy and core principles
- [test-organization.md](./test-organization.md) — File structure, naming, framework configs
- [mocking-patterns.md](./mocking-patterns.md) — What mocking is used and when
- [test-harnesses.md](./test-harnesses.md) — NextInstance, SWRConfig injection, MockLanguageModel
- [test-utilities.md](./test-utilities.md) — Shared helpers, fixtures, stream utilities
- [e2e-and-integration.md](./e2e-and-integration.md) — Real Next.js apps as test fixtures, multi-mode execution
- [rust-testing.md](./rust-testing.md) — SWC/Turbopack fixture-based compiler testing
- [per-project-breakdown.md](./per-project-breakdown.md) — Detailed patterns per project
