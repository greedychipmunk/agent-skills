/**
 * TEST FIXTURES AND HELPERS
 *
 * Shared test data and helper functions for AngularJS unit tests.
 * Reduces code duplication and maintains consistency across test suites.
 *
 * Usage:
 * - Import fixtures in your test files
 * - Use helper functions for common operations
 * - Extend fixtures for specific test needs
 * - Keep fixtures realistic and maintainable
 */

// ============================================================================
// MOCK DATA FIXTURES
// ============================================================================

/**
 * Mock user data
 */
var MockUsers = {
  valid: {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    phone: "555-1234",
    active: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  },

  inactive: {
    id: 2,
    name: "Jane Inactive",
    email: "jane.inactive@example.com",
    active: false,
  },

  noEmail: {
    id: 3,
    name: "Bob NoEmail",
    email: "",
    active: true,
  },

  list: [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      active: true,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      active: true,
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob@example.com",
      active: false,
    },
  ],

  create: function (overrides) {
    return angular.extend({}, this.valid, overrides);
  },
};

/**
 * Mock authentication data
 */
var MockAuth = {
  validCredentials: {
    username: "testuser",
    password: "password123",
  },

  invalidCredentials: {
    username: "testuser",
    password: "wrongpassword",
  },

  user: {
    id: 1,
    username: "testuser",
    email: "testuser@example.com",
    role: "admin",
    permissions: ["read", "write", "delete"],
  },

  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",

  invalidToken: "invalid.token.here",
};

/**
 * Mock API responses
 */
var MockResponses = {
  success: {
    status: 200,
    statusText: "OK",
    data: { message: "Success" },
  },

  created: {
    status: 201,
    statusText: "Created",
    data: { id: 1, message: "Resource created" },
  },

  badRequest: {
    status: 400,
    statusText: "Bad Request",
    data: { error: "Invalid request data" },
  },

  unauthorized: {
    status: 401,
    statusText: "Unauthorized",
    data: { error: "Authentication required" },
  },

  forbidden: {
    status: 403,
    statusText: "Forbidden",
    data: { error: "Insufficient permissions" },
  },

  notFound: {
    status: 404,
    statusText: "Not Found",
    data: { error: "Resource not found" },
  },

  conflict: {
    status: 409,
    statusText: "Conflict",
    data: { error: "Resource already exists" },
  },

  serverError: {
    status: 500,
    statusText: "Internal Server Error",
    data: { error: "Server error occurred" },
  },
};

/**
 * Mock form data
 */
