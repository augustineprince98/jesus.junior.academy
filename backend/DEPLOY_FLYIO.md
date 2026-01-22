# Deploy Backend to Fly.io (FREE)

## Why Fly.io?
- **No cold starts** - Always running, unlike Render free tier
- **Free tier** - 3 shared VMs, 160GB outbound data
- **Mumbai region** - Low latency for Indian users
- **Easy scaling** - Add more VMs when needed

## Prerequisites
1. Install Fly CLI: https://fly.io/docs/flyctl/install/
2. Create account: `fly auth signup` or `fly auth login`

## Deployment Steps

### 1. Launch App (First Time Only)
```bash
cd backend
fly launch --no-deploy
```

When prompted:
- App name: `jja-backend` (or auto-generated)
- Region: Select `bom` (Mumbai, India)
- PostgreSQL: **No** (we're using Neon.tech)
- Redis: **No**

### 2. Set Environment Secrets
```bash
# Database (from Neon.tech dashboard)
fly secrets set DATABASE_URL="postgresql://user:pass@your-neon-host/dbname?sslmode=require"

# JWT Secret (generate a strong one)
fly secrets set JWT_SECRET="$(openssl rand -hex 32)"

# CORS Origins
fly secrets set CORS_ORIGINS="https://jesus-junior-academy.vercel.app"

# App Environment
fly secrets set APP_ENV="production"

# Optional: Twilio SMS
fly secrets set TWILIO_ACCOUNT_SID="your-sid"
fly secrets set TWILIO_AUTH_TOKEN="your-token"
fly secrets set TWILIO_PHONE_NUMBER="+1234567890"

# Optional: Push Notifications
fly secrets set VAPID_PUBLIC_KEY="your-public-key"
fly secrets set VAPID_PRIVATE_KEY="your-private-key"
```

### 3. Deploy
```bash
fly deploy
```

### 4. Verify Deployment
```bash
# Check status
fly status

# View logs
fly logs

# Open in browser
fly open

# Check health
curl https://jja-backend.fly.dev/health
```

## Post-Deployment

### Update Frontend API URL
In your Vercel project, update the environment variable:
```
NEXT_PUBLIC_API_URL=https://jja-backend.fly.dev
```

Or update `frontend/vercel.json`:
```json
{
  "env": {
    "NEXT_PUBLIC_API_URL": "https://jja-backend.fly.dev"
  }
}
```

### Run Database Migrations
```bash
# SSH into the VM
fly ssh console

# Run migrations
cd /app
python -m alembic upgrade head
```

## Useful Commands

```bash
# View all secrets
fly secrets list

# Scale up (if needed later)
fly scale count 2

# Check resource usage
fly scale show

# Restart app
fly apps restart

# View metrics
fly dashboard
```

## Cost Breakdown

| Resource | Free Tier | Your Usage |
|----------|-----------|------------|
| VMs | 3 shared-cpu-1x | 1 VM |
| RAM | 256MB each | 512MB (within free) |
| Outbound | 160GB/month | ~5-10GB estimated |
| **Total** | - | **$0/month** |

## Comparison: Render vs Fly.io

| Feature | Render Free | Fly.io Free |
|---------|-------------|-------------|
| Cold starts | 30+ seconds | None |
| Sleep after | 15 min | Never |
| RAM | 512MB | 256MB (can use 512MB) |
| Region | US/EU | Mumbai available |
| Deploy | Git push | `fly deploy` |

## Troubleshooting

### "Connection refused" errors
Check DATABASE_URL is set correctly:
```bash
fly secrets list
```

### App crashes on start
View logs:
```bash
fly logs --app jja-backend
```

### Memory issues
Upgrade VM size:
```bash
fly scale memory 512
```

---

## Alternative: Stay on Render (Paid)

If you prefer Render's simplicity, upgrade to Starter ($7/month):
1. Go to https://dashboard.render.com
2. Select your backend service
3. Click "Upgrade" → Select "Starter" plan
4. No code changes needed

This removes cold starts while keeping your current setup.
