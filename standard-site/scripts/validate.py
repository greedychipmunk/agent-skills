#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "regex>=2024.0.0",
# ]
# ///
"""
Standard.site Lexicon Validator

Validates records against the Standard.site AT Protocol lexicon schemas.

Usage:
  uv run scripts/validate.py --input record.json
  cat record.json | uv run scripts/validate.py --stdin
  uv run scripts/validate.py --input records.json  (array of records)

Supported lexicons:
  - site.standard.publication
  - site.standard.document
  - site.standard.graph.subscription
  - site.standard.graph.recommend
  - site.standard.theme.basic
  - site.standard.theme.color#rgb
  - site.standard.theme.color#rgba

Exit codes:
  0 = all records valid
  1 = one or more records invalid
  2 = usage / input error
"""

import argparse
import json
import re
import sys
from typing import Any

import regex


# ---------------------------------------------------------------------------
# Type constants
# ---------------------------------------------------------------------------

PUBLICATION = "site.standard.publication"
DOCUMENT = "site.standard.document"
SUBSCRIPTION = "site.standard.graph.subscription"
RECOMMEND = "site.standard.graph.recommend"
THEME_BASIC = "site.standard.theme.basic"
COLOR_RGB = "site.standard.theme.color#rgb"
COLOR_RGBA = "site.standard.theme.color#rgba"

SUPPORTED_TYPES = {
    PUBLICATION,
    DOCUMENT,
    SUBSCRIPTION,
    RECOMMEND,
    THEME_BASIC,
    COLOR_RGB,
    COLOR_RGBA,
}

# AT-URI pattern: at://did:plc:xxx/collection/rkey or at://did:web:xxx/collection/rkey
AT_URI_RE = re.compile(r"^at://did:(?:plc:[a-z0-9]+|web:[a-zA-Z0-9._\-]+(?:/[a-zA-Z0-9._\-]+)*)/[a-zA-Z0-9._\-]+/[a-zA-Z0-9._\-]+$")

# DID pattern
DID_RE = re.compile(r"^did:(?:plc:[a-z0-9]+|web:[a-zA-Z0-9._\-]+(?:/[a-zA-Z0-9._\-]+)*)$")

# ISO 8601 datetime pattern (basic check)
DATETIME_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$"
)


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

class ValidationError:
    def __init__(self, path: str, message: str, severity: str = "error"):
        self.path = path
        self.message = message
        self.severity = severity

    def to_dict(self) -> dict:
        return {"path": self.path, "message": self.message, "severity": self.severity}


def count_graphemes(value: str) -> int:
    """Count user-perceived characters (grapheme clusters)."""
    return len(regex.findall(r"\X", value))


def is_integer(value: Any) -> bool:
    """Check if value is an integer (not a bool, not a float)."""
    return isinstance(value, int) and not isinstance(value, bool)


def is_string(value: Any) -> bool:
    return isinstance(value, str)


def is_boolean(value: Any) -> bool:
    return isinstance(value, bool)


def is_datetime(value: Any) -> bool:
    if not is_string(value):
        return False
    return bool(DATETIME_RE.match(value))


def is_at_uri(value: Any) -> bool:
    if not is_string(value):
        return False
    return bool(AT_URI_RE.match(value))


def is_did(value: Any) -> bool:
    if not is_string(value):
        return False
    return bool(DID_RE.match(value))


def is_blob(value: Any) -> bool:
    if not isinstance(value, dict):
        return False
    if value.get("$type") != "blob":
        return False
    ref = value.get("ref")
    if not isinstance(ref, dict) or "$link" not in ref:
        return False
    if not is_string(ref.get("$link")):
        return False
    if not is_string(value.get("mimeType")):
        return False
    if not is_integer(value.get("size")):
        return False
    return True


