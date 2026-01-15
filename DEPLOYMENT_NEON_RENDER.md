# School Website Deployment with Neon + Render

## 🎯 Overview
Deploy school ERP system using:
- **Database**: Neon.tech (PostgreSQL)
- **Backend**: Render.com (free tier)
- **Frontend**: Vercel (free tier)
- **Domain**: Namecheap/Squarespace

## 📋 Prerequisites
- [ ] GitHub account
- [ ] Neon.tech account (free)
- [ ] Render.com account (free)
- [ ] Vercel account (free)
- [ ] Domain from Namecheap/Squarespace

## 🗄️ Step 1: Database Setup (Neon.tech)

### 1. Create Neon Project
1. Go to https://neon.tech
2. Sign up for free account
3. Click "Create a project"
4. Choose region close to your users
5. Name your project (e.g., "school-erp")
6. Click "Create project"

### 2. Get Connection Details
1. In your Neon dashboard, go to "Connection Details"
2. Copy the connection string - it looks like:
   ```
   postgresql://username:password@hostname/database?sslmode=require
   ```

### 3. Update Environment Variables
Create `backend/.env` file with:

```env
# Database Configuration (Neon)
DATABASE_URL=postgresql+psycopg2://[your-neon-connection-string]

# Security (Generate strong secret)
JWT_SECRET=[your-32-character-secret]

# Application Settings
APP_ENV=production
LOG_LEVEL=INFO
```

**Generate JWT_SECRET:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Test Database Connection
```bash
cd backend
python -c "from app.core.database import engine; print('✅ Database connected' if engine else '❌ Connection failed')"
```

### 5. Run Migrations and Seed Data
```bash
cd backend
alembic upgrade head
python seed_test_users.py
```

## 🚀 Step 2: Backend Deployment (Render.com)

### 1. Prepare for Deployment
1. Make sure your code is pushed to GitHub
2. Ensure `requirements.txt` includes all dependencies
3. Verify `start_server.py` works for production

### 2. Create Render Service
1. Go to https://render.com
2. Sign up/login
3. Click "New" > "Web Service"
4. Connect your GitHub repository
5. Configure service:
   - **Name**: school-erp-backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python start_server.py --host 0.0.0.0 --port $PORT`

### 3. Set Environment Variables in Render
In your Render service dashboard > Environment:

```
DATABASE_URL=postgresql+psycopg2://[your-neon-connection-string]
JWT_SECRET=[your-32-character-secret]
APP_ENV=production
LOG_LEVEL=INFO
```

### 4. Deploy
1. Click "Create Web Service"
2. Render will build and deploy automatically
3. Get your backend URL (something like `https://school-erp-backend.onrender.com`)

## 🌐 Step 3: Frontend Deployment (Vercel)

### 1. Connect Repository
1. Go to https://vercel.com
2. Sign up/login
3. Click "New Project" > "Import Git Repository"
4. Connect GitHub and select your repository
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`

### 2. Set Environment Variables
In Vercel project settings > Environment Variables:

```
NEXT_PUBLIC_API_URL=https://[your-render-backend-url]
```

### 3. Deploy
1. Click "Deploy"
2. Vercel will build and deploy automatically
3. Get your frontend URL (something like `https://school-erp.vercel.app`)

## 🌍 Step 4: Domain Configuration

### 1. Purchase Domain
- Buy domain from Namecheap or Squarespace

### 2. Configure in Vercel
1. In Vercel dashboard > your project > Settings > Domains
2. Add your custom domain
3. Vercel will provide nameservers - update them in your domain registrar
4. SSL certificates are handled automatically

## 🔧 Step 5: Post-Deployment Setup

### 1. Update CORS (Security)
In Render environment variables, add:
```
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. Test Everything
1. Visit your domain
2. Try login with: `9999999999` / `admin123`
3. Check `/health` endpoint on backend URL
4. Verify all features work

## 💰 Cost Breakdown (Monthly)
- **Neon**: $0 (512MB storage, free tier)
- **Render**: $0 (750 hours/month free)
- **Vercel**: $0 (unlimited static sites)
- **Domain**: ~$10-15/year
- **Total**: ~$1/month

## 🚨 Important Notes

### Neon Specific
- Connection pooling is built-in
- Automatic scaling
- Branching feature for development

### Render Specific
- Free tier: 750 hours/month
- Automatic SSL
- Built-in monitoring
- Wake-up time on free tier (~30 seconds)

### Security
- Use strong JWT_SECRET
- Restrict CORS origins in production
- Never commit .env files

## 🆘 Troubleshooting

### Database Connection Issues
1. Verify Neon connection string format
2. Check if SSL mode is included
3. Test connection locally first

### Render Deployment Issues
1. Check build logs in Render dashboard
2. Ensure all dependencies in requirements.txt
3. Verify start command works locally

### CORS Issues
1. Update ALLOWED_ORIGINS in Render
2. Include both www and non-www domains
3. Clear browser cache after changes

## 📞 Need Help?
- Neon docs: https://neon.tech/docs/
- Render docs: https://render.com/docs/
- Vercel docs: https://vercel.com/docs/
