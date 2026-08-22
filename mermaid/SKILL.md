---
name: mermaid
description: >-
  Generate and validate Mermaid.js diagrams from text descriptions. Use when
  creating flowcharts, sequence diagrams, Gantt charts, class diagrams, state
  diagrams, ER diagrams, git graphs, user journeys, quadrant charts, XY
  charts, pie charts, architecture diagrams, block diagrams, requirement
  diagrams, treemaps, mindmaps, timelines, or Sankey diagrams. Also use when
  converting structured descriptions into visual diagrams or validating
  existing Mermaid syntax.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Mermaid.js

Generate Mermaid.js diagrams from text descriptions and validate existing Mermaid syntax.

## When to Use

- Creating any of the 18 Mermaid diagram types from structured descriptions
- Converting plain-language descriptions into visual diagrams
- Validating existing Mermaid syntax for common errors
- Choosing the right diagram type for a given scenario
- Styling or theming Mermaid diagrams

## Diagram Types at a Glance

| Diagram | Keyword | Use For |
| --- | --- | --- |
| Flowchart | `flowchart` / `graph` | Process flows, decision trees, system logic |
| Sequence | `sequenceDiagram` | Message passing between actors over time |
| Gantt | `gantt` | Project schedules, task timelines |
| Class | `classDiagram` | OOP class structure, inheritance, relationships |
| State | `stateDiagram-v2` | State machines, transitions, lifecycle |
| ER | `erDiagram` | Database schemas, entity relationships |
| Git Graph | `gitGraph` | Git branching and merge strategies |
| User Journey | `journey` | User experience across task steps |
| Quadrant | `quadrantChart` | 2D prioritization (e.g. impact vs. effort) |
| XY Chart | `xychart-beta` | Bar charts, line charts with axes |
| Pie | `pie` | Proportional data, percentage breakdowns |
| Architecture | `architecture-beta` | Cloud/CI-CD service topology |
| Block | `block-beta` | Fixed-position block layouts |
| Requirement | `requirementDiagram` | SysML requirement traceability |
| Treemap | `treemap-beta` | Hierarchical proportional data |
| Mindmap | `mindmap` | Brainstorming, concept hierarchy |
| Timeline | `timeline` | Chronological events |
| Sankey | `sankey-beta` | Flow quantities between nodes |

## Universal Syntax

Every diagram begins with a diagram type keyword. Optional frontmatter and directives can configure the diagram before content.

### Frontmatter

YAML between `---` lines at the very start. Used for layout, look, and theme configuration.

```
---
config:
  layout: elk
  look: handDrawn
  theme: forest
---
flowchart LR
    A --> B
```

### Directives

Inline configuration via `%%{ }%%`. Can appear above or below the diagram definition.

```
%%{init: {'theme': 'dark'}}%%
flowchart LR
    A --> B
```

### Comments

`%%` starts a comment — everything after it on that line is ignored.

### Diagram-Breaking Words

The word `end` inside flowchart and sequence diagrams breaks parsing. Wrap node text containing `end` in quotes: `A["weekend"]`.

### Layouts

- `dagre` (default) — standard layout engine
- `elk` — Eclipse Layout Kernel, better for complex diagrams (requires frontmatter config)

### Looks

- `classic` (default)
- `handDrawn` — sketch-style rendering

## Quick Syntax by Diagram Type

### Flowchart

```
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[End]
```

Directions: `TD`/`TB` (top-down), `BT`, `LR`, `RL`. Node shapes: `A[rect]`, `A(rounded)`, `A((circle))`, `A{diamond}`, `A>flag]`, `A[/parallelogram/]`, `A[\trapezoid\]`. Links: `-->`, `---`, `-.->`, `==>`, `-- text -->`. Subgraphs: `subgraph Name ... end`. Styling: `classDef name fill:#f9f,stroke:#333` then `class nodeId name`. Icons: `A@{ icon: fa:database }`. New shapes (v11.3.0+): `A@{ shape: rect }`.

See `references/flowchart.md` for all 30+ shapes, link types, subgraph options, and styling.

### Sequence Diagram

```
sequenceDiagram
    Alice->>Bob: Hello
    Bob-->>Alice: Hi
    Alice->>Bob: How are you?
    Bob-->>Alice: Great!
```

