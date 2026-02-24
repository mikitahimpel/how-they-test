# Component Testing

Angular has two major patterns for component testing: direct `ComponentFixture` testing and the newer `ComponentHarness` pattern from `@angular/cdk/testing`.

## ComponentFixture Pattern

The traditional approach — create a component, trigger change detection, query the DOM:

```typescript
// packages/core/test/render3/component_spec.ts
describe('TodoList', () => {
  let fixture: ComponentFixture<TodoListComponent>;
  let component: TodoListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TodoListComponent, TodoItemComponent],
      providers: [
        {provide: TodoService, useClass: MockTodoService},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    component = fixture.componentInstance;
  });

  it('should render todos', () => {
    component.todos = [{id: 1, text: 'Test', done: false}];
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('app-todo-item');
    expect(items.length).toBe(1);
  });

  it('should toggle todo on click', () => {
    component.todos = [{id: 1, text: 'Test', done: false}];
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();

    expect(component.todos[0].done).toBe(true);
  });
});
```

## DebugElement Queries

Angular provides `DebugElement` for richer DOM querying:

```typescript
// packages/core/test/render3/query_spec.ts
it('should query by directive', () => {
  fixture.detectChanges();

  const debugEl = fixture.debugElement;

  // Query by CSS
  const title = debugEl.query(By.css('.title'));
  expect(title.nativeElement.textContent).toContain('Hello');

  // Query by directive
  const children = debugEl.queryAll(By.directive(ChildComponent));
  expect(children.length).toBe(3);

  // Access component instance
  const child = children[0].componentInstance as ChildComponent;
  expect(child.name).toBe('first');
});
```

## Component Harness Pattern

The CDK testing library (`@angular/cdk/testing`) provides `ComponentHarness` — an abstraction layer that makes tests resilient to template changes:

```typescript
// components/src/material/button/testing/button-harness.ts
export class MatButtonHarness extends ComponentHarness {
  static hostSelector = '[mat-button], [mat-raised-button], [mat-flat-button]';

  async click(): Promise<void> {
    return (await this.host()).click();
  }

  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  async isDisabled(): Promise<boolean> {
    const disabled = await (await this.host()).getAttribute('disabled');
    return disabled === '';
  }
}
```

Usage in tests:

```typescript
// components/src/material/button/button.spec.ts
describe('MatButton', () => {
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatButtonModule],
      declarations: [ButtonTestComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ButtonTestComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should load button harnesses', async () => {
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    expect(buttons.length).toBe(3);
  });

  it('should get button text', async () => {
    const button = await loader.getHarness(MatButtonHarness);
    expect(await button.getText()).toBe('Submit');
  });

  it('should handle disabled state', async () => {
    const button = await loader.getHarness(
      MatButtonHarness.with({text: 'Disabled'})
    );
    expect(await button.isDisabled()).toBe(true);
  });
});
```

## Harness Filters

Harnesses support declarative filtering:

```typescript
// components/src/material/select/testing/select-harness-filters.ts
export interface SelectHarnessFilters extends BaseHarnessFilters {
  value?: string | RegExp;
  disabled?: boolean;
}

// Usage
const select = await loader.getHarness(
  MatSelectHarness.with({value: /Option/})
);
```

## TestElement Abstraction

The CDK `TestElement` abstracts browser interaction, making harnesses work across environments (unit tests, Protractor, Playwright):

```typescript
// cdk/testing/test-element.ts
export interface TestElement {
  blur(): Promise<void>;
  clear(): Promise<void>;
  click(relativeX?: number, relativeY?: number): Promise<void>;
  focus(): Promise<void>;
  getAttribute(name: string): Promise<string | null>;
  hasClass(name: string): Promise<boolean>;
  sendKeys(...keys: (string | TestKey)[]): Promise<void>;
  text(): Promise<string>;
  // ...
}
```

## Change Detection in Tests

Angular requires explicit change detection triggering in tests:

```typescript
it('should update view after input change', () => {
  // Set input
  component.title = 'New Title';

  // View not yet updated
  expect(fixture.nativeElement.querySelector('h1').textContent).not.toContain('New Title');

  // Trigger change detection
  fixture.detectChanges();

  // Now view is updated
  expect(fixture.nativeElement.querySelector('h1').textContent).toContain('New Title');
});
```

With `ComponentFixtureAutoDetect` for automatic change detection:

```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      {provide: ComponentFixtureAutoDetect, useValue: true},
    ],
  });
});
```

## Directive Testing

Directives are tested via host components:

```typescript
// packages/common/test/directives/ng_if_spec.ts
@Component({
  template: `<div *ngIf="show">Content</div>`,
})
class TestComponent {
  show = true;
}

describe('NgIf', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [CommonModule],
    });
  });

  it('should add/remove DOM elements', () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('div')).toBeTruthy();

    fixture.componentInstance.show = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('div')).toBeNull();
  });
});
```
