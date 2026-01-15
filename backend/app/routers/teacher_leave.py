"""Teacher Leave Management Router"""

from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.teacher_leave import TeacherLeave, LeaveStatus, LeaveType

router = APIRouter(prefix="/teacher-leave", tags=["Teacher Leave"])


class LeaveApplicationRequest(BaseModel):
    leave_type: str  # CASUAL, SICK, EARNED, MATERNITY, EMERGENCY
    from_date: date
    to_date: date
    reason: str


class LeaveReviewRequest(BaseModel):
    remarks: Optional[str] = None


@router.post("/apply")
def apply_for_leave(
    payload: LeaveApplicationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Teacher applies for leave."""
    if not user.teacher_id:
        raise HTTPException(status_code=400, detail="User not linked to teacher record")

    if payload.to_date < payload.from_date:
        raise HTTPException(status_code=400, detail="To date cannot be before from date")

    # Validate leave type
    try:
        leave_type = LeaveType(payload.leave_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid leave type. Use: {[t.value for t in LeaveType]}")

    leave = TeacherLeave(
        teacher_id=user.teacher_id,
        leave_type=leave_type.value,
        from_date=payload.from_date,
        to_date=payload.to_date,
        reason=payload.reason,
        status=LeaveStatus.PENDING.value,
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    return {
        "status": "leave_applied",
        "leave_id": leave.id,
        "total_days": leave.total_days,
    }


@router.get("/my-leaves")
def get_my_leaves(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get own leave applications."""
    if not user.teacher_id:
        raise HTTPException(status_code=400, detail="User not linked to teacher record")

    query = db.query(TeacherLeave).filter(TeacherLeave.teacher_id == user.teacher_id)

    if status:
        query = query.filter(TeacherLeave.status == status)

    leaves = query.order_by(TeacherLeave.applied_at.desc()).all()

    return {
        "leaves": [
            {
                "id": l.id,
                "leave_type": l.leave_type,
                "from_date": l.from_date,
                "to_date": l.to_date,
                "total_days": l.total_days,
                "reason": l.reason,
                "status": l.status,
                "applied_at": l.applied_at,
                "review_remarks": l.review_remarks,
            }
            for l in leaves
        ]
    }


@router.get("/pending")
def get_pending_leaves(
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Get all pending leave applications."""
    leaves = db.query(TeacherLeave).filter(
        TeacherLeave.status == LeaveStatus.PENDING.value
    ).order_by(TeacherLeave.applied_at).all()

    return {
        "pending_leaves": [
            {
                "id": l.id,
                "teacher_id": l.teacher_id,
                "leave_type": l.leave_type,
                "from_date": l.from_date,
                "to_date": l.to_date,
                "total_days": l.total_days,
                "reason": l.reason,
                "applied_at": l.applied_at,
            }
            for l in leaves
        ],
        "total": len(leaves),
    }


@router.post("/{leave_id}/approve")
def approve_leave(
    leave_id: int,
    payload: LeaveReviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Approve a leave application."""
    leave = db.get(TeacherLeave, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")

    if leave.status != LeaveStatus.PENDING.value:
        raise HTTPException(status_code=400, detail=f"Leave already {leave.status}")

    leave.status = LeaveStatus.APPROVED.value
    leave.reviewed_by_id = user.id
    leave.reviewed_at = datetime.utcnow()
    leave.review_remarks = payload.remarks

    db.commit()
    return {"status": "leave_approved", "leave_id": leave_id}


@router.post("/{leave_id}/reject")
def reject_leave(
    leave_id: int,
    payload: LeaveReviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Reject a leave application."""
    leave = db.get(TeacherLeave, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")

    if leave.status != LeaveStatus.PENDING.value:
        raise HTTPException(status_code=400, detail=f"Leave already {leave.status}")

    leave.status = LeaveStatus.REJECTED.value
    leave.reviewed_by_id = user.id
    leave.reviewed_at = datetime.utcnow()
    leave.review_remarks = payload.remarks

    db.commit()
    return {"status": "leave_rejected", "leave_id": leave_id}


@router.delete("/{leave_id}/cancel")
def cancel_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Cancel own pending leave application."""
    if not user.teacher_id:
        raise HTTPException(status_code=400, detail="User not linked to teacher record")

    leave = db.get(TeacherLeave, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")

    if leave.teacher_id != user.teacher_id:
        raise HTTPException(status_code=403, detail="Not your leave application")

    if leave.status != LeaveStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="Can only cancel pending leaves")

    leave.status = LeaveStatus.CANCELLED.value
    db.commit()
    return {"status": "leave_cancelled"}


@router.get("/all")
def get_all_leaves(
    teacher_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Get all leave applications."""
    query = db.query(TeacherLeave)

    if teacher_id:
        query = query.filter(TeacherLeave.teacher_id == teacher_id)
    if status:
        query = query.filter(TeacherLeave.status == status)

    leaves = query.order_by(TeacherLeave.applied_at.desc()).all()

    return {
        "leaves": [
            {
                "id": l.id,
                "teacher_id": l.teacher_id,
                "leave_type": l.leave_type,
                "from_date": l.from_date,
                "to_date": l.to_date,
                "total_days": l.total_days,
                "reason": l.reason,
                "status": l.status,
                "applied_at": l.applied_at,
                "reviewed_at": l.reviewed_at,
                "review_remarks": l.review_remarks,
            }
            for l in leaves
        ],
        "total": len(leaves),
    }
