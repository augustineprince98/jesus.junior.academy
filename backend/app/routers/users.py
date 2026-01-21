"""
User Management Router

[ADMIN] endpoints for creating and managing user accounts.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import require_role_at_least
from app.core.roles import Role
from datetime import datetime
from app.models.user import User, ApprovalStatus
from app.services import user_service

router = APIRouter(prefix="/users", tags=["User Management"])


class UserCreate(BaseModel):
    name: str
    phone: str
    password: str
    role: str  # ADMIN, CLASS_TEACHER, TEACHER, PARENT, STUDENT
    email: Optional[str] = None
    student_id: Optional[int] = None
    parent_id: Optional[int] = None
    teacher_id: Optional[int] = None


class UserRoleUpdate(BaseModel):
    new_role: str
    teacher_id: Optional[int] = None


class ClassTeacherAssign(BaseModel):
    class_id: int


class UserLinkEntity(BaseModel):
    student_id: Optional[int] = None
    parent_id: Optional[int] = None
    teacher_id: Optional[int] = None


@router.post("/create")
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Create a new user account.

    Rules:
    - ADMIN: No entity link required
    - TEACHER/CLASS_TEACHER: Must provide teacher_id
    - PARENT: Must provide parent_id
    - STUDENT: Must provide student_id
    """
    user = user_service.create_user(
        db,
        name=payload.name,
        phone=payload.phone,
        password=payload.password,
        role=payload.role,
        email=payload.email,
        student_id=payload.student_id,
        parent_id=payload.parent_id,
        teacher_id=payload.teacher_id,
    )

    return {
        "status": "user_created",
        "user_id": user.id,
        "role": user.role,
    }


@router.put("/{user_id}/role")
def update_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Update a user's role."""
    user = user_service.update_user_role(
        db,
        user_id=user_id,
        new_role=payload.new_role,
        teacher_id=payload.teacher_id,
    )

    return {
        "status": "role_updated",
        "user_id": user.id,
        "new_role": user.role,
    }


