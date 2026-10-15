#!/usr/bin/env python3
"""Offline JSON authoring preflight, NOT the authoritative elizaOS schema."""

import argparse
import json
from pathlib import Path
import re
import sys

HOST = set(
    "name username bio system adjectives topics style messageExamples postExamples".split()
)
CORE = HOST | set(
    "id templates plugins settings secrets documents knowledge advancedPlanning advancedMemory".split()
)
CREDENTIAL = re.compile(
    r"(?:api[_-]?key|password|secret|(?:^|[_-])token$|private[_-]?key|database[_-]?url)",
    re.I,
)


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON key")
        result[key] = value
    return result


def reject_constant(_):
    raise ValueError("non-finite JSON number")


def preflight(data, target="core"):
    errors, warnings = [], []

    def error(path, message):
        errors.append({"path": path, "message": message})

    def strings(value):
        return isinstance(value, list) and all(isinstance(v, str) for v in value)

    if not isinstance(data, dict):
        return [{"path": "$", "message": "expected one character object"}], []
    if set(data) - (CORE if target == "core" else HOST):
        error("$", "unknown top-level fields for target; inspect installed schema")
    if not isinstance(data.get("name"), str) or not data["name"].strip():
        error("$.name", "supply a nonblank name (authoring policy)")
    for field in ("id", "username", "system"):
        if field in data and not isinstance(data[field], str):
            error(f"$.{field}", "expected string")
    if "bio" in data:
        if isinstance(data["bio"], str):
            warnings.append(
                "String bio is an input form; prefer an array for canonical core authoring."
            )
        elif not strings(data["bio"]):
            error("$.bio", "expected string or array of strings")
    for field in ("adjectives", "topics", "postExamples", "plugins"):
        if field in data and not strings(data[field]):
            error(f"$.{field}", "expected array of strings")
    for field in ("advancedPlanning", "advancedMemory"):
        if field in data and not isinstance(data[field], bool):
            error(f"$.{field}", "expected boolean")
    for field in ("settings", "templates", "style", "secrets"):
        if field in data and not isinstance(data[field], dict):
            error(f"$.{field}", "expected object")
    if isinstance(data.get("templates"), dict) and any(
        not isinstance(v, str) for v in data["templates"].values()
    ):
        error("$.templates", "JSON templates must be strings")
    if isinstance(data.get("style"), dict):
        if set(data["style"]) - {"all", "chat", "post"}:
            error("$.style", "unknown style context")
        for field in ("all", "chat", "post"):
            if field in data["style"] and not strings(data["style"][field]):
                error(f"$.style.{field}", "expected array of strings")
    groups = data.get("messageExamples", [])
    if not isinstance(groups, list):
        error("$.messageExamples", "expected array of example groups")
    else:
        for i, group in enumerate(groups):
            path = f"$.messageExamples[{i}]"
            if isinstance(group, list) and target == "core":
                examples = group
                warnings.append(
                    "Nested-array examples need core normalization; prefer {examples: [...]}."
                )
            elif isinstance(group, dict) and set(group) == {"examples"}:
                examples = group["examples"]
            else:
                error(path, "expected {examples: [...]} group for target")
                continue
            if not isinstance(examples, list) or not examples:
                error(path, "supply a nonempty conversation (authoring policy)")
                continue
            for j, message in enumerate(examples):
                mp = f"{path}.examples[{j}]"
                if (
                    not isinstance(message, dict)
                    or not isinstance(message.get("name"), str)
                    or not message["name"].strip()
                ):
                    error(mp, "expected message with nonblank speaker name")
                    continue
                content = message.get("content")
                if (
                    not isinstance(content, dict)
                    or not isinstance(content.get("text"), str)
                    or not content["text"].strip()
                ):
                    error(
                        mp + ".content",
                        "supply nonblank example text (authoring subset)",
                    )
                elif target == "host" and (
                    set(message) - {"name", "content"}
                    or set(content) - {"text", "actions"}
                ):
                    error(
                        mp, "host examples support name, text and optional actions only"
                    )
                if (
                    isinstance(content, dict)
                    and "actions" in content
                    and not strings(content["actions"])
                ):
                    error(mp + ".content.actions", "expected array of strings")
    for field in ("documents", "knowledge"):
        if field in data:
            if not isinstance(data[field], list):
                error(f"$.{field}", "expected array of document descriptors")
            else:
                warnings.append(
                    f"Review {field} with installed loader: string inputs can become filesystem paths, not facts."
                )
    if target == "host":
        for field, limit in (("name", 100), ("username", 50), ("system", 10000)):
            if isinstance(data.get(field), str) and len(data[field]) > limit:
                error(f"$.{field}", "exceeds researched host length limit")
        for field in ("topics", "adjectives"):
            if strings(data.get(field, [])) and any(
                not v or len(v) > 100 for v in data.get(field, [])
            ):
                error(f"$.{field}", "host entries need 1 to 100 characters")

    def inspect_secrets(value):
        if isinstance(value, dict):
            for key, item in value.items():
                if key == "secrets":
                    if item:
                        error(
                            "$",
                            "populated secrets container; remove values from commit-ready character",
                        )
                elif CREDENTIAL.search(key) and item not in (None, "", {}, []):
                    error(
                        "$",
                        "populated credential-like field; use approved host secret storage",
                    )
                inspect_secrets(item)
        elif isinstance(value, list):
            for item in value:
                inspect_secrets(item)

    inspect_secrets(data)
    warnings.append(
        "Preflight only: installed schema, plugins, ingestion and live behavior remain unverified."
    )
    return errors, list(dict.fromkeys(warnings))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--target", choices=("core", "host"), default="core")
    args = parser.parse_args()
    try:
        with args.input.open(encoding="utf-8") as handle:
            data = json.load(
                handle, object_pairs_hook=unique_object, parse_constant=reject_constant
            )
        errors, warnings = preflight(data, args.target)
    except (OSError, ValueError, RecursionError):
        print(
            json.dumps(
                {
                    "status": "unreadable",
                    "message": "Cannot read strict UTF-8 JSON; check file, syntax, duplicate keys and nesting locally.",
                }
            )
        )
        return 2
    print(
        json.dumps(
            {
                "status": "issues" if errors else "preflight-passed",
                "target": args.target,
                "errors": errors,
                "warnings": warnings,
            }
        )
    )
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
