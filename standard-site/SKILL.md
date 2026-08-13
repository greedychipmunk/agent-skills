---
name: standard-site
description: >-
  Convert data into Standard.site AT Protocol lexicon records and validate them
  against official schemas. Use when creating or verifying
  site.standard.publication, site.standard.document,
  site.standard.graph.subscription, site.standard.graph.recommend, or
  site.standard.theme.basic records — even if the user doesn't name
  Standard.site directly. Also use when working with AT Protocol blog or
  article publishing workflows, or when mapping content to standard.site
  format from other sources.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Standard.site

Convert data into Standard.site lexicon records for the AT Protocol and validate them against the official schemas.

## When to Use

- Creating publication, document, subscription, recommend, or theme records
- Converting blog posts, articles, or other content into standard.site format
- Validating existing records against standard.site lexicon schemas
- Working with AT Protocol publishing workflows that involve standard.site
- Mapping content from other formats (RSS, Markdown, JSON) to standard.site

## Lexicons at a Glance

| Lexicon | `$type` | Required | Optional |
| --- | --- | --- | --- |
| Publication | `site.standard.publication` | `url`, `name` | `icon`, `description`, `basicTheme`, `labels`, `preferences` |
| Document | `site.standard.document` | `site`, `title`, `publishedAt` | `path`, `description`, `coverImage`, `content`, `textContent`, `bskyPostRef`, `tags`, `links`, `labels`, `contributors`, `updatedAt` |
| Subscription | `site.standard.graph.subscription` | `publication` | `createdAt` |
| Recommend | `site.standard.graph.recommend` | `document`, `createdAt` | — |
| Theme | `site.standard.theme.basic` | `background`, `foreground`, `accent`, `accentForeground` | — |

All colors in themes use `site.standard.theme.color#rgb` (r, g, b as integers 0–255) or `site.standard.theme.color#rgba` (adds `a` as integer 0–100).

## Conversion Workflow

1. **Identify the target lexicon.** Determine which record type the data maps to:
   - A blog/site with a URL and name → publication
   - An individual article or post → document
   - A user following a publication → subscription
   - A user endorsing a document → recommend
   - Color scheme for a publication → theme (embedded inside publication as `basicTheme`)

2. **Map required fields first.** Every record must include `$type` and all required properties. See the quick reference table above.

3. **Add optional fields.** Include optional properties when the source data provides them. Do not invent values for missing optional fields.

4. **Validate.** Run the validation script before finalizing:

```bash
uv run scripts/validate.py --input record.json
```

Or pipe JSON via stdin:

```bash
cat record.json | uv run scripts/validate.py --stdin
```

5. **Fix any errors.** The script reports each issue with the property path and expected format. Fix and re-validate until it passes.

## Validation

The bundled `scripts/validate.py` checks records against the standard.site lexicon schemas:

- Detects `$type` and validates against the matching schema
- Checks all required properties are present
- Checks property types (string, integer, datetime, blob, at-uri, ref, array, object)
- Checks constraints (maxLength, maxGraphemes, integer ranges for colors)
- Validates nested objects (basicTheme colors, contributors, preferences)
- Supports validating a single record or an array of records

```bash
# Validate a single record
uv run scripts/validate.py --input publication.json

# Validate from stdin
echo '{"$type":"site.standard.publication","url":"https://example.com","name":"Test"}' | uv run scripts/validate.py --stdin

# Validate multiple records in a JSON array
uv run scripts/validate.py --input records.json
```

Output is structured JSON to stdout, diagnostics to stderr. Exit code 0 = valid, 1 = invalid, 2 = usage error.

## Record Templates

### Publication

