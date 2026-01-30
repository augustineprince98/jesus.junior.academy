from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import require_role_at_least
from app.core.roles import Role
from app.models.settings import SystemSettings
from app.schemas.settings import (
    SystemSettingsResponse,
    SystemSettingsUpdate,
    SchoolSettings,
    NotificationSettings,
    SecuritySettings
)
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["System Settings"])

def get_or_create_settings(db: Session) -> SystemSettings:
    settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not settings:
        settings = SystemSettings(
            id=1,
            school_config=SchoolSettings().dict(),
            notification_config=NotificationSettings().dict(),
            security_config=SecuritySettings().dict()
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("/", response_model=SystemSettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    # Allow authenticated users to view public school info? 
    # For now restriction to ADMIN for full config, but maybe open specific endpoint for public
    current_user: User = Depends(require_role_at_least(Role.TEACHER)) 
):
    """Get all system settings."""
    settings = get_or_create_settings(db)
    
    return {
        "school": settings.school_config,
        "notifications": settings.notification_config,
        "security": settings.security_config,
        "updated_at": settings.updated_at.isoformat() if settings.updated_at else None
    }

@router.put("/", response_model=SystemSettingsResponse)
def update_settings(
    payload: SystemSettingsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN))
):
    """[ADMIN] Update system settings."""
    settings = get_or_create_settings(db)
    
    if payload.school:
        settings.school_config = payload.school.dict()
    
    if payload.notifications:
        settings.notification_config = payload.notifications.dict()
        
    if payload.security:
        settings.security_config = payload.security.dict()
    
    db.commit()
    db.refresh(settings)
    
    return {
        "school": settings.school_config,
        "notifications": settings.notification_config,
        "security": settings.security_config,
        "updated_at": settings.updated_at.isoformat() if settings.updated_at else None
    }

@router.get("/public")
def get_public_school_info(db: Session = Depends(get_db)):
    """Get public school information (name, logo, etc). Open to all."""
    settings = get_or_create_settings(db)
    config = settings.school_config or {}
    return {
        "name": config.get("name", "Jesus Junior Academy"),
        "logo_url": config.get("logo_url", ""),
        "tagline": config.get("tagline", ""),
        "established_year": config.get("established_year", ""),
        "address": config.get("address", ""),
        "email": config.get("email", ""),
        "phone": config.get("phone", "")
    }
