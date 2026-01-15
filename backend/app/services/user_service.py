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

from app.core.security import hash_password
from app.core.roles import Role
from app.models.user import User
from app.models.people import Student, Parent, Teacher


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
) -> User:
    """
    Create a new user with specified role and entity linking.

    Rules:
    - ADMIN: No entity link required
    - TEACHER/CLASS_TEACHER: Must link to teacher_id
    - PARENT: Must link to parent_id
    - STUDENT: Must link to student_id
    """
    # Validate role
    try:
        role_enum = Role(role)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Use: {[r.value for r in Role]}"
        )

    # Check phone uniqueness
    existing = db.query(User).filter(User.phone == phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # Check email uniqueness if provided
    if email:
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")

    # Validate entity linking based on role
    if role_enum in (Role.TEACHER, Role.CLASS_TEACHER):
        if not teacher_id:
            raise HTTPException(
                status_code=400,
                detail="Teacher/Class Teacher must be linked to a teacher record"
            )
        teacher = db.get(Teacher, teacher_id)
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher record not found")

    elif role_enum == Role.PARENT:
        if not parent_id:
            raise HTTPException(
                status_code=400,
                detail="Parent must be linked to a parent record"
            )
        parent = db.get(Parent, parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent record not found")

    elif role_enum == Role.STUDENT:
        if not student_id:
            raise HTTPException(
                status_code=400,
                detail="Student must be linked to a student record"
            )
        student = db.get(Student, student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student record not found")

    # Create user
    user = User(
        name=name,
        phone=phone,
        email=email,
        password_hash=hash_password(password),
        role=role_enum.value,
        is_active=True,
        student_id=student_id if role_enum == Role.STUDENT else None,
        parent_id=parent_id if role_enum == Role.PARENT else None,
        teacher_id=teacher_id if role_enum in (Role.TEACHER, Role.CLASS_TEACHER) else None,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

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
