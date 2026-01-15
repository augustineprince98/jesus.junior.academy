"""
File Upload Router

Handles image and document uploads for the application.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import require_role_at_least
from app.core.roles import Role
from app.core.storage import save_image, save_document, delete_file, ALLOWED_IMAGE_TYPES
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["File Uploads"])


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    category: str = Form(default="images"),
    prefix: str = Form(default=""),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_at_least(Role.TEACHER)),
):
    """
    Upload an image file.

    - **file**: The image file to upload (JPEG, PNG, GIF, WebP)
    - **category**: Category folder (images, achievements, events, gallery, profiles)
    - **prefix**: Optional prefix for the filename

    Returns the URL path to the uploaded file.
    """
    valid_categories = ["images", "achievements", "events", "gallery", "profiles"]
    if category not in valid_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
        )

    file_path = await save_image(file, category=category, prefix=prefix)

    return {
        "status": "uploaded",
        "file_path": file_path,
        "category": category,
        "filename": file.filename,
        "content_type": file.content_type,
    }


@router.post("/images/bulk")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    category: str = Form(default="gallery"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_at_least(Role.TEACHER)),
):
    """
    Upload multiple images at once.

    - **files**: List of image files to upload
    - **category**: Category folder for all images

    Returns list of uploaded file paths.
    """
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed per upload")

    uploaded = []
    errors = []

    for file in files:
        try:
            file_path = await save_image(file, category=category)
            uploaded.append({
                "filename": file.filename,
                "file_path": file_path,
            })
        except HTTPException as e:
            errors.append({
                "filename": file.filename,
                "error": e.detail,
            })

    return {
        "status": "completed",
        "uploaded": uploaded,
        "errors": errors,
        "total_uploaded": len(uploaded),
        "total_errors": len(errors),
    }


@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form(default="documents"),
    prefix: str = Form(default=""),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_at_least(Role.TEACHER)),
):
    """
    Upload a document file (PDF, DOC, DOCX).

    - **file**: The document file to upload
    - **category**: Category folder
    - **prefix**: Optional prefix for the filename

    Returns the URL path to the uploaded file.
    """
    file_path = await save_document(file, category=category, prefix=prefix)

    return {
        "status": "uploaded",
        "file_path": file_path,
        "category": category,
        "filename": file.filename,
        "content_type": file.content_type,
    }


@router.delete("/")
async def delete_uploaded_file(
    file_path: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    Delete an uploaded file. Admin only.

    - **file_path**: The path to the file to delete
    """
    deleted = delete_file(file_path)

    if deleted:
        return {"status": "deleted", "file_path": file_path}
    else:
        raise HTTPException(status_code=404, detail="File not found")


@router.get("/allowed-types")
def get_allowed_types():
    """Get list of allowed file types for uploads."""
    return {
        "images": list(ALLOWED_IMAGE_TYPES),
        "documents": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        "max_image_size_mb": 5,
        "max_document_size_mb": 10,
    }
