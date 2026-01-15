from sqlalchemy import (
    ForeignKey,
    Integer,
    String,
    Boolean,
    DateTime,
    Enum,
    Numeric,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from enum import Enum as PyEnum

from app.core.database import Base


class PaymentMode(str, PyEnum):
    """Payment modes supported"""
    CASH = "CASH"
    UPI = "UPI"
    ONLINE = "ONLINE"
    BANK_TRANSFER = "BANK_TRANSFER"
    CHEQUE = "CHEQUE"


class PaymentFrequency(str, PyEnum):
    """Payment frequency options"""
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    HALF_YEARLY = "HALF_YEARLY"
    YEARLY = "YEARLY"


class FeeStructure(Base):
    """
    Base fee structure for each class per academic year.
    Defines: Annual charges + Monthly fee (same for all students in class)
    """
    __tablename__ = "fee_structures"

    id: Mapped[int] = mapped_column(primary_key=True)

    class_id: Mapped[int] = mapped_column(
        ForeignKey("school_classes.id", ondelete="CASCADE"),
        nullable=False,
    )
    academic_year_id: Mapped[int] = mapped_column(
        ForeignKey("academic_years.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Fee breakdown
    annual_charges: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0,
        comment="One-time annual charges (admission, books, etc.)"
    )
    monthly_fee: Mapped[int] = mapped_column(
        Integer, nullable=False,
        comment="Monthly tuition fee (same for all students in class)"
    )

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    __table_args__ = (
        UniqueConstraint(
            "class_id",
            "academic_year_id",
            name="uq_fee_structure_per_class_year",
        ),
    )

    # Relationships
    school_class = relationship("SchoolClass", back_populates="fee_structures")
    academic_year = relationship("AcademicYear")
    student_fee_profiles = relationship("StudentFeeProfile", back_populates="fee_structure")


class StudentFeeProfile(Base):
    """
    Individual student's fee profile for an academic year.
    Includes: Transport charges, concession, and calculated total
    """
    __tablename__ = "student_fee_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
    )
    fee_structure_id: Mapped[int] = mapped_column(
        ForeignKey("fee_structures.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Student-specific charges
    transport_charges: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0,
        comment="Yearly transport charges (varies per student, locked by admin)"
    )
    transport_locked: Mapped[bool] = mapped_column(
        Boolean, default=False,
        comment="Admin locks transport charges to prevent changes"
    )

    # Concession
    concession_amount: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0,
        comment="Admin-provided concession amount"
    )
    concession_reason: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
        comment="Reason for concession (optional)"
    )

    # Calculated total (cached for performance)
    total_yearly_fee: Mapped[int] = mapped_column(
        Integer, nullable=False,
        comment="Calculated: annual_charges + (monthly_fee * 12) + transport - concession"
    )

    # Admin control
    is_locked: Mapped[bool] = mapped_column(
        Boolean, default=False,
        comment="Lock fee profile to prevent further changes"
    )

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "fee_structure_id",
            name="uq_student_fee_per_year",
        ),
    )

    # Relationships
    student = relationship("Student", back_populates="fee_profiles")
    fee_structure = relationship("FeeStructure", back_populates="student_fee_profiles")
    payments = relationship("FeePayment", back_populates="student_fee_profile", cascade="all, delete-orphan")


class FeePayment(Base):
    """
    Individual payment record for a student.
    Supports multiple payment frequencies and modes.
    """
    __tablename__ = "fee_payments"

    id: Mapped[int] = mapped_column(primary_key=True)

    student_fee_profile_id: Mapped[int] = mapped_column(
        ForeignKey("student_fee_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Payment details
    amount_paid: Mapped[int] = mapped_column(
        Integer, nullable=False,
        comment="Amount paid in this transaction"
    )

    payment_mode: Mapped[PaymentMode] = mapped_column(
        Enum(PaymentMode), nullable=False,
        comment="Payment method used"
    )

    payment_frequency: Mapped[PaymentFrequency] = mapped_column(
        Enum(PaymentFrequency), nullable=False,
        comment="Payment frequency chosen by parent"
    )

    # Payment gateway details (for online payments)
    transaction_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
        comment="Transaction ID from payment gateway"
    )
    gateway_response: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="JSON response from payment gateway"
    )

    # Cash payment details (marked by admin)
    receipt_number: Mapped[str | None] = mapped_column(
        String(50), nullable=True,
        comment="Receipt number for cash/cheque payments"
    )
    marked_by_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Admin who marked this cash payment"
    )

    # Timestamps
    paid_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow,
        comment="When payment was made"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow,
        comment="When record was created"
    )

    # Payment verification
    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False,
        comment="Admin verification for online payments"
    )
    verified_by_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Additional notes
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    student_fee_profile = relationship("StudentFeeProfile", back_populates="payments")
    marked_by_admin = relationship("User", foreign_keys=[marked_by_admin_id])
    verified_by_admin = relationship("User", foreign_keys=[verified_by_admin_id])
