# Type-Level Testing

A distinctive TanStack pattern. Every project includes `.test-d.ts` files that verify TypeScript inference at compile time.

## Why Type Tests Matter Here

TanStack libraries are heavily generic. Users rely on TypeScript to:
- Infer query data types from `queryFn` return types
- Infer table column types from data shape
- Infer form field types from `defaultValues`
- Infer route params from path patterns

If generic inference breaks, the library is broken — even if runtime behavior is correct. Type tests catch this.

## How It Works

Vitest provides `expectTypeOf()` for compile-time assertions. Enable in config:

```typescript
// vite.config.ts
test: {
  typecheck: { enabled: true },
}
```

Test files use the `.test-d.ts` extension and run during `vitest typecheck`.

## TanStack Query Type Tests

```typescript
// packages/query-core/src/__tests__/queryClient.test-d.tsx
import { assertType, describe, expectTypeOf, it } from 'vitest'

describe('getQueryData', () => {
  it('should be typed if key is tagged', () => {
    const queryKey = ['key'] as DataTag<Array<string>, number>
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(queryKey)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should be unknown without tag', () => {
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(['key'])

    expectTypeOf(data).toEqualTypeOf<unknown>()
  })
})
```

```typescript
// packages/react-query/src/__tests__/useQuery.test-d.tsx
describe('useQuery', () => {
  it('should infer data type from queryFn', () => {
    const { data } = useQuery({
      queryKey: ['test'],
      queryFn: () => Promise.resolve(42),
    })

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should narrow data type with select', () => {
    const { data } = useQuery({
      queryKey: ['test'],
      queryFn: () => Promise.resolve({ count: 42 }),
      select: (data) => data.count,
    })

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
})
```

## TanStack Form Type Tests

```typescript
// packages/form-core/tests/FormApi.test-d.ts
it('should type state.values properly', () => {
  const form = new FormApi({
    defaultValues: { name: 'test', age: 25 },
  })

  expectTypeOf(form.state.values).toEqualTypeOf<{
    name: string
    age: number
  }>()
})

it('should type field values properly', () => {
  const form = new FormApi({
    defaultValues: { nested: { deep: 'value' } },
  })

  const field = new FieldApi({
    form,
    name: 'nested.deep',
  })

  expectTypeOf(field.state.value).toEqualTypeOf<string>()
})
```

## TanStack Router Type Tests

```typescript
// Route params inference
it('should infer params from path', () => {
  const route = createRoute({
    path: '/users/$userId/posts/$postId',
  })

  expectTypeOf(route).toMatchTypeOf<{
    params: { userId: string; postId: string }
  }>()
})
```

## Key `expectTypeOf` Assertions

```typescript
// Exact type match
expectTypeOf(value).toEqualTypeOf<string>()

// Assignability (looser)
expectTypeOf(value).toMatchTypeOf<{ name: string }>()

// Function signatures
expectTypeOf(fn).toBeCallableWith('arg')
expectTypeOf(fn).returns.toEqualTypeOf<number>()

// Negation
expectTypeOf(value).not.toBeAny()
expectTypeOf(value).not.toBeNever()
```

## Naming Convention

```
queryClient.test.tsx      # runtime tests
queryClient.test-d.tsx    # type tests (d = declaration)
FormApi.spec.ts           # runtime tests
FormApi.test-d.ts         # type tests
```

The `-d` suffix mirrors TypeScript's `.d.ts` convention for declaration files.

## Why Not Just Runtime Tests?

Runtime tests verify behavior. Type tests verify the developer experience:

```typescript
// This passes at runtime but has WRONG types
const data: any = queryClient.getQueryData(['key'])
// Runtime: works fine
// TypeScript: user gets `any` instead of proper inference — BAD DX

// Type test catches this
expectTypeOf(data).not.toBeAny()  // FAILS if inference is broken
```

Without type tests, you could ship a version where all queries return `any` — runtime tests would pass, but every user's TypeScript would be broken.
