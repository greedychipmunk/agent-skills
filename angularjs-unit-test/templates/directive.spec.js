/**
 * DIRECTIVE TEST TEMPLATE
 *
 * Comprehensive test template for AngularJS directives.
 * Includes testing DOM manipulation, isolated scopes, and component behavior.
 */

describe("MyCustomDirective", function () {
  var $compile, $rootScope, $timeout, element, scope;

  beforeEach(module("myApp"));

  beforeEach(inject(function (_$compile_, _$rootScope_, _$timeout_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    scope = $rootScope.$new();
  }));

  describe("Compilation", function () {
    it("should compile directive", function () {
      element = $compile("<div my-custom-directive></div>")(scope);
      expect(element).toBeDefined();
    });

    it("should be attached to DOM", function () {
      element = $compile("<div my-custom-directive></div>")(scope);
      expect(element.html).toBeDefined();
    });
  });

  describe("Scope", function () {
    it("should create isolated scope", function () {
      element = $compile("<div my-custom-directive></div>")(scope);
      var directiveScope = element.isolateScope();
      expect(directiveScope).toBeDefined();
    });

    it("should bind attributes", function () {
      scope.value = "test";
      element = $compile('<div my-custom-directive value="{{value}}"></div>')(
        scope
      );
      scope.$digest();
      expect(element.text()).toContain("test");
    });
  });

  describe("DOM Manipulation", function () {
    it("should modify DOM", function () {
      element = $compile("<div my-custom-directive></div>")(scope);
      scope.$digest();
      expect(element.hasClass("directive-class")).toBe(true);
    });

    it("should handle click events", function () {
      element = $compile("<button my-custom-directive></button>")(scope);
      scope.$digest();
      spyOn(scope, "$emit");
      element.click();
      expect(scope.$emit).toHaveBeenCalled();
    });
  });
});
