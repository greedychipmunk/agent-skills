---
name: rbac-permissions
description: Align MediaCMS roles and permissions across docs, Django backend, and React frontend. Use when auditing RBAC, CAN_* gates, PORTAL_WORKFLOW, MEDIA_IS_REVIEWED, FE/BE permission mismatches, or permissions-changes documentation.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/rbac-permissions
---

# RBAC and permissions

> **Scope:** targets the [mrjoshuap-hq/mediacms](https://github.com/mrjoshuap-hq/mediacms) fork (`mediacms-next` branch). Repo paths such as `admin_customizations/`, `docs/en/…`, and `AGENTS.md` resolve in that repository checkout; sibling skills are referenced by name from this `mediacms` collection.

## Instructions

1. Prefer config and gate fixes over schema changes.
2. Cross-check in this order:
   - Role docs under `docs/en/roles/`
   - Operator/admin guides for behavior
   - Django permission classes / settings
   - React UI gates (hide vs allow)
3. Notable settings (overrides in `local_settings`, not committed casually): `PORTAL_WORKFLOW`, `CAN_ADD_MEDIA`, `CAN_COMMENT`, `MEDIA_IS_REVIEWED`, `USE_RBAC`, `USE_SAML`, `USE_IDENTITY_PROVIDERS`.
4. When behavior changes, update permissions-changes / role docs and add or extend tests under `tests/rbac/`.
5. Document impact tables (who can do what before/after) for non-trivial permission changes.

## Additional resources

- `docs/en/roles/` (including `compare.md`)
- `docs/en/guides/operator/permissions.md`
- `docs/en/guides/admin/permissions-changes.md`
- `docs/en/guides/admin/permissions-audit-matrix.md`
- `docs/en/guides/admin/settings.md`
- Code: `rbac/`, `users/`, `cms/` permission helpers; tests: `tests/rbac/`
- Python reference: `docs/en/reference/python.md`
