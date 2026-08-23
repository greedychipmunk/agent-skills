# Styling Reference

## Styling Approaches

| Approach | Use For |
| --- | --- |
| StyleX (`xstyle` prop) | Component-specific overrides, reusable styles, pseudo-classes |
| Tailwind utilities | Page layout, wrappers, utility styling |
| `className` | Integrating with external CSS or Tailwind on components |
| Styling library aliases | Keeping Panda, Chakra, MUI, etc. in sync with system |

All approaches resolve to the same design tokens — theming and dark mode work regardless of choice.

## xstyle Prop

Every component accepts an `xstyle` prop for StyleX style overrides. Values must come from `stylex.create()`.

```tsx
import * as stylex from '@stylexjs/stylex';

const overrides = stylex.create({
  save: { alignSelf: 'flex-end', marginTop: 16 },
});

<Button label="Save" xstyle={overrides.save} />
```

### Pseudo-classes

All `:hover` styles must use `@media (hover: hover)` guard for touch devices:

```tsx
const styles = stylex.create({
  button: {
    '@media (hover: hover)': {
      ':hover': { backgroundColor: colorVars['--color-accent-hover'] },
    },
  },
});
```

### Multiple Overrides

```tsx
import {create} from '@stylexjs/stylex';

const styles = create({
  primary: { backgroundColor: 'blue' },
  large: { padding: 20 },
});

<Button xstyle={[styles.primary, styles.large]} />
```

## Tailwind Bridge

Import `@astryxdesign/core/tailwind-theme.css` once in your global CSS:

```css
@import '@astryxdesign/core/reset.css';
@import '@astryxdesign/core/astryx.css';
@import '@astryxdesign/theme-neutral/theme.css';
@import '@astryxdesign/core/tailwind-theme.css';
```

Then use Tailwind utilities that resolve to system tokens:

```tsx
<div className="bg-surface text-primary border-border rounded-lg shadow-md p-4">
  Content
</div>
```

### Available Semantic Utilities

| Utility | Token |
| --- | --- |
| `bg-body` | `--color-background-body` |
| `bg-surface` | `--color-background-surface` |
| `bg-card` | `--color-background-card` |
| `bg-popover` | `--color-background-popover` |
| `text-primary` | `--color-text-primary` |
| `text-secondary` | `--color-text-secondary` |
| `text-disabled` | `--color-text-disabled` |
| `border-border` | `--color-border` |
| `border-strong` | `--color-border-strong` |
| `bg-accent` | `--color-accent` |
| `text-accent` | `--color-accent` |
| `text-on-accent` | `--color-on-accent` |
| `rounded-inner` | `--radius-inner` |
| `rounded-element` | `--radius-element` |
| `rounded-container` | `--radius-container` |
| `rounded-page` | `--radius-page` |
| `shadow-sm` | `--shadow-sm` |
| `shadow-md` | `--shadow-md` |
| `shadow-lg` | `--shadow-lg` |
| `shadow-xl` | `--shadow-xl` |

Pure CSS, zero JS. Dark mode works automatically via `light-dark()`.

## className

Use `className` for external CSS or Tailwind on components:

```tsx
<Button label="Save" className="mt-4" />
```

`className` is forwarded to the root element. It can coexist with `xstyle`.

## Compound Components

Many components are compound — they expose sub-parts:

```tsx
<Card>
  <Card.Header>
    <Heading level={3}>Title</Heading>
  </Card.Header>
  <Card.Body>
    Content
  </Card.Body>
</Card>
```

## Data Attribute Selectors

Components expose state via `data-*` attributes for external CSS targeting:

```tsx
<button data-variant="primary" data-state="hover">
  ...
</button>
```

| Attribute | Values |
| --- | --- |
| `data-variant` | `primary`, `secondary`, `ghost`, `danger` |
| `data-state` | `hover`, `active`, `focus`, `disabled` |
| `data-size` | `sm`, `md`, `lg` |

Use these in external CSS:

```css
[data-variant="primary"] {
  font-weight: 600;
}
```

## StyleX Build Setup

### Vite

```js
import stylexPlugin from '@stylexjs/babel-plugin';
import {stylexTypes} from '@stylexjs/vite-plugin';

export default {
  plugins: [
    stylexTypes(),
    react(),
  ],
  esbuild: {
    babel: {
      plugins: [stylexPlugin],
    },
  },
};
```

### Next.js (App Router)

Use SWC-based StyleX transform for App Router compatibility:

```js
// next.config.js
const stylexPlugin = require('@stylexjs/nextjs-plugin');

module.exports = stylexPlugin({
  // config
})({
  // next config
});
```

### Webpack

```js
const stylexPlugin = require('@stylexjs/babel-plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [stylexPlugin],
          },
        },
      },
    ],
  },
};
```

## What NOT to Do

- **No inline styles on raw elements.** Use `xstyle` on components.
- **No hardcoded colors.** Use `var(--color-*)` or Tailwind semantic classes.
- **No hardcoded spacing.** Use spacing tokens or Tailwind utilities.
- **No bare `<div>` wrappers for layout.** Use `xstyle` or Layout components.
- **No bare prop/state classes.** Use `data-variant`, `data-state`, `data-size` attributes.
- **No `style={{}}` on components.** Use `xstyle` with `stylex.create()`.
- **No `:hover` without `@media (hover: hover)` guard.** Touch devices will get stuck hover states.
