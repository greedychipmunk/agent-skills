# Lifecycle and publishing

Registration and distribution flows. Commands verified against Herdr 0.9.5;
GitHub flows sourced from pinned code and docs — verify against the installed
binary when they matter.

## Local development: link

`herdr plugin link <path> [--disabled]`

- Validates the manifest, registers the plugin globally for the user (every
  Herdr session), and creates config/state directories. `--disabled`
  registers without enabling.
- Never runs `[[build]]` commands — a plugin that builds to dist/ artifacts
  must be built manually during development.
- Works whether or not a Herdr server is running.
- `herdr plugin unlink <id>` unregisters but never deletes files.
- `herdr plugin config-dir <id>` prints the config directory.
- `herdr plugin list [--plugin ID] [--json]`, `herdr plugin enable|disable`,
  `herdr plugin action list --plugin ID`,
  `herdr plugin action invoke <plugin-id>.<action-id>`,
  `herdr plugin log list --plugin ID [--limit N]`,
  `herdr plugin pane open|focus|close`.

## Distribution: install from GitHub

`herdr plugin install <owner>/<repo>[/subdir...] [--ref REF] [--yes]`

- GitHub shorthand only — no URLs, no local paths, no other hosts.
- Manifests are discovered at the repository root and in immediate
  subdirectories of the default branch (or `--ref`). Multiple plugins per
  repository are fine.
- Interactive terminals show a preview: manifest contents, build commands,
  startup hooks, and platform support. `--yes` skips the prompt; never
  recommend it for unreviewed third-party code.
- After confirmation, `[[build]]` commands run in order; any failure aborts
  the install. Builds receive no runtime plugin env.
- Changing the manifest between preview and confirmation aborts the install.
- Install is refused over a linked plugin; unlink first.
- `--ref` pins a branch, tag, or commit for reproducible installs; recorded
  for later updates.

## Updates and removal

- `herdr plugin update [targets] [--yes]`: refetches each plugin's recorded
  ref, re-runs builds, re-registers. Skips unchanged plugins; bulk updates
  ignore linked plugins. A `min_herdr_version` above the installed binary
  fails that plugin's update with `plugin_requires_newer_herdr`.
- `herdr plugin uninstall <id>`: unregisters; files are retained until a
  later cleanup pass, so a same-id reinstall can reuse config/state dirs.
- `herdr plugin unlink <id>`: unregisters a linked plugin; files untouched.
- `herdr plugin enable|disable <id>`: toggles without unregistering.

## Marketplace

- Listing is opt-in via the GitHub repository topic `herdr-plugin`; the index
  refreshes about every 30 minutes. No submission process, no review, no
  signing — anyone can publish, so consumers must review before installing.
- One repository can host multiple plugins (root manifest + one per
  subdirectory).
- Publish checklist: manifest passes preflight and live link; `[[build]]`
  commands succeed on a clean clone of the exact ref users will install;
  README documents actions, events, panes, link handlers, required
  toolchains, and any recommended config.toml keybindings;
  `min_herdr_version` reflects the oldest supported Herdr; repository carries
  the `herdr-plugin` topic.
- Community examples live in `ogulcancelik/herdr-plugin-examples`
  (agent-telegram-notify, github-link-preview, dev-layout-bootstrap) — useful
  as patterns, not official contracts.

## Legacy note

Plugins installed only into a named session on Herdr 0.7.3 or earlier are not
visible to 0.9.x; install or link them again.
