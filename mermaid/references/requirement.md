# Requirement Diagram Reference

## Declaration

```
requirementDiagram
    requirement TestReq {
        id: 1
        text: The system shall test
        risk: High
        verifymethod: Test
    }
```

## Components

Three component types: requirement, element, and relationship.

### Requirement

```
<type> user_defined_name {
    id: user_defined_id
    text: user_defined text
    risk: <risk>
    verifymethod: <method>
}
```

#### Types

| Type | Description |
| --- | --- |
| `requirement` | General requirement |
| `functionalRequirement` | Functional requirement |
| `interfaceRequirement` | Interface requirement |
| `performanceRequirement` | Performance requirement |
| `physicalRequirement` | Physical requirement |
| `designConstraint` | Design constraint |

#### Risk

| Value |
| --- |
| `Low` |
| `Medium` |
| `High` |

#### VerificationMethod

| Value |
| --- |
| `Analysis` |
| `Inspection` |
| `Test` |
| `Demonstration` |

### Element

```
element user_defined_name {
    type: user_defined_type
    docref: user_defined_ref
}
```

Lightweight component for connecting requirements to external documents. All fields are user-defined.

### Relationship

```
{name of source} - <type> -> {name of destination}
{name of destination} <- <type> - {name of source}
```

#### Relationship Types

| Type | Description |
| --- | --- |
| `contains` | Source contains destination |
| `copies` | Source copies destination |
| `derives` | Source derives from destination |
| `satisfies` | Source satisfies destination |
| `verifies` | Source verifies destination |
| `refines` | Source refines destination |
| `traces` | Source traces to destination |

## Markdown Formatting

User-defined text can use markdown inside quotes:

```
text: "**Bold** and *italic* text"
name: "**Important** Requirement"
```

## Direction

```
requirementDiagram
    direction LR
```

Valid: `TB` (default), `BT`, `LR`, `RL`.

## Styling

### classDef

```
classDef important fill:#f9f,stroke:#333,stroke-width:2px
class TestReq important
class TestReq,TestEntity important
```

### style

```
style TestReq fill:#f9f,stroke:#333
```

### ::: operator

```
requirement TestReq:::important {
    id: 1
    text: class styling example
    risk: low
    verifymethod: test
}
```

Or after definition:

```
element TestElem {
}
TestElem:::myClass
```

### Default class

```
classDef default fill:#f9f,stroke:#333,stroke-width:4px
```

## Example

```
requirementDiagram
    requirement StorageReq {
        id: 1
        text: The system shall store data
        risk: Medium
        verifymethod: Test
    }
    element Database {
        type: Software
        docref: architecture.md
    }
    StorageReq - satisfies -> Database
    StorageReq - traces -> Database
```
