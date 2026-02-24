# How They Test

Testing best practices extracted from 7 major open-source ecosystems — 47,000+ test cases analyzed.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Install

```bash
npx skills add mikitahimpel/how-they-test
```

## Available Skills

### test-patterns

Runner-agnostic testing best practices distilled from real-world open-source codebases. 7 core principles with detailed reference files.

**Use when:**
- Writing new tests for functions, components, or API routes
- Choosing between mocking strategies
- Reviewing test code for reliability
- Setting up test infrastructure for a project
- Deciding unit vs integration vs E2E boundaries
- Testing async code, timers, or streams

**Principles covered:**
- Make dependencies injectable (Critical)
- Prefer mock functions over module mocking (Critical)
- Isolate every test (High)
- Test at the right level (High)
- Handle async correctly (Medium-High)
- Fail on unexpected warnings (Medium)
- Build small test helpers (Medium)

**Runners supported:**
- Vitest
- Jest
- node:test
- bun:test

**Reference files:**
- `runner-apis` — API translation table across all runners
- `dependency-injection` — Options objects, constructors, factories, framework DI
- `mocking-patterns` — Interface mocks, MSW, request injection, console spies
- `async-patterns` — Polling/retry, controlled promises, streams, fake timers
- `test-helpers` — Render wrappers, deferred promises, test factories
- `test-organization` — File structure, naming conventions, multi-environment
- `advanced-patterns` — Type-level testing, assertion counting, fixtures, E2E harnesses

## Source Research

The skill is built on detailed documentation of testing conventions across these ecosystems:

- [Vue Ecosystem](./docs/vue-ecosystem/) — Vue 3, Vite, Vitest, Vue Router, Pinia, VitePress
- [TanStack](./docs/tanstack/) — TanStack Query, Router, Table, Form, Virtual
- [Vercel](./docs/vercel/) — Next.js, SWR, Vercel AI SDK
- [Fastify](./docs/fastify/) — Fastify core, fastify-cors, fastify-sensible, fastify-autoload
- [Svelte](./docs/svelte/) — Svelte compiler/runtime and SvelteKit
- [Angular](./docs/angular/) — Angular core, compiler, router, forms, CDK, Material
- [React](./docs/react/) — React core, DOM renderer, reconciler, concurrent features

## Development

```bash
bun install
bun run build.ts
open dist/index.html
```
