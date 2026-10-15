"""Tests of the offline preflight, not elizaOS runtime compatibility."""

import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
SKILL = ROOT / "elizaos-character-builder"
SCRIPT = SKILL / "scripts/check_character.py"
spec = importlib.util.spec_from_file_location("check_character", SCRIPT)
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class CharacterTests(unittest.TestCase):
    def setUp(self):
        self.core = json.loads((SKILL / "assets/character.core.json").read_text())

    def check(self, data, target="core"):
        return checker.preflight(data, target)[0]

    def cli(self, text, target="core"):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "character.json"
            path.write_text(text)
            return subprocess.run(
                [
                    sys.executable,
                    "-B",
                    str(SCRIPT),
                    "--input",
                    str(path),
                    "--target",
                    target,
                ],
                capture_output=True,
                text=True,
            )

    def test_core_template(self):
        self.assertEqual(self.check(self.core), [])

    def test_host_template(self):
        host = json.loads((SKILL / "assets/character.host.json").read_text())
        self.assertEqual(self.check(host, "host"), [])

    def test_host_rejects_core_fields(self):
        self.assertTrue(self.check(self.core, "host"))

    def test_root_types(self):
        for value in ([], None, "character", 42, False):
            with self.subTest(value=value):
                self.assertTrue(self.check(value))

    def test_missing_and_blank_name(self):
        for value in ({}, {"name": ""}, {"name": "  "}, {"name": 1}):
            self.assertTrue(self.check(value))

    def test_legacy_input_warning(self):
        data = {
            "name": "Guide",
            "bio": "Helpful",
            "messageExamples": [[{"name": "Guide", "content": {"text": "Hello"}}]],
        }
        errors, warnings = checker.preflight(data)
        self.assertEqual(errors, [])
        self.assertGreaterEqual(len(warnings), 3)
        self.assertTrue(self.check(data, "host"))

    def test_message_structure(self):
        for groups in (
            None,
            {},
            [3],
            [{"examples": []}],
            [{"examples": [None]}],
            [{"examples": [{"name": "Guide", "content": {"text": 1}}]}],
        ):
            self.assertTrue(self.check(dict(self.core, messageExamples=groups)))

    def test_host_content_strictness(self):
        data = {
            "name": "Guide",
            "messageExamples": [
                {
                    "examples": [
                        {
                            "name": "Guide",
                            "content": {"text": "Hi", "thought": "private"},
                        }
                    ]
                }
            ],
        }
        self.assertTrue(self.check(data, "host"))

    def test_actions_type(self):
        data = copy.deepcopy(self.core)
        data["messageExamples"][0]["examples"][0]["content"]["actions"] = "SEND"
        self.assertTrue(self.check(data))

    def test_array_fields(self):
        for field in ("adjectives", "topics", "plugins", "postExamples"):
            for value in (1, None, [False]):
                self.assertTrue(self.check(dict(self.core, **{field: value})))

    def test_object_fields(self):
        for field in ("settings", "templates", "style", "secrets"):
            self.assertTrue(self.check(dict(self.core, **{field: []})))

    def test_boolean_fields(self):
        for field in ("advancedMemory", "advancedPlanning"):
            self.assertTrue(self.check(dict(self.core, **{field: 1})))
            self.assertEqual(self.check(dict(self.core, **{field: True})), [])

    def test_template_strings(self):
        self.assertTrue(self.check(dict(self.core, templates={"message": {}})))
        self.assertEqual(self.check(dict(self.core, templates={"message": "Text"})), [])

    def test_style(self):
        for style in ({"other": []}, {"all": "formal"}):
            self.assertTrue(self.check(dict(self.core, style=style)))

    def test_documents_require_review(self):
        errors, warnings = checker.preflight(dict(self.core, documents=["some fact"]))
        self.assertEqual(errors, [])
        self.assertTrue(any("filesystem paths" in item for item in warnings))
        self.assertTrue(self.check(dict(self.core, knowledge="fact")))

    def test_host_length_limits(self):
        for field, limit in (("name", 100), ("username", 50), ("system", 10000)):
            data = {"name": "Guide"}
            data[field] = "x" * (limit + 1)
            self.assertTrue(self.check(data, "host"))

    def test_unknown_key_not_echoed(self):
        result = self.cli(
            json.dumps({"name": "Guide", "unknown": "SENSITIVE_SENTINEL"})
        )
        self.assertEqual(result.returncode, 1)
        self.assertNotIn("SENSITIVE_SENTINEL", result.stdout + result.stderr)

    def test_secrets_never_echo_values(self):
        for data in (
            dict(self.core, secrets={"x": "SENSITIVE_SENTINEL"}),
            dict(self.core, settings={"secrets": {"x": "SENSITIVE_SENTINEL"}}),
            dict(self.core, settings={"extra": {"apiKey": "SENSITIVE_SENTINEL"}}),
        ):
            result = self.cli(json.dumps(data))
            self.assertEqual(result.returncode, 1)
            self.assertNotIn("SENSITIVE_SENTINEL", result.stdout + result.stderr)

    def test_empty_secrets(self):
        self.assertEqual(self.check(dict(self.core, secrets={})), [])

    def test_bad_json_sanitized(self):
        result = self.cli('{"name":"SENSITIVE_SENTINEL",')
        self.assertEqual(result.returncode, 2)
        self.assertNotIn("SENSITIVE_SENTINEL", result.stdout + result.stderr)

    def test_duplicate_keys(self):
        self.assertEqual(self.cli('{"name":"A","name":"B"}').returncode, 2)

    def test_nonfinite_json(self):
        for constant in ("NaN", "Infinity", "-Infinity"):
            self.assertEqual(
                self.cli(
                    '{"name":"A","settings":{"value":' + constant + "}}"
                ).returncode,
                2,
            )

    def test_valid_cli_report(self):
        result = self.cli(json.dumps(self.core))
        self.assertEqual(result.returncode, 0)
        self.assertEqual(json.loads(result.stdout)["status"], "preflight-passed")

    def test_javascript_not_executed(self):
        self.assertEqual(
            self.cli("export default { name: 'Never execute' };").returncode, 2
        )


if __name__ == "__main__":
    unittest.main()
