#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///
"""Validate factory configuration; run reviewed commands only with --run.

No sandbox or security scanner is implemented here. Commands execute arbitrary
project code with the caller's privileges. Use a disposable, secret-free host.
JSON results go to stdout; command output and diagnostics go to stderr.
"""

import argparse
from datetime import date
import json
import os
from pathlib import Path, PurePosixPath
import re
import signal
import subprocess
import sys
import time

GATES = (
    "format",
    "lint",
    "typecheck",
    "test",
    "build",
    "secrets",
    "dependencies",
    "sast",
)
WAIVABLE = {"typecheck", "build", "dependencies", "sast"}
PLACEHOLDER = re.compile(r"\b(TODO|TBD|REPLACE_ME|CHANGEME)\b|\{\{", re.I)


class FactoryError(ValueError):
    pass


class Cancelled(KeyboardInterrupt):
    def __init__(self, signum):
        self.exit_code = 128 + signum


def cancel(signum, _frame):
    raise Cancelled(signum)


def text(value, label):
    if not isinstance(value, str) or not value.strip() or PLACEHOLDER.search(value):
        raise FactoryError(f"{label}: supply a non-placeholder string")
    return value


def safe_path(root, value):
    """Allow root-relative paths, never traversal or symlink components."""
    text(value, "path")
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or "\\" in value:
        raise FactoryError(f"path must be root-relative without traversal: {value}")
    current = root
    for part in path.parts:
        current = current / part
        if current.is_symlink():
            raise FactoryError(f"symlink path refused: {value}")
    if not current.resolve().is_relative_to(root.resolve()):
        raise FactoryError(f"path escapes root: {value}")
    return current


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise FactoryError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def load_config(path):
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle, object_pairs_hook=unique_object)
    except (OSError, ValueError) as exc:
        raise FactoryError(f"cannot read JSON config: {exc}") from exc


def fields(value, label, allowed, required=()):
    if not isinstance(value, dict):
        raise FactoryError(f"{label} must be an object")
    if set(value) - set(allowed) or set(required) - set(value):
        raise FactoryError(
            f"{label}: unknown or missing fields; allowed: {', '.join(allowed)}"
        )


def validate_config(config, root, require_files=True):
    root_fields = (
        "schema_version",
        "project",
        "runtimes",
        "commands",
        "setup",
        "gates",
        "ci",
    )
    fields(config, "config", root_fields, root_fields)
    if (
        not isinstance(config, dict)
        or type(config.get("schema_version")) is not int
        or config["schema_version"] != 1
    ):
        raise FactoryError("schema_version must be 1")
    text(config.get("project"), "project")
    runtimes = config.get("runtimes")
    if not isinstance(runtimes, dict) or not runtimes:
        raise FactoryError("runtimes must document tool names and pinned versions")
    for tool, version in runtimes.items():
        text(tool, "runtime name")
        text(version, f"runtime {tool} version")
        if version.lower() in {"latest", "*"}:
            raise FactoryError(f"runtime {tool}: do not use a floating version")
    commands = config.get("commands")
    if not isinstance(commands, dict) or not commands:
        raise FactoryError("commands must contain reviewed argv-based checks")
    for name, command in commands.items():
        if not re.fullmatch(r"[a-z][a-z0-9_-]*", name):
            raise FactoryError(f"invalid command name: {name}")
        fields(
            command,
            f"command {name}",
            ("argv", "cwd", "timeout_seconds", "evidence"),
            ("argv", "timeout_seconds", "evidence"),
        )
        argv = command.get("argv")
        if not isinstance(argv, list) or not argv:
            raise FactoryError(f"command {name}: argv must be a nonempty string array")
        for arg in argv:
            text(arg, f"command {name} argv")
        if Path(argv[0]).name in {
            "sh",
            "bash",
            "zsh",
            "fish",
            "cmd",
            "powershell",
            "pwsh",
        }:
            raise FactoryError(f"command {name}: shell wrappers are not allowed")
        if Path(argv[0]).name in {"true", "echo", "printf", ":"}:
            raise FactoryError(f"command {name}: no-op success commands are not gates")
        cwd = safe_path(root, command.get("cwd", "."))
        if not cwd.is_dir():
            raise FactoryError(f"command {name}: cwd does not exist")
        timeout = command.get("timeout_seconds")
        if type(timeout) is not int or not 1 <= timeout <= 1800:
            raise FactoryError(f"command {name}: timeout_seconds must be 1..1800")
        text(command.get("evidence"), f"command {name} source evidence")
    setup = config.get("setup")
    if not isinstance(setup, list) or any(name not in commands for name in setup):
        raise FactoryError("setup must list registered commands (or [] for no install)")
    gates = config.get("gates")
    if not isinstance(gates, dict) or set(gates) != set(GATES):
        raise FactoryError(f"gates must contain exactly: {', '.join(GATES)}")
    for name, gate in gates.items():
        fields(gate, f"gate {name}", ("commands", "waiver"))
        if "waiver" in gate:
            if "commands" in gate or name not in WAIVABLE:
                raise FactoryError(
                    f"gate {name}: waiver not allowed or conflicts with commands"
                )
            waiver = gate["waiver"]
            fields(
                waiver,
                f"gate {name} waiver",
                ("reason", "approved_by", "expires"),
                ("reason", "approved_by", "expires"),
            )
            for field in ("reason", "approved_by", "expires"):
                text(waiver.get(field), f"gate {name} waiver {field}")
            try:
                expires = date.fromisoformat(waiver["expires"])
            except ValueError as exc:
                raise FactoryError(f"gate {name}: expires must be YYYY-MM-DD") from exc
            if expires <= date.today():
                raise FactoryError(f"gate {name}: waiver expired; obtain review")
        else:
            refs = gate.get("commands")
            if (
                not isinstance(refs, list)
                or not refs
                or any(ref not in commands for ref in refs)
            ):
                raise FactoryError(
                    f"gate {name}: requires registered nonempty commands"
                )
    ci = config.get("ci")
    if not isinstance(ci, dict) or ci.get("provider") not in {
        "github",
        "existing",
        "none",
    }:
        raise FactoryError("ci.provider must be github, existing, or none")
    if ci["provider"] == "none":
        fields(ci, "ci", ("provider", "reason"), ("provider", "reason"))
        text(ci.get("reason"), "ci.none reason")
    else:
        fields(ci, "ci", ("provider", "path"), ("provider", "path"))
        ci_path = safe_path(root, ci.get("path"))
        if ci["provider"] == "github" and ci["path"] != ".github/workflows/factory.yml":
            raise FactoryError(
                "github scaffold path must be .github/workflows/factory.yml"
            )
        if require_files and not ci_path.is_file():
            raise FactoryError("CI integration file is missing")
    if require_files:
        for relative in (
            "AGENTS.md",
            "SECURITY.md",
            ".factory/check.py",
            ".factory/policy.md",
            ".factory/OPERATIONS.md",
            ".factory/tasks/TEMPLATE.md",
        ):
            if not safe_path(root, relative).is_file():
                raise FactoryError(f"required file missing: {relative}")
    return config


