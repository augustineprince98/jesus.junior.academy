"""
Scheduler Service - Automated Tasks

Handles scheduled tasks like:
- Daily homework digest at 3:30 PM on working days
- Fee payment reminders (3 days before due date)
- Absent student notifications to parents
- Weekly attendance summary
- Birthday notifications
"""

import logging
from datetime import date, datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

from app.core.database import SessionLocal
from app.models.school_calendar import SchoolCalendar, DayType
from app.models.academic_year import AcademicYear
from app.models.user import User
from app.core.roles import Role
from app.services.notification_service import (
    send_daily_homework_digest_all_classes,
    create_notification,
    send_notification,
    NotificationType,
    NotificationPriority,
    TargetAudience,
)

logger = logging.getLogger(__name__)

# Timezone for India
IST = pytz.timezone('Asia/Kolkata')

# Global scheduler instance
scheduler = AsyncIOScheduler(timezone=IST)


def is_working_day(db, check_date: date = None) -> bool:
    """Check if a date is a working day according to school calendar."""
    check_date = check_date or date.today()

    # Get current academic year
    current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
    if not current_year:
        return False

    # Check calendar entry for today
    calendar_entry = db.query(SchoolCalendar).filter(
        SchoolCalendar.academic_year_id == current_year.id,
        SchoolCalendar.date == check_date,
    ).first()

    # If no calendar entry exists, check if it's a weekday (Mon-Sat)
    if not calendar_entry:
        # 0 = Monday, 5 = Saturday, 6 = Sunday
        return check_date.weekday() < 6  # Monday to Saturday

    return calendar_entry.is_working_day


async def send_daily_homework_digest_job():
    """
    Scheduled job to send daily homework digest.

    Runs at 3:30 PM IST on working days.
    """
    logger.info("Running daily homework digest job...")

    db = SessionLocal()
    try:
        # Check if today is a working day
        if not is_working_day(db):
            logger.info("Today is not a working day. Skipping homework digest.")
            return

        # Get current academic year
        current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
        if not current_year:
            logger.warning("No current academic year found. Skipping homework digest.")
            return

        # Get system admin user for created_by (first admin user)
        admin_user = db.query(User).filter(User.role == Role.ADMIN.value).first()
        if not admin_user:
            logger.warning("No admin user found. Skipping homework digest.")
            return

        # Send digest
        result = send_daily_homework_digest_all_classes(
            db,
            academic_year_id=current_year.id,
            created_by_id=admin_user.id,
        )

        logger.info(
            f"Daily homework digest sent: {result['classes_notified']} classes, "
            f"{result['total_recipients']} recipients"
        )

    except Exception as e:
        logger.error(f"Error in daily homework digest job: {str(e)}", exc_info=True)
    finally:
        db.close()


async def send_fee_reminder_job():
    """
    Scheduled job to send fee payment reminders.

    Runs daily at 9 AM IST.
    Sends reminders for fees due in 3 days.
    """
    logger.info("Running fee reminder job...")

    db = SessionLocal()
    try:
        from app.models.fees import StudentFee
        from app.models.people import Student

        # Get current academic year
        current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
        if not current_year:
            logger.warning("No current academic year found. Skipping fee reminders.")
            return

        # Get admin user for created_by
        admin_user = db.query(User).filter(User.role == Role.ADMIN.value).first()
        if not admin_user:
            return

        # Find fees due in 3 days
        target_date = date.today() + timedelta(days=3)

        pending_fees = db.query(StudentFee).filter(
            StudentFee.academic_year_id == current_year.id,
            StudentFee.status == "PENDING",
            StudentFee.due_date == target_date,
        ).all()

        for fee in pending_fees:
            student = db.get(Student, fee.student_id)
            if not student:
                continue

            # Create notification
            notification = create_notification(
                db,
                title=f"Fee Payment Reminder - {student.name}",
                message=f"Reminder: Fee payment of Rs. {fee.amount:.2f} for {student.name} is due on {fee.due_date.strftime('%d %B %Y')}. Please make the payment to avoid late fees.",
                notification_type=NotificationType.FEE_REMINDER,
                priority=NotificationPriority.HIGH,
                target_audience=TargetAudience.CLASS_SPECIFIC,
                target_class_id=fee.class_id if hasattr(fee, 'class_id') else None,
                academic_year_id=current_year.id,
                created_by_id=admin_user.id,
            )

            if notification:
                send_notification(db, notification_id=notification.id)

        logger.info(f"Fee reminders sent: {len(pending_fees)} reminders")

    except Exception as e:
        logger.error(f"Error in fee reminder job: {str(e)}", exc_info=True)
    finally:
        db.close()


