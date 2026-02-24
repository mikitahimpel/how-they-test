# Test Organization

Angular's monorepo uses a consistent structure across all packages, enforced by Bazel build rules.

## File Naming Convention

All spec files use the `_spec.ts` suffix (not `.spec.ts`):

```
packages/core/
  src/
    di/
      injector.ts
      provider.ts
  test/
    di/
      injector_spec.ts
      provider_spec.ts
```

This `_spec.ts` convention is unique to the Angular monorepo — the CLI-generated projects use `.spec.ts` instead.

## Directory Structure

Tests mirror the source directory structure inside a co-located `test/` directory:

```
packages/core/
  src/
    render3/
      component.ts
      instructions/
        element.ts
  test/
    render3/
      component_spec.ts
      instructions/
        element_spec.ts
```

Some packages place tests alongside source when they're tightly coupled:

```
packages/compiler-cli/
  src/
    ngtsc/
      checker/
        src/
          checker.ts
        test/
          checker_spec.ts
```

## Bazel Test Targets

Each test directory has its own `BUILD.bazel` defining test targets:

```python
# packages/router/test/BUILD.bazel
ts_library(
    name = "test_lib",
    testonly = True,
    srcs = glob(
        ["**/*.ts"],
        exclude = ["**/*_node_only_spec.ts"],
    ),
    deps = [
        "//packages/common",
        "//packages/core",
        "//packages/core/testing",
        "//packages/router",
        "//packages/router/testing",
        "@npm//rxjs",
    ],
)

karma_web_test_suite(
    name = "test",
    deps = [":test_lib"],
    browsers = ["//tools/browsers:chromium"],
)
```

## Test Module Pattern

Almost every spec file follows this pattern:

```typescript
// packages/core/test/di/injector_spec.ts
import {TestBed} from '@angular/core/testing';

describe('Injector', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MyService,
        {provide: Dependency, useClass: MockDependency},
      ],
    });
  });

  it('should resolve dependencies', () => {
    const service = TestBed.inject(MyService);
    expect(service).toBeInstanceOf(MyService);
  });
});
```

## Testing Packages

Each major package ships a `/testing` sub-package with test utilities:

| Package | Testing Module | Key Exports |
|---|---|---|
| `@angular/core` | `@angular/core/testing` | `TestBed`, `ComponentFixture`, `fakeAsync`, `tick` |
| `@angular/common/http` | `@angular/common/http/testing` | `HttpTestingController`, `provideHttpClientTesting` |
| `@angular/router` | `@angular/router/testing` | `RouterTestingModule`, `SpyLocation` |
| `@angular/platform-browser` | `@angular/platform-browser/testing` | `BrowserTestingModule` |
| `@angular/forms` | `@angular/forms/testing` | Form testing utilities |

## Running Tests

```bash
# All tests for a package
bazel test //packages/core/test:test

# Specific test file
bazel test //packages/core/test:test --test_filter="Injector"

# Full test suite
yarn test

# Integration tests
bazel test //integration/...
```
