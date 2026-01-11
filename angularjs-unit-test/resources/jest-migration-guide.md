# Jest Migration Guide for AngularJS

## Overview

Jest is a modern testing framework from Facebook with powerful capabilities including built-in mocking, snapshot testing, and code coverage. This guide explains how to migrate AngularJS tests from Jasmine to Jest or run both frameworks in parallel.

## When to Use Jest

### Jest is ideal for:
- **New projects**: Modern TypeScript/ES6 codebases
- **React/Vue testing**: Native support for modern frameworks
- **Snapshot testing**: Visual regression testing
- **Fast test execution**: Parallel test runner with isolated environments
- **Zero configuration**: Sensible defaults out of the box
- **Built-in coverage**: Coverage reporting built-in

### Jasmine is ideal for:
- **Legacy AngularJS 1.x projects**: Extensive AngularJS integration
- **Browser testing**: Tests run in real browsers via Karma
- **CI/CD pipelines**: Mature Karma integration
- **Team familiarity**: Existing codebases and team expertise

## Key Differences Between Jasmine and Jest

| Feature | Jasmine | Jest |
|---------|---------|------|
| **Test Runner** | Karma (browser-based) | Jest (Node.js-based) |
| **Module System** | CommonJS/globals | CommonJS/ES6 modules |
| **Syntax** | `function() { }` | Arrow functions `() => { }` |
| **Test Functions** | `it()` | `test()` or `it()` |
| **Mocking** | `spyOn()`, manual mocks | `jest.mock()`, auto-mocking |
| **Assertions** | Same `expect()` API | Same `expect()` API |
| **Setup/Teardown** | `beforeEach/afterEach` | `beforeEach/afterEach` |
| **Coverage** | Istanbul/nyc (plugin) | Built-in, fast |
| **Snapshots** | Not supported | Built-in `toMatchSnapshot()` |
| **Isolation** | Shared environment | Isolated per test file |

## Installation

### Option 1: Jest Only (New Projects)

```bash
npm install --save-dev jest jest-preset-angular
npm install --save-dev ts-jest @types/jest  # For TypeScript
```

### Option 2: Jasmine + Jest (Gradual Migration)

```bash
# Keep existing Jasmine/Karma setup
npm install --save-dev jasmine karma karma-jasmine

# Add Jest for new tests
npm install --save-dev jest jest-preset-angular
```

## Configuration

### Jest Configuration (jest.config.js)

```javascript
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.(html|svg)$',
    },
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
  ],
};
```

### setup-jest.ts

```typescript
import 'jest-preset-angular/setup-jest';

Object.defineProperty(window, 'CSS', {value: null});
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({display: 'none'})
});
```

## Migration Patterns

### Pattern 1: Converting Jasmine to Jest

```javascript
// BEFORE (Jasmine)
describe('UserService', function() {
  var userService, $httpBackend;

  beforeEach(module('myApp'));
  beforeEach(inject(function(_UserService_, _$httpBackend_) {
    userService = _UserService_;
    $httpBackend = _$httpBackend_;
  }));

  it('should fetch users', function() {
    $httpBackend.expectGET('/api/users').respond([]);
    userService.getUsers();
    $httpBackend.flush();
  });
});

// AFTER (Jest)
describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = require('./UserService').default;
  });

  test('should fetch users', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    const users = await userService.getUsers();
    expect(users).toBeDefined();
  });
});
```

### Pattern 2: Mocking Services

```javascript
// Jasmine Spies
spyOn(userService, 'getUser').and.returnValue(
  Promise.resolve({ id: 1, name: 'John' })
);

// Jest Mocks
userService.getUser = jest.fn()
  .mockResolvedValue({ id: 1, name: 'John' });
```

## Running Tests

### Jest Commands

```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage
npm test -- --updateSnapshot  # Update snapshots
npm test -- --ci           # CI mode
```

### Karma Commands (Jasmine)

```bash
npm test                    # Run tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

---

**Last Updated**: January 10, 2026
