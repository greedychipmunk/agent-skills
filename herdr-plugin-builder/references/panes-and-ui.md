# Panes, popups, keybindings, and link handlers

## Pane placements

`[[panes]]` entries declare commands that open as panes. `placement` is
`overlay` (default), `popup`, `split`, `tab`, or `zoomed`.

- **overlay**: temporary zoomed overlay over the current pane; focus and zoom
  state are restored when it closes.
- **split / tab / zoomed**: real panes in the layout — they get pane ids,
  appear in pane APIs, fire lifecycle events, and follow pane moves.
- **popup**: a singleton session resource, *not* a pane — see below.

Pane commands receive `HERDR_PLUGIN_ENTRYPOINT_ID` (the manifest pane id).
Open, focus, and close from the CLI: `herdr plugin pane open|focus|close`.

## Popup semantics

- One popup per session: opening again replaces the content. It is modal —
  while active, other popup/overlay UI fails with `ui_busy`.
- No pane id: popups are absent from `HERDR_PANE_ID`, pane APIs, and pane
  lifecycle events. Do not write popup code that assumes a pane id.
- Sizing: `width`/`height` are integer cells or `"1%"`–`"100%"` strings
  (percent of the pane area, computed on open). Defaults are roughly half
  the pane area; minimum 6×4 cells. Sizes only apply with
  `placement = "popup"`.
- Lifecycle: the popup closes when the command exits; per the docs it can
  also be closed by a `popup.close` request. A popup command that keeps
  running holds the popup open.

## Keybindings

Plugins do not ship keybindings on 0.9.5. A `[[keys.command]]` block inside
`herdr-plugin.toml` is silently ignored (the manifest loader has no `keys`
field). Keybindings live in the **user's config.toml** and reference
installed plugin actions by qualified id:

```toml
[[keys.command]]
key = "prefix+l"
type = "plugin_action"
command = "example.my-plugin.apply"
description = "Apply my-plugin layout"
```

The binding invokes the action with the keybind as the invocation source and
passes the current selection as `selected_text` when present. When
publishing, document the recommended binding in the plugin README; do not
try to write config.toml from the plugin.

## Link handlers

`[[link_handlers]]` map clicked URLs to plugin actions:

- Trigger: **Control-click** on all platforms, including macOS, while
  `ui.mouse_capture` is enabled in config.toml. Without mouse capture,
  handlers never fire.
- `pattern` is a Rust regex (compiled at manifest validation; Python `re` is
  only a preflight approximation). Handlers are checked in manifest order;
  first match wins.
- The referenced `action` runs with `invocation_source = "link_click"`,
  `HERDR_PLUGIN_CLICKED_URL`, `HERDR_PLUGIN_LINK_HANDLER_ID`, and
  `clicked_url`/`link_handler_id` in the context JSON.
- External fallback: HTTP(S) URLs with no matching handler open in the
  system browser. Non-HTTP links (e.g. `mailto:`) are ignored.
- Prefer tight patterns anchored with `^...$`; a loose pattern shadows
  later handlers and hijacks ordinary clicks.
