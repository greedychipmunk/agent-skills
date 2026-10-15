---
name: elizaos-runtime-diagnostics
description: Diagnoses elizaOS startup, plugin, database, service, and model readiness failures across local runtimes and Cloud hosts. Use for boot errors, missing providers, failed connectors, unhealthy agents, migration blocks, or version-sensitive runtime troubleshooting; includes a secret-free offline presence and manifest inventory helper.
license: MIT
compatibility: Python 3.10+ on Linux/macOS for the optional offline helper. Operational commands must match the target installation.
metadata:
  author: greedychipmunk
  version: "1.0"
---

# elizaOS Runtime Diagnostics

## Establish version and authority

Identify the installed release/commit, launch mechanism, OS, host type, actual
API origin, database backend, intended provider, and first error timestamp.
Confirm ownership and permission to inspect that instance. Distinguish a
core-only embedding, standalone agent, app/desktop host, Cloud container, and
Cloud thin client. Do not assume a thin client has a local runtime.

Read [version and command provenance](references/version-and-commands.md) before
suggesting commands. This baseline is develop commit
`eb9a6f7d3ccc46d3ff9d173383cff900004738c9` (2026-10-15), not legacy 1.x CLI docs.
Recheck corresponding source when the installed version differs. Do not install,
upgrade, build, or execute upstream code just to diagnose it.

## Start offline

1. Ask for the precise failure and a small redacted existing error window. Do
   not request complete environment/configuration/log dumps or provider keys.
2. Inspect manifest metadata and only explicitly requested environment-variable
   **presence** with the bundled Python-stdlib helper, if useful:

   ```sh
   python3 scripts/offline_report.py --manifest /approved/checkout/package.json \
     --env OPENAI_API_KEY --env POSTGRES_URL
   ```

   Resolve the script relative to this skill, not the target repo. With no
   arguments it inspects nothing. It never reads environment values, `.env`,
   configuration, logs, or databases; executes no subprocesses; and makes no
   network requests. Manifest reads are explicit, bounded, regular-file-only,
   and reject symlink components. Use trusted stable parent directories; this
   is not a sandbox against concurrent directory replacement. Presence means
   name exists, even if empty; it does not establish validity, activation, or
   runtime inheritance. Only known script **names**, never bodies, are reported.
   Exit 0 means the requested inventory was built, 1 means at least one manifest
   could not be inspected, and 2 means invalid arguments/limits. None proves
   runtime readiness or credential validity.
3. Do not infer that a core runtime automatically reads arbitrary process
   environment. Trace host configuration, plugin configuration, and provider
   registration at the installed revision before changing a setting.

## Classify the failure

Read [lifecycle and failure triage](references/lifecycle-and-triage.md) for phase
ordering and plugin/model/deferred-capability distinctions.

| Symptom | First distinction |
| --- | --- |
| Process exits before listener | Launch/config/plugin import versus adapter/migration failure; use first existing error |
| Shell opens but cannot chat | Runtime state, actual text-handler registration, local weights, Cloud model catalog |
| Feature route initially returns 404 | Deferred boot pending versus failed/missing plugin; do not invent an endpoint |
| Connector configured but unavailable | Configuration presence versus active service and connector health |
| Database error | Selected backend, liveness, compatibility, migration state; never reset data as diagnosis |

## Inspect an already-running instance only with permission

Read [health, logs, and authorization](references/health-and-evidence.md) before
probing. Use verified `GET /api/status` and `GET /api/health` only at the
operator-confirmed origin. Apply a short client timeout and bounded retries;
do not embed credentials in URLs or paste them into chat. Preserve existing
Host/origin/token policy. Remote health deliberately discloses less than trusted
local health. HTTP 200 is not proof that an agent can answer.

Treat log/audit reads as sensitive data access. Prefer filtered existing logs;
exclude deep runtime reflection and bulk exports by default. Preserve evidence;
never clear buffers. Distinguish cached readiness from an actual provider call.
Do not test chat, embeddings, model generation, wallets, browser automation, or
connectors merely as health checks: these may spend money or cause effects.

## Propose repair, do not silently perform it

Read [database recovery boundaries](references/database-and-recovery.md) before
storage work. Obtain explicit approval for starting/restarting, changing
credentials/configuration, installing plugins, network/provider tests, or
migrations. State expected effects, cost limit, data risk, and rollback plan.
Stop only the owned process through its launcher/supervisor; avoid broad kills.
Never enable destructive migration flags, delete storage, or run resets as a
routine troubleshooting step.

Use exact-file tests only after approval in a prepared isolated checkout;
read the test for provider/network/effect requirements first. Do not describe
source-verified commands as execution-tested.

## Return actionable evidence

Report installed version/host; observed symptom and first failing phase;
sanitized evidence; remaining unknowns; least-risk next check; proposed repair
and required permission; verification and rollback criteria. Separate
observations from hypotheses. Keep secrets, connection strings, prompts, private
paths, wallet material, and account identifiers out of shared reports.
