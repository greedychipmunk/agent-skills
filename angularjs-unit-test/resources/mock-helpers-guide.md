# Mock Helpers and Spy Techniques Guide

## Jasmine Spies

### Creating Spies

#### Spy on Existing Functions

```javascript
describe('Spying on functions', function() {
  var obj;

  beforeEach(function() {
    obj = {
      getValue: function() {
        return 42;
      }
    };
  });

  it('should track spy calls', function() {
    spyOn(obj, 'getValue');
    
    obj.getValue();
    
    expect(obj.getValue).toHaveBeenCalled();
  });
});
```

#### Return Values

```javascript
it('should return custom value', function() {
  spyOn(obj, 'getValue').and.returnValue(100);
  
  expect(obj.getValue()).toBe(100);
  expect(obj.getValue).toHaveBeenCalled();
});
```

#### Call Through

```javascript
it('should call original and track calls', function() {
  spyOn(obj, 'getValue').and.callThrough();
  
  var result = obj.getValue();
  
  expect(result).toBe(42); // Original value
  expect(obj.getValue).toHaveBeenCalled();
});
```

#### Custom Implementation

```javascript
it('should use custom implementation', function() {
  spyOn(obj, 'getValue').and.callFake(function() {
    return this.value || 99;
  });
  
  expect(obj.getValue()).toBe(99);
  expect(obj.getValue).toHaveBeenCalled();
});
```

#### Throw Errors

```javascript
it('should throw custom error', function() {
  spyOn(obj, 'getValue').and.throwError('Custom error');
  
  expect(function() {
    obj.getValue();
  }).toThrowError('Custom error');
});
```

### Standalone Spies

```javascript
describe('Standalone spies', function() {
  it('should create spy without object', function() {
    var spy = jasmine.createSpy('myspy').and.returnValue('value');
    
    spy(1, 2);
    
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(1, 2);
  });

  it('should create spy object', function() {
    var mockObj = jasmine.createSpyObj('mockObj', [
      'method1',
      'method2',
      'method3'
    ]);
    
    mockObj.method1('arg');
    
    expect(mockObj.method1).toHaveBeenCalledWith('arg');
    expect(mockObj.method2).not.toHaveBeenCalled();
  });
});
```

## Spy Matchers

```javascript
describe('Spy matchers', function() {
  var spy;

  beforeEach(function() {
    spy = jasmine.createSpy('spy');
  });

  it('should verify spy was called', function() {
    spy();
    expect(spy).toHaveBeenCalled();
  });

  it('should verify spy called with specific arguments', function() {
    spy('arg1', 'arg2');
    expect(spy).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should verify call count', function() {
    spy();
    spy();
    spy();
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('should access call information', function() {
    spy('a', 'b');
    spy('c', 'd');
    
    expect(spy.calls.count()).toBe(2);
    expect(spy.calls.argsFor(0)).toEqual(['a', 'b']);
    expect(spy.calls.argsFor(1)).toEqual(['c', 'd']);
    expect(spy.calls.first().args).toEqual(['a', 'b']);
    expect(spy.calls.mostRecent().args).toEqual(['c', 'd']);
  });

  it('should reset spy', function() {
    spy();
    expect(spy).toHaveBeenCalled();
    
    spy.calls.reset();
    expect(spy).not.toHaveBeenCalled();
  });
});
```

## Service Mocking Patterns

### Pattern 1: Using $provide.value

```javascript
describe('Service mocking with $provide.value', function() {
  var mockUserService = {
    getUser: jasmine.createSpy('getUser').and.returnValue({
      id: 1,
      name: 'John'
    }),
    updateUser: jasmine.createSpy('updateUser').and.returnValue(true)
  };

  beforeEach(module('myApp'));
  beforeEach(module(function($provide) {
    $provide.value('UserService', mockUserService);
  }));

  it('should use mock service', inject(function(UserService) {
    expect(UserService).toBe(mockUserService);
    expect(UserService.getUser()).toEqual({ id: 1, name: 'John' });
  }));
});
```

### Pattern 2: Using $provide.factory

```javascript
describe('Service mocking with $provide.factory', function() {
  beforeEach(module('myApp'));
  beforeEach(module(function($provide) {
    $provide.factory('UserService', function() {
      return {
        getUser: jasmine.createSpy('getUser').and.returnValue({
          id: 1,
          name: 'John'
        })
      };
    });
  }));

  it('should use mocked factory', inject(function(UserService) {
    var user = UserService.getUser();
    expect(user.name).toBe('John');
  }));
});
```

### Pattern 3: Partial Mocking

```javascript
describe('Partial service mocking', function() {
  var realService, mockService;

  beforeEach(module('myApp'));
  beforeEach(module(function($provide) {
    mockService = {
      // Mock only specific methods
      getUser: jasmine.createSpy('getUser').and.returnValue({
        id: 1,
        name: 'Mock User'
      }),
      // Let other methods use real implementation
      validateUser: jasmine.createSpy('validateUser').and.callFake(
        function(user) {
          return user && user.name;
        }
      )
    };

    $provide.value('UserService', mockService);
  }));

  it('should use partial mock', inject(function(UserService) {
    expect(UserService.getUser()).toEqual({ id: 1, name: 'Mock User' });
    expect(UserService.validateUser({ name: 'John' })).toBe(true);
  }));
});
```