```json
{
  "$type": "site.standard.publication",
  "url": "https://example.com",
  "name": "Example Blog",
  "description": "A blog about technology",
  "basicTheme": {
    "$type": "site.standard.theme.basic",
    "background": { "$type": "site.standard.theme.color#rgb", "r": 255, "g": 255, "b": 255 },
    "foreground": { "$type": "site.standard.theme.color#rgb", "r": 31, "g": 41, "b": 55 },
    "accent": { "$type": "site.standard.theme.color#rgb", "r": 59, "g": 130, "b": 246 },
    "accentForeground": { "$type": "site.standard.theme.color#rgb", "r": 255, "g": 255, "b": 255 }
  },
  "preferences": { "showInDiscover": true }
}
```

### Document

```json
{
  "$type": "site.standard.document",
  "site": "at://did:plc:abc123/site.standard.publication/3lwafzkjqm25s",
  "path": "/blog/getting-started",
  "title": "Getting Started",
  "description": "Learn how to use Standard.site",
  "textContent": "Full text of the article...",
  "tags": ["tutorial", "atproto"],
  "publishedAt": "2024-01-20T14:30:00.000Z"
}
```

### Subscription

```json
{
  "$type": "site.standard.graph.subscription",
  "publication": "at://did:plc:abc123/site.standard.publication/3lwafzkjqm25s",
  "createdAt": "2026-05-19T14:30:00.000Z"
}
```

### Recommend

```json
{
  "$type": "site.standard.graph.recommend",
  "document": "at://did:plc:abc123/site.standard.document/3mbfqhezge25u",
  "createdAt": "2026-05-19T14:30:00.000Z"
}
```

## Gotchas

- **Trailing slashes.** The spec says avoid trailing slashes on `url` (publication) and `site` (document), but some implementations include them. The validator trims trailing slashes before checking — do the same in your code.
- **`site` vs `url`.** In documents, `site` points to a publication record via `at://` URI, or to a publication URL via `https://` for loose documents. Both are valid.
- **`path` must have a leading slash.** Document `path` should start with `/` (e.g., `/blog/post-slug`).
- **`publishedAt` is required for documents.** Unlike `createdAt` on subscriptions (optional), `publishedAt` is required and must be an ISO 8601 datetime.
- **`createdAt` is required for recommends.** Unlike subscriptions where it's optional, recommends require `createdAt`.
- **Tags should not have hashtag prefixes.** Use `"tutorial"` not `"#tutorial"`.
- **RGB color values are integers 0–255.** Not hex strings, not floats. RGBA alpha is 0–100 (percentage), not 0–255.
- **All four theme colors are required.** A `basicTheme` with only `background` and `foreground` is invalid — `accent` and `accentForeground` are also required.
- **`basicTheme` is embedded in the publication record.** It is not a standalone record — it's a nested object inside `site.standard.publication`.
- **`content` is an open union.** Each entry must specify a `$type`. The validator checks for `$type` presence but does not validate specific content formats.
- **`maxLength` vs `maxGraphemes`.** `maxLength` counts UTF-16 code units; `maxGraphemes` counts user-perceived characters. Both constraints apply simultaneously — a string can violate `maxGraphemes` while being under `maxLength`.

## Verification

Standard.site records can be verified against their web presence:

- **Publications:** `https://{url}/.well-known/site.standard.publication` should return the publication's AT-URI. For non-root publications, append the path: `/.well-known/site.standard.publication/path/to/publication`.
- **Documents:** The document's HTML page should include a `<link rel="site.standard.document" href="at://...">` tag in the `<head>`.

Verification is separate from schema validation — a record can be schema-valid but unverified, and vice versa.

## Detailed References

Load these when you need full schema details, edge cases, or examples for a specific lexicon:

- `references/publication.md` — Full publication schema, blob handling, preferences, extensibility
- `references/document.md` — Full document schema, contributor format, content union, links
- `references/subscription.md` — Full subscription schema, AT-URI format
- `references/recommend.md` — Full recommend schema, permissions
- `references/theme.md` — Full theme schema, RGB/RGBA color types, contrast guidelines

## Available Scripts

- **`scripts/validate.py`** — Validates standard.site records against lexicon schemas. Run with `uv run scripts/validate.py --input <file>` or `--stdin`.
