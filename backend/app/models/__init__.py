from app.core.database import Base

# Import ALL models in dependency order
from .user import User
from .academic_year import AcademicYear
from .people import Student, Parent, Teacher
from .school_class import SchoolClass
from .subject import Subject
from .class_subject import ClassSubject
from .enrollment import Enrollment
from .exam import Exam, ExamType
from .exam import ExamSubjectMax
from .student_mark import StudentMark
from .attendance import Attendance
from .admission import AdmissionEnquiry
from .fees import FeeStructure, StudentFeeProfile, FeePayment, PaymentMode, PaymentFrequency
from .password_reset import PasswordResetOTP
from .marks_edit_request import MarksEditRequest, EditRequestStatus
from .result import ResultPublication, StudentResult

# New models
from .school_calendar import SchoolCalendar, DayType
from .notification import Notification, NotificationRecipient, NotificationType, NotificationPriority, TargetAudience
from .homework import Homework
from .student_parent import StudentParent, ParentRelationship

# Teacher management models
from .teacher_attendance import TeacherAttendance
from .teacher_leave import TeacherLeave, LeaveStatus, LeaveType

# Public website content models
from .achievement import Achievement, AchievementCategory
from .event import Event, EventType

__all__ = [
    "Base",
    "User",
    "AcademicYear",
    "Student",
    "Parent",
    "Teacher",
    "SchoolClass",
    "Subject",
    "ClassSubject",
    "Enrollment",
    "Exam",
    "ExamType",
    "ExamSubjectMax",
    "StudentMark",
    "Attendance",
    "AdmissionEnquiry",
    "FeeStructure",
    "StudentFeeProfile",
    "FeePayment",
    "PaymentMode",
    "PaymentFrequency",
    "PasswordResetOTP",
    "MarksEditRequest",
    "EditRequestStatus",
    "ResultPublication",
    "StudentResult",
    # New models
    "SchoolCalendar",
    "DayType",
    "Notification",
    "NotificationRecipient",
    "NotificationType",
    "NotificationPriority",
    "TargetAudience",
    "Homework",
    "StudentParent",
    "ParentRelationship",
    # Teacher management
    "TeacherAttendance",
    "TeacherLeave",
    "LeaveStatus",
    "LeaveType",
    # Public website content
    "Achievement",
    "AchievementCategory",
    "Event",
    "EventType",
]