# Recommend Lexicon Reference

`site.standard.graph.recommend` — declares that a user recommends a document.

## Schema

### Required Properties

| Property | Type | Constraints | Description |
| --- | --- | --- | --- |
| `document` | at-uri | — | AT-URI reference to the document record being recommended. |
| `createdAt` | datetime | ISO 8601 | Timestamp marking when the recommend was created. |

## AT-URI Format

The `document` property must be a valid AT-URI pointing to a `site.standard.document` record:

```
at://did:plc:abc123/site.standard.document/rkey
```

Components:
- `did:plc:abc123` — the DID of the document author
- `site.standard.document` — the collection (NSID)
- `rkey` — the record key (e.g. `3mbfqhezge25u`)

## Full Example

```json
{
  "$type": "site.standard.graph.recommend",
  "document": "at://did:plc:abc123/site.standard.document/3mbfqhezge25u",
  "createdAt": "2026-05-19T14:30:00.000Z"
}
```

## Permissions

Recommend records require the `site.standard.authSocial` OAuth scope. This scope provides narrower access than `site.standard.authFull`, limited to social features (subscriptions and recommends) only.

## Edge Cases

- **`createdAt` is required:** Unlike subscriptions where `createdAt` is optional, recommends require it. A recommend without `createdAt` is invalid.
- **Target must be a document:** The `document` AT-URI should point to a `site.standard.document` record, not a publication or other record type.
- **Self-recommends:** The lexicon does not prevent a user from recommending their own documents. Aggregators may choose to filter these.
- **Duplicate recommends:** The lexicon does not enforce uniqueness. Aggregators should deduplicate by checking if a recommend from the same DID to the same document already exists.

## Best Practices

- Always include `createdAt` — it's required and enables chronological ordering of recommends.
- Verify the target document exists before creating a recommend record.
- Use the full AT-URI format including the record key.
