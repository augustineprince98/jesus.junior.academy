from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.core.rate_limit import rate_limit
from app.models.user import User
from app.models.admission import AdmissionEnquiry
from app.schemas.admission import (
    AdmissionEnquiryCreate,
    AdmissionEnquiryResponse,
)

router = APIRouter(
    prefix="/admissions",
    tags=["Admissions"],
)


class EnquiryStatusUpdate(BaseModel):
    status: str  # NEW, CONTACTED, CONVERTED, CLOSED

@router.post(
    "/enquiry",
    response_model=AdmissionEnquiryResponse,
)
@rate_limit(max_requests=5, window_seconds=3600)  # 5 enquiries per hour per IP
async def create_admission_enquiry(
    request: Request,
    payload: AdmissionEnquiryCreate,
    db: Session = Depends(get_db),
):
    """Public endpoint for submitting admission enquiries."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        enquiry = AdmissionEnquiry(
            parent_name=payload.parent_name,
            child_name=payload.child_name,
            seeking_class=payload.seeking_class,
            contact_number=payload.contact_number,
        )

        db.add(enquiry)
        db.flush()  # Get the ID without committing
        
        logger.info(f"Admission enquiry created (ID: {enquiry.id}) for {payload.child_name}")
        
        db.commit()
        db.refresh(enquiry)
        
        logger.info(f"Admission enquiry committed successfully (ID: {enquiry.id})")
        
        return enquiry
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create admission enquiry: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to submit enquiry. Please try again later."
        )


@router.get(
    "/list",
    response_model=list[AdmissionEnquiryResponse],
)
def list_admission_enquiries(
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] List all admission enquiries with optional status filter."""
    query = db.query(AdmissionEnquiry)

    if status:
        query = query.filter(AdmissionEnquiry.status == status)

    enquiries = query.order_by(
        AdmissionEnquiry.submitted_at.desc()
    ).limit(limit).offset(offset).all()

    return enquiries


@router.put(
    "/{enquiry_id}/status",
)
def update_enquiry_status(
    enquiry_id: int,
    payload: EnquiryStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Update admission enquiry status."""
    enquiry = db.get(AdmissionEnquiry, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    enquiry.status = payload.status
    db.commit()

    return {"status": "updated", "new_status": enquiry.status}


@router.delete(
    "/{enquiry_id}",
)
def delete_enquiry(
    enquiry_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Delete an admission enquiry."""
    enquiry = db.get(AdmissionEnquiry, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    db.delete(enquiry)
    db.commit()

    return {"status": "deleted"}