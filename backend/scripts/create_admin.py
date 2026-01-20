#!/usr/bin/env python3
"""
Create admin user directly in database for Jesus Junior Academy ERP
"""

from app.core.database import engine
from app.core.security import hash_password
from app.models.user import User
from sqlalchemy.orm import sessionmaker

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_admin_user():
    """Create admin user with phone 9999999999 and password admin123"""
    db = SessionLocal()

    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.phone == "9999999999").first()
        if existing_admin:
            print("⚠️  Admin user already exists. Updating password...")
            existing_admin.password_hash = hash_password("admin123")
            db.commit()
            print("✅ Admin user password updated successfully!")
        else:
            print("🌱 Creating admin user...")

            # Create admin user
            admin_user = User(
                name="System Administrator",
                phone="9999999999",
                email="admin@school.com",
                password_hash=hash_password("admin123"),
                role="ADMIN",
                is_active=True,
            )

            db.add(admin_user)
            db.commit()
            print("✅ Admin user created successfully!")

        print("\n📋 Admin Credentials:")
        print("=" * 30)
        print("Phone: 9999999999")
        print("Password: admin123")
        print("Role: ADMIN")
        print("=" * 30)

    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
