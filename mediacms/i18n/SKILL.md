---
name: i18n
description: Add or fix MediaCMS translations for the React frontend and Django admin portal, including RTL layout checks. Use when adding UI strings, running process_translations, translating admin/dashboard text, or fixing Greek/German/Spanish/Portuguese/RTL issues.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/i18n
---

# i18n and translations

## Two systems

| Surface | Mechanism | Source of truth |
| ------------------------ | ----------------------------------------- | -------------------------------- |
| React / portal frontend | `translateString` + language `.py` files | `files/frontend_translations/en.py` first |
| Django admin / templates | `{% trans %}` / `gettext` | Django message catalogs / template tags |

Do not put admin-only strings only in `frontend_translations`, or React strings only in gettext.

## Frontend workflow (mandatory)

1. Mark the string in React (see existing `translateString` usage under `frontend/`).
2. Add the English string to `files/frontend_translations/en.py` **first**.
3. Run `make languages` (or `python manage.py process_translations`) to propagate.
4. Translate other languages in `files/frontend_translations/<lang>.py` as needed.
5. Rebuild frontend for port 80: `make frontend-build`.

## Admin workflow

1. Wrap user-visible strings with `{% trans %}` or `gettext` / `gettext_lazy`.
2. Audit sidebar, changelist headers, change-form tabs, action dropdowns, and metric labels.
3. Incomplete dropdowns often show raw `"object name: …"` — fix the message, don’t hide it in CSS.

## RTL smoke

After LTR looks correct, check an RTL language:

- [ ] Sidebar and main content do not overlap
- [ ] Refresh / filter controls stay usable
- [ ] Icons and chevrons flip or stay readable

See [references/dual-i18n.md](references/dual-i18n.md).

## Additional resources

- [references/dual-i18n.md](references/dual-i18n.md)
- `docs/en/guides/developer/translations.md`
- `docs/en/languages.md`
- `files/frontend_translations/en.py`
