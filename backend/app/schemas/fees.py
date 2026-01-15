from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# ========================================
# FEE STRUCTURE SCHEMAS
# ========================================

class FeeStructureCreate(BaseModel):
    """Create fee structure for a class"""
    class_id: int
    academic_year_id: int
    annual_charges: int = Field(ge=0, description="One-time annual charges")
    monthly_fee: int = Field(gt=0, description="Monthly tuition fee")


class FeeStructureUpdate(BaseModel):
    """Update fee structure"""
    annual_charges: Optional[int] = Field(None, ge=0)
    monthly_fee: Optional[int] = Field(None, gt=0)


class FeeStructureResponse(BaseModel):
    """Fee structure response"""
    id: int
    class_id: int
    academic_year_id: int
    annual_charges: int
    monthly_fee: int
    yearly_tuition: int  # Calculated: monthly_fee * 12
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========================================
# STUDENT FEE PROFILE SCHEMAS
# ========================================

class StudentFeeProfileCreate(BaseModel):
    """Create fee profile for a student"""
    student_id: int
    fee_structure_id: int
    transport_charges: int = Field(default=0, ge=0, description="Yearly transport charges")
    concession_amount: int = Field(default=0, ge=0, description="Concession amount")
    concession_reason: Optional[str] = Field(None, max_length=255)


class StudentFeeProfileUpdate(BaseModel):
    """Update student fee profile"""
    transport_charges: Optional[int] = Field(None, ge=0)
    transport_locked: Optional[bool] = None
    concession_amount: Optional[int] = Field(None, ge=0)
    concession_reason: Optional[str] = Field(None, max_length=255)
    is_locked: Optional[bool] = None


class StudentFeeProfileResponse(BaseModel):
    """Student fee profile response"""
    id: int
    student_id: int
    fee_structure_id: int
    transport_charges: int
    transport_locked: bool
    concession_amount: int
    concession_reason: Optional[str]
    total_yearly_fee: int
    is_locked: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========================================
# FEE PAYMENT SCHEMAS
# ========================================

class FeePaymentCreate(BaseModel):
    """Create a fee payment (for parents/students initiating online payment)"""
    student_fee_profile_id: int
    amount_paid: int = Field(gt=0, description="Amount to pay")
    payment_frequency: str = Field(description="MONTHLY, QUARTERLY, HALF_YEARLY, or YEARLY")
    payment_mode: str = Field(description="UPI, ONLINE, CASH, BANK_TRANSFER, or CHEQUE")
    remarks: Optional[str] = None


class CashPaymentCreate(BaseModel):
    """Admin creates cash payment record"""
    student_fee_profile_id: int
    amount_paid: int = Field(gt=0)
    payment_frequency: str
    receipt_number: Optional[str] = Field(None, max_length=50)
    paid_at: Optional[datetime] = None
    remarks: Optional[str] = None


class PaymentVerification(BaseModel):
    """Admin verifies a payment"""
    is_verified: bool
    remarks: Optional[str] = None


class FeePaymentResponse(BaseModel):
    """Fee payment response"""
    id: int
    student_fee_profile_id: int
    amount_paid: int
    payment_mode: str
    payment_frequency: str
    transaction_id: Optional[str]
    receipt_number: Optional[str]
    is_verified: bool
    paid_at: datetime
    created_at: datetime
    remarks: Optional[str]

    class Config:
        from_attributes = True


# ========================================
# FEE SUMMARY SCHEMAS
# ========================================

class PaymentSchedule(BaseModel):
    """Payment schedule for a student"""
    total_yearly_fee: int
    payment_frequency: str
    installment_amount: int
    number_of_installments: int
    installments: List[int]


class FeeSummary(BaseModel):
    """Comprehensive fee summary for a student"""
    student_id: int
    student_name: str
    class_name: str
    academic_year: str

    fee_breakdown: dict = Field(
        description="annual_charges, monthly_fee, yearly_tuition, transport_charges, concession_amount"
    )

    totals: dict = Field(
        description="gross_yearly_fee, net_yearly_fee, total_paid, pending_amount, payment_percentage"
    )

    payments: List[FeePaymentResponse]


# ========================================
# PAYMENT GATEWAY SCHEMAS
# ========================================

class InitiatePaymentRequest(BaseModel):
    """Request to initiate payment gateway transaction"""
    student_fee_profile_id: int
    amount: int = Field(gt=0)
    payment_frequency: str
    return_url: Optional[str] = Field(None, description="URL to return after payment")


class InitiatePaymentResponse(BaseModel):
    """Response from payment gateway initiation"""
    transaction_id: str
    payment_url: str
    qr_code_url: Optional[str] = None
    upi_id: Optional[str] = Field(None, description="UPI ID for direct payment")
    amount: int
    expires_at: datetime


class PaymentCallbackRequest(BaseModel):
    """Payment gateway callback data"""
    transaction_id: str
    status: str
    amount: int
    gateway_response: str


# ========================================
# EXPORT SCHEMAS
# ========================================

class FeeReportFilter(BaseModel):
    """Filters for fee report generation"""
    academic_year_id: Optional[int] = None
    class_id: Optional[int] = None
    payment_status: Optional[str] = Field(None, description="PAID, PENDING, PARTIAL")
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None


class BulkFeeAssignment(BaseModel):
    """Assign fees to multiple students"""
    fee_structure_id: int
    student_ids: List[int]
    default_transport_charges: int = Field(default=0, ge=0)
    default_concession: int = Field(default=0, ge=0)
