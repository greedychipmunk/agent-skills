# AngularJS Testing Reference Guide

**Frameworks**: Jasmine (recommended) and Jest

This reference covers APIs available in both Jasmine and Jest. Most APIs are identical or have direct equivalents.

## Jasmine API Reference

### Test Structure Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `describe(name, fn)` | Group tests into a suite | `describe('UserController', fn)` |
| `it(name, fn)` | Define a single test | `it('should initialize', fn)` |
| `beforeEach(fn)` | Run before each test | `beforeEach(function() { ... })` |
| `afterEach(fn)` | Run after each test | `afterEach(function() { ... })` |
| `beforeAll(fn)` | Run once before all tests | `beforeAll(function() { ... })` |
| `afterAll(fn)` | Run once after all tests | `afterAll(function() { ... })` |

### Expectations (Assertions)

| Matcher | Purpose | Example |
|---------|---------|---------|
| `toBe()` | Test exact equality (===) | `expect(result).toBe(42)` |
| `toEqual()` | Test deep equality | `expect(obj).toEqual({a: 1})` |
| `toMatch()` | Test regex match | `expect(text).toMatch(/pattern/)` |
| `toBeDefined()` | Test if defined | `expect(value).toBeDefined()` |
| `toBeUndefined()` | Test if undefined | `expect(value).toBeUndefined()` |
| `toBeNull()` | Test if null | `expect(value).toBeNull()` |
| `toBeTruthy()` | Test truthy value | `expect(value).toBeTruthy()` |
| `toBeFalsy()` | Test falsy value | `expect(value).toBeFalsy()` |
| `toContain()` | Test array/string contains | `expect(arr).toContain(item)` |
| `toThrow()` | Test function throws error | `expect(fn).toThrow()` |
| `toThrowError()` | Test specific error | `expect(fn).toThrowError(Error)` |
| `toHaveBeenCalled()` | Test spy was called | `expect(spy).toHaveBeenCalled()` |
| `toHaveBeenCalledWith()` | Test spy called with args | `expect(spy).toHaveBeenCalledWith(arg)` |
| `toHaveBeenCalledTimes()` | Test spy call count | `expect(spy).toHaveBeenCalledTimes(2)` |
| `toHaveClass()` | Test DOM element has class | `expect(element).toHaveClass('active')` |

### Negation

Add `.not` before any matcher to negate it:

```javascript
expect(result).not.toBe(expected);
expect(result).not.toEqual(obj);
expect(result).not.toHaveBeenCalled();
```

## Spies

### Creating Spies (Jasmine)

```javascript
// Spy on existing function
spyOn(object, 'methodName');

// Spy with return value
spyOn(object, 'methodName').and.returnValue('value');

// Spy that calls through to original
spyOn(object, 'methodName').and.callThrough();

// Spy that throws error
spyOn(object, 'methodName').and.throwError('error');

// Spy that calls fake implementation
spyOn(object, 'methodName').and.callFake(function(arg) {
  return arg * 2;
});

// Create standalone spy
var spy = jasmine.createSpy('spyName');
var spy = jasmine.createSpy('spyName').and.returnValue('value');

// Create spy object with multiple methods
var mockObj = jasmine.createSpyObj('mockName', ['method1', 'method2']);
```

### Spy Matchers

```javascript
// Verify spy was called
expect(spy).toHaveBeenCalled();

// Verify spy was called N times
expect(spy).toHaveBeenCalledTimes(3);

// Verify spy was called with specific arguments
expect(spy).toHaveBeenCalledWith(arg1, arg2);

// Get call info
expect(spy.calls.count()).toBe(2);
expect(spy.calls.argsFor(0)).toEqual([arg1, arg2]);
```

## AngularJS Testing Utilities

### Module Loading

```javascript
// Load module
beforeEach(module('myApp'));

// Load multiple modules
beforeEach(module('myApp', 'ngMock'));

// Configure module before injection
beforeEach(module(function($provide) {
  $provide.value('service', mockService);
}));
```

### Dependency Injection

```javascript
// Inject dependencies
beforeEach(inject(function($injector) {
  var service = $injector.get('ServiceName');
}));

// Inject with underscore wrapping (recommended)
beforeEach(inject(function(_$httpBackend_, _ServiceName_) {
  $httpBackend = _$httpBackend_;
  service = _ServiceName_;
}));

// Get service directly
var service = inject(function($injector) {
  return $injector.get('ServiceName');
});
```

### $httpBackend

```javascript
// Expect HTTP method
$httpBackend.expectGET('/api/users');
$httpBackend.expectPOST('/api/users', data);
$httpBackend.expectPUT('/api/users/1', data);
$httpBackend.expectDELETE('/api/users/1');
$httpBackend.expectPATCH('/api/users/1', data);

// Define response
$httpBackend.expectGET('/api/users').respond([users]);
$httpBackend.expectGET('/api/users').respond(200, [users]);
$httpBackend.expectGET('/api/users').respond(500, 'error');

// Match URL patterns
$httpBackend.expectGET(/^\/api\/users\/.+$/).respond([]);

// Flush pending requests
$httpBackend.flush();

// Verify no outstanding requests
$httpBackend.verifyNoOutstandingExpectation();
$httpBackend.verifyNoOutstandingRequest();
```

