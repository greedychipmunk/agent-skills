#!/usr/bin/env python3
"""Validate Mermaid.js diagram syntax for common errors.

Usage:
    uv run scripts/validate.py --input diagram.mmd
    cat diagram.mmd | uv run scripts/validate.py --stdin

Exit codes:
    0 = valid
    1 = invalid (errors found)
    2 = usage error
"""

# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pyyaml>=6.0",
# ]
# ///

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from enum import Enum

try:
    import yaml
except ImportError:
    print("Error: pyyaml not installed. Run with: uv run scripts/validate.py", file=sys.stderr)
    sys.exit(2)


class Severity(Enum):
    ERROR = "error"
    WARNING = "warning"


@dataclass
class ValidationError:
    line: int
    column: int
    message: str
    severity: str = "error"
    diagram_type: str = ""

    def to_dict(self) -> dict:
        return {
            "line": self.line,
            "column": self.column,
            "message": self.message,
            "severity": self.severity,
            "diagram_type": self.diagram_type,
        }


# Valid diagram type keywords
DIAGRAM_TYPES = {
    "flowchart": "flowchart",
    "graph": "flowchart",
    "sequenceDiagram": "sequence",
    "gantt": "gantt",
    "classDiagram": "class",
    "classDiagram-v2": "class",
    "stateDiagram": "state",
    "stateDiagram-v2": "state",
    "erDiagram": "er",
    "gitGraph": "gitgraph",
    "journey": "journey",
    "quadrantChart": "quadrant",
    "xychart-beta": "xychart",
    "pie": "pie",
    "architecture-beta": "architecture",
    "block-beta": "block",
    "requirementDiagram": "requirement",
    "treemap-beta": "treemap",
    "mindmap": "mindmap",
    "timeline": "timeline",
    "sankey-beta": "sankey",
}

# Diagram types that use "end" as a keyword (breaking word)
END_BREAKING = {"flowchart", "sequence"}

# Diagram types that support frontmatter
FRONTMATTER_SUPPORTED = {"flowchart", "state", "er", "gitgraph", "xychart", "pie", "timeline", "mindmap", "treemap"}


def parse_frontmatter(content: str) -> tuple[dict | None, str, int]:
    """Parse YAML frontmatter. Returns (config, body, body_start_line)."""
    if not content.startswith("---"):
        return None, content, 0

    lines = content.split("\n")
    if len(lines) < 2:
        return None, content, 0

    # Find closing ---
    end_line = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_line = i
            break

    if end_line is None:
        return None, content, 0

    yaml_text = "\n".join(lines[1:end_line])
    body = "\n".join(lines[end_line + 1:])
    body_start_line = end_line + 1

    try:
        config = yaml.safe_load(yaml_text)
        if config is None:
            config = {}
        return config, body, body_start_line
    except yaml.YAMLError as e:
        raise ValueError(f"Invalid frontmatter YAML: {e}")


def find_diagram_type(body: str) -> str | None:
    """Find the diagram type keyword from the body."""
    for line in body.split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith("%%"):
            continue
        # Check for directive
        if stripped.startswith("%%{"):
            continue
        # The first non-empty, non-comment, non-directive line should be the diagram type
        first_word = stripped.split()[0] if stripped.split() else ""
        # Handle directives that may be on the same line
        # e.g., "%%{init: {...}}%% flowchart TD"
        directive_match = re.search(r"%%\{.*?\}%%\s*(.*)", stripped)
        if directive_match:
            remaining = directive_match.group(1).strip()
            if remaining:
                first_word = remaining.split()[0]
        # Check if it matches a known diagram type
        for keyword in DIAGRAM_TYPES:
            if first_word == keyword or first_word.startswith(keyword + " "):
                return DIAGRAM_TYPES[keyword]
        # Also check if the line starts with a known keyword
        for keyword in sorted(DIAGRAM_TYPES.keys(), key=len, reverse=True):
            if stripped.startswith(keyword):
                return DIAGRAM_TYPES[keyword]
        return None
    return None


