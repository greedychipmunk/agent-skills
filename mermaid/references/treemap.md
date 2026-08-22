# Treemap Reference

## Declaration

```
treemap-beta
    "Section 1"
        "Leaf 1.1": 12
        "Leaf 1.2": 8
    "Section 2"
        "Leaf 2.1": 20
        "Leaf 2.2": 25
```

## Syntax

### Nodes

- **Section/Parent nodes**: Quoted text `"Section Name"`
- **Leaf nodes**: Quoted text with value `"Leaf Name": value`
- **Hierarchy**: Created via indentation (spaces or tabs)
- **Styling**: `:::className` syntax on nodes

### Indentation

Indentation is relative to the previous line, not absolute. Only compared with prior rows to determine parent-child relationships.

## Styling

### classDef

```
classDef blue fill:#blue,color:white
"Node Name":::blue
```

### Theme Configuration

Colors customizable via theme variables in frontmatter or initialize.

## Configuration

| Option | Description | Default |
| --- | --- | --- |
| `useMaxWidth` | Scale to container width | true |
| `padding` | Internal padding between nodes | 10 |
| `diagramPadding` | Padding around entire diagram | 8 |
| `showValues` | Show values in nodes | true |
| `nodeWidth` | Default node width | 100 |
| `nodeHeight` | Default node height | 40 |
| `borderWidth` | Border width | 1 |
| `valueFontSize` | Value font size | 12 |
| `labelFontSize` | Label font size | 14 |
| `valueFormat` | Value format specifier | ',' |

## Value Formatting

Uses D3 format specifiers with additional common formats:

| Format | Description |
| --- | --- |
| `,` | Thousands separator (default) |
| `$` | Dollar sign prefix |
| `.1f` | One decimal place |
| `.1%` | Percentage with one decimal |
| `$0,0` | Dollar with thousands separator |
| `$.2f` | Dollar with 2 decimals |
| `$,.2f` | Dollar with thousands separator and 2 decimals |

## Limitations

- Works best with naturally hierarchical data
- Very small values may be hard to see or label
- Deep hierarchies can be challenging to represent
- Not suited for negative values

## Example

```
treemap-beta
    "Budget"
        "Engineering": 500000
        "Marketing"
            "Digital": 150000
            "Print": 50000
        "Operations": 300000
```
