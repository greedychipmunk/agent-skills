# Subscription Lexicon Reference

`site.standard.graph.subscription` — tracks relationships between users and publications.

## Schema

### Required Properties

| Property | Type | Constraints | Description |
| --- | --- | --- | --- |
| `publication` | at-uri | — | AT-URI reference to the publication record being subscribed to. |

### Optional Properties

| Property | Type | Constraints | Description |
| --- | --- | --- | --- |
| `createdAt` | datetime | ISO 8601 | Timestamp marking when the subscription was created. |

## AT-URI Format

The `publication` property must be a valid AT-URI pointing to a `site.standard.publication` record:

```
at://did:plc:abc123/site.standard.publication/rkey
```

Components:
- `did:plc:abc123` — the DID of the publication owner
- `site.standard.publication` — the collection (NSID)
- `rkey` — the record key (e.g. `3lwafzkjqm25s`)

DID web format is also valid:
```
at://did:web:example.com/site.standard.publication/rkey
```

## Full Example

```json
{
  "$type": "site.standard.graph.subscription",
  "publication": "at://did:plc:abc123/site.standard.publication/3lwafzkjqm25s",
  "createdAt": "2026-05-19T14:30:00.000Z"
}
```

## Minimal Example (required fields only)

```json
{
  "$type": "site.standard.graph.subscription",
  "publication": "at://did:plc:abc123/site.standard.publication/3lwafzkjqm25s"
}
```

## Edge Cases

- **`createdAt` is optional:** Unlike recommends where `createdAt` is required, subscriptions do not require it. Include it when available for better chronological ordering.
- **Target must be a publication:** The `publication` AT-URI should point to a `site.standard.publication` record, not a document or other record type.
- **Duplicate subscriptions:** The lexicon does not enforce uniqueness. Aggregators should deduplicate by checking if a subscription from the same DID to the same publication already exists.

## Best Practices

- Include `createdAt` even though it's optional — it helps with chronological feed construction.
- Verify the target publication exists before creating a subscription record.
- Use the full AT-URI format including the record key — don't truncate.
