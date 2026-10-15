# Evidence-based retrieval evaluation

This is a recommended evaluation method, not a built-in elizaOS benchmark runner
or proof of behavior. Run against the authorized installed retrieval path;
source inspection and synthetic result lists cannot validate production access.

## Build a small frozen, labeled corpus

Use approved or synthetic non-sensitive documents. Freeze source revisions,
extraction/chunking configuration, actual embedding representation and access
policy. Include near-duplicates and a replaced document with different facts.
Create query cases with trusted requester identity/membership, expected allowed
source IDs/spans, forbidden source IDs and whether the answer is absent.
Keep labels independent of generated answers and inspect them manually.

Minimum case matrix:

| Case | Evidence to inspect |
| --- | --- |
| Exact term and paraphrase | Expected source in ranked results and supporting span |
| Boundary-spanning fact/table/code | Enough original context to support the answer |
| No supporting evidence | Empty/low-evidence retrieval handled without fabricated citation |
| Duplicate and changed revision | No stale fact presented as current; lineage preserved |
| Malicious instructions in a document | Content never changes tool, access or disclosure policy |
| Other tenant/private room/unresolved requester | No unauthorized IDs, snippets, counts or expansions |
| Grant revocation/membership loss | Search, direct lookup, cached citation and media access rechecked |
| Interrupted import/backfill and retry | No mixed generations; ready status agrees with coverage |

## Record runs reproducibly

Capture corpus revision, installed versions, requester policy fixture, vector
space, width, query text or protected query ID, top-k, threshold, filters,
reranking settings, result ranks/scores, IDs/revisions, source spans, latency,
embedding/generation usage and errors. Preserve ordering and empty-result cases.
Hash sensitive case identifiers or keep the entire evidence store private;
hashes alone do not anonymize predictable queries.

Measure retrieval separately from answer generation:
- **Recall@k:** retrieved relevant units / all labeled relevant units.
- **Precision@k:** relevant retrieved units / retrieved units (state how empty
  results and fewer-than-k results are handled).
- **MRR:** reciprocal rank of the first relevant result, zero if none; average
  across cases. Define whether relevance is at document or fragment level.
- **Citation support:** fraction of evaluated answer claims supported by their
  cited original spans; also inspect material uncited claims and source access.
- **Abstention:** behavior on answer-absent cases, including false confident
  answers and unwarranted abstentions on answerable cases.
- **Isolation:** forbidden result/expansion disclosures; require zero, regardless
  of average relevance. Also inspect counts, cached snippets and media links.

Document denominator, sample size, exclusions and label disagreements. Compare
latency percentiles, cost and error/coverage rates alongside relevance. A single
similarity score is not an accuracy measure and is not calibrated across models.

## Diagnose one stage at a time

1. Missing source: inspect approved manifest, extraction, revision state, vectors,
   then requester access. Never widen permissions just to increase recall.
2. Relevant source absent from candidates: inspect query/document space match,
   filters and chunk boundaries before threshold or top-k tuning.
3. Good candidate ranked poorly: compare lexical, vector and reranking behavior
   using identical labeled cases; verify access is applied before pagination.
4. Good evidence retrieved but bad answer: inspect context selection, truncation,
   original/enriched-text separation and citation generation, not embeddings alone.

Predeclare release criteria appropriate to risk; do not invent universal targets.
Require zero access violations, no unexplained stale-source regression, acceptable
coverage and an owner-approved quality/cost/latency tradeoff. Report baseline and
candidate values, failed cases and limitations; do not repeat public claims of
50% better accuracy or 90% lower cost as measured outcomes.
