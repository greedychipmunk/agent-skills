# Upload flows and payload recipes

## Simple upload (REST)

```bash
curl -u user:pass http://localhost/api/v1/media \
  -F media_file=@video.mp4 \
  -F title="My video" \
  -F description="Optional description" \
  -F new_tags="tag1, tag2" \
  -F category_titles="Lectures" \
  -F state=unlisted
```

Response: serialized media with `friendly_token`. Encoding is async: `encoding_status` starts `pending`, becomes `running`, then `success`/`fail`. Poll the detail endpoint.

## Metadata edit

```bash
curl -u user:pass -X POST http://localhost/api/v1/media/{friendly_token} \
  -F title="New title" -F new_tags="a, b"
```

POST and PUT both edit. Replacing the file itself needs `ALLOW_MEDIA_REPLACEMENT = True`.

## Bulk actions

```bash
curl -u user:pass -X POST http://localhost/api/v1/media/user/bulk_actions \
  -H 'Content-Type: application/json' \
  -d '{"media_ids": ["AbCdEfGh"], "action": "add_to_category", "category_uids": ["c8f5..."]}'
```

`set_state` requires the caller to control the media; `change_owner` and ownership actions are admin/manage-page operations.

## Chunked browser upload (Fine Uploader)

The web UI uploads through `/fu/` (uploader app): chunked, concurrent (`CONCURRENT_UPLOADS`), resumable via `chunks_done` param. Video duration > `CHUNKIZE_VIDEO_DURATION` is additionally split for encoding (skill `media-pipeline`). Script against `/api/v1/media` instead — it is the stable surface.

## cli-tool

```bash
cd cli-tool && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env 2>/dev/null || true   # edit: base URL + credentials
python cli.py login      # authenticate, store creds
python cli.py whoami     # verify
```

## Common failures

| Symptom | Cause |
| ------- | ----- |
| 401 on every call | Bad credentials; check with `GET /api/v1/whoami` |
| 403 on upload | `CAN_ADD_MEDIA`/`UPLOAD_MEDIA_ALLOWED` excludes the role, or `NUMBER_OF_MEDIA_USER_CAN_UPLOAD` reached |
| 403 on edit/delete | Not owner and not editor/manager/admin (skill `rbac-permissions`) |
| Upload rejected | File type not in `ALLOWED_MEDIA_UPLOAD_TYPES`, or over `UPLOAD_MAX_SIZE` |
| Media never lists | `state=public` + `encoding_status=success` + `is_reviewed=True` required for `listable` |
