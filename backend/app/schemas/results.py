"""
Results schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RESULT PUBLICATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ResultPublicationCreate(BaseModel):
    """Create result publication settings for a class"""
    class_id: int
    academic_year_id: int
    rank_calculation_date: Optional[date] = Field(
        None,
        description="Date when ranks should be calculated (e.g., 2025-03-31)"
    )


class ResultPublicationUpdate(BaseModel):
    """Update result visibility settings"""
    marks_visible: Optional[bool] = Field(None, description="Students can see individual marks")
    results_visible: Optional[bool] = Field(None, description="Computed results (FA/Term scores) visible")
    ranks_visible: Optional[bool] = Field(None, description="Ranks visible (only after calculation date)")


class ResultPublicationResponse(BaseModel):
    """Result publication settings response"""
    id: int
    class_id: int
    academic_year_id: int
    marks_visible: bool
    results_visible: bool
    ranks_visible: bool
    published_by_id: Optional[int]
    published_at: Optional[datetime]
    rank_calculation_date: Optional[date]
    rank_calculated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STUDENT RESULT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class StudentResultResponse(BaseModel):
    """Basic student result response"""
    id: int
    student_id: int
    class_id: int
    academic_year_id: int

    # FA Score (20%)
    fa_total_obtained: int
    fa_total_max: int
    fa_score: int

    # Term Score (80%)
    term_total_obtained: int
    term_total_max: int
    term_score: int

    # Final
    final_score: int
    percentage: int
    class_rank: Optional[int]

    computed_at: datetime
    last_updated: datetime

    class Config:
        from_attributes = True


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DETAILED MARKS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class SubjectMarkDetail(BaseModel):
    """Individual subject mark detail"""
    exam_name: str
    exam_type: Optional[str] = None
    subject: str
    marks: int
    max_marks: int


class FABreakdown(BaseModel):
    """FA score breakdown"""
    total_obtained: int
    total_max: int
    score: int
    weightage: str


class TermBreakdown(BaseModel):
    """Term score breakdown"""
    total_obtained: int
    total_max: int
    score: int
    weightage: str


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# REPORT CARD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ReportCard(BaseModel):
    """Complete report card"""
    student_id: int
    student_name: str
    class_name: str
    academic_year: str

    # Subject-wise marks
    fa_marks: List[SubjectMarkDetail]
    term_marks: List[SubjectMarkDetail]

    # Score breakdowns
    fa_breakdown: FABreakdown
    term_breakdown: TermBreakdown

    # Final result
    final_score: int
    percentage: int
    rank: Optional[int]

    # Visibility flags
    marks_visible: bool
    results_visible: bool
    ranks_visible: bool

    # Metadata
    computed_at: str


class StudentMarksOnly(BaseModel):
    """Student can see only their marks (not computed results)"""
    student_id: int
    student_name: str
    class_name: str
    academic_year: str

    # Only raw marks
    fa_marks: List[SubjectMarkDetail]
    term_marks: List[SubjectMarkDetail]

    # No computed scores shown until results_visible = True


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BULK OPERATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ComputeResultsRequest(BaseModel):
    """Request to compute results for entire class"""
    class_id: int
    academic_year_id: int
    force_recompute: bool = Field(
        default=False,
        description="Recompute even if results already exist"
    )


class ComputeResultsResponse(BaseModel):
    """Response from bulk computation"""
    message: str
    class_id: int
    academic_year_id: int
    students_computed: int
    ranks_calculated: bool


class CalculateRanksRequest(BaseModel):
    """Request to calculate ranks for a class"""
    class_id: int
    academic_year_id: int


class CalculateRanksResponse(BaseModel):
    """Response from rank calculation"""
    message: str
    class_id: int
    academic_year_id: int
    total_students: int
    ranks_assigned: bool
    calculation_date: Optional[date]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CLASS SUMMARY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class StudentSummary(BaseModel):
    """Summary of one student's result"""
    student_id: int
    student_name: str
    fa_score: int
    term_score: int
    final_score: int
    percentage: int
    rank: Optional[int]


class ClassResultsSummary(BaseModel):
    """Summary of all results in a class"""
    class_id: int
    class_name: str
    academic_year: str
    total_students: int
    results_published: bool
    ranks_visible: bool

    # Statistics
    highest_score: int
    lowest_score: int
    average_score: float

    # Individual students
    students: List[StudentSummary]
