---
name: media-pipeline
description: Work on MediaCMS encoding, HLS, media integrity, storage paths, nginx media auth, filesystem import, and MediaAction auditing. Use when debugging uploads, Encoding objects, transcoding, integrity/health checks, X-Accel paths, or migrationservice import.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/media-pipeline
---

# Media pipeline

> **Scope:** targets the [mrjoshuap-hq/mediacms](https://github.com/mrjoshuap-hq/mediacms) fork (`mediacms-next` branch). Repo paths such as `admin_customizations/`, `docs/en/…`, and `AGENTS.md` resolve in that repository checkout; sibling skills are referenced by name from this `mediacms` collection.

## Instructions

1. The model is **`Encoding`** (not Encode). Prefer health checks, integrity tools, admin surfaces, and tasks before schema migrations.
2. Lifecycle (summary): originals upload as FileFields → long videos chunk → one Encoding per chunk per enabled EncodeProfile → workers transcode → successful chunks concatenate to a final Encoding (`chunk=False`, `status='success'`) → HLS (`.ts`) generated. Chunk rows track in-progress work.
3. Respect `DO_NOT_TRANSCODE_VIDEO` and EncodeProfile admin at `/admin/files/encodeprofile/`.
4. Celery workers must share the same filesystem (local, NFS, or EFS).
5. For path / download / proxy bugs, inspect media auth / X-Accel and opaque storage paths before inventing new storage layouts.
6. Filesystem import / `migrationservice`: require explicit ownership; prefer minimal, reversible ingest over autofill or aggressive prune unless requested.

## Additional resources

- `docs/en/guides/developer/architecture.md` (Encoding pipeline)
- `docs/en/guides/admin/processing.md`
- `docs/en/guides/admin/content-migration.md`
- `docs/en/releases/fixes.md` (media tools / platform notes)
- Code: `files/models/` (media, encoding), `files/tasks.py`, `tests/pipeline/`
- Related admin health: `admin_customizations/status_health.py`, `admin_customizations/deployment_health.py`
