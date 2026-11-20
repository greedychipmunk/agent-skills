# MediaCMS Agent Skills

This folder is a vendored collection of **14 agent skills for the MediaCMS
open-source video and media CMS**, created by **Josh Preston
([@mrjoshuap](https://github.com/mrjoshuap))** for his MediaCMS fork,
[mrjoshuap-hq/mediacms](https://github.com/mrjoshuap-hq/mediacms).

All credit for the skills' design and content belongs to Josh. They are
included here, with his repository as the source of record, so they are
available to any agent working on the MediaCMS codebase.

## The skills

| Skill | Covers |
| ------ | ------ |
| [`admin-portal`](./admin-portal) | Jazzmin admin portal: dashboard sections, sidebar, health checks, theme |
| [`auth-identity`](./auth-identity) | django-allauth, OAuth/social login, SAML, secret-field handling |
| [`dev-api`](./dev-api) | REST API smoke tests against a running dev instance |
| [`dev-manage`](./dev-manage) | `manage.py` tasks in the web container: shell, fake media, DB export |
| [`dev-stack`](./dev-stack) | Docker Compose dev stack: builds, ports 80/8088, service restarts |
| [`fork-docs-release`](./fork-docs-release) | Fork docs, mike channels, what's-new notes, GHCR releases |
| [`i18n`](./i18n) | Frontend and admin translations, RTL checks |
| [`issue-triage`](./issue-triage) | Issue applicability checks and minimal-impact fix plans |
| [`maintainer`](./maintainer) | Fork maintainer rules: branch targets, upstream PRs, AI disclosure |
| [`media-pipeline`](./media-pipeline) | Encoding, HLS, integrity, storage paths, nginx media auth |
| [`merge-hygiene`](./merge-hygiene) | Safe merges into `mediacms-next`, `local_settings` protection |
| [`plan-history`](./plan-history) | Archiving Cursor plans into `.agent/plan-history` |
| [`rbac-permissions`](./rbac-permissions) | Roles and permissions across docs, Django backend, React frontend |
| [`test-ci`](./test-ci) | pytest/Jest with `TESTING=True`, CI, pre-commit, coverage |

## Provenance and license

- **Source:** [mrjoshuap-hq/mediacms](https://github.com/mrjoshuap-hq/mediacms),
  branch `mediacms-next`, commit
  [`a8c0ce1`](https://github.com/mrjoshuap-hq/mediacms/tree/a8c0ce1110cbeb809b7ceabf6a6d2853d912207e)
- **Author:** Josh Preston ([@mrjoshuap](https://github.com/mrjoshuap))
- **License:** AGPL-3.0, inherited from the source repository — see
  [LICENSE.txt](./LICENSE.txt)
- **Full provenance and change record:** [ATTRIBUTION.md](./ATTRIBUTION.md)

The skills guide work on the MediaCMS codebase (the mrjoshuap-hq fork, which
extends upstream [mediacms-io/mediacms](https://github.com/mediacms-io/mediacms)).
Each `SKILL.md` carries a scope note naming that target repository, and
cross-references between skills use skill names so they resolve when the
collection is installed from this catalog.
