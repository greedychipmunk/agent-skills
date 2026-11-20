---
name: dev-api
description: Exercise the MediaCMS REST API against a running development instance for smoke tests, upload validation, and auth checks. Use when verifying /api/v1 endpoints, media upload metadata, session or basic auth, or Swagger-driven manual testing on localhost.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/dev-api
---

# Dev API (live instance)

Use this for **manual / agent smoke** against a running stack. Automated coverage belongs in pytest (skill `test-ci`).

## Prerequisites

- Stack up (`make docker-up`); prefer http://localhost:80
- Default superuser: `admin` / `admin`
- OpenAPI/Swagger: http://localhost/swagger/ (ReDoc also under `/docs/` paths — don’t confuse with MkDocs `/documentation/`)

## Auth

- Session auth (browser cookie after login) or **HTTP basic** for curl/scripts
- Permissions follow portal settings and roles (skill `rbac-permissions`)

```bash
# Who am I / session check (adjust path if needed)
curl -s -u admin:admin http://localhost/api/v1/user

# List media
curl -s -u admin:admin http://localhost/api/v1/media
```

## Media upload smoke

`POST /api/v1/media` with multipart `media_file`, plus optional `title`, `description`.

Optional metadata (also on `PUT /api/v1/media/{friendly_token}`):

- `state`, `category_uids` / `category_titles`, `tag_titles`
- `enable_comments`, `allow_download`
- Editor-only: `owner`

FineUploader-style success payloads may include `friendly_token` and `thumbnailUrl`.

```bash
curl -s -u admin:admin \
  -F "media_file=@/path/to/sample.mp4" \
  -F "title=API smoke" \
  -F "description=dev-api skill check" \
  http://localhost/api/v1/media
```

After video upload, encoding runs async (skill `media-pipeline`). Poll media detail or admin processing views; don’t assume instant HLS.

## Validation checklist

- [ ] 401/403 behave as expected for anonymous vs authed
- [ ] Upload rejected types respect `ALLOWED_MEDIA_UPLOAD_TYPES`
- [ ] Private/unlisted/`PORTAL_WORKFLOW` visibility matches settings
- [ ] Owner override only works for privileged users
- [ ] CSRF not required for basic-auth API; browser session POSTs from other origins need `CSRF_TRUSTED_ORIGINS` (local_settings — don’t commit)

## Additional resources

- `docs/en/reference/api.md`, `docs/en/guides/developer/architecture.md` (upload metadata)
- Swagger UI on the running instance
- Tests: `tests/api/` (patterns to mirror, not replace)
- Skills: `dev-stack`, `rbac-permissions`, `media-pipeline`, `test-ci`
