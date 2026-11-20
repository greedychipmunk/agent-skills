# Encoding lifecycle at model level

## Models (files/models/encoding.py)

### EncodeProfile
`name` (max 90), `extension` (ENCODE_EXTENSIONS), `resolution` (ENCODE_RESOLUTIONS, nullable), `codec` (CODECS, nullable), `description`, `active` (default True). Ordered by resolution. Fixtures ship sensible defaults; the `preview` profile produces hover previews.

### Encoding
One row per (media × profile), or per chunk: `media` FK, `profile` FK, `status` (pending/running/fail/success), `chunk` (bool), `chunk_file_path`, `chunks_info` (JSON of expected chunk paths), `commands` (the ffmpeg commands run), `logs`, `md5sum`, `size`, `add_date`.

## Concatenation (post-save signal)

When a chunk Encoding reaches `status=success`, the signal handler:
1. Parses `chunks_info` for the expected chunk paths
2. Verifies every chunk Encoding for that (media, profile, chunks_info) is `success` and its file exists
3. Concatenates chunk files into a temp file, creates the final `Encoding` (`chunk=False`, `status="success"`), attaches it to the media, and deletes the chunk rows/files

If any chunk is missing or failed, the media stays incomplete until reconciled by beat tasks.

## Celery tasks (files/tasks.py)

| Task | Purpose |
| ---- | ------- |
| `media_init` | Post-upload init: ffprobe metadata, sets encoding running |
| `chunkize_media` | Split long videos into chunks |
| `encode_media` | FFmpeg encode per profile (direct or chunk) |
| `create_hls` | MP4/HLS packaging via Bento4 (`MP4HLS_COMMAND`) |
| `produce_sprite_from_video` | Sprite sheet for timeline hover previews |
| `produce_preview` | Hover preview clips sampled across the video |
| `whisper_transcribe` | VTT subtitles (optional English translation) |
| `update_search_vector` | Postgres full-text search vector |
| `video_trim_task` / `post_trim_action` | Trim video flow (`ALLOW_VIDEO_TRIMMER`) |
| `check_running_states` / `check_media_states` / `check_pending_states` / `check_missing_profiles` | Beat-driven reconciliation |
| `update_listings_thumbnails` / `get_list_of_popular_media` | Listing maintenance |
| `clear_sessions` | Session cleanup |

Queues: short (`celery_worker`) vs long (`long_tasks` queue on the same worker image). Beat schedule lives in `CELERY_BEAT_SCHEDULE`.

## Media.save hooks (files/models/media.py)

- New media → `media_init.apply_async(args=[friendly_token], countdown=5)`
- `thumbnail_time` changes → re-generate thumbnail
- Whisper flag changes on video/audio → (re)queue `whisper_transcribe`
- `listable` recomputed on save: `state == "public" and encoding_status == "success" and is_reviewed`
- `friendly_token` auto-generated (length `FRIENDLY_TOKEN_LEN`) if unset

## upgrade_previews (management command)

Migrates gif hover previews to mp4:

```bash
python manage.py upgrade_previews --dry-run          # list what would change
python manage.py upgrade_previews --token=AbCdEfGhI  # one media
python manage.py upgrade_previews                    # all, one at a time
```

Encodes the mp4 **before** removing the gif. `--async` hands everything to `long_tasks` at once — dangerous on large libraries; gifs are then cleared by re-running without `--async`.
