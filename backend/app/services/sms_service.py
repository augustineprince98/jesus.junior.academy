"""
SMS Service - Twilio Integration

Handles sending SMS notifications for:
- OTP verification
- Password reset
- Important alerts
- Attendance notifications
"""

import os
import logging
from typing import Optional, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Configuration from environment
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
SMS_ENABLED = all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER])


@dataclass
class SMSResult:
    """Result of an SMS send operation."""
    success: bool
    message_sid: Optional[str] = None
    error: Optional[str] = None
    phone_number: Optional[str] = None


def _get_twilio_client():
    """Get Twilio client instance (lazy loading)."""
    if not SMS_ENABLED:
        return None

    try:
        from twilio.rest import Client
        return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except Exception as e:
        logger.error(f"Failed to initialize Twilio client: {e}")
        return None


def send_sms(phone_number: str, message: str) -> SMSResult:
    """
    Send an SMS message to a phone number.

    Args:
        phone_number: The recipient's phone number (with country code, e.g., +91...)
        message: The message content (max 1600 characters)

    Returns:
        SMSResult with success status and message SID or error
    """
    if not SMS_ENABLED:
        logger.warning("SMS service not configured. Skipping SMS send.")
        return SMSResult(
            success=False,
            error="SMS service not configured",
            phone_number=phone_number
        )

    # Validate phone number format
    if not phone_number.startswith("+"):
        phone_number = f"+91{phone_number}"  # Default to India country code

    # Truncate message if too long
    if len(message) > 1600:
        message = message[:1597] + "..."

    client = _get_twilio_client()
    if not client:
        return SMSResult(
            success=False,
            error="Failed to initialize Twilio client",
            phone_number=phone_number
        )

    try:
        msg = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )

        logger.info(f"SMS sent successfully: SID={msg.sid}, to={phone_number}")
        return SMSResult(
            success=True,
            message_sid=msg.sid,
            phone_number=phone_number
        )

    except Exception as e:
        logger.error(f"Failed to send SMS to {phone_number}: {e}")
        return SMSResult(
            success=False,
            error=str(e),
            phone_number=phone_number
        )


def send_bulk_sms(phone_numbers: List[str], message: str) -> List[SMSResult]:
    """
    Send the same SMS message to multiple phone numbers.

    Args:
        phone_numbers: List of phone numbers
        message: The message content

    Returns:
        List of SMSResult for each phone number
    """
    results = []
    for phone in phone_numbers:
        result = send_sms(phone, message)
        results.append(result)
    return results


# Pre-built message templates

def send_otp_sms(phone_number: str, otp: str, purpose: str = "verification") -> SMSResult:
    """Send an OTP SMS for verification."""
    message = f"Jesus Junior Academy: Your OTP for {purpose} is {otp}. Valid for 10 minutes. Do not share this code."
    return send_sms(phone_number, message)


def send_password_reset_sms(phone_number: str, otp: str) -> SMSResult:
    """Send password reset OTP."""
    message = f"Jesus Junior Academy: Your password reset OTP is {otp}. Valid for 10 minutes. If you didn't request this, please ignore."
    return send_sms(phone_number, message)


def send_attendance_alert_sms(
    phone_number: str,
    student_name: str,
    status: str,
    date: str
) -> SMSResult:
    """Send attendance status alert to parent."""
    if status.lower() == "absent":
        message = f"Jesus Junior Academy: {student_name} was marked ABSENT on {date}. Please contact the school if this is incorrect."
    else:
        message = f"Jesus Junior Academy: {student_name} attendance recorded as {status} on {date}."
    return send_sms(phone_number, message)


def send_fee_reminder_sms(
    phone_number: str,
    student_name: str,
    amount: float,
    due_date: str
) -> SMSResult:
    """Send fee payment reminder."""
    message = f"Jesus Junior Academy: Fee reminder for {student_name}. Amount due: Rs. {amount:.2f}. Due date: {due_date}. Please pay promptly to avoid late fees."
    return send_sms(phone_number, message)


def send_exam_notification_sms(
    phone_number: str,
    student_name: str,
    exam_name: str,
    start_date: str
) -> SMSResult:
    """Send exam schedule notification."""
    message = f"Jesus Junior Academy: {exam_name} exams starting {start_date} for {student_name}. Please ensure your child is prepared."
    return send_sms(phone_number, message)


def send_emergency_sms(phone_number: str, message_content: str) -> SMSResult:
    """Send emergency/urgent notification."""
    message = f"URGENT - Jesus Junior Academy: {message_content}"
    return send_sms(phone_number, message)


def check_sms_service_status() -> dict:
    """Check if SMS service is properly configured and working."""
    status = {
        "enabled": SMS_ENABLED,
        "configured": bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN),
        "phone_number_set": bool(TWILIO_PHONE_NUMBER),
        "client_initialized": False,
        "account_status": None,
    }

    if SMS_ENABLED:
        client = _get_twilio_client()
        if client:
            status["client_initialized"] = True
            try:
                # Try to fetch account info to verify credentials
                account = client.api.accounts(TWILIO_ACCOUNT_SID).fetch()
                status["account_status"] = account.status
            except Exception as e:
                status["account_status"] = f"error: {str(e)}"

    return status
