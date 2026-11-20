# Admin dashboard checklist

Use when adding or changing overview sections, sidebar entries, or health checks.

## Order and navigation

- [ ] Sidebar group order matches overview selector order
- [ ] New section appears in both sidebar (if applicable) and overview selector
- [ ] Icons and human-readable labels present (not raw model names only)

## Section content

- [ ] Metrics or a clear empty state
- [ ] Relative times for “when / added” columns where dates are shown
- [ ] Health checks wired into the correct Site / System / Integrations surface
- [ ] Changelist filter bar and columns still usable after layout changes

## Theme (Flatly + Darkly)

- [ ] Text contrast on cards, tables, and filter chips
- [ ] Active / selected filter and tab borders visible in dark mode
- [ ] Action bar / bulk actions remain visible
- [ ] No reliance on light-only borders or shadows

## i18n

- [ ] New strings use Django `{% trans %}` / `gettext`
- [ ] Dropdown / object-action labels are translated (not `"object name: …"` leftovers)
- [ ] RTL smoke: sidebar and main body do not overlap (skill `i18n`)
