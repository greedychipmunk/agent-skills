---
name: merge-hygiene
description: Safely merge or sync branches into mediacms-next while preserving fork work and avoiding local_settings commits. Use when merging FIX branches, syncing outdated PRs, resolving conflicts into mediacms-next, or unstaging deploy/docker/local_settings.py.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/merge-hygiene
---

# Merge hygiene

## Instructions

1. **Never commit** `deploy/docker/local_settings.py`. Stash or unstage it before commit/merge; restore locally afterward.
2. Prefer a three-dot audit of the incoming branch vs `mediacms-next` before merging; note hotspots (admin, logging, docs, tests, translations).
3. On conflicts, **preserve both sides** when features coexist; re-adapt rather than dropping fork or incoming work blindly.
4. After merge / preview-host changes, verify `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS` (often in local settings — still don’t commit them).
5. Post-merge gate:
   - `pre-commit run --all-files`
   - `TESTING=True` pytest for affected areas
   - Docs / `fork-whats-new` if user-facing behavior changed (skill `fork-docs-release`)
6. Bots force-push only their own pull request branches. Never force-push a shared branch (`main`, `mediacms-next`, or anyone else's branch).
7. When you write a pull request description, review, or merge comment, follow the AI disclosure rule in `skills/maintainer/SKILL.md`. Leave the PR template AI disclosure and Attestation checkboxes unticked.
8. A squash merge is the only commit that gets `Signed-off-by: mrjoshuap <5722442+mrjoshuap@users.noreply.github.com>`. The merger adds that line in the squash-merge message at merge time. Agent commits on the branch carry `Assisted-by: Grok Bot (<role>)` only, plus `Co-authored-by` when a platform hook appends it. Agents never sign off as Joshua.

## Additional resources

- Root `AGENTS.md` (hard rules)
- Skill `maintainer` (AI disclosure footer; Joshua ticks disclosure and attestation)
- Skill `fork-docs-release` for docs/release conflicts
- Skill `test-ci` for verification commands
- `deploy/docker/local_settings.py` (local only)
