# Publication Lexicon Reference

`site.standard.publication` — describes a collection of documents published to the web.

## Schema

### Required Properties

| Property | Type | Constraints | Description |
| --- | --- | --- | --- |
| `url` | string | — | Base URL for the publication (e.g. `https://standard.site`). Combined with document `path` to construct full URLs. Avoid trailing slashes. |
| `name` | string | `maxLength: 5000`, `maxGraphemes: 500` | Name of the publication. |

### Optional Properties

| Property | Type | Constraints | Description |
| --- | --- | --- | --- |
| `icon` | blob | — | Square image to identify the publication. Should be at least 256x256. |
| `description` | string | `maxLength: 30000`, `maxGraphemes: 3000` | Brief description of the publication. |
| `basicTheme` | ref | — | Simplified theme for display. Refers to `site.standard.theme.basic`. See [theme reference](theme.md). |
| `labels` | union | — | Self-label values (content warnings). Refers to `com.atproto.label.defs#selfLabels`. |
| `preferences` | object | — | Platform-specific preferences. |
| `preferences.showInDiscover` | boolean | — | Whether the publication should appear in discovery feeds. |

## Blob Format

The `icon` property uses the AT Protocol blob format:

```json
{
  "$type": "blob",
  "ref": { "$link": "bafkreiexample123456789" },
  "mimeType": "image/png",
  "size": 12345
}
```

- `$link` is a CID reference to the blob stored on the PDS.
- `mimeType` should be an image type (`image/png`, `image/jpeg`, `image/webp`).
- `size` is the blob size in bytes.

## Full Example

```json
{
  "$type": "site.standard.publication",
  "url": "https://standard.site",
  "icon": {
    "$type": "blob",
    "ref": { "$link": "bafkreiexample123456789" },
    "mimeType": "image/png",
    "size": 12345
  },
  "name": "Standard.site Blog",
  "description": "Documentation and updates about Standard.site lexicons",
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

## Verification

Publications can be verified via a `.well-known` endpoint:

```
https://{url}/.well-known/site.standard.publication
```

Should return the publication's AT-URI:

```
at://did:plc:abc123/site.standard.publication/rkey
```

For non-root publications, append the path:

```
https://{url}/.well-known/site.standard.publication/path/to/publication
```

A `<link rel="site.standard.publication" href="at://...">` tag in the page `<head>` can also be used as a discovery hint, but should not be relied upon for verification.

## Edge Cases

- **Trailing slashes on `url`:** The spec says to avoid them, but some implementations include them. Trim trailing slashes when comparing or constructing URLs.
- **Non-root publications:** If the publication doesn't live at the domain root, the `.well-known` endpoint path must include the publication path.
- **Extensibility:** Additional properties beyond those defined in the lexicon are allowed. The existing properties are starting points, not constraints.

## Best Practices

- Use HTTPS for the `url`.
- Keep the `url` without a trailing slash.
- Include `description` for better discoverability.
- Set `preferences.showInDiscover` to `true` if you want the publication to appear in discovery feeds.
- Include a `basicTheme` to maintain visual identity across reading applications.
