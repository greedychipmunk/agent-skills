---
name: astryx
description: >-
  Generate Astryx design system components, themes, and layouts for React 19
  applications. Use when building UIs with @astryxdesign/core, creating or
  extending themes with defineTheme, styling components with StyleX or
  Tailwind, scaffolding pages from templates, migrating from shadcn or Radix,
  or working with the Astryx CLI and MCP server. Also use when converting
  plain descriptions into Astryx component code or validating existing Astryx
  code against system conventions.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Astryx

A React 19 design system by Meta. Accessible, themeable components with built-in spacing, dark mode, and StyleX styling. This skill covers installation, theming, styling, layout, CLI usage, AI integration, and migration.

## When to Use

- Building React UIs with Astryx components from @astryxdesign/core
- Creating or customizing themes with defineTheme
- Styling components via StyleX (xstyle prop), Tailwind, or className
- Scaffolding pages from CLI templates
- Migrating existing Tailwind/shadcn/Radix apps to Astryx
- Using the Astryx CLI for component docs, tokens, and templates
- Connecting to the Astryx MCP server for AI-powered component discovery
- Validating Astryx code against system conventions

## Packages at a Glance

| Package | Purpose |
| --- | --- |
| `@astryxdesign/core` | Component library (React 19, StyleX, dark mode) |
| `@stylexjs/stylex` | Atomic CSS-in-JS (peer dependency) |
| `@astryxdesign/cli` | CLI: component docs, templates, themes, codemods |
| `@astryxdesign/theme-neutral` | Muted minimal theme (good starting point) |
| `@astryxdesign/theme-butter` | Golden buttery surfaces, blue accents |
| `@astryxdesign/theme-chocolate` | Warm brown tones, cozy beige |
| `@astryxdesign/theme-gothic` | Dark-only atmospheric theme |
| `@astryxdesign/theme-matcha` | Earthy green theme |
| `@astryxdesign/theme-stone` | Warm stone and slate tones |
| `@astryxdesign/theme-y2k` | Playful Y2K pop, periwinkle + holographic |

## Quick Start

Install core, StyleX, a theme, and the CLI:

```bash
npm install @astryxdesign/core @stylexjs/stylex @astryxdesign/theme-neutral @astryxdesign/cli
```

Add theme CSS to your global stylesheet:

```css
@import '@astryxdesign/core/reset.css';
@import '@astryxdesign/core/astryx.css';
@import '@astryxdesign/theme-neutral/theme.css';
```

Wrap your app in Theme and add a component:

```tsx
import {Theme} from '@astryxdesign/core';
import {neutralTheme} from '@astryxdesign/theme-neutral';
import {Button} from '@astryxdesign/core/Button';
import {VStack} from '@astryxdesign/core/Layout';

function App() {
  return (
    <Theme theme={neutralTheme}>
      <VStack gap={2}>
        <Button label="Hello Astryx" onClick={() => alert('Hi!')} />
      </VStack>
    </Theme>
  );
}
```

Initialize AI agent docs (non-interactive, safe for CI):

```bash
npx @astryxdesign/cli init --features agents
```

## Design Principles

1. **Components over primitives** — use components before raw HTML
2. **Frame-first layout** — pick shell and budget regions before content
3. **Dense data as rows** — Table/List with dividers; Card for widgets and settings
4. **StyleX or Tailwind** — both first-class; both resolve to same tokens
5. **Semantic tokens, not hardcoded values** — `var(--color-*)`, not hex
6. **CSS custom properties for colors** — not hex values
7. **Controlled form inputs** — `value` + `onChange`
8. **useLinkComponent()** for navigation — framework router via LinkProvider

### Anti-Patterns

- No `style={{}}` on raw wrappers — use `xstyle` on components
- No hardcoded colors (`#fff`) — use `var(--color-*)` or Tailwind semantic classes
- No hardcoded spacing (`16px`) — use spacing tokens or Tailwind utilities
- No wrapping components in `<div>` just for margin — use `xstyle`
- No Badge as decoration — reserve for counts and enumerated states
- No inventing props — read component docs first

## Token System

Tokens are CSS custom properties that adapt to the active theme and color mode.

### Spacing

4px base unit. Component `gap` props accept step values 0–12.

| Step | Value | Step | Value |
| --- | --- | --- | --- |
| 0 | 0px | 1 | 4px |
| 0.5 | 2px | 2 | 8px |
| 1.5 | 6px | 3 | 12px |
| 4 | 16px | 8 | 32px |
| 6 | 24px | 12 | 48px |

### Color

Semantic tokens describe purpose, not appearance. All use `light-dark()` for automatic mode switching.

Surface hierarchy: `body` → `surface` → `card` → `popover`.

Key tokens: `--color-text-primary`, `--color-text-secondary`, `--color-background-surface`, `--color-background-body`, `--color-background-card`, `--color-background-popover`, `--color-border`, `--color-accent`, `--color-on-accent`, `--color-success`, `--color-error`, `--color-warning`.

