# Supabase Database Migration Guide

## Why Supabase?

For Google/Meta-level smoothness, you need:
- ✅ **Zero cold starts** - Always-on database
- ✅ **Sub-50ms latency** - Edge-optimized
- ✅ **Real-time subscriptions** - Live data updates
- ✅ **Same schema** - No code changes needed

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign in with GitHub
3. Create new project:
   - **Name**: `jesus-junior-academy`
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to your users (e.g., Mumbai for India)
4. Wait 2-3 minutes for project to be ready

## Step 2: Get Connection String

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Select "Python" and copy the URI
4. It will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

## Step 3: Export Current Data from Neon.tech

Run this command to backup your current database:

```powershell
# Install pg_dump if not available
# Then run:
$env:PGPASSWORD="npg_QZ0jchXDxI4G"
pg_dump -h ep-crimson-flower-ahsulwjs-pooler.c-3.us-east-1.aws.neon.tech -U neondb_owner -d neondb -F c -f backup.dump
```

## Step 4: Import to Supabase

```powershell
# Replace [YOUR-PASSWORD] and [PROJECT-REF] with your Supabase values
$env:PGPASSWORD="[YOUR-PASSWORD]"
pg_restore -h db.[PROJECT-REF].supabase.co -U postgres -d postgres -c backup.dump
```

## Step 5: Update Environment Variables

Update your `.env` file:

```env
# OLD (Neon.tech)
# DATABASE_URL=postgresql://neondb_owner:...@...neon.tech/neondb

# NEW (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## Step 6: Deploy Backend

If using Railway/Fly.io, update the DATABASE_URL environment variable there too.

## Step 7: Test Connection

```powershell
cd c:\projects\school-website\backend
python -c "from app.core.database import check_database_connection; print('Connected:', check_database_connection())"
```

---

## Expected Performance Improvement

| Metric | Neon.tech (Before) | Supabase (After) |
|--------|-------------------|------------------|
| Cold start | 1-3 seconds | None |
| Query latency | 100-500ms | 10-50ms |
| Connection time | 1-2 seconds | <100ms |

---

## Alternative: Use Supabase CLI (Faster)

```powershell
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref [PROJECT-REF]

# Push local schema
supabase db push
```
