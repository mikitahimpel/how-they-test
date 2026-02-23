# Overview: TanStack Testing Philosophy

## Core Principles

### 1. Core/Adapter Architecture Is the Testing Strategy

Every TanStack library splits into a framework-agnostic `*-core` package and thin framework adapters (`react-*`, `vue-*`, `solid-*`, `svelte-*`). This is the single most important testing decision — the bulk of the logic is testable without any framework, DOM, or rendering.

### 2. Inject Everything Through Constructor Options

TanStack libraries accept all dependencies through options objects: `QueryClient`, `createTable({ data, columns, ... })`, `new Virtualizer({ getScrollElement, estimateSize, ... })`. Tests just pass different options — no mocking required.

### 3. Vitest Everywhere, No Exceptions

All five projects use Vitest. No Jest, no Mocha.

### 4. Minimal Import Mocking

`vi.mock()` is almost never used. The dominant tools are:
- `vi.fn()` for callback tracking
- `vi.spyOn()` for intercepting specific methods
- `vi.useFakeTimers()` for controlling time

### 5. Type Tests Are First-Class

Every project includes `.test-d.ts` files that verify TypeScript inference at compile time using `expectTypeOf()`. For a generic-heavy library ecosystem, type correctness is as important as runtime correctness.

### 6. Real Instances, Controlled Inputs

Tests create real `QueryClient`, real `FormApi`, real `Virtualizer` — just with controlled options. Same philosophy as the Vue ecosystem, different domain.

## Anti-Patterns (Things He Avoids)

- `vi.mock()` for module imports (rare exception: Vue Query adapter)
- Mocking core library internals from adapter tests
- Centralized test factories or builders (helpers are local and small)
- Mocking the DOM when you can test at the core layer
- Separating unit/integration by directory — the architecture itself provides the separation
