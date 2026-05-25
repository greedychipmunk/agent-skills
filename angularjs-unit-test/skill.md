---
name: angularjs-unit-testing
description: Use this skill for AngularJS unit testing, maintenance, and migration tasks
---

# AngularJS Unit Testing Skill

## Overview

This skill focuses on writing, refactoring, and maintaining unit tests for AngularJS applications, with guidance for teams keeping legacy code healthy while planning a move to modern Angular.

## Legacy Status & Migration Guidance

AngularJS reached end-of-life in December 2021. Treat it as a legacy maintenance platform:
- No new features; only critical security fixes and targeted maintenance
- New projects should use Angular 19+ (the modern Angular framework)
- This skill exists to support teams maintaining existing AngularJS codebases and planning migrations

**Migration path: AngularJS → Angular**
- Modules / services / controllers → NgModules or standalone components, injectable services, and component classes
- `$scope` / `$rootScope` → component state, `@Input()` / `@Output()`, and modern change detection
- `$http` / `$resource` → `HttpClient`
- Directives → components/directives with modern APIs
- `$q` / digest cycle → RxJS, promises/async-await, and Angular lifecycle hooks
- `$routeProvider` → Angular Router
- Globals and ad-hoc DOM access → dependency injection and testable abstractions

## Skill Capabilities

### Core Testing Competencies

- **Controllers**: Write tests for controller logic, state management, and event handling
- **Services**: Test factory/service dependencies, HTTP calls, and business logic
- **Filters**: Validate filter transformations and edge cases
- **Directives**: Test directive compilation, linking, and DOM manipulation
- **HTTP Mocking**: Mock HTTP calls using `$httpBackend` for legacy Jasmine suites or Jest-friendly mocks for modern suites
- **Promises & Async**: Handle `$q`, deferred objects, and `$timeout`
- **Dependency Injection**: Test with mocked and real dependencies
- **Scope Management**: Test scope lifecycle, watchers, and event broadcasting
- **Coverage Analysis**: Generate and interpret code coverage reports
- **Test Organization**: Structure tests following best practices and maintainability principles
- **Framework Choice**: Prefer Jest by default; keep Jasmine/Karma for legacy suites only

### Testing Patterns

This skill implements the following testing patterns:

1. **AAA Pattern (Arrange-Act-Assert)**
   - Organize tests with clear setup, execution, and verification phases
   - Improves readability and maintainability

2. **Mocking & Spying**
   - Use Jasmine spies or Jest mocks to mock functions and verify calls
   - Mock HTTP responses and service dependencies
   - Simulate user interactions

3. **Test Fixtures**
   - Create reusable test data and helper functions
   - Use beforeEach/afterEach for common setup/teardown
   - Reduce test duplication

4. **Edge Case Testing**
   - Test boundary conditions, empty states, and error scenarios
   - Validate error handling and graceful degradation
   - Test asynchronous operations and race conditions

5. **Snapshot Testing** (Jest)
   - Capture expected component output
   - Detect unintended changes in UI rendering

6. **Deterministic Async**
   - Prefer fake timers, controlled promises, and isolated state over timing-sensitive assertions

## Testing Frameworks & Test Runners

### Jasmine (Legacy Default)

Jasmine remains the safest choice when you are preserving an existing AngularJS + Karma suite.

**Key Concepts**:
- `describe()`: Group related tests into a test suite
- `it()`: Define individual test cases
- `expect()`: Create assertions
- `beforeEach()` / `afterEach()`: Setup and teardown hooks
- `spyOn()` / `jasmine.createSpy()`: Mock functions and track calls

**Setup**:
```bash
npm install --save-dev jasmine karma karma-jasmine karma-chrome-launcher
```

**Use when**:
- You are maintaining an existing Jasmine/Karma suite
- You want the smallest possible change set for legacy AngularJS code

### Jest (Recommended)

Jest is the modern default for AngularJS test maintenance and migration work. It runs tests in parallel, has stronger mocking APIs, supports snapshots, and includes built-in coverage reporting.

**Key Concepts**:
- `describe()`: Group related tests
- `test()` or `it()`: Define individual test cases
- `expect()`: Create assertions
- `beforeEach()` / `afterEach()`: Setup and teardown hooks
- `jest.fn()`: Create mock functions
- `jest.spyOn()`: Spy on existing methods
- `jest.mock()`: Mock modules

**Setup**:
```bash
npm install --save-dev jest jest-preset-angular angular-mocks
npm install @angular/core
```

**Jest Configuration** (`jest.config.js`):
```javascript
module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.js'],
  transform: {
    '^.+\.js$': 'babel-jest'
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.spec.js']
};
```

**Use when**:
- You want faster feedback from parallel execution
- You need better mocking, snapshots, and coverage out of the box
- You are preparing an AngularJS codebase for an Angular migration

### Karma (Legacy Runner)

Karma is the legacy browser test runner traditionally paired with Jasmine. It is still usable for existing suites, but it has seen no major releases since 2021 and should not be the basis for new investment.