Participants: `participant Name` or `actor Name`. Arrows: `->`, `-->`, `->>`, `-->>`, `-x`, `--x`, `-)`, `--)`. Half-arrows (v11.12.3+): `->>`, `-->>` with half-arrow variants. Loops: `loop Description ... end`. Conditionals: `alt Condition ... else ... end`, `opt Condition ... end`. Parallel: `par ... and ... end`. Critical: `critical ... option ... end`. Break: `break ... end`. Notes: `note left/right/over of Participant: text`. Activation: `activate/deactivate` or `+`/`-` shorthand. autonumber adds sequence numbers.

See `references/sequence.md` for all arrow types, message grouping, notes, activations, and styling.

### Gantt Chart

```
gantt
    title Project Schedule
    dateFormat YYYY-MM-DD
    section Design
    Task 1 :a1, 2024-01-01, 30d
    Task 2 :after a1, 20d
    section Development
    Task 3 :2024-02-15, 45d
    Milestone :milestone, 2024-04-01, 0d
```

dateFormat: `YYYY-MM-DD` (default). Duration units: `ms`, `s`, `m`, `h`, `d`, `w`, `M`, `y`. Excludes: `excludes weekends`. Today marker: `todayMarker off` or `todayMarker stroke:#f00,stroke-width:2px`. Compact mode: `compact` keyword. axisFormat for date display formatting.

See `references/gantt.md` for metadata syntax, section handling, dependencies, and styling.

### Class Diagram

```
classDiagram
    class Animal {
        +String name
        -int age
        #makeSound() void
    }
    class Dog {
        +bark() void
    }
    Dog --|> Animal
    Dog --> Toy
```

Visibility: `+` public, `-` private, `#` protected, `~` package. Modifiers: `*` abstract, `$` static. Relationships: `--|>` inheritance, `*--` composition, `o--` aggregation, `-->` association, `..>` dependency, `..|>` realization. Cardinality: `Animal "1" --> "0..*" Dog`. Generics: `class List~T~`. Namespaces: `namespace Name { ... }`. Notes: `note for Class "text"`.

See `references/class.md` for all relationship types, annotations, generics, and styling.

### State Diagram

```
stateDiagram-v2
    [*] --> Still
    Still --> Moving
    Moving --> Crash
    Crash --> [*]
```

States: `stateId` or `state "Description" as id`. Transitions: `A --> B` or `A --> B : label`. Start/end: `[*]`. Composite states: `state Parent { ... }`. Choice: `state choiceState <<choice>>`. Fork: `state forkState <<fork>>`. Notes: `note left/right of StateId : text`. Concurrency: `--` separator inside composite states. Direction: `direction LR`.

See `references/state.md` for composite states, choice, fork, concurrency, and styling.

### ER Diagram

```
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        string email PK
    }
    ORDER {
        int order_id PK
        date order_date
    }
```

Cardinality (left/right): `|o`/`o|` zero-or-one, `||`/`||` exactly-one, `}o`/`o{` zero-or-more, `}|`/`|{` one-or-more. Identification: `--` identifying (solid), `..` non-identifying (dashed). Attributes: `type name` inside `{}`. Keys: `PK`, `FK`, `UK`. Comments: `"comment"` at end of attribute. Aliases: `one or more`, `zero or one`, etc. Direction: `direction LR`/`RL`/`TB`/`BT`.

See `references/er.md` for cardinality, identification, attributes, keys, subgraphs, and styling.

### Git Graph

```
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    checkout main
    merge develop
```

Commands: `commit`, `branch name`, `checkout name` (or `switch`), `merge name`, `cherry-pick id: "id"`. Commit attributes: `id: "custom_id"`, `type: NORMAL|REVERSE|HIGHLIGHT`, `tag: "v1.0"`. Merge attributes: same as commit. Orientation: `gitGraph LR:` / `TB:` / `BT:`. Config: `showBranches`, `showCommitLabel`, `mainBranchName`, `parallelCommits`.

See `references/gitgraph.md` for commit types, cherry-pick, branch ordering, orientation, and theming.

### User Journey

```
journey
    title User shops online
    section Browse
        Visit homepage: 5: User
        Search product: 4: User
    section Purchase
        Add to cart: 5: User
        Checkout: 3: User, System
```

Tasks: `Task name: score: actor`. Score is 1–5 (higher = better sentiment). Sections group related tasks.

See `references/journey.md` for full syntax.

### Quadrant Chart

```
quadrantChart
    title Impact vs Effort
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Do First
    quadrant-2 Schedule
    quadrant-3 Delegate
    quadrant-4 Drop
    Task A: [0.3, 0.8]
    Task B: [0.7, 0.2]
```

