# React Ecosystem

Testing conventions across the React framework — core reconciler, DOM renderer, hooks, concurrent features, and DevTools.

## Key Characteristics

- **Jest 29** with a custom CLI runner (`jest-cli` in the monorepo)
- **Module re-requiring** — each test freshly requires React to avoid shared state
- **ReactNoop renderer** — a headless test renderer for reconciler logic
- **Custom `@gate` pragma** — feature-flag-aware test filtering
- **`internal-test-utils`** package — `act()`, `waitFor*`, `assertConsoleErrorDev`
- **Scheduler mock** — deterministic concurrent scheduling in tests

## Documents

- [Overview](./overview.md) — Philosophy, tools, and high-level patterns
- [Test Organization](./test-organization.md) — File structure, naming, and test commands
- [Module Re-requiring](./module-re-requiring.md) — How React isolates tests via fresh imports
- [ReactNoop Renderer](./react-noop-renderer.md) — The headless test renderer for reconciler testing
- [Mocking Patterns](./mocking-patterns.md) — Scheduler mock, console interception, feature gates
- [Test Utilities](./test-utilities.md) — internal-test-utils, act(), waitFor, assertLog
- [Per-Project Breakdown](./per-project-breakdown.md) — Package-by-package testing details
