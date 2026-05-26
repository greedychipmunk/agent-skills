---
name: github-ci
description: Write and maintain GitHub Actions CI workflows, including workflow YAML structure, triggers, runners, matrix builds, caching, testing patterns, and secrets management. Use when working with .github/workflows, GitHub Actions, CI pipelines, workflow dispatch, or action configuration.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# GitHub CI

Write and maintain GitHub Actions CI workflows with confidence. This skill covers workflow design, runner configuration, testing patterns, and security best practices for continuous integration pipelines on GitHub.

---

## Intent Router

Load reference files for depth on specific topics:

| Topic | File | Load when... |
| --- | --- | --- |
| Workflow Basics | `resources/workflow-basics.md` | Learning workflow YAML structure, triggers, jobs, and built-in actions |
| Runners & Caching | `resources/runners-and-caching.md` | Configuring runners, setting up caching, or optimizing build performance |
| Testing Patterns | `resources/testing-patterns.md` | Implementing test runs, reporting results, or integrating coverage tools |
| Security & Secrets | `resources/security-and-secrets.md` | Managing secrets, permissions, and third-party action safety |

---

## Quick Start

### Basic GitHub Actions Workflow

1. **Create workflow file** — Save as `.github/workflows/ci.yml` in repository root
2. **Define triggers** — Use `on:` to specify when workflow runs (push, pull_request, schedule)
3. **Configure job** — Define jobs with name, runner type, and steps
4. **Add checkout** — Use `actions/checkout@v4` to access repository code
5. **Run commands** — Add steps with `run:` or use community actions

### Minimal Workflow

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running CI pipeline"
```

### Workflow Anatomy

```yaml
workflow
├── name: Display name
├── on: Trigger events (push, pull_request, schedule, workflow_dispatch)
├── env: Workflow-level environment variables
└── jobs:
    └── <job-name>:
        ├── runs-on: Runner type (ubuntu-latest, windows-latest, macos-latest)
        ├── env: Job-level environment variables
        ├── strategy: Matrix, fail-fast, max-parallel settings
        └── steps:
            ├── uses: Pre-built action
            └── run: Shell command or script
```

### File Location

All workflows must be in `.github/workflows/` directory with `.yml` or `.yaml` extension. Use kebab-case for filenames: `build-and-test.yml`, `deploy-production.yml`.

### Quick Validation

Validate YAML syntax before pushing:

```bash
docker run --rm -v "$(pwd):/data" pipelinecomponents/yamllint yamllint /data/.github/workflows/
```
