# Migration Reference

## Overview

Treat migration as a product-shell and workflow migration, not a global class replacement. Start by putting the app inside Theme and AppShell, then move one route or surface at a time to design system primitives while keeping existing data, routing, and business logic intact.

Tailwind can coexist during migration. Use it for legacy wrappers and local layout while replacing interactive controls, navigation, command surfaces, forms, alerts, dialogs, and settings UI with components.

## Recommended Order

1. Install the design system and run `init` so the project has package scripts, theme CSS, and agent docs.
2. Wrap the app root with Theme and choose the initial light, dark, or system mode behavior.
3. Make Tailwind and design system CSS layer order explicit before replacing components.
4. Render the foundation smoke test page and confirm primitives keep their padding before migrating any surface.
5. Move the persistent frame first: AppShell, TopNav, SideNav, page content, and mobile navigation.
6. Replace shared primitives: Button, IconButton, TextInput, NumberInput, Switch, CheckboxInput, RadioList, Selector, Tabs, Dialog, AlertDialog, Banner, Toast, Badge, Card, Table, and ListItem.
7. Replace global workflows: command palette, settings popover, theme toggle, search, filters, create flows, and destructive confirmation dialogs.
8. Remove legacy Tailwind classes from each completed surface, keeping only token-backed layout utilities or local wrappers that still need to be migrated.
9. Verify both light and dark modes, keyboard navigation, responsive layout, and empty/error/loading states before moving to the next route.

## CLI Workflow

Use the CLI as the migration checklist. Read the docs for the pattern you are about to touch, inspect a matching template skeleton, then read the exact component docs before editing.

```bash
astryx docs migration
astryx docs theme
astryx docs styling
astryx template --list --type block
astryx template AppShellTopNavWithSideNav --skeleton
astryx template PopoverSettingsPanel --skeleton
astryx component AppShell
astryx component SideNav
astryx component TopNav
astryx component CommandPalette
astryx component Button
astryx component TextInput
```

Use `--dense` when pasting output into an AI coding tool, and `--json` when building automated migration reports.

## Theme and CSS Setup

Mount Theme at the app root so every migrated component reads the same token set. Keep the mode in application state if users can switch between light and dark themes.

```tsx
import {Theme} from '@astryxdesign/core';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {useState} from 'react';
import '@astryxdesign/theme-neutral/theme.css';

export function AppRoot({children}: {children: React.ReactNode}) {
  const [mode, setMode] = useState<'system' | 'light' | 'dark'>('system');

  return (
    <Theme theme={neutralTheme} mode={mode}>
      <SettingsContext.Provider value={{mode, setMode}}>
        {children}
      </SettingsContext.Provider>
    </Theme>
  );
}
```

## Cascade Layer Safety

When Tailwind remains in the app, declare layer order once in the global CSS file. Design system reset and theme CSS should load before Tailwind utilities so migrated components keep design system defaults while legacy utility classes still work.

### Tailwind v4

```css
@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;

@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "@astryxdesign/core/reset.css";
@import "@astryxdesign/core/astryx.css";
@import "@astryxdesign/theme-neutral/theme.css";
@import "@astryxdesign/core/tailwind-theme.css";
@import "tailwindcss/utilities.css" layer(utilities);
```

### Tailwind v3

```css
@layer reset, tw-preflight, astryx-base, astryx-theme;

@import "@astryxdesign/core/reset.css";
@import "@astryxdesign/core/astryx.css";
@import "@astryxdesign/theme-neutral/theme.css";

@layer tw-preflight {
  @tailwind base;
}
@tailwind components;
@tailwind utilities;
```

### Layer Audit Checklist

- Declare the canonical `@layer` order once, before any `@import`.
- Audit every pre-existing global or reset stylesheet and assign each one to a layer deliberately.
- Remove or demote the app legacy reset. The design system ships its own `:where()` reset in the lowest layer.
- Layer Tailwind preflight. On v4, import `preflight.css` with `layer(base)`. On v3, wrap `@tailwind base` in a named layer.
- Set `moduleResolution` to `bundler` or `node16` and newer so subpath imports resolve.
- Theme with `defineTheme` and the accent family API instead of hand-writing individual color tokens.
- Run the foundation smoke test and view components in both light and dark mode before migrating any route.

## Foundation Smoke Test

