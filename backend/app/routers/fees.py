from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.roles import Role
from app.models.user import User
from app.models.academic_year import AcademicYear
from app.models.fees import (
    StudentFeeProfile,
    FeeStructure,
    FeePayment,
    PaymentFrequency,
    PaymentMode,
)
from app.services.fee_service import calculate_total_paid, validate_payment_amount

router = APIRouter(prefix="/fees", tags=["Fees"])


# ========================================
# STUDENT FEE ENDPOINT
# ========================================

@router.get("/student/my-fees")
def get_student_fees(
    academic_year_id: int = None,
    db: Session = Depends(get_db),
    student_user: User = Depends(get_current_user)
):
    """
    [STUDENT] Get fee profile for the logged-in student.
    Shows fee breakdown, payment history, and pending amount.
    """
    if student_user.role != Role.STUDENT.value:
        raise HTTPException(
            status_code=403,
            detail="Only students can access this endpoint"
        )

    if not student_user.student_id:
        raise HTTPException(
            status_code=400,
            detail="Your user account is not linked to a student record"
        )

    # Get academic year
    if academic_year_id:
        academic_year = db.get(AcademicYear, academic_year_id)
    else:
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    if not academic_year:
        raise HTTPException(status_code=400, detail="No academic year found")

    # Get student's enrollment
    from app.models.enrollment import Enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_user.student_id,
        Enrollment.academic_year_id == academic_year.id,
        Enrollment.status == "ACTIVE"
    ).first()

    if not enrollment:
        return {
            "student_id": student_user.student_id,
            "academic_year": academic_year.year,
            "message": "Not enrolled for this academic year",
            "fee_profile": None
        }

    # Get fee profile
    fee_profile = db.query(StudentFeeProfile).join(FeeStructure).filter(
        StudentFeeProfile.student_id == student_user.student_id,
        FeeStructure.academic_year_id == academic_year.id
    ).options(
        joinedload(StudentFeeProfile.fee_structure),
        joinedload(StudentFeeProfile.payments)
    ).first()

    if not fee_profile:
        return {
            "student_id": student_user.student_id,
            "academic_year": academic_year.year,
            "class_name": enrollment.school_class.name,
            "message": "Fee profile not yet created. Contact administration.",
            "fee_profile": None
        }

    # Calculate amounts
    paid = calculate_total_paid(db, fee_profile.id)
    pending = fee_profile.total_yearly_fee - paid

    # Get payment history
    payments = [
        {
            "payment_id": p.id,
            "amount_paid": p.amount_paid,
            "payment_mode": p.payment_mode.value,
            "payment_frequency": p.payment_frequency.value,
            "paid_at": p.paid_at.isoformat(),
            "is_verified": p.is_verified,
            "receipt_number": p.receipt_number,
        }
        for p in fee_profile.payments
    ]

    fee_structure = fee_profile.fee_structure

    return {
        "student_id": student_user.student_id,
        "student_name": student_user.name,
        "academic_year": academic_year.year,
        "class_name": enrollment.school_class.name,
        "roll_number": enrollment.roll_number,
        "fee_breakdown": {
            "annual_charges": fee_structure.annual_charges,
            "monthly_fee": fee_structure.monthly_fee,
            "yearly_tuition": fee_structure.monthly_fee * 12,
            "transport_charges": fee_profile.transport_charges,
            "concession": fee_profile.concession_amount,
            "concession_reason": fee_profile.concession_reason,
        },
        "fee_summary": {
            "total_yearly_fee": fee_profile.total_yearly_fee,
            "paid": paid,
            "pending": pending,
            "payment_status": "PAID" if pending == 0 else "PENDING" if paid == 0 else "PARTIAL"
        },
        "payment_history": payments,
        "last_payment": max([p.paid_at for p in fee_profile.payments] or [None]),
    }


# ========================================
# PARENT FEE MANAGEMENT ENDPOINTS
# ========================================

