#!/usr/bin/env python3
"""
Verify admin user exists and can login.
If not, creates a new admin user.
"""

from app.core.database import SessionLocal
from app.core.security import hash_password, verify_password
from app.models.user import User

def verify_admin():
    """Verify admin user exists and can authenticate."""
    db = SessionLocal()

    try:
        # Check if admin exists
        admin = db.query(User).filter(User.phone == "9999999999").first()

        if not admin:
            print("[!] Admin user not found!")
            print("Creating admin user...")

            # Create admin user
            admin = User(
                name="System Administrator",
                phone="9999999999",
                email="admin@jesusja.com",
                password_hash=hash_password("admin123"),
                role="ADMIN",
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("[OK] Admin user created successfully!")
        else:
            print("[OK] Admin user found!")
            print(f"   Name: {admin.name}")
            print(f"   Phone: {admin.phone}")
            print(f"   Role: {admin.role}")
            print(f"   Active: {admin.is_active}")

        # Verify password
        print("\nTesting password verification...")
        is_valid = verify_password("admin123", admin.password_hash)

        if is_valid:
            print("[OK] Password verification successful!")
            print("\nAdmin Login Credentials:")
            print("=" * 40)
            print("Phone: 9999999999")
            print("Password: admin123")
            print("=" * 40)
        else:
            print("[!] Password verification failed!")
            print("Resetting password...")
            admin.password_hash = hash_password("admin123")
            db.commit()
            print("[OK] Password reset successfully!")

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    verify_admin()
