from app.core.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name, phone, role, is_active FROM public.users"))
        users = result.fetchall()
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f"User: {u.name} | Phone: {u.phone} | Role: {u.role} | Active: {u.is_active}")
except Exception as e:
    print(f"Error: {e}")
