# Authorized retrieval, sharing and citation expansion

## Use the correct authority contract

The pinned [AccessContext](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/access-context.ts)
requires `requesterEntityId`; optional fields include `worldId`,
`authorizedRoomIds`, role, ownership and connector source. Obtain these from
trusted identity/membership resolution, never model output or unchecked query
parameters. For agent-scoped reads explicitly identify the agent requester.

Important semantics from the contract:
- Omitting `accessContext` disables access-context filtering; separate adapter
  RLS remains a separate boundary, not a guaranteed fallback.
- Empty `authorizedRoomIds` denies room-backed records. Omitting it instead
  applies scope-only filtering; topology-aware callers must supply verified rooms.
- Apply world/room/disclosure intersections before ranking and pagination.
  Filtering a global top-k afterward is neither correct isolation nor recall.

The [document database contract](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/database.ts#L149-L244)
uses a **different** `DocumentRequesterContext`: `agentId`,
`requesterEntityId`, `requesterRoomIds`, `requesterRole`. Do not pass
`AccessContext` as if it were interchangeable. Document list scopes are limited
to `global`, `owner-private`, `user-private`, `agent-private`; do not assume all
`MemoryScope` values are valid document-list scopes.

## Pick a verified retrieval surface

- Document-store v4 declares `queryDocuments`, `getDocument`,
  `queryDocumentFragments` and atomic mutation contracts. Parent document
  visibility governs fragment authorization, not copied fragment metadata.
  Do not replace missing capabilities with a bounded unfiltered scan.
- `queryDocumentFragments` takes `limit`, optional `offset`, document/room/world/
  entity filters, `embedding`, and camel-case `matchThreshold`.
- Generic `searchMemories` takes `embedding`, `tableName`, optional `query`,
  `match_threshold`, `count`/`limit`, `offset`, scope filters and `accessContext`.
  Its spelling differs. Verify the actual runtime wrapper and adapter before
  calling it; do not invent table names, score scales or parameter aliases.
- Adapters own retrieval and optional reranking. Preserve semantic-only candidates
  when combining lexical signals. Treat thresholds and top-k as measured tuning
  parameters, not universal constants copied from public docs.

## Keep discovery and sharing distinct

[Document metadata](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/memory.ts)
explicitly labels `pinTargets` as discovery placement, not access. It also exposes
read-only `directGrantEntityIds` independent of room membership. Do not confuse
these document grants with artifact `share.grants` (`full`/`redacted`) on a
referencing record or infer that changing scope is equivalent to granting access.
Use the verified service policy and atomic grant update path. Test both grant
revocation and membership loss, including continued direct-grant behavior where
intended. Never interpret `global` as permission to cross arbitrary tenants.

## Preserve evidence through expansion

The [progressive content contract](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/content.ts)
uses opaque references, revision, bounded line/fragment/byte ranges, slice/source
hashes and completeness states. A reference is not ambient authorization; its
owning service must resolve it again. Recheck access on follow-up reads, original
media downloads and cached citations. Keep internal `sourceFingerprint` private;
the database contract requires an opaque public revision at the service boundary.

Cite only retained, authorized source spans. Record document/revision, fragment
position or exact range and the supporting excerpt in protected evidence. Do not
silently merge changed revisions across pages. Distinguish complete,
partial-recoverable, partial-source-loss and unavailable reads; do not claim the
whole source was read when only a slice was available.
