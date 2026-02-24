# Per-Project Breakdown

## angular/angular (Framework Monorepo)

| Aspect | Detail |
|---|---|
| Framework | Jasmine + Karma |
| Build system | Bazel |
| Test runner | Karma (browser), Node.js (compiler) |
| Naming | `_spec.ts` suffix |
| Structure | Co-located `test/` directories |
| Mocking | Jasmine spies + DI provider replacement |

### Key Package Test Suites

| Package | Focus | Key Patterns |
|---|---|---|
| `@angular/core` | DI, change detection, rendering, signals | TestBed, ComponentFixture, fakeAsync |
| `@angular/compiler` | Template compilation, code generation | Direct compiler invocation, AST comparison |
| `@angular/compiler-cli` | CLI compilation, type checking | File system mocks, diagnostic assertions |
| `@angular/router` | Navigation, guards, resolvers | RouterTestingModule, SpyLocation |
| `@angular/forms` | Reactive and template forms | FormControl/Group testing, validation |
| `@angular/common/http` | HTTP client | HttpTestingController |
| `@angular/animations` | Animation DSL, transitions | Mocked animation drivers |
| `@angular/platform-browser` | Browser platform | DOM renderer tests |
| `@angular/platform-server` | SSR | Server-side rendering output comparison |

### Integration Test Apps

```
integration/
  bazel/                    # Bazel build integration
  cli-hello-world/          # Basic CLI app
  cli-hello-world-lazy/     # Lazy loading
  dynamic-compiler/         # JIT compilation
  i18n/                     # Internationalization
  ivy-i18n/                 # Ivy i18n
  ng-update/                # Migration schematics
  platform-server/          # SSR integration
  service-worker/           # SW registration
  trusted-types/            # Trusted Types API
```

### Test Commands

```bash
# Package unit tests
bazel test //packages/core/test:test
bazel test //packages/router/test:test

# Compiler tests
bazel test //packages/compiler/test:test
bazel test //packages/compiler-cli/test:test

# All tests
yarn test

# Integration tests
bazel test //integration/...
```

## angular/components (Angular Material + CDK)

| Aspect | Detail |
|---|---|
| Framework | Jasmine + Karma |
| Build system | Bazel |
| Key pattern | Component Harness for every component |
| DOM testing | HarnessLoader + TestElement |

### Structure

```
src/
  cdk/
    testing/                # Harness infrastructure
    a11y/test/              # Accessibility utilities
    drag-drop/test/         # Drag and drop
    overlay/test/           # Overlay positioning
  material/
    button/
      button.spec.ts        # Unit tests
      testing/
        button-harness.ts   # Harness definition
    dialog/
      dialog.spec.ts
      testing/
        dialog-harness.ts
    table/
      table.spec.ts
      testing/
        table-harness.ts
```

### Harness Pattern Per Component

Every Material component ships with a harness:

| Component | Harness | Key Methods |
|---|---|---|
| `MatButton` | `MatButtonHarness` | `click()`, `getText()`, `isDisabled()` |
| `MatDialog` | `MatDialogHarness` | `close()`, `getTitle()`, `getActions()` |
| `MatTable` | `MatTableHarness` | `getRows()`, `getCells()`, `getHeaderRows()` |
| `MatSelect` | `MatSelectHarness` | `open()`, `getOptions()`, `clickOptions()` |
| `MatInput` | `MatInputHarness` | `getValue()`, `setValue()`, `isRequired()` |
| `MatDatepicker` | `MatDatepickerInputHarness` | `openCalendar()`, `getValue()` |

## angular/angular-cli

| Aspect | Detail |
|---|---|
| Framework | Jasmine (unit), Playwright (E2E) |
| Key pattern | Schematic testing with `SchematicTestRunner` |
| Build tests | Project creation and build verification |

### Schematic Testing

```typescript
// packages/schematics/angular/component/index_spec.ts
describe('component schematic', () => {
  const runner = new SchematicTestRunner(
    '@schematics/angular',
    require.resolve('../collection.json')
  );

  it('should create component files', async () => {
    const tree = await runner.runSchematic('component', {
      name: 'foo',
      project: 'app',
    }, appTree);

    expect(tree.files).toContain('/projects/app/src/app/foo/foo.component.ts');
    expect(tree.files).toContain('/projects/app/src/app/foo/foo.component.html');
    expect(tree.files).toContain('/projects/app/src/app/foo/foo.component.spec.ts');
  });
});
```

## Common Conventions Across Angular Repos

1. **Jasmine + Karma** everywhere (CLI tests moving to Vitest)
2. **TestBed** is the universal testing entry point
3. **DI-based mocking** — provider replacement, not module patching
4. **Bazel** orchestrates test targets and dependencies
5. **Component Harness** pattern for all Material/CDK components
6. **`_spec.ts` naming** in the framework monorepo
7. **Integration test apps** validate the full framework
8. **fakeAsync/tick** for synchronous async testing via Zone.js
