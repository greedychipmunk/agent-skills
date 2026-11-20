# Transcoding settings and protected-media serving

## Transcoding settings (cms/settings.py)

| Setting | Notes |
| ------- | ----- |
| `FFMPEG_COMMAND` / `FFPROBE_COMMAND` | Executable paths |
| `FFMPEG_DEFAULT_PRESET` | `medium` default; ultrafast→veryslow |
| `DO_NOT_TRANSCODE_VIDEO` | Skip transcoding + sprites entirely |
| `CHUNKIZE_VIDEO_DURATION` | Videos longer than this get chunked (default ~4 min) |
| `VIDEO_CHUNKS_DURATION` | Chunk duration; must be smaller than the above |
| `MINIMUM_RESOLUTIONS_TO_ENCODE` | Resolutions always encoded, even upscaling |
| `SPRITE_NUM_SECS` | Sprite sampling seconds (default 10) |
| `MP4HLS` / `MP4HLS_COMMAND` | Bento4 packaging |
| `MEDIA_ENCODING_DIR`, `HLS_DIR`, `CHUNKS_DIR`, `MEDIA_UPLOAD_DIR`, `SUBTITLES_UPLOAD_DIR`, `THUMBNAIL_UPLOAD_DIR`, `TEMP_DIRECTORY`, `UPLOAD_DIR` | Storage layout under `MEDIA_ROOT` |
| `CALCULATE_MD5SUM` | Whether to hash uploads |

## Whisper

- `USE_WHISPER_TRANSCRIBE = True` — only works on Docker installs with the `full` image (`docker-compose.full.yaml` or `mediacms/mediacms:full` for celery_worker)
- `WHISPER_MODEL` — default `base`
- `USER_CAN_TRANSCRIBE_VIDEO` — whether regular users can request transcription (default True)
- Per-media: `allow_whisper_transcribe`, `allow_whisper_transcribe_and_translate`
- Output: VTT under the "automatic" language option; runs the `whisper` CLI on the audio track

## Protected media via X-Accel

When `USE_X_ACCEL_REDIRECT = True`, Django never streams media bytes; nginx does, after a Django permission check:

1. Player requests `/media/encoded/...` or `/media/hls/...`
2. nginx hits `location = /_media_auth` (proxied to Django `/api/v1/media-auth`)
3. Django checks media permissions (`X_ACCEL_PROTECTED_PATHS`), answers 200/403 (cached `X_ACCEL_AUTH_CACHE_SECONDS`)
4. nginx serves the file via `X-Accel-Redirect` internal locations

Originals (`/media/original/...`) get the same check; unknown file types download instead of playing inline. PDFs go through `/_protected_pdf/`. Behind a custom nginx, keep these location blocks in sync with `deploy/docker/nginx_http_only.conf` on every upgrade.

## Sprite troubleshooting detail

The ImageMagick policy error looks like:

```
convert-im6.q16: width or height exceeds limit `/tmp/img001.jpg' @ error/cache.c/OpenPixelCache/3912.
```

Fix `/etc/ImageMagick-6/policy.xml`:

```xml
<policy domain="resource" name="height" value="16000KP"/>
<policy domain="resource" name="width" value="16000KP"/>
```

Then re-run `produce_sprite_from_video` for affected media (loop in the shell — see SKILL.md). Only newly added videos pick the fix up automatically.

## Worker topology notes

- One `celery_worker` service consumes short + long queues; beat (`celery_beat`) drives the `check_*` reconciliation tasks — both must run, or encodings stall in `pending`/`running`
- On scalable deployments, split with `ENABLE_CELERY_SHORT` / `ENABLE_CELERY_LONG` (skill `dev-stack`)
- All workers and web must see the same `media_files/` filesystem
