# Overview

Angular's testing philosophy is deeply shaped by its dependency injection system. Every component, directive, pipe, and service can be tested in isolation by replacing its dependencies through DI — no module mocking required.

## Testing Stack

| Tool | Role |
|---|---|
| Jasmine | Test framework (describe/it/expect) |
| Karma | Browser test runner |
| Bazel | Build and test orchestration |
| Protractor (legacy) | E2E testing (replaced by Playwright/Cypress in community) |
| TestBed | Angular's testing API for DI configuration |

## Philosophy

Angular's internal tests follow several core principles:

1. **DI over mocking** — Replace dependencies through providers, not module patches
2. **TestBed is the testing API** — Almost every test configures a mini Angular module
3. **Spec files live next to source** — `_spec.ts` suffix in co-located `test/` directories
4. **Bazel enforces boundaries** — Each package declares its own test targets
5. **Integration apps validate the framework** — Real apps under `integration/` test the full stack

## Test Categories

Angular's monorepo contains several distinct testing approaches:

```
packages/
  core/test/              # Unit tests for DI, change detection, rendering
  compiler/test/          # Template compiler tests
  compiler-cli/test/      # CLI compiler integration tests
  router/test/            # Router unit and integration tests
  forms/test/             # Forms validation and binding tests
  common/test/            # Pipes, directives, HTTP tests
  platform-browser/test/  # Browser-specific platform tests
  animations/test/        # Animation DSL tests

integration/              # Full framework integration test apps
  cli-hello-world/
  platform-server/
  i18n/
```

## Bazel Integration

Every package has `BUILD.bazel` files defining test targets:

```python
# packages/core/test/BUILD.bazel
ts_library(
    name = "test_lib",
    srcs = glob(["**/*.ts"]),
    deps = [
        "//packages/core",
        "//packages/core/testing",
        "@npm//rxjs",
    ],
)

karma_web_test_suite(
    name = "test",
    deps = [":test_lib"],
)
```

Tests run via `bazel test //packages/core/test:test` or `yarn test` which orchestrates Bazel under the hood.

## Scale

The Angular monorepo contains thousands of spec files testing every aspect of the framework — from low-level compiler output to high-level component interaction patterns. The `@angular/core` package alone has hundreds of spec files covering dependency injection, change detection, lifecycle hooks, view encapsulation, and more.
