# ER Diagram Reference

## Declaration

```
erDiagram
    CUSTOMER ||--o{ ORDER : places
```

## Syntax

```
<first-entity> [<relationship> <second-entity> : <relationship-label>]
```

Only `first-entity` is mandatory. If any other part is specified, all parts are required.

## Cardinality

Each cardinality marker has two characters: outer = max, inner = min.

| Left | Right | Meaning |
| --- | --- | --- |
| `\|o` | `o\|` | Zero or one |
| `\|\|` | `\|\|` | Exactly one |
| `}o` | `o{` | Zero or more |
| `}\|` | `\|{` | One or more |

### Aliases

| Alias | Maps to |
| --- | --- |
| `one or zero` / `zero or one` | Zero or one |
| `one or more` / `one or many` / `many(1)` / `1+` | One or more |
| `zero or more` / `zero or many` / `many(0)` / `0+` | Zero or more |
| `only one` / `1` | Exactly one |

## Identification

| Value | Type | Line Style |
| --- | --- | --- |
| `--` | Identifying | Solid |
| `..` | Non-identifying | Dashed |

Aliases: `to` = identifying, `optionally to` = non-identifying.

## Attributes

```
ENTITY {
    type name
    type name PK
    type name FK
    type name UK
    type name "comment"
    type? name
}
```

- `type` must start with alphabetic character; may contain digits, hyphens, underscores, parentheses, brackets.
- `name` may start with `*` to indicate primary key.
- `?` after type indicates optional/nullable (v11.16.0+).
- Keys: `PK` (primary), `FK` (foreign), `UK` (unique). Multiple: `PK, FK`.
- Comments in double quotes at end of attribute. No double quotes inside comments.

## Entity Name Aliases

```
ENTITY[Alias] {
    string name
}
```

Alias displayed instead of entity name in the diagram.

## Direction

```
erDiagram
    direction LR
```

Valid: `TB` (default), `BT`, `RL`, `LR`.

## Subgraphs (v11.17.0+)

```
subgraph title
    graph definition
end
```

Subgraphs group entities into logical sections. Can be nested. Referenced by id, not title. If id contains spaces, use quotes.

Direction in subgraphs: a subgraph can define its own layout direction.

## Styling

### classDef

```
classDef blue fill:#blue,color:white
class ENTITY blue
class ENTITY1, ENTITY2 blue
```

### ::: operator

```
ENTITY:::className
```

Can apply during relationship definition. Multiple classes: `ENTITY:::class1,class2`.

### style

```
style ENTITY fill:#blue,color:white
```

### Default class

```
classDef default fill:#f9f,stroke:#333
```

## Configuration

Layout: `dagre` (default) or `elk` (via frontmatter `config: layout: elk`).
