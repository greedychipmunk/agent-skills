# Testing Patterns

Learn to run tests in GitHub Actions, report results, integrate coverage tools, and handle test failures reliably.

---

## JUnit Test Results

GitHub Actions natively parses JUnit XML test reports and displays results in the UI.

### Generate JUnit Reports

Most test frameworks support JUnit output:

**Jest/Node.js:**

```bash
npm test -- --reporters=junit --testResultsProcessor=jest-junit
```

With `jest.config.js`:

```javascript
module.exports = {
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports',
      outputName: 'junit.xml'
    }]
  ]
};
```

**Python/pytest:**

```bash
pytest --junit-xml=reports/junit.xml
```

**Java/Maven:**

```bash
mvn test -Dmaven.surefire.report.format=xml
```

**Go/testing:**

Use `go-junit-report` to convert test output:

```bash
go test -v ./... | go-junit-report > reports/junit.xml
```

### Upload Test Results

Use `dorny/test-reporter@v1` to parse and report results:

```yaml
- name: Upload test results
  if: always()  # Run even if tests fail
  uses: dorny/test-reporter@v1
  with:
    name: Jest Results
    path: 'reports/junit.xml'
    reporter: 'jest-junit'
```

Supported reporters: `java-junit`, `jest-junit`, `mocha-json`, `dotnet-trx`, `xunit`, and others.

### Test Summary

For automatic test summaries in PR comments and job summaries:

```yaml
- name: Publish test summary
  if: always()
  uses: EnricoMi/publish-unit-test-result-action@v2
  with:
    files: 'reports/junit.xml'
    check_name: 'Test Results'
```

This action:

- Displays test results in PR comments
- Shows pass/fail counts
- Lists failed tests
- Links to logs

---

## Test Summaries and Annotations

### Job Summaries

Write custom markdown summaries to the GitHub Actions interface:

```yaml
- run: |
    echo "## Test Results" >> $GITHUB_STEP_SUMMARY
    echo "✅ Unit Tests: 245 passed" >> $GITHUB_STEP_SUMMARY
    echo "✅ Integration Tests: 18 passed" >> $GITHUB_STEP_SUMMARY
    echo "⚠️ Coverage: 78.5%" >> $GITHUB_STEP_SUMMARY
```

The summary appears in the "Summary" tab of the workflow run.

### Annotations

Highlight specific lines in the code diff:

```yaml
- run: |
    echo "::notice file=src/app.js,line=42,col=10::Unused variable"
    echo "::warning file=src/utils.js,line=15::Performance issue"
    echo "::error file=src/main.js,line=8::Critical bug"
```

Annotations appear in the PR diff and workflow logs. Levels: `notice`, `warning`, `error`.

---

## Codecov Integration

Integrate code coverage reports with Codecov:

```yaml
- run: npm test -- --coverage

- uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
```

### Coverage Configuration

Generate coverage reports from your test framework:

**Jest:**

```bash
npm test -- --coverage --coverageReporters=lcov
```

**pytest:**

```bash
pytest --cov=src --cov-report=lcov
```

**Go:**

```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

### Codecov Badges

Add coverage badges to your README:

```markdown
[![codecov](https://codecov.io/gh/owner/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/owner/repo)
```

---

## Matrix Testing

Run tests across multiple Node versions, Python versions, or operating systems:

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, macos-latest]
jobs:
  test:
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm test
```

This creates 3 × 2 = 6 parallel test jobs, one for each combination.

### Matrix with Custom Docker

```yaml
strategy:
  matrix:
    python-version: ['3.9', '3.10', '3.11']
jobs:
  test:
    container:
      image: python:${{ matrix.python-version }}
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt
      - run: pytest
```

---

## Status Checks and Branch Protection

GitHub Actions workflows create status checks that can enforce branch protection rules.

### Require Workflow Success

In repository settings under "Branch protection rules":

1. Enable "Require status checks to pass before merging"
2. Select specific workflows: "Test Results", "Build", etc.
3. Require branches to be up-to-date before merging

### Skip CI for Certain Commits

Add `[skip ci]` or `[ci skip]` to commit messages:

```bash
git commit -m "docs: update README [skip ci]"
```

This prevents workflows from running for documentation-only changes.

---

## Flaky Test Retry

Retry failed tests automatically to handle intermittent failures:

### Retry in Test Framework

**Jest:**

```javascript
// jest.config.js
module.exports = {
  testRetryAttempts: 2  // Retry failed tests up to 2 times
};
```

**pytest:**

Install `pytest-retry`:

```bash
pip install pytest-retry
pytest --retry-count=2 --retry-delay=1
```

### Retry in Workflow

Retry entire test step:

```yaml
- run: npm test
  continue-on-error: true
  id: test

- run: npm test
  if: steps.test.outcome == 'failure'
  name: Retry failed tests
```

Or use the action approach:

```yaml
- uses: nick-invision/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: npm test
```

### Track Flaky Tests

Monitor flaky test failures with annotations:

```yaml
- run: |
    FAILED_TESTS=$(npm test 2>&1 | grep "FAIL" || true)
    if [ ! -z "$FAILED_TESTS" ]; then
      echo "::warning::Flaky tests detected: $FAILED_TESTS"
    fi
```

---

## Dependabot Integration

Automatically test dependency updates with Dependabot:

### Enable Dependabot

In `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    allow:
      - dependency-type: "all"
    reviewers:
      - "owner"
```

Supported ecosystems: `npm`, `pip`, `maven`, `gradle`, `composer`, `nuget`, `docker`, `terraform`, etc.

### Dependabot Workflows

Dependabot PRs automatically trigger your CI workflows. The PR runs tests to verify the update doesn't break anything.

### Handling Dependency Conflicts

Use Dependabot to:

- Bump dependencies automatically
- Group related updates
- Skip major version bumps
- Ignore specific versions

Configuration:

```yaml
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    grouping-strategy: "auto"  # Group related updates
    ignore:
      - dependency-name: "eslint"
        versions: ["8.x"]  # Ignore ESLint 8.x
    allow:
      - dependency-type: "direct"  # Only direct dependencies
```

---

## Test Coverage Reporting

### Coverage Thresholds

Enforce minimum coverage with tools like `nyc` or `coverage.py`:

**Jest with coverage thresholds:**

```javascript
module.exports = {
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

Fail the build if coverage drops below thresholds.

### Coverage Reports in PR Comments

Use `romeovs/lcov-reporter-action@v0.3.1`:

```yaml
- run: npm test -- --coverage --coverageReporters=lcov

- uses: romeovs/lcov-reporter-action@v0.3.1
  if: always()
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    lcov-file: ./coverage/lcov.info
```

This comments on the PR with coverage changes.

---

## Test Timeouts and Deadlocks

### Configure Job Timeout

```yaml
timeout-minutes: 30  # Job-level timeout
```

Default is 360 minutes (6 hours).

### Step Timeout

For individual test runs with `timeout-minutes` at step level (supported in some actions):

```yaml
- run: npm test
  timeout-minutes: 10
```

### Handling Long-Running Tests

Separate long-running tests into a separate job:

```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - run: npm run test:integration
```

Use `needs:` to chain jobs if desired.

---

## Artifact Management

### Store Test Logs and Reports

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: test-results-node-${{ matrix.node }}
    path: |
      reports/
      coverage/
    retention-days: 30
```

Artifacts are available for download in the workflow run.

### Cleanup Old Artifacts

Use `geekyeggo/delete-artifact@v2`:

```yaml
- uses: geekyeggo/delete-artifact@v2
  with:
    name: test-results-*
```

---