**Configuration**:
- `karma.conf.js`: Main configuration file
- Specifies browser environment, files to load, and plugins
- Supports code coverage reporting and CI integration

## Jest Migration Guide

Use these steps when moving an AngularJS test suite from Jasmine/Karma to Jest:

1. **Install the core tooling**
   ```bash
   npm install --save-dev jest jest-preset-angular angular-mocks
   npm install @angular/core
   ```
   Add `@angular/core` when the repo is hybrid or actively migrating toward Angular.

2. **Create a Jest setup file**
   - Add `setup-jest.js` or `setup-jest.ts`
   - Load `angular`, `angular-mocks`, and any shared test polyfills there

3. **Configure Jest for AngularJS files**
   - Use `jest.config.js` with `testEnvironment: 'jsdom'`
   - Add a transform for legacy JavaScript sources
   - Keep template or DOM-specific setup in the Jest bootstrap file

4. **Load AngularJS modules in Jest**
   ```javascript
   beforeEach(() => {
     require('angular');
     require('angular-mocks');
     angular.mock.module('myApp');
   });
   ```

5. **Migrate spies and stubs**
   - `spyOn(obj, 'method')` → `jest.spyOn(obj, 'method')`
   - `jasmine.createSpy()` → `jest.fn()`
   - `jasmine.createSpyObj()` → `jest.fn()` or explicit mock objects

6. **Replace `$httpBackend` where practical**
   - Prefer `fetch` mocks or MSW for new Jest tests
   - Keep `$httpBackend` only for legacy tests that are expensive to rewrite immediately

7. **Reset state between tests**
   - Use `jest.clearAllMocks()` / `jest.resetAllMocks()`
   - Recreate AngularJS modules and services in `beforeEach()`

## Handling Environmental Flakiness

Legacy AngularJS suites often fail because the environment is unstable, not because the code is broken.

**Common sources of flakiness**:
- Timing issues and race conditions
- Shared state between tests
- Browser environment differences
- Network-dependent tests and real external services
- Time zone, locale, and date-sensitive logic

**Deterministic test patterns**:
- Use fake timers for scheduled work and debounce/throttle logic
- Keep async work controlled with explicit promise resolution and digest flushing
- Reset shared state, mocks, and module caches in `afterEach()`
- Avoid real browser/network dependencies in unit tests
- Prefer fixed test data over generated or time-based values

**js-env-sanitizer pattern**:
- Snapshot and restore environment-dependent globals around each test
- Isolate `window`, `document`, `localStorage`, `Date`, `Math.random`, feature flags, and DOM mutations
- This is especially useful in long-lived AngularJS suites where hidden environment coupling causes intermittent failures

## Test Pyramid Guidance for Legacy Codebases

Legacy AngularJS codebases often have an inverted test pyramid: too many end-to-end tests and too few unit tests.

**Recommended shape**:
- **Base**: many fast unit tests for controllers, services, filters, and directives
- **Middle**: fewer integration tests for module wiring, routing, and API boundaries
- **Top**: a small number of end-to-end tests for critical user journeys only

**Guidance**:
- Shift coverage toward unit tests first
- Keep integration tests as the middle layer, not the base
- Use e2e tests sparingly because they are slower and more environment-sensitive

## Test Structure

### Jasmine Test Structure (Legacy Default)

All Jasmine tests follow this standard structure:

