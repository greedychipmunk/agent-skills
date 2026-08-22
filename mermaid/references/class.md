# Class Diagram Reference

## Declaration

```
classDiagram
    class Animal {
        +String name
        -int age
    }
```

## Class Members

```
class ClassName {
    +publicMethod() ReturnType
    -privateField Type
    #protectedField Type
    ~packageField Type
    *abstractMethod() ReturnType
    $staticField Type
    $staticMethod() ReturnType
}
```

### Visibility

| Symbol | Visibility |
| --- | --- |
| `+` | Public |
| `-` | Private |
| `#` | Protected |
| `~` | Package |

### Modifiers

| Symbol | Modifier |
| --- | --- |
| `*` | Abstract |
| `$` | Static |

### Generic Types

```
class List~T~ {
    +add(T item) void
    +get(int index) T
}
```

### Return Types

Method: `+methodName(params) ReturnType`. Params: `+method(Type1 param1, Type2 param2) ReturnType`.

## Relationships

| Syntax | Type | Description |
| --- | --- | --- |
| `A --|> B` | Inheritance | A inherits from B |
| `A *-- B` | Composition | A is composed of B |
| `A o-- B` | Aggregation | A aggregates B |
| `A --> B` | Association | A uses B |
| `A -- B` | Solid link | A linked to B |
| `A ..> B` | Dependency | A depends on B |
| `A ..|> B` | Realization | A implements B |
| `A .. B` | Dashed link | A loosely linked to B |

### Cardinality

```
Animal "1" --> "0..*" Dog
Customer "1" --|> "1" Person
```

Cardinality labels go in quotes before/after the relationship arrow.

Common cardinalities: `"1"`, `"0..1"`, `"0..*"`, `"1..*"`, `"*"`.

### Direction

```
A --> B : label
A --|> B : extends
```

Labels go after `:` on the relationship line.

## Namespaces

```
namespace Animals {
    class Dog
    class Cat
}
namespace Plants {
    class Tree
}
```

## Annotations

```
class Service {
    <<interface>>
    +execute() void
    <<abstract>>
    +run() void
    <<enumeration>>
    RED
    GREEN
    BLUE
}
```

Annotations: `<<interface>>`, `<<abstract>>`, `<<enumeration>>`, `<<annotation>>`, `<<circle>>`, `<<hidden>>`.

## Notes

```
note "This is a note" as N1
note for Dog "Dogs bark"
```

Notes can be attached to classes or standalone.

## Styling

### classDef

```
classDef blue fill:#blue,color:white,stroke:#333
class Dog blue
class Dog,Cat blue
```

### style

```
style Dog fill:#blue,color:white
```

### Default class

```
classDef default fill:#f9f,stroke:#333
```

## Direction

```
classDiagram
    direction LR
    A --> B
```

Valid: `TB` (default), `BT`, `LR`, `RL`.
