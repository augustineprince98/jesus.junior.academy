from sqlalchemy.orm import Session
from app.models.enrollment import Enrollment
from app.models.people import Student


def assign_roll_numbers(
    db: Session,
    academic_year_id: int,
    class_id: int,
) -> int:
    """
    Assign roll numbers alphabetically by student name.
    Safe to run once per class per year.
    """

    enrollments = (
        db.query(Enrollment)
        .join(Student)
        .filter(
            Enrollment.academic_year_id == academic_year_id,
            Enrollment.class_id == class_id,
            Enrollment.status == "ACTIVE",
            Enrollment.roll_number.is_(None),
        )
        .order_by(Student.name.asc())
        .all()
    )

    for index, enrollment in enumerate(enrollments, start=1):
        enrollment.roll_number = index

    db.commit()
    return len(enrollments)
