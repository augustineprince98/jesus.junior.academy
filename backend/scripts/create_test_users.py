#!/usr/bin/env python3
"""
Create comprehensive test users for Jesus Junior Academy
Creates users for all roles: Admin, Teacher, Parent, Student
"""

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, ApprovalStatus
from app.models.people import Student, Parent, Teacher

def create_test_users():
    """Create test users for all roles."""
    db = SessionLocal()

    try:
        print("Creating test users for Jesus Junior Academy...")
        print("=" * 60)

        # 1. ADMIN USER
        admin = db.query(User).filter(User.phone == "9999999999").first()
        if not admin:
            print("\n[1/4] Creating Admin user...")
            admin = User(
                name="Admin User",
                phone="9999999999",
                email="admin@jesusja.com",
                password_hash=hash_password("admin123"),
                role="ADMIN",
                is_active=True,
                is_approved=True,
                approval_status=ApprovalStatus.APPROVED
            )
            db.add(admin)
            db.commit()
            print("[OK] Admin user created")
        else:
            print("\n[1/4] Admin user already exists")

        # 2. TEACHER USER
        teacher_user = db.query(User).filter(User.phone == "8888888888").first()
        if not teacher_user:
            print("\n[2/4] Creating Teacher user...")

            # Create teacher entity
            teacher = Teacher(
                name="Sarah Johnson",
                phone="8888888888"
            )
            db.add(teacher)
            db.commit()

            # Create user account
            teacher_user = User(
                name="Sarah Johnson",
                phone="8888888888",
                email="teacher@jesusja.com",
                password_hash=hash_password("teacher123"),
                role="TEACHER",
                is_active=True,
                is_approved=True,
                approval_status=ApprovalStatus.APPROVED,
                teacher_id=teacher.id
            )
            db.add(teacher_user)
            db.commit()
            print("[OK] Teacher user created")
        else:
            print("\n[2/4] Teacher user already exists")

        # 3. PARENT USER
        parent_user = db.query(User).filter(User.phone == "7777777777").first()
        if not parent_user:
            print("\n[3/4] Creating Parent user...")

            # Create parent entity
            parent = Parent(
                name="Robert Wilson",
                phone="7777777777"
            )
            db.add(parent)
            db.commit()

            # Create user account
            parent_user = User(
                name="Robert Wilson",
                phone="7777777777",
                email="parent@jesusja.com",
                password_hash=hash_password("parent123"),
                role="PARENT",
                is_active=True,
                is_approved=True,
                approval_status=ApprovalStatus.APPROVED,
                parent_id=parent.id
            )
            db.add(parent_user)
            db.commit()
            print("[OK] Parent user created")
        else:
            print("\n[3/4] Parent user already exists")

        # 4. STUDENT USER
        student_user = db.query(User).filter(User.phone == "6666666666").first()
        if not student_user:
            print("\n[4/4] Creating Student user...")

            # Create student entity
            student = Student(
                name="Alice Wilson",
                dob="2012-05-15",
                gender="FEMALE"
            )
            db.add(student)
            db.commit()

            # Create user account
            student_user = User(
                name="Alice Wilson",
                phone="6666666666",
                email="student@jesusja.com",
                password_hash=hash_password("student123"),
                role="STUDENT",
                is_active=True,
                is_approved=True,
                approval_status=ApprovalStatus.APPROVED,
                student_id=student.id
            )
            db.add(student_user)
            db.commit()
            print("[OK] Student user created")
        else:
            print("\n[4/4] Student user already exists")

        print("\n" + "=" * 60)
        print("[SUCCESS] ALL TEST USERS READY!")
        print("=" * 60)

        print("\nLOGIN CREDENTIALS:")
        print("-" * 60)

        print("\n[ADMIN] Full System Access + Admin Panel")
        print("   Phone: 9999999999")
        print("   Password: admin123")

        print("\n[TEACHER] Staff Room, Attendance, Homework")
        print("   Phone: 8888888888")
        print("   Password: teacher123")

        print("\n[PARENT] Child's Fees, Homework, Results")
        print("   Phone: 7777777777")
        print("   Password: parent123")

        print("\n[STUDENT] Homework, Results, Attendance")
        print("   Phone: 6666666666")
        print("   Password: student123")

        print("\n" + "=" * 60)
        print("\nTO TEST:")
        print("   1. Start Backend: uvicorn app.main:app --reload")
        print("   2. Start Frontend: npm run dev")
        print("   3. Visit: http://localhost:3000")
        print("=" * 60)

    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
