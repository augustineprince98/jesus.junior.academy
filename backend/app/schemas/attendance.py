from datetime import date
from pydantic import BaseModel


class AttendanceMark(BaseModel):
    student_id: int
    is_present: bool


class AttendanceCreate(BaseModel):
    class_id: int
    academic_year_id: int
    date: date
    records: list[AttendanceMark]


class AttendanceSummary(BaseModel):
    student_id: int
    total_working_days: int
    days_present: int
