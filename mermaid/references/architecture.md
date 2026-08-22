# Architecture Diagram Reference

## Declaration

```
architecture-beta
    group api(cloud)[API Layer]
    service db(database)[Database] in api
    service server(server)[Server] in api
    db:R --> L:server
```

## Building Blocks

Four building blocks: groups, services, edges, and junctions. Each can be declared in any order, but identifiers must be declared before use.

### Groups

```
group {id}({icon})[{title}] in {parent}
```

- `id` — unique identifier
- `({icon})` — icon name (optional but recommended)
- `[{title}]` — display label (optional)
- `in {parent}` — nest inside another group (optional)

Example: `group public_api(cloud)[Public API]`

### Services

```
service {id}({icon})[{title}] in {parent}
```

Same structure as groups. Represents a node in the architecture.

Example: `service database1(database)[My Database] in private_api`

### Junctions

```
junction {id} in {parent}
```

Special node acting as a 4-way split between edges. No icon or title.

### Edges

```
{serviceId}{group}?:{side} {arrow}? {side}:{serviceId}{group}?
```

- `side` — `T` (top), `B` (bottom), `L` (left), `R` (right)
- `arrow` — `-->` (directional) or `--` (undirectional)
- `{group}` modifier — edge goes from/to the group boundary, not the service itself

Examples:
```
db:R -- L:server
db:T --> L:server
subnet:R --> L:gateway
server{group}:B --> T:subnet{group}
```

## Alignment (v11.16.0+)

```
align row {idA} {idB} {idC}
align column {idA} {idB}
```

Forces services sharing similar edge topology to spread along an axis instead of overlapping.

- `align column` — members share same x (vertical stack). Use when members connect via `R --> L:target`.
- `align row` — members share same y (horizontal row). Use when members connect via `B --> T:target`.

Order of members determines their order along the axis. Must not contradict edge directions.

### Grid Layouts

Combine `align row` with `align column` to create grids:

```
align row a b c
align column a d
align column b e
align column c f
```

## Configuration

### randomize (v11.14.0+)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `randomize` | boolean | false | Randomize initial node positions |

### Layout Tuning (v11.15.0+)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `nodeSeparation` | number | 75 | Min separation between sibling nodes (px) |
| `idealEdgeLengthMultiplier` | number | 1.5 | Multiplier for ideal edge length within groups |
| `edgeElasticity` | number | 0.45 | Spring elasticity (0–1) for same-group edges |
| `numIter` | number | 2500 | Max fcose iterations |
| `seed` | number | 1 | Deterministic seed (0 = non-deterministic) |

## Icons

Default icons: `cloud`, `database`, `disk`, `internet`, `server`.

Custom icons via iconify.design (200,000+ icons). Register an icon pack, then use `name:icon-name` format.

## Example

```
architecture-beta
    group public(cloud)[Public Network]
    group private(cloud)[Private Network]
    
    service client(internet)[Client] in public
    service lb(server)[Load Balancer] in public
    service api(server)[API Server] in private
    service db(database)[Database] in private
    
    client:R --> L:lb
    lb:R --> L:api
    api:R --> L:db
```
