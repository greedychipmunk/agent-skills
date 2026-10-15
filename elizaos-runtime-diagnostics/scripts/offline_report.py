#!/usr/bin/env python3
"""Offline explicit-input inventory; never access environment values or run code."""

import argparse
import json
import os
from pathlib import Path
import re
import stat
import sys

MAX_BYTES = 1024 * 1024
KNOWN_SCRIPTS = (
    "start",
    "dev",
    "dev:local",
    "build",
    "typecheck",
    "lint:check",
    "test",
    "test:e2e",
    "test:integration",
    "test:server",
    "test:core",
    "test:plugins",
    "migrate",
    "migrate:generate",
    "db:cloud:migrate",
)
ENV_NAME = re.compile(r"[A-Z_][A-Z0-9_]{0,127}\Z")
VERSION = re.compile(
    r"[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?\Z"
)


class InvalidManifest(Exception):
    pass


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise InvalidManifest()
        result[key] = value
    return result


def reject_constant(_):
    raise InvalidManifest()


def read_manifest(filename):
    """Read one explicit package.json; return categories, never raw content."""
    path = Path(os.path.abspath(filename))
    if path.name != "package.json":
        return {"status": "expected_package_json"}
    try:
        for component in (*reversed(path.parents), path):
            if component.is_symlink():
                return {"status": "symlink_rejected"}
        if not hasattr(os, "O_NOFOLLOW"):
            return {"status": "safe_open_unsupported"}
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        try:
            metadata = os.fstat(fd)
            if not stat.S_ISREG(metadata.st_mode):
                return {"status": "regular_file_required"}
            if metadata.st_size > MAX_BYTES:
                return {"status": "too_large"}
            content = os.read(fd, MAX_BYTES + 1)
        finally:
            os.close(fd)
        if len(content) > MAX_BYTES:
            return {"status": "too_large"}
        data = json.loads(
            content, object_pairs_hook=unique_object, parse_constant=reject_constant
        )
    except (OSError, ValueError, RecursionError, InvalidManifest):
        return {"status": "unreadable_or_invalid_json"}
    if not isinstance(data, dict):
        return {"status": "invalid_manifest_shape"}
    scripts = data.get("scripts", {})
    if not isinstance(scripts, dict):
        return {"status": "invalid_manifest_shape"}
    version = data.get("version")
    return {
        "status": "ok",
        "version": version
        if isinstance(version, str)
        and len(version) <= 80
        and VERSION.fullmatch(version)
        else None,
        "known_scripts": [
            key for key in KNOWN_SCRIPTS if isinstance(scripts.get(key), str)
        ],
        "node_engine_declared": isinstance(data.get("engines"), dict)
        and "node" in data["engines"],
        "package_manager_declared": "packageManager" in data,
    }


def report(env_names=(), manifests=(), environ=None):
    if len(env_names) > 64 or any(not ENV_NAME.fullmatch(name) for name in env_names):
        raise ValueError("invalid_env_request")
    if len(manifests) > 8:
        raise ValueError("too_many_manifests")
    environ = os.environ if environ is None else environ
    # Mapping membership may call __getitem__ (including os._Environ). Iterate
    # keys only so even an implementation that decodes values is never invoked.
    requested = set(env_names)
    present = requested.intersection(iter(environ)) if requested else set()
    return {
        "schema_version": 1,
        "environment": {
            name: {"present": name in present} for name in sorted(requested)
        },
        "manifests": [
            dict(input_index=index, **read_manifest(path))
            for index, path in enumerate(manifests)
        ],
        "limitations": [
            "presence_is_not_validity",
            "no_runtime_or_network_checks",
            "manifest_commands_not_executed",
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument(
        "--env",
        action="append",
        default=[],
        metavar="NAME",
        help="Report only whether name exists (empty still counts).",
    )
    parser.add_argument(
        "--manifest",
        action="append",
        default=[],
        metavar="PACKAGE_JSON",
        help="Inspect explicit package.json, never script bodies.",
    )
    args = parser.parse_args()
    try:
        output = report(args.env, args.manifest)
    except ValueError as error:
        print(json.dumps({"error": str(error)}))
        return 2
    print(json.dumps(output, indent=2, sort_keys=True))
    return 1 if any(item["status"] != "ok" for item in output["manifests"]) else 0


if __name__ == "__main__":
    sys.exit(main())
