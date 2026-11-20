---
name: dev-stack
description: Run and rebuild the MediaCMS Docker Compose development stack—up/down, image builds, frontend/docs rebuilds, and service restarts. Use when starting the stack, fixing “changes not visible”, choosing port 80 vs 8088, rebuilding images, or restarting web/celery after settings changes.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/dev-stack
---

# Dev stack (Compose + Make)

## Day-1

```bash
make docker-build          # mediacms-dev:latest + mediacms:local
make docker-up             # docker-compose-dev.yaml
# Whisper / full image: make docker-build-full  (or compose.full overlay)
```

- App with **built** bundles: http://localhost:80
- Webpack HMR (proxies API/pages to Django): http://localhost:8088
- Docs watcher: `make docs-up` → http://localhost/documentation/
- Default login: `admin` / `admin`

Override images when needed: `MEDIACMS_IMAGE`, `MEDIACMS_FULL_IMAGE`, `MEDIACMS_DEV_IMAGE`.

## When to rebuild / restart

| Change | Action |
| ------ | ------ |
| Python (no settings) | Usually auto-reload on `web`; if broken, restart `web` |
| `settings` / `local_settings` | Restart `web`, `celery_worker`, `celery_beat` |
| React / SCSS (need on :80) | `make frontend-build` (build → `static/` → restart `web`) |
| React only (iterate) | Use :8088; no copy to `static/` required |
| Translations (frontend strings) | `make languages` then `make frontend-build` if React |
| Docs content | `make docs-up` or `make docs` |
| Dockerfile / system deps | `make docker-build` then `make docker-up` |

```bash
docker compose -f docker-compose-dev.yaml restart web celery_worker celery_beat
```

## Gotchas

- :80 and :8088 can disagree — :80 only shows **built** frontend.
- Prefer `make …` over inventing raw compose flags; run `make help` for the catalog.
- Postgres data lives beside the repo (`../postgres_data`); `docker-down` does not delete it.
- Never commit `deploy/docker/local_settings.py` (skill `merge-hygiene`).

## Additional resources

- `Makefile`, `docker-compose-dev.yaml`
- `docs/en/guides/developer/local-dev.md`
- Skills: `test-ci`, `i18n`, `fork-docs-release`
