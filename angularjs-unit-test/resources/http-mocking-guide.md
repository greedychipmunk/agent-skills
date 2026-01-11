# HTTP Mocking Guide for AngularJS Testing

## Complete Guide to $httpBackend Mocking

### Overview

The `$httpBackend` service is a mock HTTP backend for AngularJS testing. It allows you to define expected HTTP requests and specify responses without making actual network calls.

## Basic HTTP Mocking

### Expecting HTTP Requests

```javascript
// GET request
$httpBackend.expectGET('/api/users').respond([
  { id: 1, name: 'John' }
]);

// POST request
$httpBackend.expectPOST('/api/users', { name: 'Jane' }).respond({
  id: 2,
  name: 'Jane'
});

// PUT request
$httpBackend.expectPUT('/api/users/1', { name: 'John Updated' }).respond({
  id: 1,
  name: 'John Updated'
});

// DELETE request
$httpBackend.expectDELETE('/api/users/1').respond('');

// PATCH request
$httpBackend.expectPATCH('/api/users/1', { status: 'active' }).respond({
  id: 1,
  status: 'active'
});
```

### Response Formats

```javascript
// Simple response (status 200)
$httpBackend.expectGET('/api/users').respond([users]);

// Response with status code
$httpBackend.expectGET('/api/users').respond(200, [users]);

// Response with status and headers
$httpBackend.expectGET('/api/users').respond(200, [users], {
  'X-Custom-Header': 'value'
});

// Error response
$httpBackend.expectGET('/api/users').respond(500, 'Server error');
$httpBackend.expectGET('/api/users').respond(404, 'Not found');
$httpBackend.expectGET('/api/users').respond(400, { error: 'Bad request' });
```

## URL Pattern Matching

### Exact URL Match

```javascript
$httpBackend.expectGET('/api/users').respond([]);
```

### Regex Pattern Matching

```javascript
// Match any user ID
$httpBackend.expectGET(/^\/api\/users\/\d+$/).respond({
  id: 1,
  name: 'John'
});

// Match multiple endpoints
$httpBackend.expectGET(/^\/api\/(users|posts)$/).respond([]);

// Match with query parameters
$httpBackend.expectGET(/^\/api\/users\?.*$/).respond([]);
```

### Custom Matching Functions

```javascript
$httpBackend.expectGET(function(url) {
  return url.indexOf('/api/users') !== -1;
}).respond([]);
```

## Request Data Matching

### Exact Data Match

```javascript
var userData = { name: 'John', email: 'john@example.com' };

$httpBackend.expectPOST('/api/users', userData).respond({
  id: 1,
  ...userData
});
```

### Partial Data Match

```javascript
// Match POST with any data
$httpBackend.expectPOST('/api/users', function(data) {
  // Return true if data matches your criteria
  return data.name && data.email;
}).respond({ id: 1 });
```

### Function Matching

```javascript
$httpBackend.expectPOST('/api/users', function(data) {
  var parsed = JSON.parse(data);
  return parsed.name === 'John';
}).respond(201, { id: 1, name: 'John' });
```

## Multiple Requests

### Sequential Requests

```javascript
// Each expectation is matched in order
$httpBackend.expectGET('/api/users').respond([user1]);
$httpBackend.expectGET('/api/users').respond([user2]);

service.getUsers(); // First call matches first expectation
service.getUsers(); // Second call matches second expectation

$httpBackend.flush();
```

### Multiple Times

```javascript
// Allow same endpoint to be called multiple times
$httpBackend.expectGET('/api/users').respond([users]);
$httpBackend.expectGET('/api/users').respond([users]);

// Or use whenGET for unlimited calls
$httpBackend.whenGET('/api/users').respond([users]);

service.getUsers();
service.getUsers();
service.getUsers();

$httpBackend.flush();
```

## Expectations vs When

### Using expectGET/expectPOST

```javascript
// Must be called exactly as specified
$httpBackend.expectGET('/api/users').respond([]);

// Test will fail if not called
$httpBackend.verifyNoOutstandingExpectation();
```

### Using whenGET/whenPOST

```javascript
// Can be called any number of times
$httpBackend.whenGET('/api/users').respond([]);

// Will not fail if not called
// Useful for optional requests
```

### When to Use Each

```javascript
// expectGET: Verify specific requests are made
$httpBackend.expectGET('/api/users').respond([users]);
$httpBackend.expectGET('/api/users/1').respond(user1);

// whenGET: Define default responses for any request
$httpBackend.whenGET(/^\/api\/.*/).respond([]);
$httpBackend.whenPOST('/api/data', angular.identity).respond(201);
```

## Complete HTTP Mocking Example

