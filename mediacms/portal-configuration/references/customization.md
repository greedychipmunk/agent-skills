# Customization recipes

## Add a static page to the sidebar (admins_docs §13)

1. Create `templates/cms/<page>.html` (duplicate `about.html`), update the `headermeta` block (og:title, JSON-LD BreadcrumbList, CSS link)
2. Create `static/css/<page>.css`
3. Add the view to `files/views.py` and the URL to `files/urls.py`
4. Append a JS snippet to `static/js/_commons.js` that waits for `.nav-menu` and inserts the list item (signed-out = 3rd nav-menu, signed-in = 4th)
5. Restart: `docker stop mediacms_web_1 && docker start mediacms_web_1` (or `systemctl restart mediacms`)

## Google Analytics (admins_docs §14)

1. `touch templates/tracking.html`, add the gtag script
2. Include `{% include "tracking.html" %}` at the end of `<head>` in `templates/root.html`
3. Docker without full-dir mount: bind-mount both templates in the web service volumes

## Cookie consent (admins_docs §17)

`templates/components/header.html` ships commented consent code — remove the `{% comment %}`/`{% endcomment %}` lines or replace with your banner.

## Branding

- Logos: override the `PORTAL_LOGO_*` settings or replace files under `static/images/`
- Category placeholder: replace `static/images/category_default.jpg`
- Category thumbnails: first of uploaded image → most-viewed media tile → placeholder
- Extra CSS: `EXTRA_CSS_PATHS = ['/static/css/extra.css']`
- Sidebar footer: `SIDEBAR_FOOTER_TEXT`

## Themes and languages

- `DEFAULT_THEME` selects the frontend theme
- `LANGUAGE_CODE` + `LANGUAGES` (see skill `i18n`)

## Email recipes

See SKILL.md for the port/TLS matrix and the shell-based live test.
