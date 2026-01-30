from sqlalchemy import Column, Integer, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    
    # Store settings as JSON blocks for flexibility
    school_config = Column(JSON, default={})
    notification_config = Column(JSON, default={})
    security_config = Column(JSON, default={})
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
