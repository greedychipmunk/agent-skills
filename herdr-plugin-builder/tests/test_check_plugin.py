#!/usr/bin/env python3
"""Tests for scripts/check_plugin.py, the offline Herdr manifest preflight.

Each test asserts the exit code and the Herdr error code the live 0.9.5
validator would report for the same defect.
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
SCRIPT = SKILL_DIR / "scripts" / "check_plugin.py"
TEMPLATE = SKILL_DIR / "assets" / "plugin-template.toml"

VALID = """\
id = "test.plugin"
name = "Test"
version = "0.1.0"
min_herdr_version = "0.9.5"
platforms = ["macos"]
"""

KNOWN_EVENTS = [
    "workspace.created", "workspace.updated", "workspace.closed",
    "workspace.renamed", "workspace.moved", "workspace.reordered",
    "workspace.focused", "worktree.created", "worktree.opened",
    "worktree.removed", "tab.created", "tab.closed", "tab.renamed",
    "tab.moved", "tab.focused", "pane.created", "pane.closed",
    "pane.focused", "pane.moved", "pane.exited", "pane.agent_detected",
    "pane.agent_status_changed",
]


def run(path, *extra):
    proc = subprocess.run(
        [sys.executable, "-B", str(SCRIPT), str(path), *extra],
        capture_output=True, text=True)
    return proc.returncode, proc.stdout + proc.stderr


class Preflight(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self._tmp.name)
        self.addCleanup(self._tmp.cleanup)

    def write(self, text):
        (self.dir / "herdr-plugin.toml").write_text(text)
        return self.dir

    def assert_issue(self, code, manifest, *extra):
        rc, out = run(self.write(manifest), *extra)
        self.assertEqual(rc, 1, out)
        self.assertIn(code, out)
        self.assertNotIn("preflight-passed", out)

    def assert_pass(self, manifest, *extra):
        rc, out = run(self.write(manifest), *extra)
        self.assertEqual(rc, 0, out)
        self.assertIn("preflight-passed", out)

    # --- passing manifests -------------------------------------------------

    def test_template_asset_passes(self):
        rc, out = run(TEMPLATE)
        self.assertEqual(rc, 0, out)

    def test_minimal_manifest_passes_with_platforms_warning(self):
        rc, out = run(self.write(VALID))
        self.assertEqual(rc, 0, out)
        self.assertIn("warning", out)

    def test_plugin_id_is_trimmed(self):
        self.assert_pass(VALID.replace('id = "test.plugin"',
                                        'id = "  test.plugin  "'))

    def test_all_22_event_names_pass(self):
        events = "\n".join(
            f'[[events]]\non = "{name}"\ncommand = ["true"]\n'
            for name in KNOWN_EVENTS)
        self.assert_pass(VALID + events)

    def test_valid_link_handler_passes(self):
        self.assert_pass(VALID + """\

[[actions]]
id = "open"
title = "Open"
command = ["true"]

[[link_handlers]]
id = "github"
title = "GitHub"
pattern = "^https://github\\\\.com/.+"
action = "open"
""")

    def test_popup_percent_and_cell_sizes_pass(self):
        self.assert_pass(VALID + """\

[[panes]]
id = "board"
title = "Board"
placement = "popup"
width = "80%"
height = 20
command = ["true"]
""")

    def test_manifest_file_path_argument(self):
        self.write(VALID)
        rc, out = run(self.dir / "herdr-plugin.toml")
        self.assertEqual(rc, 0, out)

    def test_startup_and_build_sections_pass(self):
        self.assert_pass(VALID + """\

[[build]]
command = ["npm", "ci"]

