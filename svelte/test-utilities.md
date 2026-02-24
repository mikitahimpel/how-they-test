# Test Utilities

Svelte's test infrastructure is built on custom utilities that power the fixture-based testing architecture.

## Suite Factories

The most critical infrastructure — `suite()` and `suite_with_variants()` dynamically discover and run test samples.

### `suite()` — Simple Suite

One test per sample directory:

```typescript
// packages/svelte/tests/suite.ts
export function suite<Test extends BaseTest>(
  fn: (config: Test, test_dir: string) => void
) {
  // Scans samples/ directory
  // Loads _config.js from each sample
  // Creates a Vitest it() call for each
  // Supports solo: true and skip: true in configs
}
```

Usage:

```typescript
// packages/svelte/tests/compiler-errors/test.ts
const { test, run } = suite(async (config, cwd) => {
  try {
    compile(input, config.compileOptions);
    assert.fail('Expected compilation error');
  } catch (e) {
    assert.deepEqual(e.code, config.error.code);
  }
});

run(__dirname);
```

### `suite_with_variants()` — Multi-Variant Suite

Runs each sample against multiple configurations:

```typescript
// packages/svelte/tests/suite.ts
export function suite_with_variants<Test, Variants, Common>(
  variants: Variants[],
  should_skip_variant: (variant, config, name) => boolean | 'no-test',
  common_setup: (config, dir) => Promise<Common> | Common,
  fn: (config, dir, variant, common) => void
) { ... }
```

Usage in runtime tests — each component runs in `dom` and `hydrate` variants:

```typescript
// packages/svelte/tests/runtime-runes/test.ts
suite_with_variants(
  ['dom', 'hydrate'],
  (variant, config) => {
    if (config.mode && !config.mode.includes(variant)) return 'skip';
    return false;
  },
  async (config, cwd) => {
    // Common setup: compile component
    return { compiled_client, compiled_server };
  },
  async (config, cwd, variant, common) => {
    // Per-variant: mount and run assertions
  }
);
```

### Test Filtering

Filter tests via the `FILTER` environment variable:

```bash
FILTER=my-test pnpm test         # exact match
FILTER=/feature/ pnpm test       # regex match
```

## HTML Comparison

Custom HTML comparison that normalizes before asserting:

```javascript
// packages/svelte/tests/html_equal.js
export function normalize_html(window, html, opts) {
  // Sorts attributes alphabetically
  // Collapses whitespace
  // Removes HTML comments
  // Normalizes CSS scope hashes (svelte-xxxxx → svelte-xyz123)
}

export const assert_html_equal = (actual, expected, message) => {
  const normalized_actual = normalize_html(window, actual);
  const normalized_expected = normalize_html(window, expected);
  assert.equal(normalized_actual, normalized_expected, message);
};
```

This handles the inherent non-determinism in HTML output — attribute order, whitespace differences, and generated CSS hashes.

## Animation Helpers

Mock animation/RAF system for transition tests:

```javascript
// packages/svelte/tests/animation-helpers.js
export const raf = {
  animations: new Set(),
  ticks: new Set(),
  time: 0,

  tick(ms) {
    this.time = ms;
    for (const animation of this.animations) {
      animation.update(ms);
    }
    for (const fn of this.ticks) {
      fn(ms);
    }
  },

  reset() {
    this.time = 0;
    this.animations.clear();
    this.ticks.clear();
    // Replace Svelte's internal RAF with mock
    svelte_raf.tick = (f) => { raf.ticks.add(f); };
    svelte_raf.now = () => raf.time;
    svelte_raf.tasks.clear();
  }
};
```

Usage in transition tests:

```javascript
// runtime-runes/samples/transition-fade/_config.js
export default test({
  test({ assert, target, raf }) {
    raf.tick(0);
    assert.equal(target.querySelector('div').style.opacity, '1');

    // Trigger transition
    raf.tick(250);
    assert.equal(target.querySelector('div').style.opacity, '0.5');

    raf.tick(500);
    assert.equal(target.querySelector('div').style.opacity, '0');
  }
});
```

## Console Interception

Runtime tests capture console output for assertion — using direct replacement rather than `vi.spyOn`:

```typescript
// packages/svelte/tests/runtime-legacy/shared.ts
const logs = [];
const warnings = [];
const errors = [];

console.log = (...args) => { logs.push(...args); };
console.warn = (...args) => { warnings.push(...args); };
console.error = (...args) => { errors.push(...args); };
```

These captured arrays are passed to each test's `test()` function for assertion.

## File Utilities

```javascript
// packages/svelte/tests/helpers.js

// Safe JSON loading (returns null if file doesn't exist)
export function try_load_json(file) { ... }

// Safe file reading (returns null if file doesn't exist)
export function try_read_file(file) { ... }

// Compile all .svelte and .js files in a directory
export async function compile_directory(cwd, generate, compileOptions) { ... }

// Check if expected output should be auto-updated
export function should_update_expected() {
  return process.env.SHOULD_UPDATE_EXPECTED === 'true';
}
```
