# Styling Library Interop Reference

Astryx tokens are CSS custom properties. Any styling library can read them by mapping its own tokens to the system's CSS variables by semantic intent.

## Choose an Integration Path

| Library | Integration |
| --- | --- |
| Tailwind | First-class. Import `tailwind-theme.css`. Use `bg-surface`, `text-primary`, etc. |
| StyleX | First-class. Import `colorVars`, `spacingVars`, etc. from `@astryxdesign/core` |
| Panda CSS | Map Panda theme tokens to Astryx CSS variables in `panda.config.ts` |
| Chakra UI | Map Chakra semantic tokens to Astryx CSS variables in `createTheme` |
| MUI | Map MUI theme palette to Astryx CSS variables in `createTheme` |
| Emotion | Use Astryx CSS variables directly in `css` prop |
| styled-components | Use Astryx CSS variables in `styled` template literals |
| UnoCSS | Map UnoCSS theme to Astryx CSS variables in `uno.config.ts` |
| CSS Modules | Use Astryx CSS variables directly in `.module.css` files |
| Sass | Use Astryx CSS variables via `var()` in `.scss` files |
| Non-CSS processing | Use Astryx CSS variables via `var()` in any CSS output |

## Tailwind

Already first-class. Import `@astryxdesign/core/tailwind-theme.css` and use semantic utilities. See `references/styling.md` for the full Tailwind bridge guide.

## StyleX

Already first-class. Import token variables from `@astryxdesign/core` and use in `stylex.create()`. See `references/styling.md` for the full StyleX guide.

## Panda CSS

Map Panda theme tokens to Astryx CSS variables in `panda.config.ts`:

```ts
// panda.config.ts
import {defineConfig} from '@pandacss/dev';

export default defineConfig({
  theme: {
    tokens: {
      colors: {
        primary: { value: 'var(--color-text-primary)' },
        surface: { value: 'var(--color-background-surface)' },
        accent: { value: 'var(--color-accent)' },
      },
      spacing: {
        4: { value: 'var(--spacing-4)' },
        8: { value: 'var(--spacing-8)' },
      },
    },
  },
});
```

Then use Panda utilities that resolve to Astryx tokens:

```tsx
<div className={css({ bg: 'surface', color: 'primary', p: '4' })}>
  Content
</div>
```

## Chakra UI

Map Chakra semantic tokens to Astryx CSS variables in `createTheme`:

```ts
import {createTheme} from '@chakra-ui/react';

const theme = createTheme({
  tokens: {
    colors: {
      primary: { value: 'var(--color-text-primary)' },
      surface: { value: 'var(--color-background-surface)' },
      accent: { value: 'var(--color-accent)' },
      border: { value: 'var(--color-border)' },
    },
    spacing: {
      4: { value: 'var(--spacing-4)' },
      8: { value: 'var(--spacing-8)' },
    },
  },
});
```

## MUI

Map MUI theme palette to Astryx CSS variables in `createTheme`:

```ts
import {createTheme} from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: 'var(--color-accent)' },
    background: {
      default: 'var(--color-background-body)',
      paper: 'var(--color-background-card)',
    },
    text: {
      primary: 'var(--color-text-primary)',
      secondary: 'var(--color-text-secondary)',
    },
    divider: 'var(--color-border)',
  },
  shape: { borderRadius: 12 },
});
```

## Emotion

Use Astryx CSS variables directly in the `css` prop:

```tsx
/** @jsxImportSource @emotion/react */
<div css={{ backgroundColor: 'var(--color-background-surface)', color: 'var(--color-text-primary)' }}>
  Content
</div>
```

## styled-components

Use Astryx CSS variables in `styled` template literals:

```tsx
import styled from 'styled-components';

const Card = styled.div`
  background-color: var(--color-background-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-container);
  padding: var(--spacing-4);
`;
```

## UnoCSS

Map UnoCSS theme to Astryx CSS variables in `uno.config.ts`:

```ts
import {defineConfig} from 'unocss';

export default defineConfig({
  theme: {
    colors: {
      primary: 'var(--color-text-primary)',
      surface: 'var(--color-background-surface)',
      accent: 'var(--color-accent)',
    },
    spacing: {
      4: 'var(--spacing-4)',
      8: 'var(--spacing-8)',
    },
  },
});
```

## CSS Modules

Use Astryx CSS variables directly in `.module.css` files:

```css
/* Card.module.css */
.card {
  background-color: var(--color-background-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-container);
  padding: var(--spacing-4);
}
```

## Sass

Use Astryx CSS variables via `var()` in `.scss` files:

```scss
.card {
  background-color: var(--color-background-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-container);
  padding: var(--spacing-4);
}
```

## Non-CSS Processing

Any tool that outputs CSS can use Astryx CSS variables via `var()`. The key is mapping by semantic intent: surface backgrounds, text colors, borders, spacing, and radii all have corresponding `--color-*`, `--spacing-*`, and `--radius-*` custom properties.

## Key Principle

Map by semantic intent, not by visual match. A library's "primary" color maps to `--color-text-primary`, not to a hex value. This ensures theme switching and dark mode work automatically.
