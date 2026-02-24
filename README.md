# How They Test

A collection of testing conventions and patterns used by prominent open-source ecosystems.

## Getting Started

```bash
bun install
bun run build.ts
open dist/index.html
```

## Project Structure

```
docs/           — Ecosystem documentation (markdown)
styles/         — CSS for the built site
build.ts        — Static site generator
dist/           — Built output (git-ignored)
```

## Ecosystems

- [Vue Ecosystem](./docs/vue-ecosystem/) — Vue 3, Vite, Vitest, Vue Router, Pinia, VitePress
- [TanStack](./docs/tanstack/) — TanStack Query, Router, Table, Form, Virtual
- [Vercel](./docs/vercel/) — Next.js, SWR, Vercel AI SDK
- [Fastify](./docs/fastify/) — Fastify core, fastify-cors, fastify-sensible, fastify-autoload
- [Svelte](./docs/svelte/) — Svelte compiler/runtime and SvelteKit
- [Angular](./docs/angular/) — Angular core, compiler, router, forms, CDK, Material
- [React](./docs/react/) — React core, DOM renderer, reconciler, concurrent features
