"""
Promotion Service - Handles student promotions between classes.

Features:
- Bulk promotion for entire class
- Individual student promotion
- Repeat class (hold back) functionality
- Class 8 passout (graduation)
- Level III to Class 1 transition
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.enrollment import Enrollment
from app.models.school_class import SchoolClass
from app.models.result import StudentResult
from app.core.promotion_map import PROMOTION_FLOW


class PromotionStatus:
    PROMOTED = "PROMOTED"      # Successfully promoted to next class
    REPEATED = "REPEATED"      # Held back in same class
    GRADUATED = "GRADUATED"    # Passed out (Class 8)
    WITHDRAWN = "WITHDRAWN"    # Left school


def get_next_class_name(current_class_name: str) -> Optional[str]:
    """Get the next class in the promotion flow."""
    return PROMOTION_FLOW.get(current_class_name)


def promote_class(
    *,
    db: Session,
    from_class_id: int,
    from_academic_year_id: int,
    to_class_id: int,
    to_academic_year_id: int,
    exclude_student_ids: Optional[List[int]] = None,
):
    """
    Bulk promote all students from one class to the next.

    Args:
        from_class_id: Source class ID
        from_academic_year_id: Source academic year ID
        to_class_id: Destination class ID
        to_academic_year_id: Destination academic year ID
        exclude_student_ids: Students to exclude (those being held back)

    Returns:
        dict with promotion statistics
    """
    exclude_ids = set(exclude_student_ids or [])

    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.class_id == from_class_id,
            Enrollment.academic_year_id == from_academic_year_id,
            Enrollment.status == "ACTIVE",
        )
        .all()
    )

    if not enrollments:
        raise HTTPException(status_code=400, detail="No students to promote")

    promoted_count = 0
    excluded_count = 0

    for e in enrollments:
        if e.student_id in exclude_ids:
            excluded_count += 1
            continue

        e.status = PromotionStatus.PROMOTED
        e.promotion_status = PromotionStatus.PROMOTED

        db.add(
            Enrollment(
                student_id=e.student_id,
                class_id=to_class_id,
                academic_year_id=to_academic_year_id,
                status="ACTIVE",
            )
        )
        promoted_count += 1

    db.commit()

    return {
        "from_class_id": from_class_id,
        "to_class_id": to_class_id,
        "promoted": promoted_count,
        "excluded": excluded_count,
        "total": len(enrollments),
    }


def hold_back_student(
    *,
    db: Session,
    student_id: int,
    class_id: int,
    from_academic_year_id: int,
    to_academic_year_id: int,
    reason: Optional[str] = None,
):
    """
    Hold back (repeat) a student in the same class for the next year.

    Args:
        student_id: The student to hold back
        class_id: The class they'll repeat
        from_academic_year_id: Current academic year
        to_academic_year_id: Next academic year
        reason: Reason for holding back (optional)

    Returns:
        dict with new enrollment details
    """
    # Get current enrollment
    current_enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == student_id,
            Enrollment.class_id == class_id,
            Enrollment.academic_year_id == from_academic_year_id,
            Enrollment.status == "ACTIVE",
        )
        .first()
    )

    if not current_enrollment:
        raise HTTPException(
            status_code=404,
            detail="Student not enrolled in this class"
        )

    # Mark old enrollment as repeated
    current_enrollment.status = PromotionStatus.REPEATED
    current_enrollment.promotion_status = PromotionStatus.REPEATED

    # Create new enrollment in same class
    new_enrollment = Enrollment(
        student_id=student_id,
        class_id=class_id,  # Same class
        academic_year_id=to_academic_year_id,
        status="ACTIVE",
    )
    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)

    return {
        "student_id": student_id,
        "class_id": class_id,
        "status": PromotionStatus.REPEATED,
        "new_enrollment_id": new_enrollment.id,
    }


def graduate_class_8(
    *,
    db: Session,
    class_id: int,
    academic_year_id: int,
):
    """
    Graduate all Class 8 students (passout).

    No new enrollment created - students complete school.
    """
    # Verify this is actually Class 8
    school_class = db.get(SchoolClass, class_id)
    if not school_class or school_class.name != "CLASS_8":
        raise HTTPException(
            status_code=400,
            detail="This operation is only for Class 8"
        )

    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.class_id == class_id,
            Enrollment.academic_year_id == academic_year_id,
            Enrollment.status == "ACTIVE",
        )
        .all()
    )

    if not enrollments:
        raise HTTPException(status_code=400, detail="No students to graduate")

    graduated_count = 0
    for e in enrollments:
        e.status = PromotionStatus.GRADUATED
        e.promotion_status = PromotionStatus.GRADUATED
        graduated_count += 1

    db.commit()

    return {
        "class_id": class_id,
        "graduated": graduated_count,
        "message": f"{graduated_count} students have passed out of school",
    }


def promote_individual_student(
    *,
    db: Session,
    student_id: int,
    from_class_id: int,
    from_academic_year_id: int,
    to_class_id: int,
    to_academic_year_id: int,
):
    """
    Promote a single student.

    Useful for late admissions or special cases.
    """
    # Get current enrollment
    current = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == student_id,
            Enrollment.class_id == from_class_id,
            Enrollment.academic_year_id == from_academic_year_id,
            Enrollment.status == "ACTIVE",
        )
        .first()
    )

    if not current:
        raise HTTPException(
            status_code=404,
            detail="Student not enrolled in source class"
        )

    # Check if already enrolled in target
    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == student_id,
            Enrollment.academic_year_id == to_academic_year_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Student already enrolled for the target academic year"
        )

    # Mark old as promoted
    current.status = PromotionStatus.PROMOTED
    current.promotion_status = PromotionStatus.PROMOTED

    # Create new enrollment
    new_enrollment = Enrollment(
        student_id=student_id,
        class_id=to_class_id,
        academic_year_id=to_academic_year_id,
        status="ACTIVE",
    )
    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)

    return {
        "student_id": student_id,
        "from_class_id": from_class_id,
        "to_class_id": to_class_id,
        "status": PromotionStatus.PROMOTED,
        "new_enrollment_id": new_enrollment.id,
    }


def get_promotion_preview(
    *,
    db: Session,
    class_id: int,
    academic_year_id: int,
):
    """
    Preview what will happen when a class is promoted.

    Shows which students will go where.
    """
    school_class = db.get(SchoolClass, class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    next_class_name = get_next_class_name(school_class.name)

    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.class_id == class_id,
            Enrollment.academic_year_id == academic_year_id,
            Enrollment.status == "ACTIVE",
        )
        .all()
    )

    # Get results if available
    results = {}
    for e in enrollments:
        result = (
            db.query(StudentResult)
            .filter(
                StudentResult.student_id == e.student_id,
                StudentResult.class_id == class_id,
                StudentResult.academic_year_id == academic_year_id,
            )
            .first()
        )
        if result:
            results[e.student_id] = {
                "percentage": result.percentage,
                "is_passed": result.is_passed,
                "rank": result.class_rank,
            }

    preview = {
        "current_class": school_class.name,
        "next_class": next_class_name,
        "is_graduation": next_class_name is None,
        "total_students": len(enrollments),
        "students": [],
    }

    for e in enrollments:
        student_data = {
            "student_id": e.student_id,
            "roll_number": e.roll_number,
        }
        if e.student_id in results:
            student_data.update(results[e.student_id])
        preview["students"].append(student_data)

    return preview


def bulk_promote_all_classes(
    *,
    db: Session,
    from_academic_year_id: int,
    to_academic_year_id: int,
):
    """
    Promote all classes for the academic year transition.

    Follows the PROMOTION_FLOW:
    - Level I → Level II
    - Level II → Level III
    - Level III → Class 1
    - Class 1 → Class 2
    - ...
    - Class 7 → Class 8
    - Class 8 → Graduated (passout)

    Returns:
        dict with promotion summary for all classes
    """
    results = []

    # Get all classes for the source academic year
    classes = (
        db.query(SchoolClass)
        .filter(SchoolClass.academic_year_id == from_academic_year_id)
        .all()
    )

    for school_class in classes:
        next_class_name = get_next_class_name(school_class.name)

        if next_class_name is None:
            # Class 8 - graduate
            result = graduate_class_8(
                db=db,
                class_id=school_class.id,
                academic_year_id=from_academic_year_id,
            )
            results.append({
                "class": school_class.name,
                "action": "GRADUATED",
                **result,
            })
        else:
            # Find or create target class
            target_class = (
                db.query(SchoolClass)
                .filter(
                    SchoolClass.name == next_class_name,
                    SchoolClass.academic_year_id == to_academic_year_id,
                )
                .first()
            )

            if not target_class:
                # Create target class
                target_class = SchoolClass(
                    name=next_class_name,
                    academic_year_id=to_academic_year_id,
                )
                db.add(target_class)
                db.commit()
                db.refresh(target_class)

            try:
                result = promote_class(
                    db=db,
                    from_class_id=school_class.id,
                    from_academic_year_id=from_academic_year_id,
                    to_class_id=target_class.id,
                    to_academic_year_id=to_academic_year_id,
                )
                results.append({
                    "class": school_class.name,
                    "action": "PROMOTED",
                    **result,
                })
            except HTTPException:
                results.append({
                    "class": school_class.name,
                    "action": "SKIPPED",
                    "reason": "No students to promote",
                })

    return {
        "from_academic_year_id": from_academic_year_id,
        "to_academic_year_id": to_academic_year_id,
        "class_results": results,
        "total_classes_processed": len(results),
    }
