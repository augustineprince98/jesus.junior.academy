#!/usr/bin/env python3
"""
Test user seeding script for Jesus Junior Academy ERP
Creates test users for development and testing purposes.
"""

from app.core.database import engine, Base
from app.core.security import hash_password
from app.models.user import User, ApprovalStatus
from app.models.academic_year import AcademicYear
from app.models.subject import Subject
from app.models.school_class import SchoolClass
from app.models.people import Student, Teacher, Parent
from sqlalchemy.orm import sessionmaker

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_test_users():
    """Create test users for development."""
    db = SessionLocal()

    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("⚠️  Test users already exist. Skipping seeding.")
            return

        print("🌱 Seeding test users...")

        # Create Academic Year
        academic_year = AcademicYear(year="2024-25", is_active=True)
        db.add(academic_year)
        db.commit()

        # Create Subjects
        subjects = [
            Subject(name="Mathematics"),
            Subject(name="English"),
            Subject(name="Science"),
            Subject(name="Social Studies"),
            Subject(name="Hindi"),
        ]
        db.add_all(subjects)
        db.commit()

        # Create Classes
        classes = [
            SchoolClass(name="Class 1", academic_year_id=academic_year.id),
            SchoolClass(name="Class 2", academic_year_id=academic_year.id),
            SchoolClass(name="Class 3", academic_year_id=academic_year.id),
        ]
        db.add_all(classes)
        db.commit()

        # Create test users
        test_users = [
            # Admin user
            {
                "name": "System Administrator",
                "phone": "9999999999",
                "email": "admin@school.com",
                "password": "admin123",
                "role": "ADMIN",
            },
            # Teachers
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
            # Parents
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
            # Students
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

        # Create entities and users
        for user_data in test_users:
            # Create entity based on role
            entity_id = None
            if user_data["role"] == "STUDENT":
                student = Student(
                    name=user_data["name"],
                    dob="2010-01-01",
                    gender="MALE" if "Bob" in user_data["name"] else "FEMALE"
                )
                db.add(student)
                db.commit()
                entity_id = student.id
            elif user_data["role"] == "TEACHER" or user_data["role"] == "CLASS_TEACHER":
                teacher = Teacher(name=user_data["name"], phone=user_data["phone"])
                db.add(teacher)
                db.commit()
                entity_id = teacher.id
            elif user_data["role"] == "PARENT":
                parent = Parent(name=user_data["name"], phone=user_data["phone"])
                db.add(parent)
                db.commit()
                entity_id = parent.id

            # Create user account
            user = User(
                name=user_data["name"],
                phone=user_data["phone"],
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                role=user_data["role"],
                is_active=True,
                is_approved=True,
                approval_status=ApprovalStatus.APPROVED,
            )

            # Link to entity
            if user_data["role"] == "STUDENT":
                user.student_id = entity_id
            elif user_data["role"] == "TEACHER" or user_data["role"] == "CLASS_TEACHER":
                user.teacher_id = entity_id
            elif user_data["role"] == "PARENT":
                user.parent_id = entity_id

            db.add(user)

        db.commit()
        print("✅ Test users seeded successfully!")
        print("\n📋 Test Credentials:")
        print("=" * 40)
        print("ADMIN:")
        print("  Phone: 9999999999")
        print("  Password: admin123")
        print("\nTEACHERS:")
        print("  John Smith (Teacher)")
        print("    Phone: 9876543210")
        print("    Password: teacher123")
        print("  Sarah Johnson (Class Teacher)")
        print("    Phone: 9876543211")
        print("    Password: teacher123")
        print("\nPARENTS:")
        print("  Robert Wilson")
        print("    Phone: 9876543212")
        print("    Password: parent123")
        print("  Emily Davis")
        print("    Phone: 9876543213")
        print("    Password: parent123")
        print("\nSTUDENTS:")
        print("  Alice Wilson")
        print("    Phone: 9876543214")
        print("    Password: student123")
        print("  Bob Davis")
        print("    Phone: 9876543215")
        print("    Password: student123")
        print("=" * 40)

    except Exception as e:
        print(f"❌ Error seeding test users: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_test_users()
