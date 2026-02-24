# Compiler Testing

Svelte is a compiler first. A large portion of its test suite verifies that source code transforms correctly into JavaScript and CSS output.

## Snapshot Tests

The snapshot tests compare compiled output against expected files. Each sample contains input Svelte code and expected client/server output.

### Sample Structure

```
snapshot/samples/my-test/
  _config.js            # Optional compile options
  main.svelte           # Input component
  _expected/
    client/
      main.svelte.js    # Expected client output
    server/
      main.svelte.js    # Expected server output
```

### How It Works

```typescript
// packages/svelte/tests/snapshot/test.ts
const { test, run } = suite(async (config, cwd) => {
  await compile_directory(cwd, 'client', config.compileOptions);
  await compile_directory(cwd, 'server', config.compileOptions);

  if (process.env.UPDATE_SNAPSHOTS) {
    fs.cpSync(`${cwd}/_output`, `${cwd}/_expected`, { recursive: true });
  } else {
    for (const file of actual) {
      expect(actual_content).toBe(expected_content);
    }
  }
});
```

Updating snapshots: `UPDATE_SNAPSHOTS=true pnpm test snapshot`

## Compiler Error Tests

Tests that invalid code produces the correct error with the right code and position.

```javascript
// compiler-errors/samples/expected-attribute-value/_config.js
export default test({
  error: {
    code: 'expected_attribute_value',
    message: 'Expected attribute value',
    position: [12, 12]
  }
});
```

The test runner calls `compile()` and asserts the thrown `CompileError` matches the expected code, message, and source position.

## CSS Tests

Test CSS scoping, unused style removal, and warnings:

```typescript
// packages/svelte/tests/css/test.ts
await compile_directory(cwd, 'client', {
  cssHash: () => 'svelte-xyz'
});

// Mount component, check rendered HTML matches expected.html
// Compare generated CSS against expected.css
// Verify warnings match config.warnings
```

CSS scope hashes are normalized to `svelte-xyz` for deterministic comparison.

### Expected Output

```
css/samples/scoped-class/
  _config.js
  main.svelte
  expected.html        # Expected DOM output
  expected.css         # Expected scoped CSS
```

## SSR Tests

Test server-rendered HTML output, with sync and async variants:

```typescript
// packages/svelte/tests/server-side-rendering/test.ts
suite_with_variants(
  ['sync', 'async'],
  // ... variant skip logic
  async (config, cwd) => {
    // Compile for server
    // Call render() from svelte/server
    // Compare body output against _expected.html
  }
);
```

### Expected SSR Output

```
server-side-rendering/samples/component-binding/
  _config.js
  main.svelte
  _expected.html       # Expected server-rendered HTML
```

Updating expected output: `SHOULD_UPDATE_EXPECTED=true pnpm test`

## Parser Tests

Verify the Svelte parser produces the correct AST:

```
parser-modern/samples/element-attributes/
  _config.js
  input.svelte         # Input to parse
  output.json          # Expected AST output
```

Both legacy and modern parser modes have their own test directories.

## Source Map Tests

Verify that source maps correctly map generated code back to Svelte source:

```
sourcemaps/samples/binding/
  _config.js
  main.svelte
  expected.js.map      # Expected source map
```

## Validation Tests

Test that the compiler produces the correct warnings for questionable patterns:

```javascript
// validator/samples/a11y-alt-text/_config.js
export default test({
  warnings: [
    {
      code: 'a11y_missing_attribute',
      message: '<img> element should have an alt attribute'
    }
  ]
});
```
