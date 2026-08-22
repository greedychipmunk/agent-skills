# Sankey Diagram Reference

## Declaration

```
sankey-beta
    Source,Target,Value
    Electricity,Heating,40
    Electricity,Lights,15
    Gas,Heating,30
```

## Syntax

CSV format with 3 columns: `source`, `target`, `value`.

- Must contain exactly 3 columns
- Empty lines allowed (without comma separators) for visual purposes
- Commas in values: wrap in double quotes `"value, with comma"`
- Double quotes in values: use `""` inside quoted strings `"say ""hello"""`

## Configuration

Set via `mermaid.initialize()`:

```javascript
mermaid.initialize({
  sankey: {
    width: 800,
    height: 400,
    linkColor: 'source',
    nodeAlignment: 'left',
  }
});
```

### Link Color

| Value | Description |
| --- | --- |
| `source` | Link takes source node color |
| `target` | Link takes target node color |
| `gradient` | Smooth gradient between source and target |
| `#hexcode` | Custom hex color |

### Node Alignment

| Value | Description |
| --- | --- |
| `justify` | Justify nodes |
| `center` | Center nodes |
| `left` | Align left |
| `right` | Align right |

### Label Style (v11.15.0+)

| Value | Description |
| --- | --- |
| `legacy` | Plain text labels, positioned by x-coordinate (default) |
| `outlined` | Labels with background stroke, positioned by node layer |

### Node Width and Padding (v11.15.0+)

| Option | Description | Default |
| --- | --- | --- |
| `nodeWidth` | Width of node rectangles (px) | 10 |
| `nodePadding` | Vertical padding between nodes (px) | 12 |

### Custom Node Colors (v11.15.0+)

```javascript
mermaid.initialize({
  sankey: {
    nodeColors: {
      'Electricity': '#ff0000',
      'Heating': '#00ff00',
    }
  }
});
```

Nodes not listed use the default color scheme. Values must be valid CSS colors.

## Example

```
sankey-beta
    "Energy Source","End Use","Consumption (TWh)"
    "Coal","Electricity",45
    "Gas","Electricity",30
    "Solar","Electricity",15
    "Electricity","Residential",25
    "Electricity","Industrial",40
    "Electricity","Transportation",20
```
