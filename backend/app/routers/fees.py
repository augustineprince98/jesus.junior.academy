from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime
from typing import List
import io

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.fees import (
    FeeStructure,
    StudentFeeProfile,
    FeePayment,
    PaymentMode,
    PaymentFrequency,
)
from app.models.people import Student
from app.models.school_class import SchoolClass
from app.models.academic_year import AcademicYear
from app.schemas.fees import (
    FeeStructureCreate,
    FeeStructureUpdate,
    FeeStructureResponse,
    StudentFeeProfileCreate,
    StudentFeeProfileUpdate,
    StudentFeeProfileResponse,
    FeePaymentCreate,
    CashPaymentCreate,
    FeePaymentResponse,
    PaymentVerification,
    PaymentSchedule,
    InitiatePaymentRequest,
    InitiatePaymentResponse,
    FeeReportFilter,
    BulkFeeAssignment,
)
from app.services.fee_service import (
    calculate_student_yearly_fee,
    calculate_installment_amount,
    get_payment_schedule,
    calculate_total_paid,
    calculate_pending_amount,
    get_fee_summary,
    validate_payment_amount,
)

router = APIRouter(prefix="/fees", tags=["Fees Management"])


# ========================================
# FEE STRUCTURE ENDPOINTS (ADMIN ONLY)
# ========================================

@router.post("/structure", response_model=FeeStructureResponse, status_code=status.HTTP_201_CREATED)
def create_fee_structure(
    payload: FeeStructureCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN))
):
    """
    [ADMIN] Create fee structure for a class and academic year.
    Defines annual_charges and monthly_fee for all students in the class.
    """
    # Check if already exists
    existing = db.query(FeeStructure).filter(
        FeeStructure.class_id == payload.class_id,
        FeeStructure.academic_year_id == payload.academic_year_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Fee structure already exists for this class and academic year"
        )

    # Verify class exists
    school_class = db.get(SchoolClass, payload.class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    # Verify academic year exists
    academic_year = db.get(AcademicYear, payload.academic_year_id)
    if not academic_year:
        raise HTTPException(status_code=404, detail="Academic year not found")

    fee_structure = FeeStructure(
        class_id=payload.class_id,
        academic_year_id=payload.academic_year_id,
        annual_charges=payload.annual_charges,
        monthly_fee=payload.monthly_fee,
    )

    db.add(fee_structure)
    db.commit()
    db.refresh(fee_structure)

    # Add calculated field
    response = FeeStructureResponse.from_orm(fee_structure)
    response.yearly_tuition = fee_structure.monthly_fee * 12

    return response


@router.get("/structure/{structure_id}", response_model=FeeStructureResponse)
def get_fee_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get fee structure by ID"""
    fee_structure = db.get(FeeStructure, structure_id)
    if not fee_structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    response = FeeStructureResponse.from_orm(fee_structure)
    response.yearly_tuition = fee_structure.monthly_fee * 12
    return response


@router.get("/structure/class/{class_id}/year/{academic_year_id}", response_model=FeeStructureResponse)
def get_fee_structure_by_class_year(
    class_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get fee structure for a specific class and academic year"""
    fee_structure = db.query(FeeStructure).filter(
        FeeStructure.class_id == class_id,
        FeeStructure.academic_year_id == academic_year_id
    ).first()

    if not fee_structure:
        raise HTTPException(
            status_code=404,
            detail="Fee structure not found for this class and academic year"
        )

    response = FeeStructureResponse.from_orm(fee_structure)
    response.yearly_tuition = fee_structure.monthly_fee * 12
    return response


@router.put("/structure/{structure_id}", response_model=FeeStructureResponse)
def update_fee_structure(
    structure_id: int,
    payload: FeeStructureUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN))
):
    """[ADMIN] Update fee structure"""
    fee_structure = db.get(FeeStructure, structure_id)
    if not fee_structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    # Update fields
    if payload.annual_charges is not None:
        fee_structure.annual_charges = payload.annual_charges
    if payload.monthly_fee is not None:
        fee_structure.monthly_fee = payload.monthly_fee

    fee_structure.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(fee_structure)

    response = FeeStructureResponse.from_orm(fee_structure)
    response.yearly_tuition = fee_structure.monthly_fee * 12
    return response


# ========================================
# STUDENT FEE PROFILE ENDPOINTS
# ========================================

