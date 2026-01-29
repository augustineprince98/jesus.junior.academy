#!/usr/bin/env python3
"""
Fix test users that are stuck in PENDING approval status.
This script uses raw SQL to update existing test users.
"""

from app.core.database import engine

def fix_test_users():
    """Fix approval status for test users using raw SQL."""

    print("Fixing test user approval status...")
    print("=" * 60)

    with engine.connect() as conn:
        # First, check how many users need fixing
        result = conn.execute(
            __import__('sqlalchemy').text(
                "SELECT id, name, phone, role, approval_status FROM users WHERE is_active = true AND approval_status = 'PENDING'"
            )
        )
        pending_users = result.fetchall()

        if not pending_users:
            print("No pending users found. All users are already approved!")
            return

        print(f"Found {len(pending_users)} users with PENDING status:")
        for user in pending_users:
            print(f"  - {user[1]} ({user[2]}) - Role: {user[3]}")

        # Update all pending users to approved
        conn.execute(
            __import__('sqlalchemy').text(
                "UPDATE users SET is_approved = true, approval_status = 'APPROVED' WHERE is_active = true AND approval_status = 'PENDING'"
            )
        )
        conn.commit()

        print("=" * 60)
        print(f"[SUCCESS] Fixed {len(pending_users)} users!")
        print("All users can now login.")

if __name__ == "__main__":
    fix_test_users()
