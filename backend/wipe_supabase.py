import os
import sys
from sqlalchemy import create_engine, text

# Supabase connection string
DATABASE_URL = "postgresql://postgres.syrogqxrrpxxcilgviig:subaBase%403316@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

def wipe_db():
    print(f"Connecting to {DATABASE_URL.split('@')[1]}...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            # 1. Drop public schema
            print("Dropping schema public cascade...")
            conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE;"))
            
            # 2. Drop neon_auth schema (if it exists from previous attempts)
            print("Dropping schema neon_auth cascade...")
            conn.execute(text("DROP SCHEMA IF EXISTS neon_auth CASCADE;"))

            # 3. Recreate public schema
            print("Recreating schema public...")
            conn.execute(text("CREATE SCHEMA public;"))
            
            # 4. Grant permissions
            print("Granting permissions...")
            conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            
            conn.commit()
            print("Wipe complete. Supabase is ready for fresh import.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    wipe_db()
