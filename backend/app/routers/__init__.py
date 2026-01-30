from .admission import router as admission_router
from .enrollment import router as enrollment_router
from .attendance import router as attendance_router
from .auth import router as auth_router
from .promotion import router as promotion_router
from .fees import router as fees_router
from .marks import router as marks_router
from .exams import router as exams_router
from .marks_edit import router as marks_edit_router
from .results import router as results_router

# New routers
from .notifications import router as notifications_router
from .homework import router as homework_router
from .calendar import router as calendar_router

# Teacher management
from .teacher_attendance import router as teacher_attendance_router
from .teacher_leave import router as teacher_leave_router
from .teacher_subjects import router as teacher_subjects_router

# Public website content
from .achievements import router as achievements_router
from .events import router as events_router

# User management
from .users import router as users_router
from .registration import router as registration_router

# File uploads
from .uploads import router as uploads_router

# Subjects
from .subjects import router as subjects_router
from .settings import router as settings_router

# Academic year management
from .academic_year import router as academic_year_router

# Admin management
from .classes import router as classes_router

# Push notifications
from .push_subscriptions import router as push_subscriptions_router
