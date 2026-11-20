---
name: fork-docs-release
description: Maintain MediaCMS fork documentation, mike/GitHub Pages channels, what’s-new notes, and GHCR beta/stable releases. Use when editing docs, fork-whats-new, docs.yml, release.yml, mike aliases, or mediacms-next vs main release docs.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/fork-docs-release
---

# Fork docs and release

## Instructions

1. **Fork what’s new:** edit only `docs/_shared/fork-whats-new.md` (Conventional Commits sections). `scripts/prepare_docs_build.py` injects it into `docs/en/reference/whats-new.md` for channels `beta` / `local` / `dev` / `stable` / `latest`.
2. **Do not** hand-edit the generated reference what’s-new page or upstream `CHANGELOG.md` for fork notes.
3. **Local docs:** `make docs-up` → http://localhost/documentation/ (not `/docs/`, which is ReDoc + a protected slug).
4. **Writing:** follow `docs/en/contributing/writing.md` and glossary; add pages via `docs/en/guides/developer/add-docs-page.md`.
5. **Branches:** `MEDIACMS_STABLE_BRANCH` (default `main`) and `MEDIACMS_BETA_BRANCH` (default `mediacms-next`). Workflows list both under `on.push` because triggers cannot read vars.
6. **Mike aliases:** stable → `dev`, beta → `beta`, tags → `latest`. Pages source must be **GitHub Actions** (`docs.yml` → mike → `actions/deploy-pages`).
7. **GHCR:** `release.yml` publishes date-stamped tags from `version/FORK_VERSION`. Pushes to `mediacms-next` → pre-release + `:beta` / full `:beta`. Matching stamp tags from `main` → `:stable`. Prefer this over enabling semantic-release unless asked.
8. **Disclosure:** a release issue, release-note comment, or hand-written GitHub Release body that an agent writes ends with the AI disclosure footer in `skills/maintainer/SKILL.md`. The published What's new page ends with that footer too. `scripts/prepare_docs_build.py` appends it when it generates `docs/en/reference/whats-new.md` for a fork channel, so regeneration keeps the line. Leave the footer out of the source notes body, `CHANGELOG.md`, and the `INSTALL-*.md` asset `release.yml` publishes. Do not hand-edit the generated what's-new page.

## Additional resources

- `docs/en/releases/` (index, compare, features, fixes, migrations, upgrade)
- `docs/en/contributing/writing.md`
- Skill `maintainer` (AI disclosure footer on agent-written release notes and the published What's new page)
- `docs/_shared/fork-whats-new.md`
- `scripts/prepare_docs_build.py`
- `.github/workflows/docs.yml`, `.github/workflows/release.yml`
