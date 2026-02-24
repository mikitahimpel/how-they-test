# Per-Project Breakdown

## Next.js (vercel/next.js)

| Aspect | Detail |
|---|---|
| **Framework** | Jest + Playwright (via wrapper) |
| **Test location** | Separate `test/` directory with category subdirs |
| **Categories** | `unit/`, `integration/`, `e2e/`, `development/`, `production/` |
| **`jest.mock()` usage** | Near zero in e2e/integration; minimal in unit |
| **Primary strategy** | Real Next.js apps as fixtures, real builds, real servers |
| **Mode testing** | dev / start / deploy via `NEXT_TEST_MODE` env var |
| **Bundler testing** | Webpack / Turbopack / Rspack via env vars + manifests |
| **Key harness** | `nextTestSetup()` + `NextInstance` subclasses |
| **HMR testing** | `createSandbox()` with file patching + browser verification |
| **Rust testing** | `#[fixture]` with input/output file pairs |
| **Custom runner** | `run-tests.js` with parallel execution, retries, timing data |
| **Scale** | Thousands of tests, 100+ e2e test suites |

### Notable Patterns

- Each e2e test dir is a complete Next.js application
- `check()` polling utility for async assertions
- `FileRef`/`PatchedFileRef` for fixture file management
- Conditional test blocks based on `isNextDev`, `isNextStart`, `isTurbopack`
- Build manifests validated in production-only tests
- Error overlay (Redbox) assertion helpers for dev-only tests

---

## SWR (vercel/swr)

| Aspect | Detail |
|---|---|
| **Framework** | Jest 30 + Playwright |
| **Test location** | Separate `test/` dir, flat by feature |
| **`jest.mock()` usage** | Zero |
| **Primary strategy** | `SWRConfig` cache injection via React context |
| **Key harness** | `renderWithConfig()` with fresh `Map()` per test |
| **Async testing** | `act()` + `sleep()` + `createResponse()` with configurable delay |
| **Browser API mocking** | `jest.spyOn(document, 'visibilityState', 'get')` |
| **E2E** | Playwright with a real Next.js site in `e2e/site/` |
| **Type tests** | Separate `test/type/` directory |

### Notable Patterns

- `createKey()` generates unique SWR keys per test
- `createResponse(data, { delay })` simulates network latency
- `focusOn(window)` triggers focus revalidation
- `renderWithGlobalCache()` for tests that need shared cache
- `executeWithoutBatching()` disables React 18 batching for timing control
- Hydration error detection via console.error spy
- Race condition tests with controlled timing:

```typescript
// Trigger slow request, then fast request — verify fast wins
faster = false
fireEvent.click(button)  // triggers slower fetch
faster = true
fireEvent.click(button)  // triggers faster fetch
await act(() => sleep(150))
screen.getByText('data: 1')  // faster result displayed
```

---

## Vercel AI SDK (vercel/ai)

| Aspect | Detail |
|---|---|
| **Framework** | Vitest |
| **Test location** | Co-located with source |
| **`vi.mock()` usage** | Only for `version` module |
| **Primary strategy** | Mock classes implementing interfaces + MSW |
| **Key harness** | `MockLanguageModelV3` + `createTestServer()` |
| **Streaming testing** | `convertArrayToReadableStream()` + `TestResponseController` |
| **Environment testing** | Dual configs: Node.js + edge-runtime |
| **Type tests** | `.test-d.ts` files with `expectTypeOf()` |
| **Fixtures** | `__fixtures__/*.json` and `*.chunks.txt` (captured API responses) |
| **Public test API** | `ai/test` exports mock models for consumers |

### Notable Patterns

- Mock models record calls for assertions (`model.doGenerateCalls`)
- Mock models accept static values, functions, or arrays (sequential responses)
- `@ai-sdk/test-server` wraps MSW with Vitest lifecycle management
- `TestResponseController` enables controlled async streaming in tests
- `mockId()` creates deterministic sequential IDs
- `mockValues()` returns sequential values with "sticky last" behavior
- Provider tests use real captured API responses as fixtures
- Every test runs in both Node.js and edge-runtime

---

## Cross-Project Summary

| Pattern | Next.js | SWR | AI SDK |
|---|---|---|---|
| Test framework | Jest | Jest 30 | Vitest |
| `jest.mock`/`vi.mock` | Near zero | Zero | Version only |
| Module mocking alt | Real instances | Context injection | Interface mocks |
| HTTP mocking | Real HTTP servers | N/A | MSW |
| Fixture type | Full Next.js apps | Inline data | Captured API responses |
| Test isolation | Temp dirs + processes | Fresh Map per test | MSW reset per test |
| Multi-env testing | dev/start/deploy × 3 bundlers | jsdom | Node + edge-runtime |
| Streaming tests | N/A | N/A | ReadableStream utilities |
| Type tests | tsc --noEmit | Separate type/ dir | .test-d.ts files |
| Rust tests | #[fixture] input/output pairs | N/A | N/A |
| Custom runner | Yes (run-tests.js) | No | No |
| Public test utils | No | No | Yes (ai/test) |
| Snapshot testing | Rare | No | toMatchInlineSnapshot |