```javascript
describe('UserService with HTTP mocking', function() {
  var userService, $httpBackend;

  beforeEach(module('myApp'));

  beforeEach(inject(function(_UserService_, _$httpBackend_) {
    userService = _UserService_;
    $httpBackend = _$httpBackend_;
  }));

  afterEach(function() {
    // Verify all expected requests were made
    $httpBackend.verifyNoOutstandingExpectation();
    // Verify no unexpected requests were made
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('GET requests', function() {
    it('should fetch all users', function() {
      var expectedUsers = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];

      $httpBackend.expectGET('/api/users').respond(expectedUsers);

      var result;
      userService.getUsers().then(function(data) {
        result = data;
      });

      $httpBackend.flush();

      expect(result).toEqual(expectedUsers);
    });

    it('should fetch single user by ID', function() {
      var expectedUser = { id: 1, name: 'John' };

      // Use regex for dynamic IDs
      $httpBackend.expectGET(/^\/api\/users\/\d+$/).respond(expectedUser);

      var result;
      userService.getUser(1).then(function(data) {
        result = data;
      });

      $httpBackend.flush();

      expect(result).toEqual(expectedUser);
    });

    it('should handle query parameters', function() {
      var expectedUsers = [{ id: 1, name: 'John', active: true }];

      $httpBackend.expectGET('/api/users?active=true').respond(expectedUsers);

      var result;
      userService.getActiveUsers().then(function(data) {
        result = data;
      });

      $httpBackend.flush();

      expect(result).toEqual(expectedUsers);
    });
  });

  describe('POST requests', function() {
    it('should create new user with correct data', function() {
      var newUserData = { name: 'Bob', email: 'bob@example.com' };
      var createdUser = { id: 3, ...newUserData };

      $httpBackend.expectPOST('/api/users', newUserData).respond(201, createdUser);

      var result;
      userService.createUser(newUserData).then(function(data) {
        result = data;
      });

      $httpBackend.flush();

      expect(result.id).toBe(3);
    });

    it('should create user with partial data matching', function() {
      $httpBackend.expectPOST('/api/users', function(data) {
        var user = JSON.parse(data);
        return user.name === 'Bob';
      }).respond(201, { id: 3, name: 'Bob' });

      var result;
      userService.createUser({ name: 'Bob', email: 'bob@example.com' })
        .then(function(data) {
          result = data;
        });

      $httpBackend.flush();

      expect(result.name).toBe('Bob');
    });
  });

  describe('PUT requests', function() {
    it('should update user with correct data', function() {
      var updates = { name: 'John Updated' };
      var updatedUser = { id: 1, name: 'John Updated' };

      $httpBackend.expectPUT('/api/users/1', updates).respond(updatedUser);

      var result;
      userService.updateUser(1, updates).then(function(data) {
        result = data;
      });

      $httpBackend.flush();

      expect(result.name).toBe('John Updated');
    });
  });

  describe('DELETE requests', function() {
    it('should delete user', function() {
      $httpBackend.expectDELETE('/api/users/1').respond(204, '');

      var result;
      userService.deleteUser(1).then(function(data) {
        result = data;
      });

      $httpBackend.flush();

      expect(result).toBeDefined();
    });
  });

  describe('Error handling', function() {
    it('should handle 404 errors', function() {
      $httpBackend.expectGET('/api/users/999').respond(404, 'Not found');

      var result;
      var error;

      userService.getUser(999)
        .then(function(data) {
          result = data;
        }, function(err) {
          error = err;
        });

      $httpBackend.flush();

      expect(error).toBeDefined();
    });

    it('should handle 500 server errors', function() {
      $httpBackend.expectGET('/api/users').respond(500, 'Server error');

      var error;

      userService.getUsers()
        .then(null, function(err) {
          error = err;
        });

      $httpBackend.flush();

      expect(error).toBeDefined();
    });

    it('should handle network timeouts', function() {
      var deferred = $q.defer();
      $httpBackend.expectGET('/api/users').respond(function() {
        return [0, null]; // 0 status code = no response
      });

      var error;
      userService.getUsers().then(null, function(err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error).toBeDefined();
    });
  });

  describe('Multiple requests', function() {
    it('should handle sequential requests', function() {
      var users = [{ id: 1, name: 'John' }];
      var newUser = { id: 2, name: 'Jane' };

      $httpBackend.expectGET('/api/users').respond(users);
      $httpBackend.expectPOST('/api/users').respond(newUser);

      var getResult, postResult;

      userService.getUsers().then(function(data) {
        getResult = data;
      });

      userService.createUser(newUser).then(function(data) {
        postResult = data;
      });

      $httpBackend.flush();

      expect(getResult).toEqual(users);
      expect(postResult).toEqual(newUser);
    });

    it('should handle multiple calls to same endpoint', function() {
      $httpBackend.whenGET('/api/data').respond([]);

      service.getData();
      service.getData();
      service.getData();

      $httpBackend.flush();
      // No verification error because whenGET allows multiple calls
    });
  });
});
```

## Tips & Best Practices

1. **Always use whenGET/whenPOST for optional endpoints** that might not be called
2. **Use regex matching for dynamic IDs** to reduce brittleness
3. **Verify no outstanding requests** with `$httpBackend.verifyNoOutstandingRequest()`
4. **Match request data carefully** to catch wrong API usage
5. **Test error responses** thoroughly
6. **Flush requests explicitly** with `$httpBackend.flush()`
7. **Clean up with afterEach** to catch leftover requests

## Common Pitfalls

```javascript
// ❌ Forgetting to flush requests
it('should work', function() {
  $httpBackend.expectGET('/api/users').respond([]);
  service.getUsers();
  // Forgot $httpBackend.flush()!
});

// ✅ Always flush
it('should work', function() {
  $httpBackend.expectGET('/api/users').respond([]);
  service.getUsers();
  $httpBackend.flush();
});

// ❌ Not verifying expectations
it('should work', function() {
  $httpBackend.expectGET('/api/users').respond([]);
  // Never called getUsers()
});

// ✅ Verify in afterEach
afterEach(function() {
  $httpBackend.verifyNoOutstandingExpectation();
});
```

---

**Last Updated**: January 10, 2026
