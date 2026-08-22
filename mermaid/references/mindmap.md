# Mindmap Reference

## Declaration

```
mindmap
    Root
        A
            B
            C
        D
```

Hierarchy defined by indentation relative to the previous line.

## Shapes

| Syntax | Shape |
| --- | --- |
| `id[text]` | Square |
| `id(text)` | Rounded square |
| `id((text))` | Circle |
| `id)text(` | Bang |
| `id)text(` | Cloud |
| `id{{text}}` | Hexagon |
| `id` | Default (no shape delimiter) |

## Icons

```
id::icon(fa:database)
id::icon(material:folder)
```

Icon syntax: `::icon(iconPack:iconName)`. Requires icon fonts to be registered by the site administrator.

## Classes

```
id:::className
id:::class1 class2
```

Classes apply CSS styles. Must be supplied by the site administrator.

## Markdown Strings

Wrap text in double quotes for markdown formatting:

```
Root["**Bold** root"]
    A["*italic* child"]
```

Supports bold (`**text**`), italics (`*text*`), and automatic text wrapping.

## Unclear Indentation

Indentation is relative, not absolute. If a node's indentation is ambiguous, Mermaid assigns it to the nearest known parent based on the last clear indentation level.

## Layouts

Default layout is radial. Also supports Tidy Tree:

```
---
config:
  layout: tidy-tree
---
mindmap
root((mindmap))
  A
  B
  C
```

## Example

```
mindmap
    root((My Project))
        Planning
            Requirements
            Timeline
        Development
            Frontend
            Backend
            Testing
        Deployment
            Staging
            Production
```
