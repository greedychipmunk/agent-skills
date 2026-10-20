#!/usr/bin/env python3
"""Offline preflight validator for Herdr plugin manifests.

Mirrors the Herdr 0.9.5 manifest validation rules
(src/app/api/plugins/manifest.rs at tag v0.9.5) so most manifest errors are
caught before touching a live server. The installed binary remains the
authority: confirm with `herdr plugin link` after preflight.

Usage:
    python3 check_plugin.py <plugin-dir-or-manifest> [--herdr-version X.Y.Z]

Exit codes:
    0  preflight passed (warnings may be present)
    1  issues found (each line prefixed with the matching Herdr error code)
    2  unreadable input (missing manifest, unreadable file, or no tomllib)

Requires Python 3.11+ for tomllib. Without it, exit 2 tells you to validate
live via `herdr plugin link` instead.
"""

from __future__ import annotations

import argparse
import re
import string
import sys
from pathlib import Path

try:
    import tomllib
except ModuleNotFoundError:  # Python < 3.11
    print("error: tomllib is unavailable (Python 3.11+ required)")
    print("validate live instead: herdr plugin link <dir>")
    sys.exit(2)

MANIFEST_NAME = "herdr-plugin.toml"
MAX_ID_LEN = 120
PLUGIN_ID_CHARS = set(string.ascii_letters + string.digits + ":._-")
LOCAL_ID_CHARS = set(string.ascii_letters + string.digits + ":_-")
PLATFORMS = {"linux", "macos", "windows"}
CONTEXTS = {"global", "workspace", "tab", "pane", "selection"}
PLACEMENTS = {"overlay", "popup", "split", "tab", "zoomed"}
SECTIONS = ("build", "startup", "actions", "events", "panes", "link_handlers")
SINGULAR = {"actions": "action", "panes": "pane", "link_handlers": "link_handler"}
KNOWN_TOP_LEVEL = {
    "id", "name", "version", "min_herdr_version", "description",
    "platforms", *SECTIONS,
}

# The 22 event names plugin hooks may reference on 0.9.5
# (PLUGIN_HOOK_EVENT_KINDS in src/api/schema/events.rs).
KNOWN_EVENTS = {
    "workspace.created", "workspace.updated", "workspace.closed",
    "workspace.renamed", "workspace.moved", "workspace.reordered",
    "workspace.focused", "worktree.created", "worktree.opened",
    "worktree.removed", "tab.created", "tab.closed", "tab.renamed",
    "tab.moved", "tab.focused", "pane.created", "pane.closed",
    "pane.focused", "pane.moved", "pane.exited", "pane.agent_detected",
    "pane.agent_status_changed",
}

SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$")
PERCENT_RE = re.compile(r"^(?:[1-9][0-9]?|100)%$")


class Report:
    def __init__(self) -> None:
        self.issues: list[str] = []
        self.warnings: list[str] = []

    def issue(self, code: str, message: str) -> None:
        self.issues.append(f"issue {code}: {message}")

    def warn(self, message: str) -> None:
        self.warnings.append(f"warning: {message}")


def valid_plugin_id(value: str) -> bool:
    return bool(value) and len(value) <= MAX_ID_LEN and set(value) <= PLUGIN_ID_CHARS


def valid_local_id(value: str) -> bool:
    return bool(value) and len(value) <= MAX_ID_LEN and set(value) <= LOCAL_ID_CHARS


def check_command(report: Report, command: object, where: str) -> None:
    if not isinstance(command, list):
        report.issue("plugin_manifest_parse_failed",
                     f"{where}: command must be an argv array")
        return
    if not command:
        report.issue("invalid_plugin_command", f"{where}: command cannot be empty")
        return
    for i, arg in enumerate(command):
        if not isinstance(arg, str):
            report.issue("plugin_manifest_parse_failed",
                         f"{where}: command[{i}] must be a string")
        elif not arg:
            report.issue("invalid_plugin_command",
                         f"{where}: command[{i}] cannot be an empty string")


def check_platforms(report: Report, platforms: object, where: str) -> None:
    if not isinstance(platforms, list):
        report.issue("plugin_manifest_parse_failed",
                     f"{where}: platforms must be an array")
        return
    if not platforms:
        report.issue("invalid_plugin_platform",
                     f"{where}: platforms cannot be an empty array (omit it instead)")
        return
    for p in platforms:
        if not isinstance(p, str) or p not in PLATFORMS:
            report.issue("invalid_plugin_platform",
                         f"{where}: unknown platform {p!r} (linux, macos, windows)")


