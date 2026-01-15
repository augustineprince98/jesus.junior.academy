"""
🎓 RESULTS ENGINE - Authoritative Academic Computation Layer

This engine:
✅ READS verified marks (does NOT collect or edit marks)
✅ COMPUTES weighted scores, percentages, ranks
✅ ENFORCES school rules and academic year isolation
✅ PRODUCES final report cards

Calculation Logic (Classes 2-8):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FA Weight (20%):
  - FA marks: FA-1, FA-2, FA-3, FA-4
  - Max marks per FA per subject: 25 (fixed)
  - FA_Total = FA1 + FA2 + FA3 + FA4
  - FA_Max = Number_of_Subjects × 25 × 4
  - FA_Score = (FA_Total / FA_Max) × 200

Term Weight (80%):
  - Term exams: Mid-Term, Annual
  - Max marks per subject (variable, set by teacher)
  - Term_Total = MidTerm + Annual
  - Term_Max = Sum of subject max marks
  - Term_Score = (Term_Total / Term_Max) × 800

Final Score:
  - Final = FA_Score + Term_Score (out of 1000)
  - Percentage = Final / 10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Dict, List, Optional
from datetime import datetime, date

from app.models.exam import Exam, ExamType, ExamSubjectMax
from app.models.student_mark import StudentMark
from app.models.result import StudentResult, ResultPublication
from app.models.enrollment import Enrollment
from app.models.class_subject import ClassSubject


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📊 FA SCORE CALCULATION (20% WEIGHTAGE)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def calculate_fa_score(
    db: Session,
    student_id: int,
    class_id: int,
    academic_year_id: int
) -> Dict:
    """
    Calculate FA score for a student.

    FA Score = (Total FA marks / Total FA max) × 200

    FA max per subject = 25 marks (fixed)
    4 FA exams per year (FA-1, FA-2, FA-3, FA-4)
    """
    # Get all subjects for this class
    class_subjects = db.query(ClassSubject).filter(
        ClassSubject.class_id == class_id
    ).all()

    num_subjects = len(class_subjects)
    subject_ids = [cs.subject_id for cs in class_subjects]

    # Get all FA exams for this class and academic year
    fa_exams = db.query(Exam).filter(
        Exam.class_id == class_id,
        Exam.academic_year_id == academic_year_id,
        Exam.exam_type == ExamType.FA
    ).all()

    # Get all FA marks for this student
    fa_marks = db.query(StudentMark).filter(
        StudentMark.student_id == student_id,
        StudentMark.exam_id.in_([exam.id for exam in fa_exams]),
        StudentMark.subject_id.in_(subject_ids)
    ).all()

    # Calculate totals
    fa_total_obtained = sum(mark.marks_obtained for mark in fa_marks)

    # FA Max = Number of subjects × 25 marks per subject × 4 FA exams
    fa_total_max = num_subjects * 25 * 4

    # Calculate FA score (out of 200)
    if fa_total_max > 0:
        fa_score = round((fa_total_obtained / fa_total_max) * 200)
    else:
        fa_score = 0

    return {
        "fa_total_obtained": fa_total_obtained,
        "fa_total_max": fa_total_max,
        "fa_score": fa_score,
        "num_subjects": num_subjects,
        "num_fa_exams": len(fa_exams),
        "fa_marks_detail": [
            {
                "exam_name": mark.exam.name,
                "subject": mark.subject.name,
                "marks": mark.marks_obtained,
                "max_marks": 25
            }
            for mark in fa_marks
        ]
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📊 TERM SCORE CALCULATION (80% WEIGHTAGE)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def calculate_term_score(
    db: Session,
    student_id: int,
    class_id: int,
    academic_year_id: int
) -> Dict:
    """
    Calculate Term score for a student.

    Term Score = (Total Term marks / Total Term max) × 800

    Term exams: Mid-Term, Annual
    Max marks per subject: Variable (set by teacher in ExamSubjectMax)
    """
    # Get all subjects for this class
    class_subjects = db.query(ClassSubject).filter(
        ClassSubject.class_id == class_id
    ).all()

    subject_ids = [cs.subject_id for cs in class_subjects]

    # Get term exams (Mid-Term, Annual)
    term_exams = db.query(Exam).filter(
        Exam.class_id == class_id,
        Exam.academic_year_id == academic_year_id,
        Exam.exam_type.in_([ExamType.MID_TERM, ExamType.ANNUAL])
    ).all()

    # Get all term marks for this student
    term_marks = db.query(StudentMark).filter(
        StudentMark.student_id == student_id,
        StudentMark.exam_id.in_([exam.id for exam in term_exams]),
        StudentMark.subject_id.in_(subject_ids)
    ).all()

    # Calculate totals
    term_total_obtained = sum(mark.marks_obtained for mark in term_marks)

    # Get max marks for term exams
    term_total_max = 0
    term_max_detail = []

    for exam in term_exams:
        exam_max = db.query(ExamSubjectMax).filter(
            ExamSubjectMax.exam_id == exam.id,
            ExamSubjectMax.subject_id.in_(subject_ids)
        ).all()

        for max_mark in exam_max:
            term_total_max += max_mark.max_marks
            term_max_detail.append({
                "exam_name": exam.name,
                "subject_id": max_mark.subject_id,
                "max_marks": max_mark.max_marks
            })

    # Calculate Term score (out of 800)
    if term_total_max > 0:
        term_score = round((term_total_obtained / term_total_max) * 800)
    else:
        term_score = 0

    return {
        "term_total_obtained": term_total_obtained,
        "term_total_max": term_total_max,
        "term_score": term_score,
        "num_term_exams": len(term_exams),
        "term_marks_detail": [
            {
                "exam_name": mark.exam.name,
                "exam_type": mark.exam.exam_type.value,
                "subject": mark.subject.name,
                "marks": mark.marks_obtained,
                "max_marks": next(
                    (m["max_marks"] for m in term_max_detail
                     if m["exam_name"] == mark.exam.name and m["subject_id"] == mark.subject_id),
                    0
                )
            }
            for mark in term_marks
        ]
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎯 FINAL RESULT CALCULATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def compute_student_result(
    db: Session,
    student_id: int,
    class_id: int,
    academic_year_id: int,
    force_recompute: bool = False
) -> StudentResult:
    """
    Compute complete academic result for a student.

    Returns StudentResult with:
    - FA score (out of 200)
    - Term score (out of 800)
    - Final score (out of 1000)
    - Percentage (out of 100)

    If result already exists and force_recompute=False, returns cached result.
    """
    # Check if result already exists
    existing = db.query(StudentResult).filter(
        StudentResult.student_id == student_id,
        StudentResult.class_id == class_id,
        StudentResult.academic_year_id == academic_year_id
    ).first()

    if existing and not force_recompute:
        return existing

    # Calculate FA score
    fa_data = calculate_fa_score(db, student_id, class_id, academic_year_id)

    # Calculate Term score
    term_data = calculate_term_score(db, student_id, class_id, academic_year_id)

    # Calculate Final score
    final_score = fa_data["fa_score"] + term_data["term_score"]
    percentage = round(final_score / 10)

    # Create or update result
    if existing:
        # Update existing
        existing.fa_total_obtained = fa_data["fa_total_obtained"]
        existing.fa_total_max = fa_data["fa_total_max"]
        existing.fa_score = fa_data["fa_score"]
        existing.term_total_obtained = term_data["term_total_obtained"]
        existing.term_total_max = term_data["term_total_max"]
        existing.term_score = term_data["term_score"]
        existing.final_score = final_score
        existing.percentage = percentage
        existing.last_updated = datetime.utcnow()

        result = existing
    else:
        # Create new
        result = StudentResult(
            student_id=student_id,
            class_id=class_id,
            academic_year_id=academic_year_id,
            fa_total_obtained=fa_data["fa_total_obtained"],
            fa_total_max=fa_data["fa_total_max"],
            fa_score=fa_data["fa_score"],
            term_total_obtained=term_data["term_total_obtained"],
            term_total_max=term_data["term_total_max"],
            term_score=term_data["term_score"],
            final_score=final_score,
            percentage=percentage,
            computed_at=datetime.utcnow()
        )
        db.add(result)

    db.commit()
    db.refresh(result)

    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🏆 RANK CALCULATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def calculate_class_ranks(
    db: Session,
    class_id: int,
    academic_year_id: int
) -> List[StudentResult]:
    """
    Calculate ranks for all students in a class.

    Ranks are based on final_score (descending).
    Only called after March 31st (or configured date).
    """
    # Get all results for this class
    results = db.query(StudentResult).filter(
        StudentResult.class_id == class_id,
        StudentResult.academic_year_id == academic_year_id
    ).order_by(StudentResult.final_score.desc()).all()

    # Assign ranks
    current_rank = 1
    for i, result in enumerate(results):
        # Handle ties (same score = same rank)
        if i > 0 and result.final_score == results[i-1].final_score:
            result.class_rank = results[i-1].class_rank
        else:
            result.class_rank = current_rank

        current_rank += 1

    db.commit()

    return results


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📋 REPORT CARD GENERATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def generate_report_card(
    db: Session,
    student_id: int,
    class_id: int,
    academic_year_id: int
) -> Dict:
    """
    Generate complete report card for a student.

    Returns:
    - Student details
    - Subject-wise marks (FA + Term)
    - FA score breakdown
    - Term score breakdown
    - Final score
    - Percentage
    - Rank (if visible)
    """
    # Get student result
    result = db.query(StudentResult).filter(
        StudentResult.student_id == student_id,
        StudentResult.class_id == class_id,
        StudentResult.academic_year_id == academic_year_id
    ).first()

    if not result:
        # Compute if doesn't exist
        result = compute_student_result(db, student_id, class_id, academic_year_id)

    # Get detailed marks
    fa_data = calculate_fa_score(db, student_id, class_id, academic_year_id)
    term_data = calculate_term_score(db, student_id, class_id, academic_year_id)

    # Check visibility settings
    publication = db.query(ResultPublication).filter(
        ResultPublication.class_id == class_id,
        ResultPublication.academic_year_id == academic_year_id
    ).first()

    # Build report card
    report = {
        "student_id": student_id,
        "student_name": result.student.name,
        "class_name": result.school_class.name,
        "academic_year": result.academic_year.name,

        # Subject-wise marks
        "fa_marks": fa_data["fa_marks_detail"],
        "term_marks": term_data["term_marks_detail"],

        # Scores
        "fa_breakdown": {
            "total_obtained": fa_data["fa_total_obtained"],
            "total_max": fa_data["fa_total_max"],
            "score": fa_data["fa_score"],
            "weightage": "20%"
        },
        "term_breakdown": {
            "total_obtained": term_data["term_total_obtained"],
            "total_max": term_data["term_total_max"],
            "score": term_data["term_score"],
            "weightage": "80%"
        },

        # Final result
        "final_score": result.final_score,
        "percentage": result.percentage,

        # Rank (only if visible)
        "rank": result.class_rank if (publication and publication.ranks_visible) else None,

        # Visibility flags
        "marks_visible": publication.marks_visible if publication else True,
        "results_visible": publication.results_visible if publication else False,
        "ranks_visible": publication.ranks_visible if publication else False,

        # Metadata
        "computed_at": result.computed_at.isoformat()
    }

    return report


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔄 BULK OPERATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def compute_all_class_results(
    db: Session,
    class_id: int,
    academic_year_id: int,
    force_recompute: bool = False
) -> int:
    """
    Compute results for all students in a class.

    Returns number of results computed.
    """
    # Get all enrolled students
    enrollments = db.query(Enrollment).filter(
        Enrollment.class_id == class_id
    ).all()

    count = 0
    for enrollment in enrollments:
        compute_student_result(
            db,
            enrollment.student_id,
            class_id,
            academic_year_id,
            force_recompute=force_recompute
        )
        count += 1

    return count
