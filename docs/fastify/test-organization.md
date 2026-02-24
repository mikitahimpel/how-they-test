# Test Organization

## Directory Structure

Tests live in a dedicated `test/` directory at the repo root — not co-located with source.

### fastify/fastify

```
test/
  404s.test.js
  500s.test.js
  async-await.test.js
  close.test.js
  decorator.test.js
  hooks-async.test.js
  inject.test.js
  register.test.js
  server.test.js
  helper.js                  # Shared test utilities
  toolkit.js                 # Callback coordination helpers
  plugin.helper.js           # Reusable test plugin
  input-validation.js        # Shared validation test data
  build/                     # Build-related tests
  bundler/                   # Bundler integration (esbuild, webpack)
  diagnostics-channel/       # Diagnostics channel tests
  esm/                       # ESM-specific tests (.mjs)
  http-methods/              # One file per HTTP method
  http2/                     # HTTP/2 protocol tests
  https/                     # HTTPS/TLS tests
  internals/                 # Tests for internal modules
  types/                     # TypeScript type tests (tsd)
```

## File Naming Conventions

Test files follow the pattern `<feature>.test.js`:

```
decorator.test.js
hooks-async.test.js
custom-parser.test.js
```

**Numbered splits** for large topics — when a single feature has too many tests:

```
route.1.test.js
route.2.test.js
route.3.test.js
...
route.8.test.js

stream.1.test.js
stream.2.test.js
...
stream.5.test.js

custom-parser.0.test.js
custom-parser.1.test.js
...
custom-parser.5.test.js
```

**Helper files** use descriptive names without `.test.`:

```
helper.js          # Main shared utilities
toolkit.js         # Callback coordination
plugin.helper.js   # Reusable test plugin
```

**ESM tests** use the `.test.mjs` extension to run under ESM module resolution.

## Plugin Repos

Plugin repositories follow the same flat `test/` directory pattern:

### fastify-cors

```
test/
  cors.test.js
  hooks.test.js
  preflight.test.js
```

### fastify-autoload

Exception — uses subdirectories organized by module system:

```
test/
  commonjs/             # CommonJS tests
    basic.js
    app.js
  module/               # ESM tests
    basic.js
  typescript/           # TypeScript integration
    basic.ts
  vitest/               # Vitest runner tests
    basic.test.ts
```

## Test Runners

```json
// fastify/fastify package.json
{
  "scripts": {
    "unit": "borp",
    "coverage": "c8 --reporter html borp --reporter=@jsumners/line-reporter",
    "test": "npm run lint && npm run unit && npm run test:typescript"
  }
}
```

Some smaller plugins run `node --test` directly:

```json
// fastify-cors package.json
{
  "scripts": {
    "test:unit": "c8 --100 node --test"
  }
}
```
