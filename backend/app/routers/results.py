"""
🎓 RESULTS ROUTER - Academic Results Management

This router handles:
✅ Student result viewing (own marks only)
✅ Class teacher result publishing
✅ Rank calculation (after March 31st)
✅ Report card generation
✅ Result visibility controls
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.result import ResultPublication, StudentResult
from app.schemas.results import (
    ResultPublicationCreate,
    ResultPublicationUpdate,
    ResultPublicationResponse,
    StudentResultResponse,
    ReportCard,
    StudentMarksOnly,
    ComputeResultsRequest,
    ComputeResultsResponse,
    CalculateRanksRequest,
    CalculateRanksResponse,
    ClassResultsSummary,
    StudentSummary,
    FABreakdown,
    TermBreakdown,
    SubjectMarkDetail,
)
from app.services.results_engine import (
    compute_student_result,
    compute_all_class_results,
    calculate_class_ranks,
    generate_report_card,
    calculate_fa_score,
    calculate_term_score,
)

router = APIRouter(prefix="/results", tags=["Results Engine"])


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 👨‍🎓 STUDENT ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/my-marks/year/{academic_year_id}")
def get_my_marks(
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    [STUDENT] View own marks for an academic year.

    Students can ALWAYS see their individual marks (marks_visible = true by default).
    Computed results (FA/Term scores) only visible when class teacher publishes.
    """
    if user.role != Role.STUDENT.value:
        raise HTTPException(
            status_code=403,
            detail="Only students can view their own marks"
        )

    # Get linked student_id from user
    if not user.student_id:
        raise HTTPException(
            status_code=400,
            detail="Your user account is not linked to a student record. Contact admin."
        )

    # Use the existing endpoint logic
    return get_student_result(
        student_id=user.student_id,
        academic_year_id=academic_year_id,
        db=db,
        user=user
    )


