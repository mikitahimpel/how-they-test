# Test Harnesses

The most distinctive aspect of Vercel's testing — each project has a sophisticated custom test harness.

## Next.js: `nextTestSetup()` + `NextInstance`

### The NextInstance Abstraction

Three concrete implementations behind a common interface:

```
NextInstance (base)
  ├── NextDevInstance      (next dev)
  ├── NextStartInstance    (next build + next start)
  └── NextDeployInstance   (vercel deploy)
```

```typescript
// test/lib/next-modes/base.ts
export class NextInstance {
  protected files: ResolvedFileConfig
  protected nextConfig?: NextConfig
  public testDir: string

  async setup(rootSpan) {
    // 1. Creates temp directory
    // 2. Copies fixture files
    // 3. Installs dependencies
    // 4. Builds the project (for start/deploy modes)
  }

  async start() { /* starts the server process */ }
  async destroy() { /* kills process, cleans up temp dir */ }

  async patchFile(filename, content) {
    // Writes content to file in the running app
    // Used for HMR testing
  }

  async fetch(pathname, init?) {
    // HTTP request to the running instance
    return fetch(`http://localhost:${this.appPort}${pathname}`, init)
  }

  async browser(pathname) {
    // Opens Playwright browser pointing to the running instance
    return webdriver(this.appPort, pathname)
  }

  async readJSON(path) { /* reads build output files */ }
}
```

### `nextTestSetup()` — The Primary Test Harness

```typescript
// test/lib/e2e-utils/index.ts
export function nextTestSetup(options) {
  let next: NextInstance

  beforeAll(async () => {
    next = await createNext(options)
    // createNext() determines mode from NEXT_TEST_MODE env var
    // and creates the appropriate NextInstance subclass
  })

  afterAll(async () => {
    await next?.destroy()
  })

  // Returns a Proxy that throws if accessed before beforeAll completes
  const nextProxy = new Proxy({}, {
    get(_, prop) {
      if (!next) throw new Error('next instance not initialized')
      return next[prop]
    }
  })

  return {
    next: nextProxy,
    isNextDev: testMode === 'dev',
    isNextStart: testMode === 'start',
    isNextDeploy: testMode === 'deploy',
    isTurbopack: Boolean(process.env.TURBOPACK),
    isRspack: Boolean(process.env.RSPACK),
  }
}
```

### Usage in Tests

```typescript
describe('app-dir server actions', () => {
  const { next, isNextDev, isNextStart } = nextTestSetup({
    files: __dirname,  // test dir IS the Next.js app
  })

  it('should handle form submission', async () => {
    const browser = await next.browser('/form')
    await browser.elementByCss('input').type('hello')
    await browser.elementByCss('button').click()

    await check(async () => {
      return browser.elementByCss('#result').text()
    }, 'hello')
  })

  if (isNextStart) {
    it('should generate server manifest', async () => {
      const manifest = await next.readJSON(
        '.next/server/server-reference-manifest.json'
      )
      expect(manifest.node).toBeDefined()
    })
  }
})
```

### HMR Sandbox

```typescript
// test/lib/development-sandbox.ts
export async function createSandbox(next, initialFiles, initialUrl) {
  await next.stop()
  await next.clean()
  // Patch files, restart dev server, open browser

  return {
    browser,
    session: {
      async write(filename, content) {
        await next.patchFile(filename, content)
      },
      async patch(filename, content) {
        await next.patchFile(filename, content)
        // Wait for HMR update to complete
        await check(() => browser.eval('window.__hmr_updated'), 'true')
      },
      async remove(filename) {
        await next.deleteFile(filename)
      },
      async evaluate(fn) {
        return browser.eval(fn)
      },
    },
  }
}
```

---

## SWR: `renderWithConfig()` + Cache Injection

### The Core Pattern

SWR's test harness is simple but powerful — wrap every component in `<SWRConfig>` with an isolated cache:

```typescript
// test/utils.tsx
const _renderWithConfig = (element, config) => {
  const result = render(
    <SWRConfig value={config}>{element}</SWRConfig>
  )
  return {
    ...result,
    rerender: (ui) => result.rerender(
      <SWRConfig value={config}>{ui}</SWRConfig>
    ),
  }
}

// Default: fresh isolated cache per test
export const renderWithConfig = (element, config?) => {
  const provider = () => new Map()  // isolated cache
  return _renderWithConfig(element, { provider, ...config })
}

