---
name: auth-identity
description: Set up MediaCMS authentication beyond local accounts — django-allauth email/password flows, Identity Providers (admin-managed providers with role, group, and category mappings), SAML single sign-on including SP metadata, certificates, and Entra ID, and LTI 1.3 integration with Moodle. Use when configuring SSO, mapping identity-provider roles to MediaCMS roles or RBAC groups, debugging login flows, or enabling LMS embedding.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# MediaCMS Auth and Identity Providers

> **Scope:** targets [mediacms-io/mediacms](https://github.com/mediacms-io/mediacms) v9.6.1 (commit `99a1801`, branch `main`). Apps: `identity_providers/`, `saml_auth/`, `lti/`; docs: `docs/saml_entraid_setup.md`, `docs/moodle_plugin.md`.

## Layers

1. **Local accounts** — django-allauth (`/accounts/...`): email/password, email verification, login attempts rate limit, approval workflow (see skill `portal-configuration` for the settings)
2. **Identity Providers** (`USE_IDENTITY_PROVIDERS = True`) — Django-admin-managed providers; SAML ships out of the box, any allauth provider can be added; stores login-option lists and SAML response logs
3. **SAML** (`USE_SAML = True`) — SSO with role/group/category mapping into MediaCMS
4. **LTI 1.3** (`USE_LTI = True`) — LMS embedding (Moodle plugin in `lms-plugins/mediacms-moodle`)

## Enabling SAML

`local_settings.py`:

```python
USE_RBAC = True
USE_SAML = True
USE_IDENTITY_PROVIDERS = True

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True

SOCIALACCOUNT_ADAPTER = 'saml_auth.adapter.SAMLAccountAdapter'
SOCIALACCOUNT_PROVIDERS = {
    "saml": {
        "provider_class": "saml_auth.custom.provider.CustomSAMLProvider",
    }
}
```

Restart `web`, `celery_worker`, `celery_beat`. SP metadata is auto-generated at `/saml/metadata`.

## Configure the provider (Django admin)

**Step 1 — Identity Provider entry**: provider `saml`, provider ID, IDP config name, client ID (the login identifier shared with the IDP), default site.

**Step 2 — SAML Configuration**: IDP ID (must be a URL), IDP certificate (x509), SSO URL, SLO URL, SP metadata URL (e.g. `https://{portal}/saml/metadata`), optional SP certificate + SP private key (PEM) for signed/encrypted communication — if one is set, both must be.

**Step 3 — Options**:
- `verified_email` — mark SAML emails as verified
- Remove from groups — sync group removals from the IDP
- **Global role mapping** — SAML role → MediaCMS role
- **Group role mapping** — SAML role → role within mapped groups
- **Group mapping** — SAML group ids → MediaCMS groups
- **Category mapping** — SAML group id → MediaCMS category (RBAC)

## Identity Providers app

With `USE_IDENTITY_PROVIDERS = True`, the admin gains an "Identity Providers" tab: add providers, set mappings, define which login options appear on the login page (system login, IDP login), and browse saved SAML response logs after each authentication. Response attributes like `role` or `groups` map to MediaCMS roles (advanced user, editor, manager, admin) and RBAC groups.

## LTI 1.3 / Moodle

- `USE_LTI = True` enables the `lti/` app (adapters, deep linking, handlers)
- Moodle plugin source: `lms-plugins/mediacms-moodle`; setup guide: `docs/moodle_plugin.md`
- LTI embeds mark media shared via `POST /api/v1/media/{token}/share` and can link an RBAC category by `courseid`

## Troubleshooting

| Symptom | Fix |
| ------- | ---- |
| Redirect loops | `USE_X_FORWARDED_HOST` + `SECURE_PROXY_SSL_HEADER` must match the proxy setup |
| Metadata 404 | `USE_SAML` not enabled — `/saml/metadata` route is conditional |
| Assertions rejected | SP certificate/private key pair incomplete, or IDP certificate mismatch |
| Roles not applied | Check the SAML Configuration's role/group mappings; inspect the saved response log |
| Login options missing | Identity Provider entry's site must be the default site |

## Additional resources

- [references/saml-setup.md](references/saml-setup.md)
- `docs/saml_entraid_setup.md` (full Entra ID walkthrough, usable as reference for other IDPs)
- Skills: `rbac-permissions` (what mapped roles mean), `portal-configuration` (account settings)