### Size

Control heights: `--size-element-sm` (28px), `--size-element-md` (32px), `--size-element-lg` (36px).

### Radius

`--radius-none` (0px), `--radius-inner` (8px), `--radius-element` (12px), `--radius-container` (16px), `--radius-page` (32px), `--radius-chat` (28px), `--radius-full` (9999px).

### Typography

Geometric type scale: `round(14 × 1.2^step)`. Semantic tokens combine size, weight, line-height. Use `Heading` and `Text` components — don't set font-size manually.

Font families: `--font-family-body` (Figtree), `--font-family-code` ("SF Mono"), `--font-family-heading` (Figtree).

### Using Tokens

```tsx
import * as stylex from '@stylexjs/stylex';
import {colorVars, spacingVars, radiusVars} from '@astryxdesign/core';

const styles = stylex.create({
  card: {
    padding: spacingVars['--spacing-4'],
    backgroundColor: colorVars['--color-background-surface'],
    borderRadius: radiusVars['--radius-container'],
  },
});
```

See `references/tokens.md` for the complete token reference.

## Styling

| Approach | Use For |
| --- | --- |
| StyleX (`xstyle` prop) | Component-specific overrides, reusable styles, pseudo-classes |
| Tailwind utilities | Page layout, wrappers, utility styling |
| `className` | Integrating with external CSS or Tailwind on components |
| Token aliases | Keeping Panda, Chakra, MUI, etc. in sync with system |

All approaches resolve to the same design tokens — theming and dark mode work regardless of choice.

### xstyle

```tsx
import * as stylex from '@stylexjs/stylex';

const overrides = stylex.create({
  save: { alignSelf: 'flex-end', marginTop: 16 },
});

<Button label="Save" xstyle={overrides.save} />
```

All `xstyle` values must come from `stylex.create()`. All `:hover` styles must use `@media (hover: hover)` guard.

### Tailwind Bridge

Import `@astryxdesign/core/tailwind-theme.css` once. Utilities like `text-primary`, `bg-surface`, `border-border`, `rounded-lg`, `shadow-md` resolve to active theme tokens. Pure CSS, zero JS.

See `references/styling.md` for full styling guide and `references/styling-libraries.md` for library interop.

## Layout

Build outside-in: scaffold the shell, structure content, tune spacing, then adapt across widths.

### Shell

- **AppShell** — for nav apps (with SideNav and/or TopNav)
- **Layout + LayoutPanel** — for multi-pane tools
- **Plain content column** — for documents and forms

```tsx
<AppShell sideNav={<SideNav>{/* nav items */}</SideNav>}>
  <Layout
    content={<LayoutContent>{/* table fills region */}</LayoutContent>}
    end={<LayoutPanel width={380} hasDivider>{/* detail */}</LayoutPanel>}
  />
</AppShell>
```

### Navigation

Default to **SideNav** — it absorbs unplanned destinations. Use **TopNav** for shallow nav that must stay visible. Use both for genuine suites.

### Structure

One lead per region. Rank with weight and color, not size. Reach for the weakest container that reads as a group: spacing → Divider → Section → Card.

### Spacing

Container owns padding and child gaps. One content line per region. Contrast tight and generous gaps so grouping reads without borders.

### Breakpoints

Lock what each region does as width changes: divide, reveal, resize, swap. Side panel becomes Dialog/BottomSheet via `useMediaQuery`. Nav becomes MobileNav at AppShell `mobileNav` breakpoint.

See `references/layout.md` for the full layout guide.

## Theme System

### Setup

```tsx
import {Theme} from '@astryxdesign/core';
import {neutralTheme} from '@astryxdesign/theme-neutral';

<Theme theme={neutralTheme} mode="system">
  <YourApp />
</Theme>
```

### defineTheme

```tsx
import {defineTheme} from '@astryxdesign/core/theme';

const myTheme = defineTheme({
  name: 'my-theme',
  color: { accent: ['#7B61FF', '#9B85FF'], neutralStyle: 'cool' },
  typography: { scale: { base: 14, ratio: 1.2 } },
  radius: { base: 4, multiplier: 1 },
  tokens: {
    '--color-background-body': ['#FFFFFF', '#0A0A0A'],
  },
  components: {
    button: { 'variant:primary': { color: 'white' } },
  },
});
```

### Runtime vs Built

| | Runtime (source) | Built |
| --- | --- | --- |
| Import | `@astryxdesign/theme-{name}` | `@astryxdesign/theme-{name}/built` + `theme.css` |
| SSR | Tokens yes, overrides flash | Fully SSR safe |
| Best for | Dev, prototyping | Production, SSR apps |

### Extending

```tsx
const brandTheme = defineTheme({
  name: 'brand',
  extends: neutralTheme,
  tokens: { '--color-accent': ['#7B61FF', '#9B85FF'] },
});
```

See `references/theme.md` for defineTheme, component overrides, custom variants, nesting, and token utilities.

