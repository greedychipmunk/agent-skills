---
name: testing
description: Run and write tests for MediaCMS — the pytest suite (with the TESTING=True mode that runs Celery tasks inline), the Jest frontend suite, pre-commit linting, and coverage. Use when running the test suites, adding backend or frontend tests, fixing CI failures, or deciding where a new test belongs.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# MediaCMS Testing

> **Scope:** targets [mediacms-io/mediacms](https://github.com/mediacms-io/mediacms) v9.6.1 (commit `99a1801`, branch `main`). Config: `pytest.ini`, `Makefile`, `.pre-commit-config.yaml`.

## Running the backend suite

```bash
make test                     # pytest -n auto with TESTING=True, in the dev web container
make test-coverage            # + coverage report (term + html)
```

Equivalent direct invocation:

```bash
docker compose -f docker-compose-dev.yaml exec --env TESTING=True -T web pytest -n auto
docker compose -f docker-compose-dev.yaml exec --env TESTING=True -T web pytest tests/api -n auto     # one area
docker compose -f docker-compose-dev.yaml exec --env TESTING=True -T web pytest tests/test_fixtures.py  # one file
```

**`TESTING=True` matters**: `cms/settings.py` sets `CELERY_TASK_ALWAYS_EAGER = True` when the env var is present, so Celery tasks run inline as plain functions — no Redis/worker needed. `pytest.ini` selects `cms/test_settings.py`, which sets `TESTING=True` itself and adds test overrides (MD5 password hasher, locmem cache, temp `MEDIA_ROOT`, `test_mediacms` DB, `ultrafast` ffmpeg preset). The Makefile's `--env TESTING=True` keeps manual invocations consistent. Without eager mode, async tasks never run and pipeline tests hang or silently pass vacuously.

## Test layout (tests/)

| Area | Covers |
| ---- | ------ |
| `tests/api` | REST endpoints (media, comments, playlists, users) |
| `tests/pipeline` | Upload → encode → list flow |
| `tests/models` | Model behavior |
| `tests/rbac`, `tests/saml`, `tests/lti` | Access control and integrations |
| `tests/admin`, `tests/forms`, `tests/helpers`, `tests/notifications`, `tests/pages`, `tests/settings`, `tests/users` | The rest of the backend |
| `tests/test_fixtures.py`, `test_hls_info.py`, `test_imports.py`, `test_category_thumbnail.py` | Cross-cutting |
| `tests/test_selenium_smoke.py` | Browser smoke (needs a running stack; marked appropriately) |

`pytest.ini`: `python_files = test_*.py`, `norecursedirs` excludes frontend/static/media dirs, custom marker `slow`.

## Frontend suite

```bash
make test-frontend            # jest --ci in the frontend container
make test-frontend-coverage   # + coverage summary
```

Jest config lives in `frontend/`; `npm run test` / `test-watch` / `test-coverage` inside `frontend/`.

## Linting (pre-commit)

```bash
pre-commit run --all-files   # flake8, isort (black profile), black
```

Hooks: flake8 6.1.0, isort 5.12.0 (`--profile black`), black 24.10.0. Run this before any upstream PR.

## Writing a new test

1. Backend: add `tests/<area>/test_<thing>.py`; use the factories/utilities in `tests/` (see existing files) and follow the `TESTING=True` inline-task model — assert on task results directly, not on queued state
2. Frontend: colocate with the component or add to the matching `frontend/src` test files
3. Long-running test: mark `@pytest.mark.slow`
4. Dev dependencies: `requirements-dev.txt`

## Additional resources

- [references/test-layout.md](references/test-layout.md)
- `pytest.ini`, `Makefile`, `.pre-commit-config.yaml`, `cms/test_settings.py`
- Skills: `dev-stack` (container commands), `media-pipeline` (what pipeline tests exercise)
