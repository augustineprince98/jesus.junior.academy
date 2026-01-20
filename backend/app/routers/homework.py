"""
Homework Router - Subject teachers assign homework.

Flow:
1. Teacher creates homework for their subject/class
2. Teacher uploads attachments (images, documents)
3. Teacher publishes homework
4. System sends notification to all parents of students in the class
"""

from datetime import date, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import uuid
from pathlib import Path

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.school_class import SchoolClass
from app.models.class_subject import ClassSubject
from app.models.homework import Homework, HomeworkAttachment
from app.services.homework_service import (
    create_homework,
    publish_homework,
    get_homework_for_class,
    get_today_homework,
    update_homework,
    delete_homework,
)
from app.services.notification_service import send_daily_homework_digest_all_classes
from app.models.academic_year import AcademicYear
from app.routers.teacher_subjects import is_teacher_assigned_to_subject

# Allowed file types for homework attachments
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_DOC_TYPES = {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
ALLOWED_FILE_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_DOC_TYPES
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


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

    NOTE: Teachers can only create homework for subjects they are assigned to teach.
    Admins can create homework for any subject.
    """
    # Check if teacher is assigned to this subject (skip for admin)
    if user.role != Role.ADMIN.value:
        if not is_teacher_assigned_to_subject(
            db,
            teacher_id=user.id,
            class_id=payload.class_id,
            subject_id=payload.subject_id,
            academic_year_id=payload.academic_year_id,
        ):
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to teach this subject in this class. Contact admin."
            )

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


class PublishHomeworkRequest(BaseModel):
    send_individual_notification: bool = False  # Default: use daily digest


@router.post("/{homework_id}/publish")
def publish_homework_endpoint(
    homework_id: int,
    payload: PublishHomeworkRequest = PublishHomeworkRequest(),
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.TEACHER)),
):
    """
    [TEACHER] Publish homework (makes it visible to parents/students).

    By default, NO individual notification is sent. Instead:
    - Admin sends a compiled "daily digest" at end of day
    - Parents receive ONE notification with ALL subjects' homework

    Set send_individual_notification=true to send notification immediately.
    """
    result = publish_homework(
        db,
        homework_id=homework_id,
        user_id=user.id,
        send_individual_notification=payload.send_individual_notification,
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


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Admin Endpoints - Daily Digest
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class SendDailyDigestRequest(BaseModel):
    target_date: Optional[date] = None  # Defaults to today


@router.post("/send-daily-digest")
def send_daily_digest(
    payload: SendDailyDigestRequest = SendDailyDigestRequest(),
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.CLASS_TEACHER)),
):
    """
    [CLASS_TEACHER/ADMIN] Send compiled daily homework notification to all classes.

    This sends a SINGLE notification per class containing ALL homework
    assigned on that date, grouped by subject.

    Use this instead of individual notifications for a cleaner parent experience.
    """
    # Get current academic year
    current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
    if not current_year:
        raise HTTPException(status_code=400, detail="No current academic year found")

    result = send_daily_homework_digest_all_classes(
        db,
        academic_year_id=current_year.id,
        created_by_id=user.id,
        target_date=payload.target_date,
    )

    return {
        "status": "daily_digest_sent",
        **result,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# File Upload Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Upload directory - can be configured via environment variable
UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "./uploads/homework"))


@router.post("/{homework_id}/upload")
async def upload_homework_attachment(
    homework_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.TEACHER)),
):
    """
    [TEACHER] Upload a file attachment for homework.

    Supported file types:
    - Images: JPEG, PNG, GIF, WebP (max 10MB)
    - Documents: PDF, DOC, DOCX (max 10MB)

    Files are stored in the server's upload directory and can be
    accessed via the /homework/{homework_id}/attachments endpoint.
    """
    # Get the homework
    homework = db.get(Homework, homework_id)
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    # Only the creator or admin can upload attachments
    if homework.assigned_by_id != user.id and user.role != Role.ADMIN.value:
        raise HTTPException(
            status_code=403,
            detail="Only the homework creator can upload attachments"
        )

    # Cannot add attachments to published homework
    if homework.is_published:
        raise HTTPException(
            status_code=400,
            detail="Cannot add attachments to published homework"
        )

    # Validate file type
    content_type = file.content_type
    if content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: images (JPEG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX)"
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed ({MAX_FILE_SIZE // (1024*1024)}MB)"
        )

    # Generate unique filename
    file_ext = Path(file.filename).suffix if file.filename else ".bin"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"

    # Create directory structure: /uploads/homework/{homework_id}/
    homework_upload_dir = UPLOAD_DIR / str(homework_id)
    homework_upload_dir.mkdir(parents=True, exist_ok=True)

    # Save file
    file_path = homework_upload_dir / unique_filename
    with open(file_path, "wb") as f:
        f.write(content)

    # Create attachment record
    attachment = HomeworkAttachment(
        homework_id=homework_id,
        filename=unique_filename,
        original_filename=file.filename or "unknown",
        file_path=str(file_path),
        file_type=content_type,
        file_size=len(content),
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return {
        "status": "file_uploaded",
        "attachment_id": attachment.id,
        "filename": attachment.original_filename,
        "file_type": attachment.file_type,
        "file_size": attachment.file_size,
    }


@router.post("/{homework_id}/upload-multiple")
async def upload_multiple_attachments(
    homework_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.TEACHER)),
):
    """
    [TEACHER] Upload multiple file attachments for homework.

    Maximum 5 files per request.
    """
    if len(files) > 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum 5 files per upload"
        )

    # Get the homework
    homework = db.get(Homework, homework_id)
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    # Only the creator or admin can upload attachments
    if homework.assigned_by_id != user.id and user.role != Role.ADMIN.value:
        raise HTTPException(
            status_code=403,
            detail="Only the homework creator can upload attachments"
        )

    # Cannot add attachments to published homework
    if homework.is_published:
        raise HTTPException(
            status_code=400,
            detail="Cannot add attachments to published homework"
        )

    # Create directory structure
    homework_upload_dir = UPLOAD_DIR / str(homework_id)
    homework_upload_dir.mkdir(parents=True, exist_ok=True)

    uploaded = []
    errors = []

    for file in files:
        try:
            # Validate file type
            if file.content_type not in ALLOWED_FILE_TYPES:
                errors.append({
                    "filename": file.filename,
                    "error": "File type not allowed"
                })
                continue

            # Read and validate size
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                errors.append({
                    "filename": file.filename,
                    "error": f"File too large (max {MAX_FILE_SIZE // (1024*1024)}MB)"
                })
                continue

            # Generate unique filename and save
            file_ext = Path(file.filename).suffix if file.filename else ".bin"
            unique_filename = f"{uuid.uuid4().hex}{file_ext}"
            file_path = homework_upload_dir / unique_filename

            with open(file_path, "wb") as f:
                f.write(content)

            # Create attachment record
            attachment = HomeworkAttachment(
                homework_id=homework_id,
                filename=unique_filename,
                original_filename=file.filename or "unknown",
                file_path=str(file_path),
                file_type=file.content_type,
                file_size=len(content),
            )
            db.add(attachment)
            db.flush()

            uploaded.append({
                "attachment_id": attachment.id,
                "filename": attachment.original_filename,
                "file_type": attachment.file_type,
                "file_size": attachment.file_size,
            })

        except Exception as e:
            errors.append({
                "filename": file.filename,
                "error": str(e)
            })

    db.commit()

    return {
        "status": "upload_complete",
        "uploaded": uploaded,
        "errors": errors,
        "total_uploaded": len(uploaded),
        "total_errors": len(errors),
    }


@router.get("/{homework_id}/attachments")
def get_homework_attachments(
    homework_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get all attachments for a homework.

    Returns list of attachment metadata with download URLs.
    """
    homework = db.get(Homework, homework_id)
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    # Check if user can view this homework
    if user.role in [Role.PARENT.value, Role.STUDENT.value]:
        if not homework.is_published:
            raise HTTPException(status_code=403, detail="Homework not yet published")

    attachments = db.query(HomeworkAttachment).filter(
        HomeworkAttachment.homework_id == homework_id
    ).order_by(HomeworkAttachment.uploaded_at).all()

    return {
        "homework_id": homework_id,
        "attachments": [
            {
                "id": a.id,
                "filename": a.original_filename,
                "file_type": a.file_type,
                "file_size": a.file_size,
                "is_image": a.file_type in ALLOWED_IMAGE_TYPES,
                "download_url": f"/homework/attachment/{a.id}/download",
                "uploaded_at": a.uploaded_at.isoformat(),
            }
            for a in attachments
        ],
        "total": len(attachments),
    }


@router.delete("/{homework_id}/attachment/{attachment_id}")
def delete_homework_attachment(
    homework_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.TEACHER)),
):
    """
    [TEACHER] Delete a homework attachment.
    """
    homework = db.get(Homework, homework_id)
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    # Only the creator or admin can delete attachments
    if homework.assigned_by_id != user.id and user.role != Role.ADMIN.value:
        raise HTTPException(
            status_code=403,
            detail="Only the homework creator can delete attachments"
        )

    # Cannot delete attachments from published homework
    if homework.is_published:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete attachments from published homework"
        )

    attachment = db.query(HomeworkAttachment).filter(
        HomeworkAttachment.id == attachment_id,
        HomeworkAttachment.homework_id == homework_id,
    ).first()

    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Delete file from disk
    try:
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)
    except Exception:
        pass  # Continue even if file deletion fails

    # Delete from database
    db.delete(attachment)
    db.commit()

    return {"status": "attachment_deleted", "attachment_id": attachment_id}


from fastapi.responses import FileResponse

@router.get("/attachment/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Download a homework attachment file.
    """
    attachment = db.get(HomeworkAttachment, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    homework = db.get(Homework, attachment.homework_id)

    # Check if user can view this homework
    if user.role in [Role.PARENT.value, Role.STUDENT.value]:
        if not homework or not homework.is_published:
            raise HTTPException(status_code=403, detail="Homework not yet published")

    # Check if file exists
    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        path=attachment.file_path,
        filename=attachment.original_filename,
        media_type=attachment.file_type,
    )
