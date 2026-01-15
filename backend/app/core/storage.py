"""
File Storage Service

Handles file uploads and storage for images and documents.
Supports local storage with optional S3 integration for production.
"""

import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional
from fastapi import UploadFile, HTTPException

# Configuration
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 5 * 1024 * 1024))  # 5MB default
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_DOCUMENT_TYPES = {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}


def ensure_upload_dir():
    """Ensure upload directory exists"""
    Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    # Create subdirectories
    for subdir in ["images", "documents", "achievements", "events", "gallery", "profiles"]:
        Path(UPLOAD_DIR) / subdir
        (Path(UPLOAD_DIR) / subdir).mkdir(exist_ok=True)


def generate_filename(original_filename: str, prefix: str = "") -> str:
    """Generate a unique filename while preserving extension"""
    ext = Path(original_filename).suffix.lower()
    unique_id = uuid.uuid4().hex[:12]
    timestamp = datetime.now().strftime("%Y%m%d")

    if prefix:
        return f"{prefix}_{timestamp}_{unique_id}{ext}"
    return f"{timestamp}_{unique_id}{ext}"


def validate_file(file: UploadFile, allowed_types: set, max_size: int = MAX_FILE_SIZE) -> None:
    """Validate file type and size"""
    # Check content type
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_types)}"
        )

    # Check file size by reading content
    file.file.seek(0, 2)  # Seek to end
    size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    if size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {max_size / (1024*1024):.1f}MB"
        )


async def save_image(
    file: UploadFile,
    category: str = "images",
    prefix: str = ""
) -> str:
    """
    Save an uploaded image file.

    Args:
        file: The uploaded file
        category: Subdirectory to save in (images, achievements, events, gallery, profiles)
        prefix: Optional prefix for the filename

    Returns:
        The relative path to the saved file
    """
    ensure_upload_dir()
    validate_file(file, ALLOWED_IMAGE_TYPES)

    # Generate unique filename
    filename = generate_filename(file.filename or "image.jpg", prefix)

    # Construct path
    save_path = Path(UPLOAD_DIR) / category / filename

    # Save file
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Return relative path for storage in database
    return f"/{UPLOAD_DIR}/{category}/{filename}"


async def save_document(
    file: UploadFile,
    category: str = "documents",
    prefix: str = ""
) -> str:
    """
    Save an uploaded document file.

    Args:
        file: The uploaded file
        category: Subdirectory to save in
        prefix: Optional prefix for the filename

    Returns:
        The relative path to the saved file
    """
    ensure_upload_dir()
    validate_file(file, ALLOWED_DOCUMENT_TYPES, max_size=10 * 1024 * 1024)  # 10MB for documents

    filename = generate_filename(file.filename or "document.pdf", prefix)
    save_path = Path(UPLOAD_DIR) / category / filename

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    return f"/{UPLOAD_DIR}/{category}/{filename}"


def delete_file(file_path: str) -> bool:
    """
    Delete a file from storage.

    Args:
        file_path: The relative path to the file

    Returns:
        True if deleted, False if file didn't exist
    """
    # Remove leading slash if present
    if file_path.startswith("/"):
        file_path = file_path[1:]

    full_path = Path(file_path)

    if full_path.exists():
        full_path.unlink()
        return True
    return False


def get_file_url(file_path: str, base_url: Optional[str] = None) -> str:
    """
    Get the full URL for a file.

    In development, returns local path.
    In production, could return CDN or S3 URL.
    """
    if base_url:
        return f"{base_url.rstrip('/')}{file_path}"
    return file_path