def check_balanced_brackets(lines: list[str], errors: list[ValidationError], diagram_type: str) -> None:
    """Check for balanced braces, brackets, and parentheses."""
    stack: list[tuple[str, int, int]] = []
    pairs = {"{": "}", "[": "]", "(": ")"}
    closing = set(pairs.values())

    for i, line in enumerate(lines, 1):
        # Skip comment lines
        stripped = line.strip()
        if stripped.startswith("%%"):
            continue

        column = 0
        in_string = False
        string_char = None

        for j, char in enumerate(line):
            column = j + 1

            # Track string state
            if char in ('"', "'"):
                if not in_string:
                    in_string = True
                    string_char = char
                elif string_char == char:
                    in_string = False
                    string_char = None
                continue

            if in_string:
                continue

            if char in pairs:
                stack.append((char, i, column))
            elif char in closing:
                if not stack:
                    errors.append(ValidationError(
                        line=i, column=column,
                        message=f"Unmatched closing '{char}'",
                        severity="error", diagram_type=diagram_type
                    ))
                else:
                    opener, open_line, open_col = stack.pop()
                    expected = pairs[opener]
                    if char != expected:
                        errors.append(ValidationError(
                            line=i, column=column,
                            message=f"Mismatched bracket: '{opener}' at line {open_line}:{open_col} closed by '{char}'",
                            severity="error", diagram_type=diagram_type
                        ))

    for opener, line, col in stack:
        errors.append(ValidationError(
            line=line, column=col,
            message=f"Unclosed '{opener}'",
            severity="error", diagram_type=diagram_type
        ))


def check_end_word(lines: list[str], errors: list[ValidationError], diagram_type: str) -> None:
    """Check for unquoted 'end' keyword in flowcharts and sequence diagrams."""
    if diagram_type not in END_BREAKING:
        return

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("%%"):
            continue

        # Check for 'end' as a standalone word (not in quotes)
        # Skip if it's the actual "end" keyword for subgraph/loop/alt etc.
        if re.match(r"^end\s*$", stripped, re.IGNORECASE):
            continue  # This is the legitimate end keyword

        # Look for 'end' within node text that's not quoted
        # Pattern: word boundaries around 'end' but not inside quotes
        in_string = False
        string_char = None
        for j, char in enumerate(stripped):
            if char in ('"', "'"):
                if not in_string:
                    in_string = True
                    string_char = char
                elif string_char == char:
                    in_string = False
                    string_char = None

        if not in_string:
            # Check for 'end' as part of a word outside quotes
            # Remove quoted sections first
            unquoted = re.sub(r'"[^"]*"', '', stripped)
            unquoted = re.sub(r"'[^']*'", '', unquoted)
            # Look for 'end' as a word or part of a word in node labels
            if re.search(r"\bend\b", unquoted, re.IGNORECASE):
                # Check if it's actually the "end" keyword (closing a block)
                if not re.match(r"^end\b", unquoted.strip(), re.IGNORECASE):
                    errors.append(ValidationError(
                        line=i, column=1,
                        message="The word 'end' can break diagram parsing. Wrap text containing 'end' in quotes, e.g., A[\"weekend\"]",
                        severity="warning", diagram_type=diagram_type
                    ))


def check_flowchart_direction(lines: list[str], errors: list[ValidationError]) -> None:
    """Check flowchart direction is valid."""
    valid_dirs = {"TD", "TB", "BT", "LR", "RL"}
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith(("flowchart", "graph")):
            parts = stripped.split()
            if len(parts) >= 2:
                direction = parts[1]
                if direction not in valid_dirs:
                    errors.append(ValidationError(
                        line=i, column=1,
                        message=f"Invalid flowchart direction '{direction}'. Valid: TD, TB, BT, LR, RL",
                        severity="error", diagram_type="flowchart"
                    ))


def check_gantt_dateformat(lines: list[str], errors: list[ValidationError]) -> None:
    """Check that Gantt charts have dateFormat."""
    has_dateformat = False
    has_tasks = False
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("dateFormat"):
            has_dateformat = True
        if ":" in stripped and not stripped.startswith(("title", "section", "dateFormat", "axisFormat", "excludes", "todayMarker", "compact", "%%")):
            has_tasks = True

    if has_tasks and not has_dateformat:
        errors.append(ValidationError(
            line=1, column=1,
            message="Gantt chart has tasks but no dateFormat declaration. Add: dateFormat YYYY-MM-DD",
            severity="error", diagram_type="gantt"
        ))


def check_pie_values(lines: list[str], errors: list[ValidationError]) -> None:
    """Check pie chart values are positive."""
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if ":" in stripped and not stripped.startswith(("title", "pie", "%%")):
            parts = stripped.split(":")
            if len(parts) >= 2:
                value_str = parts[-1].strip()
                try:
                    value = float(value_str)
                    if value <= 0:
                        errors.append(ValidationError(
                            line=i, column=1,
                            message=f"Pie chart value must be positive, got {value}",
                            severity="error", diagram_type="pie"
                        ))
                except ValueError:
                    pass  # Not a numeric value, skip