def check_id_field(report: Report, value: object, field: str, where: str,
                   code: str, local: bool) -> str | None:
    """Validate an id field; return the trimmed id when valid, else None."""
    if not isinstance(value, str):
        report.issue("plugin_manifest_parse_failed",
                     f"{where}: {field} must be a string")
        return None
    trimmed = value.strip()
    valid = valid_local_id(trimmed) if local else valid_plugin_id(trimmed)
    if valid:
        return trimmed
    kind = "local id" if local else "plugin id"
    charset = ("ASCII letters, digits, ':', '_' (no dots)" if local
               else "ASCII letters, digits, ':', '.', '_', '-'")
    if not trimmed:
        report.issue(code, f"{where}: {kind} cannot be empty")
    elif len(trimmed) > MAX_ID_LEN:
        report.issue(code, f"{where}: {kind} exceeds {MAX_ID_LEN} chars")
    else:
        report.issue(code, f"{where}: invalid {kind} charset ({charset})")
    return None


def check_title(report: Report, value: object, code: str, where: str) -> None:
    if not isinstance(value, str):
        report.issue("plugin_manifest_parse_failed", f"{where}: title must be a string")
    elif not value.strip():
        report.issue(code, f"{where}: title cannot be empty")


def check_popup_size(report: Report, value: object, where: str, dim: str) -> None:
    if isinstance(value, bool):
        report.issue("plugin_manifest_parse_failed",
                     f"{where}: {dim} must be integer cells or a \"N%\" string")
    elif isinstance(value, int):
        if not 0 <= value <= 65535:
            report.issue("plugin_manifest_parse_failed",
                         f"{where}: {dim} out of u16 range")
    elif isinstance(value, str):
        if not PERCENT_RE.match(value):
            report.issue("plugin_manifest_parse_failed",
                         f"{where}: {dim} must be \"1%\"..\"100%\" or integer cells")
    else:
        report.issue("plugin_manifest_parse_failed",
                     f"{where}: {dim} must be integer cells or a \"N%\" string")


