# Version boundary and source map

## Authority order

1. The installed binary (`herdr status`, `herdr plugin`, `herdr api schema`)
   — defines accepted syntax, validation, and runtime behavior.
2. Pinned source at the exact tag matching the installed version.
3. Official docs — accurate on mechanics, but silent on some failure modes.

This skill's contracts were verified against **Herdr 0.9.5** (client and
server, protocol 22) on macOS, including a live canary plugin linked,
invoked, logged, and unlinked. On a different installed version, re-verify
before trusting specifics: run `herdr status`, then check the docs index for
that channel (`https://herdr.dev/llms.txt`, or `llms-preview.txt` for the
preview channel) and read the pinned sources at the matching tag.

## Pinned source map (tag v0.9.5)

Read targeted symbols only; do not dump the whole repository.

| File | Authority for |
| --- | --- |
| `src/app/api/plugins/manifest.rs` | Manifest fields, id charsets, validation rules, error codes, sorting |
| `src/app/api/plugins/env.rs` | `HERDR_PLUGIN_ROOT`/`CONFIG_DIR`/`STATE_DIR` injection |
| `src/api/schema/plugins.rs` | `PluginActionContext`, `PluginPanePlacement`, `PluginInvocationContext`, `PluginPaneOpenParams` |
| `src/api/schema/events.rs` | `PLUGIN_HOOK_EVENT_KINDS` — the 22 hook event names |
| `src/popup_size.rs` | Popup width/height: u16 cells or 1–100% strings |
| `src/cli/plugin.rs` | CLI plugin command surface |
| `src/app/custom_commands.rs` | Keybinding `plugin_action` resolution (config.toml, not manifest) |
| `src/plugin_paths.rs` | Config/state directory layout |
| `tests/cli/plugins.rs`, `tests/fixtures/plugin-smoke/herdr-plugin.toml` | Expected CLI behavior and a known-good manifest |
| `docs/next/website/src/content/docs/plugins.mdx` | Official plugin docs (stable channel) |

Raw files: `https://raw.githubusercontent.com/herdrdev/herdr/v0.9.5/<path>`.
The marketplace cookbook (`ogulcancelik/herdr-plugin-examples`) is community,
not official; treat its plugins as examples to copy, not contracts.

## Docs-versus-source notes (0.9.5)

- `herdr plugin` is absent from top-level `herdr --help` but fully present.
  Discover command groups by running the group name alone.
- Unknown manifest fields are silently ignored. The docs' keybinding example
  (`[[keys.command]]`) belongs in config.toml; inside the manifest it is dead
  TOML.
- Unknown `[[events]]` names are warnings, not errors.
- `min_herdr_version` is described as required in docs and enforced as
  required in source — despite parsing as an optional field.

## What was live-verified on 0.9.5

- `herdr plugin link/list/action list/action invoke/log list/config-dir/
  unlink` against a real server; JSON response shapes.
- Runtime env injection for an action command: `HERDR_ENV`, `HERDR_BIN_PATH`,
  `HERDR_SOCKET_PATH`, `HERDR_PLUGIN_ID`, `HERDR_PLUGIN_ROOT`,
  `HERDR_PLUGIN_CONFIG_DIR`, `HERDR_PLUGIN_STATE_DIR`,
  `HERDR_PLUGIN_ACTION_ID`, `HERDR_PLUGIN_CONTEXT_JSON`,
  `HERDR_WORKSPACE_ID`, `HERDR_TAB_ID`, `HERDR_PANE_ID` all set;
  `HERDR_PLUGIN_EVENT` unset for actions.
- `HERDR_PLUGIN_CONTEXT_JSON` keys from a CLI invocation: `correlation_id`,
  `focused_pane_cwd`, `focused_pane_id`, `focused_pane_status`,
  `invocation_source`, `tab_id`, `tab_label`, `workspace_cwd`,
  `workspace_id`, `workspace_label`.
- Working directory of a runtime command equals the plugin root.
- Log capture: `log_id`, `status`, `exit_code`, `stdout`, `stderr`, timestamps.
- Config dir: `~/.config/herdr/plugins/config/<plugin-id>` on macOS.
- Error taxonomy: an action id containing a dot returns
  `{"error":{"code":"invalid_plugin_action_id",...}}`.
- Socket methods present on the running server: `plugin.action.invoke`,
  `plugin.action.list`, `plugin.disable`, `plugin.enable`, `plugin.link`,
  `plugin.list`, `plugin.log.list`, `plugin.pane.close`, `plugin.pane.focus`,
  `plugin.pane.open`, `plugin.unlink`.

Not live-verified here: GitHub install/update flows, build command execution,
startup hook firing, pane opening, popup geometry, link-handler clicks, and
Windows behavior. These are sourced from pinned code and docs; verify them
against the installed binary when they matter to the task.
