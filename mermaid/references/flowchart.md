# Flowchart Reference

## Declaration

```
flowchart TD
    A --> B
```

`graph` is an alias for `flowchart`. Directions: `TD`/`TB` (top-down), `BT` (bottom-top), `LR` (left-right), `RL` (right-left).

## Node Shapes

### Classic Shapes

| Syntax | Shape |
| --- | --- |
| `A[text]` | Rectangle |
| `A(text)` | Rounded rectangle |
| `A((text))` | Circle |
| `A>text]` | Flag (asymmetric) |
| `A{text}` | Diamond (rhombus) |
| `A[/text/]` | Parallelogram |
| `A[\text\]` | Parallelogram (alt) |
| `A[/text\]` | Trapezoid |
| `A[\text/]` | Trapezoid (alt) |
| `A(((text)))` | Double circle |
| `A{{text}}` | Hexagon |
| `A[(text)]` | Database (cylinder) |
| `A[(text1\|text2)]` | Database (two-line) |
| `A((text1\|text2))` | Circle (two-line) |
| `A>text]` | Flag |
| `A$sub text$` | Subroutine |
| `A~text~` | Cylindrical |

### New Shapes (v11.3.0+)

Use `A@{ shape: shapeName }` syntax:

| shapeName | Shape |
| --- | --- |
| `rect` | Rectangle |
| `rounded` | Rounded rectangle |
| `stadium` | Stadium |
| `doubleRect` | Double rectangle |
| `circle` | Circle |
| `doubleCircle` | Double circle |
| `diamond` | Diamond |
| `hexagon` | Hexagon |
| `stadium` | Stadium |
| `parallelogram` | Parallelogram |
| `parallelogramAlt` | Parallelogram (alt) |
| `trapezoid` | Trapezoid |
| `trapezoidAlt` | Trapezoid (alt) |
| `cylinder` | Cylinder (database) |
| `subroutine` | Subroutine |
| `doc` | Document |
| `docAlt` | Document (alt) |
| `label` | Label |
| `labelAlt` | Label (alt) |
| `asymmetric` | Asymmetric |
| `asymmetricAlt` | Asymmetric (alt) |
| `queue` | Queue |
| `stack` | Stack |
| `leanRight` | Lean right |
| `leanLeft` | Lean left |
| `note` | Note |
| `cloud` | Cloud |
| `bolt` | Bolt |
| `collate` | Collate |
| `delay` | Delay |
| `dividedRectangle` | Divided rectangle |
| `display` | Display |
| `fork` | Fork |
| `internalStorage` | Internal storage |
| `junction` | Junction |
| `linDoc` | Line document |
| `multiDoc` | Multi-document |
| `multiStorage` | Multi-storage |
| `or` | Or |
| `process` | Process |
| `shadedProcess` | Shaded process |
| `sort` | Sort |
| `summingJunction` | Summing junction |
| `taggedDocument` | Tagged document |
| `taggedProcess` | Tagged process |
| `tape` | Tape |
| `terminal` | Terminal |
| `transaction` | Transaction |
| `transactionAlt` | Transaction (alt) |

### Markdown Strings

Wrap text in double quotes to enable markdown formatting: `A["**bold** and *italic*"]`. Supports `<br>` for line breaks.

## Links

| Syntax | Description |
| --- | --- |
| `A --> B` | Arrow |
| `A --- B` | Line (no arrow) |
| `A -.-> B` | Dotted arrow |
| `A ==> B` | Thick arrow |
| `A -- text --> B` | Arrow with label |
| `A ---\|text\| B` | Line with label |
| `A -. text .-> B` | Dotted arrow with label |
| `A == text ==> B` | Thick arrow with label |
| `A -->\|text\| B` | Arrow with label (pipe syntax) |
| `A --o B` | Dotted arrow (no arrowhead) |
| `A x-- B` | Broken link |
| `A --- B & C` | Multi-link (A to both B and C) |
| `A & B --> C` | Multi-link (both A and B to C) |

Link length: more dashes/dots = longer link: `A ---> B`, `A ----> B`.

## Subgraphs

```
subgraph Title
    A --> B
end
```

Subgraph with direction: `subgraph direction LR`. Subgraph with id: `subgraph id [Title]`. Nested subgraphs supported.

Subgraph styling: `style subgraphId fill:#f9f,stroke:#333`.

## Styling

### classDef

```
classDef className fill:#f9f,stroke:#333,stroke-width:2px
```

Apply: `class nodeId className` or `class nodeId1,nodeId2 className`.

Shorthand: `A:::className` (applies during node definition).

Multiple classes: `A:::class1,class2`.

### style

```
style A fill:#f9f,stroke:#333,stroke-width:4px
```

### Default class

```
classDef default fill:#f9f,stroke:#333,stroke-width:4px
```

## Icons

```
A@{ icon: fa:database }
```

Requires icon packs to be registered. Supports iconify.design icons.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| `htmlLabels` | Use HTML labels | true |
| `curve` | Line curve style | linear |
| `nodeSpacing` | Space between nodes | 50 |
| `rankSpacing` | Space between ranks | 50 |
| `useMaxWidth` | Scale to container | true |
