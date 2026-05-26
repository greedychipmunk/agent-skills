# Workflow Basics

Learn the structure of GitHub Actions workflows, triggers, job anatomy, and commonly-used built-in actions.

---

## Workflow YAML Structure

A GitHub Actions workflow is a YAML file that defines automated tasks. The top-level structure includes:

```yaml
name: Workflow Display Name
on: [push, pull_request]
env:
  GLOBAL_VAR: value
jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Hello"
```

### Name Field

The `name` field appears in the GitHub UI and workflow logs:

```yaml
name: Build and Test
```

If omitted, the filename is used.

---

## Triggers: The `on:` Key

The `on:` key specifies when the workflow runs. Common triggers:

### Push Events

Trigger on push to specific branches:

```yaml
on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'src/**'
      - '.github/workflows/ci.yml'
```

Exclude branches and paths:

```yaml
on:
  push:
    branches-ignore:
      - 'release/*'
    paths-ignore:
      - 'docs/**'
```

### Pull Request Events

Trigger on PR creation, synchronization, or reopening:

```yaml
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
```

Available types: `opened`, `synchronize`, `reopened`, `labeled`, `unlabeled`, `assigned`, `unassigned`, `edited`, `closed`, `converted_to_draft`, `ready_for_review`.

**Important:** Use `pull_request` for most cases. Avoid `pull_request_target` unless you understand the security implications (see security-and-secrets.md).

### Schedule Triggers

Run workflows on a schedule using cron syntax:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM UTC
    - cron: '0 */6 * * *' # Run every 6 hours
```

### Manual Trigger

Allow manual runs via GitHub UI or API:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
```

### Multiple Triggers

Combine triggers with an array or object:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'
```

---

## Job Anatomy

Jobs are the top-level units of work. Each job runs in a fresh runner instance.

### Basic Job Structure

```yaml
jobs:
  build:
    name: Build Project
    runs-on: ubuntu-latest
    timeout-minutes: 30
    environment: production
    concurrency:
      group: build-${{ github.ref }}
      cancel-in-progress: true
    steps:
      - run: echo "Job starting"
```

### Runs-On: Runner Selection

Specify the operating system:

```yaml
runs-on: ubuntu-latest      # Linux
runs-on: windows-latest     # Windows
runs-on: macos-latest       # macOS
```

Use version pinning for predictability:

```yaml
runs-on: ubuntu-20.04       # Ubuntu 20.04 LTS
runs-on: windows-2019       # Windows Server 2019
```

For self-hosted runners:

```yaml
runs-on: [self-hosted, linux, x64]
```

### Timeout and Concurrency

```yaml
timeout-minutes: 30  # Default 360 (6 hours)
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Cancel previous runs
```

### Conditional Execution

```yaml
jobs:
  test:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
```

Available contexts: `always()`, `success()`, `failure()`, `cancelled()`, `hashFiles()`.

---

## Steps: Core Workflow Units

Steps are individual tasks within a job. Each step runs sequentially; a failed step stops subsequent steps (unless `continue-on-error: true`).

### Run Steps

Execute shell commands or scripts:

```yaml
steps:
  - run: npm install
  - run: npm test
    shell: bash  # Default; bash, pwsh, sh, cmd available
```

Multi-line commands:

```yaml
- run: |
    npm install
    npm run build
    npm test
```

Environment variables scoped to a step:

```yaml
- run: npm test
  env:
    NODE_ENV: test
    DEBUG: true
```

Continue on error:

```yaml
- run: npm test
  continue-on-error: true  # Don't fail the job
```

### Uses Steps: Pre-Built Actions

Run published actions from the marketplace or repositories:

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: '20'
- uses: some-org/some-action@v1
  with:
    arg1: value1
    arg2: value2
```

Actions can be specified by:

- Full repository path: `owner/repo@ref`
- Docker image: `docker://image:tag`
- Local path: `./path/to/action`

---

## Built-In Actions

### actions/checkout

Clone the repository code into the runner:

```yaml
- uses: actions/checkout@v4
```

Options:

```yaml
- uses: actions/checkout@v4
  with:
    ref: develop              # Check out specific branch/tag
    fetch-depth: 0            # Fetch entire history (default: 1)
    path: src                 # Checkout into subdirectory
    persist-credentials: false # Don't save credentials
```

**Always include this early in your workflow** to access repository files.

### actions/setup-node

Set up Node.js with version management:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # Cache node_modules
```

Cache options: `npm`, `yarn`, `pnpm`, or omit to skip caching.

Matrix setup:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: ${{ matrix.node }}
```

### actions/upload-artifact

Store build outputs, logs, or reports:

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: test-reports
    path: ./reports/
    retention-days: 30
```

### actions/download-artifact

Retrieve artifacts from previous jobs:

```yaml
- uses: actions/download-artifact@v4
  with:
    name: test-reports
```

---

## Context Variables

Access workflow and environment metadata via `${{ }}` syntax:

```yaml
# Workflow context
${{ github.repository }}      # owner/repo
${{ github.ref }}             # refs/heads/main
${{ github.sha }}             # Commit SHA
${{ github.event_name }}      # push, pull_request, etc.

# Trigger context (pull_request events)
${{ github.event.pull_request.number }}
${{ github.event.pull_request.head.sha }}
${{ github.event.pull_request.base.ref }}

# Matrix context
${{ matrix.node-version }}
${{ matrix.os }}

# Job context
${{ job.status }}             # success, failure, cancelled
```

For pull request events, use `github.event.pull_request` to access PR metadata safely.

---

## Expressions and Functions

### if Conditionals

```yaml
if: github.ref == 'refs/heads/main'
if: github.event_name == 'push'
if: contains(github.event.head_commit.message, '[skip ci]')
```

### Comparison Functions

```yaml
contains(haystack, needle)
startsWith(string, prefix)
endsWith(string, suffix)
fromJson(json_string)
hashFiles(glob_pattern)  # Hash file contents
```

### Job Status Functions

```yaml
always()        # Always run
success()       # Previous steps succeeded
failure()       # Previous steps failed
cancelled()     # Workflow was cancelled
```

---

## Environment Variables

### Workflow-Level

```yaml
env:
  REGISTRY: ghcr.io
  IMAGE: ${{ github.repository }}
```

### Job-Level

```yaml
jobs:
  build:
    env:
      NODE_ENV: production
```

### Step-Level

```yaml
- run: npm test
  env:
    DEBUG: true
```

Step-level variables override job and workflow levels.

---

## Secrets and Sensitive Data

Use the `secrets` context to access repository secrets securely:

```yaml
- run: npm publish
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Secrets are masked in logs automatically. See security-and-secrets.md for permissions and best practices.

---

## Outputs and Job Dependencies

### Job Outputs

Define outputs to share data between jobs:

```yaml
jobs:
  build:
    outputs:
      build-id: ${{ steps.build.outputs.id }}
    steps:
      - id: build
        run: echo "id=12345" >> $GITHUB_OUTPUT

  deploy:
    needs: build
    steps:
      - run: echo "Deploying ${{ needs.build.outputs.build-id }}"
```

The `needs:` keyword creates explicit job dependencies and allows data passing.

---

## Default Shell and Working Directory

### Shell Selection

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        shell: bash
        working-directory: ./src
    steps:
      - run: npm test  # Runs in ./src with bash
```

---
