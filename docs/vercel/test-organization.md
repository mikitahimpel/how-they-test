# Test Organization

## Three Different Conventions

Each Vercel project uses a different test organization strategy, reflecting different team sizes and project needs.

### Next.js: Separate `test/` Directory with Category Subdirs

```
test/
  unit/                    # Pure unit tests (no server)
    babel-plugin-next.test.ts
    image-optimizer.test.ts
    url-parsing.test.ts
  integration/             # Build + serve a real Next.js app, test via HTTP
    app-dir-export/
      app-dir-export.test.ts
      app/
      next.config.js
    dynamic-routing/
      dynamic-routing.test.ts
      pages/
  e2e/                     # Full lifecycle with browser, runs in all modes
    app-dir/
      actions/
        app-action.test.ts
        app/
        middleware.js
        next.config.js
      app-external/
        app-external.test.ts
        app/
  development/             # Dev-mode only (HMR, error overlay)
    acceptance/
      ReactRefresh.test.ts
  production/              # Production-build only (caching, optimization)
    standalone-mode/
  lib/                     # Shared test infrastructure
    e2e-utils/
    next-modes/
    next-test-utils.ts
    next-webdriver.ts
```

Each e2e/integration test is **self-contained** — the test file sits alongside a complete Next.js application:

```
test/e2e/app-dir/actions/
  app-action.test.ts          # Test file
  app/                        # Real Next.js app directory
    layout.tsx
    page.tsx
    actions.ts
  next.config.js              # Real config
  middleware.js               # Real middleware
```

### SWR: Separate `test/` Directory, Flat by Feature

```
test/
  jest-setup.ts
  utils.tsx                           # Shared helpers
  use-swr-revalidate.test.tsx         # By feature
  use-swr-cache.test.tsx
  use-swr-infinite.test.tsx
  use-swr-local-mutation.test.tsx
  use-swr-focus.test.tsx
  use-swr-middlewares.test.tsx
  use-swr-suspense.test.tsx
  use-swr-error.test.tsx
  use-swr-integration.test.tsx
  ... (30+ files)
  unit/                               # Pure unit tests
    serialize.test.ts
    utils.test.tsx
    web-preset.test.ts
  type/                               # TypeScript compilation tests
e2e/
  site/                               # Real Next.js app for Playwright
  test/
    initial-render.test.ts
    suspense-scenarios.test.ts
    stream-ssr.test.ts
    perf.test.ts
```

### AI SDK: Co-located with Source

```
packages/ai/src/
  generate-text/
    generate-text.ts
    generate-text.test.ts             # Co-located
    generate-text.test-d.ts           # Type test
    stream-text.ts
    stream-text.test.ts
  agent/
    tool-loop-agent.ts
    tool-loop-agent.test.ts
    tool-loop-agent.test-d.ts
  test/                               # Mock implementations
    mock-language-model-v3.ts
    mock-embedding-model-v3.ts
    mock-provider-v3.ts

packages/openai/src/
  chat/
    openai-chat-language-model.ts
    openai-chat-language-model.test.ts
    __fixtures__/                     # API response fixtures
      openai-text.json
      openai-text.chunks.txt
```

## Test Framework Choices

| Project | Unit/Integration | E2E | Why |
|---|---|---|---|
| Next.js | Jest | Playwright (via wrapper) | Historical — large Jest investment, custom runner |
| SWR | Jest 30 | Playwright | Matches Next.js conventions |
| AI SDK | Vitest | Playwright | Newer project, chose modern tooling |

## Environment Configs

### Next.js: Mode via Environment Variables

```json
{
  "test-unit": "jest test/unit/ packages/next/ packages/font",
  "test-dev-inner": "cross-env NEXT_TEST_MODE=dev pnpm testheadless",
  "test-start-inner": "cross-env NEXT_TEST_MODE=start pnpm testheadless",
  "test-deploy-inner": "cross-env NEXT_TEST_MODE=deploy pnpm testheadless"
}
```

The test directory itself determines the mode:
```typescript
if (testFile.startsWith('test/development')) testMode = 'dev'
if (testFile.startsWith('test/production')) testMode = 'start'
```

### AI SDK: Dual Vitest Configs

```javascript
// vitest.node.config.js
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts{,x}'],
    exclude: ['**/*.ui.test.ts{,x}', '**/*.e2e.test.ts{,x}'],
  },
})

// vitest.edge.config.js
export default defineConfig({
  test: {
    environment: 'edge-runtime',
    include: ['**/*.test.ts{,x}'],
    exclude: ['**/*.ui.test.ts{,x}', '**/*.e2e.test.ts{,x}'],
  },
})
```

Every test runs twice — Node.js and edge-runtime.

### SWR: Module Name Mapping

```javascript
// jest.config.js
moduleNameMapper: {
  '^swr$': '<rootDir>/src/index/index.ts',
  '^swr/infinite$': '<rootDir>/src/infinite/index.ts',
  '^swr/immutable$': '<rootDir>/src/immutable/index.ts',
  '^swr/subscription$': '<rootDir>/src/subscription/index.ts',
  '^swr/mutation$': '<rootDir>/src/mutation/index.ts',
  '^swr/_internal$': '<rootDir>/src/_internal/index.ts',
}
```

Tests import from `swr` and `swr/*` as if they were published packages, but Jest maps them to source code.

## File Naming

| Convention | Used In |
|---|---|
| `*.test.ts` / `*.test.tsx` | All projects |
| `*.test-d.ts` | AI SDK (type tests) |
| `*.ui.test.ts` | AI SDK (UI-specific tests) |
| `*.e2e.test.ts` | AI SDK (e2e tests) |
| `test/type/` directory | SWR (type compilation tests) |