Points: `Name: [x, y]` where x and y are 0–1. Axes: `x-axis left --> right`, `y-axis bottom --> top`. Quadrants: `quadrant-1` through `quadrant-4`. Point styling: `Name: [x, y] radius: 12, color: #ff0000`. Classes: `classDef name color: #109060` then `Point:::className: [x, y]`.

See `references/quadrant.md` for axis config, point styling, classes, and theme variables.

### XY Chart

```
xychart-beta
    title "Sales Q1"
    x-axis ["Jan", "Feb", "Mar"]
    y-axis "Revenue" 0 --> 10000
    bar [5000, 7000, 9000]
    line [3000, 6000, 8500]
```

Orientation: `xychart-beta horizontal` or vertical (default). x-axis: categorical `[cat1, cat2]` or numeric `min --> max`. y-axis: numeric range. Plots: `line [values]` or `bar [values]`. Named plots: `line "Series" [values]` (adds to legend). Per-point labels (v11.16.0+): `line [2.3 "label1", 45 "label2"]`.

See `references/xychart.md` for config options, axis config, theme variables, and data labels.

### Pie Chart

```
pie showData
    title Market Share
    "Product A" : 40
    "Product B" : 35
    "Product C" : 25
```

`showData` renders values after legend. Donut mode (v11.16.0+): set `donutHole` config (0 to 0.9). Legend position: `legendPosition` config (top/bottom/left/right/center). Highlight slice: `highlightSlice` config.

See `references/pie.md` for config options.

### Architecture Diagram

```
architecture-beta
    group api(cloud)[API Layer]
    service db(database)[Database] in api
    service server(server)[Server] in api
    db:R --> L:server
```

Groups: `group id(icon)[title] in parent`. Services: `service id(icon)[title] in parent`. Edges: `serviceId:side -- side:serviceId` where side is `T|B|L|R`. Arrows: `-->` for directional. Edges from groups: `serviceId{group}:B --> T:otherService{group}`. Junctions: `junction id`. Align: `align row idA idB` or `align column idA idB`. Icons: `cloud`, `database`, `disk`, `internet`, `server` or custom via iconify.design.

See `references/architecture.md` for edges, groups, junctions, alignment, layout tuning, and icons.

### Block Diagram

```
block-beta
    columns 3
    A B C
    D["Wide"] E F
    A --> D
    B --> E
```

Columns: `columns N`. Blocks: `id` or `id["label"]`. Shapes: `block:rounded`, `block:circle`, `block:hexagon`, etc. Width: `block:width N`. Composite: `block Parent { block Child }`. Edges: `-->`, `---`. Space: `space` or `space:N`. Styling: `classDef name fill:#f9f` then `class nodeId name`.

See `references/block.md` for shapes, edges, composite blocks, styling, and layout.

### Requirement Diagram

```
requirementDiagram
    requirement Test Req {
        id: 1
        text: The system shall test
        risk: High
        verifymethod: Test
    }
    element Entity {
        type: Software
        docref: spec.md
    }
    Test Req - satisfies -> Entity
```

Types: `requirement`, `functionalRequirement`, `interfaceRequirement`, `performanceRequirement`, `physicalRequirement`, `designConstraint`. Risk: `Low`/`Medium`/`High`. VerifyMethod: `Analysis`/`Inspection`/`Test`/`Demonstration`. Relationships: `contains`, `copies`, `derives`, `satisfies`, `verifies`, `refines`, `traces`. Direction: `direction LR`/`RL`/`TB`/`BT`.

See `references/requirement.md` for types, relationships, styling, and direction.

### Treemap

```
treemap-beta
    "Section 1"
        "Leaf 1.1": 12
        "Leaf 1.2": 8
    "Section 2"
        "Leaf 2.1": 20
        "Leaf 2.2": 25
```

Nodes: quoted text for sections, `"name": value` for leaves. Hierarchy via indentation. Styling: `classDef name fill:#f9f` then `"node":::className`. Value formatting: `valueFormat` config (`,`, `$`, `.1%`, etc.).

See `references/treemap.md` for config options, value formatting, and styling.

### Mindmap

```
mindmap
    Root
        A
            B
            C
        D
```

Hierarchy via indentation. Shapes: `id[square]`, `id(rounded)`, `id((circle))`, `id)bang(`, `id)cloud(`, `id{{hexagon}}`. Icons: `id::icon(fa:database)`. Classes: `id:::className`. Markdown strings supported.

See `references/mindmap.md` for shapes, icons, classes, and layouts.

### Timeline