@router.get("/parent/children-fees")
def get_parent_children_fees(
    academic_year_id: int = None,
    db: Session = Depends(get_db),
    parent: User = Depends(get_current_user)
):
    """
    [PARENT] Get fee profiles for all children linked to this parent.
    Shows combined fee summary and payment options.
    """
    if parent.role != Role.PARENT.value:
        raise HTTPException(
            status_code=403,
            detail="Only parents can access this endpoint"
        )

    if not parent.parent_id:
        raise HTTPException(
            status_code=400,
            detail="Your user account is not linked to a parent record"
        )

    # Get academic year
    if academic_year_id:
        academic_year = db.get(AcademicYear, academic_year_id)
    else:
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    if not academic_year:
        raise HTTPException(status_code=400, detail="No academic year found")

    # Get all children linked to this parent
    from app.models.student_parent import StudentParent
    children_links = db.query(StudentParent).filter(
        StudentParent.parent_id == parent.parent_id
    ).all()

    if not children_links:
        return {
            "parent_id": parent.parent_id,
            "academic_year": academic_year.name,
            "children": [],
            "combined_summary": {
                "total_students": 0,
                "total_expected": 0,
                "total_paid": 0,
                "total_pending": 0,
                "next_payment_due": None
            }
        }

    children_data = []
    total_expected = 0
    total_paid = 0
    total_pending = 0
    next_payment_due = None

    for link in children_links:
        student = link.student

        # Get student's enrollment and fee profile
        from app.models.enrollment import Enrollment
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == student.id,
            Enrollment.academic_year_id == academic_year.id,
            Enrollment.status == "ACTIVE"
        ).first()

        if not enrollment:
            continue  # Skip if not enrolled

        # Get fee profile
        fee_profile = db.query(StudentFeeProfile).join(FeeStructure).filter(
            StudentFeeProfile.student_id == student.id,
            FeeStructure.academic_year_id == academic_year.id
        ).options(
            joinedload(StudentFeeProfile.fee_structure),
            joinedload(StudentFeeProfile.payments)
        ).first()

        if not fee_profile:
            continue  # Skip if no fee profile

        # Calculate amounts
        paid = calculate_total_paid(db, fee_profile.id)
        pending = fee_profile.total_yearly_fee - paid

        total_expected += fee_profile.total_yearly_fee
        total_paid += paid
        total_pending += pending

        # Get next payment due (simplified - could be enhanced)
        if pending > 0 and (next_payment_due is None or enrollment.created_at < next_payment_due):
            next_payment_due = enrollment.created_at

        children_data.append({
            "student_id": student.id,
            "student_name": student.name,
            "class_name": enrollment.school_class.name,
            "roll_number": enrollment.roll_number,
            "fee_profile_id": fee_profile.id,
            "total_fee": fee_profile.total_yearly_fee,
            "paid": paid,
            "pending": pending,
            "transport_charges": fee_profile.transport_charges,
            "concession": fee_profile.concession_amount,
            "last_payment": max([p.paid_at for p in fee_profile.payments] or [None]),
            "payment_status": "PAID" if pending == 0 else "PENDING" if paid == 0 else "PARTIAL"
        })

    return {
        "parent_id": parent.parent_id,
        "academic_year": academic_year.name,
        "children": children_data,
        "combined_summary": {
            "total_students": len(children_data),
            "total_expected": total_expected,
            "total_paid": total_paid,
            "total_pending": total_pending,
            "collection_percentage": round((total_paid / total_expected * 100) if total_expected > 0 else 0, 2),
            "next_payment_due": next_payment_due.isoformat() if next_payment_due else None
        }
    }


