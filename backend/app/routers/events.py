"""Events Router - School Activities & Celebrations"""

from datetime import date, time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.event import Event, EventType

router = APIRouter(prefix="/events", tags=["Events"])


class EventCreate(BaseModel):
    title: str
    description: str
    event_type: str  # CELEBRATION, SPORTS, CULTURAL, etc.
    event_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    venue: Optional[str] = None
    image_url: Optional[str] = None
    is_public: bool = True
    is_featured: bool = False
    for_students: bool = True
    for_parents: bool = True
    for_teachers: bool = True
    target_class_id: Optional[int] = None
    academic_year_id: Optional[int] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    venue: Optional[str] = None
    image_url: Optional[str] = None
    is_public: Optional[bool] = None
    is_featured: Optional[bool] = None


@router.post("/create")
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Create a new event."""
    try:
        event_type = EventType(payload.event_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid event type. Use: {[e.value for e in EventType]}")

    event = Event(
        title=payload.title,
        description=payload.description,
        event_type=event_type.value,
        event_date=payload.event_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        venue=payload.venue,
        image_url=payload.image_url,
        is_public=payload.is_public,
        is_featured=payload.is_featured,
        for_students=payload.for_students,
        for_parents=payload.for_parents,
        for_teachers=payload.for_teachers,
        target_class_id=payload.target_class_id,
        created_by_id=user.id,
        academic_year_id=payload.academic_year_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return {"status": "event_created", "id": event.id}


@router.get("/list")
def list_all_events(
    event_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] List all events (including non-public)."""
    query = db.query(Event)

    if event_type:
        query = query.filter(Event.event_type == event_type)

    events = query.order_by(
        Event.event_date.desc()
    ).limit(limit).offset(offset).all()

    return [
        {
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "event_type": e.event_type,
            "event_date": e.event_date,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "venue": e.venue,
            "image_url": e.image_url,
            "is_featured": e.is_featured,
            "is_public": e.is_public,
            "for_students": e.for_students,
            "for_parents": e.for_parents,
            "for_teachers": e.for_teachers,
        }
        for e in events
    ]


@router.get("/public")
def get_public_events(
    event_type: Optional[str] = None,
    upcoming_only: bool = True,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """[PUBLIC] Get events for Activities page."""
    query = db.query(Event).filter(Event.is_public.is_(True))

    if event_type:
        query = query.filter(Event.event_type == event_type)
    if upcoming_only:
        query = query.filter(Event.event_date >= date.today())

    events = query.order_by(
        Event.is_featured.desc(),
        Event.event_date
    ).limit(limit).all()

    return [
        {
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "event_type": e.event_type,
            "date": str(e.event_date),
            "venue": e.venue,
            "image_url": e.image_url,
            "audience_students": e.for_students,
            "audience_parents": e.for_parents,
            "audience_teachers": e.for_teachers,
        }
        for e in events
    ]


@router.get("/upcoming")
def get_upcoming_events(
    days: int = 30,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get upcoming events (for logged-in users)."""
    from datetime import timedelta
    end_date = date.today() + timedelta(days=days)

    events = db.query(Event).filter(
        Event.event_date >= date.today(),
        Event.event_date <= end_date,
    ).order_by(Event.event_date).all()

    return {
        "events": [
            {
                "id": e.id,
                "title": e.title,
                "description": e.description,
                "event_type": e.event_type,
                "event_date": e.event_date,
                "venue": e.venue,
            }
            for e in events
        ]
    }


@router.get("/{event_id}")
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
):
    """Get event details."""
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "event_type": event.event_type,
        "event_date": event.event_date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "venue": event.venue,
        "image_url": event.image_url,
    }


@router.put("/{event_id}")
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Update an event."""
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    db.commit()
    return {"status": "event_updated"}


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Delete an event."""
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()
    return {"status": "event_deleted"}


@router.get("/types")
def get_event_types():
    """Get available event types."""
    return {"types": [e.value for e in EventType]}
