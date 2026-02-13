---
description: How to deploy the frontend to Vercel
---

# Deploy Frontend to Vercel

## Prerequisites
- **Vercel CLI** installed (`npm i -g vercel`)
- Authenticated with Vercel (`vercel login`)

## 1. Set Environment Variables (first-time / via Vercel Dashboard)

Go to **Vercel Dashboard > Project Settings > Environment Variables** and set:
- `NEXT_PUBLIC_API_URL` = `https://jja-backend.fly.dev`
- `NEXT_PUBLIC_WS_URL` = `wss://jja-backend.fly.dev/ws`

## 2. Deploy (via Git Push)

Vercel auto-deploys on push to the connected branch. Otherwise:

// turbo
```bash
cd c:\projects\school-website\frontend
vercel --prod
```

## 3. Verify Deployment

// turbo
```bash
curl -I https://your-vercel-domain.vercel.app
```

Open the live URL in a browser and verify:
- Homepage loads with 3D scene
- Login page works
- Admin dashboard loads (after login)
- Campus pages load (after login)

## 4. Preview Deployments

Each pull request / branch push creates a preview URL automatically.

// turbo
```bash
cd c:\projects\school-website\frontend
vercel
```
