from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.marks_edit_request import (
    MarksEditRequest,
    EditRequestStatus,
)
from app.models.student_mark import StudentMark
from app.core.roles import Role


def request_mark_edit(
    db: Session,
    *,
    student_mark_id: int,
    reason: str,
    user,
):
    if user.role not in {Role.CLASS_TEACHER, Role.ADMIN}:
        raise HTTPException(status_code=403, detail="Not allowed")

    mark = db.get(StudentMark, student_mark_id)
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")

    request = MarksEditRequest(
        student_mark_id=student_mark_id,
        requested_by_id=user.id,
        reason=reason,
    )
    db.add(request)
    db.commit()
    return request


def approve_mark_edit(
    db: Session,
    *,
    request_id: int,
    admin_user,
):
    if admin_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")

    req = db.get(MarksEditRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.status = EditRequestStatus.APPROVED
    req.approved_by_id = admin_user.id

    req.student_mark.is_locked = False

    db.commit()
    return req
