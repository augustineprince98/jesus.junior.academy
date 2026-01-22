from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List
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

    Role Switching:
    - Users with both parent_id and student_id can switch between PARENT and STUDENT roles
    - The 'role' field represents the primary/current role
    - Use /auth/switch-role endpoint to switch roles
    - This supports scenarios like an older sibling who is both a student and needs parent access

    New users require admin approval before they can access the system.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(15), unique=True)
    email: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30))  # Primary/active role
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Approval workflow fields
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    approval_status: Mapped[str] = mapped_column(String(20), default=ApprovalStatus.PENDING)
    approved_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Role-specific entity links (multiple can be set for role switching)
    student_id: Mapped[int | None] = mapped_column(
        ForeignKey("students.id"), nullable=True
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("parents.id"), nullable=True
    )
    teacher_id: Mapped[int | None] = mapped_column(
        ForeignKey("teachers.id"), nullable=True
    )

    def get_available_roles(self) -> List[str]:
        """Get list of roles this user can switch to."""
        roles = [self.role]

        # If user has both parent and student links, they can switch between them
        if self.parent_id and self.student_id:
            if "PARENT" not in roles:
                roles.append("PARENT")
            if "STUDENT" not in roles:
                roles.append("STUDENT")

        # Teachers/class teachers with parent or student links
        if self.teacher_id:
            if "TEACHER" not in roles:
                roles.append("TEACHER")
            if self.parent_id and "PARENT" not in roles:
                roles.append("PARENT")

        return roles

    def can_switch_to(self, new_role: str) -> bool:
        """Check if user can switch to the specified role."""
        return new_role in self.get_available_roles()

    # Relationships
    student = relationship("Student", foreign_keys=[student_id], backref="user_account")
    parent = relationship("Parent", foreign_keys=[parent_id], backref="user_account")
    teacher = relationship("Teacher", foreign_keys=[teacher_id], backref="user_account")
    approved_by = relationship("User", remote_side=[id], foreign_keys=[approved_by_id])
    push_subscriptions = relationship("PushSubscription", back_populates="user", cascade="all, delete-orphan")