A broken layer order fails silently and identically on every page. Render one throwaway page with a few primitives as the first migration step.

```tsx
import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Table} from '@astryxdesign/core/Table';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VStack} from '@astryxdesign/core/VStack';

export default function FoundationCheck() {
  const [email, setEmail] = useState('');

  return (
    <div data-foundation-check>
      <VStack gap={4}>
        <Button label="Primary action" variant="primary" />
        <TextInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
        />
        <Card>One card with default padding</Card>
        <Table
          data={[{name: 'Foundation', status: 'ok'}]}
          columns={[
            {key: 'name', header: 'Name'},
            {key: 'status', header: 'Status'},
          ]}
        />
      </VStack>
    </div>
  );
}
```

If the button renders with visible padding, a filled primary background, and the input and card have borders and internal spacing, the foundation is sound.

## Move the App Frame First

| Legacy surface | Component | Notes |
| --- | --- | --- |
| Header | TopNav | Product identity, global actions, account entry, command/search trigger |
| Sidebar | SideNav | Sections and nested nav items for route groups |
| Main page wrapper | AppShell + Layout | Shell owns persistent structure; route components own page content |
| Mobile drawer nav | MobileNav or AppShell mobile behavior | Verify focus, close behavior, route changes |
| Settings menu | Popover + Layout + Switch | Home for theme mode and app preferences |

## Map shadcn and Radix Primitives

Do not wrap old shadcn components in design system styles. Replace the primitive with the component that owns the behavior.

| Existing primitive | Component | Migration note |
| --- | --- | --- |
| button / shadcn Button | Button or IconButton | Button for labeled commands, IconButton for icon-only toolbar actions |
| input | TextInput | Keep validation state in status props |
| textarea | TextArea | Use when multiline editing is the primary action |
| switch | Switch | For persisted boolean settings, including theme mode |
| checkbox | CheckboxInput or CheckboxList | Use list variants for grouped selection |
| radio group | RadioList | When one option must be selected from a visible set |
| select / combobox | Selector or Typeahead | Selector for bounded options, Typeahead for searchable async |
| tabs used as page nav | TabList | Use route state or current page state as source of truth |
| command dialog | CommandPalette | Keep app-specific search sources outside the shell |
| dropdown action menu | DropdownMenu or MoreMenu | MoreMenu for compact overflow actions |
| alert / callout | Banner or Toast | Banner for page/section messages, Toast for transient feedback |
| dialog | Dialog or AlertDialog | AlertDialog for destructive confirmation, Dialog for task flows |
| card-like list row | ListItem | Prefer ListItem for selectable rows |

## Command Palette, Settings, and Theme

Move global search to CommandPalette once the shell exists. Treat the palette as a view over app commands: routes, contextual actions, create actions, filters, recent items, and entity results.

Put light and dark mode controls in the settings popover or account menu. The switch or selector should update the mode passed to Theme, not toggle isolated body classes.

```tsx
function ThemeModeSwitch() {
  const {mode, setMode} = useSettings();
  const isDark = mode === 'dark';

  return (
    <Switch
      label="Dark mode"
      description="Use the dark color theme"
      value={isDark}
      onChange={next => setMode(next ? 'dark' : 'light')}
    />
  );
}
```

## Verification Checklist

- Run the app in light and dark mode. Check surfaces, borders, text, icons, hover states, focus rings, and status colors.
- Open the command palette from the shell. Type into it, select items by keyboard, confirm focus returns to the trigger.
- Check the SideNav at collapsed, expanded, active, hover, nested, and mobile states.
- Verify settings popovers and dialogs in jsdom and in a real browser.
- Search for leftover hardcoded Tailwind colors, arbitrary hex values, and one-off hover colors after each route migration.
- Run component tests, build, and at least one browser screenshot pass for each migrated route.

## AI Migration Prompt

When using an AI coding agent, give it an explicit migration loop instead of asking for a full-app rewrite.

```text
We are migrating this existing Tailwind/shadcn app to Astryx incrementally.

First run:
- astryx docs migration --dense
- astryx docs theme --dense
- astryx docs styling --dense
- astryx template AppShellTopNavWithSideNav --skeleton

Then migrate one route or shell surface at a time. Keep business logic and routing intact. Replace shadcn/Radix/Tailwind primitives with Astryx components, remove hardcoded colors, verify light and dark mode, and take screenshots before moving to the next surface.
```
