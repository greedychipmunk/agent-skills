# The herdr-plugin.toml contract

Verified against the Herdr 0.9.5 manifest loader
(`src/app/api/plugins/manifest.rs` at tag `v0.9.5`) and live `herdr plugin`
behavior. The installed binary remains the authority: preflight offline, then
confirm with `herdr plugin link`.

## Top-level fields

| Field | Required | Rules |
| --- | --- | --- |
| `id` | yes | Trimmed, non-empty, max 120 chars, ASCII letters/digits/`:`/`.`/`_`/`-` only |
| `name` | yes | Trimmed, non-empty |
| `version` | yes | Trimmed, non-empty |
| `min_herdr_version` | yes | Semver; parsed and compared against the running Herdr version |
| `description` | no | Trimmed; empty or whitespace-only values are dropped |
| `platforms` | no | List of `"linux"`, `"macos"`, `"windows"`; never an empty array |
| `build`, `startup`, `actions`, `events`, `panes`, `link_handlers` | no | Arrays of tables, each with its own rules below |

Missing `id`, `name`, or `version` fails TOML deserialization
(`plugin_manifest_parse_failed`). A missing `min_herdr_version` parses but is
rejected by validation (`invalid_plugin_min_herdr_version`), and a value newer
than the installed binary is rejected with `plugin_requires_newer_herdr`.

Unknown top-level fields are **silently ignored** — the loader has no
deny-unknown-fields behavior. A `[[keys.command]]` block in the manifest does
nothing on 0.9.5; keybindings belong to the user's config.toml
(see [panes-and-ui.md](panes-and-ui.md)).

## Identifier rules

- **Plugin `id`**: ASCII letters, digits, `:`, `.`, `_`, `-`; ≤120 chars;
  trimmed before validation. Qualified action ids are `<plugin-id>.<action-id>`.
- **Local ids** (actions, panes, link handlers, and link-handler `action`
  references): ASCII letters, digits, `:`, `_`, `-`; ≤120 chars; **no dots**.
  Each id type must be unique within the plugin.
- Unicode anywhere in an id is invalid. Surrounding whitespace is trimmed.

## Platforms

- Valid values are exactly `"linux"`, `"macos"`, `"windows"`. Anything else:
  `invalid_plugin_platform`.
- An empty array is an error (`invalid_plugin_platform`): omit the field to
  leave platforms undeclared.
- Omitting top-level `platforms` links with a warning: "manifest does not
  declare platforms; platform support unknown".
- Item-level `platforms` (on build/startup/actions/events/panes/link
  handlers) override the top-level list for that item.
- At runtime, an item whose effective platform list excludes the host fails
  with `platform_unsupported`.

## Commands

Every `command` is an argv array of strings. It must be non-empty and contain
no empty-string arguments (`invalid_plugin_command`). Herdr spawns argv
directly — no shell, so no expansion, pipes, or redirects. On Windows, build,
action, and event commands resolve common `PATHEXT` shims such as `npm.cmd`;
pane commands must be valid Windows argv.

## Sections

### `[[build]]`
Run only by GitHub `plugin install`, after confirmation and before
registration; a failure aborts install. `plugin link` never runs builds.
Builds receive no runtime plugin context or socket env. Optional `platforms`.

### `[[startup]]`
One-shot initialization per enabled plugin: runs after session restore and
API-socket readiness, asynchronously; failure does not stop the server. Runs
again when a new server takes over during live handoff, but not on client
attach, config reload, or plugin link/enable. Receives the runtime env plus
`HERDR_PLUGIN_EVENT=startup`. Restore state and exit; these are not
supervised daemons.

### `[[actions]]`
Required: `id` (local charset), `title` (non-empty), `command`. Optional:
`description`, `contexts`, `platforms`. `contexts` accepts `global`,
`workspace`, `tab`, `pane`, `selection`; an unknown value fails manifest
parsing. Actions are sorted by id after validation.

