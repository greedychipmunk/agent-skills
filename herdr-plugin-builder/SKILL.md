---
name: herdr-plugin-builder
description: Builds, validates, and publishes Herdr plugins — manifest-declared workflow packages (actions, event hooks, panes, link handlers) for the Herdr terminal multiplexer. Use when authoring or debugging herdr-plugin.toml manifests, wiring plugin runtime environment or Herdr callbacks, diagnosing plugin link/install/log failures, or publishing to the Herdr marketplace. Not for controlling Herdr panes or agents (use the herdr agent skill or herdr --skill) or for agent integrations (herdr integration install).
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Herdr Plugin Builder

A Herdr plugin is a directory with a `herdr-plugin.toml` manifest plus any
executable command Herdr can launch by argv: Bash, Node, Python, Lua, a Rust
binary, anything available on the user's machine. Herdr owns installation,
manifest validation, keybindings, panes, events, and the socket; the plugin
owns its language, dependencies, files, and durable state. There is no plugin
SDK and no restricted command set — the entire `herdr` CLI is the plugin API.

## Establish the version and authority first

- Run `herdr status` and record the client and server versions. The installed
  binary is the authority for command syntax and manifest validation; every
  contract in this skill was verified against Herdr 0.9.5 (protocol 22).
- `herdr plugin` exists on 0.9.5 even though top-level `herdr --help` does
  not list it. Print the group with `herdr plugin`; never run bare `herdr`,
  which launches or attaches the TUI.
- Read [sources and version boundaries](references/sources.md) before trusting
  any example. Unknown manifest fields are silently ignored, so a field typo
  or a documentation sketch can mislead without producing an error.
- Confirm `HERDR_ENV=1` before any plugin or verification step controls live
  panes, agents, or workspaces.

## Keep the three extension surfaces distinct

- **Plugins** (`herdr plugin ...`): shareable workflow packages. This skill.
- **Integrations** (`herdr integration install <agent>`): status reporting
  for known coding agents. A different feature; do not recreate it here.
- **Agent and pane control** (`herdr agent|pane|workspace ...`): the runtime
  surface plugins call back into. Covered by the `herdr` agent skill or
  `herdr --skill`; do not restate its full contract.

## Choose the workflow

| Request | Read next | Required result |
| --- | --- | --- |
| Author or fix a manifest | [Manifest contract](references/manifest.md) | Valid `herdr-plugin.toml` passing offline preflight and live link |
| Wire runtime behavior or Herdr callbacks | [Runtime environment](references/runtime.md) | Correct env/context handling with log evidence |
| Install, update, uninstall, or publish | [Lifecycle and publishing](references/lifecycle-and-publishing.md) | Correct registration path and marketplace listing |
| Add panes, popups, keybindings, or link handlers | [Panes and UI](references/panes-and-ui.md) | Declared entrypoints that open and close as designed |

## Default execution sequence

1. **Start from the template.** Copy [assets/plugin-template.toml](assets/plugin-template.toml)
   and set `id`, `name`, `version`, and `min_herdr_version` (all required;
   `min_herdr_version` is semver and must not exceed the installed Herdr
   version).
2. **Preflight offline.** Run `python3 <skill-dir>/scripts/check_plugin.py
   <plugin-dir>` to catch id-charset, platform, command, event-name,
   duplicate-id, and popup-size issues before touching a live server. The
   script mirrors Herdr 0.9.5 validation rules and error codes.
3. **Link for local development.** `herdr plugin link <dir>` registers the
   plugin without running `[[build]]` commands. Registration is global to the
   user and visible in every Herdr session; unlink with
   `herdr plugin unlink <id>` when finished.
4. **Exercise the real surface.** `herdr plugin action list --plugin <id>`,
   then `herdr plugin action invoke <id>.<action-id>`, then
   `herdr plugin log list --plugin <id>` for captured stdout/stderr, exit
   codes, and status. A successful invoke acknowledges admission, not
   success: read the log before claiming the action works.
5. **Verify the environment contract.** Runtime commands execute with the
   plugin directory as working directory and receive `HERDR_BIN_PATH`,
   `HERDR_PLUGIN_*`, and context variables
   ([runtime](references/runtime.md)). Call back into Herdr through
   `HERDR_BIN_PATH`, never a hardcoded socket path or a bare `herdr`.
6. **Publish deliberately.** GitHub repository with the `herdr-plugin` topic,
   manifests at the root or in subdirectories of the default branch. Tell
   users to pin `--ref` when reproducibility matters.

## Non-negotiable boundaries

- `command` values are argv arrays. Herdr does not run them through a shell:
   no expansion, pipes, or redirects unless the command starts a shell itself.
- Plugin code runs as the user with full CLI power. Review third-party
   plugins before installing; never instruct users to bypass the install
   preview with `--yes` for code they have not read. `[[startup]]` commands
   run automatically at server startup and are listed in the install preview.
- GitHub-installed plugin roots are managed checkouts. Never store credentials
   or durable state under the plugin root; use `HERDR_PLUGIN_CONFIG_DIR` and
   `HERDR_PLUGIN_STATE_DIR`, which Herdr creates and never validates.
- Plugins must stop detached background processes before their command or
   pane exits; processes surviving server exit are not protected from
   installation cleanup.
- Do not promise plugin-shipped keybindings, runtime action registration, a
   Herdr-managed storage API, or native non-terminal plugin UI — none exist in
   plugin v1. Bind keys to plugin actions through the user's config.toml.
- Never lower `min_herdr_version` just to make a link succeed. A value above
   the installed version is a hard `plugin_requires_newer_herdr` error, and
   that is the correct outcome for an unsupported host.

## Deliverable

Return the plugin directory; a manifest that passes offline preflight and a
live `herdr plugin link`; verified action, event, or pane behavior with log
evidence; install or publish instructions; and explicit notes on anything
untested or version-dependent. If a behavior cannot be verified against the
installed binary, say so instead of generalizing from documentation.