```
timeline
    title History of Computing
    section Early Era
        1940s : ENIAC
        1950s : FORTRAN
    section Modern Era
        2000s : Cloud Computing
        2010s : AI Revolution
```

Time periods: `period : event` or `period : event : event`. Sections: `section Name`. Direction: `timeline LR` (default) or `timeline TD`. Multi-color: default on, `disableMultiColor` to disable.

See `references/timeline.md` for sections, direction, styling, and themes.

### Sankey

```
sankey-beta
    Source,Target,Value
    Electricity,Heating,40
    Electricity,Lights,15
    Gas,Heating,30
```

CSV format: 3 columns (source, target, value). Commas in values: wrap in double quotes. Double quotes in values: use `""`. Config: `linkColor` (source/target/gradient/hex), `nodeAlignment` (justify/center/left/right), `labelStyle` (legacy/outlined), `nodeWidth`, `nodePadding`, `nodeColors`.

See `references/sankey.md` for CSV syntax, config, and node colors.

## Common Gotchas

- **`end` breaks diagrams.** In flowcharts and sequence diagrams, `end` is a keyword. Wrap any node text containing "end" in quotes: `A["weekend"]`.
- **Frontmatter must be first.** The `---` lines must be the very first characters in the diagram. No blank lines before.
- **Indentation matters in mindmaps and treemaps.** The hierarchy is defined by indentation relative to the previous line, not absolute column position.
- **Sequence diagram `autonumber` must come early.** Place `autonumber` right after `sequenceDiagram` and before any participants.
- **Gantt `dateFormat` is required.** Without it, date parsing fails silently.
- **ER cardinality order matters.** `||--o{` means "exactly one to zero-or-more" — the left cardinality comes first.
- **Sankey values must be numeric.** The third CSV column must be a number, not a string.
- **Pie values must be positive.** Zero or negative values cause errors.
- **Quadrant point coordinates are 0–1.** Not pixel values, not percentages — a float between 0 and 1.
- **Architecture diagram identifiers must be declared before use.** You cannot reference a service in an edge before declaring it.

## Validation

The bundled `scripts/validate.py` checks Mermaid syntax for common errors:

```bash
uv run scripts/validate.py --input diagram.mmd
```

Or pipe via stdin:

```bash
cat diagram.mmd | uv run scripts/validate.py --stdin
```

Checks include: valid diagram type keyword, balanced braces/brackets/parentheses, unquoted diagram-breaking words, frontmatter YAML validity, and common syntax pitfalls per diagram type.

Output is structured JSON to stdout, diagnostics to stderr. Exit code 0 = valid, 1 = invalid, 2 = usage error.

## Detailed References

Load these when you need full syntax details, edge cases, or examples for a specific diagram type:

- `references/flowchart.md` — All node shapes (30+), link types, subgraphs, styling, icons, markdown strings
- `references/sequence.md` — Arrow types, loops, alt/par/critical/break, notes, activations, styling
- `references/gantt.md` — Date format, axis format, duration units, excludes, milestones, compact mode, today marker
- `references/class.md` — Visibility, generics, relationships, cardinality, namespaces, annotations, notes
- `references/state.md` — Composite states, choice, fork, concurrency, notes, direction, classDefs
- `references/er.md` — Cardinality, identification, attributes, keys, comments, aliases, subgraphs, direction
- `references/gitgraph.md` — Commit types, tags, cherry-pick, branch ordering, orientation, config, themes
- `references/journey.md` — Sections, tasks, scores, actors
- `references/quadrant.md` — Axes, quadrants, points, styling, classes, config, theme variables
- `references/xychart.md` — Orientation, axes, line/bar plots, legends, data labels, config, theme variables
- `references/pie.md` — showData, donut mode, legend position, highlight slice, config
- `references/architecture.md` — Groups, services, edges, junctions, alignment, layout tuning, icons
- `references/block.md` — Columns, shapes, composite blocks, edges, space blocks, styling
- `references/requirement.md` — Types, elements, relationships, direction, styling
- `references/treemap.md` — Node hierarchy, styling, value formatting, config options
- `references/mindmap.md` — Shapes, icons, classes, markdown strings, layouts
- `references/timeline.md` — Time periods, events, sections, direction, styling, themes
- `references/sankey.md` — CSV syntax, link colors, node alignment, label style, node colors

## Available Scripts

- **`scripts/validate.py`** — Validates Mermaid diagram syntax. Run with `uv run scripts/validate.py --input <file>` or `--stdin`.
