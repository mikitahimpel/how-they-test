# Rust Testing (SWC / Turbopack)

## Fixture-Based Compiler Testing

SWC transforms (used by Next.js for compilation) use Rust's `#[fixture]` macro with input/output file pairs.

### Structure

```
crates/next-custom-transforms/
  tests/
    fixture.rs                    # Test runner
    fixture/
      next-dynamic/
        basic/
          input.js                # Source code
          output-dev.js           # Expected dev output
          output-prod.js          # Expected prod output
          output-server.js        # Expected server output
          output-turbo-dev.js     # Expected Turbopack dev output
          output-turbo-prod.js    # Expected Turbopack prod output
      server-actions/
        basic/
          input.js
          output.js
      react-server-components/
        server-graph/
          input.js
          output.js
```

### Test Runner

```rust
// crates/next-custom-transforms/tests/fixture.rs
use testing::fixture;

#[fixture("tests/fixture/next-dynamic/**/input.js")]
fn next_dynamic_fixture(input: PathBuf) {
    let output_dev = input.parent().unwrap().join("output-dev.js");
    let output_prod = input.parent().unwrap().join("output-prod.js");
    let output_server = input.parent().unwrap().join("output-server.js");

    // Test dev mode transform
    test_fixture(
        syntax(),
        &|_tr| next_dynamic(
            /* is_development */ true,
            /* is_server_compiler */ false,
            /* is_react_server_layer */ false,
            FileName::Real(PathBuf::from("/some-project/src/some-file.js")),
            Some("/some-project".into()),
        ),
        &input,
        &output_dev,
        Default::default(),
    );

    // Test prod mode transform
    test_fixture(
        syntax(),
        &|_tr| next_dynamic(
            /* is_development */ false,
            /* ... */
        ),
        &input,
        &output_prod,
        Default::default(),
    );
}
```

### How `test_fixture` Works

1. Reads the input JavaScript file
2. Applies the SWC transform
3. Compares the output against the expected output file
4. If the expected output file doesn't exist, creates it (snapshot-like)
5. If the output differs, the test fails with a diff

### Multiple Output Variants

A single input can have 5+ expected outputs for different modes:

```
input.js
output-dev.js           # development mode
output-prod.js          # production mode
output-server.js        # server compilation
output-turbo-dev.js     # Turbopack dev mode
output-turbo-prod.js    # Turbopack prod mode
```

This ensures the same source code compiles correctly across all build configurations.

## Turbopack Crate Tests

Turbopack crates use standard Rust `#[test]` and `#[tokio::test]`:

```
turbopack/crates/
  turbopack-core/
    tests/
  turbopack-ecmascript/
    tests/
  turbopack-css/
    tests/
```

## Integration Point: TypeScript ↔ Rust

The Rust-compiled code is tested from the TypeScript side through the same e2e harness:

```
TypeScript e2e test
  → nextTestSetup({ files: __dirname })
    → next build (uses SWC/Turbopack internally)
      → next start
        → browser tests verify compiled output
```

When running with `TURBOPACK=1`, the same e2e tests exercise the Turbopack Rust code path instead of Webpack. This is how Rust code gets integration-tested from JavaScript.

## Key Insight

The Rust/TypeScript boundary is tested **at the integration level**, not by calling Rust functions from JavaScript tests. The compiler transforms have their own Rust-level fixture tests, and the full framework behavior is verified through the e2e harness. There's no FFI-level unit testing bridge.
