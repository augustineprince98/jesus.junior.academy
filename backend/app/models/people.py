from sqlalchemy import String, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from typing import Optional

from app.core.database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    dob: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    # Parent information (required for registration)
    father_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    mother_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")

    # Optional additional info
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    blood_group: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    emergency_contact: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)

    # Relationships
    enrollments = relationship("Enrollment", back_populates="student")
    fee_profiles = relationship("StudentFeeProfile", back_populates="student")


class Parent(Base):
    __tablename__ = "parents"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)