@router.post("/profile", response_model=StudentFeeProfileResponse, status_code=status.HTTP_201_CREATED)
def create_student_fee_profile(
    payload: StudentFeeProfileCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN))
):
    """
    [ADMIN] Create fee profile for a student.
    Sets transport charges and concession for individual student.
    """
    # Check if already exists
    existing = db.query(StudentFeeProfile).filter(
        StudentFeeProfile.student_id == payload.student_id,
        StudentFeeProfile.fee_structure_id == payload.fee_structure_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Fee profile already exists for this student and fee structure"
        )

    # Verify student exists
    student = db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Verify fee structure exists
    fee_structure = db.get(FeeStructure, payload.fee_structure_id)
    if not fee_structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    # Calculate total yearly fee
    total_yearly_fee = calculate_student_yearly_fee(
        fee_structure,
        payload.transport_charges,
        payload.concession_amount
    )

    fee_profile = StudentFeeProfile(
        student_id=payload.student_id,
        fee_structure_id=payload.fee_structure_id,
        transport_charges=payload.transport_charges,
        concession_amount=payload.concession_amount,
        concession_reason=payload.concession_reason,
        total_yearly_fee=total_yearly_fee,
    )

    db.add(fee_profile)
    db.commit()
    db.refresh(fee_profile)

    return StudentFeeProfileResponse.from_orm(fee_profile)


@router.post("/profile/bulk", status_code=status.HTTP_201_CREATED)
def bulk_create_fee_profiles(
    payload: BulkFeeAssignment,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN))
):
    """
    [ADMIN] Bulk assign fee profiles to multiple students.
    Useful for enrolling entire class at once.
    """
    fee_structure = db.get(FeeStructure, payload.fee_structure_id)
    if not fee_structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    created_count = 0
    skipped_count = 0

    for student_id in payload.student_ids:
        # Check if already exists
        existing = db.query(StudentFeeProfile).filter(
            StudentFeeProfile.student_id == student_id,
            StudentFeeProfile.fee_structure_id == payload.fee_structure_id
        ).first()

        if existing:
            skipped_count += 1
            continue

        # Verify student exists
        student = db.get(Student, student_id)
        if not student:
            skipped_count += 1
            continue

        # Calculate total
        total_yearly_fee = calculate_student_yearly_fee(
            fee_structure,
            payload.default_transport_charges,
            payload.default_concession
        )

        fee_profile = StudentFeeProfile(
            student_id=student_id,
            fee_structure_id=payload.fee_structure_id,
            transport_charges=payload.default_transport_charges,
            concession_amount=payload.default_concession,
            total_yearly_fee=total_yearly_fee,
        )

        db.add(fee_profile)
        created_count += 1

    db.commit()

    return {
        "message": "Bulk fee profile assignment completed",
        "created": created_count,
        "skipped": skipped_count,
        "total": len(payload.student_ids)
    }


