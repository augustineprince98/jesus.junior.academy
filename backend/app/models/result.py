"""
Results Model - Controls result visibility and publication
"""
from sqlalchemy import Column, Integer, ForeignKey, Boolean, DateTime, Date
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class ResultPublication(Base):
    """
    Controls when results are visible to students.
    Class teacher publishes results after marks are finalized.
    """
    __tablename__ = "result_publications"

    id = Column(Integer, primary_key=True)

    # Which class and academic year
    class_id = Column(Integer, ForeignKey("school_classes.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)

    # Visibility controls
    marks_visible = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="Students can always see their individual marks"
    )

    results_visible = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Class teacher controls when computed results (FA/Term scores) are visible"
    )

    ranks_visible = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Ranks only visible after March 31st"
    )

    # Publication metadata
    published_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    published_at = Column(DateTime, nullable=True)

    # Rank calculation date
    rank_calculated_at = Column(DateTime, nullable=True)
    rank_calculation_date = Column(
        Date,
        nullable=True,
        comment="Date when ranks should be calculated (e.g., March 31st)"
    )

    # Relationships
    school_class = relationship("SchoolClass")
    academic_year = relationship("AcademicYear")
    published_by = relationship("User")


class StudentResult(Base):
    """
    Cached/computed results for a student.
    Read-only - computed by Results Engine from verified marks.
    """
    __tablename__ = "student_results"

    id = Column(Integer, primary_key=True)

    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("school_classes.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)

    # FA Score (20% weightage)
    fa_total_obtained = Column(Integer, nullable=False, default=0)
    fa_total_max = Column(Integer, nullable=False, default=0)
    fa_score = Column(Integer, nullable=False, default=0, comment="Out of 200")

    # Term Score (80% weightage)
    term_total_obtained = Column(Integer, nullable=False, default=0)
    term_total_max = Column(Integer, nullable=False, default=0)
    term_score = Column(Integer, nullable=False, default=0, comment="Out of 800")

    # Final Score
    final_score = Column(Integer, nullable=False, default=0, comment="Out of 1000")
    percentage = Column(Integer, nullable=False, default=0, comment="Percentage (final_score / 10)")

    # Rank (calculated only after publication date)
    class_rank = Column(Integer, nullable=True, comment="Rank within class")

    # Metadata
    computed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student")
    school_class = relationship("SchoolClass")
    academic_year = relationship("AcademicYear")
