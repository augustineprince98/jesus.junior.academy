"""
Push Subscription Router

Handles web push notification subscription management.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.push_subscription import PushSubscription as PushSubscriptionModel
from app.services.push_notification_service import (
    get_vapid_public_key,
    check_push_service_status,
    send_push_notification,
    PushSubscription,
)

router = APIRouter(prefix="/push", tags=["Push Notifications"])


class SubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class SubscriptionCreate(BaseModel):
    endpoint: str
    keys: SubscriptionKeys


class TestPushRequest(BaseModel):
    title: str = "Test Notification"
    body: str = "This is a test push notification from Jesus Junior Academy"


@router.get("/vapid-public-key")
def get_public_key():
    """
    Get the VAPID public key for browser push subscription.

    Frontend uses this to subscribe to push notifications.
    """
    public_key = get_vapid_public_key()
    if not public_key:
        raise HTTPException(
            status_code=503,
            detail="Push notifications not configured on server"
        )
    return {"publicKey": public_key}


@router.get("/status")
def get_push_status(
    current_user: User = Depends(require_role_at_least(Role.ADMIN))
):
    """Get push notification service status (admin only)."""
    return check_push_service_status()


@router.post("/subscribe")
def subscribe_to_push(
    subscription: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Save a push subscription for the current user.

    Called by frontend after user grants notification permission.
    """
    # Check if subscription already exists for this endpoint
    existing = db.query(PushSubscriptionModel).filter(
        PushSubscriptionModel.endpoint == subscription.endpoint
    ).first()

    if existing:
        # Update existing subscription
        existing.user_id = current_user.id
        existing.p256dh_key = subscription.keys.p256dh
        existing.auth_key = subscription.keys.auth
        existing.is_active = True
        db.commit()
        return {"status": "updated", "message": "Push subscription updated"}

    # Create new subscription
    new_subscription = PushSubscriptionModel(
        user_id=current_user.id,
        endpoint=subscription.endpoint,
        p256dh_key=subscription.keys.p256dh,
        auth_key=subscription.keys.auth,
        is_active=True,
    )
    db.add(new_subscription)
    db.commit()

    return {"status": "subscribed", "message": "Push subscription saved"}


@router.delete("/unsubscribe")
def unsubscribe_from_push(
    endpoint: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Remove a push subscription.

    Called when user disables notifications.
    """
    subscription = db.query(PushSubscriptionModel).filter(
        PushSubscriptionModel.endpoint == endpoint,
        PushSubscriptionModel.user_id == current_user.id,
    ).first()

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    db.delete(subscription)
    db.commit()

    return {"status": "unsubscribed", "message": "Push subscription removed"}


@router.post("/test")
def send_test_push(
    request: TestPushRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a test push notification to the current user's subscriptions.
    """
    subscriptions = db.query(PushSubscriptionModel).filter(
        PushSubscriptionModel.user_id == current_user.id,
        PushSubscriptionModel.is_active == True,
    ).all()

    if not subscriptions:
        raise HTTPException(
            status_code=404,
            detail="No active push subscriptions found. Enable notifications first."
        )

    results = []
    for sub in subscriptions:
        push_sub = PushSubscription(
            endpoint=sub.endpoint,
            keys={"p256dh": sub.p256dh_key, "auth": sub.auth_key}
        )
        result = send_push_notification(
            push_sub,
            title=request.title,
            body=request.body,
            url="/campus"
        )
        results.append({
            "endpoint": sub.endpoint[:50] + "...",
            "success": result.success,
            "error": result.error
        })

        # Deactivate invalid subscriptions
        if result.status_code in [404, 410]:
            sub.is_active = False
            db.commit()

    success_count = sum(1 for r in results if r["success"])
    return {
        "sent": success_count,
        "total": len(results),
        "results": results
    }
