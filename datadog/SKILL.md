---
name: datadog
description: Query Datadog observability data including logs, metrics, monitors, dashboards, hosts, APM spans, and incidents via direct API. Use when investigating production issues, checking monitors, searching logs, alerting, or accessing Datadog data.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Datadog Skill

Query Datadog observability data via the API. Read-only access to logs, metrics, monitors, dashboards, hosts, APM, and incidents.

## When to Use

- Investigating production issues or outages
- Checking monitor status and alert history
- Searching logs for errors or patterns
- Reviewing APM traces and service maps
- Pulling metric data for dashboards
- Checking host infrastructure status

## Prerequisites

```bash
# Required environment variables
export DD_API_KEY="your-api-key"
export DD_APP_KEY="your-application-key"
export DD_SITE="datadoghq.com"  # or datadoghq.eu, us3.datadoghq.com, etc.
```

## Usage

The bundled script provides a CLI interface to Datadog API endpoints:

```bash
# Search logs
npx tsx scripts/datadog.ts logs search --query "service:api error" --from 1h

# Get metrics
npx tsx scripts/datadog.ts metrics query --metric "system.cpu.user" --from 1h

# List monitors
npx tsx scripts/datadog.ts monitors list

# Get dashboard
npx tsx scripts/datadog.ts dashboards get --id abc-123

# List hosts
npx tsx scripts/datadog.ts hosts list

# APM traces
npx tsx scripts/datadog.ts traces list --service api --from 1h
```

## Common Patterns

### Incident Investigation

```bash
# 1. Check for firing monitors
npx tsx scripts/datadog.ts monitors list --status alert

# 2. Search error logs
npx tsx scripts/datadog.ts logs search --query "status:error" --from 30m

# 3. Check APM for slow traces
npx tsx scripts/datadog.ts traces list --service api --from 30m
```

### Log Search Syntax

```
# By service
service:api-service

# By status
status:error OR status:warn

# By time range
@timestamp:[now-1h TO now]

# Combined
service:api-service status:error "timeout"
```

### Metric Queries

```
# Simple metric
avg:system.cpu.user{host:my-host}

# By tag
avg:system.cpu.user{env:production}

# Rate
diff(avg:system.cpu.user{host:my-host})
```

## Notes

- All operations are read-only — no write or modify operations
- API and application keys need appropriate scopes
- Respect rate limits on high-volume queries
- Use `--from` to limit time ranges (default: 1h)
