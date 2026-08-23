# CLI Reference

## Setup

Add to `package.json` for reliable invocation:

```json
{
  "scripts": {
    "astryx": "node node_modules/@astryxdesign/cli/clients/cli/bin/astryx.mjs"
  }
}
```

For first-run or one-off use: `npx @astryxdesign/cli`.

## Commands

### component

List all components or get full docs for one.

```bash
astryx component              # list all components
astryx component Button       # full docs for Button
astryx component Button --json # typed JSON envelope
astryx component Button --dense # token-efficient for AI
```

### docs

List all doc topics or get full content for one.

```bash
astryx docs               # list all topics
astryx docs tokens        # token reference
astryx docs theme --dense # token-efficient for AI
```

### template

List available page templates or emit full source.

```bash
astryx template --list          # list all templates
astryx template --list --type block  # filter by type
astryx template dashboard        # full page source
astryx template AppShellTopNavWithSideNav --skeleton  # structure only
```

### theme

Manage bundled themes and build custom ones.

```bash
astryx theme list                    # list bundled themes
astryx theme add stone               # copy stone theme as editable source
astryx theme build ./src/themes/ocean.ts  # compile for production
```

### search

Search across components, hooks, docs, and templates.

```bash
astryx search button     # everything matching "button"
astryx search "data table" --json
```

### init

Initialize a project with design system setup.

```bash
astryx init                       # interactive setup
astryx init --features agents     # generate AI agent docs (AGENTS.md)
astryx init --features agents --json  # non-interactive
```

### doctor

Diagnose setup issues.

```bash
astryx doctor              # check installation, config, StyleX setup
astryx doctor --json       # structured output
```

### swizzle

Copy internal component source for customization.

```bash
astryx swizzle Button      # copy Button source to your project
astryx swizzle Button --list  # see what's available
```

### upgrade

Check for and apply design system updates.

```bash
astryx upgrade             # check for updates
astryx upgrade --apply     # apply updates
```

### build

Build theme CSS for production.

```bash
astryx build theme ./src/themes/ocean.ts
astryx build tokens --json
```

### layout

Generate layout scaffolds.

```bash
astryx layout AppShellWithSideNav
astryx layout TwoPaneEditor
```

### hook

Generate custom hooks.

```bash
astryx hook --list         # list available hooks
astryx hook useMediaQuery  # generate hook source
```

### discover

Discover available components, hooks, and utilities.

```bash
astryx discover            # everything available
astryx discover --json     # structured output
```

### blog

Generate blog content templates.

```bash
astryx blog --list
astryx blog post --template announcement
```

### validate-integration

Validate that your project's Astryx integration is correct.

```bash
astryx validate-integration
astryx validate-integration --json
```

## Global Flags

| Flag | Description |
| --- | --- |
| `--json` | Output as typed JSON envelope |
| `--dense` | Token-efficient output for AI tools |
| `--detail <level>` | Output detail: `brief`, `compact`, `full` |
| `--help` | Show help for any command |
| `--version` | Show CLI version |

## JSON API

Every command supports `--json` for structured output. The JSON envelope:

```typescript
interface CLIResponse<T> {
  command: string;
  data: T;
  meta: {
    version: string;
    duration: number;
    dense?: boolean;
  };
}
```

Example:

```bash
astryx component Button --json | jq '.data.props'
```

## Programmatic API

Import the CLI as a module for build scripts and tooling:

```typescript
import {createCLI} from '@astryxdesign/cli';

const cli = createCLI();

// Run a command
const result = await cli.run('component', 'Button', '--json');
console.log(result.data);

// Search
const results = await cli.run('search', 'button', '--json');
```

## Configuration

### astryx.config.json

Project-level configuration:

```json
{
  "theme": "neutral",
  "stylex": {
    "dev": false,
    "runtimeInjection": false
  },
  "tailwind": {
    "enabled": true,
    "configPath": "./tailwind.config.ts"
  },
  "components": {
    "dir": "./src/components",
    "swizzleDir": "./src/components/astryx"
  }
}
```

## Integrations

### Next.js

```js
// next.config.js
const stylex = require('@stylexjs/nextjs-plugin');

module.exports = stylex({
  // StyleX config
})({
  // Next.js config
});
```

### Vite

```js
// vite.config.js
import {stylexTypes} from '@stylexjs/vite-plugin';
import stylexPlugin from '@stylexjs/babel-plugin';

export default {
  plugins: [stylexTypes()],
  esbuild: {
    babel: { plugins: [stylexPlugin] },
  },
};
```

### Storybook

```bash
astryx init --features storybook
```

Generates Storybook configuration with Astryx theme provider and dark mode toggle.

## Capability Manifest

The CLI exposes a capability manifest for tooling:

```bash
astryx --json --detail brief
```

Returns a structured list of all commands, their arguments, and available flags. Use this to build automated tooling around the CLI.
