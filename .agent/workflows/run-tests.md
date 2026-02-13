---
description: How to run the test suites for backend and frontend
---

# Run Tests

## Backend Tests (pytest)

### Run all tests
// turbo
```bash
cd c:\projects\school-website\backend
python -m pytest tests/ -v
```

### Run specific test files
// turbo
```bash
cd c:\projects\school-website\backend
python -m pytest tests/test_auth.py -v
python -m pytest tests/test_cache.py -v
python -m pytest tests/test_rate_limit.py -v
python -m pytest tests/test_approvals.py -v
```

### Available test files
- `tests/test_auth.py` — Authentication and JWT tests
- `tests/test_cache.py` — Cache layer tests
- `tests/test_rate_limit.py` — Rate limiting tests
- `tests/test_approvals.py` — Approval workflow tests
- `tests/conftest.py` — Shared fixtures

## Frontend

### Type checking
// turbo
```bash
cd c:\projects\school-website\frontend
npm run type-check
```

### Lint
// turbo
```bash
cd c:\projects\school-website\frontend
npm run lint
```

### Build (validates compilation)
// turbo
```bash
cd c:\projects\school-website\frontend
npm run build
```
