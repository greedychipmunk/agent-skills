---
name: sentry
description: Inspect Sentry issues or events, summarize recent production errors, or pull basic Sentry health data via the Sentry API. Perform read-only queries with the bundled script. Requires SENTRY_AUTH_TOKEN. Use when investigating production errors, checking Sentry issues, or reviewing error trends.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Sentry Skill

Inspect Sentry issues and events, summarize production errors, and pull health data via the Sentry API. Read-only access using the bundled Python script.

## When to Use

- Investigating production errors or exceptions
- Summarizing recent error trends
- Checking issue details, stack traces, and event counts
- Reviewing release health and adoption
- Pulling project or organization-level Sentry data

## Prerequisites

```bash
# Required environment variable
export SENTRY_AUTH_TOKEN="your-auth-token"

# Set script path (adjust to your installation)
export SENTRY_API="scripts/sentry_api.py"
```

## Usage

```bash
# List recent issues
python3 $SENTRY_API issues list --org my-org --project my-project

# Get issue details
python3 $SENTRY_API issues get --org my-org --issue-id 12345

# List events for an issue
python3 $SENTRY_API events list --org my-org --issue-id 12345

# Search issues
python3 $SENTRY_API issues search --org my-org --query "TypeError" --project my-project

# Release health
python3 $SENTRY_API releases list --org my-org --project my-project
```

## Common Patterns

### Error Investigation

```bash
# 1. List recent unresolved issues
python3 $SENTRY_API issues list --org my-org --project my-project --query "is:unresolved"

# 2. Get details on a specific issue
python3 $SENTRY_API issues get --org my-org --issue-id 12345

# 3. View recent events
python3 $SENTRY_API events list --org my-org --issue-id 12345
```

### Trend Analysis

```bash
# Search for specific error types
python3 $SENTRY_API issues search --org my-org --query "TypeError" --project my-project

# Check release health
python3 $SENTRY_API releases list --org my-org --project my-project
```

## Notes

- All operations are read-only — no write or modify operations
- Auth token needs appropriate scopes (org:read, project:read)
- Script path depends on your installation directory
- Use `--help` on any subcommand for available options
