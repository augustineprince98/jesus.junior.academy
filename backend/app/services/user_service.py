"""
User Management Service

Handles user creation, role assignment, and entity linking.
- Admin creates users
- Teachers/Class Teachers are explicitly assigned
- Parents/Students are default roles
"""

from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
import logging

from app.core.security import hash_password
from app.core.roles import Role
from app.models.user import User, ApprovalStatus
from app.models.people import Student, Parent, Teacher
from app.models.enrollment import Enrollment
from app.models.school_class import SchoolClass
from app.models.academic_year import AcademicYear

logger = logging.getLogger(__name__)


def create_user(
    db: Session,
    *,
    name: str,
    phone: str,
    password: str,
    role: str,
    email: Optional[str] = None,
    student_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    father_name: Optional[str] = None,
    mother_name: Optional[str] = None,
    class_id: Optional[int] = None,
) -> User:
    """
    Create a new user with specified role and entity linking.

    Users created by admin are automatically approved (no approval needed).

    Auto-creates Student/Parent/Teacher records if not provided:
    - STUDENT: Creates Student record with father_name/mother_name
    - PARENT: Creates Parent record
    - TEACHER: Creates Teacher record

    Rules:
    - ADMIN: No entity link required
    - TEACHER/CLASS_TEACHER: Auto-creates teacher record if not provided
    - PARENT: Auto-creates parent record if not provided
    - STUDENT: Auto-creates student record if not provided
    """
    logger.info(f"Admin creating user: name={name}, phone={phone}, role={role}")

    # Validate role
    try:
        role_enum = Role(role)
    except ValueError:
        logger.error(f"Invalid role provided: {role}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Use: {[r.value for r in Role]}"
        )

    # Check phone uniqueness
    existing = db.query(User).filter(User.phone == phone).first()
    if existing:
        logger.warning(f"Phone {phone} already exists: user_id={existing.id}, status={existing.approval_status}")
        raise HTTPException(
            status_code=400,
            detail=f"Phone number already registered"
        )

    # Check email uniqueness if provided
    if email:
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            logger.warning(f"Email {email} already exists: user_id={existing_email.id}")
            raise HTTPException(status_code=400, detail="Email already registered")

    # Auto-create entity records based on role if not provided
    if role_enum in (Role.TEACHER, Role.CLASS_TEACHER):
        if teacher_id:
            teacher = db.get(Teacher, teacher_id)
            if not teacher:
                raise HTTPException(status_code=404, detail="Teacher record not found")
        else:
            # Auto-create Teacher record
            teacher = Teacher(name=name, phone=phone, email=email)
            db.add(teacher)
            db.flush()  # Get the ID
            teacher_id = teacher.id
            logger.info(f"Auto-created Teacher record: id={teacher_id}")

    elif role_enum == Role.PARENT:
        if parent_id:
            parent = db.get(Parent, parent_id)
            if not parent:
                raise HTTPException(status_code=404, detail="Parent record not found")
        else:
            # Auto-create Parent record
            parent = Parent(name=name, phone=phone, email=email)
            db.add(parent)
            db.flush()  # Get the ID
            parent_id = parent.id
            logger.info(f"Auto-created Parent record: id={parent_id}")

    elif role_enum == Role.STUDENT:
        if student_id:
            student = db.get(Student, student_id)
            if not student:
                raise HTTPException(status_code=404, detail="Student record not found")
        else:
            # Auto-create Student record with father_name/mother_name
            # dob and gender are optional - user can complete profile later
            student = Student(
                name=name,
                father_name=father_name or "",
                mother_name=mother_name or "",
            )
            db.add(student)
            db.flush()  # Get the ID
            student_id = student.id
            logger.info(f"Auto-created Student record: id={student_id}, father={father_name}, mother={mother_name}")
            
            # Auto-enroll student in class if class_id provided
            if class_id:
                school_class = db.get(SchoolClass, class_id)
                if not school_class:
                    raise HTTPException(status_code=404, detail="Class not found")
                
                # Get current academic year
                academic_year = db.query(AcademicYear).filter(
                    AcademicYear.is_current == True
                ).first()
                
                if academic_year:
                    enrollment = Enrollment(
                        student_id=student_id,
                        class_id=class_id,
                        academic_year_id=academic_year.id,
                        status="ACTIVE"
                    )
                    db.add(enrollment)
                    db.flush()
                    logger.info(f"Auto-enrolled student {student_id} in class {class_id}")
                else:
                    logger.warning("No current academic year found - skipping enrollment")

    # Create user - AUTOMATICALLY APPROVED since created by admin
    user = User(
        name=name,
        phone=phone,
        email=email,
        password_hash=hash_password(password),
        role=role_enum.value,
        is_active=True,
        is_approved=True,  # Auto-approved when created by admin
        approval_status=ApprovalStatus.APPROVED,  # Auto-approved when created by admin
        student_id=student_id if role_enum == Role.STUDENT else None,
        parent_id=parent_id if role_enum == Role.PARENT else None,
        teacher_id=teacher_id if role_enum in (Role.TEACHER, Role.CLASS_TEACHER) else None,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"User created successfully: id={user.id}, phone={phone}, role={role}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create user: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Database error while creating user: {str(e)}"
        )

    return user


