#!/usr/bin/env python3
"""Refresh .agent/plan-history/INDEX.md and manifest.json from archived plan notes."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_ARCHIVE = REPO_ROOT / ".agent" / "plan-history"
# INDEX is the catalog. README is the folder guide, not a plan note.
SKIP_NOTES = {"INDEX.md", "README.md"}

FRONTMATTER_RE = re.compile(r"\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)", re.S)
NAME_RE = re.compile(r"^name:\s*(.+?)\s*$", re.M)
OVERVIEW_RE = re.compile(r"^overview:\s*(.+?)\s*$", re.M)
DATE_RE = re.compile(r"^date:\s*[\"']?(\d{4}-\d{2}-\d{2})", re.M)
CREATED_RE = re.compile(r"^created:\s*[\"']?(\d{4}-\d{2}-\d{2})", re.M)
BODY_DATE_RE = re.compile(r"^- Date:\s*(\d{4}-\d{2}-\d{2})\s*$", re.M)
HEADING_RE = re.compile(r"^# (?!#)(.+?)\s*$", re.M)
STATUS_RE = re.compile(r"^\s+status:\s*(\w+)\s*$", re.M)
ISO_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$")
DAY_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

SHALLOW_WARNING = "warning: shallow git clone; plan dates may be incomplete. Run git fetch --unshallow for full history."


def unquote(value: str) -> str:
    return value.strip().strip('"').strip("'")


def frontmatter(text: str) -> str:
    match = FRONTMATTER_RE.match(text)
    return match.group(1) if match else ""


def first_group(pattern: re.Pattern[str], text: str) -> str | None:
    match = pattern.search(text)
    if not match:
        return None
    return unquote(match.group(1))


def load_manifest(archive: Path) -> tuple[dict[str, str], dict[str, str], dict[str, str]]:
    """Return (date, updated, content_sha256) keyed by filename from the current catalog."""
    path = archive / "manifest.json"
    dates: dict[str, str] = {}
    updated: dict[str, str] = {}
    shas: dict[str, str] = {}
    if not path.is_file():
        return dates, updated, shas
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return dates, updated, shas
    if not isinstance(data, list):
        return dates, updated, shas
    for row in data:
        if not isinstance(row, dict) or not isinstance(row.get("file"), str):
            continue
        filename = row["file"]
        date = row.get("date")
        if isinstance(date, str) and DAY_RE.fullmatch(date):
            dates[filename] = date
        stamp = row.get("updated")
        if not (isinstance(stamp, str) and stamp.strip()):
            # Legacy catalogs recorded the timestamp as mtime_iso.
            stamp = row.get("mtime_iso")
        if isinstance(stamp, str) and stamp.strip():
            updated[filename] = stamp.strip()
        sha = row.get("content_sha256")
        if isinstance(sha, str) and re.fullmatch(r"[0-9a-f]{64}", sha):
            shas[filename] = sha
    return dates, updated, shas


def normalized_sha256(data: bytes) -> str:
    """SHA-256 of bytes with CR and CRLF normalised to LF."""
    data = data.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return hashlib.sha256(data).hexdigest()


def content_sha256(path: Path) -> str:
    """SHA-256 of the file bytes with CR and CRLF normalised to LF."""
    return normalized_sha256(path.read_bytes())


def git_bytes(cwd: Path, *args: str) -> bytes | None:
    command = ["git", "--no-pager", "-C", str(cwd), "-c", "core.quotepath=false", *args]
    try:
        result = subprocess.run(command, check=False, capture_output=True)
    except OSError:
        return None
    if result.returncode != 0:
        return None
    return result.stdout


def git_stdout(cwd: Path, *args: str) -> str | None:
    payload = git_bytes(cwd, *args)
    if payload is None:
        return None
    return payload.decode("utf-8", errors="replace")


def repo_root(archive: Path) -> Path | None:
    output = git_stdout(archive, "rev-parse", "--show-toplevel")
    if not output:
        return None
    return Path(output.strip())


def is_shallow(archive: Path) -> bool:
    output = git_stdout(archive, "rev-parse", "--is-shallow-repository")
    return bool(output) and output.strip() == "true"


def entry_name(path_str: str, archive: Path, root: Path) -> str | None:
    text = path_str.strip().strip('"')
    if not text or text == ".":
        return None
    raw = Path(text)
    archive_root = archive.resolve()
    for base in (root, archive):
        candidate = raw if raw.is_absolute() else base / raw
        try:
            relative = candidate.resolve().relative_to(archive_root)
        except ValueError:
            continue
        if len(relative.parts) == 1 and relative.suffix == ".md":
            return relative.name
    return None


def parse_name_status(line: str) -> tuple[str, list[str]]:
    parts = line.split("\t")
    return parts[0][:1], parts[1:]


def collect_history(archive: Path, root: Path) -> tuple[dict[str, str], dict[str, str]]:
    """One log pass: newest author date, and the oldest add of each filename.

    Git dates are only a fallback for notes with no recorded date. Shallow
    clones, renames, reused names, and merges can be wrong; set frontmatter `date`.
    """
    output = git_stdout(archive, "log", "--name-status", "--format=%aI", "--", ".")
    if output is None:
        return {}, {}
    latest: dict[str, str] = {}
    added: dict[str, str] = {}
    current: str | None = None
    for line in output.splitlines():
        if not line.strip():
            continue
        if ISO_RE.fullmatch(line.strip()):
            current = line.strip()
            continue
        if current is None:
            continue
        code, paths = parse_name_status(line)
        names = []
        for path in paths:
            name = entry_name(path, archive, root)
            if name:
                names.append(name)
        if code == "A":
            for name in names:
                added[name] = current
        for name in names:
            latest.setdefault(name, current)
    return latest, added


def dirty_names(archive: Path, root: Path) -> set[str]:
    """Names of archive notes with uncommitted changes, from NUL-separated porcelain output."""
    output = git_stdout(archive, "status", "--porcelain", "-z", "--untracked-files=all", "--", ".")
    if output is None:
        return set()
    names: set[str] = set()
    records = output.split("\0")
    index = 0
    while index < len(records):
        record = records[index]
        index += 1
        if len(record) < 4:
            continue
        paths = [record[3:]]
        # Renames and copies are followed by a separate record holding the original path.
        if record[0] in "RC" or record[1] in "RC":
            if index < len(records):
                paths.append(records[index])
                index += 1
        for path in paths:
            name = entry_name(path, archive, root)
            if name:
                names.add(name)
    return names


def explicit_date(text: str, filename: str, manifest_dates: dict[str, str]) -> str | None:
    """Date from frontmatter, a `- Date:` line, or the manifest. None if git or today is next."""
    header = frontmatter(text)
    for pattern in (DATE_RE, CREATED_RE):
        value = first_group(pattern, header)
        if value:
            return value
    body_date = BODY_DATE_RE.search(text)
    if body_date:
        return body_date.group(1)
    return manifest_dates.get(filename)


def plan_name(text: str, path: Path) -> str:
    name = first_group(NAME_RE, frontmatter(text))
    if name:
        return name
    heading = HEADING_RE.search(text)
    if heading:
        return heading.group(1).strip()
    return path.stem


def plan_overview(text: str) -> str:
    return first_group(OVERVIEW_RE, frontmatter(text)) or ""


def plan_todos(text: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for status in STATUS_RE.findall(text):
        counts[status] = counts.get(status, 0) + 1
    return counts


def resolve_updated(
    *,
    filename: str,
    clean: bool,
    latest: dict[str, str],
    recorded: str | None,
    recorded_sha: str | None,
    content_sha: str,
    now_iso: str,
) -> str:
    """First match wins. See the plan-history skill for the four rules."""
    if recorded and recorded_sha is not None and recorded_sha == content_sha:
        return recorded
    if recorded and recorded_sha is None and clean:
        return recorded
    if clean and filename in latest:
        return latest[filename]
    return now_iso


def stamp_key(value: str) -> datetime:
    text = value.strip()
    if DAY_RE.fullmatch(text):
        return datetime.fromisoformat(text + "T00:00:00+00:00")
    parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def format_todos(todos: dict[str, int]) -> str:
    if not todos:
        return "—"
    return ", ".join(f"{k}: {v}" for k, v in sorted(todos.items()))


def escape_cell(value: str, limit: int = 120) -> str:
    text = value.replace("|", "\\|").replace("\n", " ")
    if len(text) > limit:
        return text[: limit - 3] + "..."
    return text


def render_index(plans: list[dict]) -> str:
    latest = plans[0]["updated"] if plans else "—"
    lines = [
        "# MediaCMS plan history",
        "",
        "Archive of plans for this MediaCMS fork: Cursor plans and Architect design notes.",
        "Live plans remain in `~/.cursor/plans/`; this folder is the project snapshot.",
        "",
        f"**Latest snapshot:** {latest}",
        f"**Count:** {len(plans)} plans",
        "",
        "See `manifest.json` for machine-readable metadata. " "Archival workflow: `skills/plan-history/SKILL.md`.",
        "",
        "| Date | Plan | Overview | Todos |",
        "| ---- | ---- | -------- | ----- |",
    ]
    for row in plans:
        lines.append(
            "| {date} | [{name}]({file}) | {overview} | {todos} |".format(
                date=row["date"],
                name=escape_cell(row["name"], limit=80),
                file=row["file"],
                overview=escape_cell(row["overview"]),
                todos=format_todos(row["todos"]),
            )
        )
    lines.extend(
        [
            "",
            "## Notes",
            "",
            "- Prefer `python3 skills/plan-history/scripts/refresh_index.py` after copying plans.",
            "- Do not commit unless asked.",
            "",
        ]
    )
    return "\n".join(lines)


def refresh(archive: Path) -> None:
    archive.mkdir(parents=True, exist_ok=True)
    manifest_dates, manifest_updated, manifest_shas = load_manifest(archive)
    root = repo_root(archive)
    shallow = False
    latest: dict[str, str] = {}
    first_add: dict[str, str] = {}
    dirty: set[str] = set()
    if root is not None:
        shallow = is_shallow(archive)
        latest, first_add = collect_history(archive, root)
        dirty = dirty_names(archive, root)
    if shallow:
        print(SHALLOW_WARNING, file=sys.stderr)

    now = datetime.now().astimezone()
    today = now.strftime("%Y-%m-%d")
    now_iso = now.isoformat(timespec="seconds")
    plans = []
    for path in sorted(p for p in archive.glob("*.md") if p.name not in SKIP_NOTES):
        text = path.read_text(encoding="utf-8", errors="replace")
        digest = content_sha256(path)
        date = explicit_date(text, path.name, manifest_dates)
        if date is None and path.name in first_add:
            date = first_add[path.name][:10]
        elif date is None:
            date = today
        clean = path.name not in dirty and path.name in latest
        plans.append(
            {
                "file": path.name,
                "date": date,
                "updated": resolve_updated(
                    filename=path.name,
                    clean=clean,
                    latest=latest,
                    recorded=manifest_updated.get(path.name),
                    recorded_sha=manifest_shas.get(path.name),
                    content_sha=digest,
                    now_iso=now_iso,
                ),
                "content_sha256": digest,
                "name": plan_name(text, path),
                "overview": plan_overview(text),
                "todos": plan_todos(text),
            }
        )

    plans.sort(key=lambda row: row["file"])
    plans.sort(key=lambda row: stamp_key(row["updated"]), reverse=True)

    (archive / "manifest.json").write_text(json.dumps(plans, indent=2) + "\n", encoding="utf-8")
    (archive / "INDEX.md").write_text(render_index(plans), encoding="utf-8")
    print(f"Refreshed {len(plans)} plans in {archive}")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Refresh plan-history INDEX.md and manifest.json.")
    parser.add_argument(
        "--archive",
        type=Path,
        default=DEFAULT_ARCHIVE,
        help="Plan archive directory (default: .agent/plan-history).",
    )
    args = parser.parse_args(argv)
    refresh(args.archive)


if __name__ == "__main__":
    main()
