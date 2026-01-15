from sqlalchemy import (
    Integer,
    ForeignKey,
    String,
    Enum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


class EditRequestStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class MarksEditRequest(Base):
    """
    Class Teacher → Admin approval workflow.
    NO direct edits allowed without this.
    """

    __tablename__ = "marks_edit_requests"

    id: Mapped[int] = mapped_column(primary_key=True)

    student_mark_id: Mapped[int] = mapped_column(
        ForeignKey("student_marks.id", ondelete="CASCADE")
    )

    requested_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT")
    )

    approved_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )

    reason: Mapped[str] = mapped_column(String(255))

    status: Mapped[EditRequestStatus] = mapped_column(
        Enum(EditRequestStatus),
        default=EditRequestStatus.PENDING,
        nullable=False,
    )

    student_mark = relationship("StudentMark")
