# Test Utilities and Helpers

## Shared Package: `@tanstack/query-test-utils`

TanStack Query has a dedicated shared test utility package used across all adapters:

```
packages/query-test-utils/
  src/
    index.ts
    sleep.ts
    queryKey.ts
    mockVisibilityState.ts
```

### `sleep` — Promise-based delay

```typescript
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
```

### `queryKey` — Auto-incrementing unique key generator

```typescript
let queryKeyCount = 0
export const queryKey = (): Array<string> => {
  queryKeyCount++
  return [`query_${queryKeyCount}`]
}
```

Avoids key collisions between tests without needing random UUIDs.

### `mockVisibilityState` — Document visibility spy

```typescript
export const mockVisibilityState = (
  value: DocumentVisibilityState,
): MockInstance<() => DocumentVisibilityState> =>
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(value)
```

## Per-Package Test Utilities

### React Query: `utils.tsx`

```typescript
// packages/react-query/src/__tests__/utils.tsx

// Wraps component in QueryClientProvider
export function renderWithClient(
  client: QueryClient,
  ui: React.ReactElement,
) {
  const { rerender, ...result } = render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  )
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) =>
      rerender(
        <QueryClientProvider client={client}>
          {rerenderUi}
        </QueryClientProvider>,
      ),
  }
}

// Wraps setTimeout in act() for React state updates
export function setActTimeout(fn: () => void, ms?: number) {
  return setTimeout(() => {
    act(() => { fn() })
  }, ms)
}

// Monkey-patches isServer for SSR testing
export function setIsServer(isServer: boolean) {
  const original = utils.isServer
  Object.defineProperty(utils, 'isServer', {
    get: () => isServer,
  })
  return () => {
    Object.defineProperty(utils, 'isServer', {
      get: () => original,
    })
  }
}

// Spy helper for online manager
export function mockOnlineManagerIsOnline(
  value: boolean,
): MockInstance<() => boolean> {
  return vi.spyOn(onlineManager, 'isOnline').mockReturnValue(value)
}
```

### Router: `utils.ts`

```typescript
// packages/react-router/tests/utils.ts

// Timer utility for measuring async operations
export function createTimer() {
  let time = Date.now()
  return {
    start: () => { time = Date.now() },
    getTime: () => Date.now() - time,
  }
}

// Full IntersectionObserver mock
export const getIntersectionObserverMock = ({
  observe,
  disconnect,
}: {
  observe: () => void
  disconnect: () => void
}) => {
  return class IO implements IntersectionObserver {
    root = null
    rootMargin = ''
    thresholds = []
    observe() { observe() }
    disconnect() { disconnect() }
    unobserve() {}
    takeRecords() { return [] }
  }
}
```

### Table: `makeTestData.ts`

```typescript
// packages/table-core/tests/makeTestData.ts
import { faker } from '@faker-js/faker'

type Person = {
  firstName: string
  lastName: string
  age: number
  visits: number
  progress: number
  status: string
  subRows?: Person[]
}

const newPerson = (): Person => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  age: faker.number.int(40),
  visits: faker.number.int(1000),
  progress: faker.number.int(100),
  status: faker.helpers.shuffle(['relationship', 'complicated', 'single'])[0]!,
})

export function makeData(...lens: number[]) {
  const makeDataLevel = (depth = 0): Person[] => {
    const len = lens[depth]!
    return range(len).map(() => ({
      ...newPerson(),
      subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
    }))
  }
  return makeDataLevel()
}
```

### Solid Query: `utils.tsx`

```typescript
// packages/solid-query/src/__tests__/utils.tsx

// Helper component for testing mount/unmount cycles
export function Blink(props: { duration: number } & ParentProps) {
  const [shouldShow, setShouldShow] = createSignal<boolean>(true)
  createEffect(() => {
    setShouldShow(true)
    const timeout = setActTimeout(
      () => setShouldShow(false),
      props.duration,
    )
    onCleanup(() => clearTimeout(timeout))
  })
  return (
    <Show when={shouldShow()} fallback={<>off</>}>
      <>{props.children}</>
    </Show>
  )
}
```

## Testing Library Per Framework

| Framework | Package | Rendering |
|---|---|---|
| React | `@testing-library/react` | `render()`, `renderWithClient()` |
| Vue | `@testing-library/vue` | `render()` with `defineComponent()` + JSX |
| Solid | `@solidjs/testing-library` | `render()` with Solid components |
| Svelte | Direct Svelte `mount()`/`unmount()` | Manual DOM container |

## Setup Files Pattern

Each framework adapter has a setup file for global config:

```typescript
// Typical setup file
import '@testing-library/jest-dom/vitest'  // DOM matchers
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())  // clean up rendered components
```

## Key Differences from Evan You

| Aspect | Evan You | Tanner Linsley |
|---|---|---|
| Shared utils | Per-package, small | Dedicated `query-test-utils` package |
| Warning enforcement | Custom `toHaveBeenWarned()` matcher | Not used |
| Test data | Inline or minimal | Faker.js for Table tests |
| DOM testing | Custom `@vue/runtime-test` | Testing Library |
| SSR testing | Compile-time flags | `setIsServer()` monkey-patch |
