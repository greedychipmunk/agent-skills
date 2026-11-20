# MediaCMS Skills

Nine skills for working with [MediaCMS](https://github.com/mediacms-io/mediacms),
the open-source video/media CMS (Django + React + Celery). They are verified
against upstream **v9.6.1** (commit `99a1801`, branch `main`) — every scope
note in each `SKILL.md` pins that version, and paths/commands were read from
that checkout.

| Skill | Covers |
| ----- | ------ |
| [auth-identity](./auth-identity) | allauth, Identity Providers, SAML SSO, LTI 1.3 |
| [dev-api](./dev-api) | REST API v1, uploads, actions, Swagger, cli-tool, smoke script |
| [dev-stack](./dev-stack) | dev compose stack, make targets, deployment options, upgrades |
| [i18n](./i18n) | frontend_translations, process_translations, languages, rebuild rules |
| [media-pipeline](./media-pipeline) | transcoding, chunks, EncodeProfiles, HLS, sprites, Whisper, X-Accel |
| [migrations](./migrations) | Kaltura / YouTube / Panopto import jobs |
| [portal-configuration](./portal-configuration) | local_settings.py surface, email, notifications, branding, recipes |
| [rbac-permissions](./rbac-permissions) | media states, roles, MediaPermission, RBAC groups |
| [testing](./testing) | pytest (TESTING=True), Jest, pre-commit, coverage |

Three skills ship offline validators with their own test suites:
`dev-api/scripts/api_smoke.py` (live instance smoke test),
`portal-configuration/scripts/check_settings.py` (settings file validator),
and `i18n/scripts/check_translations.py` (translation completeness checker).

MediaCMS itself is AGPL-3.0 (© Markos Gogoulos); these skills are original
documentation under the repository's MIT license.

> History: this folder previously vendored 14 fork-specific skills by
> Josh Preston (@mrjoshuap) under AGPL-3.0. They were replaced by the
> upstream-verified set above; the vendoring record remains in git history
> (PRs #24–#25).
