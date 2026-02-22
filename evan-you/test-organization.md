# Test Organization

## File Structure

All projects follow the same pattern: `__tests__/` directories co-located within each package.

### Vue 3 (vuejs/core)

```
packages/
  reactivity/
    src/
      reactive.ts
      ref.ts
      computed.ts
    __tests__/
      reactive.spec.ts
      ref.spec.ts
      computed.spec.ts
      collections/              # Subdirectory for Map/Set/WeakMap tests
        Map.spec.ts
        Set.spec.ts
  runtime-core/
    src/
    __tests__/
      component.spec.ts
      rendererComponent.spec.ts
      helpers/                  # Subdirectory for helper-specific tests
        resolveAssets.spec.ts
      components/               # Subdirectory for built-in components
        Suspense.spec.ts
  compiler-core/
    src/
    __tests__/
      parse.spec.ts
      transforms/               # Subdirectory per transform type
        transformElement.spec.ts
  compiler-sfc/
    __tests__/
      compileScript.spec.ts
      utils.ts                  # Shared test utilities (per-package)
```

### Vite (vitejs/vite)

```
packages/vite/src/node/
  __tests__/
    build.spec.ts
    config.spec.ts
    dev.spec.ts
    plugins/
      css.spec.ts
      define.spec.ts
      esbuild.spec.ts
    fixtures/                   # Test fixtures alongside tests
      cjs-ssr-dep/
      config/
    __snapshots__/              # Vitest snapshots
```

### Vitest (vitest-dev/vitest)

Exception to the pattern — uses a top-level `test/` directory because Vitest tests itself by spawning child instances:

```
test/
  core/                         # Core framework tests (177+ files)
    __mocks__/                  # Automatic module mocks
    test/
      basic.test.ts
      jest-mock.test.ts
      snapshot.test.ts
  cli/                          # CLI interaction tests
  config/                       # Configuration tests
  coverage-test/                # Coverage provider tests
  snapshots/                    # Snapshot feature tests
  test-utils/                   # Shared helpers
    index.ts                    # 646 lines of utilities
    cli.ts                      # CLI output capture
  ui/                           # Playwright UI tests
  workspaces/                   # Workspace feature tests
```

## Naming Conventions

| Convention | Used In |
|---|---|
| `*.spec.ts` | Vue 3, Vite, Vue Router, Pinia |
| `*.test.ts` | Vitest (testing itself), VitePress |
| `*.bench.ts` | Vue 3 (benchmark files) |

All projects use TypeScript for test files.

## Vitest Configuration

### Vue 3 — Three Project Suites

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        // Unit tests in Node environment
        name: 'unit',
        test: {
          environment: 'node',
          include: ['packages/*/__tests__/**/*.spec.ts'],
          exclude: ['packages/{vue,vue-compat,runtime-dom}/**'],
        },
      },
      {
        // DOM-specific tests in jsdom
        name: 'unit-jsdom',
        test: {
          environment: 'jsdom',
          include: ['packages/{vue,vue-compat,runtime-dom}/**/*.spec.ts'],
        },
      },
      {
        // E2e tests
        name: 'e2e',
        test: {
          environment: 'jsdom',
          include: ['packages/vue/__tests__/e2e/*.spec.ts'],
        },
      },
    ],
  },
})
```

### Vite — Separate Unit and E2e Configs

```
vitest.config.ts          # Unit tests
vitest.config.e2e.ts      # Playground e2e tests
```

```json
{
  "test": "pnpm test-unit && pnpm test-serve && pnpm test-build",
  "test-serve": "vitest run -c vitest.config.e2e.ts",
  "test-build": "VITE_TEST_BUILD=1 vitest run -c vitest.config.e2e.ts",
  "test-unit": "vitest run"
}
```

### Vitest — Multi-Pool Execution

Core tests run across three worker pools simultaneously:

```typescript
projects: [
  project('threads', 'red'),
  project('forks', 'green'),
  project('vmThreads', 'blue'),
]
```

## Compile-Time Feature Flags in Tests

Vue 3 defines test-specific globals:

```typescript
define: {
  __DEV__: true,
  __TEST__: true,
  __FEATURE_OPTIONS_API__: true,
  __FEATURE_SUSPENSE__: true,
  __FEATURE_PROD_DEVTOOLS__: false,
}
```

This allows tests to cover both development and production code paths.
