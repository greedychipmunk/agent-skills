# Timeline Reference

## Declaration

```
timeline
    title History of Computing
    1940s : ENIAC
    1950s : FORTRAN
    2000s : Cloud Computing
    2010s : AI Revolution
```

## Syntax

```
timeline
    {time period} : {event}
    {time period} : {event} : {event}
    {time period} : {event}
                  : {event}
                  : {event}
```

- Time period and events are simple text — not limited to numbers.
- Multiple events per time period: separate with `:` or use continuation lines with `:`.
- First time period = leftmost. Last = rightmost.
- First event = top. Last event = bottom for that time period.

## Title

```
title Timeline title
```

Optional. Placed after `timeline` keyword.

## Sections

```
section Early Era
    1940s : ENIAC
    1950s : FORTRAN
section Modern Era
    2000s : Cloud Computing
    2010s : AI Revolution
```

Groups time periods into named sections. All subsequent time periods belong to the section until a new section is defined. Each section gets its own color scheme.

## Text Wrapping

Long text wraps automatically. Use `<br>` to force a line break.

## Direction (v11.14.0+)

```
timeline LR
timeline TD
```

- `LR` — Left to right (default)
- `TD` — Top down

## Styling

### Default Behavior

Without sections: each time period gets its own color scheme (multiColor, default on).

### Disable Multi-Color

```
---
config:
  timeline:
    disableMultiColor: true
---
```

All time periods follow the same color scheme.

### Custom Color Scheme

Use theme variables `cScale0` through `cScale11` (up to 12 sections):

```
%%{init: {'themeVariables': {'cScale0': '#ff0000', 'cScale1': '#00ff00'}}}%%
```

Foreground colors: `cScaleLabel0` through `cScaleLabel11`.

After 12 sections, colors repeat cyclically.

## Themes

Pre-defined themes: `base`, `forest`, `dark`, `default`, `neutral`.

Set via `initialize` or directives.

## Example

```
timeline
    title Product Roadmap
    section Q1
        January : Launch beta
        February : Gather feedback
        March : Ship v1.0
    section Q2
        April : Performance tuning
        May : Feature expansion
        June : Ship v1.5
```
