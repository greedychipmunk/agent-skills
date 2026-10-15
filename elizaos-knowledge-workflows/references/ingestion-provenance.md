# Approved ingestion and provenance

## Separate contract from implementation

At the [pinned document types](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/documents.ts),
`DocumentSourceItem` describes a path or directory; `DocumentDirectory.shared`
is optional. This does not establish an ingestion method, safe crawler,
supported binary parser, sharing policy or automatic loading behavior.
`DocumentItem` has `id`, `content`, optional `metadata`, `worldId`, `similarity`.
Do not manufacture a service API from those data shapes.

The [memory types](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/memory.ts)
distinguish document and fragment records. `FragmentMetadata` requires
`documentId` and `position`; optional `base` carries type, source, sourceId,
scope, timestamp and tags. `DocumentMetadata` includes original-media linkage
(`mediaUrl`, `mediaHash`, `mediaFileName`). These are available fields, not proof
that an installed importer populates them or that media URLs are public-safe.

## Recommended import procedure

1. Prepare an owner-approved manifest: source identifier, source revision/hash,
   title, MIME type, extraction method/version, intended agent/world/rooms,
   ownership, access policy, retention and processing destination. This is an
   operational record, not a proposed elizaOS interface.
2. Validate size/type and allowed path or origin before parsing. Treat URL imports
   as an SSRF boundary: block unapproved origins, redirects and private-network
   targets using the application's verified controls. Avoid credential-bearing
   URLs. Do not process secrets merely because a file is readable.
3. Preview extraction. Flag empty OCR, corrupt text, missing table headers,
   encoding errors and unsupported formats rather than embedding garbage.
4. Choose chunk boundaries against representative retrieval questions. Preserve
   headings, units, code context and a stable position-to-source mapping. Track
   added model-generated context separately; do not cite it as original text.
5. Verify installed deduplication semantics with replay and changed-content tests.
   Do not assume a filename or partial-content hash uniquely identifies a full
   revision. Confirm retry after partial failure does not expose mixed generations.
6. Verify parent/fragment linkage and count, embedding readiness, source expansion
   and access checks. Promote a canary only after successful retrieval checks.

## Revision and deletion discipline

The [database contract](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/database.ts#L247-L294)
provides mutation snapshots, compare-and-swap operations and
`replaceDocumentRevision` with a complete fragment set and fresh fragment IDs.
Snapshots include revision and optional ingestion attempt/state. These are
adapter contracts, not a universal client-side upload recipe. Verify the owning
service's transaction, retry and publication behavior before implementing calls.
Do not publish a ready parent over an incomplete fragment generation.

For approved replacement/deletion, verify behavior for parent, fragments,
vectors, original bytes, cached snippets and retained backups. Test that removed
or superseded material cannot be retrieved by ID, search, citation expansion or
media links. Do not promise secure erasure or cascading deletion from a type.
Keep immutable source evidence only where retention and access policy allow it.
