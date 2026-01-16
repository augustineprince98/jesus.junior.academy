from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.subject import Subject
from app.schemas.subject import SubjectResponse

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("/", response_model=List[SubjectResponse])
def get_subjects(db: Session = Depends(get_db)):
    """
    Get all subjects
    """
    subjects = db.query(Subject).all()
    return subjects
