# Theme Lexicon Reference

`site.standard.theme.basic` — simplified theme definition for publications.

## Schema

### Required Properties

| Property | Type | Description |
| --- | --- | --- |
| `background` | ref → `site.standard.theme.color#rgb` | Color used for content background. |
| `foreground` | ref → `site.standard.theme.color#rgb` | Color used for content text. |
| `accent` | ref → `site.standard.theme.color#rgb` | Color used for links and button backgrounds. |
| `accentForeground` | ref → `site.standard.theme.color#rgb` | Color used for button text. |

All four properties are required. A partial theme is invalid.

## Color Types

### RGB (`site.standard.theme.color#rgb`)

| Property | Type | Range | Description |
| --- | --- | --- | --- |
| `r` | integer | 0–255 | Red channel value |
| `g` | integer | 0–255 | Green channel value |
| `b` | integer | 0–255 | Blue channel value |

### RGBA (`site.standard.theme.color#rgba`)

| Property | Type | Range | Description |
| --- | --- | --- | --- |
| `r` | integer | 0–255 | Red channel value |
| `g` | integer | 0–255 | Green channel value |
| `b` | integer | 0–255 | Blue channel value |
| `a` | integer | 0–100 | Alpha (opacity), where 0 is transparent and 100 is opaque |

Note: Alpha is 0–100 (percentage), not 0–255.

## Color Roles

| Role | Used For |
| --- | --- |
| `background` | Main surface color for content areas |
| `foreground` | Default color for body text and content |
| `accent` | Interactive elements: links, button backgrounds |
| `accentForeground` | Text on accent-colored backgrounds (e.g. button text) |

## Full Example

```json
{
  "$type": "site.standard.theme.basic",
  "background": { "$type": "site.standard.theme.color#rgb", "r": 255, "g": 255, "b": 255 },
  "foreground": { "$type": "site.standard.theme.color#rgb", "r": 31, "g": 41, "b": 55 },
  "accent": { "$type": "site.standard.theme.color#rgb", "r": 59, "g": 130, "b": 246 },
  "accentForeground": { "$type": "site.standard.theme.color#rgb", "r": 255, "g": 255, "b": 255 }
}
```

## RGBA Example

```json
{
  "$type": "site.standard.theme.basic",
  "background": { "$type": "site.standard.theme.color#rgba", "r": 255, "g": 255, "b": 255, "a": 90 },
  "foreground": { "$type": "site.standard.theme.color#rgb", "r": 31, "g": 41, "b": 55 },
  "accent": { "$type": "site.standard.theme.color#rgb", "r": 59, "g": 130, "b": 246 },
  "accentForeground": { "$type": "site.standard.theme.color#rgb", "r": 255, "g": 255, "b": 255 }
}
```

## Usage in Publications

Themes are embedded inside publication records as `basicTheme`:

```json
{
  "$type": "site.standard.publication",
  "url": "https://myblog.com",
  "name": "My Blog",
  "basicTheme": {
    "$type": "site.standard.theme.basic",
    "background": { "$type": "site.standard.theme.color#rgb", "r": 255, "g": 255, "b": 255 },
    "foreground": { "$type": "site.standard.theme.color#rgb", "r": 31, "g": 41, "b": 55 },
    "accent": { "$type": "site.standard.theme.color#rgb", "r": 59, "g": 130, "b": 246 },
    "accentForeground": { "$type": "site.standard.theme.color#rgb", "r": 255, "g": 255, "b": 255 }
  }
}
```

A theme is not a standalone record — it is always nested inside a publication.

## Edge Cases

- **RGB vs RGBA:** The `basicTheme` color properties accept both `#rgb` and `#rgba` types. The validator accepts either.
- **Alpha range:** RGBA alpha is 0–100 (percentage), not 0–255. Using 255 for alpha will fail validation.
- **Integer values only:** Color channels must be integers, not floats or strings. `255` is valid; `255.0` and `"255"` are not.
- **Booleans are not integers:** In JSON, `true` and `false` are not valid color values despite Python treating bools as int subclasses.

## Best Practices

1. **Check readability:** Ensure foreground/background combinations have sufficient contrast. A light foreground on a light background will be unreadable.
2. **Test button colors:** Verify accent/accentForeground pairs have sufficient contrast. Button text should be legible against the button background.
3. **Provide all four colors:** All four color properties are required. Omitting any one makes the theme invalid.
4. **Use RGBA sparingly:** Most themes should use solid RGB colors. Use RGBA only when you need transparency effects.
