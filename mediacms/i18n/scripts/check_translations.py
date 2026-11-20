#!/usr/bin/env python3
"""Compare MediaCMS frontend translation files against the en.py master.

Each language file defines translation_strings and replacement_strings dicts.
This script reports, per language: keys missing relative to en.py (fix with
`python manage.py process_translations`), stale keys not present in en.py,
and how many strings are still untranslated (empty value). Standard library only.

Usage:
    python check_translations.py en.py de.py
    python check_translations.py --dir files/frontend_translations
"""

import argparse
import ast
import json
import os
import sys

DICT_NAMES = ("translation_strings", "replacement_strings")


def extract_dicts(source):
    """Return {dict_name: {key: value}} for the module-level dicts."""
    tree = ast.parse(source)
    found = {}
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1 \
                and isinstance(node.targets[0], ast.Name) \
                and node.targets[0].id in DICT_NAMES \
                and isinstance(node.value, ast.Dict):
            entries = {}
            for key_node, value_node in zip(node.value.keys, node.value.values):
                if isinstance(key_node, ast.Constant) and isinstance(value_node, ast.Constant):
                    entries[key_node.value] = value_node.value
            found[node.targets[0].id] = entries
    return found


def load_file(path):
    """Load one translation file. Returns (dicts, error_message)."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            source = fh.read()
    except OSError as err:
        return None, "cannot read file: %s" % err
    try:
        return extract_dicts(source), None
    except SyntaxError as err:
        return None, "syntax error: %s" % err


def compare(master, target):
    """Compare target dicts against master. Returns a result dict."""
    result = {"missing": [], "stale": [], "untranslated": 0, "total": 0}
    for dict_name in DICT_NAMES:
        master_keys = set(master.get(dict_name, {}))
        target_entries = target.get(dict_name, {})
        target_keys = set(target_entries)
        for key in sorted(master_keys - target_keys):
            result["missing"].append((dict_name, key))
        for key in sorted(target_keys - master_keys):
            result["stale"].append((dict_name, key))
        for key, value in target_entries.items():
            result["total"] += 1
            if value == "":
                result["untranslated"] += 1
    return result


def language_code_from_path(path):
    return os.path.splitext(os.path.basename(path))[0]


def check_pair(master_path, target_path):
    """Full check of one target against one master. Returns
    (language, result, errors) where errors is a list of strings."""
    master, err = load_file(master_path)
    if err:
        return None, None, [err]
    target, err = load_file(target_path)
    if err:
        return language_code_from_path(target_path), None, [err]
    language = language_code_from_path(target_path)
    result = compare(master, target)
    errors = []
    if result["missing"]:
        errors.append("%d missing key(s) — run process_translations" % len(result["missing"]))
    if result["stale"]:
        errors.append("%d stale key(s) not in en.py" % len(result["stale"]))
    return language, result, errors


def check_dir(directory, as_json=False):
    """Check every language file in a directory against en.py."""
    master_path = os.path.join(directory, "en.py")
    if not os.path.isfile(master_path):
        return 2, "no en.py in %s" % directory
    failures = 0
    names = sorted(n for n in os.listdir(directory)
                   if n.endswith(".py") and n not in ("__init__.py", "en.py"))
    for name in names:
        language, result, errors = check_pair(master_path, os.path.join(directory, name))
        if as_json:
            print(json.dumps({"language": language,
                              "missing": len(result["missing"]) if result else None,
                              "stale": len(result["stale"]) if result else None,
                              "untranslated": result["untranslated"] if result else None,
                              "total": result["total"] if result else None,
                              "errors": errors}, sort_keys=True))
        else:
            if errors:
                for error in errors:
                    print("FAIL %-8s %s" % (language, error))
                failures += 1
            else:
                print("PASS %-8s %d keys, %d untranslated" % (
                    language, result["total"], result["untranslated"]))
    if not names:
        print("no language files found in %s" % directory)
    return (1 if failures else 0), None


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Check MediaCMS translation files against en.py")
    parser.add_argument("master", nargs="?", help="Path to en.py (or use --dir)")
    parser.add_argument("target", nargs="?", help="Path to a language file")
    parser.add_argument("--dir", dest="directory",
                        help="Check all languages in this directory against en.py")
    parser.add_argument("--json", action="store_true", help="JSON lines output")
    args = parser.parse_args(argv)

    if args.directory:
        rc, message = check_dir(args.directory, as_json=args.json)
        if message:
            print(message)
        return rc
    if not (args.master and args.target):
        parser.error("give MASTER TARGET files, or --dir")

    language, result, errors = check_pair(args.master, args.target)
    if args.json:
        print(json.dumps({"language": language,
                          "missing": len(result["missing"]) if result else None,
                          "stale": len(result["stale"]) if result else None,
                          "untranslated": result["untranslated"] if result else None,
                          "total": result["total"] if result else None,
                          "errors": errors}, sort_keys=True))
    else:
        if errors:
            for error in errors:
                print("FAIL %s" % error)
        if result:
            for dict_name, key in result["missing"]:
                print("MISSING %s: %r" % (dict_name, key))
            for dict_name, key in result["stale"]:
                print("STALE  %s: %r" % (dict_name, key))
            print("%s: %d keys, %d untranslated" % (
                language, result["total"], result["untranslated"]))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
