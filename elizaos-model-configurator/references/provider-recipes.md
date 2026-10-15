# Provider choices and settings

Read the installed package's own settings and capability registrations. The
pinned READMEs and entry points are linked in the source reference. Provider
package, registration ID, text tier and concrete model ID are different things.

## Direct hosted providers

| Provider package | Credential/configuration names verified in source | Boundary |
| --- | --- | --- |
| `@elizaos/plugin-openai` | `OPENAI_API_KEY`; tier keys such as `OPENAI_SMALL_MODEL`, `OPENAI_LARGE_MODEL`; `OPENAI_EMBEDDING_MODEL` | Text and several embedding/media capabilities; inspect exact installed handlers and compatible-endpoint configuration |
| `@elizaos/plugin-anthropic` | `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY`; `ANTHROPIC_AUTH_MODE`; tier keys such as `ANTHROPIC_SMALL_MODEL`, `ANTHROPIC_LARGE_MODEL` | Text/reasoning/image-description/structured output; do not infer embedding support from text success |
| `@elizaos/plugin-elizacloud` | `ELIZAOS_CLOUD_API_KEY`, `ELIZAOS_CLOUD_BASE_URL`, `ELIZAOS_CLOUD_ENABLED` | Hosted model routing plus provisioning/bridge services; enabling the plugin can do more than select a chat model |

These are setting names, not instructions to paste values into character JSON.
Do not enable OAuth, read CLI credential stores or mint Cloud keys implicitly.
Use only the chosen authentication mode and account with approval.

Current OpenAI helpers resolve runtime values first, then process environment,
then a supplied default. Core getSetting has a different per-agent resolution
boundary. Inspect both layers; avoid broad host credentials in multi-tenant
processes. Use actual isolation for strong boundaries, not a prompt instruction.

OpenAI-compatible gateways can differ in API paths, auth, model names, schema,
tool/vision/media support and streaming. Verify the intended origin before any
credentialed call. Do not swap a provider label while leaving an old provider's
endpoint or key in place. A supported endpoint override is not permission to
send private data there.

## On-device inference

`@elizaos/plugin-local-inference` supplies supported text, embeddings, speech and
vision through native backends and downloaded artifacts. The current app README
points to Settings → Model Routing; an embedded runtime must use its own host
composition instead of assuming that UI exists.

Initial artifact downloads require network and disk. Hardware support, model
warmup and each capability must be verified independently. No usable model is
unavailable inference, not permission to fabricate output or silently route to
Cloud. Local-first is not offline-only if hosted fallbacks remain registered.
Do not promise zero total cost or offline operation before artifacts and routing
are verified. Legacy Ollama docs do not establish compatibility with this host.

## Separate embeddings deliberately

`@elizaos/plugin-embeddings` uses `EMBEDDING_BASE_URL`, optional
`EMBEDDING_API_KEY`, `EMBEDDING_MODEL` and `EMBEDDING_DIMENSIONS`. Either base URL
or key can activate it, but requests require a base URL. Supported snapshot
widths are 384, 512, 768, 1024, 1536, 2048 and 3072; default is 1536. Verify the
installed contract rather than making these universal settings.

Its `EMBEDDING_FALLBACK_BASE_URL`, `_API_KEY`, `_MODEL` configure one fallback
that must match dimensions. Matching dimensions do **not** prove the same vector
space. A different embedding model/preprocessing can require full re-embedding,
even at the same width. Do not freely mix existing vectors across models.

Current core also pins ordinary embedding calls to the provider used for its
dimension probe, disabling cross-provider mid-call failover. An explicit provider
argument can override selection; that does not make a mismatched vector safe.
Plan storage migration/cutover separately with approved data custody and backups.
