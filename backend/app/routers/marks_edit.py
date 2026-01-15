from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.schemas.marks_edit import EditRequestCreate
from app.services.marks_edit_service import (
    request_mark_edit,
    approve_mark_edit,
)

router = APIRouter(
    prefix="/marks-edit",
    tags=["Marks Edit"],
)


@router.post("/request")
def request_edit_api(
    payload: EditRequestCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return request_mark_edit(
        db,
        student_mark_id=payload.student_mark_id,
        reason=payload.reason,
        user=user,
    )


@router.post("/{request_id}/approve")
def approve_edit_api(
    request_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_user),
):
    return approve_mark_edit(
        db,
        request_id=request_id,
        admin_user=admin,
    )
