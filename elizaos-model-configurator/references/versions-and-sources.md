# Versions, source authority and documentation drift

Read on 2026-10-15. Baseline develop commit:
`eb9a6f7d3ccc46d3ff9d173383cff900004738c9`.
Root manifest was 2.0.4; core was 2.0.3-beta.7. Neither is a statement about npm
dist-tags, the installed CLI or a user's running deployment.

Prefer installed declarations/lockfile and matching implementation → owning
README at that revision → pinned develop for develop work → unversioned prose.
Do not execute code to inspect versions. Read targeted files, not the entire
monorepo or full runtime. Inspect implementation when a source comment conflicts
with an executed branch; mark uncertainty rather than guessing.

## Pinned implementation

- [Runtime public model APIs](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/runtime.ts)
- [Model types, parameters, results and fallback chains](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/model.ts)
- [Model dispatch and selection](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/runtime/model-dispatch.ts)
- [Core host composition](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/README.md)
- [OpenAI README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/plugins/plugin-openai/README.md), [registration/settings](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/plugins/plugin-openai/index.ts), [configuration helpers](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/plugins/plugin-openai/utils/config.ts)
- [Anthropic README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/plugins/plugin-anthropic/README.md), [registration/settings](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/plugins/plugin-anthropic/index.ts)
- [Local inference README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/plugins/plugin-local-inference/README.md), [provider entry](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/plugins/plugin-local-inference/src/provider.ts)
- [Cloud provider README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/plugins/plugin-elizacloud/README.md)
- [Bring-your-own embeddings README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/plugins/plugin-embeddings/README.md)

## Official conceptual docs

[Model management](https://docs.elizaos.ai/runtime/models.md) and
[language-model configuration](https://docs.elizaos.ai/plugin-registry/llm.md)
describe useful concepts, but several examples do not match this snapshot:

| Public recipe | Snapshot contract / safe response |
| --- | --- |
| `text:large`, `image:generation` type strings | Use exported constants; current values include `TEXT_LARGE`, `IMAGE` |
| `Plugin.models` as registration array | Current maintained plugins use a model-type-keyed handler object |
| Embedding `{input: ...}` | Current core uses `{text: ...}` or supported string input; batch uses `{texts: [...]}` |
| Automatic failover on every error | Selection pins, error classification, cancellation and output-start rules restrict failover |
| Load order alone selects provider | Check actual registrations, priorities, host routing and overrides |
| `getModelProviders()` | Use the installed public API; current core exposes `getModelRegistrations()` |
| Echo an API key to debug | Inspect presence/authorized resolution without revealing values |

Do not repeat tutorial model IDs, prices or latency claims as current facts.
No live provider, registry authentication or model availability was tested in
preparing this skill. Inline calls are source-derived examples, not runtime proof.