@router.get("/student/{student_id}/year/{academic_year_id}")
def get_student_result(
    student_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get student's result for an academic year.

    Returns:
    - If results NOT published: Only raw marks
    - If results published: Complete report card
    - If ranks calculated: Includes rank
    """
    # Get student's enrollment to find class
    from app.models.enrollment import Enrollment

    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=404, detail="Student enrollment not found")

    class_id = enrollment.class_id

    # Check publication settings
    publication = db.query(ResultPublication).filter(
        ResultPublication.class_id == class_id,
        ResultPublication.academic_year_id == academic_year_id
    ).first()

    # Get FA and Term marks
    fa_data = calculate_fa_score(db, student_id, class_id, academic_year_id)
    term_data = calculate_term_score(db, student_id, class_id, academic_year_id)

    # If results not published, show only marks
    if not publication or not publication.results_visible:
        from app.models.people import Student
        from app.models.school_class import SchoolClass
        from app.models.academic_year import AcademicYear

        student = db.get(Student, student_id)
        school_class = db.get(SchoolClass, class_id)
        academic_year = db.get(AcademicYear, academic_year_id)

        return StudentMarksOnly(
            student_id=student_id,
            student_name=student.name,
            class_name=school_class.name,
            academic_year=academic_year.name,
            fa_marks=[SubjectMarkDetail(**m) for m in fa_data["fa_marks_detail"]],
            term_marks=[SubjectMarkDetail(**m) for m in term_data["term_marks_detail"]]
        )

    # Results are published, generate full report card
    report = generate_report_card(db, student_id, class_id, academic_year_id)

    return ReportCard(
        student_id=report["student_id"],
        student_name=report["student_name"],
        class_name=report["class_name"],
        academic_year=report["academic_year"],
        fa_marks=[SubjectMarkDetail(**m) for m in report["fa_marks"]],
        term_marks=[SubjectMarkDetail(**m) for m in report["term_marks"]],
        fa_breakdown=FABreakdown(**report["fa_breakdown"]),
        term_breakdown=TermBreakdown(**report["term_breakdown"]),
        final_score=report["final_score"],
        percentage=report["percentage"],
        rank=report["rank"],
        marks_visible=report["marks_visible"],
        results_visible=report["results_visible"],
        ranks_visible=report["ranks_visible"],
        computed_at=report["computed_at"]
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 👨‍🏫 CLASS TEACHER ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/publication", response_model=ResultPublicationResponse, status_code=status.HTTP_201_CREATED)
def create_result_publication(
    payload: ResultPublicationCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN))
):
    """
    [ADMIN/CLASS_TEACHER] Create result publication settings for a class.

    Sets up visibility controls for results.
    """
    # Check if already exists
    existing = db.query(ResultPublication).filter(
        ResultPublication.class_id == payload.class_id,
        ResultPublication.academic_year_id == payload.academic_year_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Result publication already exists for this class and year"
        )

    publication = ResultPublication(
        class_id=payload.class_id,
        academic_year_id=payload.academic_year_id,
        marks_visible=True,  # Always true
        results_visible=False,  # Class teacher controls
        ranks_visible=False,  # Only after rank calculation date
        rank_calculation_date=payload.rank_calculation_date
    )

    db.add(publication)
    db.commit()
    db.refresh(publication)

    return ResultPublicationResponse.from_orm(publication)


@router.put("/publication/{publication_id}", response_model=ResultPublicationResponse)
def update_result_publication(
    publication_id: int,
    payload: ResultPublicationUpdate,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_role_at_least(Role.CLASS_TEACHER))
):
    """
    [CLASS_TEACHER] Update result visibility settings.

    Class teacher can:
    - Publish results (results_visible = true)
    - Enable rank visibility (ranks_visible = true, only after calculation date)
    """
    publication = db.get(ResultPublication, publication_id)
    if not publication:
        raise HTTPException(status_code=404, detail="Result publication not found")

    # Update visibility settings
    if payload.marks_visible is not None:
        publication.marks_visible = payload.marks_visible

    if payload.results_visible is not None:
        publication.results_visible = payload.results_visible
        if payload.results_visible and not publication.published_at:
            publication.published_by_id = teacher.id
            publication.published_at = datetime.utcnow()

    if payload.ranks_visible is not None:
        # Check if rank calculation date has passed
        if payload.ranks_visible:
            if publication.rank_calculation_date:
                if date.today() < publication.rank_calculation_date:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Ranks can only be made visible after {publication.rank_calculation_date}"
                    )
            # Check if ranks have been calculated
            if not publication.rank_calculated_at:
                raise HTTPException(
                    status_code=400,
                    detail="Ranks must be calculated before making them visible"
                )

        publication.ranks_visible = payload.ranks_visible

    db.commit()
    db.refresh(publication)

    return ResultPublicationResponse.from_orm(publication)


@router.post("/compute", response_model=ComputeResultsResponse)
def compute_class_results(
    payload: ComputeResultsRequest,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_role_at_least(Role.CLASS_TEACHER))
):
    """
    [CLASS_TEACHER/ADMIN] Compute results for all students in a class.

    Reads all verified marks and computes FA/Term scores for entire class.
    """
    # Compute results
    count = compute_all_class_results(
        db,
        payload.class_id,
        payload.academic_year_id,
        force_recompute=payload.force_recompute
    )

    return ComputeResultsResponse(
        message=f"Successfully computed results for {count} students",
        class_id=payload.class_id,
        academic_year_id=payload.academic_year_id,
        students_computed=count,
        ranks_calculated=False
    )


@router.post("/calculate-ranks", response_model=CalculateRanksResponse)
def calculate_ranks(
    payload: CalculateRanksRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN))
):
    """
    [ADMIN] Calculate ranks for all students in a class.

    Should only be called after March 31st (or configured date).
    """
    # Check if publication exists
    publication = db.query(ResultPublication).filter(
        ResultPublication.class_id == payload.class_id,
        ResultPublication.academic_year_id == payload.academic_year_id
    ).first()

    if not publication:
        raise HTTPException(
            status_code=404,
            detail="Result publication not found. Create it first."
        )

    # Check if rank calculation date has passed
    if publication.rank_calculation_date:
        if date.today() < publication.rank_calculation_date:
            raise HTTPException(
                status_code=400,
                detail=f"Ranks can only be calculated after {publication.rank_calculation_date}"
            )

    # Calculate ranks
    results = calculate_class_ranks(db, payload.class_id, payload.academic_year_id)

    # Update publication
    publication.rank_calculated_at = datetime.utcnow()
    db.commit()

    return CalculateRanksResponse(
        message=f"Ranks calculated for {len(results)} students",
        class_id=payload.class_id,
        academic_year_id=payload.academic_year_id,
        total_students=len(results),
        ranks_assigned=True,
        calculation_date=publication.rank_calculation_date
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 👨‍💼 ADMIN ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/class/{class_id}/year/{academic_year_id}/summary")
def get_class_results_summary(
    class_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.CLASS_TEACHER))
):
    """
    [ADMIN/CLASS_TEACHER] Get summary of all results in a class.

    Shows:
    - All student results
    - Class statistics (highest, lowest, average)
    - Publication status
    """
    from app.models.school_class import SchoolClass
    from app.models.academic_year import AcademicYear

    school_class = db.get(SchoolClass, class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    academic_year = db.get(AcademicYear, academic_year_id)
    if not academic_year:
        raise HTTPException(status_code=404, detail="Academic year not found")

    # Get all results
    results = db.query(StudentResult).options(
        joinedload(StudentResult.student)
    ).filter(
        StudentResult.class_id == class_id,
        StudentResult.academic_year_id == academic_year_id
    ).order_by(StudentResult.final_score.desc()).all()

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No results found. Compute results first."
        )

    # Get publication settings
    publication = db.query(ResultPublication).filter(
        ResultPublication.class_id == class_id,
        ResultPublication.academic_year_id == academic_year_id
    ).first()

    # Calculate statistics
    scores = [r.final_score for r in results]
    highest_score = max(scores)
    lowest_score = min(scores)
    average_score = sum(scores) / len(scores)

    # Build student summaries
    students = [
        StudentSummary(
            student_id=r.student_id,
            student_name=r.student.name,
            fa_score=r.fa_score,
            term_score=r.term_score,
            final_score=r.final_score,
            percentage=r.percentage,
            rank=r.class_rank
        )
        for r in results
    ]

    return ClassResultsSummary(
        class_id=class_id,
        class_name=school_class.name,
        academic_year=academic_year.name,
        total_students=len(results),
        results_published=publication.results_visible if publication else False,
        ranks_visible=publication.ranks_visible if publication else False,
        highest_score=highest_score,
        lowest_score=lowest_score,
        average_score=round(average_score, 2),
        students=students
    )


@router.get("/publication/class/{class_id}/year/{academic_year_id}", response_model=ResultPublicationResponse)
def get_result_publication(
    class_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get result publication settings for a class.
    """
    publication = db.query(ResultPublication).filter(
        ResultPublication.class_id == class_id,
        ResultPublication.academic_year_id == academic_year_id
    ).first()

    if not publication:
        raise HTTPException(
            status_code=404,
            detail="Result publication not found for this class and year"
        )

    return ResultPublicationResponse.from_orm(publication)
