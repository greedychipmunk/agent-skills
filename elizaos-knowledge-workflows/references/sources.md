# Version boundary and source map

Baseline: official `elizaOS/eliza` repository, `develop` pinned to
`eb9a6f7d3ccc46d3ff9d173383cff900004738c9`. Read the installed versions before
applying a contract. Public documentation below is unpinned and describes a
plugin-knowledge surface; its relationship to a deployed host must be verified.
This skill intentionally supplies no universal ingestion call or endpoint.

## Pinned official source inventory

All links below identify the same immutable commit. Read only targeted symbols;
do not dump a full runtime or recursively inspect the monorepo.

| File | Evidence / limit |
| --- | --- |
| [Root package](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/package.json) | Root version `2.0.4` |
| [Core package](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/package.json) | Core version `2.0.3-beta.7` |
| [documents.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/documents.ts) | Source descriptors and document record, not ingestion API |
| [memory.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/memory.ts) | Document/fragment metadata, scopes, grants, pins, media lineage |
| [access-context.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/access-context.ts) | Requester authority and omission/empty-room semantics |
| [database.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/database.ts) | Document requester/query/mutation types ~149–294; embedding migration ~977–990; document-store v4 ~1306; searchMemories ~1480 |
| [content.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/content.ts) | Opaque references, ranges, completeness, hashes and validators |
| [embedding-vector-space.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/embedding-vector-space.ts) | Provider-verified representation marker and exact-copy constraints |
| [embedding service](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/services/embedding.ts#L1-L11) | Asynchronous embedding-service overview; not ingestion readiness proof |
| [runtime.ts types](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/runtime.ts) | Targeted embedding/document symbol check only; no huge runtime dump |
| [search.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/search.ts) | Search category registry, not document vector-search implementation |
| [memory-storage.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/memory-storage.ts) | Long-term memory storage interface, not document ingestion |

Do not infer end-to-end enforcement from interfaces. Service, adapter, database
policies, media-serving routes and deployed provider behavior remain separate
verification targets. No plugin-knowledge implementation was validated here.

## Official public docs: conceptual differences

Read these as explanations of RAG, not pinned implementation guarantees:

- [Knowledge & RAG overview](https://docs.elizaos.ai/plugin-registry/knowledge):
  describes multi-format uploads, URL ingestion and automatic context injection.
  Verify installed parsers, authorization, routes and provider behavior before use.
- [Complete developer guide](https://docs.elizaos.ai/plugin-registry/knowledge/complete-documentation):
  shows `KnowledgeService.addKnowledge`, REST routes, `knowledge` and
  `knowledge_embeddings` examples, and `match_count` in one search snippet.
  The pinned generic adapter contract instead declares `count`/`limit`, not
  `match_count`; document queries have a separate authorization-aware contract.
  Treat service names, schemas, table names and startup flags as version-dependent,
  not proof that a pinned host accepts these examples. Never call private
  `_internalAddKnowledge` based on a documentation sketch.
- [Contextual embeddings](https://docs.elizaos.ai/plugin-registry/knowledge/contextual-embeddings):
  explains adding generated document context before embedding. Settings such as
  `CTX_KNOWLEDGE_ENABLED`, 500-token chunks/100 overlap, provider examples and
  caching percentages are not established pinned defaults. Inspect the installed
  implementation and evaluate locally before adopting them. Context-generation
  calls may send the entire document to a model; require destination approval.

Keep portable concepts—extraction, chunking, consistent query/document encoder,
lineage, authorization and measured evaluation—while explicitly re-verifying
version-sensitive mechanics. Do not turn marketing improvements into guarantees.
