# Attribution

The 14 skills in this folder were created by **Josh Preston (@mrjoshuap)** for
his MediaCMS fork and are vendored here with credit.

- **Upstream repository:** https://github.com/mrjoshuap-hq/mediacms
- **Branch:** `mediacms-next`
- **Pinned commit:** `a8c0ce1110cbeb809b7ceabf6a6d2853d912207e`
- **Pulled:** 2026-11-19
- **License:** AGPL-3.0, at the repository level (the `skills/` directory ships
  no separate license). See [LICENSE.txt](./LICENSE.txt).
- **Authors:** Josh Preston <mrjoshuap@users.noreply.github.com>, with commits
  from `mrjoshuap-engineering-bot` and Cursor Agent operating under the fork's
  maintainer rules (see the `maintainer` skill).

## Changes made here

The skills are vendored from the pinned commit with two recorded passes of
edits; everything else is byte-identical to upstream:

1. **Frontmatter credit** (all 14 `SKILL.md`): `license: AGPL-3.0` plus
   `metadata` carrying the author, a catalog version, and the upstream source
   URL, so the credit travels with every copy of a skill.
2. **Standardization for catalog use** (all 14 `SKILL.md`): a one-paragraph
   scope note after the title stating the target repository (paths such as
   `admin_customizations/`, `docs/en/…`, and `AGENTS.md` resolve in the
   MediaCMS checkout, not in this catalog). Fork-layout self-references were
   rewritten to resolve from the installed skill:
   `skills/maintainer/SKILL.md` → the `maintainer` skill (in `issue-triage`,
   `merge-hygiene`, `fork-docs-release`), and the `plan-history` script
   invocation is now skill-relative
   (`python3 scripts/refresh_index.py --archive <repo>/.agent/plan-history`).

References to MediaCMS code (`admin_customizations/`, `files/`, `rbac/`,
`docs/en/…`, Makefile targets, compose files) are the skills' subject matter
and are unchanged. `refresh_index.py` is unmodified; its generated `INDEX.md`
boilerplate still mentions the fork-relative `skills/plan-history/SKILL.md`
path, which is cosmetic.

## Context

These skills guide development on the MediaCMS codebase — the
mrjoshuap-hq fork, which extends upstream
[mediacms-io/mediacms](https://github.com/mediacms-io/mediacms). Most code
anchors (`admin_customizations/`, `rbac/`, `identity_providers/`, `saml_auth/`,
`files/`, `frontend/`) exist upstream; the `docs/en/` tree, mike docs
channels, GHCR release flow, and the fork's label/project scheme and AI
disclosure rules are fork-specific. Load the relevant skill when working in a
checkout of that repository. Two skills they mention — `frontend` and
`github-orchestration` — are planned on the fork but not in this snapshot.

## Skill inventory

| Skill | Purpose |
| --- | --- |
| `admin-portal` | Extend the Jazzmin admin portal: dashboard sections, sidebar, health checks, theme |
| `auth-identity` | Configure django-allauth, OAuth/social login, SAML, and secret-field handling |
| `dev-api` | Smoke-test the REST API against a running dev instance |
| `dev-manage` | Run `manage.py` tasks in the web container (shell, fake media, DB export) |
| `dev-stack` | Run and rebuild the Docker Compose dev stack (ports 80/8088, restarts) |
| `fork-docs-release` | Maintain fork docs, mike channels, what's-new notes, GHCR releases |
| `i18n` | Frontend and admin translations, RTL checks, `process_translations` |
| `issue-triage` | Triage GitHub issues and draft minimal-impact fix plans |
| `maintainer` | Fork maintainer rules: branch targets, upstream PRs, authorship, AI disclosure |
| `media-pipeline` | Encoding, HLS, integrity, storage paths, nginx media auth, migrationservice |
| `merge-hygiene` | Merge branches into `mediacms-next` safely; protect `local_settings.py` |
| `plan-history` | Archive Cursor plans into `.agent/plan-history` with INDEX/manifest |
| `rbac-permissions` | Align roles and permissions across docs, Django backend, React frontend |
| `test-ci` | Run pytest/Jest with `TESTING=True`; fix CI, pre-commit, coverage failures |
