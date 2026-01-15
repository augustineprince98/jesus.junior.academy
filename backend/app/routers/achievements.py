"""Achievements Router - Student Achievers Club"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.achievement import Achievement, AchievementCategory

router = APIRouter(prefix="/achievements", tags=["Achievements"])


class AchievementCreate(BaseModel):
    student_id: Optional[int] = None
    title: str
    description: str
    category: str  # ACADEMIC, SPORTS, ARTS, etc.
    achievement_date: date
    image_url: Optional[str] = None
    is_featured: bool = False
    is_public: bool = True
    academic_year_id: Optional[int] = None


class AchievementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_featured: Optional[bool] = None
    is_public: Optional[bool] = None
    display_order: Optional[int] = None


@router.post("/create")
def create_achievement(
    payload: AchievementCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Add a new achievement."""
    try:
        category = AchievementCategory(payload.category)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid category. Use: {[c.value for c in AchievementCategory]}")

    achievement = Achievement(
        student_id=payload.student_id,
        title=payload.title,
        description=payload.description,
        category=category.value,
        achievement_date=payload.achievement_date,
        image_url=payload.image_url,
        is_featured=payload.is_featured,
        is_public=payload.is_public,
        created_by_id=user.id,
        academic_year_id=payload.academic_year_id,
    )
    db.add(achievement)
    db.commit()
    db.refresh(achievement)

    return {"status": "achievement_created", "id": achievement.id}


@router.get("/list")
def list_all_achievements(
    category: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] List all achievements (including non-public)."""
    query = db.query(Achievement)

    if category:
        query = query.filter(Achievement.category == category)

    achievements = query.order_by(
        Achievement.is_featured.desc(),
        Achievement.achievement_date.desc()
    ).limit(limit).offset(offset).all()

    return [
        {
            "id": a.id,
            "student_id": a.student_id,
            "title": a.title,
            "description": a.description,
            "category": a.category,
            "achievement_date": a.achievement_date,
            "image_url": a.image_url,
            "is_featured": a.is_featured,
            "is_public": a.is_public,
            "display_order": a.display_order,
        }
        for a in achievements
    ]


@router.get("/public")
def get_public_achievements(
    category: Optional[str] = None,
    featured_only: bool = False,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """[PUBLIC] Get achievements for Achievers Club page."""
    query = db.query(Achievement).filter(Achievement.is_public.is_(True))

    if category:
        query = query.filter(Achievement.category == category)
    if featured_only:
        query = query.filter(Achievement.is_featured.is_(True))

    achievements = query.order_by(
        Achievement.is_featured.desc(),
        Achievement.display_order,
        Achievement.achievement_date.desc()
    ).limit(limit).all()

    return [
        {
            "id": a.id,
            "student_name": a.student.name if a.student else "School Achievement",
            "title": a.title,
            "description": a.description,
            "category": a.category,
            "date": str(a.achievement_date),
            "image_url": a.image_url,
        }
        for a in achievements
    ]


@router.get("/student/{student_id}")
def get_student_achievements(
    student_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get achievements for a specific student."""
    achievements = db.query(Achievement).filter(
        Achievement.student_id == student_id
    ).order_by(Achievement.achievement_date.desc()).all()

    return {
        "student_id": student_id,
        "achievements": [
            {
                "id": a.id,
                "title": a.title,
                "description": a.description,
                "category": a.category,
                "achievement_date": a.achievement_date,
            }
            for a in achievements
        ]
    }


@router.put("/{achievement_id}")
def update_achievement(
    achievement_id: int,
    payload: AchievementUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Update an achievement."""
    achievement = db.get(Achievement, achievement_id)
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")

    if payload.title:
        achievement.title = payload.title
    if payload.description:
        achievement.description = payload.description
    if payload.category:
        achievement.category = payload.category
    if payload.image_url is not None:
        achievement.image_url = payload.image_url
    if payload.is_featured is not None:
        achievement.is_featured = payload.is_featured
    if payload.is_public is not None:
        achievement.is_public = payload.is_public
    if payload.display_order is not None:
        achievement.display_order = payload.display_order

    db.commit()
    return {"status": "achievement_updated"}


@router.delete("/{achievement_id}")
def delete_achievement(
    achievement_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Delete an achievement."""
    achievement = db.get(Achievement, achievement_id)
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")

    db.delete(achievement)
    db.commit()
    return {"status": "achievement_deleted"}


@router.get("/categories")
def get_categories():
    """Get available achievement categories."""
    return {"categories": [c.value for c in AchievementCategory]}
