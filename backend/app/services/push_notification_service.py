"""
Web Push Notification Service - VAPID Integration

Handles browser push notifications using the Web Push protocol.
Requires VAPID keys to be configured in environment.

To generate VAPID keys:
    from pywebpush import webpush
    import py_vapid
    vapid = py_vapid.Vapid()
    vapid.generate_keys()
    print(f"Private: {vapid.private_key}")
    print(f"Public: {vapid.public_key}")
"""

import os
import json
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

# Configuration from environment
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_CLAIMS_EMAIL = os.getenv("VAPID_CLAIMS_EMAIL", "admin@jesusjunioracademy.com")
PUSH_ENABLED = all([VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY])


@dataclass
class PushResult:
    """Result of a push notification send operation."""
    success: bool
    subscription_endpoint: Optional[str] = None
    error: Optional[str] = None
    status_code: Optional[int] = None


@dataclass
class PushSubscription:
    """Web Push subscription data from the browser."""
    endpoint: str
    keys: Dict[str, str]  # Contains 'p256dh' and 'auth' keys

    def to_dict(self) -> dict:
        return {
            "endpoint": self.endpoint,
            "keys": self.keys
        }

    @classmethod
    def from_dict(cls, data: dict) -> "PushSubscription":
        return cls(
            endpoint=data["endpoint"],
            keys=data["keys"]
        )


def get_vapid_public_key() -> Optional[str]:
    """Get the VAPID public key for client subscription."""
    return VAPID_PUBLIC_KEY


def send_push_notification(
    subscription: PushSubscription,
    title: str,
    body: str,
    icon: Optional[str] = None,
    url: Optional[str] = None,
    tag: Optional[str] = None,
    data: Optional[Dict[str, Any]] = None,
) -> PushResult:
    """
    Send a push notification to a subscribed browser.

    Args:
        subscription: The push subscription from the browser
        title: Notification title
        body: Notification body text
        icon: URL to notification icon
        url: URL to open when notification is clicked
        tag: Tag for grouping notifications
        data: Additional data to send with notification

    Returns:
        PushResult with success status
    """
    if not PUSH_ENABLED:
        logger.warning("Push notifications not configured. Skipping.")
        return PushResult(
            success=False,
            error="Push notifications not configured",
            subscription_endpoint=subscription.endpoint
        )

    try:
        from pywebpush import webpush, WebPushException

        # Build notification payload
        payload = {
            "notification": {
                "title": title,
                "body": body,
                "icon": icon or "/icons/notification-icon.png",
                "badge": "/icons/badge-icon.png",
                "tag": tag,
                "data": {
                    "url": url or "/",
                    "timestamp": datetime.utcnow().isoformat(),
                    **(data or {})
                },
                "requireInteraction": False,
                "silent": False,
            }
        }

        response = webpush(
            subscription_info=subscription.to_dict(),
            data=json.dumps(payload),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{VAPID_CLAIMS_EMAIL}"}
        )

        logger.info(f"Push notification sent: endpoint={subscription.endpoint[:50]}...")
        return PushResult(
            success=True,
            subscription_endpoint=subscription.endpoint,
            status_code=response.status_code
        )

    except Exception as e:
        error_msg = str(e)

        # Check if subscription is invalid/expired
        if hasattr(e, 'response') and e.response is not None:
            if e.response.status_code in [404, 410]:
                error_msg = "Subscription expired or invalid"
                logger.warning(f"Push subscription expired: {subscription.endpoint[:50]}...")
            else:
                error_msg = f"HTTP {e.response.status_code}: {error_msg}"

        logger.error(f"Failed to send push notification: {error_msg}")
        return PushResult(
            success=False,
            error=error_msg,
            subscription_endpoint=subscription.endpoint,
            status_code=getattr(getattr(e, 'response', None), 'status_code', None)
        )


def send_bulk_push_notifications(
    subscriptions: List[PushSubscription],
    title: str,
    body: str,
    **kwargs
) -> List[PushResult]:
    """
    Send push notification to multiple subscriptions.

    Args:
        subscriptions: List of push subscriptions
        title: Notification title
        body: Notification body text
        **kwargs: Additional arguments passed to send_push_notification

    Returns:
        List of PushResult for each subscription
    """
    results = []
    for subscription in subscriptions:
        result = send_push_notification(subscription, title, body, **kwargs)
        results.append(result)
    return results


# Pre-built notification types

def send_homework_push(
    subscription: PushSubscription,
    class_name: str,
    subject: str,
    due_date: str
) -> PushResult:
    """Send homework notification."""
    return send_push_notification(
        subscription,
        title=f"New Homework: {subject}",
        body=f"New homework assigned for {class_name}. Due: {due_date}",
        icon="/icons/homework-icon.png",
        url="/campus/homework",
        tag="homework"
    )


def send_attendance_push(
    subscription: PushSubscription,
    student_name: str,
    status: str,
    date: str
) -> PushResult:
    """Send attendance notification."""
    return send_push_notification(
        subscription,
        title=f"Attendance Update: {student_name}",
        body=f"Marked {status} on {date}",
        icon="/icons/attendance-icon.png",
        url="/campus/attendance",
        tag="attendance"
    )


def send_fee_reminder_push(
    subscription: PushSubscription,
    amount: float,
    due_date: str
) -> PushResult:
    """Send fee reminder notification."""
    return send_push_notification(
        subscription,
        title="Fee Payment Reminder",
        body=f"Fee of Rs. {amount:.2f} due by {due_date}",
        icon="/icons/fee-icon.png",
        url="/campus/fees",
        tag="fees"
    )


def send_announcement_push(
    subscription: PushSubscription,
    title: str,
    message: str
) -> PushResult:
    """Send school announcement."""
    return send_push_notification(
        subscription,
        title=f"Announcement: {title}",
        body=message[:200] + "..." if len(message) > 200 else message,
        icon="/icons/announcement-icon.png",
        url="/campus/notifications",
        tag="announcement"
    )


def send_result_push(
    subscription: PushSubscription,
    student_name: str,
    exam_name: str
) -> PushResult:
    """Send exam result availability notification."""
    return send_push_notification(
        subscription,
        title=f"Results Available: {exam_name}",
        body=f"Results for {student_name} are now available",
        icon="/icons/result-icon.png",
        url="/campus/results",
        tag="results"
    )


def send_emergency_push(
    subscription: PushSubscription,
    message: str
) -> PushResult:
    """Send emergency/urgent notification."""
    return send_push_notification(
        subscription,
        title="URGENT: Jesus Junior Academy",
        body=message,
        icon="/icons/emergency-icon.png",
        url="/campus/notifications",
        tag="emergency",
        data={"priority": "high", "requireInteraction": True}
    )


def check_push_service_status() -> dict:
    """Check if push notification service is properly configured."""
    return {
        "enabled": PUSH_ENABLED,
        "public_key_set": bool(VAPID_PUBLIC_KEY),
        "private_key_set": bool(VAPID_PRIVATE_KEY),
        "claims_email": VAPID_CLAIMS_EMAIL,
        "public_key": VAPID_PUBLIC_KEY[:20] + "..." if VAPID_PUBLIC_KEY else None,
    }


def generate_vapid_keys() -> dict:
    """
    Generate a new VAPID key pair.
    Use this to generate keys for .env configuration.
    """
    try:
        from py_vapid import Vapid
        vapid = Vapid()
        vapid.generate_keys()
        return {
            "public_key": vapid.public_key,
            "private_key": vapid.private_key,
            "note": "Add these to your .env file as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY"
        }
    except Exception as e:
        return {"error": str(e)}
