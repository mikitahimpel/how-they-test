# E2E and Integration Testing

## Next.js: The Largest E2E Suite

### Multi-Mode Execution

The same tests run under three modes via environment variables:

```bash
# Development server
NEXT_TEST_MODE=dev jest test/e2e/app-dir/actions/

# Production server
NEXT_TEST_MODE=start jest test/e2e/app-dir/actions/

# Deployed to Vercel
NEXT_TEST_MODE=deploy jest test/e2e/app-dir/actions/
```

### Multi-Bundler Matrix

Each mode can run with different bundlers:

```json
{
  "test-dev-webpack": "with-webpack test-dev-inner",
  "test-dev-turbo": "with-turbo test-dev-inner",
  "test-dev-rspack": "with-rspack test-dev-inner",
  "test-start-webpack": "with-webpack test-start-inner",
  "test-start-turbo": "with-turbo test-start-inner",
  "test-start-rspack": "with-rspack test-start-inner"
}
```

Manifest files control which tests run with which bundler:
- `test/turbopack-dev-tests-manifest.json`
- `test/turbopack-build-tests-manifest.json`
- `test/rspack-dev-tests-manifest.json`

### Full Matrix

```
            Webpack    Turbopack    Rspack
dev            ✓           ✓          ✓
start          ✓           ✓          ✓
deploy         ✓           -          -
```

### Test Fixtures Are Real Apps

Every e2e test directory is a complete Next.js project:

```
test/e2e/app-dir/actions/
  app-action.test.ts          # Test file
  app/
    layout.tsx                # Real layout
    page.tsx                  # Real page component
    actions.ts                # Real server actions
  next.config.js              # Real config
  middleware.js               # Real middleware
  package.json                # Dependencies (if needed)
```

### Conditional Test Execution

Tests can branch on mode:

```typescript
const { next, isNextDev, isNextStart, isNextDeploy, isTurbopack } = nextTestSetup({
  files: __dirname,
})

it('renders the page', async () => {
  const html = await next.fetch('/').then(r => r.text())
  expect(html).toContain('Hello World')
})

// Production-only test
if (isNextStart) {
  it('generates build manifest', async () => {
    const manifest = await next.readJSON('.next/server/server-reference-manifest.json')
    expect(manifest.node).toBeDefined()
  })
}

// Dev-only test
if (isNextDev) {
  it('supports HMR', async () => {
    const browser = await next.browser('/')
    await next.patchFile('app/page.tsx', 'export default () => <div>Updated</div>')
    await check(() => browser.elementByCss('div').text(), 'Updated')
  })
}
```

### Custom Test Runner

`run-tests.js` at the repo root orchestrates:
- Parallel test execution with configurable concurrency
- Timing data via Vercel KV for scheduling optimization
- Automatic retries (default 2 attempts)
- JUnit report generation
- Test filtering by manifest files

### HMR Testing Pattern

```typescript
describe('React Refresh', () => {
  const { next } = nextTestSetup({ files: __dirname })

  it('should hot reload a component', async () => {
    const { session } = await createSandbox(next, new Map([
      ['app/page.tsx', `export default () => <p>Hello</p>`],
    ]))

    // Verify initial render
    expect(await session.evaluate(() => document.querySelector('p').textContent))
      .toBe('Hello')

    // Patch file — triggers HMR
    await session.patch('app/page.tsx', `export default () => <p>Updated</p>`)

    // Verify HMR applied without full reload
    expect(await session.evaluate(() => document.querySelector('p').textContent))
      .toBe('Updated')
  })
})
```

---

## SWR: Playwright E2E with Real Next.js Site

### Structure

```
e2e/
  site/                     # Full Next.js app
    pages/
    next.config.js
  test/
    initial-render.test.ts
    suspense-scenarios.test.ts
    stream-ssr.test.ts
    perf.test.ts
```

### Playwright Config

```javascript
export default defineConfig({
  webServer: {
    command: 'pnpm next start e2e/site --port 4000',
    port: 4000,
  },
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:4000',
    ...devices['Desktop Chrome'],
  },
})
```

SWR's E2E tests focus on:
- SSR initial render correctness
- Suspense boundary behavior
- Streaming SSR
- Performance characteristics

---

## AI SDK: Dual-Environment Testing

### Node.js + Edge Runtime

Every test runs in both environments via separate vitest configs:

```bash
pnpm vitest --config vitest.node.config.js
pnpm vitest --config vitest.edge.config.js
```

This catches environment-specific issues:
- `crypto` API differences
- `fetch` implementation differences
- `ReadableStream` behavior differences
- Module resolution differences

### Provider E2E Pattern

Provider tests use MSW to mock the real provider HTTP API:

```typescript
const server = createTestServer({
  'https://api.openai.com/v1/chat/completions': {
    response: {
      type: 'stream-chunks',
      chunks: readFixtureChunks('openai-text.chunks.txt'),
    },
  },
})

it('should stream text from OpenAI', async () => {
  const result = streamText({
    model: openai('gpt-4'),
    prompt: 'Hello',
  })

  const chunks = await convertReadableStreamToArray(result.textStream)
  expect(chunks.join('')).toBe('Hello, how can I help?')
})
```

---

## Test Isolation Comparison

| Project | Isolation Level | Mechanism |
|---|---|---|
| **Next.js** | Per-suite: temp directory + child process | `nextTestSetup()` creates/destroys instance |
| **SWR** | Per-test: fresh cache | `provider: () => new Map()` in SWRConfig |
| **AI SDK** | Per-test: MSW server reset | `beforeEach(() => server.reset())` |

## Scale

| Project | Approx Test Count | Test Suites |
|---|---|---|
| **Next.js** | Thousands | 100+ e2e dirs, 50+ integration dirs, unit tests |
| **SWR** | 400+ | 30+ test files + 13 e2e files |
| **AI SDK** | Hundreds | Per-package co-located tests |
