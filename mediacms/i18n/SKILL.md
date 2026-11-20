---
name: i18n
description: Add, improve, and manage MediaCMS translations across the React frontend and Django templates — the en.py master file, the process_translations management command, adding new languages, and the rebuild rules that decide when changes become visible. Use when translating strings, adding languages, fixing missing-translation keys, or preparing a translation change for an upstream PR.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# MediaCMS Translations

> **Scope:** targets [mediacms-io/mediacms](https://github.com/mediacms-io/mediacms) v9.6.1 (commit `99a1801`, branch `main`). Translation files: `files/frontend_translations/`; command: `files/management/commands/process_translations.py`.

## The two translation surfaces

1. **React frontend** — strings wrapped with `translateString` in `frontend/src`; served from Python dicts in `files/frontend_translations/<lang>.py`
2. **Django templates** — `{% trans %}`/gettext blocks in `templates/` (see `templates/cms/about.html` for the pattern)

Each language file defines two dicts: `translation_strings` (English key → translation, `""` = untranslated) and `replacement_strings`. `en.py` is the **master key set** (~315 keys, sorted).

## The workflow (mandatory for upstream PRs)

1. Mark the string translatable in code (React `translateString` or template `{% trans %}`)
2. Add the English string to `files/frontend_translations/en.py` first
3. Run:

```bash
python manage.py process_translations
```

This propagates the new key into **every** language file (as untranslated). Upstream will not accept a PR that skips this — it guarantees no language is missing a key.

4. Translate the string in the language(s) you care about
5. Rebuild rules: template-only changes need no rebuild; React string changes need `make build-frontend` to appear on port 80

## Language management

- **Default language**: `LANGUAGE_CODE` in `settings.py`
- **Limit the selector**: remove entries from the `LANGUAGES` list in `settings.py` — only listed languages appear
- **Add a language**: add it to `LANGUAGES`, then copy `en.py` to `files/frontend_translations/<code>.py` and translate
- ~23 frontend translation files ship: ar, bn, da, de, el, es, fr, he, hi, id, it, ja, ko, nl, pt, ru, sl, tr, ur, zh_hans, zh_hant…
- Runtime switching: `/setlanguage` (frontend) and Django's `/i18n/` URLs

## Check translation files offline

```bash
python scripts/check_translations.py files/frontend_translations/en.py files/frontend_translations/de.py
python scripts/check_translations.py --dir /path/to/mediacms/files/frontend_translations   # all languages vs en.py
```

Reports keys missing from a language (run `process_translations` to fix), stale keys not in en.py, and how many strings remain untranslated. Stdlib-only. Tests: [tests/test_check_translations.py](tests/test_check_translations.py).

## Additional resources

- [references/translation-workflow.md](references/translation-workflow.md)
- `docs/admins_docs.md` §10, §20
- Skills: `dev-stack` (frontend rebuild), `portal-configuration` (LANGUAGE settings)