@router.post("/{user_id}/assign-class-teacher")
def assign_class_teacher(
    user_id: int,
    payload: ClassTeacherAssign,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Assign a teacher as class teacher for a specific class.
    Automatically updates their role to CLASS_TEACHER.
    """
    user = user_service.assign_class_teacher(
        db,
        user_id=user_id,
        class_id=payload.class_id,
    )

    return {
        "status": "class_teacher_assigned",
        "user_id": user.id,
        "role": user.role,
        "class_id": payload.class_id,
    }


@router.post("/{user_id}/link")
def link_entity(
    user_id: int,
    payload: UserLinkEntity,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Link a user to entity records (student/parent/teacher)."""
    user = user_service.link_user_to_entity(
        db,
        user_id=user_id,
        student_id=payload.student_id,
        parent_id=payload.parent_id,
        teacher_id=payload.teacher_id,
    )

    return {
        "status": "entity_linked",
        "user_id": user.id,
        "student_id": user.student_id,
        "parent_id": user.parent_id,
        "teacher_id": user.teacher_id,
    }


@router.get("/")
def list_users(
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] List all users with optional filtering."""
    users = user_service.get_users_by_role(
        db,
        role=role,
        is_active=is_active,
        limit=limit,
        offset=offset,
    )

    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "phone": u.phone,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "is_approved": u.is_approved,
                "approval_status": u.approval_status,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "student_id": u.student_id,
                "parent_id": u.parent_id,
                "teacher_id": u.teacher_id,
            }
            for u in users
        ],
        "count": len(users),
    }


# ==================== STATIC ROUTES (must come before /{user_id}) ====================

@router.get("/roles/list")
def get_available_roles():
    """Get list of available roles."""
    return {
        "roles": [
            {"value": r.value, "description": _get_role_description(r)}
            for r in Role
        ]
    }


def _get_role_description(role: Role) -> str:
    descriptions = {
        Role.ADMIN: "Full system access - manage everything",
        Role.CLASS_TEACHER: "Teacher + class management + attendance",
        Role.TEACHER: "Subject teaching + marks entry",
        Role.PARENT: "View child's progress + fees + notifications",
        Role.STUDENT: "View own results + attendance + homework",
    }
    return descriptions.get(role, "")


@router.get("/pending-approvals")
def list_pending_approvals(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] List all users pending approval."""
    users = (
        db.query(User)
        .filter(User.approval_status == ApprovalStatus.PENDING)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    total = db.query(User).filter(
        User.approval_status == ApprovalStatus.PENDING
    ).count()

    return {
        "pending_users": [
            {
                "id": u.id,
                "name": u.name,
                "phone": u.phone,
                "email": u.email,
                "role": u.role,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "count": len(users),
        "total": total,
    }


@router.get("/approval-stats")
def get_approval_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Get approval statistics."""
    pending = db.query(User).filter(
        User.approval_status == ApprovalStatus.PENDING
    ).count()

    approved = db.query(User).filter(
        User.approval_status == ApprovalStatus.APPROVED
    ).count()

    rejected = db.query(User).filter(
        User.approval_status == ApprovalStatus.REJECTED
    ).count()

    return {
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "total": pending + approved + rejected,
    }


@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Get comprehensive dashboard statistics.

    Returns counts for users, pending approvals, achievements, events, etc.
    """
    from app.models.event import Event
    from app.models.achievement import Achievement
    from datetime import date

    # User counts
    total_users = db.query(User).filter(User.is_active == True).count()
    pending_approvals = db.query(User).filter(
        User.approval_status == ApprovalStatus.PENDING
    ).count()

    # User counts by role
    student_count = db.query(User).filter(
        User.role == Role.STUDENT.value,
        User.is_active == True,
    ).count()

    parent_count = db.query(User).filter(
        User.role == Role.PARENT.value,
        User.is_active == True,
    ).count()

    teacher_count = db.query(User).filter(
        User.role.in_([Role.TEACHER.value, Role.CLASS_TEACHER.value]),
        User.is_active == True,
    ).count()

    # Achievements count
    try:
        total_achievements = db.query(Achievement).count()
    except:
        total_achievements = 0

    # Upcoming events count
    try:
        upcoming_events = db.query(Event).filter(
            Event.event_date >= date.today()
        ).count()
    except:
        upcoming_events = 0

    return {
        "totalUsers": total_users,
        "pendingAdmissions": pending_approvals,
        "totalAchievements": total_achievements,
        "upcomingEvents": upcoming_events,
        "byRole": {
            "students": student_count,
            "parents": parent_count,
            "teachers": teacher_count,
        },
    }


@router.get("/parent/{parent_id}/children")
def get_parent_children(
    parent_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Get all students linked to a parent.
    """
    from app.models.people import Parent
    from app.models.student_parent import StudentParent

    parent = db.get(Parent, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    links = db.query(StudentParent).filter(
        StudentParent.parent_id == parent_id
    ).all()

    return {
        "parent_id": parent_id,
        "parent_name": parent.name,
        "children": [
            {
                "student_id": link.student.id,
                "student_name": link.student.name,
                "relation_type": link.relation_type,
                "is_primary": link.is_primary,
                "father_name": link.student.father_name,
                "mother_name": link.student.mother_name,
            }
            for link in links
        ],
        "total": len(links),
    }


@router.get("/student/{student_id}/parents")
def get_student_parents(
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Get all parents linked to a student.
    """
    from app.models.people import Student
    from app.models.student_parent import StudentParent

    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    links = db.query(StudentParent).filter(
        StudentParent.student_id == student_id
    ).all()

    return {
        "student_id": student_id,
        "student_name": student.name,
        "father_name_on_record": student.father_name,
        "mother_name_on_record": student.mother_name,
        "linked_parents": [
            {
                "parent_id": link.parent.id,
                "parent_name": link.parent.name,
                "parent_phone": link.parent.phone,
                "relation_type": link.relation_type,
                "is_primary": link.is_primary,
            }
            for link in links
        ],
        "total": len(links),
    }


# ==================== DYNAMIC ROUTES (/{user_id} must come after static routes) ====================

@router.get("/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Get user details."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "name": user.name,
        "phone": user.phone,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "student_id": user.student_id,
        "parent_id": user.parent_id,
        "teacher_id": user.teacher_id,
    }


@router.delete("/{user_id}")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Deactivate a user (soft delete)."""
    user = user_service.deactivate_user(db, user_id)

    return {
        "status": "user_deactivated",
        "user_id": user.id,
    }


@router.delete("/{user_id}/permanent")
def permanently_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Permanently delete a user from the database.

    WARNING: This action cannot be undone. Use with caution.
    - Does not delete linked Student/Parent/Teacher records
    - Only removes the user account (login credentials)
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deleting yourself
    if user.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account"
        )

    user_name = user.name
    user_phone = user.phone

    db.delete(user)
    db.commit()

    return {
        "status": "user_permanently_deleted",
        "user_id": user_id,
        "deleted_user_name": user_name,
        "deleted_user_phone": user_phone,
        "message": "User has been permanently removed from the database",
    }


# ==================== APPROVAL MANAGEMENT ====================

class ApprovalAction(BaseModel):
    """Request body for approval/rejection actions"""
    reason: Optional[str] = None


@router.post("/{user_id}/approve")
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Approve a pending user registration."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.approval_status != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"User is not pending approval (current status: {user.approval_status})"
        )

    user.is_approved = True
    user.approval_status = ApprovalStatus.APPROVED
    user.approved_by_id = admin.id
    user.approved_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    # TODO: Send notification/SMS to user about approval

    return {
        "status": "approved",
        "user_id": user.id,
        "message": f"User {user.name} has been approved and can now login",
    }


@router.post("/{user_id}/reject")
def reject_user(
    user_id: int,
    payload: ApprovalAction,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Reject a pending user registration."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.approval_status != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"User is not pending approval (current status: {user.approval_status})"
        )

    user.is_approved = False
    user.approval_status = ApprovalStatus.REJECTED
    user.approved_by_id = admin.id
    user.approved_at = datetime.utcnow()
    user.rejection_reason = payload.reason

    db.commit()
    db.refresh(user)

    # TODO: Send notification/SMS to user about rejection

    return {
        "status": "rejected",
        "user_id": user.id,
        "message": f"User {user.name} registration has been rejected",
        "reason": payload.reason,
    }


# ==================== PARENT-STUDENT LINKING ====================

class LinkChildRequest(BaseModel):
    """Request to link a parent to a student."""
    parent_id: int
    student_id: int
    relation_type: str = "GUARDIAN"  # FATHER, MOTHER, GUARDIAN
    is_primary: bool = False


@router.post("/parent-student/link")
def link_parent_to_student(
    payload: LinkChildRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Link a parent to a student.

    Creates a StudentParent relationship record.
    """
    from app.models.people import Student, Parent
    from app.models.student_parent import StudentParent, ParentRelationship

    # Verify student exists
    student = db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Verify parent exists
    parent = db.get(Parent, payload.parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    # Validate relation type
    try:
        relation = ParentRelationship(payload.relation_type.upper())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid relation type. Must be one of: FATHER, MOTHER, GUARDIAN"
        )

    # Check if link already exists
    existing = db.query(StudentParent).filter(
        StudentParent.student_id == payload.student_id,
        StudentParent.parent_id == payload.parent_id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="This parent-student link already exists"
        )

    # Create link
    link = StudentParent(
        student_id=payload.student_id,
        parent_id=payload.parent_id,
        relation_type=relation.value,
        is_primary=payload.is_primary,
    )
    db.add(link)
    db.commit()

    return {
        "status": "linked",
        "parent_id": payload.parent_id,
        "parent_name": parent.name,
        "student_id": payload.student_id,
        "student_name": student.name,
        "relation_type": relation.value,
    }


@router.delete("/parent-student/unlink")
def unlink_parent_from_student(
    parent_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Remove a parent-student link.
    """
    from app.models.student_parent import StudentParent

    link = db.query(StudentParent).filter(
        StudentParent.parent_id == parent_id,
        StudentParent.student_id == student_id,
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    db.delete(link)
    db.commit()

    return {
        "status": "unlinked",
        "parent_id": parent_id,
        "student_id": student_id,
    }


@router.post("/parent/{parent_id}/auto-link")
def auto_link_parent_to_children(
    parent_id: int,
    parent_name: str,  # The name to match against father_name or mother_name
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Auto-link a parent to all students with matching parent name.

    This finds all students where:
    - father_name matches the parent_name (creates FATHER link)
    - mother_name matches the parent_name (creates MOTHER link)

    Useful for linking a parent to all their children after registration.
    """
    from app.models.people import Parent, Student
    from app.models.student_parent import StudentParent, ParentRelationship

    parent = db.get(Parent, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    # Normalize name for comparison (case-insensitive)
    name_normalized = parent_name.strip().lower()

    linked_students = []
    errors = []

    # Find students with matching father_name
    father_matches = db.query(Student).filter(
        Student.father_name.ilike(f"%{name_normalized}%")
    ).all()

    for student in father_matches:
        # Check if link already exists
        existing = db.query(StudentParent).filter(
            StudentParent.student_id == student.id,
            StudentParent.parent_id == parent_id,
        ).first()

        if not existing:
            link = StudentParent(
                student_id=student.id,
                parent_id=parent_id,
                relation_type=ParentRelationship.FATHER.value,
                is_primary=True,  # Father is usually primary
            )
            db.add(link)
            linked_students.append({
                "student_id": student.id,
                "student_name": student.name,
                "relation_type": "FATHER",
            })

    # Find students with matching mother_name
    mother_matches = db.query(Student).filter(
        Student.mother_name.ilike(f"%{name_normalized}%")
    ).all()

    for student in mother_matches:
        # Check if link already exists
        existing = db.query(StudentParent).filter(
            StudentParent.student_id == student.id,
            StudentParent.parent_id == parent_id,
        ).first()

        if not existing:
            link = StudentParent(
                student_id=student.id,
                parent_id=parent_id,
                relation_type=ParentRelationship.MOTHER.value,
                is_primary=False,
            )
            db.add(link)
            linked_students.append({
                "student_id": student.id,
                "student_name": student.name,
                "relation_type": "MOTHER",
            })

    db.commit()

    return {
        "status": "auto_link_complete",
        "parent_id": parent_id,
        "parent_name": parent.name,
        "search_name": parent_name,
        "linked_students": linked_students,
        "total_linked": len(linked_students),
        "message": f"Linked parent to {len(linked_students)} student(s)",
    }
