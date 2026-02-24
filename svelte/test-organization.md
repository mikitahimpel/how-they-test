# Test Organization

## sveltejs/svelte (Compiler + Runtime)

The Svelte repo is a pnpm monorepo. All tests live in a centralized `tests/` directory inside the core package — not co-located with source.

```
packages/svelte/tests/
  compiler-errors/       # Tests that expect compilation to fail
  css/                   # CSS scoping and output tests
  css-parse.test.ts      # Standalone CSS parser test
  hydration/             # Hydration-specific runtime tests
  migrate/               # Svelte 4→5 migration tool tests
  motion/                # Transition/animation tests
  parser-legacy/         # Legacy parser tests
  parser-modern/         # Modern parser tests
  preprocess/            # Preprocessor tests
  print/                 # AST printer tests
  runtime-browser/       # Browser-specific runtime tests (Playwright)
  runtime-legacy/        # Legacy (non-runes) runtime tests
  runtime-production/    # Production-mode runtime tests
  runtime-runes/         # Runes-mode runtime tests
  runtime-xhtml/         # XHTML-mode runtime tests
  server-side-rendering/ # SSR output tests
  signals/               # Low-level reactivity signals tests
  snapshot/              # Compiler output snapshot tests
  sourcemaps/            # Source map tests
  store/                 # Svelte store tests
  types/                 # Type checking tests
  validator/             # Validation/warning tests
```

### Fixture-Based Test Structure

Each test category contains a `test.ts` runner and `samples/` directories. Each sample is a self-contained test case:

```
packages/svelte/tests/runtime-runes/
  test.ts                      # Test runner entry point
  samples/
    accessors-props/
      _config.js               # Test configuration + assertions
      main.svelte              # Component under test
    action-state-arg/
      _config.js
      main.svelte
      Task.svelte              # Additional components if needed
    binding-input/
      _config.js
      main.svelte
```

The `_config.js` file defines the test — expected HTML, assertions, compile options:

```javascript
// runtime-runes/samples/accessors-props/_config.js
import { test } from '../../test';
import { flushSync } from 'svelte';

export default test({
  html: '<p>0</p>',

  async test({ assert, target, instance }) {
    flushSync(() => {
      instance.count++;
    });
    assert.equal(target.querySelector('p').innerHTML, '1');
  }
});
```

### Vitest Configuration

```javascript
// vitest.config.js
export default defineConfig({
  test: {
    dir: '.',
    reporters: ['dot'],
    include: [
      'packages/svelte/**/*.test.ts',
      'packages/svelte/tests/*/test.ts',
      'packages/svelte/tests/runtime-browser/test-ssr.ts'
    ],
    exclude: [...configDefaults.exclude, '**/samples/**']
  }
});
```

Key: `**/samples/**` is excluded because samples are loaded dynamically by the `test.ts` runners, not discovered by Vitest directly.

## sveltejs/kit (SvelteKit)

Kit uses a dual testing strategy.

### Unit Tests — Co-located `.spec.js`

```
packages/kit/src/
  runtime/server/cookie.spec.js
  runtime/server/page/csp.spec.js
  runtime/server/page/load_data.spec.js
  core/config/index.spec.js
  core/sync/create_manifest_data/index.spec.js
  exports/hooks/sequence.spec.js
  utils/css.spec.js
  utils/escape.spec.js
```

### E2E Tests — Full SvelteKit Apps

Each test app is a complete SvelteKit project:

```
packages/kit/test/apps/
  basics/                # Main integration test app
  amp/                   # AMP-specific tests
  async/                 # Async behavior tests
  dev-only/              # Dev-mode-only tests
  embed/                 # Embedded app tests
  hash-based-routing/    # Hash routing tests
  no-ssr/                # SSR-disabled tests
  options/               # Configuration options tests
  writes/                # File-writing tests
```

Each app contains:

```
test/apps/basics/
  package.json
  playwright.config.js
  svelte.config.js
  vite.config.js
  src/
    app.html
    routes/
  test/
    test.js              # Client + server Playwright tests
    client.test.js       # Client-only tests
    server.test.js       # Server-only tests
    setup.js             # Test setup
```

### Kit Vitest Config

Kit uses a custom-named config to prevent test subprojects from picking it up:

```javascript
// kit.vitest.config.js
export default defineConfig({
  test: {
    alias: {
      '__sveltekit/paths': fileURLToPath(
        new URL('./test/mocks/path.js', import.meta.url)
      )
    },
    pool: 'threads',
    maxWorkers: 1,
    include: ['src/**/*.spec.js']
  }
});
```