async def send_absent_notification_job():
    """
    Scheduled job to notify parents of absent students.

    Runs at 11 AM IST on working days (after attendance is typically marked).
    """
    logger.info("Running absent notification job...")

    db = SessionLocal()
    try:
        from app.models.attendance import Attendance
        from app.models.people import Student

        # Check if today is a working day
        if not is_working_day(db):
            logger.info("Today is not a working day. Skipping absent notifications.")
            return

        # Get current academic year
        current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
        if not current_year:
            return

        admin_user = db.query(User).filter(User.role == Role.ADMIN.value).first()
        if not admin_user:
            return

        today = date.today()

        # Find all absent students for today
        absent_records = db.query(Attendance).filter(
            Attendance.date == today,
            Attendance.status == "ABSENT",
        ).all()

        notifications_sent = 0
        for record in absent_records:
            student = db.get(Student, record.student_id)
            if not student:
                continue

            # Get the student's class from enrollment
            from app.models.enrollment import Enrollment
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == student.id,
                Enrollment.academic_year_id == current_year.id,
                Enrollment.status == "ACTIVE",
            ).first()

            if not enrollment:
                continue

            notification = create_notification(
                db,
                title=f"Attendance Alert: {student.name}",
                message=f"Your ward {student.name} was marked absent today ({today.strftime('%d %B %Y')}). If this is incorrect, please contact the school.",
                notification_type=NotificationType.ATTENDANCE,
                priority=NotificationPriority.HIGH,
                target_audience=TargetAudience.CLASS_SPECIFIC,
                target_class_id=enrollment.class_id,
                academic_year_id=current_year.id,
                created_by_id=admin_user.id,
            )

            if notification:
                send_notification(db, notification_id=notification.id)
                notifications_sent += 1

        logger.info(f"Absent notifications sent: {notifications_sent}")

    except Exception as e:
        logger.error(f"Error in absent notification job: {str(e)}", exc_info=True)
    finally:
        db.close()


async def cleanup_expired_notifications_job():
    """
    Scheduled job to cleanup expired notifications.

    Runs daily at 2 AM IST.
    """
    logger.info("Running notification cleanup job...")

    db = SessionLocal()
    try:
        from app.models.notification import Notification

        # Delete notifications older than 90 days
        cutoff_date = datetime.utcnow() - timedelta(days=90)

        deleted = db.query(Notification).filter(
            Notification.created_at < cutoff_date,
        ).delete()

        db.commit()
        logger.info(f"Cleaned up {deleted} old notifications")

    except Exception as e:
        logger.error(f"Error in notification cleanup job: {str(e)}", exc_info=True)
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    """Start the scheduler with all jobs."""

    # Daily homework digest at 3:30 PM IST (Monday to Saturday)
    scheduler.add_job(
        send_daily_homework_digest_job,
        CronTrigger(
            hour=15,
            minute=30,
            day_of_week='mon-sat',
            timezone=IST,
        ),
        id='daily_homework_digest',
        name='Daily Homework Digest',
        replace_existing=True,
    )

    # Fee payment reminders at 9 AM IST daily
    scheduler.add_job(
        send_fee_reminder_job,
        CronTrigger(
            hour=9,
            minute=0,
            timezone=IST,
        ),
        id='fee_reminders',
        name='Fee Payment Reminders',
        replace_existing=True,
    )

    # Absent student notifications at 11 AM IST (Monday to Saturday)
    scheduler.add_job(
        send_absent_notification_job,
        CronTrigger(
            hour=11,
            minute=0,
            day_of_week='mon-sat',
            timezone=IST,
        ),
        id='absent_notifications',
        name='Absent Student Notifications',
        replace_existing=True,
    )

    # Cleanup expired notifications at 2 AM IST daily
    scheduler.add_job(
        cleanup_expired_notifications_job,
        CronTrigger(
            hour=2,
            minute=0,
            timezone=IST,
        ),
        id='notification_cleanup',
        name='Notification Cleanup',
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        "Scheduler started with jobs:\n"
        "  - Daily Homework Digest: 3:30 PM IST (Mon-Sat)\n"
        "  - Fee Payment Reminders: 9:00 AM IST (Daily)\n"
        "  - Absent Student Notifications: 11:00 AM IST (Mon-Sat)\n"
        "  - Notification Cleanup: 2:00 AM IST (Daily)"
    )


def stop_scheduler():
    """Stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped.")