@router.post("/parent/pay-multiple")
def parent_pay_multiple_students(
    student_fee_profile_ids: List[int],
    amount_per_student: float = None,
    total_amount: float = None,
    payment_frequency: str = "MONTHLY",
    db: Session = Depends(get_db),
    parent: User = Depends(get_current_user)
):
    """
    [PARENT] Make cumulative payment for multiple students.

    Can specify either amount_per_student or total_amount.
    Payment will be distributed across selected students.
    """
    if parent.role != Role.PARENT.value:
        raise HTTPException(
            status_code=403,
            detail="Only parents can access this endpoint"
        )

    if not parent.parent_id:
        raise HTTPException(
            status_code=400,
            detail="Your user account is not linked to a parent record"
        )

    if not student_fee_profile_ids:
        raise HTTPException(status_code=400, detail="No student fee profiles specified")

    if amount_per_student is None and total_amount is None:
        raise HTTPException(
            status_code=400,
            detail="Must specify either amount_per_student or total_amount"
        )

    if amount_per_student is not None and total_amount is not None:
        raise HTTPException(
            status_code=400,
            detail="Cannot specify both amount_per_student and total_amount"
        )

    # Validate payment frequency
    try:
        freq = PaymentFrequency[payment_frequency.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid payment frequency")

    # Verify all profiles belong to parent's children
    from app.models.student_parent import StudentParent
    valid_profiles = []
    total_pending = 0

    for profile_id in student_fee_profile_ids:
        fee_profile = db.get(StudentFeeProfile, profile_id)
        if not fee_profile:
            raise HTTPException(
                status_code=404,
                detail=f"Fee profile {profile_id} not found"
            )

        # Check if this student belongs to the parent
        link = db.query(StudentParent).filter(
            StudentParent.student_id == fee_profile.student_id,
            StudentParent.parent_id == parent.parent_id
        ).first()

        if not link:
            raise HTTPException(
                status_code=403,
                detail=f"Student {fee_profile.student_id} is not linked to your account"
            )

        # Calculate pending amount
        paid = calculate_total_paid(db, profile_id)
        pending = fee_profile.total_yearly_fee - paid

        if pending <= 0:
            continue  # Skip if no pending amount

        valid_profiles.append({
            "profile": fee_profile,
            "pending": pending
        })
        total_pending += pending

    if not valid_profiles:
        raise HTTPException(status_code=400, detail="No pending fees for selected students")

    # Calculate payment distribution
    if amount_per_student is not None:
        # Fixed amount per student
        total_payment = amount_per_student * len(valid_profiles)
        per_student_payment = amount_per_student
    else:
        # Distribute total amount proportionally
        total_payment = total_amount
        per_student_payment = total_amount / len(valid_profiles)

    # Validate total payment doesn't exceed pending
    if total_payment > total_pending:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount ({total_payment}) exceeds total pending ({total_pending})"
        )

    # Create payment records
    payments_created = []

    for item in valid_profiles:
        profile = item["profile"]
        pending = item["pending"]

        # Don't pay more than pending for this student
        student_payment = min(per_student_payment, pending)

        # Validate payment amount for this student
        is_valid, error_msg = validate_payment_amount(
            student_payment, freq, profile.total_yearly_fee
        )

        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid payment for student {profile.student_id}: {error_msg}")

        # Create payment record
        payment = FeePayment(
            student_fee_profile_id=profile.id,
            amount_paid=student_payment,
            payment_mode=PaymentMode.ONLINE,  # Assuming online payment for parents
            payment_frequency=freq,
            paid_at=datetime.utcnow(),
            is_verified=False,  # Will be verified by admin
            remarks=f"Parent bulk payment - {len(valid_profiles)} students"
        )

        db.add(payment)
        payments_created.append({
            "student_id": profile.student_id,
            "student_name": profile.student.name,
            "amount_paid": student_payment,
            "payment_id": None  # Will be set after commit
        })

    db.commit()

    # Update payment IDs
    for i, payment_data in enumerate(payments_created):
        # Get the created payment (this is a bit hacky, but works)
        payment = db.query(FeePayment).filter(
            FeePayment.student_fee_profile_id == valid_profiles[i]["profile"].id,
            FeePayment.amount_paid == payment_data["amount_paid"],
            FeePayment.remarks == f"Parent bulk payment - {len(valid_profiles)} students"
        ).order_by(FeePayment.id.desc()).first()

        if payment:
            payment_data["payment_id"] = payment.id

    return {
        "status": "bulk_payment_initiated",
        "parent_id": parent.parent_id,
        "total_amount": total_payment,
        "students_paid": len(payments_created),
        "payment_frequency": payment_frequency,
        "payments": payments_created,
        "message": f"Payment of ₹{total_payment} initiated for {len(payments_created)} students. Awaiting admin verification.",
        "next_steps": "Payments will be verified by school administration within 24 hours."
    }


@router.get("/parent/payment-history")
def get_parent_payment_history(
    academic_year_id: int = None,
    db: Session = Depends(get_db),
    parent: User = Depends(get_current_user)
):
    """
    [PARENT] Get complete payment history for all children.
    Shows all payments made across all students.
    """
    if parent.role != Role.PARENT.value:
        raise HTTPException(
            status_code=403,
            detail="Only parents can access this endpoint"
        )

    if not parent.parent_id:
        raise HTTPException(
            status_code=400,
            detail="Your user account is not linked to a parent record"
        )

    # Get academic year
    if academic_year_id:
        academic_year = db.get(AcademicYear, academic_year_id)
    else:
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    if not academic_year:
        raise HTTPException(status_code=400, detail="No academic year found")

    # Get all children
    from app.models.student_parent import StudentParent
    children_links = db.query(StudentParent).filter(
        StudentParent.parent_id == parent.parent_id
    ).all()

    student_ids = [link.student_id for link in children_links]

    # Get all payments for these students in the academic year
    payments = db.query(FeePayment).join(StudentFeeProfile).join(FeeStructure).filter(
        StudentFeeProfile.student_id.in_(student_ids),
        FeeStructure.academic_year_id == academic_year.id
    ).options(
        joinedload(FeePayment.fee_profile).joinedload(StudentFeeProfile.student),
        joinedload(FeePayment.fee_profile).joinedload(StudentFeeProfile.fee_structure)
    ).order_by(FeePayment.paid_at.desc()).all()

    # Group by student
    student_payments = {}
    total_paid = 0

    for payment in payments:
        student_id = payment.fee_profile.student_id
        student_name = payment.fee_profile.student.name

        if student_id not in student_payments:
            student_payments[student_id] = {
                "student_id": student_id,
                "student_name": student_name,
                "class_name": payment.fee_profile.fee_structure.school_class.name,
                "payments": [],
                "total_paid": 0
            }

        payment_data = {
            "payment_id": payment.id,
            "amount_paid": payment.amount_paid,
            "payment_mode": payment.payment_mode.value,
            "payment_frequency": payment.payment_frequency.value,
            "paid_at": payment.paid_at.isoformat(),
            "is_verified": payment.is_verified,
            "receipt_number": payment.receipt_number,
            "remarks": payment.remarks
        }

        student_payments[student_id]["payments"].append(payment_data)
        student_payments[student_id]["total_paid"] += payment.amount_paid
        total_paid += payment.amount_paid

    return {
        "parent_id": parent.parent_id,
        "academic_year": academic_year.name,
        "total_paid": total_paid,
        "students": list(student_payments.values()),
        "payment_count": len(payments)
    }


