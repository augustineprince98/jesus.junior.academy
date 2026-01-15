"""
Student-Parent Linking Model

Links students to their parents/guardians.
One student can have multiple parents (father, mother, guardian).
One parent can have multiple students (siblings).
"""

from enum import Enum
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.orm import relationship as orm_relationship

from app.core.database import Base


class ParentRelationship(str, Enum):
    FATHER = "FATHER"
    MOTHER = "MOTHER"
    GUARDIAN = "GUARDIAN"


class StudentParent(Base):
    """
    Links students to their parents/guardians.

    Used for:
    - Sending notifications to correct parents
    - Parent login to view child's marks
    - Fee communication
    """
    __tablename__ = "student_parents"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[int] = mapped_column(
        ForeignKey("parents.id", ondelete="CASCADE"), nullable=False
    )
    relation_type: Mapped[str] = mapped_column(String(20), nullable=False)  # FATHER, MOTHER, GUARDIAN
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    student = orm_relationship("Student", backref="parent_links")
    parent = orm_relationship("Parent", backref="student_links")

    def __repr__(self):
        return f"<StudentParent student={self.student_id} parent={self.parent_id} ({self.relation_type})>"