[[startup]]
command = ["node", "restore.js"]
""")

    def test_min_herdr_version_equal_installed_passes(self):
        self.assert_pass(VALID, "--herdr-version", "0.9.5")

    # --- exit 2: unreadable input ------------------------------------------

    def test_missing_manifest_exit_2(self):
        rc, out = run(self.dir)
        self.assertEqual(rc, 2, out)

    def test_nonexistent_path_exit_2(self):
        rc, out = run(self.dir / "nope")
        self.assertEqual(rc, 2, out)

    # --- parse failures (plugin_manifest_parse_failed) ----------------------

    def test_toml_syntax_error(self):
        self.assert_issue("plugin_manifest_parse_failed",
                          VALID + "\nbroken =\n")

    def test_missing_id(self):
        self.assert_issue("plugin_manifest_parse_failed",
                          VALID.replace('id = "test.plugin"\n', ""))

    def test_missing_name(self):
        self.assert_issue("plugin_manifest_parse_failed",
                          VALID.replace('name = "Test"\n', ""))

    def test_missing_version(self):
        self.assert_issue("plugin_manifest_parse_failed",
                          VALID.replace('version = "0.1.0"\n', ""))

    def test_command_not_a_list(self):
        self.assert_issue("plugin_manifest_parse_failed", VALID + """\

[[actions]]
id = "a"
title = "A"
command = "true"
""")

    def test_unknown_context(self):
        self.assert_issue("plugin_manifest_parse_failed", VALID + """\

[[actions]]
id = "a"
title = "A"
contexts = ["window"]
command = ["true"]
""")

    def test_unknown_placement(self):
        self.assert_issue("plugin_manifest_parse_failed", VALID + """\

[[panes]]
id = "p"
title = "P"
placement = "floating"
command = ["true"]
""")

    def test_popup_percent_zero(self):
        self.assert_issue("plugin_manifest_parse_failed", VALID + """\

[[panes]]
id = "p"
title = "P"
placement = "popup"
width = "0%"
command = ["true"]
""")

    def test_action_missing_command(self):
        self.assert_issue("plugin_manifest_parse_failed", VALID + """\

[[actions]]
id = "a"
title = "A"
""")

    def test_pane_missing_title(self):
        self.assert_issue("plugin_manifest_parse_failed", VALID + """\

[[panes]]
id = "p"
command = ["true"]
""")

    # --- specific validation codes -----------------------------------------

    def test_missing_min_herdr_version(self):
        self.assert_issue("invalid_plugin_min_herdr_version",
                          VALID.replace('min_herdr_version = "0.9.5"\n', ""))

    def test_bad_semver(self):
        self.assert_issue("invalid_plugin_min_herdr_version",
                          VALID.replace('min_herdr_version = "0.9.5"',
                                        'min_herdr_version = "0.9"'))

    def test_min_herdr_version_newer_than_installed(self):
        self.assert_issue("plugin_requires_newer_herdr",
                          VALID.replace('min_herdr_version = "0.9.5"',
                                        'min_herdr_version = "0.9.6"'),
                          "--herdr-version", "0.9.5")

    def test_empty_name(self):
        self.assert_issue("invalid_plugin_name",
                          VALID.replace('name = "Test"', 'name = "   "'))

    def test_bad_plugin_id_charset(self):
        self.assert_issue("invalid_plugin_id",
                          VALID.replace('id = "test.plugin"',
                                        'id = "test plugin"'))

    def test_plugin_id_too_long(self):
        self.assert_issue("invalid_plugin_id",
                          VALID.replace('id = "test.plugin"',
                                        'id = "' + "a" * 121 + '"'))

    def test_unicode_plugin_id(self):
        self.assert_issue("invalid_plugin_id",
                          VALID.replace('id = "test.plugin"',
                                        'id = "test.plügin"'))

    def test_unknown_platform(self):
        self.assert_issue("invalid_plugin_platform",
                          VALID.replace('platforms = ["macos"]',
                                        'platforms = ["osx"]'))

    def test_empty_platforms_array(self):
        self.assert_issue("invalid_plugin_platform",
                          VALID.replace('platforms = ["macos"]',
                                        'platforms = []'))

    def test_action_id_with_dot(self):
        self.assert_issue("invalid_plugin_action_id", VALID + """\

[[actions]]
id = "has.dot"
title = "A"
command = ["true"]
""")

    def test_action_id_too_long(self):
        self.assert_issue("invalid_plugin_action_id", VALID + f"""

[[actions]]
id = "{"a" * 121}"
title = "A"
command = ["true"]
""")

    def test_empty_action_title(self):
        self.assert_issue("invalid_plugin_action_title", VALID + """\

