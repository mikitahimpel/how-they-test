# Test Organization

## Two Conventions Across Projects

### Pattern A: Co-located `__tests__/` Inside `src/` (Query)

```
packages/query-core/
  src/
    __tests__/
      queryClient.test.tsx
      queryClient.test-d.tsx      # type-level tests
      queryObserver.test.tsx
      infiniteQueryBehavior.test.tsx
      utils.ts                    # local test helpers
    queryClient.ts
    queryObserver.ts

packages/react-query/
  src/
    __tests__/
      useQuery.test.tsx
      useMutation.test.tsx
      useSuspenseQuery.test.tsx
      utils.tsx                   # React-specific test helpers
```

### Pattern B: Separate `tests/` Directory at Package Root (Form, Table, Virtual, Router)

```
packages/form-core/
  src/
    FormApi.ts
    FieldApi.ts
  tests/
    FormApi.spec.ts
    FieldApi.spec.ts
    FormApi.test-d.ts             # type-level tests
    utils.ts

packages/react-router/
  tests/
    link.test.tsx
    loaders.test.tsx
    link.bench.tsx                # benchmark tests
    setupTests.tsx
    utils.ts
```

## File Naming

| Convention | Used In |
|---|---|
| `*.test.tsx` | Query, Router, Virtual |
| `*.spec.ts` | Form, Table (core) |
| `*.test-d.ts` / `*.test-d.tsx` | All projects (type tests) |
| `*.bench.tsx` | Router (benchmarks) |

## Vitest Configuration

Each package has its own `vite.config.ts`:

```typescript
// packages/query-core/vite.config.ts
export default defineConfig({
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'jsdom',
    coverage: {
      enabled: true,
      provider: 'istanbul',
      include: ['src/**/*'],
      exclude: ['src/__tests__/**'],
    },
    typecheck: { enabled: true },
    restoreMocks: true,
  },
})
```

```typescript
// packages/table-core/vitest.config.ts
export default defineConfig({
  test: {
    name: packageJson.name,
    dir: './tests',
    watch: false,
    environment: 'node',     // core packages often use node env
    globals: true,
  },
})
```

### Environment Strategy

| Package Type | Environment |
|---|---|
| `*-core` packages | `node` or `jsdom` depending on DOM needs |
| `react-*` / `vue-*` / `solid-*` | `jsdom` |
| `svelte-*` | `jsdom` |

### Setup Files

```typescript
// packages/react-router/tests/setupTests.tsx
import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
global.IS_REACT_ACT_ENVIRONMENT = true
window.scrollTo = vi.fn()
```

```typescript
// packages/react-form/tests/test-setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
afterEach(() => cleanup())
```

### Coverage

All projects use Istanbul provider:

```typescript
coverage: {
  enabled: true,
  provider: 'istanbul',
  include: ['src/**/*'],
  exclude: ['src/__tests__/**'],
}
```
