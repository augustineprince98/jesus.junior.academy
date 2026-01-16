"""
Scheduler Service - Automated Tasks

Handles scheduled tasks like:
- Daily homework digest at 3:30 PM on working days
"""

import logging
from datetime import date, datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

from app.core.database import SessionLocal
from app.models.school_calendar import SchoolCalendar, DayType
from app.models.academic_year import AcademicYear
from app.models.user import User
from app.core.roles import Role
from app.services.notification_service import send_daily_homework_digest_all_classes

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

    scheduler.start()
    logger.info("Scheduler started. Daily homework digest scheduled for 3:30 PM IST (Mon-Sat)")


def stop_scheduler():
    """Stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped.")
