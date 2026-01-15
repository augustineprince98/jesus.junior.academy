"""
Homework Router - Subject teachers assign homework.

Flow:
1. Teacher creates homework for their subject/class
2. Teacher publishes homework
3. System sends notification to all parents of students in the class
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.school_class import SchoolClass
from app.models.class_subject import ClassSubject
from app.services.homework_service import (
    create_homework,
    publish_homework,
    get_homework_for_class,
    get_today_homework,
    update_homework,
    delete_homework,
)


router = APIRouter(
    prefix="/homework",
    tags=["Homework"],
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Schemas
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class CreateHomeworkRequest(BaseModel):
    class_id: int
    subject_id: int
    academic_year_id: int
    title: str
    description: str
    assigned_date: date
    due_date: date


class UpdateHomeworkRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None


class HomeworkResponse(BaseModel):
    id: int
    title: str
    description: str
    subject_id: int
    subject_name: str
    assigned_date: date
    due_date: date
    is_published: bool


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Teacher Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/create")
def create_new_homework(
    payload: CreateHomeworkRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.TEACHER)),
):
    """
    [TEACHER] Create a new homework assignment.

    Homework is created as draft. Use /publish to send notification.
    """
    homework = create_homework(
        db,
        class_id=payload.class_id,
        subject_id=payload.subject_id,
        academic_year_id=payload.academic_year_id,
        assigned_by_id=user.id,
        title=payload.title,
        description=payload.description,
        assigned_date=payload.assigned_date,
        due_date=payload.due_date,
    )

    return {
        "status": "homework_created",
        "homework_id": homework.id,
        "title": homework.title,
        "is_published": homework.is_published,
    }


@router.post("/{homework_id}/publish")
def publish_homework_endpoint(
    homework_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.TEACHER)),
):
    """
    [TEACHER] Publish homework and send notification to parents.

    Once published:
    - Notification sent to all parents of students in the class
    - Homework cannot be edited or deleted
    """
    result = publish_homework(
        db,
        homework_id=homework_id,
        user_id=user.id,
    )

    return {
        "status": "homework_published",
        **result,
    }


@router.put("/{homework_id}")
def update_homework_endpoint(
    homework_id: int,
    payload: UpdateHomeworkRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.TEACHER)),
):
    """
    [TEACHER] Update homework (only before publishing).
    """
    homework = update_homework(
        db,
        homework_id=homework_id,
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
    )

    return {
        "status": "homework_updated",
        "homework_id": homework.id,
        "title": homework.title,
        "due_date": homework.due_date,
    }


@router.delete("/{homework_id}")
def delete_homework_endpoint(
    homework_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.TEACHER)),
):
    """
    [TEACHER] Delete homework (only before publishing).
    """
    delete_homework(db, homework_id=homework_id)
    return {"status": "homework_deleted"}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# View Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/class/{class_id}/year/{academic_year_id}")
def get_class_homework(
    class_id: int,
    academic_year_id: int,
    subject_id: Optional[int] = None,
    published_only: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get homework for a class.

    Teachers see all, parents/students see only published.
    """
    # Parents and students only see published homework
    if user.role in [Role.PARENT.value, Role.STUDENT.value]:
        published_only = True

    homework_list = get_homework_for_class(
        db,
        class_id=class_id,
        academic_year_id=academic_year_id,
        subject_id=subject_id,
        published_only=published_only,
    )

    return {
        "class_id": class_id,
        "academic_year_id": academic_year_id,
        "homework": homework_list,
        "total": len(homework_list),
    }


@router.get("/class/{class_id}/today")
def get_todays_homework(
    class_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get homework assigned today for a class.

    Useful for parents to see daily assignments.
    """
    homework_list = get_today_homework(
        db,
        class_id=class_id,
        academic_year_id=academic_year_id,
    )

    return {
        "class_id": class_id,
        "date": date.today(),
        "homework": homework_list,
        "total": len(homework_list),
    }
