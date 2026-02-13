---
description: How to create and run Alembic database migrations
---

# Database Migrations (Alembic)

## 1. Create a New Migration

After modifying models in `backend/app/models/`:

```bash
cd c:\projects\school-website\backend
alembic revision --autogenerate -m "describe your change here"
```

## 2. Review the Generated Migration

Check the new file in `backend/alembic/versions/` to ensure:
- The `upgrade()` function has the correct changes
- The `downgrade()` function correctly reverses them
- No unintended changes were picked up

## 3. Apply the Migration (Local)

// turbo
```bash
cd c:\projects\school-website\backend
alembic upgrade head
```

## 4. Check Current Migration Status

// turbo
```bash
cd c:\projects\school-website\backend
alembic current
```

## 5. View Migration History

// turbo
```bash
cd c:\projects\school-website\backend
alembic history --verbose
```

## 6. Rollback One Migration

```bash
cd c:\projects\school-website\backend
alembic downgrade -1
```

## 7. Apply Migration to Production (Fly.io)

```bash
cd c:\projects\school-website\backend
fly ssh console --app jja-backend -C "cd /app && alembic upgrade head"
```

## Important Notes
- **Always review** auto-generated migrations before applying
- **Test locally** before applying to production
- **Back up production DB** before running migrations
- Models are in `backend/app/models/` — modify these before generating migrations
