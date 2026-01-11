/**
 * SERVICE TEST TEMPLATE
 *
 * Comprehensive Jasmine/Jest test template for AngularJS services.
 * Demonstrates best practices for service testing including:
 * - Service initialization
 * - Method testing
 * - HTTP interactions with $httpBackend
 * - Promise handling
 * - Error scenarios
 * - Dependency mocking
 *
 * Usage:
 * 1. Replace 'UserService' with your service name
 * 2. Replace test method names with actual service methods
 * 3. Add specific test cases for your service logic
 * 4. Mock all external dependencies
 */

// ============================================================================
// JASMINE VERSION
// ============================================================================

describe("UserService (Jasmine)", function () {
  var UserService, $httpBackend, $q, $rootScope;
  var API_URL = "/api/users";

  /**
   * Load the application module
   */
  beforeEach(module("myApp"));

  /**
   * Inject service and test utilities
   */
  beforeEach(inject(function (
    _UserService_,
    _$httpBackend_,
    _$q_,
    _$rootScope_
  ) {
    UserService = _UserService_;
    $httpBackend = _$httpBackend_;
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  /**
   * Verify no outstanding HTTP expectations or requests
   */
  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  // ==========================================================================
  // SERVICE INITIALIZATION
  // ==========================================================================

  describe("Service Initialization", function () {
    it("should be defined", function () {
      expect(UserService).toBeDefined();
    });

    it("should have all required methods", function () {
      expect(UserService.getUsers).toBeDefined();
      expect(UserService.getUserById).toBeDefined();
      expect(UserService.createUser).toBeDefined();
      expect(UserService.updateUser).toBeDefined();
      expect(UserService.deleteUser).toBeDefined();
    });

    it("should be a singleton", function () {
      var service1 = UserService;
      var service2 = UserService;
      expect(service1).toBe(service2);
    });
  });

  // ==========================================================================
  // GET OPERATIONS
  // ==========================================================================

  describe("UserService.getUsers()", function () {
    it("should fetch all users from API", function () {
      var mockUsers = [
        { id: 1, name: "John Doe", email: "john@example.com", active: true },
        { id: 2, name: "Jane Smith", email: "jane@example.com", active: true },
        { id: 3, name: "Bob Johnson", email: "bob@example.com", active: false },
      ];

      $httpBackend.expectGET(API_URL).respond(200, mockUsers);

      var result;
      UserService.getUsers().then(function (users) {
        result = users;
      });

      $httpBackend.flush();

      expect(result).toEqual(mockUsers);
      expect(result.length).toBe(3);
    });

    it("should handle empty user list", function () {
      $httpBackend.expectGET(API_URL).respond(200, []);

      var result;
      UserService.getUsers().then(function (users) {
        result = users;
      });

      $httpBackend.flush();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it("should cache results on subsequent calls", function () {
      var mockUsers = [{ id: 1, name: "John" }];
      $httpBackend.expectGET(API_URL).respond(200, mockUsers);

      UserService.getUsers();
      $httpBackend.flush();

      // Second call should not trigger another HTTP request
      UserService.getUsers();
      // No second expectGET - test would fail if another request was made
    });

    it("should handle 404 Not Found", function () {
      $httpBackend.expectGET(API_URL).respond(404, "Not Found");

      var error;
      UserService.getUsers().then(null, function (err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error).toBeDefined();
      expect(error.status).toBe(404);
    });

    it("should handle 500 Server Error", function () {
      $httpBackend.expectGET(API_URL).respond(500, "Server Error");

      var error;
      UserService.getUsers().then(null, function (err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error).toBeDefined();
      expect(error.status).toBe(500);
    });
  });

  describe("UserService.getUserById()", function () {
    it("should fetch user by ID", function () {
      var userId = 1;
      var mockUser = { id: 1, name: "John Doe", email: "john@example.com" };
      var url = API_URL + "/" + userId;

      $httpBackend.expectGET(url).respond(200, mockUser);

      var result;
      UserService.getUserById(userId).then(function (user) {
        result = user;
      });

      $httpBackend.flush();

      expect(result).toEqual(mockUser);
    });

    it("should handle non-existent user (404)", function () {
      var userId = 999;
      var url = API_URL + "/" + userId;

      $httpBackend.expectGET(url).respond(404, "User not found");

      var error;
      UserService.getUserById(userId).then(null, function (err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error).toBeDefined();
    });

    it("should handle invalid user ID", function () {
      var invalidIds = [null, undefined, "", "abc"];

      invalidIds.forEach(function (id) {
        expect(function () {
          UserService.getUserById(id);
        }).toThrow();
      });
    });
  });

  // ==========================================================================
  // CREATE OPERATIONS
  // ==========================================================================

  describe("UserService.createUser()", function () {
    it("should create new user", function () {
      var newUser = {
        name: "New User",
        email: "newuser@example.com",
        active: true,
      };
      var createdUser = angular.extend({ id: 4 }, newUser);

      $httpBackend.expectPOST(API_URL, newUser).respond(201, createdUser);

      var result;
      UserService.createUser(newUser).then(function (user) {
        result = user;
      });

      $httpBackend.flush();

      expect(result.id).toBe(4);
      expect(result.name).toBe("New User");
    });

    it("should validate required fields", function () {
      var invalidUser = { name: "" }; // Missing email

      expect(function () {
        UserService.createUser(invalidUser);
      }).toThrow();
    });

    it("should handle validation errors (400)", function () {
      var invalidUser = {
        name: "Test",
        email: "invalid-email", // Invalid email format
      };

      $httpBackend
        .expectPOST(API_URL, invalidUser)
        .respond(400, "Invalid email format");

      var error;
      UserService.createUser(invalidUser).then(null, function (err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error).toBeDefined();
      expect(error.status).toBe(400);
    });

    it("should handle conflict (409 - duplicate email)", function () {
      var newUser = {
        name: "Test User",
        email: "existing@example.com",
      };

      $httpBackend
        .expectPOST(API_URL, newUser)
        .respond(409, "Email already exists");

      var error;
      UserService.createUser(newUser).then(null, function (err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error.status).toBe(409);
    });
  });

  // ==========================================================================
  // UPDATE OPERATIONS
  // ==========================================================================

  describe("UserService.updateUser()", function () {
    it("should update existing user", function () {
      var userId = 1;
      var updatedUser = {
        id: 1,
        name: "Updated Name",
        email: "updated@example.com",
      };

      $httpBackend
        .expectPUT(API_URL + "/" + userId, updatedUser)
        .respond(200, updatedUser);

      var result;
      UserService.updateUser(userId, updatedUser).then(function (user) {
        result = user;
      });

      $httpBackend.flush();

      expect(result).toEqual(updatedUser);
    });

    it("should handle non-existent user", function () {
      var userId = 999;
      var userData = { name: "Test" };

      $httpBackend
        .expectPUT(API_URL + "/" + userId, userData)
        .respond(404, "User not found");

      var error;
      UserService.updateUser(userId, userData).then(null, function (err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error).toBeDefined();
    });

    it("should handle partial updates", function () {
      var userId = 1;
      var partialUpdate = { name: "New Name" };
      var expectedResult = {
        id: 1,
        name: "New Name",
        email: "john@example.com", // Unchanged
      };

      $httpBackend
        .expectPUT(API_URL + "/" + userId, partialUpdate)
        .respond(200, expectedResult);

      var result;
      UserService.updateUser(userId, partialUpdate).then(function (user) {
        result = user;
      });

      $httpBackend.flush();

      expect(result.name).toBe("New Name");
      expect(result.email).toBe("john@example.com");
    });
  });

  // ==========================================================================
  // DELETE OPERATIONS
  // ==========================================================================

  describe("UserService.deleteUser()", function () {
    it("should delete user", function () {
      var userId = 1;

      $httpBackend.expectDELETE(API_URL + "/" + userId).respond(204); // 204 No Content

      var result;
      UserService.deleteUser(userId).then(function (response) {
        result = response;
      });

      $httpBackend.flush();

      expect(result).toBeDefined();
    });

    it("should handle non-existent user", function () {
      var userId = 999;

      $httpBackend
        .expectDELETE(API_URL + "/" + userId)
        .respond(404, "User not found");

      var error;
      UserService.deleteUser(userId).then(null, function (err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error).toBeDefined();
    });

    it("should handle permission denied (403)", function () {
      var userId = 1;

      $httpBackend
        .expectDELETE(API_URL + "/" + userId)
        .respond(403, "Not authorized");

      var error;
      UserService.deleteUser(userId).then(null, function (err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error.status).toBe(403);
    });
  });

  // ==========================================================================
  // FILTERING AND SEARCH
  // ==========================================================================

  describe("UserService.searchUsers()", function () {
    it("should search users by name", function () {
      var searchTerm = "john";
      var mockResults = [
        { id: 1, name: "John Doe", email: "john@example.com" },
      ];

      $httpBackend
        .expectGET(API_URL + "?search=" + searchTerm)
        .respond(200, mockResults);

      var result;
      UserService.searchUsers(searchTerm).then(function (users) {
        result = users;
      });

      $httpBackend.flush();

      expect(result.length).toBe(1);
      expect(result[0].name).toContain("John");
    });

    it("should return empty results for no matches", function () {
      var searchTerm = "nonexistent";

      $httpBackend
        .expectGET(API_URL + "?search=" + searchTerm)
        .respond(200, []);

      var result;
      UserService.searchUsers(searchTerm).then(function (users) {
        result = users;
      });

      $httpBackend.flush();

      expect(result.length).toBe(0);
    });
  });

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  describe("UserService Helper Methods", function () {
    it("should validate email format", function () {
      var validEmails = [
        "user@example.com",
        "test.user@example.co.uk",
        "user+tag@example.com",
      ];
      var invalidEmails = [
        "invalid",
        "user@",
        "@example.com",
        "user @example.com",
      ];

      validEmails.forEach(function (email) {
        expect(UserService.isValidEmail(email)).toBe(true);
      });

      invalidEmails.forEach(function (email) {
        expect(UserService.isValidEmail(email)).toBe(false);
      });
    });

    it("should format user object", function () {
      var user = {
        id: 1,
        name: "john doe",
        email: "JOHN@EXAMPLE.COM",
      };

      var formatted = UserService.formatUser(user);

      expect(formatted.name).toBe("John Doe"); // Title case
      expect(formatted.email).toBe("john@example.com"); // Lowercase
    });
  });

  // ==========================================================================
  // ERROR HANDLING AND EDGE CASES
  // ==========================================================================

  describe("Error Handling", function () {
    it("should handle network timeout", function () {
      $httpBackend.expectGET(API_URL).respond(function () {
        throw new Error("Network timeout");
      });

      var error;
      UserService.getUsers().then(null, function (err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error).toBeDefined();
    });

    it("should handle malformed response", function () {
      $httpBackend.expectGET(API_URL).respond(200, "Invalid JSON"); // Should be array or object

      var error;
      UserService.getUsers().then(null, function (err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error).toBeDefined();
    });

    it("should handle null response", function () {
      $httpBackend.expectGET(API_URL).respond(200, null);

      var result;
      UserService.getUsers().then(function (users) {
        result = users;
      });

      $httpBackend.flush();

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // ASYNC BEHAVIOR
  // ==========================================================================

  describe("Async Behavior", function () {
    it("should return promises", function () {
      $httpBackend.expectGET(API_URL).respond(200, []);

      var promise = UserService.getUsers();

      expect(promise).toBeDefined();
      expect(promise.then).toBeDefined();

      $httpBackend.flush();
    });

    it("should handle promise chaining", function () {
      $httpBackend.expectGET(API_URL).respond(200, [{ id: 1, name: "John" }]);

      var results = [];

      UserService.getUsers()
        .then(function (users) {
          results.push(users);
          return users[0];
        })
        .then(function (user) {
          results.push(user);
        });

      $rootScope.$apply();
      $httpBackend.flush();

      expect(results.length).toBe(2);
    });
  });
});

// ============================================================================
// JEST VERSION
// ============================================================================

describe("UserService (Jest)", () => {
  let userService;
  const API_URL = "/api/users";

  beforeEach(() => {
    global.fetch = jest.fn();

    userService = {
      getUsers: jest.fn().mockResolvedValue([]),
      getUserById: jest.fn().mockResolvedValue(null),
      createUser: jest.fn().mockResolvedValue({}),
      updateUser: jest.fn().mockResolvedValue({}),
      deleteUser: jest.fn().mockResolvedValue({}),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    test("should be defined", () => {
      expect(userService).toBeDefined();
    });

    test("should have required methods", () => {
      expect(userService.getUsers).toBeDefined();
      expect(userService.getUserById).toBeDefined();
      expect(userService.createUser).toBeDefined();
    });
  });

  describe("GET Operations", () => {
    test("should fetch users", async () => {
      const mockUsers = [{ id: 1, name: "John" }];
      userService.getUsers.mockResolvedValue(mockUsers);

      const users = await userService.getUsers();

      expect(users).toEqual(mockUsers);
      expect(userService.getUsers).toHaveBeenCalled();
    });

    test("should handle errors", async () => {
      userService.getUsers.mockRejectedValue(new Error("API Error"));

      await expect(userService.getUsers()).rejects.toThrow("API Error");
    });
  });

  describe("POST Operations", () => {
    test("should create user", async () => {
      const newUser = { name: "John", email: "john@example.com" };
      const createdUser = { id: 1, ...newUser };
      userService.createUser.mockResolvedValue(createdUser);

      const result = await userService.createUser(newUser);

      expect(result.id).toBe(1);
      expect(userService.createUser).toHaveBeenCalledWith(newUser);
    });
  });
});
