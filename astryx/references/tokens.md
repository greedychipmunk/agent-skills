# Tokens Reference

Design tokens are CSS custom properties that adapt to the active theme and color mode. Use them via StyleX `stylex.create()` or Tailwind semantic utilities.

## Spacing

4px base unit. Component `gap` props accept step values 0–12.

| Token | Value |
| --- | --- |
| `--spacing-0` | 0px |
| `--spacing-0_5` | 2px |
| `--spacing-1` | 4px |
| `--spacing-1_5` | 6px |
| `--spacing-2` | 8px |
| `--spacing-3` | 12px |
| `--spacing-4` | 16px |
| `--spacing-6` | 24px |
| `--spacing-8` | 32px |
| `--spacing-12` | 48px |

Import in StyleX:

```tsx
import {spacingVars} from '@astryxdesign/core';

const styles = stylex.create({
  box: { padding: spacingVars['--spacing-4'] },
});
```

## Color

Semantic tokens describe purpose, not appearance. All color tokens use `light-dark()` for automatic light/dark mode switching.

### Surface Hierarchy

`body` → `surface` → `card` → `popover` (increasing elevation)

| Token | Light | Dark |
| --- | --- | --- |
| `--color-background-body` | #FFFFFF | #0A0A0A |
| `--color-background-surface` | #F5F5F5 | #181818 |
| `--color-background-card` | #FFFFFF | #202020 |
| `--color-background-popover` | #FFFFFF | #2A2A2A |

### Text

| Token | Light | Dark |
| --- | --- | --- |
| `--color-text-primary` | #0A0A0A | #FAFAFA |
| `--color-text-secondary` | #6B6B6B | #A0A0A0 |
| `--color-text-disabled` | #A0A0A0 | #525252 |
| `--color-on-accent` | #FFFFFF | #0A0A0A |

### Border

| Token | Light | Dark |
| --- | --- | --- |
| `--color-border` | #E5E5E5 | #2A2A2A |
| `--color-border-strong` | #D0D0D0 | #404040 |

### Accent

| Token | Light | Dark |
| --- | --- | --- |
| `--color-accent` | #7B61FF | #9B85FF |
| `--color-accent-hover` | #6B4FFF | #8B75FF |
| `--color-accent-pressed` | #5B3FEF | #7B65EF |

### Status

| Token | Light | Dark |
| --- | --- | --- |
| `--color-success` | #1B873F | #4ADE80 |
| `--color-error` | #E5484D | #FF6B6B |
| `--color-warning` | #F5A623 | #FFB938 |

### Data Visualization

`--color-data-1` through `--color-data-10` — 10-color palette for charts and data visualizations.

Import in StyleX:

```tsx
import {colorVars} from '@astryxdesign/core';

const styles = stylex.create({
  card: { backgroundColor: colorVars['--color-background-card'] },
});
```

## Size

Control heights for form elements and interactive components.

| Token | Value |
| --- | --- |
| `--size-element-sm` | 28px |
| `--size-element-md` | 32px |
| `--size-element-lg` | 36px |

## Border

| Token | Value |
| --- | --- |
| `--border-width-none` | 0px |
| `--border-width-thin` | 1px |
| `--border-width-thick` | 2px |

## Focus

| Token | Value |
| --- | --- |
| `--focus-ring-width` | 2px |
| `--focus-ring-offset` | 2px |
| `--focus-ring-color` | var(--color-accent) |

## Radius

| Token | Value |
| --- | --- |
| `--radius-none` | 0px |
| `--radius-inner` | 8px |
| `--radius-element` | 12px |
| `--radius-container` | 16px |
| `--radius-page` | 32px |
| `--radius-chat` | 28px |
| `--radius-full` | 9999px |

Import in StyleX:

```tsx
import {radiusVars} from '@astryxdesign/core';

const styles = stylex.create({
  box: { borderRadius: radiusVars['--radius-container'] },
});
```

## Shadow

| Token | Value |
| --- | --- |
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) |
| `--shadow-md` | 0 4px 8px rgba(0,0,0,0.08) |
| `--shadow-lg` | 0 8px 24px rgba(0,0,0,0.12) |
| `--shadow-xl` | 0 16px 48px rgba(0,0,0,0.16) |

## Duration

| Token | Value |
| --- | --- |
| `--duration-instant` | 0ms |
| `--duration-fast` | 100ms |
| `--duration-normal` | 200ms |
| `--duration-slow` | 300ms |
| `--duration-slower` | 400ms |

## Easing

| Token | Value |
| --- | --- |
| `--easing-standard` | cubic-bezier(0.2, 0, 0, 1) |
| `--easing-emphasized` | cubic-bezier(0.2, 0, 0, 1) |
| `--easing-decelerate` | cubic-bezier(0, 0, 0, 1) |

## Font Family

| Token | Value |
| --- | --- |
| `--font-family-body` | "Figtree", system-ui, sans-serif |
| `--font-family-code` | "SF Mono", ui-monospace, monospace |
| `--font-family-heading` | "Figtree", system-ui, sans-serif |

## Font Size

Geometric type scale: `round(14 × 1.2^step)`

| Token | Value |
| --- | --- |
| `--font-size-sm` | 12px |
| `--font-size-md` | 14px |
| `--font-size-lg` | 17px |
| `--font-size-xl` | 21px |
| `--font-size-2xl` | 25px |
| `--font-size-3xl` | 30px |
| `--font-size-4xl` | 36px |

## Font Weight

| Token | Value |
| --- | --- |
| `--font-weight-normal` | 400 |
| `--font-weight-medium` | 500 |
| `--font-weight-semibold` | 600 |
| `--font-weight-bold` | 700 |

## Type Scale

Semantic type tokens combine size, weight, and line-height. Use `Heading` and `Text` components — don't set font-size manually.

| Token | Size | Weight | Line Height |
| --- | --- | --- | --- |
| `--type-heading-1` | 36px | 700 | 1.1 |
| `--type-heading-2` | 30px | 700 | 1.15 |
| `--type-heading-3` | 25px | 600 | 1.2 |
| `--type-heading-4` | 21px | 600 | 1.25 |
| `--type-heading-5` | 17px | 600 | 1.3 |
| `--type-heading-6` | 14px | 600 | 1.4 |
| `--type-display-1` | 48px | 700 | 1.05 |
| `--type-display-2` | 40px | 700 | 1.1 |
| `--type-display-3` | 34px | 700 | 1.1 |
| `--type-body` | 14px | 400 | 1.5 |
| `--type-label` | 14px | 500 | 1.4 |
| `--type-code` | 14px | 400 | 1.5 |
| `--type-supporting` | 12px | 400 | 1.4 |

## Using Tokens in StyleX

```tsx
import * as stylex from '@stylexjs/stylex';
import {colorVars, spacingVars, radiusVars, sizeVars} from '@astryxdesign/core';

const styles = stylex.create({
  card: {
    padding: spacingVars['--spacing-4'],
    backgroundColor: colorVars['--color-background-surface'],
    borderRadius: radiusVars['--radius-container'],
    minHeight: sizeVars['--size-element-lg'],
  },
});
```

## Using Tokens in Tailwind

Import `@astryxdesign/core/tailwind-theme.css` once. Then:

```tsx
<div className="bg-surface text-primary border-border rounded-lg shadow-md p-4">
  Content
</div>
```

Tailwind utilities resolve to the active theme's token values. Dark mode works automatically.
