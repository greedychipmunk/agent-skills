---
name: issue-triage
description: Triage MediaCMS GitHub or Gitea issues and draft minimal-impact fix plans. Use when checking issue applicability, planning a fix from an issue/PR URL, or reviving a closed PR against current mediacms-next or main.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/issue-triage
---

# Issue triage

## Instructions

1. Confirm the issue still applies on the **current** target branch (`mediacms-next` or `main`) by reading code and reproducing or tracing the path — do not trust old comments alone.
2. Prefer **minimal-impact** fixes (templates, config, tests, small logic). Avoid model/schema migrations unless required (see `AGENTS.md` Change Impact Policy).
3. Produce a short plan: root cause, files to touch, test plan. Wait for implement approval when the user is in plan mode or asked for a plan only.
4. If behavior is intentionally absent, consider `@unimplemented` only for stubbed tests — see skill `test-ci`.
5. Do not commit or open PRs unless the user asks.
6. When fixing, add or update tests under the matching `tests/` area when practical.
7. When you post an issue, issue comment, or triage plan on GitHub, follow the AI disclosure rule in `skills/maintainer/SKILL.md`. Leave issue-template disclosure checkboxes unticked.

## Additional resources

- Root `AGENTS.md` (change impact + hard rules)
- Skill `maintainer` (AI disclosure footer for issues, comments, and plans)
- Skill `test-ci`, `rbac-permissions`, `media-pipeline`, or `admin-portal` as the domain dictates
- `tests/` layout mirroring apps (`api/`, `models/`, `rbac/`, `pipeline/`, …)
