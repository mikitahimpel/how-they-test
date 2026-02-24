# Mocking Patterns

Angular's dependency injection system makes mocking straightforward — replace providers rather than patching modules.

## Jasmine Spies

The primary mocking tool in Angular's test suite:

```typescript
// packages/router/test/router_spec.ts
it('should call guard on navigation', () => {
  const guardSpy = jasmine.createSpy('canActivate').and.returnValue(true);

  TestBed.configureTestingModule({
    providers: [
      {provide: AuthGuard, useValue: {canActivate: guardSpy}},
    ],
  });

  const router = TestBed.inject(Router);
  router.navigate(['/protected']);

  expect(guardSpy).toHaveBeenCalled();
});
```

## Provider Replacement

The idiomatic Angular approach — swap entire services through DI:

```typescript
// packages/common/http/test/client_spec.ts
class MockBackend implements HttpHandler {
  handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    return of(new HttpResponse({body: {mock: true}}));
  }
}

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      HttpClient,
      {provide: HttpHandler, useClass: MockBackend},
    ],
  });
});
```

## HttpTestingController

Angular's built-in HTTP mock that intercepts requests:

```typescript
// packages/common/http/test/client_spec.ts
describe('HttpClient', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verify no outstanding requests
    httpTestingController.verify();
  });

  it('should make GET request', () => {
    httpClient.get('/api/items').subscribe(items => {
      expect(items).toEqual([{id: 1}]);
    });

    const req = httpTestingController.expectOne('/api/items');
    expect(req.request.method).toBe('GET');
    req.flush([{id: 1}]);
  });

  it('should handle errors', () => {
    httpClient.get('/api/items').subscribe({
      error: (err) => {
        expect(err.status).toBe(404);
      }
    });

    const req = httpTestingController.expectOne('/api/items');
    req.flush('Not found', {status: 404, statusText: 'Not Found'});
  });
});
```

## SpyLocation

Custom location spy for router testing:

```typescript
// packages/router/test/integration_spec.ts
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [RouterTestingModule.withRoutes(routes)],
  });
});

it('should update location on navigation', async () => {
  const router = TestBed.inject(Router);
  const location = TestBed.inject(Location);

  await router.navigate(['/about']);
  expect(location.path()).toBe('/about');

  await router.navigate(['/contact']);
  expect(location.path()).toBe('/contact');
});
```

## Value Providers

Simple mock objects for straightforward dependencies:

```typescript
// packages/core/test/di/injector_spec.ts
const mockConfig = {
  apiUrl: 'http://test.api',
  debug: true,
  features: ['feature-a'],
};

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      {provide: APP_CONFIG, useValue: mockConfig},
    ],
  });
});
```

## Factory Providers

For mocks that need initialization logic:

```typescript
// packages/core/test/render3/component_spec.ts
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: Logger,
        useFactory: () => {
          const logger = jasmine.createSpyObj('Logger', ['log', 'warn', 'error']);
          logger.log.and.callFake((...args: any[]) => {
            // Capture for assertions
            capturedLogs.push(args);
          });
          return logger;
        },
      },
    ],
  });
});
```

## createSpyObj

Jasmine's `createSpyObj` is heavily used for service mocks:

```typescript
// packages/router/test/router_spec.ts
const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
routerSpy.navigate.and.returnValue(Promise.resolve(true));
routerSpy.events = new Subject<Event>();

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      {provide: Router, useValue: routerSpy},
    ],
  });
});
```

## Platform Mocking

Tests mock browser APIs through Angular's platform abstraction:

```typescript
// packages/platform-browser/test/dom_spec.ts
@Injectable()
class MockDocument {
  createElement = jasmine.createSpy('createElement');
  querySelector = jasmine.createSpy('querySelector');
}

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      {provide: DOCUMENT, useClass: MockDocument},
    ],
  });
});
```

## No Module Mocking

Angular's internal tests virtually never use `jest.mock()` or equivalent module-level mocking. The DI system makes it unnecessary — everything is replaceable through providers. This is a fundamental architectural choice that shapes the entire testing approach.