def group_exists(pid):
    try:
        os.killpg(pid, 0)
        return True
    except ProcessLookupError:
        return False


def kill_group(pid):
    try:
        os.killpg(pid, signal.SIGKILL)
    except ProcessLookupError:
        pass  # The group may exit between observation and cleanup.


def run_command(name, command, root):
    print(f"factory: running {name}", file=sys.stderr, flush=True)
    started = time.monotonic()
    process = None
    try:
        process = subprocess.Popen(
            command["argv"],
            cwd=safe_path(root, command.get("cwd", ".")),
            stdin=subprocess.DEVNULL,
            stdout=sys.stderr,
            stderr=sys.stderr,
            shell=False,
            start_new_session=True,
        )
        code = process.wait(timeout=command["timeout_seconds"])
        status = "passed" if code == 0 else "failed"
    except subprocess.TimeoutExpired:
        kill_group(process.pid)
        process.wait()
        code, status = None, "timeout"
    except KeyboardInterrupt:
        if process is not None:
            kill_group(process.pid)
            process.wait()
        raise
    except OSError as exc:
        print(f"factory: {name}: {exc}", file=sys.stderr)
        code, status = None, "unavailable"
    # A successful immediate parent must not leave background work behind.
    # Detached sessions still require external sandbox/resource enforcement.
    if process is not None and group_exists(process.pid):
        kill_group(process.pid)
        if status == "passed":
            status = "background-process"
    return {
        "command": name,
        "status": status,
        "exit_code": code,
        "duration_seconds": round(time.monotonic() - started, 3),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, default=Path(__file__).resolve().parents[1]
    )
    parser.add_argument(
        "--run", action="store_true", help="Execute reviewed checks; NOT a sandbox"
    )
    parser.add_argument(
        "--setup",
        action="store_true",
        help="Run registered setup first; requires --run",
    )
    args = parser.parse_args()
    if args.setup and not args.run:
        parser.error("--setup requires --run")
    root = args.root.resolve()
    try:
        config = validate_config(
            load_config(safe_path(root, ".factory/config.json")), root
        )
        waived = {
            name: gate["waiver"]
            for name, gate in config["gates"].items()
            if "waiver" in gate
        }
        ci = dict(
            config["ci"],
            status="unavailable"
            if config["ci"]["provider"] == "none"
            else "unverified",
        )
        if not args.run:
            print(
                json.dumps(
                    {
                        "status": "configured",
                        "executed": False,
                        "waivers": waived,
                        "ci": ci,
                        "note": "Structure only; no gate or policy enforcement was verified.",
                    }
                )
            )
            return 0
        if os.name != "posix":
            raise FactoryError(
                "--run requires Linux/macOS process-group timeout support"
            )
        signal.signal(signal.SIGTERM, cancel)
        signal.signal(signal.SIGINT, cancel)
        names = list(config["setup"]) if args.setup else []
        for gate in GATES:
            names.extend(config["gates"][gate].get("commands", []))
        results = []
        for name in dict.fromkeys(names):
            result = run_command(name, config["commands"][name], root)
            results.append(result)
            if result["status"] != "passed":
                print(
                    json.dumps(
                        {
                            "status": "failed",
                            "results": results,
                            "waivers": waived,
                            "ci": ci,
                            "note": "Fail-fast: subsequent commands did not run.",
                        }
                    )
                )
                return 1
        print(
            json.dumps(
                {
                    "status": "passed",
                    "results": results,
                    "waivers": waived,
                    "ci": ci,
                    "note": "Command exits only; approval and test adequacy require review.",
                }
            )
        )
        return 0
    except (FactoryError, TypeError, OSError) as exc:
        print(json.dumps({"status": "blocked", "error": str(exc)}))
        return 2
    except KeyboardInterrupt as exc:
        code = getattr(exc, "exit_code", 130)
        print(json.dumps({"status": "cancelled", "exit_code": code}))
        return code


if __name__ == "__main__":
    sys.exit(main())
