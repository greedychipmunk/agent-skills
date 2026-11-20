---
name: dev-stack
description: Run, rebuild, and troubleshoot the MediaCMS Docker Compose development stack, and choose production deployment options. Use when starting the dev stack, deciding between ports 80 and 8088, rebuilding the frontend for Django-served pages, restarting web/celery services after settings changes, picking a compose variant (full image, letsencrypt, proxy), or upgrading an installation including PostgreSQL major versions.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# MediaCMS Dev Stack

> **Scope:** targets [mediacms-io/mediacms](https://github.com/mediacms-io/mediacms) v9.6.1 (commit `99a1801`, branch `main`). Repo paths (`docker-compose-dev.yaml`, `Makefile`, `deploy/docker/`) resolve in that checkout.

## Day 1

```bash
git clone https://github.com/mediacms-io/mediacms
cd mediacms
docker compose -f docker-compose-dev.yaml up
```

- Django (backend + templates): http://localhost — login `admin` / `admin` (set via `ADMIN_USER`/`ADMIN_PASSWORD` in `docker-compose-dev.yaml`)
- React dev server: http://localhost:8088 — webpack HMR that proxies every page and API request to Django
- Whisper transcription is NOT in the dev image; use `docker-compose.full.yaml` or the `mediacms/mediacms:full` image for the celery worker when testing it

The dev compose builds two images: `mediacms/mediacms-dev:latest` (Django under `runserver`, Debug mode + debug toolbar, no gunicorn/nginx, corsheaders allowing all origins) and `frontend` (`npm start` on 8088).

## Make targets

| Target | What it does |
| ------ | ------------- |
| `make admin-shell` | Bash into the web container |
| `make build-frontend` | `npm run dist` in frontend, copy `frontend/dist/static/*` to `static/`, restart web |
| `make test` | pytest with `TESTING=True`, `-n auto` (skill `testing`) |
| `make test-coverage` | Same with coverage |
| `make test-frontend` | Jest in the frontend container |

## When to rebuild or restart

| Change | Action |
| ------ | ------ |
| Python code | Auto-reload on web; `docker compose -f docker-compose-dev.yaml restart web` if it breaks |
| React/SCSS under `frontend/src` | Live on :8088; nothing needed |
| React changes that must show on :80 | `make build-frontend` (build → copy to `static/` → restart web) |
| `cms/settings.py` or `local_settings.py` | Restart `web`, `celery_worker`, `celery_beat` |
| Translations in React strings | `process_translations` then rebuild frontend (skill `i18n`) |

Django only serves what is in `static/`; :80 and :8088 can disagree because :80 shows only built bundles.

## Production and deployment options

- Default: `docker compose up` with `docker-compose.yaml` — services `web`, `db` (postgres), `redis`, `celery_worker`, `celery_beat`, `migrations`; supervisord-managed image with `ENABLE_UWSGI`, `ENABLE_NGINX`, `ENABLE_CELERY_BEAT`, `ENABLE_CELERY_SHORT`, `ENABLE_CELERY_LONG`, `ENABLE_MIGRATIONS` toggles (`yes`/`no`) for scalable splits
- HTTPS via letsencrypt: `docker-compose-letsencrypt.yaml` (`VIRTUAL_HOST`, `LETSENCRYPT_HOST`, `LETSENCRYPT_EMAIL`) + `FRONTEND_HOST` in `deploy/docker/local_settings.py`
- Reverse proxy: `docker-compose-http-proxy.yaml` / `docker-compose-https-proxy.yaml`; named volumes: `docker-compose-named-volumes.yaml`
- Set `FRONTEND_HOST` in `deploy/docker/local_settings.py` (auto-copied over `cms/local_settings.py`) — restart after any settings change: `docker compose restart web celery_worker celery_beat`

## Upgrades

```bash
docker pull mediacms/mediacms
docker compose down && docker compose up
```

- Data lives in `../postgres_data/` (database) and `media_files/` (uploads) — back up both before upgrading; `docker compose down` does not delete them
- PostgreSQL major-version changes do not auto-upgrade the data directory (v2→v3 moved postgres 13→15); dump/restore or use `pgautoupgrade`, expect downtime
- Switching postgres image flavors (Debian/glibc ↔ Alpine/musl) on an existing volume causes collation-version warnings; keep the matching flavor or do a logical dump/restore into a fresh volume
- See `docs/docker-upgrade-checklist.md`

## Additional resources

- [references/compose-and-make.md](references/compose-and-make.md)
- [references/deployment-options.md](references/deployment-options.md)
- `docs/dev_exp.md` (upstream developer experience guide), `docs/admins_docs.md` §3–4
- Skills: `testing`, `portal-configuration`, `media-pipeline`
