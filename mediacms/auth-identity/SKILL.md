---
name: auth-identity
description: Configure and fix MediaCMS authentication and identity providers—django-allauth, Login Options, OAuth/social apps, SAML, login templates, and secret field handling. Use when adding GitHub or other IdP login, editing identity_providers, login UI/theme parity, or CSRF/trusted-origin issues after auth changes.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/auth-identity
---

# Auth and identity providers

## Instructions

1. Prefer admin/config and template changes over schema migrations.
2. **Login Options** and provider rows in `identity_providers/` drive which buttons appear; keep them aligned with `templates/account/login.html` and related account templates.
3. OAuth/social apps use allauth `SocialApp` (and related admin forms). SAML uses `saml_auth` — see `docs/en/guides/admin/saml.md`.
4. **Secrets must never display** in admin change forms. Use password inputs with `render_value=False`, “clear saved secret/key” checkboxes, and keep stored values when the field is left blank (see `identity_providers/forms.py`).
5. After changing hosts or preview URLs, verify `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS` in **local** settings — do not commit `deploy/docker/local_settings.py`.
6. Keep FE/admin theme switcher behavior consistent on login pages when touching auth UI (skill `admin-portal` for admin theme tokens).
7. Cross-check role gates with skill `rbac-permissions` when login success still blocks features.

## Checklist

- [ ] Provider enabled in admin / Login Options as intended
- [ ] Callback / ACS / issuer URLs match the running `FRONTEND_HOST`
- [ ] Client secret / SP private key not shown after save
- [ ] Clear-secret / clear-key path works; blank submit keeps existing secret
- [ ] Sign-in page shows expected password and/or IdP buttons
- [ ] CSRF trusted origins include HTTPS preview hosts if used

## Additional resources

- Code: `identity_providers/`, `saml_auth/`, `templates/account/`
- `docs/en/guides/admin/saml.md`, `docs/en/guides/admin/integrations.md`
- `docs/en/guides/admin/settings.md` (`USE_SAML`, `USE_IDENTITY_PROVIDERS`, allauth-related)
- Skills: `rbac-permissions`, `admin-portal`, `merge-hygiene`, `dev-stack`
