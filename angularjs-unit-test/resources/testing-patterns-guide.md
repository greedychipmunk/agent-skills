# AngularJS Testing Patterns Guide

**Tested with**: Jasmine (recommended) and Jest

These patterns work with both Jasmine and Jest testing frameworks. Code examples show Jasmine syntax, but Jest equivalents are noted where they differ.

## Recommended Testing Patterns

### 1. AAA Pattern (Arrange-Act-Assert)

**Pattern**: Every test consists of three distinct phases

```javascript
// JASMINE
describe('UserService', function() {
  var userService;

  beforeEach(inject(function(_UserService_) {
    userService = _UserService_;
  }));

  it('should calculate total age correctly', function() {
    // ARRANGE: Set up test data
    var users = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ];

    // ACT: Call the method being tested
    var total = userService.calculateTotalAge(users);

    // ASSERT: Verify the result
    expect(total).toBe(55);
  });
});
```

**Benefits**:
- Clear structure makes tests easy to read
- Each phase has a specific purpose
- Easier to debug failing tests

---

### 2. Given-When-Then Pattern

**Pattern**: BDD style describing setup, action, and result

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

  // GIVEN: The controller is initialized
  describe('GIVEN user list is populated', function() {
    // WHEN: User clicks delete button
    it('WHEN user deletes an item THEN it removes from list', function() {
      // Setup: GIVEN
      $scope.users = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];

      // Action: WHEN
      $scope.deleteUser(1);

      // Verification: THEN
      expect($scope.users.length).toBe(1);
      expect($scope.users[0].id).toBe(2);
    });
  });
});
```

**Benefits**:
- Natural language describes test scenarios
- Non-technical stakeholders can understand tests
- Clear cause-effect relationships

---

### 3. Test Fixtures Pattern

**Pattern**: Centralize reusable test data and setup

```javascript
describe('UserService', function() {
  var userService, mockData;

  // Define reusable test data
  beforeEach(function() {
    mockData = {
      validUser: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      },
      invalidUser: {
        id: null,
        name: '',
        email: 'invalid',
        age: -5
      },
      users: [
        { id: 1, name: 'John', active: true },
        { id: 2, name: 'Jane', active: false },
        { id: 3, name: 'Bob', active: true }
      ]
    };
  });

  beforeEach(inject(function(_UserService_) {
    userService = _UserService_;
  }));

  it('should validate user with valid data', function() {
    var result = userService.validate(mockData.validUser);
    expect(result.isValid).toBe(true);
  });

  it('should reject user with invalid data', function() {
    var result = userService.validate(mockData.invalidUser);
    expect(result.isValid).toBe(false);
  });

  it('should filter active users', function() {
    var active = userService.filterActive(mockData.users);
    expect(active.length).toBe(2);
  });
});
```

**Benefits**:
- Reduces test duplication
- Ensures consistent test data
- Easy to update test data in one place

---

### 4. Spy and Mock Pattern

**Pattern**: Use spies and mocks to isolate components

```javascript
describe('UserController with mocked service', function() {
  var $scope, controller, mockUserService;

  beforeEach(module('myApp'));

  // Create a mock service
  beforeEach(module(function($provide) {
    mockUserService = {
      getUsers: jasmine.createSpy('getUsers').and.returnValue([
        { id: 1, name: 'John' }
      ]),
      deleteUser: jasmine.createSpy('deleteUser').and.returnValue(true),
      updateUser: jasmine.createSpy('updateUser').and.callFake(function(user) {
        return Promise.resolve(user);
      })
    };

    $provide.value('UserService', mockUserService);
  }));

  beforeEach(inject(function($controller, $rootScope) {
    $scope = $rootScope.$new();
    controller = $controller('UserController', {
      $scope: $scope,
      UserService: mockUserService
    });
  }));

  it('should call UserService.getUsers on init', function() {
    expect(mockUserService.getUsers).toHaveBeenCalled();
  });

  it('should call UserService.deleteUser with correct ID', function() {
    $scope.deleteUser(1);
    expect(mockUserService.deleteUser).toHaveBeenCalledWith(1);
  });

  it('should track if user is being updated', function() {
    $scope.updateUser({ id: 1, name: 'Updated' });
    expect(mockUserService.updateUser).toHaveBeenCalled();
  });
});
```

**Benefits**:
- Isolates component from dependencies
- Tests component logic independently
- Can verify interactions with dependencies

---

### 5. Helper Function Pattern

**Pattern**: Create helper functions for common test operations

```javascript
describe('UserController with helpers', function() {
  var $scope, controller, $httpBackend;

  // Helper functions
  var createController = function(params) {
    return inject(function($controller, $rootScope) {
      $scope = $rootScope.$new();
      controller = $controller('UserController', params || {
        $scope: $scope
      });
    });
  };

  var mockHttpUser = function(id, name) {
    $httpBackend.expectGET('/api/users/' + id).respond({
      id: id,
      name: name
    });
  };

  var flushAndVerify = function() {
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
  };

  beforeEach(module('myApp'));
  beforeEach(inject(function(_$httpBackend_) {
    $httpBackend = _$httpBackend_;
  }));

  it('should load user data', function() {
    mockHttpUser(1, 'John');
    createController();

    flushAndVerify();
    expect($scope.user.name).toBe('John');
  });
});
```

**Benefits**:
- Reduces code duplication
- Makes tests more readable
- Easy to maintain common operations

---

### 6. Error Testing Pattern

**Pattern**: Verify error handling behavior

```javascript
describe('ErrorHandling', function() {
  var service, $httpBackend;

  beforeEach(module('myApp'));
  beforeEach(inject(function(_UserService_, _$httpBackend_) {
    service = _UserService_;
    $httpBackend = _$httpBackend_;
  }));

  it('should handle HTTP errors gracefully', function() {
    $httpBackend.expectGET('/api/users').respond(500, 'Server error');

    service.getUsers().then(
      function() { /* Should not be called */ },
      function(error) {
        expect(error).toBe('Server error');
      }
    );

    $httpBackend.flush();
  });

  it('should throw error for invalid input', function() {
    expect(function() {
      service.validateUser(null);
    }).toThrow();
  });

  it('should return error object for validation failures', function() {
    var result = service.validate({ email: 'invalid' });
    expect(result.errors).toContain('Invalid email');
  });
});
```

**Benefits**:
- Ensures error handling works correctly
- Tests error messages are helpful
- Verifies graceful degradation

---

### 7. Asynchronous Testing Pattern

**Pattern**: Handle promises, timeouts, and async operations

```javascript
describe('Async operations', function() {
  var service, $rootScope, $timeout;

  beforeEach(inject(function(_Service_, _$rootScope_, _$timeout_) {
    service = _Service_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
  }));

  // Pattern 1: Using $rootScope.$apply()
  it('should resolve promise and update scope', function() {
    var result;

    service.asyncOperation().then(function(data) {
      result = data;
    });

    $rootScope.$apply();
    expect(result).toBeDefined();
  });

  // Pattern 2: Using $timeout.flush()
  it('should handle timeout operations', function() {
    var called = false;

    $timeout(function() {
      called = true;
    }, 1000);

    expect(called).toBe(false);

    $timeout.flush();
    expect(called).toBe(true);
  });

  // Pattern 3: Using done() callback (Jasmine)
  it('should handle async with done callback', function(done) {
    service.asyncOperation().then(function(data) {
      expect(data).toBeDefined();
      done();
    });

    $rootScope.$apply();
  });
});
```

**Benefits**:
- Properly tests async behavior
- Prevents test execution before operations complete
- Verifies timing and order of operations

---

### 8. State Testing Pattern

**Pattern**: Verify component state transitions

```javascript
describe('Component state transitions', function() {
  var $scope, controller;

  beforeEach(module('myApp'));
  beforeEach(inject(function($controller, $rootScope) {
    $scope = $rootScope.$new();
    controller = $controller('MyController', {
      $scope: $scope
    });
  }));

  it('should initialize in IDLE state', function() {
    expect($scope.state).toBe('IDLE');
    expect($scope.isLoading).toBe(false);
  });

  it('should transition to LOADING when fetching', function() {
    $scope.fetchData();

    expect($scope.state).toBe('LOADING');
    expect($scope.isLoading).toBe(true);
  });

  it('should transition to LOADED after fetch completes', function() {
    $scope.fetchData();
    $scope.$apply(); // Simulate promise resolution

    expect($scope.state).toBe('LOADED');
    expect($scope.isLoading).toBe(false);
  });

  it('should transition to ERROR on fetch failure', function() {
    $scope.fetchData();
    $scope.handleError('Connection failed');

    expect($scope.state).toBe('ERROR');
    expect($scope.error).toBe('Connection failed');
  });
});
```

**Benefits**:
- Verifies component behaves correctly in different states
- Tests state transitions
- Catches state management bugs

---

## Anti-Patterns to Avoid

### ❌ Testing Implementation Details

```javascript
// BAD: Testing internal state
it('should set _initialized flag', function() {
  controller.init();
  expect(controller._initialized).toBe(true); // Implementation detail!
});

