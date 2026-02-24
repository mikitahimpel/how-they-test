# Svelte Ecosystem

Testing conventions across the Svelte compiler/runtime and SvelteKit.

## Key Characteristics

- **Fixture-based architecture** — each test is a directory with `_config.js` + `main.svelte`
- **Custom suite factories** — `suite()` and `suite_with_variants()` dynamically discover and run tests
- **Multi-variant execution** — runtime tests run in `dom`, `hydrate`, `ssr`, and `async-ssr` modes
- **Vitest** for unit tests, **Playwright** for browser and E2E tests
- **Snapshot comparison** for compiler output — expected vs actual generated code
- **No heavy mocking** — direct function replacement, RAF interception, console capture
- **SvelteKit tests use full apps** — real SvelteKit projects as integration test fixtures

## Documentation

- [Overview](./overview.md) — Philosophy, test architecture, and key principles
- [Test Organization](./test-organization.md) — Directory structure and fixture layout
- [Compiler Testing](./compiler-testing.md) — Snapshots, error tests, CSS scoping, SSR output
- [Runtime Testing](./runtime-testing.md) — Component mounting, reactivity, signals, stores
- [SvelteKit Testing](./sveltekit-testing.md) — Unit specs, E2E with Playwright, test apps
- [Test Utilities](./test-utilities.md) — Suite factories, HTML comparison, animation helpers
- [Per-Project Breakdown](./per-project-breakdown.md) — Conventions by repository