## HTTP Interceptor Mocking

```javascript
describe('HTTP interceptor mocking', function() {
  var $httpBackend;

  beforeEach(module('myApp'));
  beforeEach(inject(function(_$httpBackend_) {
    $httpBackend = _$httpBackend_;
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should add authorization header', inject(function($http) {
    $httpBackend.expectGET('/api/users', function(headers) {
      return headers['Authorization'] === 'Bearer token123';
    }).respond([]);

    $http.get('/api/users');
    $httpBackend.flush();
  }));
});
```

## Mock State Management

```javascript
describe('Mock with state', function() {
  var mockUserService;

  beforeEach(function() {
    mockUserService = {
      users: [],
      
      addUser: jasmine.createSpy('addUser').and.callFake(function(user) {
        this.users.push(user);
        return user;
      }),
      
      getUsers: jasmine.createSpy('getUsers').and.callFake(function() {
        return this.users;
      }),
      
      clear: jasmine.createSpy('clear').and.callFake(function() {
        this.users = [];
      })
    };
  });

  beforeEach(module('myApp'));
  beforeEach(module(function($provide) {
    $provide.value('UserService', mockUserService);
  }));

  it('should manage state in mock', inject(function(UserService) {
    UserService.addUser({ id: 1, name: 'John' });
    UserService.addUser({ id: 2, name: 'Jane' });
    
    expect(UserService.getUsers().length).toBe(2);
    
    UserService.clear();
    expect(UserService.getUsers().length).toBe(0);
  }));
});
```

## Common Mock Objects

### Mock Promise

```javascript
describe('Mock promises', function() {
  var $q, $rootScope;

  beforeEach(inject(function(_$q_, _$rootScope_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  it('should create mock resolved promise', function() {
    var mockPromise = $q.when({ id: 1, name: 'John' });
    var result;

    mockPromise.then(function(data) {
      result = data;
    });

    $rootScope.$apply();

    expect(result).toEqual({ id: 1, name: 'John' });
  });

  it('should create mock rejected promise', function() {
    var mockPromise = $q.reject('Error message');
    var error;

    mockPromise.then(null, function(err) {
      error = err;
    });

    $rootScope.$apply();

    expect(error).toBe('Error message');
  });
});
```

### Mock $scope

```javascript
describe('Mock $scope', function() {
  var mockScope;

  beforeEach(function() {
    mockScope = {
      users: [],
      selectedUser: null,
      $watch: jasmine.createSpy('$watch'),
      $apply: jasmine.createSpy('$apply'),
      $emit: jasmine.createSpy('$emit'),
      $broadcast: jasmine.createSpy('$broadcast')
    };
  });

  it('should use mock scope', function() {
    mockScope.users.push({ id: 1, name: 'John' });
    
    expect(mockScope.users.length).toBe(1);
    expect(mockScope.$emit).not.toHaveBeenCalled();
    
    mockScope.$emit('userSelected', mockScope.users[0]);
    expect(mockScope.$emit).toHaveBeenCalledWith('userSelected', mockScope.users[0]);
  });
});
```

## Debugging with Spies

```javascript
describe('Debugging spies', function() {
  var spy;

  beforeEach(function() {
    spy = jasmine.createSpy('spy');
  });

  it('should debug spy calls', function() {
    spy('arg1', 'arg2');
    spy('arg3', 'arg4');

    // Print all calls
    console.log('Call count:', spy.calls.count());
    console.log('All calls:', spy.calls.all());
    console.log('First call:', spy.calls.first());
    console.log('Most recent:', spy.calls.mostRecent());

    // Check specific call
    if (spy.calls.count() > 0) {
      var args = spy.calls.argsFor(0);
      console.log('First call args:', args);
    }

    expect(spy).toHaveBeenCalled();
  });
});
```

## Best Practices

1. **Mock external dependencies**: HTTP, external APIs, browser APIs
2. **Keep mocks realistic**: Mock should behave like real service
3. **Use spyOn for tracking**: Verify services are called correctly
4. **Clear mocks between tests**: Prevent state pollution
5. **Document complex mocks**: Explain mock behavior
6. **Test with both mocks and real services**: Catch integration issues
7. **Use jasmine.createSpyObj for multiple methods**: Reduces boilerplate

## Common Patterns

```javascript
// Pattern 1: Simple mock
var mockService = {
  getData: jasmine.createSpy('getData').and.returnValue([])
};

// Pattern 2: State-aware mock
var mockService = {
  data: [],
  getData: jasmine.createSpy('getData').and.callFake(function() {
    return this.data;
  })
};

// Pattern 3: Multi-method mock
var mockService = jasmine.createSpyObj('MockService', [
  'getData',
  'saveData',
  'deleteData'
]);

// Pattern 4: Partial mock
var mockService = {
  ...realServiceInstance,
  expensiveMethod: jasmine.createSpy('expensiveMethod')
};
```

---

**Last Updated**: January 10, 2026