## CLI

Add to `package.json` for reliable invocation:

```json
"scripts": {
  "astryx": "node node_modules/@astryxdesign/cli/clients/cli/bin/astryx.mjs"
}
```

### Key Commands

```bash
astryx component          # list all components
astryx component Button   # full docs for Button
astryx docs               # list all doc topics
astryx docs tokens        # token reference
astryx template --list    # available page templates
astryx template dashboard # emit full page source
astryx search button       # search across components, hooks, docs, templates
astryx theme list          # list bundled themes
astryx theme add stone     # copy a theme as editable source
astryx theme build ./src/themes/ocean.ts  # compile for production
astryx doctor              # diagnose setup issues
astryx init --features agents  # generate AI agent docs
```

Every command supports `--json` (typed envelope), `--dense` (token-efficient for AI), and `--detail` (brief/compact/full).

See `references/cli.md` for all commands, JSON API, programmatic API, and integrations.

## Working with AI

### Agent Docs

```bash
npx @astryxdesign/cli init --features agents
```

Generates `AGENTS.md` with component index, behavioral rules, and CLI reference. Run again after version bumps.

### MCP Server

Astryx ships an MCP server for AI tools to query the design system directly:

```json
{
  "mcpServers": {
    "xds": {
      "type": "url",
      "url": "https://astryx.atmeta.com/mcp"
    }
  }
}
```

Tools exposed: `search(query)` for discovering components/docs/templates, `get(name)` for full documentation with props and examples.

### AI Workflow

1. `astryx template --list` — find a related page pattern
2. `astryx template --skeleton` — study the layout structure
3. `astryx component <Name>` — read props and examples for every component used

See `references/working-with-ai.md` for full AI integration guide.

## Migration

Migrate incrementally: Theme + AppShell first, then one route at a time.

1. Install design system, run `init`
2. Wrap app root with Theme
3. Declare CSS layer order explicitly
4. Run foundation smoke test
5. Move app frame (AppShell, TopNav, SideNav)
6. Replace shared primitives (Button, TextInput, Dialog, etc.)
7. Replace global workflows (command palette, settings, theme toggle)
8. Remove legacy Tailwind classes from completed surfaces
9. Verify light/dark mode, keyboard nav, responsive layout

See `references/migration.md` for the full migration guide.

## Common Gotchas

- **React 19 required.** `@astryxdesign/core` has `react` and `react-dom` >= 19.0.0 as peer deps.
- **Cascade layer order matters.** Unlayered styles and later layers both override `astryx-base` regardless of specificity. Declare layer order explicitly.
- **`bare astryx` doesn't resolve until installed.** Use `npx @astryxdesign/cli` for first-run/one-off.
- **Swizzled components need StyleX compiler.** Missing compiler = unstyled components, no error. Use SWC-based transform for Next.js App Router.
- **Accent override caveat.** Overriding `--color-accent` in tokens re-points related tokens but NOT `--color-on-accent`. Pass a `[light, dark]` tuple to `color.accent` instead.
- **Astryx never loads font files.** `defineTheme` only sets `font-family`. Loading webfonts is the app's job.
- **Don't use `--color-on-accent` on non-accent backgrounds.** It's specifically for accent surfaces.
- **Use `data-variant` attributes for external CSS.** Not bare prop/state classes (`.primary`, `.sm` are deprecated).

## Validation

The bundled `scripts/validate.py` checks Astryx code for common mistakes:

```bash
uv run scripts/validate.py --input component.tsx
```

Or pipe via stdin:

```bash
cat component.tsx | uv run scripts/validate.py --stdin
```

Checks: hardcoded hex colors, raw pixel spacing, `style={{}}` on raw elements, missing Theme provider, bare `<div>` wrappers for layout, and deprecated class selectors.

## Detailed References

- `references/principles.md` — Design philosophy, rules, anti-patterns
- `references/tokens.md` — Complete token reference (color, spacing, size, radius, shadow, motion, typography)
- `references/styling.md` — xstyle prop, Tailwind bridge, className, compound components, data attributes, StyleX build setup
- `references/styling-libraries.md` — Interop with Tailwind, StyleX, Panda, Chakra, MUI, Emotion, UnoCSS, CSS Modules, non-CSS
- `references/layout.md` — Shell, navigation, structure, spacing, density, breakpoints
- `references/theme.md` — defineTheme, extending, component overrides, custom variants, runtime vs built, nesting, token utilities, useTheme
- `references/cli.md` — All commands, JSON API, programmatic API, doctor, integrations, configuration
- `references/migration.md` — Migration order, CLI workflow, cascade layer safety, shadcn/Radix mapping, verification checklist
- `references/working-with-ai.md` — Agent docs, MCP server, --dense flag, AI workflow, Cursor setup

## Available Scripts

- **`scripts/validate.py`** — Validates Astryx code against system conventions. Run with `uv run scripts/validate.py --input <file>` or `--stdin`.