@router.get("/profile/student/{student_id}/year/{academic_year_id}")
def get_student_fee_profile_by_year(
    student_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get student's fee profile for a specific academic year.
    Parents can only see their own children's fees.
    """
    # Get fee profile with all related data
    fee_profile = db.query(StudentFeeProfile).join(
        FeeStructure
    ).filter(
        StudentFeeProfile.student_id == student_id,
        FeeStructure.academic_year_id == academic_year_id
    ).options(
        joinedload(StudentFeeProfile.fee_structure),
        joinedload(StudentFeeProfile.student),
        joinedload(StudentFeeProfile.payments)
    ).first()

    if not fee_profile:
        raise HTTPException(
            status_code=404,
            detail="Fee profile not found for this student and academic year"
        )

    # Authorization check (parents can only see their children)
    if user.role == Role.PARENT.value:
        # TODO: Check if student belongs to this parent
        pass

    # Get comprehensive fee summary
    summary = get_fee_summary(db, fee_profile)

    return {
        "profile": StudentFeeProfileResponse.from_orm(fee_profile),
        "summary": summary,
        "payments": [FeePaymentResponse.from_orm(p) for p in fee_profile.payments]
    }


@router.put("/profile/{profile_id}", response_model=StudentFeeProfileResponse)
def update_student_fee_profile(
    profile_id: int,
    payload: StudentFeeProfileUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN))
):
    """[ADMIN] Update student fee profile"""
    fee_profile = db.get(StudentFeeProfile, profile_id)
    if not fee_profile:
        raise HTTPException(status_code=404, detail="Fee profile not found")

    if fee_profile.is_locked:
        raise HTTPException(
            status_code=400,
            detail="Cannot update locked fee profile"
        )

    # Update transport charges
    if payload.transport_charges is not None:
        if fee_profile.transport_locked:
            raise HTTPException(
                status_code=400,
                detail="Transport charges are locked"
            )
        fee_profile.transport_charges = payload.transport_charges

    if payload.transport_locked is not None:
        fee_profile.transport_locked = payload.transport_locked

    # Update concession
    if payload.concession_amount is not None:
        fee_profile.concession_amount = payload.concession_amount
    if payload.concession_reason is not None:
        fee_profile.concession_reason = payload.concession_reason

    if payload.is_locked is not None:
        fee_profile.is_locked = payload.is_locked

    # Recalculate total yearly fee
    fee_profile.total_yearly_fee = calculate_student_yearly_fee(
        fee_profile.fee_structure,
        fee_profile.transport_charges,
        fee_profile.concession_amount
    )

    fee_profile.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(fee_profile)

    return StudentFeeProfileResponse.from_orm(fee_profile)


# ========================================
# PAYMENT ENDPOINTS
# ========================================

@router.post("/payment/cash", response_model=FeePaymentResponse, status_code=status.HTTP_201_CREATED)
def record_cash_payment(
    payload: CashPaymentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN))
):
    """
    [ADMIN] Record cash payment made by parent.
    Admin manually enters payment details.
    """
    fee_profile = db.get(StudentFeeProfile, payload.student_fee_profile_id)
    if not fee_profile:
        raise HTTPException(status_code=404, detail="Fee profile not found")

    # Validate payment amount
    is_valid, error_msg = validate_payment_amount(
        payload.amount_paid,
        PaymentFrequency[payload.payment_frequency],
        fee_profile.total_yearly_fee
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # Create payment record
    payment = FeePayment(
        student_fee_profile_id=payload.student_fee_profile_id,
        amount_paid=payload.amount_paid,
        payment_mode=PaymentMode.CASH,
        payment_frequency=PaymentFrequency[payload.payment_frequency],
        receipt_number=payload.receipt_number,
        marked_by_admin_id=admin.id,
        paid_at=payload.paid_at or datetime.utcnow(),
        is_verified=True,  # Cash payments are auto-verified
        verified_by_admin_id=admin.id,
        verified_at=datetime.utcnow(),
        remarks=payload.remarks,
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return FeePaymentResponse.from_orm(payment)


@router.get("/payment/schedule/{profile_id}")
def get_payment_schedule(
    profile_id: int,
    frequency: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get payment schedule for a student based on chosen frequency.
    Shows how much to pay per installment.
    """
    fee_profile = db.get(StudentFeeProfile, profile_id)
    if not fee_profile:
        raise HTTPException(status_code=404, detail="Fee profile not found")

    try:
        payment_frequency = PaymentFrequency[frequency.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail="Invalid frequency. Use: MONTHLY, QUARTERLY, HALF_YEARLY, or YEARLY"
        )

    schedule = get_payment_schedule(fee_profile.total_yearly_fee, payment_frequency)

    return schedule


@router.get("/payment/history/{profile_id}", response_model=List[FeePaymentResponse])
def get_payment_history(
    profile_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get all payments for a student fee profile"""
    fee_profile = db.get(StudentFeeProfile, profile_id)
    if not fee_profile:
        raise HTTPException(status_code=404, detail="Fee profile not found")

    # Authorization check for parents
    if user.role == Role.PARENT.value:
        # TODO: Check if student belongs to this parent
        pass

    payments = db.query(FeePayment).filter(
        FeePayment.student_fee_profile_id == profile_id
    ).order_by(FeePayment.paid_at.desc()).all()

    return [FeePaymentResponse.from_orm(p) for p in payments]


@router.put("/payment/{payment_id}/verify", response_model=FeePaymentResponse)
def verify_payment(
    payment_id: int,
    payload: PaymentVerification,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN))
):
    """[ADMIN] Verify or reject an online payment"""
    payment = db.get(FeePayment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.is_verified = payload.is_verified
    payment.verified_by_admin_id = admin.id
    payment.verified_at = datetime.utcnow()

    if payload.remarks:
        payment.remarks = payload.remarks

    db.commit()
    db.refresh(payment)

    return FeePaymentResponse.from_orm(payment)


# ========================================
# PAYMENT GATEWAY ENDPOINTS
# ========================================

@router.post("/payment/initiate", response_model=InitiatePaymentResponse)
def initiate_online_payment(
    payload: InitiatePaymentRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Initiate online payment via ICICI Bank payment gateway.
    Returns payment URL and QR code for UPI payment.
    """
    fee_profile = db.get(StudentFeeProfile, payload.student_fee_profile_id)
    if not fee_profile:
        raise HTTPException(status_code=404, detail="Fee profile not found")

    # Validate amount
    try:
        payment_frequency = PaymentFrequency[payload.payment_frequency.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid payment frequency")

    is_valid, error_msg = validate_payment_amount(
        payload.amount,
        payment_frequency,
        fee_profile.total_yearly_fee
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # TODO: Integrate with ICICI Bank payment gateway
    # This is a placeholder implementation
    import uuid
    transaction_id = f"TXN{uuid.uuid4().hex[:12].upper()}"

    # Create pending payment record
    payment = FeePayment(
        student_fee_profile_id=payload.student_fee_profile_id,
        amount_paid=payload.amount,
        payment_mode=PaymentMode.ONLINE,
        payment_frequency=payment_frequency,
        transaction_id=transaction_id,
        is_verified=False,
        remarks="Payment initiated, pending verification"
    )

    db.add(payment)
    db.commit()

    # Return payment gateway details
    return InitiatePaymentResponse(
        transaction_id=transaction_id,
        payment_url=f"https://payment.icicibank.com/pay/{transaction_id}",
        qr_code_url=f"https://payment.icicibank.com/qr/{transaction_id}",
        upi_id="schoolname@icici",  # Your school's UPI ID
        amount=payload.amount,
        expires_at=datetime.utcnow().replace(hour=23, minute=59, second=59)
    )


# ========================================
# REPORTS & EXPORT ENDPOINTS
# ========================================

@router.post("/reports/export/excel")
def export_fee_report_excel(
    filters: FeeReportFilter,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN))
):
    """
    [ADMIN] Export fee report to Excel.
    Includes all student fee profiles and payment history.
    """
    try:
        import pandas as pd
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Excel export requires pandas and openpyxl. Install with: pip install pandas openpyxl"
        )

    # Build query
    query = db.query(StudentFeeProfile).join(FeeStructure)

    if filters.academic_year_id:
        query = query.filter(FeeStructure.academic_year_id == filters.academic_year_id)
    if filters.class_id:
        query = query.filter(FeeStructure.class_id == filters.class_id)

    fee_profiles = query.all()

    # Prepare data
    data = []
    for profile in fee_profiles:
        total_paid = calculate_total_paid(db, profile.id)
        pending = profile.total_yearly_fee - total_paid

        data.append({
            "Student ID": profile.student_id,
            "Student Name": profile.student.name,
            "Class": profile.fee_structure.school_class.name,
            "Academic Year": profile.fee_structure.academic_year.name,
            "Annual Charges": profile.fee_structure.annual_charges,
            "Monthly Fee": profile.fee_structure.monthly_fee,
            "Yearly Tuition": profile.fee_structure.monthly_fee * 12,
            "Transport Charges": profile.transport_charges,
            "Concession": profile.concession_amount,
            "Total Yearly Fee": profile.total_yearly_fee,
            "Total Paid": total_paid,
            "Pending Amount": pending,
            "Payment Status": "PAID" if pending == 0 else "PENDING" if total_paid == 0 else "PARTIAL"
        })

    # Create Excel file
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Fee Report')
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=fee_report_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )


@router.get("/summary/class/{class_id}/year/{academic_year_id}")
def get_class_fee_summary(
    class_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN))
):
    """
    [ADMIN] Get fee collection summary for entire class.
    Shows total collected, pending, and student-wise breakdown.
    """
    # Get fee structure
    fee_structure = db.query(FeeStructure).filter(
        FeeStructure.class_id == class_id,
        FeeStructure.academic_year_id == academic_year_id
    ).first()

    if not fee_structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    # Get all student profiles
    profiles = db.query(StudentFeeProfile).filter(
        StudentFeeProfile.fee_structure_id == fee_structure.id
    ).all()

    total_expected = 0
    total_collected = 0
    total_pending = 0
    student_summaries = []

    for profile in profiles:
        paid = calculate_total_paid(db, profile.id)
        pending = profile.total_yearly_fee - paid

        total_expected += profile.total_yearly_fee
        total_collected += paid
        total_pending += pending

        student_summaries.append({
            "student_id": profile.student_id,
            "student_name": profile.student.name,
            "total_fee": profile.total_yearly_fee,
            "paid": paid,
            "pending": pending,
            "status": "PAID" if pending == 0 else "PENDING" if paid == 0 else "PARTIAL"
        })

    return {
        "class_summary": {
            "total_students": len(profiles),
            "total_expected": total_expected,
            "total_collected": total_collected,
            "total_pending": total_pending,
            "collection_percentage": round((total_collected / total_expected * 100) if total_expected > 0 else 0, 2)
        },
        "students": student_summaries
    }
