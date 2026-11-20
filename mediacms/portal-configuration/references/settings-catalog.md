# Settings catalog — MediaCMS v9.6.1

All names exist in `cms/settings.py` at commit `99a1801`. Override in `local_settings.py`. Types: what `check_settings.py` validates.

## Portal identity

| Setting | Type | Default / notes |
| ------- | ---- | --------------- |
| `PORTAL_NAME` | str | Portal title everywhere |
| `PORTAL_DESCRIPTION` | str | Meta description |
| `DEFAULT_THEME` | str | Frontend theme |
| `EXTRA_CSS_PATHS` | list | Extra CSS files loaded by templates |
| `SIDEBAR_FOOTER_TEXT` | str | Left sidebar footer |
| `PORTAL_LOGO_DARK_PNG` / `_SVG`, `PORTAL_LOGO_LIGHT_PNG` / `_SVG` | str | Logo paths |
| `FRONTEND_HOST` | str | Canonical external URL (http://localhost, https://domain) |
| `SHOW_ORIGINAL_MEDIA` | bool | Expose original file in player |

## Workflow and listing

| Setting | Type | Choices / notes |
| ------- | ---- | --------------- |
| `PORTAL_WORKFLOW` | str | `public` / `private` / `unlisted` — default state for new media |
| `MEDIA_IS_REVIEWED` | bool | False ⇒ uploads need editor review before listing |
| `GLOBAL_LOGIN_REQUIRED` | bool | Only logged-in users see content |
| `GENERATE_SITEMAP` | bool | Enables /sitemap.xml |
| `INCLUDE_LISTING_NUMBERS` | bool | Media counts on categories/tags pages |
| `USE_ROUNDED_CORNERS` | bool | Player/listing corner radius (large screens) |
| `VIDEO_PLAYER_FEATURED_VIDEO_ON_INDEX_PAGE` | bool | Featured video hero on index |
| `SLIDESHOW_ITEMS` | int | Index slideshow size |
| `TIMESTAMP_IN_TIMEBAR` | bool | Timestamp markers in the player timebar |
| `RELATED_MEDIA_STRATEGY` | str | Related media selection |

## Registration and access

| Setting | Type | Choices / notes |
| ------- | ---- | --------------- |
| `CAN_ADD_MEDIA` | str | `all` / `email_verified` / `advancedUser` |
| `CANNOT_ADD_MEDIA_MESSAGE` | str | Message shown when upload denied |
| `CAN_COMMENT` | str | `all` / `email_verified` / `advancedUser` |
| `LOGIN_ALLOWED` | bool | Disable logins |
| `REGISTER_ALLOWED` | bool | Registration open |
| `USERS_CAN_SELF_REGISTER` | bool | Self-registration |
| `USERS_NEEDS_TO_BE_APPROVED` | bool | Admin approval before first login (set "Is approved") |
| `UPLOAD_MEDIA_ALLOWED` | bool | Uploads enabled |
| `ACCOUNT_EMAIL_VERIFICATION` | str | `optional` / `mandatory` / `none` |
| `ACCOUNT_LOGIN_ATTEMPTS_LIMIT` | int | Default 20 |
| `ACCOUNT_LOGIN_ATTEMPTS_TIMEOUT` | int | Seconds; default 5 |
| `ALLOWED_DOMAINS_FOR_USER_REGISTRATION` | list | Only these email domains may register |
| `RESTRICTED_DOMAINS_FOR_USER_REGISTRATION` | list | These domains may not register |
| `GLOBAL_LOGIN_REQUIRED` | bool | Members-only portal while workflow stays public |
| `CAN_SEE_MEMBERS_PAGE` | str | `all` / `anonymous` / `editors` / `admins` |
| `ALLOW_ANONYMOUS_USER_LISTING` | bool | Anonymous access to users API (needed for anonymous members page) |
| `USER_SEARCH_FIELD` | str | `name_username` / `name_username_email` |

## Media actions

| Setting | Type | Notes |
| ------- | ---- | ----- |
| `CAN_LIKE_MEDIA` / `CAN_DISLIKE_MEDIA` / `CAN_REPORT_MEDIA` / `CAN_SHARE_MEDIA` | bool | Feature toggles |
| `ALLOW_RATINGS` | bool | Star ratings |
| `ALLOW_RATINGS_CONFIRMED_EMAIL_ONLY` | bool | Only verified-email users rate |
| `ALLOW_VIDEO_TRIMMER` | bool | In-player trimming |
| `ALLOW_MENTION_IN_COMMENTS` | bool | @mentions |
| `ALLOW_MEDIA_REPLACEMENT` | bool | Replace media_file via API |
| `ALLOW_CUSTOM_MEDIA_URLS` | bool | Edit friendly_token-based URL slug |
| `ALLOW_ANONYMOUS_ACTIONS` | list | Actions anonymous users may take |
| `MASK_IPS_FOR_ACTIONS` | bool | Privacy |

## Limits

| Setting | Type | Default |
| ------- | ---- | ------- |
| `UPLOAD_MAX_SIZE` | int | ~4GB in bytes |
| `UPLOAD_MAX_FILES_NUMBER` | int | 100 parallel uploads |
| `NUMBER_OF_MEDIA_USER_CAN_UPLOAD` | int | 100 per user, all roles |
| `MAX_MEDIA_PER_PLAYLIST` | int | Playlist cap |
| `MAX_CHARS_FOR_COMMENT` | int | 10000 |
| `REPORTED_TIMES_THRESHOLD` | int | Reports before auto-unlist |
| `FRIENDLY_TOKEN_LEN` | int | Media token length |

## Email

| Setting | Type | Notes |
| ------- | ---- | ----- |
| `EMAIL_BACKEND` | str | Default django.core.mail.backends… |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | str/int | SMTP |
| `EMAIL_USE_TLS` | bool | XOR with `EMAIL_USE_SSL` |
| `EMAIL_USE_SSL` | bool | XOR with `EMAIL_USE_TLS` |
| `EMAIL_TIMEOUT` | int | Seconds |
| `DEFAULT_FROM_EMAIL` / `SERVER_EMAIL` | str | Envelope senders |
| `ADMIN_EMAIL_LIST` | list | Receives admin notifications |

## Notifications

```python
USERS_NOTIFICATIONS = {'MEDIA_ADDED': True}
ADMINS_NOTIFICATIONS = {'NEW_USER': True, 'MEDIA_ADDED': True, 'MEDIA_REPORTED': True}
```

## Uploads

| Setting | Type | Notes |
| ------- | ---- | ----- |
| `ALLOWED_MEDIA_UPLOAD_TYPES` | list | ["video","audio","image","pdf"]; "all" disables the check |
| `PRE_UPLOAD_MEDIA_MESSAGE` | str | Shown before upload |
| `POST_UPLOAD_AUTHOR_MESSAGE_UNLISTED_NO_COMMENTARY` | bool | Post-upload message |

## Feature flags covered by other skills

`USE_RBAC` (`rbac-permissions`), `USE_SAML` + `USE_IDENTITY_PROVIDERS` (`auth-identity`), `USE_LTI` (`auth-identity`), `USE_WHISPER_TRANSCRIBE` + `WHISPER_MODEL` + `USER_CAN_TRANSCRIBE_VIDEO` (`media-pipeline`), `LANGUAGE_CODE` + `LANGUAGES` (`i18n`), transcoding knobs (`media-pipeline`).
