#!/usr/bin/env python3
"""Reset and re-create test users with correct password hashes."""

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User

def reset_users():
    db = SessionLocal()

    try:
        # Delete all existing users
        db.query(User).delete()
        db.commit()
        print("✅ Deleted existing users")

        # Create test users with fresh password hashes
        test_users = [
            {
                "name": "System Administrator",
                "phone": "9999999999",
                "email": "admin@school.com",
                "password": "admin123",
                "role": "ADMIN",
            },
            {
                "name": "John Smith",
                "phone": "9876543210",
                "email": "john@school.com",
                "password": "teacher123",
                "role": "TEACHER",
            },
            {
                "name": "Sarah Johnson",
                "phone": "9876543211",
                "email": "sarah@school.com",
                "password": "teacher123",
                "role": "CLASS_TEACHER",
            },
            {
                "name": "Robert Wilson",
                "phone": "9876543212",
                "email": "robert@school.com",
                "password": "parent123",
                "role": "PARENT",
            },
            {
                "name": "Emily Davis",
                "phone": "9876543213",
                "email": "emily@school.com",
                "password": "parent123",
                "role": "PARENT",
            },
            {
                "name": "Alice Wilson",
                "phone": "9876543214",
                "email": "alice@school.com",
                "password": "student123",
                "role": "STUDENT",
            },
            {
                "name": "Bob Davis",
                "phone": "9876543215",
                "email": "bob@school.com",
                "password": "student123",
                "role": "STUDENT",
            },
        ]

        for user_data in test_users:
            user = User(
                name=user_data["name"],
                phone=user_data["phone"],
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                role=user_data["role"],
                is_active=True,
                is_approved=True,
                approval_status="APPROVED",
            )
            db.add(user)

        db.commit()
        print("✅ Test users created successfully!")
        print("\n📋 Login Credentials:")
        print("=" * 40)
        print("Admin:    9999999999 / admin123")
        print("Teacher:  9876543210 / teacher123")
        print("Parent:   9876543212 / parent123")
        print("Student:  9876543214 / student123")
        print("=" * 40)

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_users()
