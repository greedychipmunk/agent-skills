---
name: portal-configuration
description: Configure a MediaCMS portal through local_settings.py overrides — portal identity and branding, workflow (public/private/unlisted), registration and access rules, media action permissions, upload limits, email/SMTP, notifications, and customization recipes like static pages, analytics, and themes. Use when changing any setting, diagnosing why a setting did not take effect, or validating a settings file offline.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# MediaCMS Portal Configuration

> **Scope:** targets [mediacms-io/mediacms](https://github.com/mediacms-io/mediacms) v9.6.1 (commit `99a1801`, branch `main`). Defaults live in `cms/settings.py`; this skill covers overriding them.

## The override mechanism

Edit `cms/local_settings.py` (plain install) or `deploy/docker/local_settings.py` (Docker — copied over `cms/local_settings.py` at container start). Then restart everything that reads settings:

```bash
docker compose restart web celery_worker celery_beat
```

Settings not taking effect is almost always a missed restart (or editing the wrong file on Docker).

## The settings that matter most

| Group | Settings |
| ----- | -------- |
| Identity | `PORTAL_NAME`, `PORTAL_DESCRIPTION`, `DEFAULT_THEME`, `EXTRA_CSS_PATHS`, `SIDEBAR_FOOTER_TEXT`, logo paths (`PORTAL_LOGO_DARK_PNG`…), `FRONTEND_HOST` |
| Workflow | `PORTAL_WORKFLOW` (public/private/unlisted default state), `MEDIA_IS_REVIEWED` (False ⇒ uploads need review before listing), `GLOBAL_LOGIN_REQUIRED`, `GENERATE_SITEMAP`, `INCLUDE_LISTING_NUMBERS`, `USE_ROUNDED_CORNERS` |
| Access | `CAN_ADD_MEDIA` / `CAN_COMMENT` (all/email_verified/advancedUser), `LOGIN_ALLOWED`, `REGISTER_ALLOWED`, `USERS_CAN_SELF_REGISTER`, `USERS_NEEDS_TO_BE_APPROVED`, `UPLOAD_MEDIA_ALLOWED`, `ACCOUNT_EMAIL_VERIFICATION` (optional/mandatory/none), `ACCOUNT_LOGIN_ATTEMPTS_LIMIT`/`_TIMEOUT`, domain allow/deny lists |
| Actions | `CAN_LIKE_MEDIA`, `CAN_DISLIKE_MEDIA`, `CAN_REPORT_MEDIA`, `CAN_SHARE_MEDIA`, `ALLOW_RATINGS`, `ALLOW_VIDEO_TRIMMER`, `ALLOW_MENTION_IN_COMMENTS`, `ALLOW_MEDIA_REPLACEMENT`, `ALLOW_CUSTOM_MEDIA_URLS`, `ALLOW_ANONYMOUS_ACTIONS` |
| Limits | `UPLOAD_MAX_SIZE` (bytes), `UPLOAD_MAX_FILES_NUMBER`, `NUMBER_OF_MEDIA_USER_CAN_UPLOAD`, `MAX_MEDIA_PER_PLAYLIST`, `MAX_CHARS_FOR_COMMENT`, `REPORTED_TIMES_THRESHOLD` |
| Email | `EMAIL_HOST`/`PORT`/`USER`/`PASSWORD`, `EMAIL_USE_TLS` XOR `EMAIL_USE_SSL`, `EMAIL_TIMEOUT`, `DEFAULT_FROM_EMAIL` |
| Notifications | `USERS_NOTIFICATIONS` (`MEDIA_ADDED`), `ADMINS_NOTIFICATIONS` (`NEW_USER`, `MEDIA_ADDED`, `MEDIA_REPORTED`) |
| Uploads | `ALLOWED_MEDIA_UPLOAD_TYPES` (["video","audio","image","pdf"], or "all"), upload messages |
| Members | `CAN_SEE_MEMBERS_PAGE` (all/anonymous/editors/admins), `ALLOW_ANONYMOUS_USER_LISTING`, `USER_SEARCH_FIELD` (name_username/name_username_email) |
| Features | `USE_RBAC`, `USE_SAML`, `USE_IDENTITY_PROVIDERS`, `USE_LTI`, `USE_WHISPER_TRANSCRIBE` (see the dedicated skills) |

Full annotated catalog: [references/settings-catalog.md](references/settings-catalog.md). Recipes (static pages, analytics, cookie consent, themes): [references/customization.md](references/customization.md).

## Email debugging (most common failure)

- Port 587 ⇒ `EMAIL_USE_TLS = True`, `EMAIL_USE_SSL = False`
- Port 465 ⇒ `EMAIL_USE_SSL = True`, `EMAIL_USE_TLS = False`
- Both True raises an error — mutually exclusive
- 465 + STARTTLS hangs until `EMAIL_TIMEOUT` expires

Live test from the Django shell (`make admin-shell`):

```python
from django.core.mail import EmailMessage
from django.conf import settings
settings.EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
email = EmailMessage('title', 'msg', settings.DEFAULT_FROM_EMAIL, ['you@example.com'])
email.send(fail_silently=False)   # error message tells you what's wrong
```

## Validate a settings file offline

```bash
python scripts/check_settings.py path/to/local_settings.py          # errors fail, unknowns warn
python scripts/check_settings.py local_settings.py --strict --json  # unknowns also fail, JSON output
```

Checks names against the upstream v9.6.1 catalog, value types, choice-constrained settings, and the TLS/SSL exclusion. Stdlib-only. Offline tests: [tests/test_check_settings.py](tests/test_check_settings.py).

## Additional resources

- `docs/admins_docs.md` §5 (configuration), §15 (email), §16–19 (FAQ/customization)
- Skills: `rbac-permissions` (what the access settings mean), `auth-identity` (SAML/IDP settings), `media-pipeline` (transcoding settings), `i18n` (language settings)
