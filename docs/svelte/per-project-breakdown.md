# Per-Project Breakdown

## sveltejs/svelte (Compiler + Runtime)

| Aspect | Detail |
|---|---|
| Framework | Vitest + Playwright |
| Test style | Fixture-based (samples/ with _config.js) |
| DOM env | jsdom for runtime, Playwright for browser |
| Coverage | v8 via Vitest |
| Key pattern | `suite()` factory, multi-variant execution |
| Mocking | Direct function replacement, RAF interception |

### Test Commands

```bash
pnpm test                           # All tests
FILTER=my-test pnpm test            # Filter by name
UPDATE_SNAPSHOTS=true pnpm test     # Update compiler snapshots
SHOULD_UPDATE_EXPECTED=true pnpm test  # Update expected output
```

### Test Categories and Counts

| Category | Focus |
|---|---|
| `runtime-runes/` | Runes-mode reactivity |
| `runtime-legacy/` | Pre-runes reactive declarations |
| `runtime-production/` | Production mode (no dev warnings) |
| `runtime-browser/` | Real browser features (Playwright) |
| `runtime-xhtml/` | XHTML namespace handling |
| `snapshot/` | Compiler output comparison |
| `compiler-errors/` | Expected compilation failures |
| `css/` | CSS scoping and output |
| `hydration/` | Server-to-client hydration |
| `server-side-rendering/` | SSR output |
| `signals/` | Low-level reactivity primitives |
| `store/` | Svelte store API |
| `parser-modern/` | Modern parser AST output |
| `parser-legacy/` | Legacy parser AST output |
| `validator/` | Compiler warnings |
| `sourcemaps/` | Source map correctness |
| `migrate/` | Svelte 4→5 migration tool |

## sveltejs/kit (SvelteKit)

| Aspect | Detail |
|---|---|
| Unit framework | Vitest |
| E2E framework | Playwright |
| Unit style | Co-located `.spec.js` |
| E2E style | Full SvelteKit test apps |
| Key pattern | Extended Playwright fixtures, JS on/off variants |

### Test Commands

```bash
pnpm test:unit:dev                  # Unit tests (dev mode)
pnpm test:unit:prod                 # Unit tests (production mode)
pnpm test:integration               # E2E with Playwright
pnpm test:cross-platform:dev        # Cross-platform dev mode
pnpm test:cross-platform:build      # Cross-platform build mode
```

### E2E Test Apps

| App | Focus |
|---|---|
| `basics/` | Core functionality (routing, load, SSR, forms) |
| `amp/` | AMP output |
| `async/` | Async behavior |
| `dev-only/` | Dev-mode features |
| `embed/` | Embedded app scenarios |
| `hash-based-routing/` | Hash-based routing |
| `no-ssr/` | SSR-disabled mode |
| `options/` | Configuration variations |
| `writes/` | File-writing operations |

### Playwright Projects

Each test app runs in 2 variants per browser:

| Project | JavaScript | Purpose |
|---|---|---|
| `chromium-build` | Enabled | Standard client-side testing |
| `chromium-build-no-js` | Disabled | SSR-only / progressive enhancement |

## Adapter Testing

Each platform adapter has its own test apps:

```
packages/adapter-cloudflare/test/apps/
  pages/               # Cloudflare Pages
  workers/             # Cloudflare Workers

packages/adapter-netlify/test/apps/
  basic/               # Standard Netlify
  edge/                # Netlify Edge Functions
```

Adapter tests use Playwright against the deployed adapter output.

## Common Conventions Across Both Repos

1. **Vitest** is the unit test framework everywhere
2. **Playwright** handles all browser/E2E testing
3. **No heavy mocking frameworks** — Svelte uses direct replacement, Kit uses `vi.mock()`
4. **Environment-conditional tests** — dev vs production mode
5. **Snapshot/expected output updating** via env vars
6. **Multi-variant execution** — runtime modes, JS enabled/disabled
7. **Custom HTML normalization** for deterministic comparison
8. **Fixture-based architecture** — self-contained test directories
