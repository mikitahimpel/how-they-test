# TestBed Patterns

TestBed is Angular's central testing API. It creates a dynamically-configured Angular module for each test, enabling full dependency injection without touching real application modules.

## Basic TestBed Configuration

```typescript
// packages/core/test/di/injector_spec.ts
describe('MyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MyService,
        {provide: ApiClient, useClass: MockApiClient},
      ],
    });
  });

  it('should fetch data', () => {
    const service = TestBed.inject(MyService);
    expect(service.getData()).toEqual(expectedData);
  });
});
```

## Provider Overriding

The DI system allows surgical replacement of any dependency:

```typescript
// packages/common/http/test/client_spec.ts
describe('HttpClient', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  it('should make GET requests', () => {
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);

    http.get('/api/data').subscribe(data => {
      expect(data).toEqual({key: 'value'});
    });

    const req = controller.expectOne('/api/data');
    req.flush({key: 'value'});
    controller.verify();
  });
});
```

## Component TestBed

Components get their own configuration with template compilation:

```typescript
// packages/core/test/render3/component_spec.ts
describe('MyComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyComponent, ChildComponent],
      providers: [
        {provide: DataService, useValue: {items: ['a', 'b']}},
      ],
    }).compileComponents();
  });

  it('should render items', () => {
    const fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.item');
    expect(items.length).toBe(2);
  });
});
```

## Standalone Component Testing

With standalone components (Angular 14+), TestBed configuration is simpler:

```typescript
// No module declaration needed
describe('StandaloneComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandaloneComponent],
    })
    .overrideComponent(StandaloneComponent, {
      set: {
        imports: [MockChildComponent],
        providers: [{provide: DataService, useClass: MockDataService}],
      },
    })
    .compileComponents();
  });
});
```

## fakeAsync and tick

Angular's `fakeAsync` zone intercepts all async operations for synchronous testing:

```typescript
// packages/core/test/fake_async_spec.ts
it('should handle async operations synchronously', fakeAsync(() => {
  let value = '';

  setTimeout(() => { value = 'updated'; }, 1000);

  expect(value).toBe('');
  tick(1000);
  expect(value).toBe('updated');
}));

it('should handle microtasks', fakeAsync(() => {
  let resolved = false;

  Promise.resolve().then(() => { resolved = true; });

  expect(resolved).toBe(false);
  flushMicrotasks();
  expect(resolved).toBe(true);
}));
```

## waitForAsync

For tests that need real async execution:

```typescript
// packages/core/test/async_spec.ts
it('should handle real async', waitForAsync(() => {
  const service = TestBed.inject(DataService);

  service.fetchData().then(data => {
    expect(data).toBeDefined();
  });
}));
```

## TestBed.overrideProvider

Dynamic provider replacement at any point in setup:

```typescript
// packages/router/test/router_spec.ts
describe('Router with custom strategy', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot(routes)],
    });

    TestBed.overrideProvider(RouteReuseStrategy, {
      useClass: CustomReuseStrategy,
    });
  });

  it('should use custom strategy', () => {
    const strategy = TestBed.inject(RouteReuseStrategy);
    expect(strategy).toBeInstanceOf(CustomReuseStrategy);
  });
});
```

## Pattern: configureTestSuite

A common pattern for shared TestBed configuration:

```typescript
// Reusable setup across multiple describe blocks
function configureRouterTest(routes: Routes) {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes(routes)],
      providers: [
        {provide: APP_BASE_HREF, useValue: '/'},
      ],
    });
  });
}

describe('Router navigation', () => {
  configureRouterTest([
    {path: '', component: HomeComponent},
    {path: 'about', component: AboutComponent},
  ]);

  it('should navigate', () => {
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    router.navigate(['/about']);
    expect(location.path()).toBe('/about');
  });
});
```
