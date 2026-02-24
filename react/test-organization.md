# Test Organization

React's test organization follows a consistent pattern — `__tests__` directories co-located with source code, naming that reflects the test target, and a custom Jest CLI for monorepo orchestration.

## File Structure

Tests live in `__tests__` directories next to the source they test:

```
packages/react-dom/
  src/
    client/
      ReactDOM.js
      ReactDOMRoot.js
    events/
      ReactDOMEventListener.js
    __tests__/
      ReactDOM-test.js
      ReactDOMRoot-test.js
      ReactDOMFloat-test.js
      ReactDOMFizzServer-test.js
      ReactDOMServerRendering-test.js
```

## Naming Convention

Test files follow the pattern `{ModuleName}-test.js`:

```
ReactDOM-test.js
ReactDOMRoot-test.js
ReactHooks-test.js
ReactFiber-test.js
ReactScheduler-test.js
ReactSuspense-test.js
ReactCache-test.js
```

Some tests use descriptive names for specific scenarios:

```
ReactDOMServerPartialHydration-test.js
ReactDOMFizzServerBrowser-test.js
ReactConcurrentErrorRecovery-test.js
ReactSuspenseWithNoopRenderer-test.js
```

## Test Commands

```bash
# Run all tests
yarn test

# Run tests for a specific package
yarn test --selectProjects react-dom

# Filter by test name
yarn test --testPathPattern="ReactHooks"

# Run in specific mode
yarn test --build        # Test production build
yarn test --persistent   # Watch mode

# Run with specific feature flags
yarn test --experimental
yarn test --www
```

## Jest Configuration

React uses a custom Jest configuration that:

1. Maps module imports to source or build output depending on test mode
2. Configures the `@gate` pragma transformer
3. Sets up the Scheduler mock
4. Configures console interception

```javascript
// scripts/jest/config.source.js
module.exports = {
  moduleNameMapper: {
    '^react$': '<rootDir>/packages/react',
    '^react-dom$': '<rootDir>/packages/react-dom',
    '^react-noop-renderer$': '<rootDir>/packages/react-noop-renderer',
    '^scheduler$': '<rootDir>/packages/scheduler',
    '^internal-test-utils': '<rootDir>/packages/internal-test-utils',
  },
  transform: {
    '.*': require.resolve('./preprocessor'),
  },
  setupFiles: [
    require.resolve('./setupTests'),
  ],
};
```

## Fixture Apps

Full applications for integration testing:

```
fixtures/
  dom/                     # DOM rendering scenarios
    public/
    src/
      components/
      index.js
  flight/                  # React Server Components
    server/
    src/
  ssr/                     # Server-side rendering
  concurrent/              # Concurrent mode scenarios
```

Fixture apps use Playwright or manual browser testing for validation.

## Test Setup

Every test inherits shared setup from `scripts/jest/setupTests.js`:

```javascript
// scripts/jest/setupTests.js
global.__DEV__ = true;
global.__EXPERIMENTAL__ = process.env.RELEASE_CHANNEL === 'experimental';

// Install console interception
const originalConsoleError = console.error;
// ... intercept and track warnings
```
