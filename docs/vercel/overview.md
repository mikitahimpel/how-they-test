# Overview: Vercel Ecosystem Testing Philosophy

## Core Principles

### 1. Integration-Heavy, Mock-Light

The defining trait. Next.js tests spin up **real Next.js applications** — real builds, real servers, real HTTP requests. SWR injects a fresh cache via React context. AI SDK creates mock implementations of provider interfaces. Almost nothing uses `jest.mock()` or `vi.mock()`.

### 2. Test the Real Thing in Every Mode

Next.js runs the same e2e tests under three modes:
- `next dev` (development server)
- `next build && next start` (production server)
- `vercel deploy` (deployed to Vercel)

And across three bundlers: Webpack, Turbopack, Rspack.

AI SDK runs every test twice: once in Node.js, once in edge-runtime.

### 3. Fixtures Are Real Applications

Next.js test fixtures aren't mock objects — they're **complete Next.js applications** with `app/`, `pages/`, `next.config.js`, `middleware.js`. Each test directory is a working project.

### 4. Interface-Based Mock Objects Over Import Mocking

AI SDK defines mock classes that implement real interfaces (`MockLanguageModelV3 implements LanguageModelV3`). Tests inject these through function parameters, not module replacement.

### 5. HTTP-Level Interception for Provider Testing

AI SDK uses MSW (Mock Service Worker) to intercept HTTP requests at the network level. Provider tests mock the HTTP API (OpenAI, Anthropic, etc.), not the SDK internals.

## Anti-Patterns (Things They Avoid)

- `jest.mock()` / `vi.mock()` for import-level module mocking (near zero usage)
- Mocking Next.js internals to test features (spin up a real app instead)
- In-memory/synthetic DOM testing for framework features (real browser via Playwright)
- Shared global test state (each test gets isolated instances/caches)

## The Testing Spectrum

```
Next.js:   |████████████████████████████████████████████| heavy integration/e2e
SWR:       |██████████████████████████████|              balanced unit/integration
AI SDK:    |████████████████████████████████████|        unit + interface mocks + HTTP mocks
```

Next.js skews heavily toward integration/e2e because the framework itself is an integration of compiler, bundler, server, router, and runtime — testing pieces in isolation wouldn't catch real bugs.
