# XY Chart Reference

## Declaration

```
xychart-beta
    title "Sales Q1"
    x-axis ["Jan", "Feb", "Mar"]
    y-axis "Revenue" 0 --> 10000
    bar [5000, 7000, 9000]
    line [3000, 6000, 8500]
```

## Orientation

```
xychart-beta vertical
xychart-beta horizontal
```

Default: vertical. Set with keyword after `xychart-beta`.

## Title

```
title "Chart title"
title SingleWord
```

Optional. Multi-word titles need quotes. Rendered at the top.

## x-axis

### Categorical

```
x-axis "Title" [cat1, "cat2 with space", cat3]
```

Categories are text values. Multi-word values need quotes.

### Numeric Range

```
x-axis "Title" 0 --> 100
```

Functions as a numeric axis with the given range.

## y-axis

```
y-axis "Title" 0 --> 10000
y-axis "Title"
```

Numeric range only. If range omitted, auto-generated from data.

Both x and y axes are optional. If not provided, ranges are auto-created.

## Plots

### Line

```
line [2.3, 45, .98, -3.4]
line "Series Name" [2.3, 45, .98, -3.4]
```

Named plots appear in the legend. Values can be any valid numeric.

### Bar

```
bar [2.3, 45, .98, -3.4]
bar "Series Name" [2.3, 45, .98, -3.4]
```

Named plots appear in the legend.

### Per-Point Labels (v11.16.0+)

```
line [2.3 "Jan", 45 "Feb", .98 "Mar"]
```

Optional quoted string after each numeric value. Labels render above points (vertical) or to the right (horizontal). Only supported on `line` plots; accepted but ignored on `bar`.

## Legend (v11.17.0+)

Named line and bar plots automatically appear in a legend. Unnamed plots are omitted.

## Data Labels on Bars (v11.14.0+)

```
--- 
config:
  xychart:
    showDataLabel: true
    showDataLabelOutsideBar: true
---
```

`showDataLabel` shows values inside bars. `showDataLabelOutsideBar` moves them outside.

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| `width` | Chart width | 700 |
| `height` | Chart height | 500 |
| `titlePadding` | Title padding | 10 |
| `titleFontSize` | Title font size | 20 |
| `showTitle` | Show title | true |
| `showLegend` | Show legend for named plots | true |
| `legendFontSize` | Legend font size | 14 |
| `legendPadding` | Legend padding | 10 |
| `chartOrientation` | vertical or horizontal | vertical |
| `plotReservedSpacePercent` | Min space for plots | 50 |
| `showDataLabel` | Show bar values | false |
| `showDataLabelOutsideBar` | Labels outside bars | false |

### AxisConfig

| Parameter | Description | Default |
| --- | --- | --- |
| `showLabel` | Show labels/ticks | true |
| `labelFontSize` | Label font size | 14 |
| `labelPadding` | Label padding | 5 |
| `showTitle` | Show axis title | true |
| `titleFontSize` | Title font size | 16 |
| `titlePadding` | Title padding | 5 |
| `showTick` | Show ticks | true |
| `tickLength` | Tick length | 5 |
| `tickWidth` | Tick width | 2 |
| `showAxisLine` | Show axis line | true |
| `axisLineWidth` | Axis line thickness | 2 |
| `labelRotation` | Label rotation (bottom x-axis) | 0 |

## Theme Variables

Set via frontmatter under `themeVariables.xyChart`:

| Parameter | Description |
| --- | --- |
| `backgroundColor` | Chart background |
| `titleColor` | Title text color |
| `dataLabelColor` | Data label color |
| `legendTextColor` | Legend text color |
| `xAxisLabelColor` | x-axis label color |
| `xAxisTitleColor` | x-axis title color |
| `xAxisTickColor` | x-axis tick color |
| `xAxisLineColor` | x-axis line color |
| `yAxisLabelColor` | y-axis label color |
| `yAxisTitleColor` | y-axis title color |
| `yAxisTickColor` | y-axis tick color |
| `yAxisLineColor` | y-axis line color |
| `plotColorPalette` | Comma-separated color palette for plots |
