#!/usr/bin/env python3
"""
Debug script to check specific test users
"""

from app.core.database import engine
from app.core.security import verify_password

def debug_specific_users():
    """Check specific test users by phone number."""
    print("Checking specific test users...")
    print("=" * 60)

    test_credentials = [
        ("9999999999", "admin123"),
        ("8888888888", "teacher123"),
        ("7777777777", "parent123"),
        ("6666666666", "student123"),
    ]

    with engine.connect() as conn:
        for phone, password in test_credentials:
            result = conn.execute(
                __import__('sqlalchemy').text(
                    f"SELECT id, name, phone, role, approval_status, is_active, is_approved, password_hash FROM users WHERE phone = :phone"
                ),
                {"phone": phone}
            )
            user = result.fetchone()

            print(f"\nPhone: {phone}")
            print(f"Expected password: {password}")
            
            if not user:
                print(f"  [NOT FOUND] No user found with this phone number!")
                continue
            
            id, name, role, ph, approval, is_active, is_approved, pw_hash = user
            print(f"  Name: {name}")
            print(f"  Role: {role}")
            print(f"  Active: {is_active}")
            print(f"  Approved: {is_approved}")
            print(f"  Approval Status: {approval}")
            
            is_valid = verify_password(password, pw_hash)
            print(f"  Password valid: {is_valid}")
            if not is_valid:
                print(f"  Hash: {pw_hash[:50]}...")

if __name__ == "__main__":
    debug_specific_users()
