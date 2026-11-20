---
name: migrations
description: Plan and run MediaCMS migrations from other video platforms — Kaltura, YouTube, and Panopto — through the superuser Migrations UI and API. Use when importing a portal's media, users, categories, captions, and play counts; configuring provider credentials and options; pausing, resuming, or re-running a migration job; or checking what a migration imported and what failed.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# MediaCMS Platform Migrations

> **Scope:** targets [mediacms-io/mediacms](https://github.com/mediacms-io/mediacms) v9.6.1 (commit `99a1801`, branch `main`). App: `migrationservice/`; docs: `docs/kaltura_migration.md`, `docs/youtube_migration.md`, `docs/panopto_migration.md`.

## What a migration brings over

Media files, the people who own them, the categories they sit in, captions, play counts, and whether each item was public. It runs as a job you start, watch, pause, and resume; every imported object is recorded (`MigrationRecord`) so you can check results afterwards or re-run to pick up what changed.

## Where to drive it

- **UI (superuser only)** — "Migrations" in the top-right menu: `/migrations` (list), `/migrations/new` (create), `/migrations/{pk}/edit`, `/migrations/{pk}` (detail with progress and records)
- **API** — `/api/v1/migrations` (DRF ViewSet; superuser)

## Providers

| Provider | Entry point |
| -------- | ----------- |
| **Kaltura** | API credentials + app token; the richest option set — user matching, category selection, playlists, groups/service accounts, sites/learning platforms, roles, permissions, quiet hours, scheduled start. `docs/kaltura_migration.md` |
| **YouTube** | Owns its own file source and rendition handling; re-running is supported. `docs/youtube_migration.md` |
| **Panopto** | `docs/panopto_migration.md` |

Each provider needs its own credentials, options, and decisions — read the per-platform doc, not just this skill.

## Job lifecycle

```
create (pending) → start (running) → pause (paused) → resume (running) → success | error | aborted
```

- Records: one per imported object (`media`, `user`, `category`, …) with `success`/`fail` status — the detail page aggregates counts
- Re-running a finished job imports what changed since; already-imported objects are not duplicated
- Quiet hours / scheduled start: configure on the job (Kaltura) so imports respect your load windows

## Settings (defaults in `cms/settings.py`)

| Setting | Purpose |
| ------- | ------- |
| `MIGRATION_API_TIMEOUT` | Per-API-call timeout |
| `MIGRATION_DOWNLOAD_TIMEOUT` | Per-file download timeout |
| `MIGRATION_MAX_RETRIES` | Retry count per object |
| `MIGRATION_PAGE_SIZE` | Provider API page size |

## Additional resources

- [references/job-lifecycle.md](references/job-lifecycle.md)
- [references/provider-notes.md](references/provider-notes.md)
- `migrationservice/providers/` (base.py, kaltura.py, panopto.py, youtube.py)
- Skills: `dev-stack` (worker capacity), `media-pipeline` (what happens to imported files), `rbac-permissions` (imported roles)
