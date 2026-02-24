# SvelteKit Testing

SvelteKit uses a dual testing strategy: co-located unit tests with Vitest, and full-app integration tests with Playwright.

## Unit Tests (Vitest)

Co-located `.spec.js` files test individual modules:

```javascript
// src/runtime/server/cookie.spec.js
import { describe, test, assert, expect } from 'vitest';
import { domain_matches, path_matches, get_cookies } from './cookie.js';

describe('domain_matches', () => {
  test('exact match', () => {
    assert.ok(domain_matches('example.com', 'example.com'));
  });

  test('subdomain match', () => {
    assert.ok(domain_matches('sub.example.com', '.example.com'));
  });
});
```

### Environment-Conditional Tests

Some tests behave differently in dev vs production:

```javascript
// src/runtime/server/cookie.spec.js
describe.skipIf(process.env.NODE_ENV === 'production')(
  'cookies in dev',
  () => {
    test('warns if cookie exceeds 4,129 bytes', () => {
      // dev-only warning assertion
    });
  }
);
```

Run with separate scripts:

```json
{
  "test:unit:dev": "vitest run",
  "test:unit:prod": "NODE_ENV=production vitest run csp.spec.js cookie.spec.js"
}
```

## E2E Tests (Playwright)

### Test App Architecture

Each E2E test uses a complete SvelteKit application as its fixture:

```
packages/kit/test/apps/basics/
  package.json
  playwright.config.js
  svelte.config.js
  vite.config.js
  src/
    app.html
    routes/
      +page.svelte
      adapter/
        dynamic/+page.server.js
      encoded/
        [slug]/+page.svelte
  test/
    test.js              # Client + server tests
    client.test.js       # Client-only tests
    server.test.js       # Server-only tests
```

### Dev and Build Modes

Each test app runs in both development and production modes:

```javascript
// playwright.config.js
export default defineConfig({
  webServer: {
    command: process.env.DEV
      ? 'pnpm dev'
      : 'pnpm build && pnpm preview',
    port: process.env.DEV ? 5173 : 4173
  }
});
```

### Extended Test Fixtures

SvelteKit extends Playwright's `test` with custom helpers:

```javascript
// test/utils.js
export const test = base.extend({
  app: ({ page }, use) => {
    void use({
      goto: (url, opts) =>
        page.evaluate(({ url, opts }) => goto(url, opts), { url, opts }),
      invalidate: (url) =>
        page.evaluate((url) => invalidate(url), url),
      preloadCode: (pathname) =>
        page.evaluate((pathname) => preloadCode(pathname), pathname),
      preloadData: (url) =>
        page.evaluate((url) => preloadData(url), url)
    });
  },

  clicknav: async ({ page, javaScriptEnabled }, use) => {
    // Click + wait for navigation
  },

  in_view: async ({ page }, use) => {
    // Viewport visibility check
  },

  read_errors: async ({}, use) => {
    // Error log reader
  },

  start_server: async ({}, use) => {
    // HTTP server fixture for testing external fetches
  }
});
```

### JS Enabled/Disabled Variants

Tests run in two Playwright projects — with and without JavaScript:

```javascript
// playwright.config.js
projects: [
  { name: `${browser}-${mode}`, use: { javaScriptEnabled: true } },
  { name: `${browser}-${mode}-no-js`, use: { javaScriptEnabled: false } }
]
```

Server-only tests skip when JS is enabled:

```javascript
// test/apps/basics/test/server.test.js
test.skip(({ javaScriptEnabled }) => javaScriptEnabled);

test('caching headers', async ({ page }) => {
  const response = await page.goto('/caching');
  expect(response.headers()['cache-control']).toBe('public, max-age=30');
});
```

### Example E2E Tests

```javascript
// test/apps/basics/test/test.js
import { expect } from '@playwright/test';
import { test } from '../../../utils.js';

test.describe.configure({ mode: 'parallel' });

test.describe('Encoded paths', () => {
  test('visits a route with non-ASCII character', async ({ page, clicknav }) => {
    await page.goto('/encoded');
    await clicknav('[href="/encoded/苗条"]');
    expect(await page.innerHTML('h1')).toBe('static');
  });
});

test.describe('Load function', () => {
  test('data is returned from load', async ({ page }) => {
    await page.goto('/load');
    expect(await page.textContent('h1')).toBe('Hello from load');
  });
});
```

## Mocking in Kit

### Path Aliasing

Kit's vitest config uses aliases to replace internal modules:

```javascript
// kit.vitest.config.js
alias: {
  '__sveltekit/paths': fileURLToPath(
    new URL('./test/mocks/path.js', import.meta.url)
  )
}
```

### `vi.mock()` for Module Mocking

```javascript
// src/exports/hooks/sequence.spec.js
import { vi } from 'vitest';

const dummy_event = vi.hoisted(
  () => /** @type {RequestEvent} */ ({
    tracing: { root: {} }
  })
);

vi.mock(import('@sveltejs/kit/internal/server'), async (actualPromise) => {
  const actual = await actualPromise();
  return {
    ...actual,
    get_request_store: () => ({
      event: dummy_event
    })
  };
});
```