var MockForms = {
  validUserForm: {
    $valid: true,
    $invalid: false,
    $pristine: true,
    $dirty: false,
    name: { $error: {} },
    email: { $error: {} },
    password: { $error: {} },
  },

  invalidUserForm: {
    $valid: false,
    $invalid: true,
    name: { $error: { required: true } },
    email: { $error: { email: true } },
    password: { $error: { minlength: true } },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a mock HTTP response
 * @param {number} status - HTTP status code
 * @param {object} data - Response data
 * @param {object} headers - Response headers
 */
function createMockResponse(status, data, headers) {
  return {
    status: status,
    statusText: "OK",
    data: data,
    headers: headers || {},
  };
}

/**
 * Creates a mock promise
 * @param {*} value - Resolved value
 * @param {*} error - Rejection reason
 */
function createMockPromise(value, error) {
  return {
    then: function (success, failure) {
      if (error && failure) {
        failure(error);
      } else if (value && success) {
        success(value);
      }
      return this;
    },
    catch: function (failure) {
      if (error && failure) {
        failure(error);
      }
      return this;
    },
  };
}

/**
 * Creates a mock deferred object
 */
function createMockDeferred() {
  var deferred = {};
  deferred.promise = new Promise(function (resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}

/**
 * Creates a spy for a service method
 * @param {object} service - The service object
 * @param {string} methodName - Method to spy on
 * @param {*} returnValue - Value to return
 */
function spyOnMethod(service, methodName, returnValue) {
  if (typeof jasmine !== "undefined") {
    return spyOn(service, methodName).and.returnValue(returnValue);
  }
}

/**
 * Creates a mock scope
 */
function createMockScope() {
  return {
    $watch: jasmine.createSpy("$watch"),
    $apply: jasmine.createSpy("$apply"),
    $digest: jasmine.createSpy("$digest"),
    $emit: jasmine.createSpy("$emit"),
    $broadcast: jasmine.createSpy("$broadcast"),
    $on: jasmine.createSpy("$on"),
    $destroy: jasmine.createSpy("$destroy"),
  };
}

/**
 * Creates a mock controller
 */
function createMockController($scope) {
  return {
    $scope: $scope,
    initialize: jasmine.createSpy("initialize"),
    load: jasmine.createSpy("load"),
    save: jasmine.createSpy("save"),
    delete: jasmine.createSpy("delete"),
  };
}

/**
 * Creates a mock service
 */
function createMockService() {
  return {
    getData: jasmine.createSpy("getData").and.returnValue(null),
    saveData: jasmine.createSpy("saveData").and.returnValue(true),
    deleteData: jasmine.createSpy("deleteData").and.returnValue(true),
    searchData: jasmine.createSpy("searchData").and.returnValue([]),
  };
}

/**
 * Compares two objects (shallow comparison)
 */
function objectsEqual(obj1, obj2) {
  var keys1 = Object.keys(obj1);
  var keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (var i = 0; i < keys1.length; i++) {
    var key = keys1[i];
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Deep clones an object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map(function (item) {
      return deepClone(item);
    });
  }

  var cloned = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * Waits for async operations to complete
 * @param {function} callback - Function to call when ready
 * @param {number} timeout - Timeout in ms
 */
function waitForAsync(callback, timeout) {
  setTimeout(callback, timeout || 100);
}

/**
 * Creates test user data
 */
function createTestUser(name, email) {
  return {
    id: Math.floor(Math.random() * 10000),
    name: name || "Test User",
    email: email || "test@example.com",
    active: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validates email format
 */
function isValidEmail(email) {
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generates mock data in bulk
 */
function generateMockUsers(count) {
  var users = [];
  for (var i = 1; i <= count; i++) {
    users.push({
      id: i,
      name: "User " + i,
      email: "user" + i + "@example.com",
      active: i % 2 === 0,
    });
  }
  return users;
}

/**
 * Creates HTTP backend expectation helper
 */
function expectHttpCall(
  httpBackend,
  method,
  url,
  requestData,
  responseData,
  status
) {
  status = status || 200;
  var expectation;

  if (method === "GET") {
    expectation = httpBackend.expectGET(url);
  } else if (method === "POST") {
    expectation = httpBackend.expectPOST(url, requestData);
  } else if (method === "PUT") {
    expectation = httpBackend.expectPUT(url, requestData);
  } else if (method === "DELETE") {
    expectation = httpBackend.expectDELETE(url);
  }

  return expectation.respond(status, responseData);
}

/**
 * Assertion helpers
 */
var AssertHelpers = {
  /**
   * Asserts that object has required properties
   */
  hasProperties: function (obj, properties) {
    properties.forEach(function (prop) {
      expect(obj).toHaveProperty(prop);
    });
  },

  /**
   * Asserts that array contains object with specific property value
   */
  arrayContainsObjectWithProperty: function (array, property, value) {
    var found = array.some(function (item) {
      return item[property] === value;
    });
    expect(found).toBe(true);
  },

  /**
   * Asserts that function was called with specific arguments
   */
  wasCalledWithObject: function (spy, expectedArgs) {
    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining(expectedArgs));
  },

  /**
   * Asserts response structure
   */
  hasValidResponseStructure: function (response) {
    expect(response).toHaveProperty("status");
    expect(response).toHaveProperty("statusText");
    expect(response).toHaveProperty("data");
  },
};

// ============================================================================
// SETUP HELPERS FOR TEST SUITES
// ============================================================================

/**
 * Common setup for service tests
 */
function setupServiceTest(serviceName) {
  beforeEach(module("myApp"));

  var service;
  beforeEach(inject(function ($injector) {
    service = $injector.get(serviceName);
  }));

  return service;
}

/**
 * Common setup for controller tests
 */
function setupControllerTest(controllerName, mockServices) {
  beforeEach(module("myApp"));

  if (mockServices) {
    beforeEach(
      module(function ($provide) {
        Object.keys(mockServices).forEach(function (key) {
          $provide.value(key, mockServices[key]);
        });
      })
    );
  }

  var controller;
  beforeEach(inject(function ($controller, $rootScope) {
    var $scope = $rootScope.$new();
    controller = $controller(controllerName, { $scope: $scope });
  }));

  return controller;
}

// ============================================================================
// EXPORT FOR USE IN TESTS
// ============================================================================

// These objects and functions are available globally in tests when this file is included
