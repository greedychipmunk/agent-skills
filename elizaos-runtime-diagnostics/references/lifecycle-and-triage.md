# Lifecycle and failure triage

Use the pinned 2.x lifecycle only when it matches the installed host. Core does
not automatically compose the app's plugins or load arbitrary environment
variables. Trace the host's effective configuration and plugin registration;
shell presence alone cannot prove a provider is selected.

## Ordered host boot

The [typed boot pipeline](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/src/runtime/boot-pipeline.ts)
declares: `load-config`, `resolve-settings`, `resolve-plugin-plan`,
`construct-runtime`, `initialize-runtime`, `attach-host`,
`start-deferred-capabilities`, `register-process-lifecycle`.
Some phases are host/path dependent; do not infer failure just because a Cloud
proxy or headless host does not follow every local interactive step.

The [host implementation](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/src/runtime/eliza.ts)
preregisters core plugins in dependency-aware waves before runtime initialization;
other character plugins register during initialization. Deferred feature plugins
and capabilities continue after initial readiness. Boot result types distinguish
`{mode: "local", runtime}` from `{mode: "cloud", proxy}`.

The [core runtime](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/runtime.ts)
registers security/character plugins, invokes plugin initialization, establishes
adapter readiness, runs migrations (unless explicitly skipped by the host), and
ensures persisted agent identity/settings. Plugin registration can fail; service
startup failures are tracked independently. Preserve the original error rather
than masking it with a later symptom or starting repeated replacement runtimes.

## Focus the next observation

| Failure class | Observe before proposing a change |
| --- | --- |
| Config/launch | First error, actual executable and manifest versions; no automatic reinstall |
| Plugin load/init | Named failed plugin, selected backend compatibility, dependencies and registration order |
| Services/connectors | Failed service types and connector status; configured is not connected |
| Missing text handler | Actual registered provider, host-selected settings, plugin activation; not just key presence |
| Local-only model | Usable weights readiness, supported backend/hardware and existing download status; no unapproved download |
| Cloud model | Cached catalog availability versus unknown/outage; selected model ID versus credentials/billing |
| Embeddings | Registered embedding handler and dimension/schema compatibility; chat health does not establish retrieval health |
| Missing feature route | Deferred boot pending/failed versus unavailable plugin; do not guess the path |

Readiness comes from [health implementation](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/src/api/health-routes.ts):
`canRespond` needs running state, live runtime and an actual text provider behind
the local-inference router. A router alone cannot generate text. Sole-local
readiness may report `model_not_loaded`. Cloud catalog can report
`model_not_available`; unavailable catalog information stays `unknown` rather
than proving a model is gone. These are readiness signals, not successful paid
inference receipts.

## Shut down only through the owning host

Core `stop()` closes admissions/aborts turns, drains relevant work, stops services
and clears handlers; database teardown additionally requires `close()`.
`requireQuiescence` exists for strict host-controlled draining. Fast shutdown is
not equivalent to confirmed quiescence. Do not manually invoke library methods
against a live production process as a diagnostic trick.

[Process lifecycle](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/src/runtime/process-lifecycle.ts)
runs registered teardown callbacks in reverse order, idempotently; CLI/direct-run
boundaries own SIGINT/SIGTERM handlers and exit status. Use the operator's actual
supervisor/launcher and wait for termination before replacing an instance. Never
kill every similarly named process or assume a client disconnect stops the agent.