### $scope Testing

```javascript
// Create scope
var $scope = $rootScope.$new();

// Apply changes
$scope.name = 'test';
$rootScope.$apply();

// Watch for changes
$scope.$watch('name', function(newVal, oldVal) {
  console.log('Changed:', newVal);
});

// Trigger digest cycle
$rootScope.$digest();
```

### $timeout Testing

```javascript
// Mock timeout
beforeEach(inject(function(_$timeout_) {
  $timeout = _$timeout_;
}));

// After calling timeout code
$timeout.flush(); // Execute all pending timeouts

// Verify timeout was called
expect($timeout.verifyNoPendingTimers);
```

### Promise Testing

```javascript
// Inject $q and $rootScope
beforeEach(inject(function(_$q_, _$rootScope_) {
  $q = _$q_;
  $rootScope = _$rootScope_;
}));

// Create deferred object
var deferred = $q.defer();
var promise = deferred.promise;

// Test resolution
promise.then(function(result) {
  expect(result).toBe('success');
});

deferred.resolve('success');
$rootScope.$apply();

// Test rejection
promise.catch(function(error) {
  expect(error).toBe('error');
});

deferred.reject('error');
$rootScope.$apply();
```

## Jest API Reference

### Test Structure Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `describe(name, fn)` | Group tests into a suite | `describe('Component', fn)` |
| `test(name, fn)` | Define a single test | `test('should work', fn)` |
| `it(name, fn)` | Alias for test() | `it('should work', fn)` |
| `beforeEach(fn)` | Run before each test | `beforeEach(() => { ... })` |
| `afterEach(fn)` | Run after each test | `afterEach(() => { ... })` |
| `beforeAll(fn)` | Run once before all tests | `beforeAll(() => { ... })` |
| `afterAll(fn)` | Run once after all tests | `afterAll(() => { ... })` |

### Mock Functions

```javascript
// Create mock function
const mock = jest.fn();

// Mock with return value
const mock = jest.fn().mockReturnValue('value');

// Mock with implementation
const mock = jest.fn((arg) => arg * 2);

// Mock resolved value (Promise)
const mock = jest.fn().mockResolvedValue('success');

// Mock rejected value (Promise)
const mock = jest.fn().mockRejectedValue('error');

// Get call info
expect(mock).toHaveBeenCalled();
expect(mock).toHaveBeenCalledWith(arg);
expect(mock).toHaveBeenCalledTimes(2);
expect(mock.mock.calls[0]).toEqual([arg1, arg2]);
```

### Module Mocking

```javascript
// Mock entire module
jest.mock('./module');

// Mock with manual implementation
jest.mock('./module', () => ({
  method: jest.fn().mockReturnValue('value')
}));

// Clear mocks
jest.clearAllMocks();
jest.resetAllMocks();
```

### Snapshot Testing

```javascript
// Create snapshot
expect(component).toMatchSnapshot();

// Update snapshots (--updateSnapshot or -u flag)
jest.updateSnapshot();
```

## Comparison: Jasmine vs Jest

| Task | Jasmine | Jest |
|------|---------|------|
| **Mock function** | `jasmine.createSpy()` | `jest.fn()` |
| **Mock module** | Manual with `$provide` | `jest.mock()` |
| **HTTP mock** | `$httpBackend` | `jest.mock('axios')` |
| **Async test** | `done()` callback | `async/await` |
| **Coverage** | Istanbul plugin | Built-in |
| **Snapshots** | Not supported | Supported |

## Common Patterns

### Controller Testing Pattern

```javascript
describe('MyController', function() {
  var $scope, controller;

  beforeEach(module('myApp'));
  beforeEach(inject(function($controller, $rootScope) {
    $scope = $rootScope.$new();
    controller = $controller('MyController', {
      $scope: $scope
    });
  }));

  it('should initialize', function() {
    expect($scope.property).toBeDefined();
  });
});
```

### Service Testing Pattern

```javascript
describe('MyService', function() {
  var service, $httpBackend;

  beforeEach(module('myApp'));
  beforeEach(inject(function(_MyService_, _$httpBackend_) {
    service = _MyService_;
    $httpBackend = _$httpBackend_;
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should fetch data', function() {
    $httpBackend.expectGET('/api/data').respond([]);
    service.getData();
    $httpBackend.flush();
  });
});
```

## Tips & Tricks

1. **Use underscores for injection**: `_$httpBackend_` prevents variable shadowing
2. **Flush HTTP calls**: Always call `$httpBackend.flush()` after HTTP expectations
3. **Apply changes**: Call `$rootScope.$apply()` to trigger digest cycle
4. **Test async**: Use callbacks or promises depending on the service
5. **Mock realistically**: Mock services should behave like real services
6. **Isolate tests**: Each test should be independent
7. **Group related tests**: Use nested `describe()` blocks

---

**Last Updated**: January 10, 2026
