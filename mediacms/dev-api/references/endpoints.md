# Endpoint reference

All endpoints live at the site root (files/urls.py, users/urls.py, migrationservice/urls.py). `friendly_token` is the media identifier shown in URLs.

## Media

### `GET /api/v1/media`
Query params (drf-yasg documented):
- `page` (int) — pagination
- `author` (username) — filter by uploader
- `show` — `recommended` | `featured` | `latest`

Returns listable media the caller can see: public listings plus, for authenticated callers, their own media, media shared with them (MediaPermission), and RBAC category media when enabled. Paginated; each item carries `friendly_token`, `title`, `media_type`, `state`, `encoding_status`, `thumbnail_url`, `preview_url`, author info, counts.

### `POST /api/v1/media` (upload)
Parser: multipart. Permission: `IsAuthorizedToAdd` (respects `CAN_ADD_MEDIA`, `UPLOAD_MEDIA_ALLOWED`, `NUMBER_OF_MEDIA_USER_CAN_UPLOAD`). Body: `media_file` (required), `title`, `description`, `new_tags` (comma-separated), `category_uids` or `category_titles`, `state`, `license`, `enable_comments`, `allow_download`, `thumbnail_time`, `allow_whisper_transcribe`, `allow_whisper_transcribe_and_translate`.

### `/api/v1/media/{friendly_token}`
- GET — detail (SingleMediaSerializer: adds `original_media_url`, `encodings_info`, `sprites_url`, `poster_url`, `is_shared`, `edit_date`, `video_height`)
- POST / PUT — edit: `title`, `description`, `media_file` (replacement, needs `ALLOW_MEDIA_REPLACEMENT`), `new_tags`, `category_uids`/`category_titles`, `state`, `enable_comments`, `allow_download`, `thumbnail_time`, license fields
- DELETE — remove (owner or editor/manager/admin)

### `POST /api/v1/media/{friendly_token}/actions`
`{"type": "like"|"dislike"|"report"|"feature", "result": true}` — gated by `CAN_LIKE_MEDIA`, `CAN_DISLIKE_MEDIA`, `CAN_REPORT_MEDIA`.

### `POST /api/v1/media/user/bulk_actions`
`{"media_ids": [...], "action": ...}` with per-action extras:
- `add_to_playlist` / `remove_from_playlist` + `playlist_ids`
- `add_to_category` / `remove_from_category` + `category_uids`
- `add_tags` / `remove_tags` + `tag_titles`
- `set_state` + `state` (private|public|unlisted)
- `change_owner` + `owner` (username)
- `get_ownership` / `set_ownership` / `remove_ownership` + `ownership` (viewer|editor|owner)

### Other media endpoints
- `GET /api/v1/media/{token}/pdf` — PDF media viewer
- `POST /api/v1/media/{token}/chapters` — chapters
- `POST /api/v1/media/{token}/trim_video` — trim (needs `ALLOW_VIDEO_TRIMMER`; runs `video_trim_task`)
- `POST /api/v1/media/{token}/share` — LTI embed share: owner-only; marks media shared, optionally links an RBAC category by `courseid`
- `GET /api/v1/media-auth` — protected-media auth for nginx X-Accel flow (skill `media-pipeline`)

## Discovery

- `GET /api/v1/search` — media search (matches title/description/tags; also powers `/search` page)
- `GET /api/v1/categories` — all categories; `/api/v1/categories/contributor` — categories the caller can contribute to (RBAC); `/api/v1/categories/{uid}` — detail (title, description, thumbnail_url, media_count)
- `GET /api/v1/tags` — tags with `media_count`, `thumbnail_url`
- `GET /api/v1/comments` — recent comments

## Users and auth

- `GET /api/v1/whoami` — authenticated user detail (UserDetailSerializer)
- `GET /api/v1/user/token` — mints/returns DRF token `{"token": "..."}`
- `POST /api/v1/login` — login view
- `GET /api/v1/users` — user list (respects `ALLOW_ANONYMOUS_USER_LISTING`); `/api/v1/users/{username}` — detail; `/api/v1/users/{username}/contact` — contact
- `POST /api/v1/user/action/{action}` — user actions
- Page routes (not API): `/user/{username}`, `/user/{username}/shared_with_me`, `/shared_by_me`, `/playlists`, `/about`, `/channel/{token}`

## Playlists

- `GET /api/v1/playlists` — list; `GET/POST /api/v1/playlists/{friendly_token}` — detail/edit; fields: `id`, `add_date`, `title`, `description`, `user`, `media_count`, `url`, `api_url`, `thumbnail_url`, `friendly_token`. Limit: `MAX_MEDIA_PER_PLAYLIST`.

## Admin/management (editor, manager, admin)

- `GET /api/v1/encode_profiles/` — active EncodeProfile list
- `GET /api/v1/manage_media` — all media incl. non-listable; `/api/v1/manage_comments`; `/api/v1/manage_users` — user management
- `GET /api/v1/tasks`, `/api/v1/tasks/{friendly_token}` — encoding task status

## Migrations (superuser)

- `GET/POST /api/v1/migrations` — MigrationService jobs (SimpleRouter ViewSet; skill `migrations`)

## Non-API routes worth knowing

- `/swagger` (UI), `/swagger.json|.yaml` (schema), `/api-auth/`
- `/rss/`, `/rss/search` — RSS feeds
- `/fu/...` — Fine Uploader chunked upload endpoints (browser flow)
- `/i18n/` — Django i18n switch; `/setlanguage` — frontend language switch
- `/sitemap.xml` — only when `GENERATE_SITEMAP`
