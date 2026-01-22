"""
Push Subscription Model

Stores browser push notification subscriptions for users.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class PushSubscription(Base):
    """
    Stores Web Push notification subscriptions.

    Each user can have multiple subscriptions (one per device/browser).
    """
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Push subscription data
    endpoint = Column(Text, nullable=False, unique=True, index=True)
    p256dh_key = Column(String(255), nullable=False)
    auth_key = Column(String(255), nullable=False)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="push_subscriptions")

    def __repr__(self):
        return f"<PushSubscription user_id={self.user_id} active={self.is_active}>"
