import os
import sys
from sqlalchemy import create_engine, text

# Supabase connection
DATABASE_URL = "postgresql://postgres.syrogqxrrpxxcilgviig:subaBase%403316@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

def verify_data():
    print(f"Connecting to Supabase...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            # Check connection
            print("[OK] Database Connection Successful")
            
            # Count rows in key tables
            tables = [
                "users", 
                "students", 
                "teachers", 
                "parents", 
                "fee_payments", 
                "attendance",
                "academic_years",
                "school_classes"
            ]
            
            print("\n[DATA VERIFICATION]")
            print("-" * 30)
            print(f"{'Table':<20} | {'Count':<10}")
            print("-" * 30)
            
            total_rows = 0
            for table in tables:
                try:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM public.{table}"))
                    count = result.scalar()
                    print(f"{table:<20} | {count:<10}")
                    total_rows += count
                except Exception as e:
                    print(f"{table:<20} | ERROR: {e}")
            
            print("-" * 30)
            
            if total_rows == 0:
                print("[WARN] Total row count is 0. Migration might have failed to import data.")
                sys.exit(1)
            else:
                print(f"[OK] Data present! (Total tracked rows: {total_rows})")

            # Check if neon_auth exists
            try:
                result = conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'neon_auth'"))
                neon_tables = result.scalar()
                print(f"\nNeon Auth Tables: {neon_tables} (Migration included neon_auth schema)")
            except:
                pass

    except Exception as e:
        print(f"[ERROR] Connection Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify_data()