// When testing global cache behavior
export const renderWithGlobalCache = (element, config?) => {
  return _renderWithConfig(element, { ...config })
}
```

### Usage

```typescript
it('should return cached data on mount', async () => {
  const key = createKey()

  renderWithConfig(<Page />, {
    provider: () => new Map([[key, { data: 'cached' }]]),
  })

  // Immediate — cache hit, no fetch
  screen.getByText('cached')

  // After fetch completes
  await screen.findByText('updated')
})
```

The `SWRConfig` provider IS the DI mechanism. No module mocking needed because the cache is a parameter.

---

## AI SDK: `MockLanguageModelV3` + `@ai-sdk/test-server`

### Mock Model Classes

Each model type has a mock implementation:

```typescript
// packages/ai/src/test/mock-language-model-v3.ts
export class MockLanguageModelV3 implements LanguageModelV3 {
  readonly specificationVersion = 'v3'
  readonly defaultObjectGenerationMode = 'json'

  doGenerate: LanguageModelV3['doGenerate']
  doStream: LanguageModelV3['doStream']

  // Records calls for assertions
  doGenerateCalls: LanguageModelV3CallOptions[] = []
  doStreamCalls: LanguageModelV3CallOptions[] = []

  constructor({
    doGenerate = notImplemented,
    doStream = notImplemented,
  } = {}) {
    this.doGenerate = async (options) => {
      this.doGenerateCalls.push(options)  // record for assertions

      // Supports three input types:
      if (typeof doGenerate === 'function') return doGenerate(options)
      if (Array.isArray(doGenerate)) return doGenerate[this.doGenerateCalls.length - 1]
      return doGenerate  // static response object
    }

    this.doStream = async (options) => {
      this.doStreamCalls.push(options)
      if (typeof doStream === 'function') return doStream(options)
      if (Array.isArray(doStream)) return doStream[this.doStreamCalls.length - 1]
      return doStream
    }
  }
}
```

Also: `MockEmbeddingModelV3`, `MockImageModelV3`, `MockSpeechModelV3`, `MockProviderV3`.

**These are exported publicly** for library consumers:
```typescript
import { MockLanguageModelV3 } from 'ai/test'
```

### Test Server (MSW Wrapper)

```typescript
// packages/test-server/src/create-test-server.ts
export function createTestServer(routes) {
  const mswServer = setupServer(
    ...Object.entries(routes).map(([url, handler]) =>
      http.all(url, ({ request }) => {
        calls.push(new TestServerCall(request))
        // Supports response types:
        //   json-value, stream-chunks, controlled-stream,
        //   binary, error, empty
      })
    )
  )
  return { urls, calls, server }
}
```

Vitest integration handles lifecycle:

```typescript
// packages/test-server/src/with-vitest.ts
export function createTestServer(routes) {
  const server = createCoreTestServer(routes)
  beforeAll(() => server.server.start())
  beforeEach(() => server.server.reset())
  afterAll(() => server.server.stop())
  return { urls: server.urls, calls: server.calls }
}
```

### TestResponseController for Streaming

```typescript
export class TestResponseController {
  private readonly transformStream: TransformStream
  private readonly writer: WritableStreamDefaultWriter

  get readable(): ReadableStream { return this.transformStream.readable }
  async write(chunk: string) { await this.writer.write(chunk) }
  async close() { await this.writer.close() }
  async error(error: Error) { await this.writer.abort(error) }
}
```

Usage:

```typescript
const controller = new TestResponseController()

server.urls['http://localhost:3000/api/chat'].response = {
  type: 'controlled-stream',
  controller,
}

// In test: manually control when data arrives
await controller.write(formatChunk({ type: 'text', text: 'Hello' }))
await controller.write(formatChunk({ type: 'text', text: ' world' }))
await controller.close()
```

---

## Comparison

| Aspect | Next.js | SWR | AI SDK |
|---|---|---|---|
| **Harness** | `nextTestSetup()` + `NextInstance` | `renderWithConfig()` + cache injection | `MockLanguageModelV3` + `createTestServer()` |
| **Complexity** | Heavy (process management, file ops, ports) | Light (React context wrapper) | Medium (mock classes + MSW) |
| **Isolation** | Temp directories per test suite | Fresh `Map()` per test | MSW reset per test |
| **Real vs mock** | 100% real infrastructure | Real hooks, injected cache | Mock models, real HTTP interception |
| **Cleanup** | `next.destroy()` (kills process, removes temp dir) | Automatic (GC collects Map) | `server.stop()` |
