# Deployment options and upgrades

## Topologies (from docs/admins_docs.md §4)

1. **Simple** — one image runs everything on port 80; `FRONTEND_HOST = http://localhost`
2. **Letsencrypt** — `docker-compose-letsencrypt.yaml`; set `VIRTUAL_HOST`/`LETSENCRYPT_HOST`/`LETSENCRYPT_EMAIL`; `FRONTEND_HOST = https://my_domain.com`
3. **Advanced, port 8000** — `FRONTEND_HOST = http://localhost:8000` with a port defined
4. **Reverse proxy** — jwilder/nginx-proxy in front of 1+ web instances; `FRONTEND_HOST = http://mediacms.io`
5. **Scalable** — multiple `web` and `celery_worker` instances behind the proxy; managed postgres/redis/storage for large deployments; split services with the `ENABLE_*` toggles

## Custom nginx

If you run your own nginx instead of the in-image one, copy these blocks from `deploy/docker/nginx_http_only.conf` on every update:

- `location = /_media_auth` and `location ~ ^/media/(encoded|hls)/(.*)$` — Django-checked protected media
- `location ~ ^/media/original/(.*)$` — same check for originals; unknown types download instead of running inline
- `location ^~ /_protected_pdf/` — internal location Django hands PDF responses to

## Upgrade checklist

1. Back up `../postgres_data/` and `media_files/`
2. `docker pull mediacms/mediacms`
3. `docker compose down` && `docker compose up`
4. Verify a restore works before removing the old backup

## PostgreSQL gotchas

- Major version bumps (e.g. 13 → 15) cannot reuse the old data directory: either pin the old image or dump/restore (see PR #749 notes); `pgautoupgrade` automates it with a few minutes of downtime
- Alpine (musl) images on a glibc-initialized volume log `no actual collation version` warnings — that is a collation mismatch, not an app bug; keep the matching flavor or logically migrate into a fresh volume
- Current compose files use `postgres:17.2-alpine`
