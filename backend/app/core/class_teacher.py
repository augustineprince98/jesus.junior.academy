from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.school_class import SchoolClass


def require_class_teacher(
    db: Session,
    class_id: int,
    user_id: int,
):
    school_class = (
        db.query(SchoolClass)
        .filter(SchoolClass.id == class_id)
        .first()
    )

    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    if school_class.class_teacher_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You are not the class teacher for this class",
        )
