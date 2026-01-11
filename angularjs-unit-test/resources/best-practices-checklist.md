# Best Practices Checklist for AngularJS Testing

## Pre-Test Planning

- [ ] **Requirements Clear**: Understand what component should do
- [ ] **Edge Cases Identified**: List boundary conditions and error scenarios
- [ ] **Dependencies Mapped**: Know all external dependencies
- [ ] **Data Models Defined**: Understand data structures
- [ ] **API Contracts Known**: Know HTTP endpoints and data format
- [ ] **Error Scenarios Listed**: Identify all error cases
- [ ] **Performance Targets Set**: Define acceptable test execution time

## Test Organization

- [ ] **One Test File Per Component**: Named `component.spec.js`
- [ ] **Logical Grouping**: Use `describe()` blocks for organization
- [ ] **Clear Test Names**: Names describe expected behavior
- [ ] **DRY Setup**: Common setup in `beforeEach()`
- [ ] **Clean Teardown**: Resources cleaned up in `afterEach()`
- [ ] **Independence**: Each test runs independently
- [ ] **No Global State**: Tests don't share state

## Test Structure

- [ ] **AAA Pattern**: Arrange-Act-Assert clearly visible
- [ ] **Single Responsibility**: One concept per test
- [ ] **Readable**: Easy to understand intent
- [ ] **No Comments**: Code is self-explanatory
- [ ] **Meaningful Assertions**: Verify intended behavior
- [ ] **Consistent Naming**: Same conventions throughout
- [ ] **Proper Indentation**: Code is properly formatted

## Mocking & Dependency Injection

- [ ] **External Dependencies Mocked**: HTTP, external services
- [ ] **Realistic Mocks**: Mocks behave like real services
- [ ] **Dependencies Injected**: Using AngularJS injection
- [ ] **$provide Used Correctly**: For overriding services
- [ ] **Spy Verification**: Verify service interactions
- [ ] **Mock Data Consistent**: Same data structures as real services
- [ ] **Spies Reset**: Clear mocks between tests

## HTTP Testing

- [ ] **$httpBackend Setup**: Properly configured
- [ ] **HTTP Expectations Set**: Before making requests
- [ ] **Requests Flushed**: `$httpBackend.flush()` called
- [ ] **Verification Done**: `verifyNoOutstandingExpectation()`
- [ ] **Error Responses Tested**: 404, 500, timeout scenarios
- [ ] **Response Data Correct**: Actual data format verified
- [ ] **Multiple Requests Handled**: Sequential requests tested

## Async Operations

- [ ] **Promises Resolved**: `$rootScope.$apply()` or `flush()`
- [ ] **Timeouts Handled**: `$timeout.flush()` called
- [ ] **Callbacks Executed**: Async code runs before assertions
- [ ] **Error Handling**: Promise rejections tested
- [ ] **Race Conditions**: Timing issues caught
- [ ] **Async Completeness**: All async operations finished

## Scope & Events

- [ ] **$scope Created**: Fresh scope per test
- [ ] **Watchers Tested**: `$scope.$watch()` behavior verified
- [ ] **Events Emitted**: `$scope.$emit()` called
- [ ] **Events Broadcast**: `$scope.$broadcast()` verified
- [ ] **Digest Cycles**: `$rootScope.$apply()` or `$digest()` called
- [ ] **Scope Cleanup**: Resources cleaned up
- [ ] **Scope Isolation**: Controller scope is isolated

## Assertions

- [ ] **Assertions Meaningful**: Verify intended behavior
- [ ] **Type Checks**: `toBeDefined()`, `toBeNull()`
- [ ] **Value Checks**: `toBe()`, `toEqual()`
- [ ] **Array/Object Checks**: `toContain()`, deep equality
- [ ] **Error Checks**: `toThrow()`, error messages
- [ ] **Spy Checks**: Function calls verified
- [ ] **Negation Used**: `.not.` when appropriate

## Error Testing

- [ ] **Error Paths Tested**: Happy path AND error cases
- [ ] **Error Messages Verified**: Clear, helpful messages
- [ ] **Error Recovery**: Service recovers gracefully
- [ ] **Edge Cases**: Empty arrays, null values, invalid input
- [ ] **Boundary Values**: Min/max values tested
- [ ] **Invalid Data**: Type mismatches handled
- [ ] **Exception Handling**: Uncaught exceptions prevented

