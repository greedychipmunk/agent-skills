# Provider notes

## Kaltura (docs/kaltura_migration.md)

- **Credentials**: API credentials + app token created in the Kaltura console
- **What maps to what**: explicit roles/permissions mapping sections; user matching rules decide which MediaCMS user owns each imported item
- **Selective import**: migrate only some categories, or only specific users
- **Playlists**: supported
- **Groups and service accounts**, **sites and learning platforms**: mapping sections for institutional setups
- **Category identity**: how categories are matched/created across runs
- **Skipping transcoding**: import original files without re-encoding (fast, but no HLS/sprites)
- **Multi-stream recordings**: handled
- **Quiet hours**: keep the import inside load windows
- **Scheduled start**: schedule a finished job to run again later

## YouTube (docs/youtube_migration.md)

- Requires tooling installed (see the doc's "What it needs installed")
- Options control what is fetched; "When YouTube will not answer" covers API quota/refusal behavior
- **Renditions**: YouTube's per-resolution files map to MediaCMS encodings; "How a rendition is labelled" explains the profile naming; encoding profiles can be added later
- **Hover preview**: produced for imported videos
- **Re-running**: supported — picks up new/changed items

## Panopto (docs/panopto_migration.md)

- Credentials and options documented per-platform; same job lifecycle and record auditing as the others

## Choosing settings

- Large libraries: raise worker count before starting (`ENABLE_CELERY_LONG` splits, skill `dev-stack`); use quiet hours
- Set `MIGRATION_PAGE_SIZE`/timeouts to match the provider's rate limits
- Test with a single category or user first, then widen the selection
