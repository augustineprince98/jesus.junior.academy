from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ApprovalStatus:
    """User approval status constants"""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class User(Base):
    """
    User account model for authentication.

    Links to specific entity based on role:
    - STUDENT role -> student_id (FK to students)
    - PARENT role -> parent_id (FK to parents)
    - TEACHER/CLASS_TEACHER role -> teacher_id (FK to teachers)
    - ADMIN role -> no linked entity needed

    New users require admin approval before they can access the system.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(15), unique=True)
    email: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Approval workflow fields
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    approval_status: Mapped[str] = mapped_column(String(20), default=ApprovalStatus.PENDING)
    approved_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Role-specific entity links (only one should be set based on role)
    student_id: Mapped[int | None] = mapped_column(
        ForeignKey("students.id"), nullable=True
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("parents.id"), nullable=True
    )
    teacher_id: Mapped[int | None] = mapped_column(
        ForeignKey("teachers.id"), nullable=True
    )

    # Relationships
    student = relationship("Student", foreign_keys=[student_id], backref="user_account")
    parent = relationship("Parent", foreign_keys=[parent_id], backref="user_account")
    teacher = relationship("Teacher", foreign_keys=[teacher_id], backref="user_account")
    approved_by = relationship("User", remote_side=[id], foreign_keys=[approved_by_id])