---
name: plan-history
description: Archive MediaCMS Cursor plans into .agent/plan-history with INDEX.md and manifest.json. Use when creating or updating a plan, finishing plan implementation, syncing plan history, or when the user mentions plan archive, plan history, or .agent/plan-history.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/plan-history
---

# Plan history archival

> **Scope:** targets the [mrjoshuap-hq/mediacms](https://github.com/mrjoshuap-hq/mediacms) fork (`mediacms-next` branch). Repo paths such as `admin_customizations/`, `docs/en/…`, and `AGENTS.md` resolve in that repository checkout; sibling skills are referenced by name from this `mediacms` collection.

## When (required)

Archive after any of these for **this** MediaCMS repo:

1. A new Cursor plan is written or saved under `~/.cursor/plans/`
2. An existing plan is substantially revised (scope, todos, or overview change)
3. Plan implementation is completed or abandoned (final snapshot)
4. The user asks to sync / refresh plan history

Skip non-MediaCMS plans (other products, homelab, unrelated repos).

## Where

| Path | Role |
| ---- | ---- |
| `~/.cursor/plans/*.plan.md` | Live Cursor plans (source) |
| `.agent/plan-history/*.md` | Project archive (every plan note except `INDEX.md` and `README.md`) |
| `.agent/plan-history/INDEX.md` | Human catalog |
| `.agent/plan-history/manifest.json` | Machine-readable metadata |

Preserve the original filename (e.g. `rbac_permissions_audit_ef026657.plan.md`).

## How

1. Identify the plan file in `~/.cursor/plans/` (newest matching MediaCMS plan if unclear).
2. Copy into `.agent/plan-history/` (overwrite same filename with the latest snapshot).
3. Refresh the catalog:

```bash
# from this skill's directory (the archive path points at the target repo):
python3 scripts/refresh_index.py --archive /path/to/mediacms-repo/.agent/plan-history
```

Without `--archive`, the script indexes `./.agent/plan-history` relative to the working directory.

The script indexes every `*.md` file in the archive except `INDEX.md` and `README.md` (`README.md` is the folder guide). `--archive` reads and writes a different directory. `date` comes from frontmatter (`date` or `created`), then a `- Date: YYYY-MM-DD` line, then the date already stored in `manifest.json`. Only a note with none of those uses the first git commit that added the file. `updated` uses the first match: the recorded value when `content_sha256` equals the SHA-256 of the file's LF-normalised bytes; the recorded value for a legacy entry that has no hash while the file is clean (that run also stores the hash); the author date of the last commit when the file is tracked and clean; otherwise the current time, written once. The same bytes keep that `updated` on later runs, including after commit and in a fresh clone. `content_sha256` is stored only in `manifest.json`. On a clean checkout a second run leaves `INDEX.md` and `manifest.json` unchanged. A shallow clone prints a one-line warning.

## Known limitations

Git history is only a fallback. A shallow clone, a rename, a reused filename, a merge resolution, or a new file at an old path can attach the wrong git date or `updated` time. Set `date` in the note's frontmatter. That recorded value, then a `- Date:` line, then the committed manifest, wins over git.

4. Briefly confirm archival in the reply (filename + that INDEX was refreshed). Do not commit unless the user asks.

## MediaCMS check

Treat as MediaCMS if any of:

- Filename or body mentions `mediacms` / this repo path
- Touches MediaCMS paths (`admin_customizations/`, `files/`, `frontend/`, `cms/`, `docs/en/`, …)
- Continues work already represented in `.agent/plan-history/`

If unsure, ask before copying.

## Anti-patterns

- Ending a plan-only or plan→implement session without an archive copy
- Rewriting INDEX/manifest by hand when the refresh script exists
- Archiving unrelated `~/.cursor/plans/` files into this repo
- Deleting live plans from `~/.cursor/plans/` as part of archival (copy only)
