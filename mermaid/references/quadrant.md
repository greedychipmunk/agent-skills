# Quadrant Chart Reference

## Declaration

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

## Syntax

### Title

```
title Chart title
```

Optional. Rendered at the top.

### x-axis

```
x-axis left text --> right text
x-axis left text only
```

Two parts: left and right, separated by `-->`. Right is optional.

### y-axis

```
y-axis bottom text --> top text
y-axis bottom text only
```

Two parts: bottom and top, separated by `-->`. Top is optional.

### Quadrants

```
quadrant-1 Top right text
quadrant-2 Top left text
quadrant-3 Bottom left text
quadrant-4 Bottom right text
```

### Points

```
Point name: [x, y]
```

- x and y values: 0 to 1 (float)
- Points rendered as circles at the specified coordinates

## Point Styling

### Direct Styling

```
Point A: [0.9, 0.0] radius: 12
Point B: [0.8, 0.1] color: #ff3300, radius: 10
Point C: [0.7, 0.2] radius: 25, color: #00ff33, stroke-color: #10f0f0
Point D: [0.6, 0.3] radius: 15, stroke-color: #00ff0f, stroke-width: 5px, color: #ff33f0
```

| Parameter | Description |
| --- | --- |
| `color` | Fill color of the point |
| `radius` | Radius of the point |
| `stroke-width` | Border width (with `px` suffix) |
| `stroke-color` | Border color (useless without stroke-width) |

### Class Styling

```
Point A:::class1: [0.9, 0.0]
Point B:::class2: [0.8, 0.1]
classDef class1 color: #109060
classDef class2 color: #908342, radius: 10, stroke-color: #310085, stroke-width: 10px
```

### Style Priority

1. Direct styles (highest)
2. Class styles
3. Theme styles (lowest)

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| `chartWidth` | Chart width | 500 |
| `chartHeight` | Chart height | 500 |
| `titlePadding` | Title top/bottom padding | 10 |
| `titleFontSize` | Title font size | 20 |
| `quadrantPadding` | Padding outside quadrants | 5 |
| `quadrantTextTopPadding` | Quadrant text top padding | 5 |
| `quadrantLabelFontSize` | Quadrant text font size | 16 |
| `quadrantInternalBorderStrokeWidth` | Inner border width | 1 |
| `quadrantExternalBorderStrokeWidth` | Outer border width | 2 |
| `xAxisLabelPadding` | x-axis label padding | 5 |
| `xAxisLabelFontSize` | x-axis font size | 16 |
| `xAxisPosition` | x-axis position | top |
| `yAxisLabelPadding` | y-axis label padding | 5 |
| `yAxisLabelFontSize` | y-axis font size | 16 |
| `yAxisPosition` | y-axis position | left |
| `pointTextPadding` | Padding below point | 5 |
| `pointLabelFontSize` | Point text font size | 12 |
| `pointRadius` | Default point radius | 5 |

## Theme Variables

| Variable | Description |
| --- | --- |
| `quadrant1Fill` | Top right quadrant fill |
| `quadrant2Fill` | Top left quadrant fill |
| `quadrant3Fill` | Bottom left quadrant fill |
| `quadrant4Fill` | Bottom right quadrant fill |
| `quadrant1TextFill`–`quadrant4TextFill` | Quadrant text colors |
| `quadrantPointFill` | Point fill color |
| `quadrantPointTextFill` | Point text color |
| `quadrantXAxisTextFill` | x-axis text color |
| `quadrantYAxisTextFill` | y-axis text color |
| `quadrantInternalBorderStrokeFill` | Inner border color |
| `quadrantExternalBorderStrokeFill` | Outer border color |
| `quadrantTitleFill` | Title color |
