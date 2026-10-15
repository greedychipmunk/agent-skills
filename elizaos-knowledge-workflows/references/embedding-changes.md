# Changing embedding providers, models or dimensions

## Treat this as a corpus representation migration

Record actual provider, encoder/model revision, vector width, pooling,
normalization and text preprocessing for both documents and queries. Equal width
does not imply compatible semantic space. Generation-model choice and document
contextual-enrichment choice are separate from embedding-model choice.
Do not mix old and new document vectors in a single comparable ranking.

The pinned [embedding-vector-space source](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/embedding-vector-space.ts)
provides `identifyEmbeddingVector`, `getEmbeddingVectorSpace` and
`copyEmbeddingVectorSpace`. The identity must describe an actual provider-verified
representation, not a configured model name alone. It is a non-enumerable symbol
marker on the numeric array; do not assume it survives JSON serialization.
Relabeling an identified vector as another representation is rejected. Copying
provenance requires an exact finite numeric copy; transformed vectors need their
own encoder contract. Never add a marker merely to bypass compatibility checks.

The [adapter contract](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/database.ts#L977-L990)
declares:
- `ensureEmbeddingDimension(dimension): Promise<void>`;
- optional `ensureEmbeddingSpace(spaceId): Promise<UUID[]>`, selecting a
  representation and returning source memories needing re-embedding;
- `clearEmbeddingsOutsideActiveDimension(): Promise<UUID[]>`, deleting
  mismatched-width stored embeddings and returning source IDs for re-embedding.
  In-memory adapters may return an empty array.

These declarations do not prove automatic migration, index rebuilds, transactional
cutover or preservation of existing vectors. The clear operation is destructive,
not a harmless validation call. Do not call it during evidence collection.

## Recommended gated change procedure

1. Snapshot a sanitized baseline: corpus revision, eligible/embedded counts,
   failed/pending counts, provider identity, width, retrieval settings and labeled
   evaluation results. Verify query and document vectors use the same space.
2. Obtain approval for the specific migration scope, external processing, cost,
   downtime and any vector deletion. Preserve an authorized restorable backup
   through the host's documented procedure; delegate backend recovery details to
   `elizaos-runtime-diagnostics`.
3. Inspect installed provider, runtime and adapter handling of space changes,
   caches, schema/index width, queued writes and fallback providers. Stop if the
   implementation cannot distinguish same-width incompatible spaces. Do not
   invent an environment variable, migration command or SQL repair.
4. Prefer a separately versioned candidate index/corpus when the installed stack
   supports it. Otherwise plan controlled downtime and writer coordination; a
   shadow index is a design option, not an asserted elizaOS feature.
5. Re-embed every affected eligible source from retained approved text. Keep
   authorization, parent/fragment revisions and source lineage intact. Bound
   concurrency/retries and verify coverage, not just successful API calls.
6. Regenerate query vectors with the candidate encoder; invalidate incompatible
   cached queries/results through verified application mechanisms. Check finite
   numeric values, correct width and identity. Do not pad, truncate, relabel or
   average incompatible vectors to satisfy storage.
7. Rerun fixed relevance, citation and access-negative evaluations, including
   migration interruption and retry. Cut over only after approved criteria pass.
   Roll back encoder **and** index/corpus identity together, not one independently.

The [embedding service source header](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/services/embedding.ts#L1-L11)
describes asynchronous memory embedding. Queue admission or import completion
alone is not proof that every vector is searchable. Verify installed readiness
semantics and measure actual backfill completion; do not infer a universal
synchronous ingestion API or provider-switch recovery mechanism.