# ========================================
# ADMIN TRANSPORT MANAGEMENT ENDPOINTS
# ========================================

@router.get("/transport/class/{class_id}/year/{academic_year_id}")
def get_class_transport_status(
    class_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user)
):
    """
    [ADMIN] Get transport status for all students in a class.
    
    Returns list of students with their transport usage and charges.
    """
    if admin.role != Role.ADMIN.value:
        raise HTTPException(
            status_code=403,
            detail="Only admins can access this endpoint"
        )

    from app.models.school_class import SchoolClass
    from app.models.enrollment import Enrollment
    from app.models.people import Student

    # Verify class exists
    school_class = db.get(SchoolClass, class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    # Verify academic year exists
    academic_year = db.get(AcademicYear, academic_year_id)
    if not academic_year:
        raise HTTPException(status_code=404, detail="Academic year not found")

    # Get all active enrollments for this class and year
    enrollments = db.query(Enrollment).filter(
        Enrollment.class_id == class_id,
        Enrollment.academic_year_id == academic_year_id,
        Enrollment.status == "ACTIVE"
    ).options(
        joinedload(Enrollment.student)
    ).all()

    students_data = []
    total_students = 0
    using_transport = 0

    for enrollment in enrollments:
        student = enrollment.student
        total_students += 1

        # Get student's fee profile
        fee_profile = db.query(StudentFeeProfile).join(FeeStructure).filter(
            StudentFeeProfile.student_id == student.id,
            FeeStructure.academic_year_id == academic_year_id
        ).first()

        # Determine transport status
        uses_transport = False
        transport_charges = 0

        if fee_profile and fee_profile.transport_charges > 0:
            uses_transport = True
            transport_charges = fee_profile.transport_charges
            using_transport += 1

        students_data.append({
            "student_id": student.id,
            "student_name": student.name,
            "admission_number": enrollment.admission_number or "",
            "uses_transport": uses_transport,
            "transport_charges": transport_charges
        })

    return {
        "class_id": class_id,
        "class_name": school_class.name,
        "academic_year_id": academic_year_id,
        "academic_year_name": academic_year.name,
        "total_students": total_students,
        "using_transport": using_transport,
        "students": students_data
    }


@router.put("/transport/student/{student_id}")
def update_student_transport(
    student_id: int,
    transport_charges: int,
    academic_year_id: int = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user)
):
    """
    [ADMIN] Update transport charges for a single student.
    """
    if admin.role != Role.ADMIN.value:
        raise HTTPException(
            status_code=403,
            detail="Only admins can access this endpoint"
        )

    from app.models.people import Student

    # Verify student exists
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get academic year
    if academic_year_id:
        academic_year = db.get(AcademicYear, academic_year_id)
    else:
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    if not academic_year:
        raise HTTPException(status_code=400, detail="No academic year found")

    # Get or create fee profile
    fee_profile = db.query(StudentFeeProfile).join(FeeStructure).filter(
        StudentFeeProfile.student_id == student_id,
        FeeStructure.academic_year_id == academic_year.id
    ).first()

    if not fee_profile:
        raise HTTPException(
            status_code=404,
            detail=f"No fee profile found for student {student_id} in academic year {academic_year.name}"
        )

    # Update transport charges
    fee_profile.transport_charges = transport_charges
    
    # Recalculate total fee
    fee_structure = fee_profile.fee_structure
    fee_profile.total_yearly_fee = (
        fee_structure.annual_charges +
        (fee_structure.monthly_fee * 12) +
        fee_profile.transport_charges -
        fee_profile.concession_amount
    )

    db.commit()
    db.refresh(fee_profile)

    return {
        "status": "transport_updated",
        "student_id": student_id,
        "transport_charges": fee_profile.transport_charges,
        "total_yearly_fee": fee_profile.total_yearly_fee
    }


