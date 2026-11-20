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

Skill bodies are vendored unmodified — byte-identical to the pinned commit.
The only edit is a five-line frontmatter addition in each `SKILL.md`
(`license: AGPL-3.0` plus `metadata` carrying the author, a catalog version,
and the upstream source URL) so the credit travels with every copy of the
skill. No other files were changed.

## Context

These skills target the fork's repository layout. They reference paths such as
`skills/<name>`, `AGENTS.md`, `docs/en/…`, `admin_customizations/`,
`files/frontend_translations/`, and fork-specific workflows (mike docs
channels, GHCR releases, the fork's label/project scheme, AI disclosure
rules). They are most useful when working on that fork or a similar MediaCMS
deployment. Two skills they reference — `frontend` and `github-orchestration` —
are planned on the fork but not in this snapshot.

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
