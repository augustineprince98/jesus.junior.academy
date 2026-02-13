---
description: How to set up the local development environment for the school website project
---

# Local Development Setup

## Prerequisites
- **Node.js** v18+ and **npm** v9+
- **Python** 3.11+
- **PostgreSQL** (or Supabase project)
- **Git**

## 1. Clone and Configure Environment

```bash
cd c:\projects\school-website
```

### Backend
```bash
cd backend
copy .env.example .env
# Edit .env with your DATABASE_URL, SECRET_KEY, etc.
```

### Frontend
```bash
cd frontend
copy .env.example .env
# Edit .env with your NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL
```

## 2. Install Dependencies

### Backend
// turbo
```bash
cd c:\projects\school-website\backend
pip install -r requirements.txt
```

### Frontend
// turbo
```bash
cd c:\projects\school-website\frontend
npm install
```

## 3. Run Database Migrations

```bash
cd c:\projects\school-website\backend
alembic upgrade head
```

## 4. Start Dev Servers

### Backend (Terminal 1)
```bash
cd c:\projects\school-website\backend
python start_server.py --reload --host 127.0.0.1
```
Backend runs at: `http://localhost:8000`

### Frontend (Terminal 2)
// turbo
```bash
cd c:\projects\school-website\frontend
npm run dev
```
Frontend runs at: `http://localhost:3000`

## 5. Verify Everything Works
- Backend health: Open `http://localhost:8000/health`
- Frontend: Open `http://localhost:3000`
- API docs: Open `http://localhost:8000/docs`
