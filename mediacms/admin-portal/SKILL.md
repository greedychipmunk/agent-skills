---
name: admin-portal
description: Extend or fix the Jazzmin MediaCMS admin portal—dashboard sections, sidebar, health checks, changelists, change forms, and light/dark theme. Use when working on admin_customizations, the admin dashboard, overview pages, sidebar order, health checks, moderation queues, or Flatly/Darkly theme polish.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/admin-portal
---

# Admin portal

> **Scope:** targets the [mrjoshuap-hq/mediacms](https://github.com/mrjoshuap-hq/mediacms) fork (`mediacms-next` branch). Repo paths such as `admin_customizations/`, `docs/en/…`, and `AGENTS.md` resolve in that repository checkout; sibling skills are referenced by name from this `mediacms` collection.

## Instructions

1. Prefer existing patterns in `admin_customizations/` over new frameworks or schema changes.
2. Keep **sidebar group order** and **overview section/selector order** in sync.
3. New dashboard sections need: metrics (or clear empty state), icons + labels, health wiring when relevant, and translations (skill `i18n`).
4. Follow the checklist in [references/dashboard-checklist.md](references/dashboard-checklist.md).
5. Verify **light and dark** (Flatly / Darkly): contrast, active filters, selected tabs, action bars.
6. After UI string changes, apply skill `i18n` (Django gettext for admin templates/Python).

## Code anchors

- Sidebar grouping: `admin_customizations/sidebar.py`
- Dashboard / health / stats modules: `admin_customizations/*.py` (e.g. `status_health.py`, `deployment_health.py`, `processing_stats.py`)
- Templates: `admin_customizations/templates/`
- Admin registration: `admin_customizations/admin.py`

## Additional resources

- [references/dashboard-checklist.md](references/dashboard-checklist.md)
- `docs/en/guides/admin/` (portal maps, site, integrations, moderation)
- `docs/en/guides/developer/architecture.md` (Manage vs Admin)
- `docs/en/scenarios/staff-dashboard.md`, `docs/en/scenarios/superuser-health.md`
