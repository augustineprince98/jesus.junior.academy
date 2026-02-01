from app.core.database import get_db_context
from app.models.user import User

try:
    with get_db_context() as db:
        users = db.query(User).all()
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f"User: {u.name} | Phone: {u.phone} | Role: {u.role} | Active: {u.is_active}")
except Exception as e:
    print(f"Error: {e}")