@router.put("/transport/bulk")
def bulk_update_transport(
    updates: List[dict],
    academic_year_id: int = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user)
):
    """
    [ADMIN] Bulk update transport charges for multiple students.
    
    Expected format:
    {
        "updates": [
            {
                "student_id": 1,
                "uses_transport": true,
                "transport_charges": 5000
            },
            ...
        ],
        "academic_year_id": 1  # optional
    }
    """
    if admin.role != Role.ADMIN.value:
        raise HTTPException(
            status_code=403,
            detail="Only admins can access this endpoint"
        )

    # Get academic year
    if academic_year_id:
        academic_year = db.get(AcademicYear, academic_year_id)
    else:
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    if not academic_year:
        raise HTTPException(status_code=400, detail="No academic year found")

    updated_count = 0
    errors = []

    for update in updates:
        student_id = update.get("student_id")
        uses_transport = update.get("uses_transport", False)
        transport_charges = update.get("transport_charges", 0)

        if not student_id:
            errors.append({"student_id": None, "error": "Missing student_id"})
            continue

        try:
            # Get fee profile
            fee_profile = db.query(StudentFeeProfile).join(FeeStructure).filter(
                StudentFeeProfile.student_id == student_id,
                FeeStructure.academic_year_id == academic_year.id
            ).first()

            if not fee_profile:
                errors.append({
                    "student_id": student_id,
                    "error": f"No fee profile found for academic year {academic_year.name}"
                })
                continue

            # Update transport charges (set to 0 if not using transport)
            fee_profile.transport_charges = transport_charges if uses_transport else 0

            # Recalculate total fee
            fee_structure = fee_profile.fee_structure
            fee_profile.total_yearly_fee = (
                fee_structure.annual_charges +
                (fee_structure.monthly_fee * 12) +
                fee_profile.transport_charges -
                fee_profile.concession_amount
            )

            updated_count += 1

        except Exception as e:
            errors.append({
                "student_id": student_id,
                "error": str(e)
            })

    db.commit()

    return {
        "status": "bulk_update_completed",
        "academic_year": academic_year.name,
        "updated_count": updated_count,
        "total_requested": len(updates),
        "errors": errors if errors else None
    }


# ========================================
# ADMIN FEE STRUCTURE MANAGEMENT
# ========================================

from pydantic import BaseModel
from typing import List as TypeList, Optional as OptionalType
from datetime import datetime as dt


class FeeStructureCreate(BaseModel):
    class_id: int
    academic_year_id: int
    annual_charges: int
    monthly_fee: int


class FeeStructureUpdate(BaseModel):
    annual_charges: OptionalType[int] = None
    monthly_fee: OptionalType[int] = None


class StudentFeeProfileCreate(BaseModel):
    student_id: int
    fee_structure_id: int
    transport_charges: OptionalType[int] = 0
    concession_amount: OptionalType[int] = 0
    concession_reason: OptionalType[str] = None


class StudentFeeProfileUpdate(BaseModel):
    transport_charges: OptionalType[int] = None
    transport_locked: OptionalType[bool] = None
    concession_amount: OptionalType[int] = None
    concession_reason: OptionalType[str] = None
    is_locked: OptionalType[bool] = None


class BulkFeeProfileCreate(BaseModel):
    fee_structure_id: int
    student_ids: TypeList[int]
    default_transport_charges: OptionalType[int] = 0
    default_concession: OptionalType[int] = 0


class CashPaymentRecord(BaseModel):
    student_fee_profile_id: int
    amount_paid: int
    payment_frequency: str
    receipt_number: OptionalType[str] = None
    paid_at: OptionalType[str] = None
    remarks: OptionalType[str] = None


class PaymentVerify(BaseModel):
    is_verified: bool
    remarks: OptionalType[str] = None


