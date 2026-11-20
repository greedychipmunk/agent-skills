---
name: dev-api
description: Use, test, and integrate against the MediaCMS REST API v1 — media listing/upload/edit/delete, actions, bulk actions, comments, playlists, categories, tags, search, users, encode profiles, and migrations endpoints. Use when scripting uploads or metadata updates, authenticating (session, HTTP Basic, or DRF token), debugging 401/403 permission errors, reading Swagger schemas, or using the bundled cli-tool.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# MediaCMS REST API

> **Scope:** targets [mediacms-io/mediacms](https://github.com/mediacms-io/mediacms) v9.6.1 (commit `99a1801`, branch `main`). Endpoints resolve at the site root of a running installation.

## Authentication

Three interchangeable schemes:

1. **Session** — log in through the UI, reuse the cookie
2. **HTTP Basic** — works on all API views (`Authorization: Basic base64(user:pass)`)
3. **DRF token** — `GET /api/v1/user/token` with Basic auth returns `{"token": "..."}`; then send `Authorization: Token <token>`

`GET /api/v1/whoami` (Basic auth) returns the authenticated user — the quickest credential check.

## Endpoint map

| Endpoint | Methods | Notes |
| -------- | ------- | ----- |
| `/api/v1/media` | GET, POST | GET list (`page`, `author`, `show=recommended|featured|latest`); POST = upload (multipart `media_file`) |
| `/api/v1/media/{friendly_token}` | GET, POST, PUT, DELETE | Detail; POST/PUT edit metadata, DELETE removes |
| `/api/v1/media/{token}/actions` | POST | `{"type": "like"\|"dislike"\|"report"\|"feature", ...}` |
| `/api/v1/media/user/bulk_actions` | POST | `media_ids` + `action` (playlist/category/tags/state/owner/ownership) |
| `/api/v1/media/{token}/comments` | GET, POST | Comment list/create |
| `/api/v1/media/{token}/chapters` | POST | Video chapters |
| `/api/v1/media/{token}/trim_video` | POST | Requires `ALLOW_VIDEO_TRIMMER` |
| `/api/v1/media/{token}/pdf` | GET | PDF viewer |
| `/api/v1/search` | GET | Search media |
| `/api/v1/categories`, `/api/v1/categories/{uid}` | GET | `contributor` variant lists RBAC-editable ones |
| `/api/v1/tags`, `/api/v1/comments`, `/api/v1/playlists` | GET | Listings |
| `/api/v1/playlists/{friendly_token}` | GET, POST | Playlist detail/edit |
| `/api/v1/user/action/{action}` | POST | User actions |
| `/api/v1/users`, `/api/v1/users/{username}` | GET | User list/detail |
| `/api/v1/whoami`, `/api/v1/user/token`, `/api/v1/login` | GET/POST | Auth helpers |
| `/api/v1/encode_profiles/` | GET | Active encode profiles |
| `/api/v1/tasks`, `/api/v1/tasks/{token}` | GET | Encoding task status |
| `/api/v1/manage_media|manage_comments|manage_users` | GET | Editor/manager/admin views |
| `/api/v1/media-auth` | GET | Protected-media auth handshake (nginx `X-Accel`) |
| `/api/v1/migrations` | GET, POST | Migration jobs (superuser; skill `migrations`) |

Full parameter details: [references/endpoints.md](references/endpoints.md). Upload and action payloads: [references/upload-and-actions.md](references/upload-and-actions.md).

## Upload essentials

```bash
curl -u user:pass -F media_file=@video.mp4 -F title="Title" \
     -F description="Desc" http://localhost/api/v1/media
```

- Multipart POST with `media_file` plus optional `title`, `description`, `new_tags` (comma list), `category_uids`/`category_titles`, `state` (public/private/unlisted), `license`
- Response contains `friendly_token`; encoding runs asynchronously — poll `encoding_status` on the detail endpoint or `/api/v1/tasks/{friendly_token}`
- Gated by `CAN_ADD_MEDIA` / `UPLOAD_MEDIA_ALLOWED` settings (skill `portal-configuration`)
- Chunked uploads (Fine Uploader) happen through `/fu/` endpoints — the browser flow, not the REST API

## Schema and tooling

- Swagger UI: `/swagger` — schema: `/swagger.json` (drf-yasg)
- Browsable API login: `/api-auth/`
- Bundled client: `cli-tool/cli.py` (`login`, `whoami`; own venv + `pip install -r cli-tool/requirements.txt`, `.env` in `cli-tool/`)

## Smoke-testing a live instance

```bash
python scripts/api_smoke.py --base-url http://localhost --user admin --password admin
python scripts/api_smoke.py --base-url http://localhost --user admin --password admin \
       --upload-file sample.mp4   # adds upload → detail → delete round-trip
```

Stdlib-only (no `requests`); exits non-zero on any failed check. Auth-less runs test only the anonymous endpoints. See [tests/test_api_smoke.py](tests/test_api_smoke.py) for offline coverage of request building and response classification.

## Additional resources

- `files/urls.py`, `users/urls.py`, `migrationservice/urls.py` (upstream route sources)
- Skills: `rbac-permissions` (401/403 causes), `media-pipeline` (encoding statuses), `migrations`
