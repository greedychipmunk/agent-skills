---
name: dev-manage
description: Run Django manage.py and common MediaCMS development database tasks inside the web container—shell, fake media, DB export, translations process, and related admin ops. Use when populating demo data, exporting/restoring DB, opening the Django shell, or running management commands during development.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/dev-manage
---

# Dev manage.py and database tasks

## How to run commands

Prefer the `web` container (dev stack must be up):

```bash
docker compose -f docker-compose-dev.yaml exec -T web python manage.py <command>
# interactive shell:
make admin-shell
# or:
docker compose -f docker-compose-dev.yaml exec web /bin/bash
```

Do not run destructive DB commands against production. Prefer `cms/local_settings.py` / env overrides over editing `cms/settings.py`.

## Common commands

| Task | Command notes |
| ---- | ------------- |
| Django shell | `python manage.py shell` |
| Translations propagate | `make languages` → `process_translations` (skill `i18n`) |
| Fake media | `populate_fake_media` (see below) |
| DB export | `export_database --output /path/file.json.gz` |
| Site upgrade helpers | `upgrade_site`, `upgrade_previews` (see admin upgrade docs) |

List project commands: `python manage.py help` inside the container. Custom commands live under `files/management/commands/` and `admin_customizations/`.

## Fake media (`populate_fake_media`)

- **Guard:** requires `ALLOW_POPULATE_FAKE_MEDIA=True` (set on `web` in `docker-compose-dev.yaml`). Refuses otherwise.
- **Dev/demo only.** Generated users share password `testpass123` — never leave that data on a reachable non-dev portal.
- Useful flags: `--count`, `--clear`, `--single-language`, `--secondary-language` / `--rtl-language` / `--cjk-language`, `--inject-integrity-faults` (for health-check QA).
- Large `--count` can slow the admin dashboard; prefer modest counts unless load-testing (skill `admin-portal`).

```bash
docker compose -f docker-compose-dev.yaml exec -T web \
  python manage.py populate_fake_media --count 50
```

## Database export

```bash
docker compose -f docker-compose-dev.yaml exec -T web \
  python manage.py export_database --output /tmp/backup.json.gz
```

Optional: `--include-engagement`, `--include-noisy-status`. Admin UI backup/restore lives under `admin_customizations/` (`database_backup.py`, `database_restore.py`). Password-protect exports when the product UI offers it; do not commit dump files.

## Migrations

Dev stack runs migrations via the `migrations` service / `prestart.sh`. Prefer that path over ad-hoc migrate unless debugging. Schema changes remain last resort (`AGENTS.md` Change Impact Policy).

## Additional resources

- `docs/en/guides/developer/local-dev.md` (fake media, admin-shell)
- `docs/en/guides/admin/site-upgrade.md`, `docs/en/releases/upgrade-tips.md`
- `files/management/commands/`, `admin_customizations/database_*.py`
- Skills: `dev-stack`, `test-ci`, `media-pipeline`, `admin-portal`
