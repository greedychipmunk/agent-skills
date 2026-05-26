# Runners and Caching

Learn to configure runners (GitHub-hosted and self-hosted), implement caching strategies, and optimize build performance.

---

## GitHub-Hosted Runners

GitHub provides managed runners for Linux, Windows, and macOS. Each job runs in a fresh virtual machine.

### Available Runner Types

```yaml
runs-on: ubuntu-latest       # Ubuntu 22.04 LTS
runs-on: ubuntu-20.04        # Ubuntu 20.04 LTS
runs-on: ubuntu-18.04        # Ubuntu 18.04 LTS (legacy)

runs-on: windows-latest      # Windows Server 2022
runs-on: windows-2019        # Windows Server 2019

runs-on: macos-latest        # macOS 14 (Sonoma)
runs-on: macos-13            # macOS 13 (Ventura)
runs-on: macos-12            # macOS 12 (Monterey)
```

Use `-latest` for automatic updates or pin versions for consistency:

```yaml
runs-on: ubuntu-22.04  # Pinned; no auto-updates
```

### Pre-Installed Software

GitHub-hosted runners include Docker, Node.js, Python, Ruby, Go, .NET, and other tools. Check the latest versions at `actions/runner-images` on GitHub.

### Resource Limits

- **CPU cores:** 2
- **Memory:** 7 GB (Ubuntu/macOS) or 6 GB (Windows)
- **Disk space:** 14 GB available
- **Job timeout:** 360 minutes (6 hours) unless `timeout-minutes` is set

---

## Self-Hosted Runners

Run workflows on your own infrastructure for custom requirements, private networks, or enterprise policies.

### Runner Configuration

Install the runner application on a machine (Linux, Windows, or macOS):

```bash
# Download and configure runner
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.x.x.tar.gz \
  https://github.com/actions/runner/releases/download/v2.x.x/...
tar xzf actions-runner-linux-x64-2.x.x.tar.gz
./config.sh --url https://github.com/owner/repo --token TOKEN
./run.sh
```

### Runner Labels

Specify self-hosted runners with labels:

```yaml
runs-on: [self-hosted, linux, x64]
runs-on: [self-hosted, docker]
```

Create custom labels during configuration. Use labels to target specific runners or resources.

### Best Practices

- Run the runner process as a service for persistence
- Keep runner software updated
- Use separate runners for different workload types
- Monitor runner health and disk space
- Secure network access to self-hosted runners
- Use repository-level or organization-level runners with appropriate access controls

### Runner Groups

Limit which repositories can use self-hosted runners:

Organization-level runners can be assigned to specific runner groups for fine-grained access control.

---

## Caching Fundamentals

Caching stores build artifacts and dependencies between jobs to avoid re-downloading them.

### Cache Action: actions/cache

Store and restore cached files:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

**Key components:**

- **path:** Directory or file to cache (e.g., `node_modules/`, `~/.gradle/caches`)
- **key:** Unique identifier; cache is restored if key matches exactly
- **restore-keys:** Fallback keys if exact match fails (partial matches)

### Cache Keys and Hash Functions

Use `hashFiles()` to create keys based on dependency files:

```yaml
key: node-${{ hashFiles('package-lock.json') }}
```

If `package-lock.json` changes, a new cache is created. Fallback patterns:

```yaml
key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
restore-keys: |
  ${{ runner.os }}-node-
  ${{ runner.os }}-
```

This tries exact match first, then falls back to `os-node-`, then `os-`.

### Cache Size Limits

- **Per repo:** 5 GB
- **Per file:** 5 GB
- **Oldest entries** are deleted if limit is exceeded

---

## Dependency Caching by Ecosystem

### Node.js / npm

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

The `cache: 'npm'` automatically detects `package-lock.json` and caches `~/.npm`:

```yaml
key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### Python / pip

```yaml
- uses: actions/setup-python@v4
  with:
    python-version: '3.11'
    cache: 'pip'
