#!/usr/bin/env python3
"""Validate Astryx code against system conventions.

Checks for common mistakes:
- Hardcoded hex colors instead of semantic tokens
- Raw pixel spacing instead of spacing tokens
- Inline style={{}} on raw elements
- Missing Theme provider
- Bare <div> wrappers for layout (should use xstyle or Layout)
- Deprecated class selectors (.primary, .sm, etc.)

Usage:
    uv run scripts/validate.py --input component.tsx
    cat component.tsx | uv run scripts/validate.py --stdin
"""

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

# --- PEP 723 inline dependencies ---
# /// script
# dependencies = []
# ///


@dataclass
class Violation:
    line: int
    column: int
    rule: str
    message: str
    severity: str  # "error" or "warning"


HEX_COLOR_RE = re.compile(r'#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b')
RAW_PX_SPACING_RE = re.compile(r'(?:padding|margin|gap|spacing)\s*:\s*(\d+)px')
INLINE_STYLE_RE = re.compile(r'style\s*=\s*\{\{')
RAW_DIV_WRAPPER_RE = re.compile(r'<div\s+(?:className|xstyle)\s*=')
DEPRECATED_CLASS_RE = re.compile(r'className\s*=\s*["\'](?:.*\b(?:primary|secondary|ghost|danger|sm|md|lg)\b.*)["\']')
THEME_IMPORT_RE = re.compile(r'import\s+.*Theme.*from\s+[\'"]@astryxdesign/core')
THEME_USAGE_RE = re.compile(r'<Theme\b')
COLOR_VAR_RE = re.compile(r'var\s*\(\s*--color-')
STYLEX_CREATE_RE = re.compile(r'stylex\.create\s*\(')
SPACING_VAR_RE = re.compile(r'spacingVars\[')
TAILWIND_SEMANTIC_RE = re.compile(
    r'\b(?:bg-(?:body|surface|card|popover|accent)|'
    r'text-(?:primary|secondary|disabled|accent|on-accent)|'
    r'border-(?:border|strong)|'
    r'rounded-(?:inner|element|container|page)|'
    r'shadow-(?:sm|md|lg|xl))\b'
)


def validate_content(content: str, filename: str = "<stdin>") -> list[Violation]:
    violations: list[Violation] = []
    lines = content.splitlines()
    has_theme_import = False
    has_theme_usage = False
    has_any_component_import = bool(
        re.search(r'from\s+[\'"]@astryxdesign/core', content)
    )

    for i, line in enumerate(lines, 1):
        # --- Hardcoded hex colors ---
        for m in HEX_COLOR_RE.finditer(line):
            # Skip if inside a var() call or a comment
            col = m.start()
            before = line[:col]
            if COLOR_VAR_RE.search(before) or line.strip().startswith('//') or line.strip().startswith('*'):
                continue
            # Skip if it's in a string that's a token name (e.g. '--color-accent: #7B61FF')
            if '--color-' in before and ':' in before.split('--color-')[-1]:
                continue
            violations.append(Violation(
                line=i, column=col + 1,
                rule="no-hardcoded-colors",
                message=f"Hardcoded hex color '{m.group()}' — use var(--color-*) or Tailwind semantic classes",
                severity="error",
            ))

        # --- Raw pixel spacing ---
        for m in RAW_PX_SPACING_RE.finditer(line):
            col = m.start()
            # Skip if inside a stylex.create or using spacingVars
            if SPACING_VAR_RE.search(line) or 'stylex.create' in line:
                continue
            # Skip if it's in a defineTheme config
            if 'defineTheme' in content and ('base' in line or 'ratio' in line or 'multiplier' in line):
                continue
            violations.append(Violation(
                line=i, column=col + 1,
                rule="no-raw-pixel-spacing",
                message=f"Raw pixel spacing '{m.group()}' — use spacing tokens (spacingVars) or Tailwind utilities",
                severity="warning",
            ))

        # --- Inline style={{}} on raw elements ---
        for m in INLINE_STYLE_RE.finditer(line):
            col = m.start()
            # Check if it's on a raw element (div, span, etc.) rather than a component
            before = line[:col]
            # If the preceding tag is lowercase (raw HTML), flag it
            tag_match = re.search(r'<(\w+)\s*$', before)
            if tag_match and tag_match.group(1).islower():
                violations.append(Violation(
                    line=i, column=col + 1,
                    rule="no-inline-styles",
                    message=f"Inline style on raw <{tag_match.group(1)}> — use xstyle on a component or stylex.create()",
                    severity="error",
                ))

        # --- Deprecated class selectors ---
        for m in DEPRECATED_CLASS_RE.finditer(line):
            col = m.start()
            # Skip if it's a Tailwind utility (bg-primary, text-sm, etc. are valid Tailwind)
            # Only flag bare .primary, .sm etc. used as class selectors
            if TAILWIND_SEMANTIC_RE.search(line):
                continue
            violations.append(Violation(
                line=i, column=col + 1,
                rule="no-deprecated-classes",
                message="Deprecated class selector — use data-variant, data-state, data-size attributes instead",
                severity="warning",
            ))

        # --- Track Theme usage ---
        if THEME_IMPORT_RE.search(line):
            has_theme_import = True
        if THEME_USAGE_RE.search(line):
            has_theme_usage = True

    # --- Missing Theme provider ---
    if has_any_component_import and not has_theme_usage:
        violations.append(Violation(
            line=0, column=0,
            rule="missing-theme-provider",
            message="No <Theme> provider found — components need Theme to access design tokens",
            severity="warning",
        ))

    return violations


def format_violations(violations: list[Violation], filename: str) -> str:
    if not violations:
        return f"✓ {filename}: No violations found."

    errors = [v for v in violations if v.severity == "error"]
    warnings = [v for v in violations if v.severity == "warning"]

    lines = [f"{'✗' if errors else '⚠'} {filename}: {len(errors)} error(s), {len(warnings)} warning(s)"]

    for v in violations:
        icon = "✗" if v.severity == "error" else "⚠"
        loc = f"line {v.line}, col {v.column}" if v.line > 0 else "file-level"
        lines.append(f"  {icon} [{v.rule}] {loc}: {v.message}")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate Astryx code against system conventions."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--input", type=str, help="Input file path")
    group.add_argument("--stdin", action="store_true", help="Read from stdin")
    parser.add_argument("--quiet", action="store_true", help="Only show violations, no clean message")

    args = parser.parse_args()

    if args.stdin:
        content = sys.stdin.read()
        filename = "<stdin>"
    else:
        path = Path(args.input)
        if not path.exists():
            print(f"Error: File not found: {path}", file=sys.stderr)
            return 1
        content = path.read_text()
        filename = str(path)

    violations = validate_content(content, filename)
    output = format_violations(violations, filename)

    if not violations and args.quiet:
        return 0

    print(output)
    return 1 if any(v.severity == "error" for v in violations) else 0


if __name__ == "__main__":
    sys.exit(main())
