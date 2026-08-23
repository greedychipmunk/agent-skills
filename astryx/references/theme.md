# Theme Reference

## Setup

Wrap your app in `Theme` and pass a theme object:

```tsx
import {Theme} from '@astryxdesign/core';
import {neutralTheme} from '@astryxdesign/theme-neutral';

<Theme theme={neutralTheme} mode="system">
  <YourApp />
</Theme>
```

`mode` accepts `'light'`, `'dark'`, or `'system'`.

## Shipped Themes

| Theme | Style |
| --- | --- |
| neutral | Muted, minimal. Good starting point |
| butter | Golden buttery surfaces, blue accents |
| chocolate | Warm brown tones, cozy beige |
| gothic | Dark-only atmospheric theme |
| matcha | Earthy green theme |
| stone | Warm stone and slate tones |
| y2k | Playful Y2K pop, periwinkle + holographic |

## defineTheme

Create custom themes with token overrides, scale configs, and component overrides.

### Basic

```tsx
import {defineTheme} from '@astryxdesign/core/theme';

const myTheme = defineTheme({
  name: 'my-theme',
  color: { accent: '#7B61FF' },
  tokens: {
    '--color-background-body': ['#FFFFFF', '#0A0A0A'],
  },
});
```

### With Scale Configs

Scale configs generate derived tokens automatically.

```tsx
const brandTheme = defineTheme({
  name: 'brand',
  color: {
    accent: ['#7B61FF', '#9B85FF'],  // [light, dark]
    neutralStyle: 'cool',            // 'cool' | 'warm' | 'neutral'
  },
  typography: {
    scale: { base: 14, ratio: 1.2 },
  },
  radius: {
    base: 4,
    multiplier: 1,
  },
  motion: {
    duration: 'normal',
    easing: 'standard',
  },
});
```

### Color Scale Config

| Field | Type | Description |
| --- | --- | --- |
| `accent` | `string \| [string, string]` | Primary accent color (light, dark) |
| `neutralStyle` | `'cool' \| 'warm' \| 'neutral'` | Neutral color temperature |
| `background` | `string \| [string, string]` | Body background override |

Derived tokens like `--color-accent-hover`, `--color-accent-pressed`, and `--color-on-accent` are generated from the accent scale automatically.

### Typography Scale Config

| Field | Type | Default |
| --- | --- | --- |
| `base` | `number` | 14 |
| `ratio` | `number` | 1.2 |

Generates the full type scale: `--font-size-sm` through `--font-size-4xl`.

### Radius Scale Config

| Field | Type | Description |
| --- | --- |
| `base` | `number` | Base radius in px |
| `multiplier` | `number` | Scale multiplier for larger radii |

### Motion Scale Config

| Field | Type | Description |
| --- | --- |
| `duration` | `'fast' \| 'normal' \| 'slow'` | Base animation duration |
| `easing` | `'standard' \| 'emphasized' \| 'decelerate'` | Default easing curve |

## Extending Themes

```tsx
const brandTheme = defineTheme({
  name: 'brand',
  extends: neutralTheme,
  tokens: {
    '--color-accent': ['#7B61FF', '#9B85FF'],
  },
});
```

Inherited tokens keep their values unless overridden.

## Component Overrides

Override component styles at the theme level:

```tsx
const brandTheme = defineTheme({
  name: 'brand',
  extends: neutralTheme,
  components: {
    button: {
      'variant:primary': {
        color: 'white',
        fontWeight: 600,
      },
      'size:lg': {
        paddingInline: 24,
      },
    },
    card: {
      '': {
        borderRadius: 'var(--radius-page)',
      },
    },
  },
});
```

Override keys use `variant:value` or `size:value` patterns. Empty string `''` targets the base component.

## Custom Variants

Define custom variants that components can use:

```tsx
const brandTheme = defineTheme({
  name: 'brand',
  extends: neutralTheme,
  components: {
    button: {
      'variant:brand': {
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-on-accent)',
      },
    },
  },
});

// Usage
<Button label="Brand" variant="brand" />
```

## Runtime vs Built Themes

| | Runtime (source) | Built |
| --- | --- | --- |
| Import | `@astryxdesign/theme-{name}` | `@astryxdesign/theme-{name}/built` + `theme.css` |
| SSR | Tokens yes, overrides flash | Fully SSR safe |
| Best for | Dev, prototyping | Production, SSR apps |

### Runtime

```tsx
import {neutralTheme} from '@astryxdesign/theme-neutral';

<Theme theme={neutralTheme} />
```

### Built

```tsx
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import '@astryxdesign/theme-neutral/theme.css';

<Theme theme={neutralTheme} />
```

## Light/Dark Mode

Control via the `mode` prop on `Theme`:

```tsx
const [mode, setMode] = useState<'light' | 'dark' | 'system'>('system');

<Theme theme={neutralTheme} mode={mode}>
  <App />
</Theme>
```

Color tokens use `light-dark()` CSS function. Switching mode updates all tokens automatically.

## Nesting

Themes can be nested. Inner themes override outer themes for their subtree:

```tsx
<Theme theme={neutralTheme} mode="dark">
  <App />
  <Theme theme={gothicTheme}>
    <AtmosphericSection />
  </Theme>
</Theme>
```

## Token Utilities

### useTheme

Access the active theme's tokens in components:

```tsx
import {useTheme} from '@astryxdesign/core';

function MyComponent() {
  const theme = useTheme();
  // theme.tokens, theme.name, etc.
}
```

### useThemeMode

Read or change the current color mode:

```tsx
import {useThemeMode} from '@astryxdesign/core';

function ThemeToggle() {
  const {mode, setMode} = useThemeMode();
  return (
    <Switch
      label="Dark mode"
      value={mode === 'dark'}
      onChange={(v) => setMode(v ? 'dark' : 'light')}
    />
  );
}
```

## Building Themes for Production

Use the CLI to compile theme source to CSS:

```bash
astryx theme build ./src/themes/ocean.ts
```

Outputs a CSS file with all token values and component overrides pre-compiled. Import the CSS file and the built theme object for fully SSR-safe theming.

## Accent Override Caveat

Overriding `--color-accent` in `tokens` re-points accent-related tokens but does NOT update `--color-on-accent`. Use the `color.accent` scale config with a `[light, dark]` tuple instead:

```tsx
// Wrong: --color-on-accent stays at stale white
const bad = defineTheme({
  name: 'bad',
  tokens: { '--color-accent': '#7B61FF' },
});

// Right: --color-on-accent is derived correctly
const good = defineTheme({
  name: 'good',
  color: { accent: ['#7B61FF', '#9B85FF'] },
});
```

## Font Loading

Astryx never loads font files. `defineTheme` only sets `font-family`. Loading webfonts is the app's job:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
```