@router.post("/structure")
def create_fee_structure(
    payload: FeeStructureCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user)
):
    """
    [ADMIN] Create a fee structure for a class and academic year.
    """
    if admin.role != Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only admins can create fee structures")

    from app.models.school_class import SchoolClass

    # Verify class exists
    school_class = db.get(SchoolClass, payload.class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    # Verify academic year exists
    academic_year = db.get(AcademicYear, payload.academic_year_id)
    if not academic_year:
        raise HTTPException(status_code=404, detail="Academic year not found")

    # Check if fee structure already exists
    existing = db.query(FeeStructure).filter(
        FeeStructure.class_id == payload.class_id,
        FeeStructure.academic_year_id == payload.academic_year_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Fee structure already exists for this class and academic year"
        )

    fee_structure = FeeStructure(
        class_id=payload.class_id,
        academic_year_id=payload.academic_year_id,
        annual_charges=payload.annual_charges,
        monthly_fee=payload.monthly_fee,
    )
    db.add(fee_structure)
    db.commit()
    db.refresh(fee_structure)

    return {
        "status": "fee_structure_created",
        "id": fee_structure.id,
        "class_id": fee_structure.class_id,
        "academic_year_id": fee_structure.academic_year_id,
        "annual_charges": fee_structure.annual_charges,
        "monthly_fee": fee_structure.monthly_fee,
        "yearly_tuition": fee_structure.monthly_fee * 12,
    }


@router.get("/structure/{structure_id}")
def get_fee_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get a fee structure by ID.
    """
    fee_structure = db.get(FeeStructure, structure_id)
    if not fee_structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    return {
        "id": fee_structure.id,
        "class_id": fee_structure.class_id,
        "class_name": fee_structure.school_class.name,
        "academic_year_id": fee_structure.academic_year_id,
        "academic_year_name": fee_structure.academic_year.year,
        "annual_charges": fee_structure.annual_charges,
        "monthly_fee": fee_structure.monthly_fee,
        "yearly_tuition": fee_structure.monthly_fee * 12,
        "created_at": fee_structure.created_at.isoformat(),
    }


@router.get("/structure/class/{class_id}/year/{academic_year_id}")
def get_fee_structure_by_class_year(
    class_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get fee structure for a specific class and academic year.
    """
    fee_structure = db.query(FeeStructure).filter(
        FeeStructure.class_id == class_id,
        FeeStructure.academic_year_id == academic_year_id
    ).first()

    if not fee_structure:
        raise HTTPException(status_code=404, detail="Fee structure not found for this class and year")

    return {
        "id": fee_structure.id,
        "class_id": fee_structure.class_id,
        "class_name": fee_structure.school_class.name,
        "academic_year_id": fee_structure.academic_year_id,
        "academic_year_name": fee_structure.academic_year.year,
        "annual_charges": fee_structure.annual_charges,
        "monthly_fee": fee_structure.monthly_fee,
        "yearly_tuition": fee_structure.monthly_fee * 12,
        "created_at": fee_structure.created_at.isoformat(),
    }


@router.put("/structure/{structure_id}")
def update_fee_structure(
    structure_id: int,
    payload: FeeStructureUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user)
):
    """
    [ADMIN] Update a fee structure.
    """
    if admin.role != Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only admins can update fee structures")

    fee_structure = db.get(FeeStructure, structure_id)
    if not fee_structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    if payload.annual_charges is not None:
        fee_structure.annual_charges = payload.annual_charges
    if payload.monthly_fee is not None:
        fee_structure.monthly_fee = payload.monthly_fee

    # Update all student profiles that use this structure
    for profile in fee_structure.student_fee_profiles:
        profile.total_yearly_fee = (
            fee_structure.annual_charges +
            (fee_structure.monthly_fee * 12) +
            profile.transport_charges -
            profile.concession_amount
        )

    db.commit()
    db.refresh(fee_structure)

    return {
        "status": "fee_structure_updated",
        "id": fee_structure.id,
        "annual_charges": fee_structure.annual_charges,
        "monthly_fee": fee_structure.monthly_fee,
        "yearly_tuition": fee_structure.monthly_fee * 12,
        "profiles_updated": len(fee_structure.student_fee_profiles),
    }