def update_user_role(
    db: Session,
    *,
    user_id: int,
    new_role: str,
    teacher_id: Optional[int] = None,
) -> User:
    """
    Update user's role. Primarily used to promote TEACHER to CLASS_TEACHER.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        role_enum = Role(new_role)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Use: {[r.value for r in Role]}"
        )

    # If promoting to teacher role, ensure teacher link
    if role_enum in (Role.TEACHER, Role.CLASS_TEACHER):
        if teacher_id:
            teacher = db.get(Teacher, teacher_id)
            if not teacher:
                raise HTTPException(status_code=404, detail="Teacher record not found")
            user.teacher_id = teacher_id
        elif not user.teacher_id:
            raise HTTPException(
                status_code=400,
                detail="Must provide teacher_id when assigning teacher role"
            )

    user.role = role_enum.value
    db.commit()
    db.refresh(user)

    return user


def assign_class_teacher(
    db: Session,
    *,
    user_id: int,
    class_id: int,
) -> User:
    """
    Assign a teacher as class teacher for a specific class.
    Updates their role to CLASS_TEACHER.
    """
    from app.models.school_class import SchoolClass

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role not in (Role.TEACHER.value, Role.CLASS_TEACHER.value):
        raise HTTPException(
            status_code=400,
            detail="Only teachers can be assigned as class teachers"
        )

    if not user.teacher_id:
        raise HTTPException(
            status_code=400,
            detail="User not linked to a teacher record"
        )

    school_class = db.get(SchoolClass, class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    # Assign class teacher
    school_class.class_teacher_id = user.teacher_id
    user.role = Role.CLASS_TEACHER.value

    db.commit()
    db.refresh(user)

    return user


def get_users_by_role(
    db: Session,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = 100,
    offset: int = 0,
):
    """Get users filtered by role."""
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    return query.order_by(User.id).offset(offset).limit(limit).all()


def deactivate_user(db: Session, user_id: int) -> User:
    """Deactivate a user (soft delete)."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Increment token_version to invalidate all existing tokens
    user.token_version = (user.token_version or 0) + 1
    user.is_active = False
    db.commit()
    db.refresh(user)

    return user


def link_user_to_entity(
    db: Session,
    *,
    user_id: int,
    student_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
) -> User:
    """
    Link an existing user to an entity record.
    Used when entity records are created after user accounts.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if student_id:
        student = db.get(Student, student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student record not found")
        user.student_id = student_id

    if parent_id:
        parent = db.get(Parent, parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent record not found")
        user.parent_id = parent_id

    if teacher_id:
        teacher = db.get(Teacher, teacher_id)
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher record not found")
        user.teacher_id = teacher_id

    db.commit()
    db.refresh(user)

    return user
