# Working with AI Reference

## Agent Docs

Generate AI agent documentation for your project:

```bash
npx @astryxdesign/cli init --features agents
```

This generates `AGENTS.md` (and `CLAUDE.md` for Claude Code) with:

- Component index with import paths and key props
- Behavioral rules (controlled inputs, semantic tokens, xstyle)
- CLI reference for component docs, templates, and search
- Token reference summary

Run again after version bumps to keep docs in sync:

```bash
npx @astryxdesign/cli init --features agents --json
```

The `--json` flag makes the command non-interactive, safe for CI.

## MCP Server

Astryx ships an MCP server for AI tools to query the design system directly.

### Configuration

Add to your MCP client config (Claude Desktop, Cursor, etc.):

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

### Tools Exposed

| Tool | Description |
| --- | --- |
| `search(query)` | Search across components, hooks, docs, and templates. Returns matching items with summaries. |
| `get(name)` | Get full documentation for a component, hook, or doc topic. Returns props, examples, and related items. |

### Usage Examples

```
search("button")     → [{ name: "Button", type: "component", summary: "..." }, ...]
get("Button")        → { name: "Button", props: [...], examples: [...], ... }
search("data table") → [{ name: "Table", ... }, { name: "DataTable", ... }, ...]
get("tokens")        → { name: "tokens", sections: [...], ... }
```

## CLI for AI

### --dense Flag

The `--dense` flag produces token-efficient output designed for AI context windows. Use when pasting CLI output into an AI coding tool:

```bash
astryx component Button --dense
astryx docs tokens --dense
astryx template dashboard --dense
```

Dense output:
- Strips decorative whitespace
- Uses compact key-value pairs
- Omits redundant descriptions
- Preserves all essential information (props, types, examples)

### --json Flag

For programmatic use and structured output:

```bash
astryx component Button --json | jq '.data.props'
astryx search "form input" --json | jq '.data.results'
```

### --detail Flag

Control output verbosity:

| Level | Description |
| --- | --- |
| `brief` | Names and one-line summaries only |
| `compact` | Key details, no examples |
| `full` | Everything including examples and edge cases |

```bash
astryx component Button --detail brief
astryx component Button --detail full
```

## AI Workflow

When building UI with an AI coding agent:

1. **Find a template** — `astryx template --list` to find a related page pattern
2. **Study the skeleton** — `astryx template <name> --skeleton` for layout structure
3. **Read component docs** — `astryx component <Name>` for every component used
4. **Check tokens** — `astryx docs tokens --dense` for exact token values
5. **Verify** — `astryx validate-integration` to check the result

### Example Session

```bash
# Find a dashboard template
astryx template --list | grep dashboard

# Get the skeleton
astryx template dashboard --skeleton

# Read docs for components in the template
astryx component AppShell --dense
astryx component Table --dense
astryx component Card --dense
astryx component Button --dense

# Check token values for custom styling
astryx docs tokens --dense

# Validate the result
astryx validate-integration
```

## Cursor Setup

For Cursor IDE integration:

1. Run `npx @astryxdesign/cli init --features agents` to generate `AGENTS.md`
2. Add the MCP server to `.cursor/mcp.json`:

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

3. Cursor will read `AGENTS.md` automatically and use the MCP server for component lookups.

## Claude Code Setup

1. Run `npx @astryxdesign/cli init --features agents` to generate `CLAUDE.md`
2. Add the MCP server to `.claude/mcp.json`:

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

3. Claude Code will read `CLAUDE.md` automatically and use the MCP server for component lookups.

## Letta Code Setup

1. Run `npx @astryxdesign/cli init --features agents` to generate `AGENTS.md`
2. The MCP server can be connected using the `converting-mcps-to-skills` skill for Letta Code integration, or referenced directly in agent memory.
3. Place relevant Astryx documentation in agent memory or skills for persistent context.

## Common AI Patterns

### Building a New Page

```text
Prompt: "Build a settings page using Astryx components"

AI should:
1. astryx template --list → find "SettingsPage" or similar
2. astryx template SettingsPage --skeleton → study structure
3. astryx component Switch --dense → read props
4. astryx component TextInput --dense → read props
5. Write code using semantic tokens, controlled inputs, xstyle
```

### Adding a Component to Existing Page

```text
Prompt: "Add a filter dropdown to the products table"

AI should:
1. astryx search dropdown → find DropdownMenu or Selector
2. astryx component DropdownMenu --dense → read props
3. astryx component Table --dense → check how to integrate
4. Write code using controlled state, semantic tokens
```

### Custom Theme

```text
Prompt: "Create a custom theme with our brand colors"

AI should:
1. astryx docs theme --dense → read defineTheme API
2. astryx docs tokens --dense → understand token system
3. Write defineTheme with color.accent scale config (not raw token overrides)
4. astryx theme build → compile for production
```
