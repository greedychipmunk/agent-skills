---
name: media-pipeline
description: Understand and troubleshoot the MediaCMS upload-to-playback media pipeline — transcoding with FFmpeg, chunked encoding, EncodeProfiles, HLS, sprites and hover previews, Whisper subtitles, and protected-media serving via nginx X-Accel. Use when encoding is stuck or failing, choosing encode profiles/resolutions, changing transcoding presets or chunk sizes, regenerating sprites, enabling Whisper transcription, or debugging protected media 404s.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# MediaCMS Media Pipeline

> **Scope:** targets [mediacms-io/mediacms](https://github.com/mediacms-io/mediacms) v9.6.1 (commit `99a1801`, branch `main`). Code paths (`files/models/encoding.py`, `files/tasks.py`, `files/helpers.py`) resolve in that checkout.

## Pipeline overview

```
upload → Media row (encoding_status=pending)
      → media_init task → ffprobe metadata (media_info, duration, video_height)
      → per active EncodeProfile:
            video ≤ CHUNKIZE_VIDEO_DURATION  → encode_media directly
            longer videos → chunkize_media → per-chunk Encoding rows →
                workers transcode chunks → last chunk triggers concatenation
                into a final Encoding (chunk=False, status=success)
      → create_hls → HLS .ts segments (hls_file)
      → produce_sprite_from_video (sprites) + produce_preview (hover preview)
      → encoding_status=success
```

- `Media.encoding_status`: `pending` → `running` → `success` | `fail` (same choices for `Encoding.status`)
- Media becomes **listable** only when `state=public` AND `encoding_status=success` AND `is_reviewed=True`
- Celery workers must share the filesystem with the web service (local disk or NFS/EFS) — encodings are written to `MEDIA_ENCODING_DIR`, `HLS_DIR`, `CHUNKS_DIR`

## Encode profiles

Managed at `/admin/files/encodeprofile/` — fields: `name`, `extension`, `resolution` (240p–1080p), `codec` (h264/h265/vp9), `active`. Toggle `active` to enable/disable; profiles apply to **newly uploaded** media only. The `preview` profile (mp4, replacing gif) drives hover previews — a preview is identified by profile name, not extension.

## Key settings (override in `local_settings.py`)

| Setting | Default | Effect |
| ------- | ------- | ------ |
| `FFMPEG_DEFAULT_PRESET` | `medium` | ultrafast…veryslow tradeoff |
| `DO_NOT_TRANSCODE_VIDEO` | `False` | Serve original only; **also disables sprites** |
| `CHUNKIZE_VIDEO_DURATION` | ~240s | Longer videos split into chunks |
| `VIDEO_CHUNKS_DURATION` | smaller | Chunk length |
| `MINIMUM_RESOLUTIONS_TO_ENCODE` | — | Encode these even if upscaling |
| `SPRITE_NUM_SECS` | 10 | Sprite frame interval |
| `SHOW_ORIGINAL_MEDIA` | — | Expose original file in player |
| `USE_WHISPER_TRANSCRIBE` | `False` | Whisper subtitles (needs `full` image) |
| `WHISPER_MODEL` | `base` | Whisper model |

Advanced knobs (bitrates, CRF, audio codecs) live in `files/helpers.py`.

## Whisper transcription

1. Use `docker-compose.full.yaml` (or point celery_worker at `mediacms/mediacms:full`) — the regular image lacks whisper
2. Set `USE_WHISPER_TRANSCRIBE = True` in `local_settings.py`, restart `web` + `celery_worker`
3. Per-media flags: `allow_whisper_transcribe`, `allow_whisper_transcribe_and_translate` (to English); users can request when `USER_CAN_TRANSCRIBE_VIDEO = True`

Output: VTT subtitle under the "automatic" language option.

## Troubleshooting

| Symptom | Fix |
| ------- | ---- |
| Thumbnails missing on large videos | ImageMagick policy limit — raise width/height in `/etc/ImageMagick-6/policy.xml`, then regenerate sprites (below) |
| `encoding_status` stuck `running` | Beat tasks `check_running_states` / `check_media_states` / `check_pending_states` reconcile; ensure `celery_beat` runs |
| Missing resolutions on some videos | `check_missing_profiles` re-queues; profiles apply at upload time |
| Hover previews still gif | Run `python manage.py upgrade_previews --dry-run` first; needs `make build-frontend` for mp4 previews to render |
| Protected media 404 behind custom nginx | Copy `/_media_auth`, `/media/(encoded\|hls)`, `/media/original`, `/_protected_pdf` location blocks from `deploy/docker/nginx_http_only.conf` |

Regenerate sprites in the Django shell (`make admin-shell` → `./manage.py shell`):

```python
from files.models import Media
from files.tasks import produce_sprite_from_video
for media in Media.objects.filter(media_type='video', sprites=''):
    produce_sprite_from_video(media.friendly_token)
```

## Additional resources

- [references/encoding-lifecycle.md](references/encoding-lifecycle.md) — model-level detail
- [references/transcoding-and-serving.md](references/transcoding-and-serving.md) — settings, HLS, X-Accel
- `docs/transcoding.md`, `docs/admins_docs.md` §12, §16, §18, §21b
- Skills: `dev-stack` (worker/beat services), `dev-api` (`/api/v1/tasks`), `portal-configuration`
