# Migration job lifecycle detail

## Models (migrationservice/models.py)

### MigrationService
`name`, `provider` (kaltura/youtube/panopto), `status` (`pending`, `running`, `paused`, `error`, `success`, `aborted`), `connection` (credentials, stored encrypted; decrypted per-run via `get_connection()`), `options` (merged over provider defaults via `get_options()`). `provider_class` resolves through the registry in `providers/__init__.py`.

### MigrationRecord
Per-object import record: `service` FK, `object_type` (`media`, `user`, `category`, …), `status` (`success`/`fail`), indexed on (service, status). The detail page aggregates these counts per type and suffix.

## Control surface

| Route | Purpose |
| ----- | ------- |
| `/migrations` | Job list |
| `/migrations/new` | Create (pick provider) |
| `/migrations/new/{source}` | Create from a specific provider |
| `/migrations/{pk}/edit` | Edit credentials/options |
| `/migrations/{pk}` | Detail: status, progress, record counts |
| `GET/POST /api/v1/migrations` | API equivalents |

The API uses a `SimpleRouter` (not `DefaultRouter`) because it mounts at the site root — no api-root view is exposed.

## Execution

- Work runs through `migrationservice/tasks.py` on the Celery worker; scheduling (quiet hours, scheduled starts) in `scheduling.py`
- Imports are resumable: pause stops between objects; resume continues; re-run after `success` picks up changes on the source
- Downloads respect `MIGRATION_DOWNLOAD_TIMEOUT`/`MIGRATION_MAX_RETRIES`; API listing respects `MIGRATION_API_TIMEOUT`/`MIGRATION_PAGE_SIZE`

## After the job

1. Check the record breakdown on the detail page — failures are listed per object type
2. Imported media flows through the normal pipeline (encoding, review, listing rules — skills `media-pipeline`, `rbac-permissions`)
3. Re-run the job to retry failures or import new content; records keep the audit trail