def validate(manifest: dict, herdr_version: str | None) -> Report:
    report = Report()

    for field in ("id", "name", "version"):
        if field not in manifest:
            report.issue("plugin_manifest_parse_failed",
                         f"missing required field '{field}'")

    if "id" in manifest:
        check_id_field(report, manifest["id"], "id", "manifest",
                       "invalid_plugin_id", local=False)
    if "name" in manifest and isinstance(manifest["name"], str) \
            and not manifest["name"].strip():
        report.issue("invalid_plugin_name", "name cannot be empty")
    if "version" in manifest and isinstance(manifest["version"], str) \
            and not manifest["version"].strip():
        report.issue("invalid_plugin_version", "version cannot be empty")

    min_herdr = manifest.get("min_herdr_version")
    if min_herdr is None:
        report.issue("invalid_plugin_min_herdr_version",
                     "min_herdr_version is required")
    elif not isinstance(min_herdr, str) or not SEMVER_RE.match(min_herdr.strip()):
        report.issue("invalid_plugin_min_herdr_version",
                     f"min_herdr_version {min_herdr!r} is not a semantic version")
    elif herdr_version is not None:
        if _semver_tuple(min_herdr) > _semver_tuple(herdr_version):
            report.issue("plugin_requires_newer_herdr",
                         f"min_herdr_version {min_herdr} exceeds installed "
                         f"Herdr {herdr_version}")

    if "platforms" not in manifest:
        report.warn("manifest does not declare platforms; platform support unknown")
    else:
        check_platforms(report, manifest["platforms"], "manifest")

    for key in manifest:
        if key not in KNOWN_TOP_LEVEL:
            if key == "keys":
                report.warn("keys section is ignored by Herdr 0.9.5; "
                            "keybindings belong in the user's config.toml")
            else:
                report.warn(f"unknown top-level field '{key}' is silently ignored")

    action_ids: list[str] = []

    for section in SECTIONS:
        items = manifest.get(section)
        if items is None:
            continue
        if not isinstance(items, list):
            report.issue("plugin_manifest_parse_failed",
                         f"[[{section}]] must be an array of tables")
            continue
        seen: dict[str, int] = {}
        for i, item in enumerate(items):
            where = f"[[{section}]][{i}]"
            if not isinstance(item, dict):
                report.issue("plugin_manifest_parse_failed",
                             f"{where} must be a table")
                continue
            # link_handlers have no command of their own — they reference an
            # action declared in [[actions]] instead.
            if section != "link_handlers" and "command" not in item:
                report.issue("plugin_manifest_parse_failed",
                             f"{where}: missing required field 'command'")
            elif section != "link_handlers":
                check_command(report, item["command"], where)
            if "platforms" in item:
                check_platforms(report, item["platforms"], where)

            if section in SINGULAR:
                noun = SINGULAR[section]
                if "id" not in item:
                    report.issue("plugin_manifest_parse_failed",
                                 f"{where}: missing required field 'id'")
                else:
                    item_id = check_id_field(report, item["id"], "id", where,
                                             f"invalid_plugin_{noun}_id",
                                             local=True)
                    if item_id is not None:
                        if item_id in seen:
                            report.issue(f"duplicate_plugin_{noun}_id",
                                         f"{where}: duplicate id {item_id!r} "
                                         f"(first at index {seen[item_id]})")
                        else:
                            seen[item_id] = i
                        if section == "actions":
                            action_ids.append(item_id)
                if "title" not in item:
                    report.issue("plugin_manifest_parse_failed",
                                 f"{where}: missing required field 'title'")
                else:
                    check_title(report, item["title"],
                                f"invalid_plugin_{noun}_title", where)

            if section == "actions" and "contexts" in item:
                contexts = item["contexts"]
                if not isinstance(contexts, list):
                    report.issue("plugin_manifest_parse_failed",
                                 f"{where}: contexts must be an array")
                else:
                    for c in contexts:
                        if not isinstance(c, str) or c not in CONTEXTS:
                            report.issue("plugin_manifest_parse_failed",
                                         f"{where}: unknown context {c!r} "
                                         f"(global, workspace, tab, pane, selection)")

            if section == "events":
                if "on" not in item:
                    report.issue("plugin_manifest_parse_failed",
                                 f"{where}: missing required field 'on'")
                else:
                    on = item["on"]
                    if not isinstance(on, str):
                        report.issue("plugin_manifest_parse_failed",
                                     f"{where}: on must be a string")
                    elif not on.strip():
                        report.issue("invalid_plugin_event",
                                     f"{where}: event name cannot be empty")
                    elif on not in KNOWN_EVENTS:
                        report.warn(f"{where}: unknown event name {on!r} "
                                    "(warning only in Herdr)")

            if section == "panes":
                placement = item.get("placement", "overlay")
                if not isinstance(placement, str) or placement not in PLACEMENTS:
                    report.issue("plugin_manifest_parse_failed",
                                 f"{where}: unknown placement {placement!r} "
                                 "(overlay, popup, split, tab, zoomed)")
                    placement = None
                for dim in ("width", "height"):
                    if dim in item:
                        if placement == "popup":
                            check_popup_size(report, item[dim], where, dim)
                        elif placement is not None:
                            report.issue("invalid_plugin_pane_size",
                                         f"{where}: {dim} is only valid with "
                                         "placement = \"popup\"")

            if section == "link_handlers":
                if "pattern" not in item:
                    report.issue("plugin_manifest_parse_failed",
                                 f"{where}: missing required field 'pattern'")
                else:
                    pattern = item["pattern"]
                    if not isinstance(pattern, str) or not pattern.strip():
                        report.issue("invalid_plugin_link_handler_pattern",
                                     f"{where}: pattern cannot be empty")
                    else:
                        try:
                            re.compile(pattern)
                        except re.error as exc:
                            report.issue("invalid_plugin_link_handler_pattern",
                                         f"{where}: pattern does not compile "
                                         f"(Python re proxy for Rust regex): {exc}")
                if "action" not in item:
                    report.issue("plugin_manifest_parse_failed",
                                 f"{where}: missing required field 'action'")
                else:
                    action = check_id_field(report, item["action"], "action",
                                            where,
                                            "invalid_plugin_link_handler_action",
                                            local=True)
                    if action is not None and action not in action_ids:
                        report.issue("invalid_plugin_link_handler_action",
                                     f"{where}: action {action!r} is not declared "
                                     "in [[actions]]")

    return report


def _semver_tuple(version: str) -> tuple[int, int, int]:
    match = re.match(r"^(\d+)\.(\d+)\.(\d+)", version.strip())
    if not match:
        return (0, 0, 0)
    return tuple(int(g) for g in match.groups())  # type: ignore[return-value]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Offline preflight validator for Herdr plugin manifests")
    parser.add_argument("path", help="plugin directory or herdr-plugin.toml path")
    parser.add_argument("--herdr-version", default=None,
                        help="installed Herdr version, e.g. 0.9.5 (enables the "
                             "plugin_requires_newer_herdr check)")
    args = parser.parse_args()

    path = Path(args.path)
    manifest_path = path / MANIFEST_NAME if path.is_dir() else path
    if not manifest_path.is_file():
        print(f"error: plugin manifest not found: {manifest_path}")
        return 2

    try:
        raw = manifest_path.read_bytes()
    except OSError as exc:
        print(f"error: cannot read {manifest_path}: {exc}")
        return 2

    try:
        manifest = tomllib.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, tomllib.TOMLDecodeError) as exc:
        print(f"issue plugin_manifest_parse_failed: {exc}")
        print("preflight-failed: 1 issue")
        return 1

    report = validate(manifest, args.herdr_version)

    for line in report.warnings:
        print(line)
    for line in report.issues:
        print(line)

    if report.issues:
        print(f"preflight-failed: {len(report.issues)} issue(s), "
              f"{len(report.warnings)} warning(s)")
        return 1
    print(f"preflight-passed: 0 issues, {len(report.warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
