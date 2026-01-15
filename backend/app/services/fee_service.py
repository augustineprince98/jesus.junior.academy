"""
Fee Calculation Service
Handles all fee-related calculations and business logic
"""

from sqlalchemy.orm import Session
from typing import Dict
from app.models.fees import FeeStructure, StudentFeeProfile, PaymentFrequency


def calculate_student_yearly_fee(
    fee_structure: FeeStructure,
    transport_charges: int = 0,
    concession_amount: int = 0
) -> int:
    """
    Calculate total yearly fee for a student.
    Formula: annual_charges + (monthly_fee × 12) + transport_charges - concession
    """
    total = (
        fee_structure.annual_charges +
        (fee_structure.monthly_fee * 12) +
        transport_charges -
        concession_amount
    )
    return max(0, total)  # Ensure non-negative


def calculate_installment_amount(
    total_yearly_fee: int,
    frequency: PaymentFrequency
) -> int:
    """
    Calculate payment amount based on frequency.
    """
    if frequency == PaymentFrequency.YEARLY:
        return total_yearly_fee
    elif frequency == PaymentFrequency.HALF_YEARLY:
        return total_yearly_fee // 2
    elif frequency == PaymentFrequency.QUARTERLY:
        return total_yearly_fee // 4
    elif frequency == PaymentFrequency.MONTHLY:
        return total_yearly_fee // 12
    return total_yearly_fee


def get_payment_schedule(
    total_yearly_fee: int,
    frequency: PaymentFrequency
) -> Dict:
    """
    Get payment schedule breakdown.
    """
    installment_amount = calculate_installment_amount(total_yearly_fee, frequency)

    schedule = {
        "total_yearly_fee": total_yearly_fee,
        "payment_frequency": frequency.value,
        "installment_amount": installment_amount,
    }

    if frequency == PaymentFrequency.YEARLY:
        schedule["number_of_installments"] = 1
        schedule["installments"] = [total_yearly_fee]
    elif frequency == PaymentFrequency.HALF_YEARLY:
        schedule["number_of_installments"] = 2
        schedule["installments"] = [installment_amount, installment_amount]
    elif frequency == PaymentFrequency.QUARTERLY:
        schedule["number_of_installments"] = 4
        schedule["installments"] = [installment_amount] * 4
    elif frequency == PaymentFrequency.MONTHLY:
        schedule["number_of_installments"] = 12
        schedule["installments"] = [installment_amount] * 12

    return schedule


def calculate_total_paid(db: Session, student_fee_profile_id: int) -> int:
    """
    Calculate total amount paid by a student for their fee profile.
    """
    from app.models.fees import FeePayment

    result = db.query(
        db.func.sum(FeePayment.amount_paid)
    ).filter(
        FeePayment.student_fee_profile_id == student_fee_profile_id,
        FeePayment.is_verified == True
    ).scalar()

    return result or 0


def calculate_pending_amount(
    db: Session,
    student_fee_profile: StudentFeeProfile
) -> int:
    """
    Calculate pending fee amount for a student.
    """
    total_paid = calculate_total_paid(db, student_fee_profile.id)
    pending = student_fee_profile.total_yearly_fee - total_paid
    return max(0, pending)


def get_fee_summary(
    db: Session,
    student_fee_profile: StudentFeeProfile
) -> Dict:
    """
    Get comprehensive fee summary for a student.
    """
    total_paid = calculate_total_paid(db, student_fee_profile.id)
    pending = calculate_pending_amount(db, student_fee_profile)

    fee_structure = student_fee_profile.fee_structure

    return {
        "fee_structure": {
            "annual_charges": fee_structure.annual_charges,
            "monthly_fee": fee_structure.monthly_fee,
            "yearly_tuition": fee_structure.monthly_fee * 12,
        },
        "student_specific": {
            "transport_charges": student_fee_profile.transport_charges,
            "concession_amount": student_fee_profile.concession_amount,
            "concession_reason": student_fee_profile.concession_reason,
        },
        "totals": {
            "gross_yearly_fee": (
                fee_structure.annual_charges +
                (fee_structure.monthly_fee * 12) +
                student_fee_profile.transport_charges
            ),
            "net_yearly_fee": student_fee_profile.total_yearly_fee,
            "total_paid": total_paid,
            "pending_amount": pending,
            "payment_percentage": round(
                (total_paid / student_fee_profile.total_yearly_fee * 100) if student_fee_profile.total_yearly_fee > 0 else 0,
                2
            )
        }
    }


def validate_payment_amount(
    amount: int,
    frequency: PaymentFrequency,
    total_yearly_fee: int
) -> tuple[bool, str]:
    """
    Validate if payment amount is correct for chosen frequency.
    Returns (is_valid, error_message)
    """
    expected_amount = calculate_installment_amount(total_yearly_fee, frequency)

    # Allow some flexibility (±5%) for rounding
    min_amount = int(expected_amount * 0.95)
    max_amount = int(expected_amount * 1.05)

    if amount < min_amount:
        return False, f"Payment amount too low. Expected approximately ₹{expected_amount}"
    elif amount > total_yearly_fee:
        return False, f"Payment amount exceeds total yearly fee of ₹{total_yearly_fee}"

    return True, ""
