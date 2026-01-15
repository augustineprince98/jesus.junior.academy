from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import require_roles
from app.core.roles import Role
from app.models.enrollment import Enrollment

router = APIRouter(
    prefix="/enrollment",
    tags=["Enrollment"],
)


@router.post("/assign")
def enroll_student(
    student_id: int,
    class_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(Role.ADMIN)),
):
    enrollment = Enrollment(
        student_id=student_id,
        class_id=class_id,
        academic_year_id=academic_year_id,
    )
    db.add(enrollment)
    db.commit()
    return {"status": "enrolled"}
