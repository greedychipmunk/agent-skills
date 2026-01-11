# AngularJS Unit Testing Skill

## Overview

This skill specializes in writing, refactoring, and maintaining high-quality unit tests for AngularJS applications using both **Jasmine** and **Jest**. It provides comprehensive guidance on testing controllers, services, filters, directives, and other AngularJS components.

## Skill Capabilities

### Core Testing Competencies

- **Controllers**: Write tests for controller logic, state management, and event handling
- **Services**: Test factory/service dependencies, HTTP calls, and business logic
- **Filters**: Validate filter transformations and edge cases
- **Directives**: Test directive compilation, linking, and DOM manipulation
- **HTTP Mocking**: Mock HTTP calls using `$httpBackend` (Jasmine) or `jest.mock()` (Jest)
- **Promises & Async**: Handle `$q`, deferred objects, and `$timeout`
- **Dependency Injection**: Test with mocked and real dependencies
- **Scope Management**: Test scope lifecycle, watchers, and event broadcasting
- **Coverage Analysis**: Generate and interpret code coverage reports
- **Test Organization**: Structure tests following best practices and maintainability principles
- **Framework Choice**: Understand when to use Jasmine vs Jest, or both

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

## Testing Frameworks & Test Runners

### Jasmine (Recommended for AngularJS)

Jasmine is a behavior-driven development (BDD) testing framework optimized for unit testing AngularJS applications.

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

### Jest (Modern Alternative)

Jest is a modern testing framework with powerful mocking, coverage, and snapshot testing capabilities. It can also test AngularJS applications with appropriate configuration.

**Key Concepts**:
- `describe()`: Group related tests (same as Jasmine)
- `test()` or `it()`: Define individual test cases
- `expect()`: Create assertions (Jasmine-compatible)
- `beforeEach()` / `afterEach()`: Setup and teardown hooks
- `jest.fn()`: Create mock functions
- `jest.mock()`: Mock modules

**Setup**:
```bash
npm install --save-dev jest jest-preset-angular @angular/core
```

**Jest Configuration** (package.json or jest.config.js):
```javascript
{
  "preset": "jest-preset-angular",
  "setupFilesAfterEnv": ["<rootDir>/setup-jest.ts"],
  "testPathIgnorePatterns": ["/node_modules/", "/dist/"],
  "collectCoverage": true,
  "collectCoverageFrom": ["src/**/*.js", "!src/**/*.spec.js"]
}
```

### Karma (Test Runner for Jasmine)

Karma is a test runner that executes Jasmine tests in real browsers and provides reporting.

**Configuration**:
- `karma.conf.js`: Main configuration file
- Specifies browser environment, files to load, and plugins
- Supports code coverage reporting and CI integration

## Test Structure

### Jasmine Test Structure (Recommended for AngularJS)

All Jasmine tests follow this standard structure:

```javascript
describe('Component Name', function() {
  var componentUnderTest, dependencies;

  // Load the module
  beforeEach(module('myApp'));

  // Inject dependencies
  beforeEach(inject(function($injector) {
    componentUnderTest = $injector.get('ComponentName');
    dependencies = $injector.get('DependencyName');
  }));

  // Cleanup after each test
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

### Jest Test Structure (Modern Alternative)

Jest tests follow a similar structure but with some differences:

```javascript
describe('Component Name', () => {
  let componentUnderTest;
  let dependencies;

  beforeEach(() => {
    // Setup code or mock initialization
    componentUnderTest = require('./component').default;
    dependencies = jest.mock('./dependency');
  });

  afterEach(() => {
    // Cleanup code
    jest.clearAllMocks();
  });

  describe('Functionality Group', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = componentUnderTest.method(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

**Key Differences**:
- Jest uses arrow functions (ES6) while Jasmine supports both
- Jest uses `test()` or `it()` (both work)
- Jest uses `jest.mock()` instead of Jasmine spies for module mocking
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
- Keep tests fast (< 100ms per test)
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
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

### Jenkins Example

```groovy
pipeline {
  stages {
    stage('Test') {
      steps {
        sh 'npm install'
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
- [Angular Testing Guide](https://angular.io/guide/testing)

## Troubleshooting

### Tests not running
- Check that module is loaded: `beforeEach(module('myApp'))`
- Verify dependencies are injected: `beforeEach(inject(...))`
- Check for syntax errors

### Async tests timing out
- Ensure promises are resolved: `$rootScope.$apply()` or `$httpBackend.flush()`
- Use `done()` callback: `it('...', function(done) { ... done(); })`
- For Jest: use `async/await` or return promise

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
2. **Understand Patterns**: Study the testing patterns guide
3. **Use Templates**: Reference template files for your component type
4. **Refine**: Improve tests based on coverage and feedback
5. **Automate**: Integrate tests into your CI/CD pipeline
6. **Share**: Document testing patterns for your team

---

**Specialization**: AngularJS Unit Testing with Jasmine and Jest  
**Version**: 1.0  
**Last Updated**: January 10, 2026
