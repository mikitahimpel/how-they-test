# Svelte Testing Overview

## Philosophy

Svelte's testing approach is shaped by what it is — a **compiler**. Unlike most frameworks where you test runtime behavior, Svelte must test that source code transforms correctly into JavaScript output, that the output behaves correctly in the DOM, and that it does so across multiple rendering modes. This drives a fixture-based architecture where each test case is a self-contained directory.

## The Testing Pyramid

```
         /   E2E    \          Playwright, real browsers (Kit test apps)
        /-----------\
       / Integration \        Full SvelteKit apps, dev + build modes
      /---------------\
     /  Runtime Tests   \     Components mounted in jsdom, multi-variant
    /---------------------\
   /   Compiler Tests       \  Snapshot comparison, fixture-based
  /---------------------------\
```

Compiler tests form the base. Runtime tests verify behavior in jsdom across multiple modes. E2E tests (primarily in SvelteKit) use real browsers via Playwright.

## Test Stack

| Tool | Purpose |
|---|---|
| Vitest | Test runner for compiler/runtime/unit tests |
| Playwright | Browser tests (runtime-browser, SvelteKit E2E) |
| jsdom | DOM environment for runtime tests |
| Custom `suite()` | Test suite factory for fixture-based tests |
| Custom `assert_html_equal` | HTML comparison with normalization |
| tsd | TypeScript type testing |

## Key Conventions

1. **Fixture-based tests** — each test is a directory with `_config.js` + `main.svelte`
2. **Multi-variant execution** — runtime tests run in `dom`, `hydrate`, `ssr`, `async-ssr`
3. **Signal tests dual-mode** — run in both legacy and runes mode
4. **Snapshot updating** via env vars — `UPDATE_SNAPSHOTS=true`, `SHOULD_UPDATE_EXPECTED=true`
5. **Test filtering** via env var — `FILTER=my-test pnpm test`
6. **No heavy mocking** — direct function replacement over mock frameworks
7. **SvelteKit separates unit and E2E** — co-located `.spec.js` vs full test apps
8. **JS enabled/disabled variants** — Kit E2E tests run with and without JavaScript

## Architecture Overview

The Svelte compiler repo tests are organized by **what they test**:

- **Compiler output** — snapshot comparison of generated JS/CSS
- **Compiler errors** — expected failures with error codes and positions
- **CSS** — scoping, unused style removal, warnings
- **Runtime behavior** — DOM manipulation after mounting components
- **SSR** — server-rendered HTML output
- **Signals** — low-level reactivity primitives
- **Stores** — classic Svelte store API

Each category has its own `test.ts` entry point that uses the `suite()` factory to discover and run sample directories.
