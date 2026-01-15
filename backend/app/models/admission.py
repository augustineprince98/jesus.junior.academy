from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.core.database import Base


class AdmissionEnquiry(Base):
    __tablename__ = "admission_enquiries"

    id: Mapped[int] = mapped_column(primary_key=True)

    child_name: Mapped[str] = mapped_column(String(100))
    parent_name: Mapped[str] = mapped_column(String(100))
    seeking_class: Mapped[str] = mapped_column(String(20))  # LEVEL_I .. CLASS_8
    contact_number: Mapped[str] = mapped_column(String(10))

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )

    status: Mapped[str] = mapped_column(
        String(20), default="NEW"
    )
    # NEW / CONTACTED / CONVERTED / CLOSED
