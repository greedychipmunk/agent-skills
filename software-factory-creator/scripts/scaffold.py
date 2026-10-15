#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///
"""Plan/apply a factory without executing project code or overwriting files.

Usage: scaffold.py --root PROJECT --config reviewed.json
       scaffold.py --root PROJECT --config reviewed.json --agents-file agents.md --write
Existing AGENTS.md, SECURITY.md, CI and policy documents are preserved. Manually
merge their missing requirements. Conflicting runner/config files block writes.
"""

import argparse
import importlib.util
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
ASSETS = Path(__file__).resolve().parents[1] / "assets"
spec = importlib.util.spec_from_file_location("factory_check", ASSETS / "check.py")
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)


def plan_files(root, config, agents_file):
    check.validate_config(config, root, require_files=False)
    files = {
        ".factory/config.json": json.dumps(config, indent=2) + "\n",
        ".factory/check.py": (ASSETS / "check.py").read_text(encoding="utf-8"),
        ".factory/policy.md": (ASSETS / "policy.md").read_text(encoding="utf-8"),
        ".factory/OPERATIONS.md": (ASSETS / "OPERATIONS.md").read_text(
            encoding="utf-8"
        ),
        ".factory/tasks/TEMPLATE.md": (ASSETS / "task.md").read_text(encoding="utf-8"),
        "SECURITY.md": (ASSETS / "SECURITY.md").read_text(encoding="utf-8"),
    }
    agents = check.safe_path(root, "AGENTS.md")
    if not agents.exists():
        if agents_file is None:
            raise check.FactoryError(
                "AGENTS.md missing: supply --agents-file derived from project evidence"
            )
        content = agents_file.read_text(encoding="utf-8")
        check.text(content, "generated AGENTS.md")
        files["AGENTS.md"] = content
    if config["ci"]["provider"] == "github":
        files[".github/workflows/factory.yml"] = (ASSETS / "factory.yml").read_text(
            encoding="utf-8"
        )
    elif config["ci"]["provider"] == "existing":
        if not check.safe_path(root, config["ci"]["path"]).is_file():
            raise check.FactoryError(
                "ci.provider=existing requires an existing native CI file"
            )
    actions = []
    if agents.exists():
        if not agents.is_file():
            raise check.FactoryError("AGENTS.md is not a regular file")
        actions.append({"path": "AGENTS.md", "action": "preserve"})
    for relative, content in files.items():
        path = check.safe_path(root, relative)
        # Catch non-directory parent collisions before any write.
        for parent in path.parents:
            if parent == root:
                break
            if parent.exists() and not parent.is_dir():
                raise check.FactoryError(f"parent is not a directory: {relative}")
        if path.exists():
            if not path.is_file():
                raise check.FactoryError(
                    f"destination is not a regular file: {relative}"
                )
            same = path.read_text(encoding="utf-8") == content
            if not same and relative in {".factory/config.json", ".factory/check.py"}:
                raise check.FactoryError(
                    f"conflicting {relative}; review and update manually, no files written"
                )
            action = "unchanged" if same else "preserve"
        else:
            action = "create"
        actions.append({"path": relative, "action": action})
    return files, actions


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, required=True, help="Existing target directory"
    )
    parser.add_argument(
        "--config",
        type=Path,
        required=True,
        help="Reviewed project-specific JSON config",
    )
    parser.add_argument(
        "--agents-file",
        type=Path,
        help="Evidence-derived instructions if root AGENTS.md is absent",
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Apply create-only plan; default is dry run",
    )
    args = parser.parse_args()
    actions = []
    written = []
    try:
        if args.root.is_symlink() or not args.root.is_dir():
            raise check.FactoryError("--root must be an existing non-symlink directory")
        root = args.root.resolve()
        config = check.load_config(args.config)
        files, actions = plan_files(root, config, args.agents_file)
        if args.write:
            for entry in actions:
                if entry["action"] != "create":
                    continue
                path = check.safe_path(root, entry["path"])
                path.parent.mkdir(parents=True, exist_ok=True)
                # Recheck after mkdir, and refuse concurrent overwrites via exclusive creation.
                path = check.safe_path(root, entry["path"])
                with path.open("x", encoding="utf-8") as handle:
                    handle.write(files[entry["path"]])
                written.append(entry["path"])
        print(
            json.dumps(
                {
                    "status": "written" if args.write else "planned",
                    "root": str(root),
                    "files": actions,
                    "written": written,
                    "note": "No project commands ran. Review preserved docs and complete CI/harness setup.",
                }
            )
        )
        return 0
    except (check.FactoryError, OSError, TypeError, ValueError) as exc:
        print(
            json.dumps(
                {
                    "status": "blocked",
                    "error": str(exc),
                    "written": written,
                    "note": "If a concurrent write failed, earlier creates may remain; never reset unrelated work.",
                }
            )
        )
        return 2


if __name__ == "__main__":
    sys.exit(main())