### `[[events]]`
Required: `on` (non-empty), `command`. Optional: `platforms`. The 22 known
event names (anything else produces a warning, not an error):

`workspace.created`, `workspace.updated`, `workspace.closed`,
`workspace.renamed`, `workspace.moved`, `workspace.reordered`,
`workspace.focused`, `worktree.created`, `worktree.opened`,
`worktree.removed`, `tab.created`, `tab.closed`, `tab.renamed`,
`tab.moved`, `tab.focused`, `pane.created`, `pane.closed`,
`pane.focused`, `pane.moved`, `pane.exited`, `pane.agent_detected`,
`pane.agent_status_changed`.

High-volume events (`pane.updated`, `pane.output_changed`,
`workspace.metadata_updated`, `layout.updated`) are deliberately excluded
from plugin hooks on 0.9.5. Event hooks receive `HERDR_PLUGIN_EVENT_JSON`.

### `[[panes]]`
Required: `id` (local charset), `title`, `command`. Optional: `description`,
`platforms`, `placement`, `width`, `height`. `placement` is `overlay`
(default), `popup`, `split`, `tab`, or `zoomed`; an unknown value fails
parsing. `width`/`height` are only valid with `placement = "popup"` —
otherwise `invalid_plugin_pane_size`. Popup sizes are integer cells (u16) or
percentage strings like `"80%"` (1–100); other string values fail parsing.
Pane commands receive `HERDR_PLUGIN_ENTRYPOINT_ID`.

### `[[link_handlers]]`
Required: `id` (local charset), `title`, `pattern`, `action`. Optional:
`platforms`. `pattern` is a Rust regular expression compiled during manifest
validation (`invalid_plugin_link_handler_pattern`). `action` must use the
local id charset and reference an action declared in the same manifest
(`invalid_plugin_link_handler_action`). Handlers are checked in manifest
order. See [panes-and-ui.md](panes-and-ui.md) for click semantics.

## Validation error codes

| Code | Trigger |
| --- | --- |
| `plugin_manifest_not_found` | Manifest path does not exist |
| `invalid_plugin_manifest_path` | Manifest has no parent directory |
| `plugin_manifest_read_failed` | Manifest unreadable |
| `plugin_manifest_parse_failed` | TOML or deserialization failure (missing required field, wrong type, unknown context/placement/size value) |
| `invalid_plugin_id` | Plugin id charset/length/empty |
| `invalid_plugin_name` / `invalid_plugin_version` | Empty after trim |
| `invalid_plugin_min_herdr_version` | Missing, empty, or not semver |
| `plugin_requires_newer_herdr` | `min_herdr_version` above installed version |
| `invalid_plugin_platform` | Unknown platform value or empty array |
| `invalid_plugin_command` | Empty argv or empty-string argument |
| `invalid_plugin_action_id` / `invalid_plugin_pane_id` / `invalid_plugin_link_handler_id` | Local id charset/length/empty |
| `invalid_plugin_action_title` / `invalid_plugin_pane_title` / `invalid_plugin_link_handler_title` | Empty title |
| `invalid_plugin_pane_size` | width/height on a non-popup pane |
| `invalid_plugin_link_handler_pattern` | Empty or non-compiling regex |
| `invalid_plugin_link_handler_action` | Action reference invalid or undeclared |
| `duplicate_plugin_action_id` / `duplicate_plugin_pane_id` / `duplicate_plugin_link_handler_id` | Repeated local id |
| `invalid_plugin_event` | Empty event name |
| `platform_unsupported` | Runtime: item excludes the host platform |
| `invalid_plugin_source` | GitHub source/managed-path mismatch |

Warnings (link still succeeds): missing top-level `platforms`; unknown
`[[events]]` name.

## Post-validation normalization

Actions and panes are sorted by id; events by `on` then command. Values are
trimmed. Empty optional strings become absent. Do not rely on manifest
ordering for execution semantics; use explicit ids.
