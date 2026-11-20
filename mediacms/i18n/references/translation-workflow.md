# Translation workflow detail

## What process_translations does

Reads `en.py`'s `translation_strings` and `replacement_strings`, then for every other `*.py` in `files/frontend_translations/` (except `__init__.py`): adds keys present in en but missing locally (value copied from English), removes local keys that no longer exist in en, and writes the file back. Keys stay sorted; existing translations are never overwritten.

Run it inside the container:

```bash
docker compose -f docker-compose-dev.yaml exec -T web python manage.py process_translations
```

## Marking strings translatable

**React** — `frontend/src`:

```js
import { translateString } from '...';
translateString('My new label')
```

**Django templates** — `templates/`:

```html
{% load i18n %}
{% trans "About" %}
```

Template strings use Django's gettext machinery; React strings use the frontend_translations dicts. A string that exists in both surfaces is translated once per surface.

## Rebuild decision table

| Change | Visible where | Rebuild needed |
| ------ | ------------- | -------------- |
| Template `{% trans %}` strings | :80 and :8088 | No |
| React `translateString` strings | :8088 | No (HMR) |
| React strings on :80 | :80 | Yes — `make build-frontend` |
| `LANGUAGES` list | Both | Restart web |

## RTL and locale notes

- Language codes use Django conventions (`zh_hans`, `zh_hant`)
- The language selector renders from `LANGUAGES`; users pick per-session via `/setlanguage`
- `USE_I18N`/`USE_L10N`/`USE_TZ` are on by default

## Common mistakes

| Mistake | Consequence |
| ------- | ----------- |
| Translating in a language file without adding the key to en.py | Key is stale; process_translations deletes it |
| Adding to en.py but not running process_translations | Other languages miss the key — PR rejected upstream |
| Editing `static/js` bundles directly | Lost on next frontend build |
| Translating a template string in frontend_translations | No effect — that dict is for React strings |
