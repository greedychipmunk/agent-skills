---
name: test-ci
description: Run and extend MediaCMS backend/frontend tests and fix CI or lint failures. Use when writing pytest or Jest tests, diagnosing CI, pre-commit, flake8, coverage gaps, or @unimplemented stubs.
license: AGPL-3.0
metadata:
  author: mrjoshuap
  version: "1.0"
  source: https://github.com/mrjoshuap-hq/mediacms/tree/mediacms-next/skills/test-ci
---

# Test and CI

> **Scope:** targets the [mrjoshuap-hq/mediacms](https://github.com/mrjoshuap-hq/mediacms) fork (`mediacms-next` branch). Repo paths such as `admin_customizations/`, `docs/en/…`, and `AGENTS.md` resolve in that repository checkout; sibling skills are referenced by name from this `mediacms` collection.

## Instructions

1. **Backend:** always run with `TESTING=True` so Celery tasks execute as plain functions:

   ```bash
   docker compose -f docker-compose-dev.yaml exec --env TESTING=True -T web pytest
   # or: make test-backend
   ```

2. **Frontend:** `make test-frontend` or `docker compose -f docker-compose-dev.yaml exec -T frontend npm run test -- --ci`.
3. **Lint source of truth:** `pre-commit run --all-files` (via `make lint`). Do not invent Makefile/`npm` lint entrypoints when hooks already cover the packages. Run `npm install` in touched frontend packages before hooks.
4. Settings module: `pytest.ini` → `cms/test_settings.py`. `conftest.py` blocks non-local network and cleans temp media — do not hit external services.
5. Stubbed product behavior: `@unimplemented` from `tests/_support/unimplemented.py` (warn-mode; does not fail CI). Prefer real tests when behavior exists.
6. Prioritize ACL/RBAC combos, admin portal, and encoding/pipeline coverage when filling gaps.

## Additional resources

- `docs/en/guides/developer/tests.md`
- `conftest.py`, `pytest.ini`, `.coveragerc`
- `tests/_support/unimplemented.py`
- `.github/workflows/` (`ci.yml`, `python.yml`, `frontend-build-and-test.yml`, `pre-commit.yml`)
