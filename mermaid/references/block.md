# Block Diagram Reference

## Declaration

```
block-beta
    columns 3
    A B C
    D E F
```

Block diagrams give the author full control over positioning, unlike flowcharts where the layout engine decides.

## Columns

```
columns N
```

Sets the number of columns. Blocks fill left-to-right, wrapping to the next row.

## Blocks

### Basic

```
A
B["Label"]
C[Label without quotes]
```

### Shapes

| Syntax | Shape |
| --- | --- |
| `block:rounded` | Rounded edges |
| `block:stadium` | Stadium |
| `block:subroutine` | Subroutine (double vertical lines) |
| `block:cylinder` | Cylinder (database) |
| `block:circle` | Circle |
| `block:asymmetric` | Asymmetric |
| `block:rhombus` | Rhombus (diamond) |
| `block:hexagon` | Hexagon |
| `block:parallelogram` | Parallelogram |
| `block:trapezoid` | Trapezoid |
| `block:doubleCircle` | Double circle |
| `block:arrow` | Block arrow |

Example: `A:block:rounded`

### Width

```
A:width 2
```

Block spans N columns.

### Composite Blocks

```
block Parent {
    block Child
    block Another
}
```

Nested blocks within a parent. Width adjusts to widest child.

## Edges

```
A --> B
A --- B
A --> B : label
A --> B("label")
```

- `-->` — directional arrow
- `---` — undirected line
- Labels via `: text` or `("text")`

## Space Blocks

```
space
space 2
```

Creates intentional empty spaces. `space` = 1 column. `space N` = N columns.

## Styling

### classDef

```
classDef blue fill:#blue,color:white
class A blue
class A,B blue
```

### style

```
style A fill:#blue,color:white
```

### ::: operator

```
A:::blue
```

## Example

```
block-beta
    columns 3
    Frontend["Frontend"] Backend["Backend"] DB[("Database")]
    Frontend --> Backend : requests
    Backend --> DB : queries
    style Frontend fill:#e1f5fe
    style Backend fill:#e8f5e9
    style DB fill:#fff3e0
```