def check_string_field(
    record: dict,
    field: str,
    errors: list,
    required: bool = True,
    max_length: int | None = None,
    max_graphemes: int | None = None,
    context: str = "",
) -> None:
    """Validate a string field with optional length/grapheme constraints."""
    path = f"{context}{field}" if context else field
    if field not in record:
        if required:
            errors.append(ValidationError(path, f"Required property '{field}' is missing"))
        return
    value = record[field]
    if not is_string(value):
        errors.append(ValidationError(path, f"'{field}' must be a string, got {type(value).__name__}"))
        return
    if max_length is not None and len(value) > max_length:
        errors.append(
            ValidationError(path, f"'{field}' exceeds maxLength {max_length} (got {len(value)})")
        )
    if max_graphemes is not None:
        gc = count_graphemes(value)
        if gc > max_graphemes:
            errors.append(
                ValidationError(path, f"'{field}' exceeds maxGraphemes {max_graphemes} (got {gc})")
            )


def check_datetime_field(
    record: dict,
    field: str,
    errors: list,
    required: bool = True,
    context: str = "",
) -> None:
    path = f"{context}{field}" if context else field
    if field not in record:
        if required:
            errors.append(ValidationError(path, f"Required property '{field}' is missing"))
        return
    value = record[field]
    if not is_datetime(value):
        errors.append(
            ValidationError(
                path,
                f"'{field}' must be an ISO 8601 datetime string (e.g. '2024-01-20T14:30:00.000Z'), got: {value!r}",
            )
        )


def check_at_uri_field(
    record: dict,
    field: str,
    errors: list,
    required: bool = True,
    context: str = "",
) -> None:
    path = f"{context}{field}" if context else field
    if field not in record:
        if required:
            errors.append(ValidationError(path, f"Required property '{field}' is missing"))
        return
    value = record[field]
    if not is_at_uri(value):
        errors.append(
            ValidationError(
                path,
                f"'{field}' must be a valid AT-URI (e.g. 'at://did:plc:abc123/site.standard.publication/rkey'), got: {value!r}",
            )
        )


def check_blob_field(
    record: dict,
    field: str,
    errors: list,
    required: bool = False,
    context: str = "",
) -> None:
    path = f"{context}{field}" if context else field
    if field not in record:
        if required:
            errors.append(ValidationError(path, f"Required property '{field}' is missing"))
        return
    value = record[field]
    if not is_blob(value):
        errors.append(
            ValidationError(
                path,
                f"'{field}' must be a blob object with $type='blob', ref.$link (string), mimeType (string), and size (integer)",
            )
        )


def check_rgb_color(value: Any, path: str, errors: list) -> None:
    """Validate a site.standard.theme.color#rgb object."""
    if not isinstance(value, dict):
        errors.append(ValidationError(path, f"Must be a color object, got {type(value).__name__}"))
        return
    if value.get("$type") != COLOR_RGB and value.get("$type") != COLOR_RGBA:
        errors.append(
            ValidationError(
                f"{path}.$type",
                f"Must be '{COLOR_RGB}' or '{COLOR_RGBA}', got: {value.get('$type')!r}",
            )
        )
    for channel in ("r", "g", "b"):
        ch_path = f"{path}.{channel}"
        if channel not in value:
            errors.append(ValidationError(ch_path, f"Required color channel '{channel}' is missing"))
        elif not is_integer(value[channel]):
            errors.append(
                ValidationError(ch_path, f"'{channel}' must be an integer, got {type(value[channel]).__name__}")
            )
        elif not (0 <= value[channel] <= 255):
            errors.append(
                ValidationError(ch_path, f"'{channel}' must be 0-255, got {value[channel]}")
            )
    # Check alpha if RGBA
    if value.get("$type") == COLOR_RGBA:
        if "a" not in value:
            errors.append(ValidationError(f"{path}.a", "Required alpha channel 'a' is missing for rgba color"))
        elif not is_integer(value["a"]):
            errors.append(
                ValidationError(f"{path}.a", f"'a' must be an integer, got {type(value['a']).__name__}")
            )
        elif not (0 <= value["a"] <= 100):
            errors.append(ValidationError(f"{path}.a", f"'a' must be 0-100, got {value['a']}"))