## Coverage & Quality

- [ ] **Coverage 80%+**: Adequate code coverage
- [ ] **Line Coverage Good**: Most lines executed
- [ ] **Branch Coverage**: Both if/else branches tested
- [ ] **Function Coverage**: All functions called
- [ ] **No Dead Code**: All code is tested
- [ ] **Conditional Branches**: All conditions tested
- [ ] **Error Branches**: Error handling tested

## Maintainability

- [ ] **Fixtures Used**: Test data centralized
- [ ] **Helpers Created**: Common operations extracted
- [ ] **DRY Principle**: No code duplication
- [ ] **Clear Variable Names**: Intent obvious
- [ ] **Documented**: Complex logic explained
- [ ] **Constants Used**: Magic numbers avoided
- [ ] **Consistent Style**: Team conventions followed

## Performance

- [ ] **Tests Run Fast**: Under 100ms per test
- [ ] **No Unnecessary Mocks**: Only mock when needed
- [ ] **Efficient Assertions**: Quick validations
- [ ] **Async Operations**: Properly handled
- [ ] **Database Mocked**: No real DB access
- [ ] **External APIs Mocked**: No real API calls
- [ ] **Resource Cleanup**: No memory leaks

## Integration Testing

- [ ] **Component Interaction**: Multiple components tested
- [ ] **Data Flow**: Data flows correctly through system
- [ ] **Event Propagation**: Events propagate correctly
- [ ] **Service Integration**: Services work together
- [ ] **Router Integration**: Navigation works
- [ ] **HTTP Integration**: Real HTTP scenarios tested
- [ ] **End-to-End**: Full workflow tested

## Debugging

- [ ] **Errors Understandable**: Clear error messages
- [ ] **Test Names Descriptive**: Easy to find failing test
- [ ] **Assertions Clear**: Obvious what failed
- [ ] **No Silent Failures**: Failures are visible
- [ ] **Logging Minimal**: Debug logs removed
- [ ] **Focus/Skip Used**: For debugging specific tests
- [ ] **Browser DevTools**: Tests debuggable

## CI/CD Integration

- [ ] **Tests Run in CI**: Automated test execution
- [ ] **Coverage Reported**: Coverage data tracked
- [ ] **Failures Caught**: CI catches test failures
- [ ] **Build Blocked**: Failed tests block merge
- [ ] **Reports Generated**: HTML/coverage reports
- [ ] **Artifacts Saved**: Test results archived
- [ ] **Notifications Sent**: Team notified of failures

## Documentation

- [ ] **README Updated**: Testing instructions included
- [ ] **Test Examples**: Sample tests documented
- [ ] **Setup Documented**: How to run tests explained
- [ ] **Coverage Report**: Coverage goals documented
- [ ] **Common Issues**: Troubleshooting guide provided
- [ ] **Best Practices**: Team guidelines documented
- [ ] **Tools Listed**: Testing tools and versions listed

## Scoring

Calculate your test quality score:

| Item | Yes(1) | Partial(0.5) | No(0) |
|------|--------|--------------|-------|
| Pre-test planning (7 items) | ? | ? | ? |
| Test organization (7 items) | ? | ? | ? |
| Test structure (7 items) | ? | ? | ? |
| Mocking (7 items) | ? | ? | ? |
| HTTP testing (7 items) | ? | ? | ? |
| Async operations (7 items) | ? | ? | ? |
| Scope & events (7 items) | ? | ? | ? |
| Assertions (7 items) | ? | ? | ? |
| Error testing (7 items) | ? | ? | ? |
| Coverage (7 items) | ? | ? | ? |

**Score Calculation**: (Total Points / 70) × 100

- **90-100**: Excellent test quality ✓
- **75-89**: Good test quality - improve coverage
- **60-74**: Fair quality - address gaps
- **<60**: Poor quality - significant improvements needed

## Quick Checklist for Code Review

Before committing tests:

- [ ] Tests run locally without errors
- [ ] Coverage meets 80% target
- [ ] All edge cases tested
- [ ] No flaky tests
- [ ] No console.log statements
- [ ] No pending/skipped tests
- [ ] Naming follows conventions
- [ ] All assertions meaningful
- [ ] Error scenarios tested
- [ ] Mocks are realistic

---

**Last Updated**: January 10, 2026