def check_sankey_format(lines: list[str], errors: list[ValidationError]) -> None:
    """Check Sankey diagram has 3 CSV columns."""
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped or stripped.startswith("sankey"):
            continue
        # Count commas (respecting quotes)
        in_quote = False
        comma_count = 0
        for char in stripped:
            if char == '"':
                in_quote = not in_quote
            elif char == "," and not in_quote:
                comma_count += 1
        if comma_count != 2:
            errors.append(ValidationError(
                line=i, column=1,
                message=f"Sankey CSV must have exactly 3 columns (source,target,value), found {comma_count + 1}",
                severity="error", diagram_type="sankey"
            ))


def check_quadrant_points(lines: list[str], errors: list[ValidationError]) -> None:
    """Check quadrant chart points are in 0-1 range."""
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        # Match point patterns like "Name: [x, y]"
        match = re.match(r'^(.+?):\s*\[([\d.]+),\s*([\d.]+)\]', stripped)
        if match:
            try:
                x = float(match.group(2))
                y = float(match.group(3))
                if not (0 <= x <= 1):
                    errors.append(ValidationError(
                        line=i, column=1,
                        message=f"Quadrant point x={x} out of range [0, 1]",
                        severity="error", diagram_type="quadrant"
                    ))
                if not (0 <= y <= 1):
                    errors.append(ValidationError(
                        line=i, column=1,
                        message=f"Quadrant point y={y} out of range [0, 1]",
                        severity="error", diagram_type="quadrant"
                    ))
            except ValueError:
                pass


def validate_diagram(content: str) -> list[ValidationError]:
    """Validate a Mermaid diagram and return a list of errors."""
    errors: list[ValidationError] = []

    # Parse frontmatter
    try:
        config, body, body_start_line = parse_frontmatter(content)
    except ValueError as e:
        errors.append(ValidationError(line=1, column=1, message=str(e), severity="error"))
        return errors

    body_lines = body.split("\n")

    # Find diagram type
    diagram_type = find_diagram_type(body)
    if diagram_type is None:
        # Try to find what looks like a diagram type
        for i, line in enumerate(body_lines, 1):
            stripped = line.strip()
            if stripped and not stripped.startswith("%%") and not stripped.startswith("---"):
                first_word = stripped.split()[0] if stripped.split() else ""
                errors.append(ValidationError(
                    line=i + body_start_line, column=1,
                    message=f"Unknown diagram type '{first_word}'. Valid types: {', '.join(sorted(DIAGRAM_TYPES.keys()))}",
                    severity="error"
                ))
                return errors
        errors.append(ValidationError(
            line=1, column=1,
            message="No diagram type found. Diagram must start with a type keyword (e.g., flowchart, sequenceDiagram, gantt)",
            severity="error"
        ))
        return errors

    # Check for balanced brackets
    check_balanced_brackets(body_lines, errors, diagram_type)

    # Check for 'end' breaking word
    check_end_word(body_lines, errors, diagram_type)

    # Diagram-specific checks
    if diagram_type == "flowchart":
        check_flowchart_direction(body_lines, errors)
    elif diagram_type == "gantt":
        check_gantt_dateformat(body_lines, errors)
    elif diagram_type == "pie":
        check_pie_values(body_lines, errors)
    elif diagram_type == "sankey":
        check_sankey_format(body_lines, errors)
    elif diagram_type == "quadrant":
        check_quadrant_points(body_lines, errors)

    return errors


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate Mermaid.js diagram syntax",
        add_help=False,
    )
    parser.add_argument("--help", action="help", help="Show this help message and exit")
    parser.add_argument("--input", "-i", type=str, help="Input .mmd file path")
    parser.add_argument("--stdin", action="store_true", help="Read from stdin")
    args = parser.parse_args()

    if not args.input and not args.stdin:
        parser.print_help(sys.stderr)
        sys.exit(2)

    if args.stdin:
        content = sys.stdin.read()
    else:
        try:
            with open(args.input, "r", encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            print(json.dumps({"valid": False, "error": f"File not found: {args.input}"}))
            sys.exit(2)

    errors = validate_diagram(content)

    result = {
        "valid": len([e for e in errors if e.severity == "error"]) == 0,
        "errors": [e.to_dict() for e in errors if e.severity == "error"],
        "warnings": [e.to_dict() for e in errors if e.severity == "warning"],
        "error_count": len([e for e in errors if e.severity == "error"]),
        "warning_count": len([e for e in errors if e.severity == "warning"]),
    }

    print(json.dumps(result, indent=2))

    if result["error_count"] > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