def check_theme(value: Any, path: str, errors: list) -> None:
    """Validate a site.standard.theme.basic object."""
    if not isinstance(value, dict):
        errors.append(ValidationError(path, f"Must be a theme object, got {type(value).__name__}"))
        return
    if value.get("$type") != THEME_BASIC:
        errors.append(
            ValidationError(
                f"{path}.$type",
                f"Must be '{THEME_BASIC}', got: {value.get('$type')!r}",
            )
        )
    for role in ("background", "foreground", "accent", "accentForeground"):
        role_path = f"{path}.{role}"
        if role not in value:
            errors.append(ValidationError(role_path, f"Required theme color '{role}' is missing"))
        else:
            check_rgb_color(value[role], role_path, errors)


def check_contributor(value: Any, index: int, errors: list) -> None:
    """Validate a document contributor object."""
    path = f"contributors[{index}]"
    if not isinstance(value, dict):
        errors.append(ValidationError(path, f"Contributor must be an object, got {type(value).__name__}"))
        return
    # did (required)
    if "did" not in value:
        errors.append(ValidationError(f"{path}.did", "Required property 'did' is missing"))
    elif not is_did(value["did"]):
        errors.append(
            ValidationError(
                f"{path}.did",
                f"'did' must be a valid DID (e.g. 'did:plc:abc123'), got: {value['did']!r}",
            )
        )
    # role (optional, maxLength 1000, maxGraphemes 100)
    check_string_field(value, "role", errors, required=False, max_length=1000, max_graphemes=100, context=f"{path}.")
    # displayName (optional, maxLength 1000, maxGraphemes 100)
    check_string_field(value, "displayName", errors, required=False, max_length=1000, max_graphemes=100, context=f"{path}.")


def check_tags(value: Any, errors: list) -> None:
    """Validate the tags array on a document."""
    if not isinstance(value, list):
        errors.append(ValidationError("tags", f"'tags' must be an array, got {type(value).__name__}"))
        return
    for i, tag in enumerate(value):
        tag_path = f"tags[{i}]"
        if not is_string(tag):
            errors.append(ValidationError(tag_path, f"Tag must be a string, got {type(tag).__name__}"))
            continue
        if len(tag) > 1280:
            errors.append(ValidationError(tag_path, f"Tag exceeds maxLength 1280 (got {len(tag)})"))
        gc = count_graphemes(tag)
        if gc > 128:
            errors.append(ValidationError(tag_path, f"Tag exceeds maxGraphemes 128 (got {gc})"))
        if tag.startswith("#"):
            errors.append(ValidationError(tag_path, f"Tag should not start with '#': '{tag}'"))


def check_preferences(value: Any, errors: list) -> None:
    """Validate the preferences object on a publication."""
    if not isinstance(value, dict):
        errors.append(ValidationError("preferences", f"Must be an object, got {type(value).__name__}"))
        return
    if "showInDiscover" in value:
        if not is_boolean(value["showInDiscover"]):
            errors.append(
                ValidationError(
                    "preferences.showInDiscover",
                    f"Must be a boolean, got {type(value['showInDiscover']).__name__}",
                )
            )


# ---------------------------------------------------------------------------
# Lexicon validators
# ---------------------------------------------------------------------------

def validate_publication(record: dict, errors: list, warnings: list) -> None:
    """Validate site.standard.publication."""
    # Required
    check_string_field(record, "url", errors, required=True)
    check_string_field(record, "name", errors, required=True, max_length=5000, max_graphemes=500)

    # Check url has no trailing slash (warn, not error)
    if "url" in record and is_string(record["url"]) and record["url"].endswith("/"):
        warnings.append(ValidationError("url", "Has trailing slash — spec recommends avoiding trailing slashes", severity="warning"))

    # Optional
    check_blob_field(record, "icon", errors, required=False)
    check_string_field(record, "description", errors, required=False, max_length=30000, max_graphemes=3000)

    # basicTheme
    if "basicTheme" in record:
        check_theme(record["basicTheme"], "basicTheme", errors)

    # labels — open union, just check it's a dict
    if "labels" in record and not isinstance(record["labels"], dict):
        errors.append(ValidationError("labels", "Must be an object (selfLabels)"))

    # preferences
    if "preferences" in record:
        check_preferences(record["preferences"], errors)


