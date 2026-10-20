# Runtime environment and callbacks

How Herdr launches plugin commands and how plugin code talks back to Herdr.
Env injection live-verified on 0.9.5.

## Execution model

- Working directory: the plugin root (a managed checkout for GitHub installs,
  your local directory for linked plugins).
- No shell: the manifest `command` argv is spawned directly. If a plugin
  needs shell behavior, invoke a shell explicitly (`["bash", "-c", "..."]`)
  and document it.
- No timeout or supervision for action/event/startup commands. A command
  that hangs keeps its log entry in `running` state; make hooks exit.
- Windows: build, action, and event commands resolve common `PATHEXT` shims
  (`npm.cmd`, `python.exe`, ...). Pane commands must be valid Windows argv.

## Environment variables

Always present for runtime commands (actions, startup, events, panes, link
handler actions):

| Variable | Meaning |
| --- | --- |
| `HERDR_ENV` | `1` when launched by Herdr; gate on it before touching live sessions |
| `HERDR_BIN_PATH` | Absolute path to the `herdr` binary — use this for callbacks |
| `HERDR_SOCKET_PATH` | API socket path for raw JSON-RPC clients |
| `HERDR_PLUGIN_ID` | Manifest id |
| `HERDR_PLUGIN_ROOT` | Plugin directory (managed checkout; never store durable state here) |
| `HERDR_PLUGIN_CONFIG_DIR` | Per-plugin config directory Herdr creates and never validates |
| `HERDR_PLUGIN_STATE_DIR` | Per-plugin state directory Herdr creates and never validates |
| `HERDR_PLUGIN_CONTEXT_JSON` | Invocation context (see below) |
| `HERDR_WORKSPACE_ID`, `HERDR_TAB_ID`, `HERDR_PANE_ID` | Current ids when known |

Per entrypoint type:

| Type | Additional variables |
| --- | --- |
| Actions | `HERDR_PLUGIN_ACTION_ID` (local id; `HERDR_PLUGIN_EVENT` unset for actions — verified) |
| Startup and event hooks | `HERDR_PLUGIN_EVENT` (event name; `startup` for startup hooks), event hooks also get `HERDR_PLUGIN_EVENT_JSON` |
| Panes | `HERDR_PLUGIN_ENTRYPOINT_ID` (pane id from the manifest; no `HERDR_PANE_ID` for popups) |
| Link handler actions | `HERDR_PLUGIN_CLICKED_URL`, `HERDR_PLUGIN_LINK_HANDLER_ID` |

## Invocation context

`HERDR_PLUGIN_CONTEXT_JSON` is a JSON object with optional fields:
`workspace_id`, `workspace_label`, `workspace_cwd`, `worktree`, `tab_id`,
`tab_label`, `focused_pane_id`, `focused_pane_cwd`, `focused_pane_agent`,
`focused_pane_status`, `selected_text`, `invocation_source`,
`correlation_id`, `clicked_url`, `link_handler_id`. All fields are optional;
parse defensively and never assume presence. `invocation_source` values
include `cli` and `link_click`.

## Calling back into Herdr

Preferred: `HERDR_BIN_PATH <command>` — a full CLI with subcommands for
workspaces, tabs, panes, agents, and events; no socket handling required.
The CLI speaks the same protocol as the socket, so anything the CLI can do,
the CLI path can do. Print `herdr --help` or run `herdr --skill` for the
current control surface.

Raw socket: JSON-RPC over `HERDR_SOCKET_PATH`. Introspect with
`herdr api schema --json` (protocol envelope plus `request`,
`success_response`, `error_response`, `event`, `subscription_event` schemas)
and `herdr api snapshot`. Plugin-related methods on 0.9.5:
`plugin.action.invoke`, `plugin.action.list`, `plugin.disable`,
`plugin.enable`, `plugin.link`, `plugin.list`, `plugin.log.list`,
`plugin.pane.close`, `plugin.pane.focus`, `plugin.pane.open`,
`plugin.unlink`. Install/update/uninstall are CLI-side git operations, not
socket methods.

Never hardcode the socket path or binary location — both are env-provided
and machine-specific.

## State and files

- Durable state and user configuration: `HERDR_PLUGIN_CONFIG_DIR` and
  `HERDR_PLUGIN_STATE_DIR` (observed layout on macOS:
  `~/.config/herdr/plugins/config/<plugin-id>` and a sibling state
  directory). Herdr creates these at registration and never reads or
  validates their contents.
- The plugin root is replaced wholesale on `plugin update` and removed by
  installation cleanup — anything stored there is lost.
- There is no Herdr-managed storage API in plugin v1. Use ordinary files in
  the state dir.

## Logs

Every runtime command is logged: `herdr plugin log list --plugin <id>
[--limit N]` returns `log_id`, `status` (`running`, `succeeded`, `failed`),
`exit_code`, `stdout`, `stderr`, and timestamps. Logs are the primary
debugging surface — after any invoke, read the log before concluding
anything. Long-running commands appear with `status: running` until exit.

## Startup hooks

`[[startup]]` commands run once per enabled plugin after session restore and
socket readiness — not on client attach, config reload, or plugin link/enable.
They run again when a new server takes over in a live handoff. Asynchronous:
the server does not wait, and a failure does not stop the server or disable
the plugin. Use them for restoration and warm-up, not for daemons; a
detached process that outlives the command is the plugin's responsibility to
stop, and is not protected from installation cleanup.

## Event hooks

`[[events]]` commands fire on the 22 known lifecycle events
([manifest.md](manifest.md)). They receive `HERDR_PLUGIN_EVENT_JSON` with the
event payload; parse defensively. Hooks run asynchronously and out of order
under load — never assume serialized delivery. High-volume events are
excluded on 0.9.5; if a task seems to need `pane.output_changed`, use the
socket subscription API instead.