```

Caches based on `requirements.txt` or `setup.py`:

```yaml
key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
```

Manual cache:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
```

### Java / Gradle

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.gradle/caches
    key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*') }}
    restore-keys: |
      ${{ runner.os }}-gradle-
```

### Ruby / Bundler

```yaml
- uses: actions/cache@v4
  with:
    path: vendor/bundle
    key: ${{ runner.os }}-gems-${{ hashFiles('**/Gemfile.lock') }}
    restore-keys: |
      ${{ runner.os }}-gems-
```

### Go / Modules

```yaml
- uses: actions/cache@v4
  with:
    path: ~/go/pkg/mod
    key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
```

---

## Docker Layer Caching

For Docker builds, cache layers to speed up image builds:

### Build Kit Cache

Enable BuildKit for advanced caching:

```yaml
- run: docker build --cache-from type=registry,ref=ghcr.io/owner/image:buildcache .
  env:
    DOCKER_BUILDKIT: 1
```

### Setup BuildX

Use `docker/setup-buildx-action@v2` for multi-architecture builds with caching:

```yaml
- uses: docker/setup-buildx-action@v2

- uses: docker/build-push-action@v4
  with:
    push: true
    tags: ghcr.io/owner/image:latest
    cache-from: type=registry,ref=ghcr.io/owner/image:buildcache
    cache-to: type=registry,ref=ghcr.io/owner/image:buildcache,mode=max
```

### Dockerfile Caching Tips

- **Order commands** from least to most frequently changing
- **Minimize layers** by combining RUN commands with `&&`
- **Use `.dockerignore`** to exclude unnecessary files
- **Multi-stage builds** reduce final image size

Example:

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Cached layer (changes infrequently)
COPY package*.json ./
RUN npm ci --only=production

# Fresh layer (changes frequently)
COPY . .
RUN npm run build
```

---

## Matrix Strategy

Run jobs across multiple configurations in parallel.

### Basic Matrix

```yaml
strategy:
  matrix:
    node: [18, 20, 22]
    os: [ubuntu-latest, macos-latest]
jobs:
  test:
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```

This creates 3 × 2 = 6 parallel jobs.

### Matrix Include/Exclude

Add or remove specific combinations:

```yaml
strategy:
  matrix:
    node: [18, 20]
    os: [ubuntu-latest, windows-latest]
    include:
      - node: 20
        os: macos-latest  # Add macOS only for Node 20
    exclude:
      - node: 18
        os: windows-latest  # Skip Node 18 on Windows
```

### Fail Fast

```yaml
strategy:
  fail-fast: false  # Continue running other matrix jobs if one fails
  matrix:
    node: [18, 20, 22]
```

By default, `fail-fast: true` cancels remaining jobs on first failure.

### Max Parallel

Limit concurrent matrix jobs:

```yaml
strategy:
  max-parallel: 2  # Only 2 jobs at a time
  matrix:
    node: [18, 20, 22]
```

Useful for resource-constrained environments or rate-limited services.

### Context and Naming

Access matrix variables:

```yaml
- run: echo "Testing Node ${{ matrix.node }} on ${{ matrix.os }}"
- run: npm test
  name: Test Node ${{ matrix.node }}
```

Use `matrix.os`, `matrix.node`, etc., or custom matrix variables.

---

## Performance Optimization Tips

### Parallel Jobs

Use matrix strategy to run tests in parallel:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
  steps:
    - run: npm test -- --shard ${{ matrix.shard }}/4
```

### Selective Workflows

Skip expensive workflows for documentation-only changes:

```yaml
on:
  push:
    paths-ignore:
      - 'docs/**'
      - 'README.md'
```

### Early Exit

Use conditional steps to skip unnecessary work:

```yaml
- run: npm test
  if: github.event_name == 'pull_request'
```

### Artifact Cleanup

Remove old artifacts to free storage:

```yaml
- uses: geekyeggo/delete-artifact@v2
  with:
    name: build-artifacts
```

---
