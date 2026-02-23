# Mocking Patterns

## `jest.mock()` / `vi.mock()` Usage: Near Zero

Across all three Vercel projects, import-level module mocking is almost entirely absent.

- **Next.js**: No `jest.mock()` in e2e/integration tests. Tests spin up real Next.js instances.
- **SWR**: No `jest.mock()`. Tests inject behavior through `SWRConfig` context.
- **AI SDK**: `vi.mock()` used only for the version module:

```typescript
// The ONE common vi.mock() usage
vi.mock('../version', () => ({
  VERSION: '0.0.0-test',
}))
```

## What They Use Instead

### `jest.fn()` / `vi.fn()` — Callbacks and Fetchers

```typescript
// SWR: query function as vi.fn()
const fetcher = jest.fn(() => Promise.resolve('data'))
function Page() {
  const { data } = useSWR(key, fetcher)
  return <div>{data}</div>
}
```

```typescript
// AI SDK: doGenerate/doStream as vi.fn()
const model = new MockLanguageModelV3({
  doGenerate: vi.fn().mockResolvedValue({
    text: 'Hello, world!',
    usage: { inputTokens: 10, outputTokens: 20 },
    finishReason: { unified: 'stop', raw: 'stop' },
  }),
})
```

```typescript
// Next.js: minimal — callbacks in test assertions
const onError = jest.fn()
```

### `jest.spyOn()` / `vi.spyOn()` — Browser APIs

```typescript
// SWR: document visibility
const mockVisibilityState = jest.spyOn(document, 'visibilityState', 'get')
mockVisibilityState.mockImplementation(() => 'hidden')
```

```typescript
// SWR: console error detection
jest.spyOn(console, 'error').mockImplementation(() => {})
```

```typescript
// AI SDK: warning interception
vi.spyOn(logWarningsModule, 'logWarnings').mockImplementation(() => {})
```

### Interface-Based Mock Objects (AI SDK)

The primary mocking strategy — classes that implement real interfaces:

```typescript
// Not a jest.mock() — a real class implementing the interface
const model = new MockLanguageModelV3({
  doGenerate: async (options) => ({
    text: 'Hello',
    usage: testUsage,
    finishReason: { unified: 'stop', raw: 'stop' },
  }),
})

// Tests pass this to real functions
const result = await generateText({ model, prompt: 'Hi' })
expect(result.text).toBe('Hello')
```

### MSW for HTTP Interception (AI SDK)

```typescript
import { createTestServer } from '@ai-sdk/test-server/with-vitest'

const server = createTestServer({
  'https://api.openai.com/v1/chat/completions': {
    response: {
      type: 'json-value',
      body: { choices: [{ message: { content: 'Hello' } }] },
    },
  },
})

// Real HTTP request goes to MSW, not the real API
const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Hi',
})
```

### React Context Injection (SWR)

```typescript
// Each test gets an isolated cache via SWRConfig
export const renderWithConfig = (element, config?) => {
  const provider = () => new Map()  // Fresh Map = fresh cache
  return render(
    <SWRConfig value={{ provider, ...config }}>
      {element}
    </SWRConfig>
  )
}
```

### Real Infrastructure (Next.js)

```typescript
// No mocking — real Next.js app, real build, real server
const { next, isNextDev } = nextTestSetup({
  files: __dirname,  // a full Next.js app in the test dir
})

it('should handle server action', async () => {
  const browser = await next.browser('/page')
  await browser.elementByCss('button').click()
  // Real browser, real server, real action
})
```

## What's NOT Used

| Technique | Next.js | SWR | AI SDK |
|---|---|---|---|
| `jest.mock()` / `vi.mock()` for modules | No | No | Only `version` |
| `jest.mock('fs')` | No | No | No |
| `jest.mock('next/router')` | No | No | N/A |
| Manual `__mocks__/` directories | No | No | No |
| Third-party mock libraries (sinon, etc.) | No | No | No |
| `jest.mock()` for React components | No | No | No |

## Summary

```
Next.js:  Real apps + real servers + real browsers = no mocks needed
SWR:      React context injection (SWRConfig) = no mocks needed
AI SDK:   Interface mocks + MSW = no import mocks needed
```
