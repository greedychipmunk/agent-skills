# SAML setup detail

## Why USE_RBAC with SAML

SAML role/group/category mappings target MediaCMS groups and RBAC categories; enabling RBAC gives those mappings a permission model to land in (skill `rbac-permissions`). SAML works without RBAC too, but the category mapping use case requires it.

## Settings block annotated

| Setting | Purpose |
| ------- | ------- |
| `USE_SAML` | Mounts `/saml/metadata`, activates the saml_auth app behavior |
| `USE_IDENTITY_PROVIDERS` | Admin UI for providers, mappings, response logs, login options |
| `SOCIALACCOUNT_ADAPTER` | `saml_auth.adapter.SAMLAccountAdapter` — wires allauth social login |
| `SOCIALACCOUNT_PROVIDERS["saml"]["provider_class"]` | `saml_auth.custom.provider.CustomSAMLProvider` |
| `USE_X_FORWARDED_HOST` | Honor the proxy's Host header |
| `SECURE_PROXY_SSL_HEADER` | Trust `X-Forwarded-Proto` from the proxy |
| `SECURE_SSL_REDIRECT` / cookie secure flags | HTTPS-only session behavior |

## The three admin entries in order

1. **Identity Provider** (`identity_providers` app): provider `saml`, provider ID, IDP config name, client ID, site (default). This registers the login option.
2. **SAML Configuration** (tab on the provider): IDP ID (URL), IDP certificate (x509 from the IDP), SSO URL, SLO URL, SP metadata URL, optional SP certificate + private key (both or neither). MediaCMS generates SP metadata at `/saml/metadata` — hand that URL to the IDP.
3. **Options**: verified_email, remove-from-groups, global role mapping, group role mapping, group mapping, category mapping.

## Entra ID specifics

`docs/saml_entraid_setup.md` covers the Entra ID (Azure AD) side: app registration, claims configuration (roles/groups), identifier URLs, and troubleshooting — and doubles as a template for other IDPs (Okta, Shibboleth, SimpleSAMLphp).

## Response logs

After each SAML authentication, the identity_providers app saves the response. Inspect these in the admin when mappings do not apply — the raw attributes show what role/group names actually arrived, which is what the mapping tables key on.

## Login page behavior

With identity providers enabled, `/accounts/login_system` (LoginView) renders the configured login options; `accounts/login` becomes the custom login view. Without it, standard allauth login is used.
