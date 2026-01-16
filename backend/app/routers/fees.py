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
