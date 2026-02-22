# E2E and Integration Testing

## Vite: Playground-Based E2E Testing

The most extensive e2e setup across all projects. Vite has **60+ playground projects**, each a real Vite application tested with Playwright.

### Structure

```
playground/
  hmr/                          # Hot Module Replacement tests
    __tests__/
      hmr.spec.ts
    hmr.ts
    index.html
    vite.config.js
  css/                          # CSS handling tests
    __tests__/
      css.spec.ts
      tests.ts                  # Shared test logic
      lightningcss/             # Variant test directory
        lightningcss.spec.ts
    imported.css
    linked.css
    vite.config.js
  ssr/                          # Server-Side Rendering tests
    __tests__/
      serve.ts                  # Custom server setup
      ssr.spec.ts
  assets/                       # Asset handling tests
  glob-import/                  # Import glob tests
  worker/                       # Web Worker tests
  ... 60+ more
```

### How It Works

1. **Global setup** (`vitestGlobalSetup.ts`):
   - Launches a shared Playwright browser server
   - Copies `playground/` to `playground-temp/` so tests can mutate files for HMR testing without affecting source

2. **Per-file setup** (`vitestSetup.ts`):
   - Connects to shared browser
   - Starts a Vite dev server OR runs build + preview server
   - Navigates browser page to the test URL
   - Collects browser logs and errors

3. **Test execution**:
   ```typescript
   import { page, editFile, getColor, untilBrowserLogAfter } from '~utils'

   test('css is applied', async () => {
     expect(await getColor('.foo')).toBe('red')
   })

   test('hmr updates css', async () => {
     await untilBrowserLogAfter(
       () => editFile('style.css', s => s.replace('red', 'blue')),
       '[vite] css hot updated'
     )
     expect(await getColor('.foo')).toBe('blue')
   })
   ```

### Dual-Mode Execution

Every e2e test runs twice — once in dev mode, once in build mode:

```json
{
  "test-serve": "vitest run -c vitest.config.e2e.ts",
  "test-build": "VITE_TEST_BUILD=1 vitest run -c vitest.config.e2e.ts"
}
```

The `VITE_TEST_BUILD` environment variable controls whether the playground runs as a dev server or as a built + previewed application. Same tests, different execution mode.

### Variant Testing

A single playground can have multiple test variants sharing the same source but different configs:

```typescript
// playground/css/__tests__/tests.ts — shared test function
export function tests(isLightningCSS: boolean) {
  test('postcss config', async () => {
    expect(await getColor('.postcss')).toBe(isLightningCSS ? 'blue' : 'red')
  })
}

// playground/css/__tests__/css.spec.ts
import { tests } from './tests'
tests(false)  // default PostCSS

// playground/css/__tests__/lightningcss/lightningcss.spec.ts
import { tests } from '../tests'
tests(true)   // LightningCSS variant
```

### Custom Server Setup

SSR tests use custom `serve.ts` files for Express or custom HTTP servers:

```
playground/ssr/__tests__/
  serve.ts          # Custom Express server with SSR middleware
  ssr.spec.ts       # Tests that run against the custom server
```

## Vue 3: E2E Tests

Vue 3's e2e tests are lighter — they run in jsdom with test isolation:

```typescript
// vitest project config
{
  name: 'e2e',
  test: {
    environment: 'jsdom',
    isolate: true,
    include: ['packages/vue/__tests__/e2e/*.spec.ts'],
  }
}
```

Puppeteer is available (`puppeteer: ~24.37.2`) for browser-level e2e tests but jsdom handles most cases.

## Vitest: Self-Testing Integration

Vitest tests itself by spawning child Vitest instances:

```typescript
// Programmatic — starts Vitest in-process
const { testTree, exitCode } = await runVitest({
  root: '/path/to/fixture',
  config: { /* ... */ },
})

expect(exitCode).toBe(0)
expect(testTree()).toMatchInlineSnapshot(`
  ✓ basic.test.ts > passes
  ✗ basic.test.ts > fails
`)
```

```typescript
// CLI — runs Vitest as subprocess
const { stdout, stderr, exitCode } = await runVitestCli(
  '--reporter=json',
  '--run',
  'test/fixture.test.ts'
)
expect(JSON.parse(stdout).numPassedTests).toBe(3)
```

### Inline Project Testing

The most powerful pattern — creates entire projects on the fly:

```typescript
const { testTree, exitCode } = await runInlineTests({
  'vitest.config.ts': `
    import { defineConfig } from 'vitest/config'
    export default defineConfig({
      test: { environment: 'jsdom' }
    })
  `,
  'src/utils.ts': `
    export function add(a: number, b: number) { return a + b }
  `,
  'test/utils.test.ts': `
    import { add } from '../src/utils'
    import { expect, test } from 'vitest'
    test('add', () => expect(add(1, 2)).toBe(3))
  `,
})

expect(exitCode).toBe(0)
```

The `useFS()` utility creates files on disk and cleans them up via `onTestFinished`.

## VitePress: Three-Tier Testing

```
__tests__/
  unit/                         # Pure function tests
    client/theme-default/
      composables/outline.test.ts
      support/sidebar.test.ts
    node/
      markdown/plugins/snippet.test.ts
      postcss/isolateStyles.test.ts
  e2e/                          # Full-site tests
    .vitepress/config.ts        # Test VitePress config
    .vitepress/theme/           # Custom theme for testing
    data-loading/
    dynamic-routes/
    vitestGlobalSetup.ts        # Starts VitePress dev server
    vitestSetup.ts              # Browser setup
  init/                         # CLI scaffolding tests
    init.test.ts
```

## Vitest Ecosystem CI

A separate repository (`vitest-ecosystem-ci`) runs Vitest changes against real-world frameworks:

- Nuxt
- SvelteKit
- Astro
- Other major frameworks

This catches regressions in real-world usage that unit/integration tests might miss.

## Key Patterns Across All E2E Tests

| Pattern | Description |
|---|---|
| **Real applications** | E2e tests use real project setups, not synthetic mocks |
| **File mutation for HMR** | `editFile()` modifies source to trigger hot updates |
| **Browser log assertion** | `untilBrowserLogAfter()` waits for HMR confirmation logs |
| **Dual-mode execution** | Same tests run in both dev and build mode |
| **Temp directory copies** | Source files copied to temp dir to allow safe mutation |
| **Per-test cleanup** | `onTestFinished()` hooks for automatic resource cleanup |
| **Shared browser** | Single Playwright instance shared across all e2e tests |
| **Custom server support** | `serve.ts` files for SSR or custom HTTP servers |
