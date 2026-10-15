"""Run with: python3 -m unittest discover -s tests/elizaos-runtime-diagnostics -v"""

import importlib.util
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[2] / "elizaos-runtime-diagnostics/scripts/offline_report.py"
SPEC = importlib.util.spec_from_file_location("offline_report", SCRIPT)
helper = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(helper)


class KeysOnlyEnvironment:
    def __iter__(self):
        return iter(["OPENAI_API_KEY", "EMPTY_KEY", "UNREQUESTED_SECRET"])

    def __contains__(self, key):
        raise AssertionError("Mapping membership could read values")

    def __getitem__(self, key):
        raise AssertionError("Environment values must never be accessed")


class OfflineReportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.manifest = self.root / "package.json"

    def write(self, value):
        self.manifest.write_text(json.dumps(value), encoding="utf-8")
        return str(self.manifest)

    def test_empty_request_reads_nothing(self):
        with patch.object(helper, "read_manifest", side_effect=AssertionError), \
             patch.object(helper.os, "environ", KeysOnlyEnvironment()):
            result = helper.report()
        self.assertEqual(result["environment"], {})
        self.assertEqual(result["manifests"], [])

    def test_only_requested_environment_names_without_values(self):
        result = helper.report(["OPENAI_API_KEY", "EMPTY_KEY", "MISSING", "EMPTY_KEY"],
                               environ=KeysOnlyEnvironment())
        self.assertEqual(result["environment"], {
            "OPENAI_API_KEY": {"present": True}, "EMPTY_KEY": {"present": True},
            "MISSING": {"present": False}})
        self.assertNotIn("UNREQUESTED_SECRET", json.dumps(result))

    def test_no_network_or_subprocess(self):
        path = self.write({"version": "2.0.4", "scripts": {"start": "do not run"}})
        with patch.object(socket, "socket", side_effect=AssertionError), \
             patch.object(subprocess, "Popen", side_effect=AssertionError), \
             patch.object(os, "system", side_effect=AssertionError):
            self.assertEqual(helper.report(manifests=[path])["manifests"][0]["status"], "ok")

    def test_manifest_excludes_bodies_unknown_keys_paths_and_engine_values(self):
        secret = "SENTINEL_DO_NOT_DISCLOSE"
        path = self.write({"version": "2.0.3-beta.7", "scripts": {
            "start": secret, secret: secret, "test": 7},
            "engines": {"node": secret}, "packageManager": secret, "privateKey": secret})
        result = helper.report(manifests=[path])
        serialized = json.dumps(result)
        self.assertNotIn(secret, serialized)
        self.assertNotIn(str(self.root), serialized)
        item = result["manifests"][0]
        self.assertEqual(item["known_scripts"], ["start"])
        self.assertEqual(item["version"], "2.0.3-beta.7")
        self.assertTrue(item["node_engine_declared"])

    def test_invalid_version_not_echoed(self):
        path = self.write({"version": "SECRET", "scripts": {}})
        self.assertIsNone(helper.read_manifest(path)["version"])

    def test_malformed_and_duplicate_json_not_echoed(self):
        for content in ('{"SECRET":', '{"scripts": {}, "scripts": {"start": "SECRET"}}'):
            self.manifest.write_text(content)
            result = helper.read_manifest(self.manifest)
            self.assertEqual(result["status"], "unreadable_or_invalid_json")
            self.assertNotIn("SECRET", json.dumps(result))

    def test_invalid_shapes(self):
        for value in ([], None, {"scripts": []}, {"scripts": None}):
            self.assertEqual(helper.read_manifest(self.write(value))["status"], "invalid_manifest_shape")

    def test_oversized_manifest(self):
        self.manifest.write_bytes(b"x" * (helper.MAX_BYTES + 1))
        self.assertEqual(helper.read_manifest(self.manifest)["status"], "too_large")

    def test_non_manifest_file_not_read(self):
        config = self.root / "config.json"
        config.write_text("SECRET")
        self.assertEqual(helper.read_manifest(config)["status"], "expected_package_json")

    def test_symlink_leaf(self):
        target = self.root / "target.json"
        target.write_text("SECRET")
        self.manifest.symlink_to(target)
        self.assertEqual(helper.read_manifest(self.manifest)["status"], "symlink_rejected")

    def test_symlink_parent(self):
        real = self.root / "real"
        real.mkdir()
        (real / "package.json").write_text("SECRET")
        link = self.root / "link"
        link.symlink_to(real, target_is_directory=True)
        self.assertEqual(helper.read_manifest(link / "package.json")["status"], "symlink_rejected")

    def test_nonregular_directory_and_fifo(self):
        self.manifest.mkdir()
        self.assertEqual(helper.read_manifest(self.manifest)["status"], "regular_file_required")
        self.manifest.rmdir()
        os.mkfifo(self.manifest)
        self.assertEqual(helper.read_manifest(self.manifest)["status"], "regular_file_required")

    def test_invalid_and_excessive_inputs(self):
        for names in (["bad-name"], ["KEY=SECRET"], ["A"] * 65):
            with self.assertRaisesRegex(ValueError, "^invalid_env_request$"):
                helper.report(env_names=names)
        with self.assertRaisesRegex(ValueError, "^too_many_manifests$"):
            helper.report(manifests=["package.json"] * 9)

    def test_missing_file_does_not_echo_path(self):
        result = helper.read_manifest(self.manifest)
        self.assertEqual(result, {"status": "unreadable_or_invalid_json"})

    def test_cli_exit_codes_and_empty_value_presence(self):
        env = dict(os.environ, EMPTY_KEY="", UNREQUESTED_SECRET="SENTINEL")
        completed = subprocess.run(["python3", str(SCRIPT), "--env", "EMPTY_KEY"],
                                   env=env, capture_output=True, text=True, check=False)
        self.assertEqual(completed.returncode, 0)
        self.assertTrue(json.loads(completed.stdout)["environment"]["EMPTY_KEY"]["present"])
        self.assertNotIn("SENTINEL", completed.stdout + completed.stderr)
        invalid = subprocess.run(["python3", str(SCRIPT), "--env", "KEY=SECRET"],
                                 capture_output=True, text=True, check=False)
        self.assertEqual(invalid.returncode, 2)
        self.assertNotIn("SECRET", invalid.stdout + invalid.stderr)
        missing = subprocess.run(["python3", str(SCRIPT), "--manifest", str(self.manifest)],
                                 capture_output=True, text=True, check=False)
        self.assertEqual(missing.returncode, 1)


if __name__ == "__main__":
    unittest.main()
