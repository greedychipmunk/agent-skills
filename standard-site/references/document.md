# Document Lexicon Reference

`site.standard.document` — provides metadata for individual documents published on the web.

## Schema

### Required Properties

| Property | Type | Constraints | Description |
| --- | --- | --- | --- |
| `site` | string | — | Points to a publication record via `at://` URI, or a publication URL via `https://` for loose documents. Avoid trailing slashes. |
| `title` | string | `maxLength: 5000`, `maxGraphemes: 500` | Title of the document. |
| `publishedAt` | datetime | ISO 8601 | Timestamp of the document's publish time. |

### Optional Properties

| Property | Type | Constraints | Description |
| --- | --- | --- | --- |
| `path` | string | — | Combine with `site` or publication `url` to construct a canonical URL. Prepend with a leading slash. |
| `description` | string | `maxLength: 30000`, `maxGraphemes: 3000` | Brief description or excerpt from the document. |
| `coverImage` | blob | < 1MB | Image used for thumbnail or cover. |
| `content` | union (open) | — | Open union for record content. Each entry must specify a `$type`. |
| `textContent` | string | — | Plaintext representation of the document's contents. Should not contain markdown or formatting. |
| `bskyPostRef` | ref | — | Strong reference to a Bluesky post for tracking comments off-platform. |
| `tags` | array<string> | `items.maxLength: 1280`, `items.maxGraphemes: 128` | Tags or categories. Do not prepend with hashtags. |
| `links` | union (open) | — | Open union describing relationships between this document and external resources. |
| `labels` | union | — | Self-label values (content warnings). Refers to `com.atproto.label.defs#selfLabels`. |
| `contributors` | array<#contributor> | — | Additional contributors beyond the record's author. |
| `updatedAt` | datetime | ISO 8601 | Timestamp of the document's last edit. |

### Contributor (`#contributor`)

| Property | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `did` | string (did) | Yes | — | DID of the contributor. |
| `role` | string | No | `maxLength: 1000`, `maxGraphemes: 100` | Role of the contributor (e.g. "editor", "translator"). |
| `displayName` | string | No | `maxLength: 1000`, `maxGraphemes: 100` | Optional display name override. |

## Content Union

The `content` property is an open union — each entry must specify a `$type` and may be extended with other lexicons to support additional content formats:

```json
{
  "content": {
    "$type": "site.standard.document.content.markdown",
    "text": "# Heading\n\nBody text..."
  }
}
```

The validator checks for `$type` presence but does not validate specific content formats — that is left to the implementing application.

## Full Example

```json
{
  "$type": "site.standard.document",
  "site": "at://did:plc:abc123/site.standard.publication/3lwafzkjqm25s",
  "path": "/blog/getting-started",
  "title": "Getting Started with Standard.site",
  "description": "Learn how to use Standard.site lexicons in your project",
  "coverImage": {
    "$type": "blob",
    "ref": { "$link": "bafkreiexample123456789" },
    "mimeType": "image/jpeg",
    "size": 245678
  },
  "textContent": "Full text of the article...",
  "tags": ["tutorial", "atproto"],
  "contributors": [
    { "did": "did:plc:xyz789", "role": "editor" },
    { "did": "did:plc:abc456", "role": "translator", "displayName": "Jane Doe" }
  ],
  "publishedAt": "2024-01-20T14:30:00.000Z",
  "updatedAt": "2024-01-21T10:00:00.000Z"
}
```

## Loose Documents (No Publication)

Documents can exist without a publication record. In this case, `site` points to a URL instead of an AT-URI:

```json
{
  "$type": "site.standard.document",
  "site": "https://myblog.com",
  "path": "/posts/standalone-article",
  "title": "Standalone Article",
  "publishedAt": "2024-01-20T14:30:00.000Z"
}
```

## Verification

Documents are verified via an HTML `<link>` tag in the document's `<head>`:

```html
<link rel="site.standard.document" href="at://did:plc:xyz789/site.standard.document/rkey" />
```

This confirms the association between the rendered document and its `site.standard.document` record.

## Edge Cases

- **Trailing slashes on `site`:** Trim them when comparing or constructing URLs.
- **`path` leading slash:** Should start with `/`. If missing, prepend it.
- **Tags without hashtags:** Use `"tutorial"` not `"#tutorial"`.
- **`publishedAt` is required:** Unlike `createdAt` on subscriptions, `publishedAt` must be present.
- **`updatedAt` is optional:** Only include when the document has been edited after publishing.
- **`content` vs `textContent`:** `content` is the open union for rich content; `textContent` is the plaintext representation. Both can be present simultaneously.
- **`bskyPostRef`:** Should contain a `$link` or `uri` property pointing to the Bluesky post.

## Best Practices

- Always include `path` when the document has a specific URL path.
- Use `textContent` for plaintext content that should be searchable and indexable.
- Tag with relevant, specific tags — avoid generic tags like "blog" or "post".
- Include `contributors` for collaborative works to give proper credit.
- Set `updatedAt` whenever the document content is revised after publication.
