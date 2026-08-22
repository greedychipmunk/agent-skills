# State Diagram Reference

## Declaration

```
stateDiagram-v2
    [*] --> Still
    Still --> Moving
    Moving --> [*]
```

Use `stateDiagram-v2` for current syntax. Legacy `stateDiagram` is deprecated.

## States

```
stateId
state "Long description" as stateId
stateId : Description
```

Three ways to define a state: bare id, `state "description" as id`, or `id : description`.

## Transitions

```
A --> B
A --> B : transition label
```

## Start and End

```
[*] --> StateA
StateA --> [*]
```

`[*]` represents start (when transition goes from it) or end (when transition goes to it).

## Composite States

```
state Composite {
    [*] --> Inner1
    Inner1 --> Inner2
    Inner2 --> [*]
}
```

Nesting: composite states can contain other composite states.

Transitions between composite states:

```
state Parent1 {
    [*] --> A
}
state Parent2 {
    [*] --> B
}
Parent1 --> Parent2
```

Cannot define transitions between internal states of different composite states.

## Choice

```
state IsReady <<choice>>
[*] --> IsReady
IsReady --> Yes : if true
IsReady --> No : if false
```

## Forks

```
state ForkState <<fork>>
[*] --> ForkState
ForkState --> State1
ForkState --> State2
state JoinState <<join>>
State1 --> JoinState
State2 --> JoinState
JoinState --> [*]
```

## Notes

```
note left of StateId : Note text
note right of StateId : Note text
```

## Concurrency

```
state Active {
    [*] --> Running
    --
    [*] --> Paused
}
```

`--` separates concurrent regions within a composite state.

## Direction

```
stateDiagram-v2
    direction LR
    [*] --> A
    A --> B
```

Valid: `LR`, `RL`, `TB`, `BT`.

## Styling

### classDef

```
classDef movement font-style:italic
classDef badEvent fill:#f00,color:white,font-weight:bold,stroke-width:2px,stroke:yellow
```

Apply: `class StateId className` or `class StateA, StateB className`.

### ::: operator

```
StateId:::className
```

Apply style inline during transition definition.

Limitations: cannot apply to start/end states, cannot apply within composite states.

## Comments

```
%% This is a comment
```

`%%` starts a comment — rest of line is ignored.