def validate_document(record: dict, errors: list, warnings: list) -> None:
    """Validate site.standard.document."""
    # Required
    check_string_field(record, "site", errors, required=True)
    check_string_field(record, "title", errors, required=True, max_length=5000, max_graphemes=500)
    check_datetime_field(record, "publishedAt", errors, required=True)

    # Check site has no trailing slash (warn)
    if "site" in record and is_string(record["site"]) and record["site"].endswith("/"):
        warnings.append(ValidationError("site", "Has trailing slash — spec recommends avoiding trailing slashes", severity="warning"))

    # Check path has leading slash (warn)
    if "path" in record and is_string(record["path"]) and not record["path"].startswith("/"):
        warnings.append(ValidationError("path", "Should start with a leading slash (e.g. '/blog/post')", severity="warning"))

    # Optional
    check_string_field(record, "path", errors, required=False)
    check_string_field(record, "description", errors, required=False, max_length=30000, max_graphemes=3000)
    check_blob_field(record, "coverImage", errors, required=False)
    check_string_field(record, "textContent", errors, required=False)

    # content — open union, check it's a dict with $type
    if "content" in record:
        content = record["content"]
        if not isinstance(content, dict):
            errors.append(ValidationError("content", f"Must be an object with $type, got {type(content).__name__}"))
        elif "$type" not in content:
            errors.append(ValidationError("content.$type", "Content union entry must specify a $type"))

    # bskyPostRef — ref, check it's a dict with $link
    if "bskyPostRef" in record:
        ref = record["bskyPostRef"]
        if not isinstance(ref, dict):
            errors.append(ValidationError("bskyPostRef", f"Must be a ref object, got {type(ref).__name__}"))
        elif "$link" not in ref and "uri" not in ref:
            errors.append(ValidationError("bskyPostRef", "Ref must contain $link or uri"))

    # tags
    if "tags" in record:
        check_tags(record["tags"], errors)

    # links — open union
    if "links" in record and not isinstance(record["links"], dict):
        errors.append(ValidationError("links", f"Must be an object (open union), got {type(record['links']).__name__}"))

    # labels — open union
    if "labels" in record and not isinstance(record["labels"], dict):
        errors.append(ValidationError("labels", "Must be an object (selfLabels)"))

    # contributors
    if "contributors" in record:
        contribs = record["contributors"]
        if not isinstance(contribs, list):
            errors.append(ValidationError("contributors", f"Must be an array, got {type(contribs).__name__}"))
        else:
            for i, contrib in enumerate(contribs):
                check_contributor(contrib, i, errors)

    # updatedAt
    check_datetime_field(record, "updatedAt", errors, required=False)


def validate_subscription(record: dict, errors: list, warnings: list) -> None:
    """Validate site.standard.graph.subscription."""
    check_at_uri_field(record, "publication", errors, required=True)
    check_datetime_field(record, "createdAt", errors, required=False)


def validate_recommend(record: dict, errors: list, warnings: list) -> None:
    """Validate site.standard.graph.recommend."""
    check_at_uri_field(record, "document", errors, required=True)
    check_datetime_field(record, "createdAt", errors, required=True)


def validate_theme_basic(record: dict, errors: list, warnings: list) -> None:
    """Validate site.standard.theme.basic."""
    check_theme(record, "", errors)


def validate_color_rgb(record: dict, errors: list, warnings: list) -> None:
    """Validate site.standard.theme.color#rgb."""
    check_rgb_color(record, "", errors)


def validate_color_rgba(record: dict, errors: list, warnings: list) -> None:
    """Validate site.standard.theme.color#rgba."""
    check_rgb_color(record, "", errors)


VALIDATORS = {
    PUBLICATION: validate_publication,
    DOCUMENT: validate_document,
    SUBSCRIPTION: validate_subscription,
    RECOMMEND: validate_recommend,
    THEME_BASIC: validate_theme_basic,
    COLOR_RGB: validate_color_rgb,
    COLOR_RGBA: validate_color_rgba,
}


# ---------------------------------------------------------------------------
# Main validation entry point
# ---------------------------------------------------------------------------

