# Sequence Diagram Reference

## Declaration

```
sequenceDiagram
    Alice->>Bob: Hello
```

## Participants

```
participant Alice
participant Bob as Robert
actor Carol
```

`participant` and `actor` are interchangeable for declaration. `actor` renders a stick figure. Aliases via `as`.

Participant ordering: first declared = leftmost. Use `participant` before messages to control order.

## Arrow Types

| Syntax | Description |
| --- | --- |
| `->` | Solid line, no arrow |
| `-->` | Dotted line, no arrow |
| `->>` | Solid line, solid arrowhead |
| `-->>` | Dotted line, solid arrowhead |
| `-x` | Solid line, open arrowhead (async) |
| `--x` | Dotted line, open arrowhead |
| `-)` | Solid line, open arrowhead (async, alt) |
| `--)` | Dotted line, open arrowhead |

### Half-Arrows (v11.12.3+)

| Syntax | Description |
| --- | --- |
| `->>` | Half solid arrow (right) |
| `-->>` | Half dotted arrow (right) |
| `<<->` | Half solid arrow (left) |
| `<<--` | Half dotted arrow (left) |
| `<<->>` | Double half arrow |

## Messages

```
Alice->>Bob: Hello there
Alice->>Bob: <br/>Multi-line message
```

Messages can contain markdown when wrapped in quotes: `Alice->>Bob: "**Bold** message"`.

## Message Grouping

### Loop

```
loop Every minute
    Alice->>Bob: Heartbeat
end
```

### Alt / Else

```
alt Successful response
    Alice->>Bob: Process
else Failed response
    Alice->>Bob: Retry
end
```

### Opt

```
opt Optional step
    Alice->>Bob: Extra info
end
```

### Parallel

```
par
    Alice->>Bob: Task 1
and
    Alice->>Carol: Task 2
and
    Bob->>Carol: Task 3
end
```

### Critical / Option

```
critical Network available
    Alice->>Bob: Send data
option Timeout
    Alice->>Bob: Retry
end
```

### Break

```
break Error occurred
    Alice->>Bob: Handle error
end
```

## Notes

```
note left of Alice: This is a note
note right of Bob: Another note
note over Alice, Bob: Spanning note
note over Alice: Single note
```

Note with markdown: `note left of Alice: "**Important** info"`.

## Activations

```
activate Alice
Alice->>Bob: Message
deactivate Alice
```

Shorthand: `+` to activate, `-` to deactivate:

```
Alice->>+Bob: Message
Bob-->>-Alice: Reply
```

## autonumber

```
sequenceDiagram
    autonumber
    Alice->>Bob: Hello
```

Place right after `sequenceDiagram`. Can optionally specify start number: `autonumber 10`. Can specify increment: `autonumber 10 5`. Can use `autonumber off` to stop.

## Links

```
link Alice: Click for details
```

Clickable participant links. `link Alice: https://example.com`.

## Styling

### Participant Styling

```
participant Alice
participant Bob
classDef blue fill:#blue,color:white
class Alice blue
```

### Message Styling

Use `autonumber` with `autonumber` class definitions for numbered messages.

### rect

```
rect rgb(191, 223, 255)
    Alice->>Bob: Hello
end
```

Colored background blocks for grouping messages visually. Supports `rgb()` and `rgba()`.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| `actorMargin` | Margin between actors | 50 |
| `boxMargin` | Margin around boxes | 10 |
| `boxTextMargin` | Margin around box text | 5 |
| `noteMargin` | Margin around notes | 10 |
| `messageMargin` | Margin between messages | 35 |
| `mirrorActors` | Mirror actors on bottom | true |
| `useMaxWidth` | Scale to container | true |