@router.post("/profile")
def create_student_fee_profile(
    payload: StudentFeeProfileCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user)
):
    """
    [ADMIN] Create a fee profile for a student.
    """
    if admin.role != Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only admins can create fee profiles")

    from app.models.people import Student

    # Verify student exists
    student = db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Verify fee structure exists
    fee_structure = db.get(FeeStructure, payload.fee_structure_id)
    if not fee_structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    # Check if profile already exists
    existing = db.query(StudentFeeProfile).filter(
        StudentFeeProfile.student_id == payload.student_id,
        StudentFeeProfile.fee_structure_id == payload.fee_structure_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Fee profile already exists for this student")

    # Calculate total fee
    total_yearly_fee = (
        fee_structure.annual_charges +
        (fee_structure.monthly_fee * 12) +
        payload.transport_charges -
        payload.concession_amount
    )

    profile = StudentFeeProfile(
        student_id=payload.student_id,
        fee_structure_id=payload.fee_structure_id,
        transport_charges=payload.transport_charges,
        concession_amount=payload.concession_amount,
        concession_reason=payload.concession_reason,
        total_yearly_fee=total_yearly_fee,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return {
        "status": "fee_profile_created",
        "id": profile.id,
        "student_id": profile.student_id,
        "student_name": student.name,
        "total_yearly_fee": profile.total_yearly_fee,
    }


@router.post("/profile/bulk")
def bulk_create_fee_profiles(
    payload: BulkFeeProfileCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user)
):
    """
    [ADMIN] Create fee profiles for multiple students at once.
    """
    if admin.role != Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only admins can create fee profiles")

    # Verify fee structure exists
    fee_structure = db.get(FeeStructure, payload.fee_structure_id)
    if not fee_structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    created_count = 0
    skipped_count = 0
    errors = []

    for student_id in payload.student_ids:
        try:
            # Check if profile already exists
            existing = db.query(StudentFeeProfile).filter(
                StudentFeeProfile.student_id == student_id,
                StudentFeeProfile.fee_structure_id == payload.fee_structure_id
            ).first()

            if existing:
                skipped_count += 1
                continue

            # Calculate total fee
            total_yearly_fee = (
                fee_structure.annual_charges +
                (fee_structure.monthly_fee * 12) +
                payload.default_transport_charges -
                payload.default_concession
            )

            profile = StudentFeeProfile(
                student_id=student_id,
                fee_structure_id=payload.fee_structure_id,
                transport_charges=payload.default_transport_charges,
                concession_amount=payload.default_concession,
                total_yearly_fee=total_yearly_fee,
            )
            db.add(profile)
            created_count += 1

        except Exception as e:
            errors.append({"student_id": student_id, "error": str(e)})

    db.commit()

    return {
        "status": "bulk_create_completed",
        "created": created_count,
        "skipped": skipped_count,
        "errors": errors if errors else None,
    }


@router.get("/profile/student/{student_id}/year/{academic_year_id}")
def get_student_fee_profile(
    student_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get a student's fee profile for a specific academic year.
    """
    profile = db.query(StudentFeeProfile).join(FeeStructure).filter(
        StudentFeeProfile.student_id == student_id,
        FeeStructure.academic_year_id == academic_year_id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Fee profile not found")

    paid = calculate_total_paid(db, profile.id)
    pending = profile.total_yearly_fee - paid

    return {
        "id": profile.id,
        "student_id": profile.student_id,
        "student_name": profile.student.name,
        "fee_structure_id": profile.fee_structure_id,
        "class_name": profile.fee_structure.school_class.name,
        "academic_year": profile.fee_structure.academic_year.year,
        "fee_breakdown": {
            "annual_charges": profile.fee_structure.annual_charges,
            "monthly_fee": profile.fee_structure.monthly_fee,
            "yearly_tuition": profile.fee_structure.monthly_fee * 12,
            "transport_charges": profile.transport_charges,
            "scholarship_amount": profile.concession_amount,
            "scholarship_reason": profile.concession_reason,
        },
        "total_yearly_fee": profile.total_yearly_fee,
        "paid": paid,
        "pending": pending,
        "payment_status": "PAID" if pending == 0 else "PENDING" if paid == 0 else "PARTIAL",
        "is_locked": profile.is_locked,
    }


@router.put("/profile/{profile_id}")
def update_student_fee_profile(
    profile_id: int,
    payload: StudentFeeProfileUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user)
):
    """
    [ADMIN] Update a student's fee profile (transport, scholarship, etc.).
    """
    if admin.role != Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only admins can update fee profiles")

    profile = db.get(StudentFeeProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Fee profile not found")

    if profile.is_locked and admin.role != Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="This fee profile is locked")

    if payload.transport_charges is not None:
        profile.transport_charges = payload.transport_charges
    if payload.transport_locked is not None:
        profile.transport_locked = payload.transport_locked
    if payload.concession_amount is not None:
        profile.concession_amount = payload.concession_amount
    if payload.concession_reason is not None:
        profile.concession_reason = payload.concession_reason
    if payload.is_locked is not None:
        profile.is_locked = payload.is_locked

    # Recalculate total
    fee_structure = profile.fee_structure
    profile.total_yearly_fee = (
        fee_structure.annual_charges +
        (fee_structure.monthly_fee * 12) +
        profile.transport_charges -
        profile.concession_amount
    )

    db.commit()
    db.refresh(profile)

    return {
        "status": "fee_profile_updated",
        "id": profile.id,
        "student_id": profile.student_id,
        "transport_charges": profile.transport_charges,
        "scholarship_amount": profile.concession_amount,
        "scholarship_reason": profile.concession_reason,
        "total_yearly_fee": profile.total_yearly_fee,
    }


@router.post("/payment/cash")
def record_cash_payment(
    payload: CashPaymentRecord,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user)
):
    """
    [ADMIN] Record a cash payment for a student.
    """
    if admin.role != Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only admins can record cash payments")

    profile = db.get(StudentFeeProfile, payload.student_fee_profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Fee profile not found")

    # Validate frequency
    try:
        freq = PaymentFrequency[payload.payment_frequency.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid payment frequency")

    # Validate payment amount
    is_valid, error_msg = validate_payment_amount(
        payload.amount_paid, freq, profile.total_yearly_fee
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    payment = FeePayment(
        student_fee_profile_id=payload.student_fee_profile_id,
        amount_paid=payload.amount_paid,
        payment_mode=PaymentMode.CASH,
        payment_frequency=freq,
        receipt_number=payload.receipt_number,
        marked_by_admin_id=admin.id,
        paid_at=dt.fromisoformat(payload.paid_at) if payload.paid_at else dt.utcnow(),
        is_verified=True,
        verified_by_admin_id=admin.id,
        verified_at=dt.utcnow(),
        remarks=payload.remarks,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "status": "payment_recorded",
        "payment_id": payment.id,
        "student_id": profile.student_id,
        "amount_paid": payment.amount_paid,
        "receipt_number": payment.receipt_number,
    }


@router.get("/payment/history/{profile_id}")
def get_payment_history(
    profile_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get payment history for a fee profile.
    """
    profile = db.get(StudentFeeProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Fee profile not found")

    payments = db.query(FeePayment).filter(
        FeePayment.student_fee_profile_id == profile_id
    ).order_by(FeePayment.paid_at.desc()).all()

    return {
        "profile_id": profile_id,
        "student_id": profile.student_id,
        "student_name": profile.student.name,
        "payments": [
            {
                "id": p.id,
                "amount_paid": p.amount_paid,
                "payment_mode": p.payment_mode.value,
                "payment_frequency": p.payment_frequency.value,
                "receipt_number": p.receipt_number,
                "paid_at": p.paid_at.isoformat(),
                "is_verified": p.is_verified,
                "remarks": p.remarks,
            }
            for p in payments
        ],
        "total_paid": sum(p.amount_paid for p in payments if p.is_verified),
    }


@router.put("/payment/{payment_id}/verify")
def verify_payment(
    payment_id: int,
    payload: PaymentVerify,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_user)
):
    """
    [ADMIN] Verify or unverify a payment.
    """
    if admin.role != Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only admins can verify payments")

    payment = db.get(FeePayment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.is_verified = payload.is_verified
    if payload.is_verified:
        payment.verified_by_admin_id = admin.id
        payment.verified_at = dt.utcnow()
    else:
        payment.verified_by_admin_id = None
        payment.verified_at = None

    if payload.remarks:
        payment.remarks = payload.remarks

    db.commit()

    return {
        "status": "payment_verification_updated",
        "payment_id": payment.id,
        "is_verified": payment.is_verified,
    }


@router.get("/summary/class/{class_id}/year/{academic_year_id}")
def get_class_fee_summary(
    class_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get fee summary for a class - total expected, collected, pending.
    """
    from app.models.school_class import SchoolClass
    from app.models.enrollment import Enrollment

    # Verify class and year
    school_class = db.get(SchoolClass, class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    academic_year = db.get(AcademicYear, academic_year_id)
    if not academic_year:
        raise HTTPException(status_code=404, detail="Academic year not found")

    # Get fee structure
    fee_structure = db.query(FeeStructure).filter(
        FeeStructure.class_id == class_id,
        FeeStructure.academic_year_id == academic_year_id
    ).first()

    if not fee_structure:
        return {
            "class_id": class_id,
            "class_name": school_class.name,
            "academic_year": academic_year.year,
            "class_summary": {
                "total_students": 0,
                "total_expected": 0,
                "total_collected": 0,
                "total_pending": 0,
                "collection_percentage": 0,
            },
            "students": [],
        }

    # Get all student fee profiles for this class
    profiles = db.query(StudentFeeProfile).filter(
        StudentFeeProfile.fee_structure_id == fee_structure.id
    ).all()

    students_data = []
    total_expected = 0
    total_collected = 0

    for profile in profiles:
        paid = calculate_total_paid(db, profile.id)
        pending = profile.total_yearly_fee - paid

        total_expected += profile.total_yearly_fee
        total_collected += paid

        students_data.append({
            "student_id": profile.student_id,
            "student_name": profile.student.name,
            "fee_profile_id": profile.id,
            "total_fee": profile.total_yearly_fee,
            "paid": paid,
            "pending": pending,
            "scholarship": profile.concession_amount,
            "status": "PAID" if pending <= 0 else "PENDING" if paid == 0 else "PARTIAL",
        })

    total_pending = total_expected - total_collected
    collection_percentage = (total_collected / total_expected * 100) if total_expected > 0 else 0

    return {
        "class_id": class_id,
        "class_name": school_class.name,
        "academic_year": academic_year.year,
        "fee_structure": {
            "id": fee_structure.id,
            "annual_charges": fee_structure.annual_charges,
            "monthly_fee": fee_structure.monthly_fee,
        },
        "class_summary": {
            "total_students": len(profiles),
            "total_expected": total_expected,
            "total_collected": total_collected,
            "total_pending": total_pending,
            "collection_percentage": round(collection_percentage, 2),
        },
        "students": students_data,
    }