def validate_record(record: Any) -> dict:
    """Validate a single record. Returns a result dict."""
    errors: list[ValidationError] = []
    warnings: list[ValidationError] = []

    if not isinstance(record, dict):
        return {
            "valid": False,
            "recordType": None,
            "errors": [ValidationError("", f"Record must be a JSON object, got {type(record).__name__}").to_dict()],
            "warnings": [],
        }

    rtype = record.get("$type")
    if not rtype:
        return {
            "valid": False,
            "recordType": None,
            "errors": [ValidationError("$type", "Required property '$type' is missing").to_dict()],
            "warnings": [],
        }

    if rtype not in SUPPORTED_TYPES:
        return {
            "valid": False,
            "recordType": rtype,
            "errors": [
                ValidationError(
                    "$type",
                    f"Unsupported type: {rtype!r}. Supported types: {', '.join(sorted(SUPPORTED_TYPES))}",
                ).to_dict()
            ],
            "warnings": [],
        }

    validator = VALIDATORS[rtype]
    validator(record, errors, warnings)

    return {
        "valid": len(errors) == 0,
        "recordType": rtype,
        "errors": [e.to_dict() for e in errors],
        "warnings": [w.to_dict() for w in warnings],
    }


def validate_records(data: Any) -> list[dict]:
    """Validate a single record or array of records."""
    if isinstance(data, list):
        return [validate_record(r) for r in data]
    return [validate_record(data)]


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def print_usage() -> None:
    print(
        "Standard.site Lexicon Validator\n\n"
        "Usage:\n"
        "  uv run scripts/validate.py --input <file>     Validate records from a JSON file\n"
        "  uv run scripts/validate.py --stdin            Validate records from stdin\n\n"
        "Input can be a single JSON object or a JSON array of objects.\n\n"
        "Supported lexicons:\n"
        "  site.standard.publication\n"
        "  site.standard.document\n"
        "  site.standard.graph.subscription\n"
        "  site.standard.graph.recommend\n"
        "  site.standard.theme.basic\n"
        "  site.standard.theme.color#rgb\n"
        "  site.standard.theme.color#rgba\n\n"
        "Exit codes:\n"
        "  0 = all records valid\n"
        "  1 = one or more records invalid\n"
        "  2 = usage / input error",
        file=sys.stderr,
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate Standard.site lexicon records",
        add_help=False,
    )
    parser.add_argument("--help", action="help", help="Show this help message")
    parser.add_argument("--input", metavar="FILE", help="Path to JSON file to validate")
    parser.add_argument("--stdin", action="store_true", help="Read JSON from stdin")

    try:
        args = parser.parse_args()
    except SystemExit as e:
        # argparse --help exits with 0, errors exit with 2
        sys.exit(e.code if e.code is not None else 2)

    if not args.input and not args.stdin:
        print_usage()
        sys.exit(2)

    # Read JSON
    if args.stdin:
        raw = sys.stdin.read()
    else:
        try:
            with open(args.input, "r", encoding="utf-8") as f:
                raw = f.read()
        except FileNotFoundError:
            print(f"Error: File not found: {args.input}", file=sys.stderr)
            sys.exit(2)
        except OSError as e:
            print(f"Error: Could not read file: {e}", file=sys.stderr)
            sys.exit(2)

    # Parse JSON
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON: {e}", file=sys.stderr)
        sys.exit(2)

    # Validate
    results = validate_records(data)
    all_valid = all(r["valid"] for r in results)

    # Output results to stdout
    if len(results) == 1:
        print(json.dumps(results[0], indent=2))
    else:
        print(json.dumps(results, indent=2))

    # Print summary to stderr
    total = len(results)
    valid_count = sum(1 for r in results if r["valid"])
    invalid_count = total - valid_count
    if total == 1:
        status = "valid" if all_valid else "invalid"
        rtype = results[0].get("recordType", "unknown")
        print(f"[{status}] {rtype} — {valid_count} valid, {invalid_count} invalid", file=sys.stderr)
    else:
        print(f"{'All valid' if all_valid else 'Has errors'} — {valid_count}/{total} records valid", file=sys.stderr)

    sys.exit(0 if all_valid else 1)


if __name__ == "__main__":
    main()
