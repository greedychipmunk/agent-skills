# Code Coverage Analysis Guide

## Understanding Code Coverage

Code coverage measures what percentage of your code is executed by your tests. It's an important metric for test quality.

### Coverage Types

| Type | Measures | Target |
|------|----------|--------|
| **Line Coverage** | Percentage of lines executed | 80%+ |
| **Branch Coverage** | Percentage of conditional branches executed | 75%+ |
| **Function Coverage** | Percentage of functions called | 80%+ |
| **Statement Coverage** | Percentage of statements executed | 80%+ |

## Using Istanbul/NYC for Coverage

### Installation

```bash
npm install --save-dev istanbul nyc
```

### Configuration

In `package.json`:

```json
{
  "scripts": {
    "test": "karma start",
    "test:coverage": "karma start --coverage"
  }
}
```

In `karma.conf.js`:

```javascript
coverageReporter: {
  dir: require('path').join(__dirname, 'coverage'),
  subdir: '.',
  reporters: [
    { type: 'html' },
    { type: 'text-summary' },
    { type: 'lcov' }
  ],
  check: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
}
```

### Running Coverage

```bash
npm run test:coverage
```

## Interpreting Coverage Reports

### HTML Report

The coverage report generates an `index.html` file:

```
coverage/
├── index.html          (Main report)
├── base/
│   ├── src/
│   │   ├── services/
│   │   │   ├── UserService.js  (Coverage details)
│   │   │   └── user.service.html
│   │   └── controllers/
│   │       ├── UserController.js
│   │       └── user.controller.html
```

### Reading Coverage Numbers

```
Statements   : 85.5% ( 320/375 )    ← 320 of 375 statements executed
Branches     : 78.2% ( 86/110 )     ← 78% of conditional branches covered
Functions    : 82.1% ( 32/39 )      ← 82% of functions called
Lines        : 86.3% ( 298/345 )    ← 86% of lines executed
```

### Visual Indicators

```javascript
// ✓ Line executed (green)
if (user) {
  console.log(user.name);
}

// ✗ Line not executed (red)
if (admin) {
  deleteAllData(); // This code path not tested
}

// ~ Branch not fully covered (yellow)
if (user && user.active) {  // Some branches missing
  doSomething();
}
```

## Improving Coverage

### Finding Coverage Gaps

1. Open `coverage/index.html` in browser
2. Look for red (uncovered) lines
3. Check yellow (partially covered) branches
4. Identify missing test scenarios

### Common Coverage Gaps

#### Error Handling

```javascript
// BAD: No error handling test
service.getUser = function(id) {
  return $http.get('/api/users/' + id);
};

// GOOD: Test error path
it('should handle 404 errors', function() {
  $httpBackend.expectGET('/api/users/999').respond(404);
  
  var error;
  service.getUser(999).then(null, function(err) {
    error = err;
  });
  
  $httpBackend.flush();
  expect(error).toBeDefined();
});
```

#### Conditional Branches

```javascript
// BAD: Only testing happy path
controller.submit = function() {
  if (form.$valid) {
    service.save(form.data);
  }
};

it('should save when form is valid', function() {
  $scope.form = { $valid: true, data: {} };
  $scope.submit();
  // Only tests valid branch!
});

// GOOD: Test both branches
it('should not save when form is invalid', function() {
  $scope.form = { $valid: false };
  $scope.submit();
  expect(service.save).not.toHaveBeenCalled();
});
```

#### Edge Cases

```javascript
// BAD: Not testing edge cases
function processUsers(users) {
  return users.map(function(user) {
    return user.name.toUpperCase();
  });
}

// GOOD: Test edge cases
it('should handle empty array', function() {
  expect(processUsers([])).toEqual([]);
});

it('should handle null users', function() {
  expect(function() {
    processUsers([null]);
  }).toThrow();
});

it('should handle users without names', function() {
  expect(function() {
    processUsers([{}]);
  }).toThrow();
});
```

#### Loop Coverage

```javascript
// BAD: Incomplete loop testing
for (var i = 0; i < items.length; i++) {
  if (items[i].active) {
    results.push(items[i]);
  }
}

// GOOD: Test different loop scenarios
it('should process all items', function() {
  var items = [
    { active: true },
    { active: false },
    { active: true }
  ];
  
  expect(processItems(items).length).toBe(2);
});
```

## Coverage-Driven Testing

### Workflow

1. Run tests with coverage
2. Identify uncovered code
3. Write tests for uncovered paths
4. Re-run coverage
5. Repeat until target reached

### Example

```javascript
// 1. Run coverage
npm run test:coverage
// Coverage: 65%

// 2. Add missing tests for error handling
it('should handle timeouts', function() {
  $timeout(function() {
    expect(true).toBe(true);
  }, 5000);
  $timeout.flush();
});

// 3. Re-run coverage
npm run test:coverage
// Coverage: 78%

// 4. Continue improving
```

## Coverage Best Practices

| ✓ Do | ✗ Don't |
|------|---------|
| Test error paths | Only test happy paths |
| Test edge cases | Test only main scenarios |
| Test boundary values | Ignore edge cases |
| Test false conditions | Only test true conditions |
| Test async operations | Skip async tests |
| Track coverage trends | Ignore coverage metrics |

## Coverage Reporting

### Text Summary

```
TOTAL: 85.5%
PASS: ✓ 150 tests passed
WARNINGS: 5 files below threshold
```

### CI/CD Integration

#### GitHub Actions

```yaml
- name: Test Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v2
  with:
    files: ./coverage/lcov.info
```

#### Jenkins

```groovy
stage('Coverage') {
  steps {
    sh 'npm run test:coverage'
    publishHTML([
      reportDir: 'coverage',
      reportFiles: 'index.html',
      reportName: 'Coverage Report'
    ])
  }
}
```

## Managing Coverage Thresholds

### Setting Thresholds

```javascript
// karma.conf.js
coverageReporter: {
  check: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    each: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70
    }
  }
}
```

### Excluding Code from Coverage

```javascript
// Skip coverage for this file
// istanbul ignore file

// Skip single line
/* istanbul ignore next */ 
if (process.env.NODE_ENV === 'test') { ... }

// Skip next line
/* istanbul ignore next */
console.log('Debug info');
```

## Common Coverage Challenges

### Challenge 1: Circular Dependencies

```javascript
// Mock circular deps in tests
beforeEach(module(function($provide) {
  $provide.value('ServiceA', mockServiceA);
  $provide.value('ServiceB', mockServiceB);
}));
```

### Challenge 2: Browser APIs

```javascript
// Mock browser APIs
beforeEach(function() {
  spyOn(localStorage, 'getItem').and.returnValue('value');
  spyOn(window, 'alert');
});
```

### Challenge 3: Heavy Setup Code

```javascript
// Extract setup to helper functions
function setupDatabase() {
  // Complex setup
}

function setupAuth() {
  // Auth setup
}

beforeEach(function() {
  setupDatabase();
  setupAuth();
});
```

## Coverage Tools Comparison

| Tool | Language | Integration | Report |
|------|----------|-------------|--------|
| **Istanbul** | JavaScript | Karma | HTML, LCOV |
| **NYC** | JavaScript | CLI | HTML, JSON |
| **Coveralls** | Multi | CI/CD | Web |
| **Codecov** | Multi | CI/CD | Web |

## References

- [Istanbul Documentation](https://istanbul.js.org/)
- [NYC Documentation](https://github.com/istanbuljs/nyc)
- [Code Coverage Wikipedia](https://en.wikipedia.org/wiki/Code_coverage)

---

**Last Updated**: January 10, 2026