[[actions]]
id = "a"
title = ""
command = ["true"]
""")

    def test_empty_command_argv(self):
        self.assert_issue("invalid_plugin_command", VALID + """\

[[actions]]
id = "a"
title = "A"
command = []
""")

    def test_command_empty_string_arg(self):
        self.assert_issue("invalid_plugin_command", VALID + """\

[[actions]]
id = "a"
title = "A"
command = ["true", ""]
""")

    def test_duplicate_action_ids(self):
        self.assert_issue("duplicate_plugin_action_id", VALID + """\

[[actions]]
id = "a"
title = "A"
command = ["true"]

[[actions]]
id = "a"
title = "B"
command = ["true"]
""")

    def test_empty_event_name(self):
        self.assert_issue("invalid_plugin_event", VALID + """\

[[events]]
on = ""
command = ["true"]
""")

    def test_unknown_event_name_warns_only(self):
        rc, out = run(self.write(VALID + """\

[[events]]
on = "pane.output_changed"
command = ["true"]
"""))
        self.assertEqual(rc, 0, out)
        self.assertIn("warning", out)

    def test_pane_width_without_popup(self):
        self.assert_issue("invalid_plugin_pane_size", VALID + """\

[[panes]]
id = "p"
title = "P"
placement = "split"
width = 80
command = ["true"]
""")

    def test_duplicate_pane_ids(self):
        self.assert_issue("duplicate_plugin_pane_id", VALID + """\

[[panes]]
id = "p"
title = "P"
command = ["true"]

[[panes]]
id = "p"
title = "Q"
command = ["true"]
""")

    def test_link_handler_undeclared_action(self):
        self.assert_issue("invalid_plugin_link_handler_action", VALID + """\

[[link_handlers]]
id = "lh"
title = "LH"
pattern = "^https://example\\\\.com/"
action = "missing"
""")

    def test_link_handler_action_with_dot(self):
        self.assert_issue("invalid_plugin_link_handler_action", VALID + """\

[[actions]]
id = "open"
title = "Open"
command = ["true"]

[[link_handlers]]
id = "lh"
title = "LH"
pattern = "^https://example\\\\.com/"
action = "open.sub"
""")

    def test_link_handler_bad_regex(self):
        self.assert_issue("invalid_plugin_link_handler_pattern", VALID + """\

[[actions]]
id = "open"
title = "Open"
command = ["true"]

[[link_handlers]]
id = "lh"
title = "LH"
pattern = "^https://([unclosed"
action = "open"
""")

    def test_link_handler_empty_pattern(self):
        self.assert_issue("invalid_plugin_link_handler_pattern", VALID + """\

[[actions]]
id = "open"
title = "Open"
command = ["true"]

[[link_handlers]]
id = "lh"
title = "LH"
pattern = ""
action = "open"
""")

    def test_duplicate_link_handler_ids(self):
        self.assert_issue("duplicate_plugin_link_handler_id", VALID + """\

[[actions]]
id = "open"
title = "Open"
command = ["true"]

[[link_handlers]]
id = "lh"
title = "LH"
pattern = "a"
action = "open"

[[link_handlers]]
id = "lh"
title = "LH2"
pattern = "b"
action = "open"
""")

    # --- silent-ignore traps -------------------------------------------------

    def test_keys_block_warns(self):
        rc, out = run(self.write(VALID + """\

[[keys.command]]
key = "prefix+l"
type = "plugin_action"
command = "test.plugin.apply"
"""))
        self.assertEqual(rc, 0, out)
        self.assertIn("keys section is ignored", out)

    def test_singular_section_name_warns(self):
        # A [[action]] typo is silently ignored by Herdr — no error, no effect.
        rc, out = run(self.write(VALID + """\

[[action]]
id = "a"
title = "A"
command = ["true"]
"""))
        self.assertEqual(rc, 0, out)
        self.assertIn("unknown top-level field 'action'", out)

    def test_item_platforms_validated(self):
        self.assert_issue("invalid_plugin_platform", VALID + """\

[[actions]]
id = "a"
title = "A"
platforms = ["osx"]
command = ["true"]
""")


if __name__ == "__main__":
    unittest.main()
