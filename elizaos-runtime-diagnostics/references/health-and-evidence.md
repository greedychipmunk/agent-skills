# Health, logs, and authorization

Baseline routes are for the standalone/local agent host, not a universal Cloud
management API. Confirm installed source, actual origin, and authorization first.
Use bounded requests to an existing approved instance; do not start one to probe.
No default port or additional route is implied here.

## Readiness semantics

[Health routes](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/src/api/health-routes.ts):

| Route | Read and interpret |
| --- | --- |
| `GET /api/status` | State, live model, startup, pending restart, `canRespond`, local/Cloud readiness |
| `GET /api/health` | Ready, database liveness, plugin failures, failed service types, connectors, deferred boot |

`ready` excludes starting/restarting and terminal database failures, but can be
true while stopped/paused/error. It is not proof of chat capability. A terminal
database failure produces 503; a transient failure may still produce 200. Read
JSON fields. `deferredBoot.settled` is a better feature-readiness boundary than an
arbitrary sleep; also inspect failed deferred phases.

Status Cloud `connectionStatus` reflects provisioning/key presence, not a verified
round trip. Model readiness uses cached catalog/local availability information
without initiating inference or loading weights.

The [database liveness probe](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/src/api/database-liveness.ts)
attempts a real `SELECT 1` through available adapter surfaces, otherwise falls
back to adapter readiness where supported. It is not a schema/integrity/backup
check. Rate-limit polling and impose a client-side timeout.

## Preserve authentication boundaries

[Auth helpers](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/src/api/server-helpers-auth.ts)
distinguish trusted-local, owner API-token, registered host-session, and service
gateway authority. A service-gateway token is not blanket owner-private disclosure
permission. Strict-local-auth devices and Cloud containers must not be treated as
implicitly trusted just because a socket is loopback. The health route deliberately
returns only `{ready}` to callers failing its trusted-local check. Do not weaken
binding/CORS/Host/origin/token rules or spoof headers to retrieve richer details.

Use the approved secret channel/client for bearer credentials; never put tokens
in diagnostic URLs, shell transcripts, examples, or shared reports. A 401/403 is
an authorization finding, not permission to disable security. Do not export full
environment/configuration or run `env list` as a credential test.

## Collect only enough evidence

[Diagnostics route implementation](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/src/api/diagnostics-routes.ts)
supports `GET /api/logs` with exact `source`, `level`, `tag`, and `since` filters.
`since` accepts canonical epoch milliseconds or ISO timestamps. Example path:
`/api/logs?level=error&since=2026-10-15T04%3A00%3A00Z` (use incident time).
There is no verified GET-log `limit` parameter; use narrow time/source filtering
and a client response-size budget instead of assuming one.

`GET /api/security/audit?limit=50` provides an authorized bounded snapshot;
`limit` is clamped to 1–1000. Avoid `stream` for a one-time investigation.
Buffers/feeds are process-local and are not guaranteed durable history. An empty
buffer does not prove an event never occurred.

Exclude `GET /api/runtime` (deep reflective object graph), bulk log export, and
autonomy feeds from default collection. Even with serializer redaction, sensitive
data can remain in free text. Never use `DELETE /api/logs` during investigation.
Ask for a small redacted error window, retaining timestamp, component and error
code but removing credentials, DSNs, prompts, private URLs/paths, identities and
wallet material. Treat downloaded reports as sensitive, not automatically safe
to upload.
