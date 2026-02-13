---
description: How to deploy the backend to Fly.io
---

# Deploy Backend to Fly.io

## Prerequisites
- **Fly CLI** installed (`flyctl` or `fly`)
- Authenticated with Fly.io (`fly auth login`)

## 1. Set Fly.io Secrets (first-time only)

```bash
cd c:\projects\school-website\backend
fly secrets set DATABASE_URL="postgresql://..." SECRET_KEY="..." --app jja-backend
```

Set all secrets from `.env.example`:
- `DATABASE_URL`
- `SECRET_KEY`
- `CORS_ORIGINS`
- `TWILIO_ACCOUNT_SID` (optional)
- `TWILIO_AUTH_TOKEN` (optional)
- `TWILIO_PHONE_NUMBER` (optional)
- `VAPID_PUBLIC_KEY` (optional)
- `VAPID_PRIVATE_KEY` (optional)
- `VAPID_CLAIMS_EMAIL` (optional)

## 2. Deploy

// turbo
```bash
cd c:\projects\school-website\backend
fly deploy --app jja-backend
```

## 3. Run Migrations on Production

```bash
cd c:\projects\school-website\backend
fly ssh console --app jja-backend -C "cd /app && alembic upgrade head"
```

## 4. Verify Deployment

// turbo
```bash
curl https://jja-backend.fly.dev/health
```

## 5. Monitor Logs

// turbo
```bash
fly logs --app jja-backend
```

## Rollback (if needed)

```bash
fly releases --app jja-backend
fly deploy --image <previous-image> --app jja-backend
```
