# Dual i18n quick reference

## Frontend (`files/frontend_translations`)

- Always edit **`en.py` first**, then run `process_translations` / `make languages`.
- Other language files are populated from English; fill translations afterward.
- Django template-only changes do **not** need a frontend rebuild; React string changes do (`make frontend-build`).

## Admin (Django gettext)

- Templates: `{% load i18n %}` then `{% trans "…" %}` / `{% blocktrans %}`.
- Python: `gettext` / `gettext_lazy` for admin labels, actions, and messages.
- Jazzmin / custom admin templates under `admin_customizations/templates/` follow the same rules.

## Common misses

| Area | Failure mode |
| -------------------- | ------------------------------------------------ |
| Action dropdowns | Untranslated `"object name: Action"` style labels |
| Overview metrics | Hard-coded English section titles |
| Sidebar | Group names not wrapped for gettext |
| RTL | Body/sidebar overlap after LTR-only QA |

## Priority languages (fork practice)

When translating admin UI, prioritize completeness for **el**, **de**, **es** (then others such as **pt**) unless the task names a specific language.
