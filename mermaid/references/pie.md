# Pie Chart Reference

## Declaration

```
pie showData
    title Market Share
    "Product A" : 40
    "Product B" : 35
    "Product C" : 25
```

## Syntax

```
pie [showData] [title titleValue]
    "label1" : value1
    "label2" : value2
```

- `pie` — required keyword to start
- `showData` — optional, renders actual values after legend text
- `title` — optional, followed by title text
- Labels in double quotes
- Values must be positive numbers (up to 2 decimal places)
- Slices ordered clockwise in definition order

## Donut Chart (v11.16.0+)

Set `donutHole` in config to render a donut:

```
---
config:
  pie:
    donutHole: 0.5
---
pie
    "A" : 40
    "B" : 60
```

Valid values: 0 to 0.9. 0 = standard pie. Higher = larger hole.

## Legend Position (v11.16.0+)

```
---
config:
  pie:
    legendPosition: bottom
---
```

Valid values: `top`, `bottom`, `left`, `right`, `center`. Default: `right`.

## Highlight Slice (v11.16.0+)

```
---
config:
  pie:
    highlightSlice: "Product A"
---
```

Highlights the slice with the matching label. Set to `hover` to highlight on hover.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| `textPosition` | Axial position of labels (0.0–1.0) | 0.75 |
| `donutHole` | Donut hole ratio (0–0.9) | 0 |
| `legendPosition` | Legend position | right |
| `highlightSlice` | Slice label to highlight, or `hover` | — |
