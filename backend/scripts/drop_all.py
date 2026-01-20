from sqlalchemy import text
from app.core.database import engine

# Drop all tables
with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE"))
    conn.execute(text("CREATE SCHEMA public"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
    conn.commit()
    
print("✅ All tables dropped successfully")