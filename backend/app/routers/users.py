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


# ==================== APPROVAL MANAGEMENT ====================

class ApprovalAction(BaseModel):
    """Request body for approval/rejection actions"""
    reason: Optional[str] = None


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
