# Test infrastructure detail

## pytest.ini

```ini
[pytest]
DJANGO_SETTINGS_MODULE = cms.test_settings
python_files = test_*.py
norecursedirs = .git .venv node_modules frontend frontend-tools media_files static static_collected logs lms-plugins moodle docs
markers =
    slow: slow running test
```

`pytest-django` picks up `DJANGO_SETTINGS_MODULE` from here — running pytest from the repo root just works inside the web container.

## TESTING=True mechanics

`cms/test_settings.py` (selected by pytest.ini) derives from the real settings with test overrides. The `TESTING` env flag additionally makes Celery task invocations run synchronously as functions, so:

- `media_init`, `encode_media`, etc. complete inline during the test
- assertions can check `encoding_status`, created `Encoding` rows, and side effects immediately
- no Redis, no worker, no `celery_beat` needed for the suite

The Makefile always passes `--env TESTING=True`; keep that flag in any manual invocation.

## Running subsets

```bash
# by directory
pytest tests/rbac -n auto
# by keyword
pytest -k upload
# by marker
pytest -m "not slow"
# single test
pytest tests/api/test_media.py::MediaUploadTests::test_upload
```

Parallelism: `-n auto` (pytest-xdist). Selenium smoke tests need the full stack up (`docker compose -f docker-compose-dev.yaml up`).

## Coverage

```bash
make test-coverage
# html report lands in the container; or run manually:
pytest -n auto --cov --cov-report=term --cov-report=html
```

## Frontend (Jest)

- `frontend/package.json` scripts: `test`, `test-watch`, `test-coverage`, `test-coverage-watch`
- `make test-frontend` runs `npm run test -- --ci` inside the frontend container
- Frontend tests run without the backend; they mock API responses

## CI expectations for upstream PRs

1. `pre-commit run --all-files` clean (flake8/isort/black)
2. Backend suite green under `TESTING=True`
3. Frontend suite green
4. If you touched translations: `process_translations` ran (skill `i18n`)
