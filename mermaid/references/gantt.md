# Gantt Chart Reference

## Declaration

```
gantt
    title Project Schedule
    dateFormat YYYY-MM-DD
    axisFormat %Y-%m-%d
```

## dateFormat

Defines how dates are parsed. Default: `YYYY-MM-DD`.

| Token | Meaning |
| --- | --- |
| `YYYY` | 4-digit year |
| `YY` | 2-digit year |
| `MM` | Month (01-12) |
| `DD` | Day (01-31) |
| `HH` | Hours (00-23) |
| `mm` | Minutes (00-59) |
| `ss` | Seconds (00-59) |

## axisFormat

Defines how dates are displayed on the axis. Uses D3 date formatting: `%Y-%m-%d`, `%b %d`, `%H:%M`, etc.

## Tasks

```
gantt
    dateFormat YYYY-MM-DD
    Task 1 :a1, 2024-01-01, 30d
    Task 2 :after a1, 20d
    Task 3 :2024-02-15, 45d
```

Format: `Task name : id, startDate, duration` or `Task name : id, after depId, duration`.

Task id is optional: `Task name : 2024-01-01, 30d`.

## Duration

Duration units (case-sensitive):

| Unit | Meaning |
| --- | --- |
| `ms` | Milliseconds |
| `s` | Seconds |
| `m` | Minutes |
| `h` | Hours |
| `d` | Days |
| `w` | Weeks |
| `M` | Months |
| `y` | Years |

Examples: `30d`, `2w`, `6M`, `1y`.

## Sections

```
section Design
    Task 1 :a1, 2024-01-01, 30d
    Task 2 :after a1, 20d
section Development
    Task 3 :2024-02-15, 45d
```

## Milestones

```
    Milestone :milestone, 2024-04-01, 0d
```

Use `milestone` keyword and `0d` duration. Renders as a diamond.

## Excludes

```
    excludes weekends
    excludes friday, saturday
```

Excludes named days from duration calculations. Recognized: `weekends`, `weekends union`, `monday`–`sunday`.

## todayMarker

```
    todayMarker off
    todayMarker stroke:#f00,stroke-width:2px
```

Controls the vertical "today" line. `off` hides it. Default: on with standard styling.

## Compact Mode

```
gantt
    compact
    dateFormat YYYY-MM-DD
    Task 1 :a1, 2024-01-01, 30d
```

Reduces vertical spacing between tasks.

## Status

```
    Task 1 :done, a1, 2024-01-01, 30d
    Task 2 :active, a2, 2024-02-01, 20d
    Task 3 :crit, a3, 2024-03-01, 10d
    Task 4 :done, crit, a4, 2024-03-15, 5d
```

Statuses: `done` (greyed out), `active` (highlighted), `crit` (critical, red). Can combine: `done, crit`.

## Metadata Syntax

| Syntax | Meaning |
| --- | --- |
| `Task : id, start, duration` | Standard task |
| `Task : id, after dep, duration` | Dependent task |
| `Task : done, id, start, duration` | Completed task |
| `Task : active, id, start, duration` | Active task |
| `Task : crit, id, start, duration` | Critical task |
| `Task : milestone, id, date, 0d` | Milestone |

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| `titleTopMargin` | Space above title | 25 |
| `barHeight` | Height of bars | 20 |
| `barGap` | Gap between bars | 4 |
| `topPadding` | Padding above tasks | 50 |
| `rightPadding` | Padding right of tasks | 75 |
| `leftPadding` | Padding left of tasks | 75 |
| `gridLineStartPadding` | Padding for grid lines | 35 |
| `fontSize` | Text font size | 11 |
| `sectionFontSize` | Section text font size | 11 |
| `numberSectionStyles` | Number of section styles | 4 |
