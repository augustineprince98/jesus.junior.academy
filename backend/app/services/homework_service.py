"""
Homework Service - Subject teachers assign homework.

When published, sends bulk notification to all parents of students in the class.
"""

from datetime import date, datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.homework import Homework
from app.models.subject import Subject
from app.models.class_subject import ClassSubject
from app.services.notification_service import create_homework_notification, send_notification


def create_homework(
    db: Session,
    *,
    class_id: int,
    subject_id: int,
    academic_year_id: int,
    assigned_by_id: int,
    title: str,
    description: str,
    assigned_date: date,
    due_date: date,
) -> Homework:
    """
    Create a new homework assignment.

    Validates:
    - Subject is assigned to the class
    - Due date is after assigned date
    """
    # Validate subject is assigned to class
    class_subject = db.query(ClassSubject).filter(
        ClassSubject.class_id == class_id,
        ClassSubject.subject_id == subject_id,
    ).first()

    if not class_subject:
        raise HTTPException(
            status_code=400,
            detail="This subject is not assigned to this class"
        )

    # Validate due date
    if due_date < assigned_date:
        raise HTTPException(
            status_code=400,
            detail="Due date cannot be before assigned date"
        )

    homework = Homework(
        class_id=class_id,
        subject_id=subject_id,
        academic_year_id=academic_year_id,
        assigned_by_id=assigned_by_id,
        title=title,
        description=description,
        assigned_date=assigned_date,
        due_date=due_date,
        is_published=False,
    )
    db.add(homework)
    db.commit()
    db.refresh(homework)
    return homework


def publish_homework(
    db: Session,
    *,
    homework_id: int,
    user_id: int,
) -> dict:
    """
    Publish homework and send notification to parents.

    Only the teacher who created the homework or admin can publish.
    """
    homework = db.get(Homework, homework_id)
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    if homework.is_published:
        raise HTTPException(status_code=400, detail="Homework already published")

    # Get subject name
    subject = db.get(Subject, homework.subject_id)

    # Mark as published
    homework.is_published = True
    homework.published_at = datetime.utcnow()

    # Create and send notification
    notification = create_homework_notification(
        db,
        class_id=homework.class_id,
        subject_name=subject.name,
        homework_title=homework.title,
        homework_description=homework.description,
        due_date=homework.due_date,
        academic_year_id=homework.academic_year_id,
        created_by_id=user_id,
    )

    send_result = send_notification(db, notification_id=notification.id)

    db.commit()

    return {
        "homework_id": homework_id,
        "published_at": homework.published_at,
        "notification_sent_to": send_result["recipients_count"],
    }


def get_homework_for_class(
    db: Session,
    *,
    class_id: int,
    academic_year_id: int,
    subject_id: Optional[int] = None,
    published_only: bool = False,
) -> List[dict]:
    """
    Get homework assignments for a class.
    """
    query = db.query(Homework).filter(
        Homework.class_id == class_id,
        Homework.academic_year_id == academic_year_id,
    )

    if subject_id:
        query = query.filter(Homework.subject_id == subject_id)

    if published_only:
        query = query.filter(Homework.is_published.is_(True))

    homework_list = query.order_by(Homework.due_date.desc()).all()

    result = []
    for hw in homework_list:
        subject = db.get(Subject, hw.subject_id)
        result.append({
            "id": hw.id,
            "title": hw.title,
            "description": hw.description,
            "subject_id": hw.subject_id,
            "subject_name": subject.name,
            "assigned_date": hw.assigned_date,
            "due_date": hw.due_date,
            "is_published": hw.is_published,
            "published_at": hw.published_at,
        })

    return result


def get_today_homework(
    db: Session,
    *,
    class_id: int,
    academic_year_id: int,
) -> List[dict]:
    """
    Get homework assigned today for a class.

    Used for daily homework notification compilation.
    """
    today = date.today()

    homework_list = db.query(Homework).filter(
        Homework.class_id == class_id,
        Homework.academic_year_id == academic_year_id,
        Homework.assigned_date == today,
        Homework.is_published.is_(True),
    ).all()

    result = []
    for hw in homework_list:
        subject = db.get(Subject, hw.subject_id)
        result.append({
            "id": hw.id,
            "title": hw.title,
            "description": hw.description,
            "subject_name": subject.name,
            "due_date": hw.due_date,
        })

    return result


def update_homework(
    db: Session,
    *,
    homework_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    due_date: Optional[date] = None,
) -> Homework:
    """
    Update homework (only before publishing).
    """
    homework = db.get(Homework, homework_id)
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    if homework.is_published:
        raise HTTPException(
            status_code=400,
            detail="Cannot update homework after publishing"
        )

    if title:
        homework.title = title
    if description:
        homework.description = description
    if due_date:
        if due_date < homework.assigned_date:
            raise HTTPException(
                status_code=400,
                detail="Due date cannot be before assigned date"
            )
        homework.due_date = due_date

    db.commit()
    db.refresh(homework)
    return homework


def delete_homework(
    db: Session,
    *,
    homework_id: int,
) -> bool:
    """
    Delete homework (only before publishing).
    """
    homework = db.get(Homework, homework_id)
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    if homework.is_published:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete homework after publishing"
        )

    db.delete(homework)
    db.commit()
    return True
