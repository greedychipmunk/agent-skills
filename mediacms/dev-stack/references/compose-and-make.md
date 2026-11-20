# Compose files and Make targets

## Compose variants in the repo root

| File | Purpose |
| ---- | ------- |
| `docker-compose.yaml` | Production default; `mediacms/mediacms:latest` |
| `docker-compose.full.yaml` | Overlay adding the `full` image (Whisper) for celery worker |
| `docker-compose-dev.yaml` | Development: runserver + webpack dev server on 8088 |
| `docker-compose-letsencrypt.yaml` | TLS via letsencrypt companion |
| `docker-compose-http-proxy.yaml` / `docker-compose-https-proxy.yaml` | Behind jwilder/nginx-proxy |
| `docker-compose-named-volumes.yaml` | Named volumes instead of bind mounts |
| `docker-compose/` dir | Additional variants (updated dev, proxies) |

## Dev services (docker-compose-dev.yaml)

`web` (Django runserver, port 80), `frontend` (webpack on 8088), `db`, `redis`, `celery_worker`, `celery_beat`, `migrations` (runs Django migrations on start).

Dev-only environment: `ADMIN_USER: 'admin'`, `ADMIN_PASSWORD: 'admin'`, `ADMIN_EMAIL: 'admin@localhost'`.

## Production services (docker-compose.yaml)

`web` (gunicorn + nginx inside the image, supervisord as PID 1), `db` (postgres, data in `../postgres_data/`), `redis`, `celery_worker` (short + long queues), `celery_beat`, `migrations`.

Service toggles (environment variables, `yes`/`no`): `ENABLE_UWSGI`, `ENABLE_NGINX`, `ENABLE_CELERY_BEAT`, `ENABLE_CELERY_SHORT`, `ENABLE_CELERY_LONG`, `ENABLE_MIGRATIONS`. Disable them on split deployments so each container runs one role.

## Frontend build details

- Entry points: `frontend/src/entries/<name>.js`; `templates/cms/<page>.html` loads `static/js/<name>.js` plus `static/js/_commons.js`
- Shared styles: `static/css/_commons.css`; page styles: `static/css/<name>.css` linked by that page's template
- Build config: `frontend/webpack.config.js`
- Manual build: `docker compose -f docker-compose-dev.yaml exec frontend npm run dist` then `cp -r frontend/dist/static/* static/` then restart web
- React is a library loaded by Django templates, not a standalone SPA — routes and pages belong to Django

## Useful exec commands

```bash
docker compose -f docker-compose-dev.yaml exec -T web python manage.py <command>
docker compose -f docker-compose-dev.yaml exec web /bin/bash   # or: make admin-shell
docker compose -f docker-compose-dev.yaml restart web celery_worker celery_beat
```