// GOOD: Testing behavior
it('should initialize and be ready to use', function() {
  controller.init();
  expect(controller.getData()).toBeDefined();
});
```

### ❌ Over-Mocking

```javascript
// BAD: Mocking too much
beforeEach(module(function($provide) {
  $provide.value('$http', mock$http);
  $provide.value('$timeout', mock$timeout);
  $provide.value('$q', mock$q);
  // ... 10 more mocks
}));

// GOOD: Mock only external dependencies
beforeEach(module(function($provide) {
  $provide.value('UserService', mockUserService);
}));
```

### ❌ Test Interdependence

```javascript
// BAD: Tests depend on execution order
var users;

it('should load users', function() {
  users = UserService.getUsers();
  expect(users).toBeDefined();
});

it('should have users from previous test', function() {
  expect(users.length).toBeGreaterThan(0); // Depends on previous test!
});

// GOOD: Each test is independent
it('should load users', function() {
  var users = UserService.getUsers();
  expect(users).toBeDefined();
});

it('should filter users correctly', function() {
  var users = [
    { active: true },
    { active: false }
  ];
  var active = UserService.filterActive(users);
  expect(active.length).toBe(1);
});
```

### ❌ Unclear Test Names

```javascript
// BAD: Vague test names
it('should work', function() { ... });
it('test 1', function() { ... });
it('error case', function() { ... });

// GOOD: Descriptive test names
it('should load user data from API when component initializes', function() { ... });
it('should display error message when API call fails with 500', function() { ... });
it('should filter active users from list', function() { ... });
```

---

## Choosing the Right Pattern

| Scenario | Pattern | Why |
|----------|---------|-----|
| Simple logic | AAA | Clear structure |
| User workflows | Given-When-Then | Natural language flow |
| Complex setup | Test Fixtures | Reduces duplication |
| Integration testing | Spy and Mock | Isolates components |
| Repeated operations | Helper Functions | Improves readability |
| Edge cases | Error Testing | Ensures robustness |
| Timing issues | Async Testing | Handles timing |
| Complex logic | State Testing | Tracks state changes |

---

**Last Updated**: January 10, 2026