```javascript
describe('Component Name', function() {
  var componentUnderTest, dependencies;

  beforeEach(module('myApp'));

  beforeEach(inject(function($injector) {
    componentUnderTest = $injector.get('ComponentName');
    dependencies = $injector.get('DependencyName');
  }));

  afterEach(function() {
    // Cleanup code
  });

  describe('Functionality Group', function() {
    it('should do something specific', function() {
      // Arrange
      var input = 'test';

      // Act
      var result = componentUnderTest.method(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Jest Test Structure (Recommended)

Jest tests follow a similar structure with modern mocking and cleaner teardown:

```javascript
describe('Component Name', () => {
  let componentUnderTest;
  let dependency;

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup code or mock initialization
    dependency = { method: jest.fn() };
    componentUnderTest = require('./component');
  });

  afterEach(() => {
    // Cleanup code
  });

  describe('Functionality Group', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = componentUnderTest.method(input, dependency);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

**Key Differences**:
- Jest uses `jest.fn()` / `jest.spyOn()` instead of Jasmine spies for modern test code
- Jest uses `test()` or `it()` (both work)
- Jest auto-discovers `.spec.js` and `.test.js` files
- Jest provides built-in snapshot testing and code coverage

## Best Practices

### 1. Test Organization
- One test file per component (e.g., `controller.spec.js` for `controller.js`)
- Organize tests into logical groups using `describe()`
- Use meaningful test names that describe expected behavior

### 2. DRY Principle (Don't Repeat Yourself)
- Extract common setup into `beforeEach()` blocks
- Create reusable test data fixtures
- Use helper functions to reduce duplication

### 3. Test Independence
- Each test should be independent and runnable in any order
- Clean up resources in `afterEach()`
- Avoid shared state between tests

### 4. Realistic Mocks
- Mock external dependencies realistically
- Use actual data structures when possible
- Avoid overly simplified or unrealistic mocks

### 5. Comprehensive Coverage
- Aim for 80%+ code coverage
- Test happy paths, edge cases, and error scenarios
- Test async operations and race conditions

### 6. Performance
- Keep tests fast
- Use in-memory mocks instead of real HTTP requests
- Avoid unnecessary database operations

### 7. Maintainability
- Write tests that are easy to understand
- Use the AAA pattern for clarity
- Document complex test logic with comments
- Refactor tests when the component changes

## Common Testing Scenarios

### Testing Controllers

```javascript
describe('UserController', function() {
  var $scope, controller;

  beforeEach(module('myApp'));
  beforeEach(inject(function($controller, $rootScope) {
    $scope = $rootScope.$new();
    controller = $controller('UserController', {
      $scope: $scope
    });
  }));

  it('should initialize with default values', function() {
    expect($scope.users).toBeDefined();
  });

  it('should load users on init', function() {
    expect($scope.users.length).toBeGreaterThan(0);
  });
});
```

### Testing Services

```javascript
describe('UserService', function() {
  var userService, $httpBackend;

  beforeEach(module('myApp'));
  beforeEach(inject(function(_UserService_, _$httpBackend_) {
    userService = _UserService_;
    $httpBackend = _$httpBackend_;
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should fetch users from API', function() {
    var expectedUsers = [{ id: 1, name: 'John' }];
    $httpBackend.expectGET('/api/users').respond(expectedUsers);

    userService.getUsers().then(function(users) {
      expect(users).toEqual(expectedUsers);
    });

    $httpBackend.flush();
  });
});
```

### Testing with Promises

```javascript
describe('PromiseService', function() {
  var service, $q, $rootScope;

  beforeEach(inject(function(_Service_, _$q_, _$rootScope_) {
    service = _Service_;
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  it('should handle promise resolution', function() {
    var deferred = $q.defer();
    var result;

    service.asyncOperation().then(function(data) {
      result = data;
    });

    deferred.resolve('success');
    $rootScope.$apply();

    expect(result).toBe('success');
  });
});
```

## Debugging Tests

### Jasmine Debugging

```javascript
// Skip a test
xit('should do something', function() { ... });

// Run only this test
fit('should do something', function() { ... });

// Console logging in tests
it('should debug', function() {
  console.log('Current state:', $scope);
  expect(true).toBe(true);
});
```

### Jest Debugging

```javascript
// Skip a test
test.skip('should do something', () => { ... });

// Run only this test
test.only('should do something', () => { ... });

// Debug with Node inspector
// Run: node --inspect-brk node_modules/.bin/jest --runInBand
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

### Jenkins Example

```groovy
pipeline {
  stages {
    stage('Test') {
      steps {
        sh 'npm ci'
        sh 'npm test'
        publishHTML([
          reportDir: 'coverage',
          reportFiles: 'index.html',
          reportName: 'Coverage Report'
        ])
      }
    }
  }
}
```

## Resources

- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Test Runner](https://karma-runner.github.io/)
- [Jest Documentation](https://jestjs.io/)
- [jest-preset-angular](https://github.com/thymikee/jest-preset-angular)
- [AngularJS Testing Guide](https://docs.angularjs.org/guide/unit-testing)
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Angular Update Guide](https://angular.dev/update-guide)

## Troubleshooting

### Tests not running
- Check that module is loaded: `beforeEach(module('myApp'))`
- Verify dependencies are injected: `beforeEach(inject(...))`
- Check for syntax errors

### Async tests timing out
- Ensure promises are resolved: `$rootScope.$apply()` or `$httpBackend.flush()`
- Use `done()` callback: `it('...', function(done) { ... done(); })`
- For Jest: use `async/await` or return a promise

### HTTP mocks not working
- Verify mock is set up before service call
- Check exact URL match in expectations
- Use `passThrough()` for unmocked requests

### Coverage gaps
- Review untested branches in coverage reports
- Test error conditions and edge cases
- Mock external dependencies properly

## Next Steps

1. **Start Small**: Write tests for a single component
2. **Choose the Right Runner**: Keep Jasmine/Karma only for legacy maintenance; prefer Jest for new work
3. **Understand Patterns**: Study the testing patterns guide
4. **Use Templates**: Reference template files for your component type
5. **Refine**: Improve tests based on coverage and feedback
6. **Automate**: Integrate tests into your CI/CD pipeline
7. **Plan the Migration**: Map AngularJS modules, controllers, and `$scope` usage to Angular components and services

---

**Specialization**: AngularJS Unit Testing with Jasmine and Jest  
**Version**: 2.0  
**Last Updated**: May 2026
