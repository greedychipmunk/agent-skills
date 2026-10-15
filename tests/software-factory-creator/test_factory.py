"""Offline scaffold/runner mechanics, NOT proof of project gate quality.

Success commands below are test doubles only. Real adoption must install and
verify meaningful project-native tests/scanners and protected CI settings.
"""

import copy
from datetime import date, timedelta
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
from unittest import mock

REPO = Path(__file__).resolve().parents[2]
SKILL = REPO / "software-factory-creator"
SCAFFOLD = SKILL / "scripts/scaffold.py"
spec = importlib.util.spec_from_file_location(
    "factory_check", SKILL / "assets/check.py"
)
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)


class FactoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name).resolve()
        self.root = self.base / "project"
        self.root.mkdir()
        self.config_path = self.base / "config.json"
        self.agents_path = self.base / "agents.md"
        self.agents_path.write_text(
            "# Instructions\nPython fixture; real source in app.py; tests in test_app.py.\n"
            "Run python3 -m unittest discover. Follow .factory/policy.md.\n"
        )
        self.config = {
            "schema_version": 1,
            "project": "fixture",
            "runtimes": {"python": "3.11.9"},
            "commands": {
                name: {
                    "argv": [sys.executable, "-B", "-c", "print('test double only')"],
                    "cwd": ".",
                    "timeout_seconds": 10,
                    "evidence": "offline orchestration fixture, not a real project gate",
                }
                for name in check.GATES
            },
            "setup": [],
            "gates": {name: {"commands": [name]} for name in check.GATES},
            "ci": {"provider": "github", "path": ".github/workflows/factory.yml"},
        }

    def scaffold(self, write=False, agents=True, config=None):
        self.config_path.write_text(json.dumps(config or self.config))
        cmd = [
            sys.executable,
            "-B",
            str(SCAFFOLD),
            "--root",
            str(self.root),
            "--config",
            str(self.config_path),
        ]
        if agents:
            cmd += ["--agents-file", str(self.agents_path)]
        if write:
            cmd += ["--write"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return result.returncode, json.loads(result.stdout)

    def runner(self, *flags):
        result = subprocess.run(
            [sys.executable, "-B", str(self.root / ".factory/check.py"), *flags],
            capture_output=True,
            text=True,
            timeout=15,
        )
        return result.returncode, json.loads(result.stdout), result.stderr

    def write_config(self):
        (self.root / ".factory/config.json").write_text(json.dumps(self.config))

    def test_dry_run_has_no_side_effects(self):
        code, report = self.scaffold()
        self.assertEqual(code, 0)
        self.assertEqual(report["status"], "planned")
        self.assertEqual(list(self.root.iterdir()), [])
        self.assertEqual(len(report["files"]), 8)

    def test_new_project_writes_full_minimum(self):
        code, report = self.scaffold(write=True)
        self.assertEqual(code, 0, report)
        self.assertEqual(len(report["written"]), 8)
        self.assertEqual(
            (self.root / "AGENTS.md").read_text(), self.agents_path.read_text()
        )
        code, report, _ = self.runner()
        self.assertEqual(code, 0, report)
        self.assertEqual(report["status"], "configured")
        self.assertIs(report["executed"], False)

    def test_existing_and_nested_instructions_preserved(self):
        original = "# Root instructions\nUse native conventions.\n"
        (self.root / "AGENTS.md").write_text(original)
        package = self.root / "packages/api"
        package.mkdir(parents=True)
        nested = "# API instructions\nUse stricter API conventions.\n"
        (package / "AGENTS.md").write_text(nested)
        (self.root / "SECURITY.md").write_text("Private reporting channel exists.\n")
        (self.root / "unrelated.txt").write_text("user work\n")
        code, report = self.scaffold(write=True, agents=False)
        self.assertEqual(code, 0, report)
        self.assertEqual((self.root / "AGENTS.md").read_text(), original)
        self.assertEqual((package / "AGENTS.md").read_text(), nested)
        self.assertEqual(
            (self.root / "SECURITY.md").read_text(),
            "Private reporting channel exists.\n",
        )
        self.assertEqual((self.root / "unrelated.txt").read_text(), "user work\n")
        self.assertIn({"path": "AGENTS.md", "action": "preserve"}, report["files"])

    def test_staged_unstaged_and_untracked_work_preserved(self):
        def git(*args):
            return subprocess.run(
                ["git", *args],
                cwd=self.root,
                capture_output=True,
                text=True,
                check=True,
            ).stdout

        git("init", "-q")
        tracked = self.root / "tracked.txt"
        tracked.write_text("staged work\n")
        git("add", "tracked.txt")
        tracked.write_text("unstaged work\n")
        untracked = self.root / "untracked.txt"
        untracked.write_text("untracked work\n")
        before = (
            git("diff", "--cached", "--", "tracked.txt"),
            git("diff", "--", "tracked.txt"),
        )
        self.assertEqual(self.scaffold(write=True)[0], 0)
        after = (
            git("diff", "--cached", "--", "tracked.txt"),
            git("diff", "--", "tracked.txt"),
        )
        self.assertEqual(before, after)
        self.assertEqual(untracked.read_text(), "untracked work\n")

    def test_repeated_onboarding_is_idempotent(self):
        self.assertEqual(self.scaffold(write=True)[0], 0)
        before = {
            str(p.relative_to(self.root)): p.read_bytes()
            for p in self.root.rglob("*")
            if p.is_file()
        }
        code, report = self.scaffold(write=True)
        self.assertEqual(code, 0, report)
        self.assertEqual(report["written"], [])
        after = {
            str(p.relative_to(self.root)): p.read_bytes()
            for p in self.root.rglob("*")
            if p.is_file()
        }
        self.assertEqual(before, after)

    def test_missing_agents_input_blocks_all_writes(self):
        code, report = self.scaffold(write=True, agents=False)
        self.assertEqual(code, 2)
        self.assertIn("--agents-file", report["error"])
        self.assertEqual(list(self.root.iterdir()), [])

    def test_unfilled_config_blocks_all_writes(self):
        config = json.loads((SKILL / "assets/config.example.json").read_text())
        code, report = self.scaffold(write=True, config=config)
        self.assertEqual(code, 2)
        self.assertEqual(list(self.root.iterdir()), [])

    def test_placeholder_agents_blocks_writes(self):
        self.agents_path.write_text("# Instructions\nREPLACE_ME\n")
        self.assertEqual(self.scaffold(write=True)[0], 2)
        self.assertEqual(list(self.root.iterdir()), [])

    def test_conflicting_runner_blocks_every_write(self):
        factory = self.root / ".factory"
        factory.mkdir()
        original = "# User-owned runner\n"
        (factory / "check.py").write_text(original)
        code, report = self.scaffold(write=True)
        self.assertEqual(code, 2, report)
        self.assertEqual((factory / "check.py").read_text(), original)
        self.assertFalse((factory / "config.json").exists())
        self.assertFalse((self.root / "AGENTS.md").exists())

    def test_config_change_never_overwrites_existing_config(self):
        self.scaffold(write=True)
        before = (self.root / ".factory/config.json").read_bytes()
        self.config["project"] = "different"
        code, report = self.scaffold(write=True)
        self.assertEqual(code, 2, report)
        self.assertEqual((self.root / ".factory/config.json").read_bytes(), before)

    def test_existing_ci_is_preserved(self):
        path = self.root / ".github/workflows/factory.yml"
        path.parent.mkdir(parents=True)
        path.write_text("name: Existing CI\n")
        code, report = self.scaffold(write=True)
        self.assertEqual(code, 0, report)
        self.assertEqual(path.read_text(), "name: Existing CI\n")
        self.assertIn(
            {"path": ".github/workflows/factory.yml", "action": "preserve"},
            report["files"],
        )

    def test_native_non_github_ci_requires_existing_file(self):
        self.config["ci"] = {"provider": "existing", "path": ".gitlab-ci.yml"}
        self.assertEqual(self.scaffold(write=True)[0], 2)
        (self.root / ".gitlab-ci.yml").write_text("# Native CI\n")
        self.assertEqual(self.scaffold(write=True)[0], 0)
        self.assertFalse((self.root / ".github").exists())

    def test_local_only_ci_requires_reason_and_reports_configured(self):
        self.config["ci"] = {
            "provider": "none",
            "reason": "Explicitly local-only fixture",
        }
        self.assertEqual(self.scaffold(write=True)[0], 0)
        report = self.runner()[1]
        self.assertEqual(report["status"], "configured")
        self.assertEqual(report["ci"]["status"], "unavailable")
        report = self.runner("--run")[1]
        self.assertEqual(report["ci"]["status"], "unavailable")
        self.assertEqual(report["ci"]["reason"], "Explicitly local-only fixture")
        self.assertFalse((self.root / ".github").exists())

    def test_traversal_absolute_and_symlink_cwd_rejected(self):
        outside = self.base / "outside"
        outside.mkdir()
        (self.root / "link").symlink_to(outside, target_is_directory=True)
        for cwd in ("../outside", str(outside), "link"):
            with self.subTest(cwd=cwd):
                config = copy.deepcopy(self.config)
                config["commands"]["test"]["cwd"] = cwd
                self.assertEqual(self.scaffold(write=True, config=config)[0], 2)
                self.assertFalse((self.root / ".factory").exists())

    def test_symlink_destination_never_follows_link(self):
        outside = self.base / "outside"
        outside.mkdir()
        (self.root / ".factory").symlink_to(outside, target_is_directory=True)
        self.assertEqual(self.scaffold(write=True)[0], 2)
        self.assertEqual(list(outside.iterdir()), [])

    def test_parent_file_collision_preflight(self):
        (self.root / ".github").write_text("not a directory")
        self.assertEqual(self.scaffold(write=True)[0], 2)
        self.assertFalse((self.root / ".factory").exists())

    def test_schema_errors_are_blockers(self):
        invalid = []
        for changes in (
            {"gates": {}},
            {"setup": ["missing"]},
            {"runtimes": {}},
            {"allow_failure": True},
            {"schema_version": 2},
            {"schema_version": True},
            {"commands": []},
        ):
            config = copy.deepcopy(self.config)
            config.update(changes)
            invalid.append(config)
        for field, value in (
            ("argv", "echo ok"),
            ("argv", []),
            ("argv", ["true"]),
            ("argv", ["bash", "-c", "true"]),
            ("timeout_seconds", True),
            ("timeout_seconds", 0),
            ("timeout_seconds", 1801),
            ("cwd", "nonexistent"),
            ("evidence", "TBD"),
        ):
            config = copy.deepcopy(self.config)
            config["commands"]["test"][field] = value
            invalid.append(config)
        for config in invalid:
            with self.subTest(config=config):
                self.assertEqual(self.scaffold(write=True, config=config)[0], 2)
        self.assertFalse((self.root / ".factory").exists())

    def test_waiver_constraints(self):
        waiver = {
            "reason": "No typed language in this fixture",
            "approved_by": "fixture approver (not a real approval)",
            "expires": (date.today() + timedelta(days=30)).isoformat(),
        }
        for name in ("format", "lint", "test", "secrets"):
            config = copy.deepcopy(self.config)
            config["gates"][name] = {"waiver": waiver}
            self.assertEqual(self.scaffold(config=config)[0], 2)
        config = copy.deepcopy(self.config)
        config["gates"]["typecheck"] = {"waiver": waiver}
        self.assertEqual(self.scaffold(config=config)[0], 0)
        config["gates"]["typecheck"]["waiver"]["expires"] = date.today().isoformat()
        self.assertEqual(self.scaffold(config=config)[0], 2)

    def test_validation_does_not_execute_commands(self):
        self.config["commands"]["test"]["argv"] = [
            sys.executable,
            "-c",
            "open('side-effect','w').write('bad')",
        ]
        self.scaffold(write=True)
        code, report, _ = self.runner()
        self.assertEqual(code, 0, report)
        self.assertFalse((self.root / "side-effect").exists())

    def test_runner_executes_once_with_clean_json_stdout(self):
        self.config["gates"]["lint"] = {"commands": ["format"]}
        self.scaffold(write=True)
        code, report, stderr = self.runner("--run")
        self.assertEqual(code, 0, report)
        self.assertEqual(report["status"], "passed")
        self.assertEqual(len(report["results"]), 7)
        self.assertIn("test double only", stderr)
        self.assertTrue(
            all(result["status"] == "passed" for result in report["results"])
        )

    def test_fail_fast_leaves_later_gate_not_run(self):
        self.config["commands"]["lint"]["argv"] = [
            sys.executable,
            "-c",
            "raise SystemExit(7)",
        ]
        self.config["commands"]["test"]["argv"] = [
            sys.executable,
            "-c",
            "open('later-gate','w').write('bad')",
        ]
        self.scaffold(write=True)
        code, report, _ = self.runner("--run")
        self.assertEqual(code, 1, report)
        self.assertEqual(report["results"][-1]["exit_code"], 7)
        self.assertEqual(len(report["results"]), 2)
        self.assertFalse((self.root / "later-gate").exists())

    def test_missing_executable_is_failed_not_success(self):
        self.config["commands"]["format"]["argv"] = [
            "factory-fixture-nonexistent-command"
        ]
        self.scaffold(write=True)
        code, report, _ = self.runner("--run")
        self.assertEqual(code, 1, report)
        self.assertEqual(report["results"][0]["status"], "unavailable")

    def test_setup_requires_explicit_flag_and_runs_before_gates(self):
        self.config["commands"]["install"] = {
            "argv": [sys.executable, "-c", "open('installed','w').write('fixture')"],
            "cwd": ".",
            "timeout_seconds": 10,
            "evidence": "setup execution test double only",
        }
        self.config["setup"] = ["install"]
        self.scaffold(write=True)
        self.assertEqual(self.runner("--run")[0], 0)
        self.assertFalse((self.root / "installed").exists())
        code, report, _ = self.runner("--run", "--setup")
        self.assertEqual(code, 0, report)
        self.assertEqual(report["results"][0]["command"], "install")
        self.assertTrue((self.root / "installed").exists())

    @unittest.skipUnless(os.name == "posix", "POSIX timeout groups")
    def test_timeout_kills_child_process_group(self):
        marker = self.root / "child-survived"
        child = f"import time; time.sleep(2.5); open({str(marker)!r}, 'w').write('bad')"
        parent = f"import subprocess,sys,time; subprocess.Popen([sys.executable,'-c',{child!r}]); time.sleep(10)"
        self.config["commands"]["format"]["argv"] = [sys.executable, "-c", parent]
        self.config["commands"]["format"]["timeout_seconds"] = 1
        self.scaffold(write=True)
        code, report, _ = self.runner("--run")
        self.assertEqual(code, 1, report)
        self.assertEqual(report["results"][0]["status"], "timeout")
        time.sleep(1.8)
        self.assertFalse(marker.exists())

    @unittest.skipUnless(os.name == "posix", "POSIX process groups")
    def test_background_child_cannot_outlive_success_or_failure(self):
        for code in (0, 7):
            with self.subTest(code=code):
                command = copy.deepcopy(self.config["commands"]["format"])
                child = "import time; time.sleep(30)"
                parent = (
                    "import subprocess,sys,os; "
                    "open('parent-pid','w').write(str(os.getpid())); "
                    f"subprocess.Popen([sys.executable,'-c',{child!r}]); raise SystemExit({code})"
                )
                command["argv"] = [sys.executable, "-c", parent]
                result = check.run_command("fixture", command, self.root)
                self.assertEqual(
                    result["status"], "background-process" if code == 0 else "failed"
                )
                pid = int((self.root / "parent-pid").read_text())
                # A killed orphan may briefly remain a zombie. The cleanup was
                # issued; test timeout above separately proves no later side effect.
                self.assertEqual(result["exit_code"], code)
                with mock.patch.object(
                    check.os, "killpg", side_effect=ProcessLookupError
                ):
                    check.kill_group(pid)  # Already-gone races must be harmless.

    def test_cleanup_race_does_not_hide_timeout_or_cancellation(self):
        command = self.config["commands"]["format"]
        for exception in (subprocess.TimeoutExpired("fixture", 1), KeyboardInterrupt()):
            process = mock.Mock(pid=123)
            process.wait.side_effect = [exception, 0]
            with (
                mock.patch.object(check.subprocess, "Popen", return_value=process),
                mock.patch.object(check.os, "killpg", side_effect=ProcessLookupError),
            ):
                if isinstance(exception, KeyboardInterrupt):
                    with self.assertRaises(KeyboardInterrupt):
                        check.run_command("fixture", command, self.root)
                else:
                    self.assertEqual(
                        check.run_command("fixture", command, self.root)["status"],
                        "timeout",
                    )

    @unittest.skipUnless(os.name == "posix", "POSIX cancellation")
    def test_sigterm_cancels_runner_and_cleans_command(self):
        self.config["commands"]["format"]["argv"] = [
            sys.executable,
            "-c",
            "import time; open('started','w').write('yes'); time.sleep(2.5); open('survived','w').write('bad')",
        ]
        self.scaffold(write=True)
        process = subprocess.Popen(
            [sys.executable, "-B", str(self.root / ".factory/check.py"), "--run"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        try:
            deadline = time.monotonic() + 5
            while not (self.root / "started").exists() and time.monotonic() < deadline:
                time.sleep(0.01)
            self.assertTrue((self.root / "started").exists())
            process.terminate()
            stdout, _ = process.communicate(timeout=5)
            self.assertEqual(process.returncode, 143)
            self.assertEqual(json.loads(stdout)["status"], "cancelled")
            time.sleep(2.6)
            self.assertFalse((self.root / "survived").exists())
        finally:
            if process.poll() is None:
                process.kill()
                process.communicate()

    def test_multi_package_cwd_and_waiver_reporting(self):
        package = self.root / "packages/api"
        package.mkdir(parents=True)
        (package / "input.txt").write_text("scoped fixture")
        self.config["commands"]["test"]["cwd"] = "packages/api"
        self.config["commands"]["test"]["argv"] = [
            sys.executable,
            "-c",
            "assert open('input.txt').read() == 'scoped fixture'",
        ]
        self.config["gates"]["build"] = {
            "waiver": {
                "reason": "No artifact build in fixture",
                "approved_by": "test approver only",
                "expires": (date.today() + timedelta(days=1)).isoformat(),
            }
        }
        self.scaffold(write=True)
        code, report, _ = self.runner("--run")
        self.assertEqual(code, 0, report)
        self.assertIn("build", report["waivers"])
        self.assertNotIn("build", [item["command"] for item in report["results"]])

    def test_real_python_regression_failure_reaches_factory(self):
        (self.root / "app.py").write_text("def add(a, b):\n    return a + b\n")
        test = self.root / "test_app.py"
        test.write_text(
            "import unittest\nfrom app import add\nclass AddTests(unittest.TestCase):\n"
            "    def test_add(self):\n        self.assertEqual(add(2, 3), 5)\n"
        )
        self.config["commands"]["test"]["argv"] = [
            sys.executable,
            "-B",
            "-m",
            "unittest",
            "discover",
        ]
        self.scaffold(write=True)
        code, report, stderr = self.runner("--run")
        self.assertEqual(code, 0, report)
        self.assertIn("Ran 1 test", stderr)
        (self.root / "app.py").write_text("def add(a, b):\n    return a - b\n")
        code, report, stderr = self.runner("--run")
        self.assertEqual(code, 1, report)
        self.assertEqual(report["results"][-1]["command"], "test")
        self.assertIn("FAILED", stderr)

    def test_missing_required_file_blocks_runner(self):
        self.scaffold(write=True)
        (self.root / "SECURITY.md").unlink()
        self.assertEqual(self.runner("--run")[0], 2)

    def test_invalid_json_blocks_runner(self):
        self.scaffold(write=True)
        (self.root / ".factory/config.json").write_text("not JSON")
        self.assertEqual(self.runner()[0], 2)

    def test_duplicate_json_keys_block_runner(self):
        self.scaffold(write=True)
        content = json.dumps(self.config)
        content = '{"schema_version": 999, ' + content[1:]
        (self.root / ".factory/config.json").write_text(content)
        self.assertEqual(self.runner()[0], 2)


if __name__ == "__main__":
    unittest.main()
