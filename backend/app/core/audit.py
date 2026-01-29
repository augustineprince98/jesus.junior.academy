"""
Audit Logging Module

Provides structured audit logging for sensitive operations like:
- User authentication (login, logout, password changes)
- Role changes and permission updates
- Data modifications (create, update, delete)
- Administrative actions

Logs are structured for easy parsing by log aggregation tools.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional
import logging
import json

from app.core.logging_config import get_logger

# Dedicated audit logger
audit_logger = get_logger("audit")


class AuditAction(str, Enum):
    """Enumeration of auditable actions."""
    
    # Authentication
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST"
    PASSWORD_RESET_COMPLETE = "PASSWORD_RESET_COMPLETE"
    TOKEN_REFRESH = "TOKEN_REFRESH"
    
    # User Management
    USER_CREATE = "USER_CREATE"
    USER_UPDATE = "USER_UPDATE"
    USER_DELETE = "USER_DELETE"
    USER_APPROVE = "USER_APPROVE"
    USER_REJECT = "USER_REJECT"
    ROLE_SWITCH = "ROLE_SWITCH"
    ROLE_LINK = "ROLE_LINK"
    
    # Student/Academic
    STUDENT_ENROLL = "STUDENT_ENROLL"
    STUDENT_PROMOTE = "STUDENT_PROMOTE"
    MARKS_ENTRY = "MARKS_ENTRY"
    MARKS_EDIT = "MARKS_EDIT"
    RESULT_PUBLISH = "RESULT_PUBLISH"
    
    # Financial
    FEE_PAYMENT = "FEE_PAYMENT"
    FEE_WAIVER = "FEE_WAIVER"
    FEE_STRUCTURE_UPDATE = "FEE_STRUCTURE_UPDATE"
    
    # Administrative
    NOTIFICATION_SEND = "NOTIFICATION_SEND"
    SETTINGS_UPDATE = "SETTINGS_UPDATE"
    DATA_EXPORT = "DATA_EXPORT"
    BULK_OPERATION = "BULK_OPERATION"


class AuditLog:
    """
    Structured audit log entry builder.
    
    Usage:
        AuditLog.log(
            action=AuditAction.LOGIN_SUCCESS,
            user_id=user.id,
            details={"ip": request.client.host}
        )
    """
    
    @staticmethod
    def log(
        action: AuditAction,
        user_id: Optional[int] = None,
        user_role: Optional[str] = None,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        details: Optional[dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None,
    ) -> None:
        """
        Create a structured audit log entry.
        
        Args:
            action: The action being audited
            user_id: ID of the user performing the action
            user_role: Role of the user (ADMIN, TEACHER, etc.)
            target_type: Type of entity being acted upon (user, student, etc.)
            target_id: ID of the target entity
            details: Additional context about the action
            ip_address: Client IP address
            success: Whether the action succeeded
            error_message: Error message if action failed
        """
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": action.value,
            "success": success,
            "user_id": user_id,
            "user_role": user_role,
            "target_type": target_type,
            "target_id": target_id,
            "ip_address": ip_address,
            "details": details or {},
        }
        
        if error_message:
            log_entry["error"] = error_message
        
        # Remove None values for cleaner logs
        log_entry = {k: v for k, v in log_entry.items() if v is not None}
        
        # Log at appropriate level
        if success:
            audit_logger.info(json.dumps(log_entry))
        else:
            audit_logger.warning(json.dumps(log_entry))
    
    @staticmethod
    def auth_success(user_id: int, user_role: str, ip_address: str) -> None:
        """Log successful authentication."""
        AuditLog.log(
            action=AuditAction.LOGIN_SUCCESS,
            user_id=user_id,
            user_role=user_role,
            ip_address=ip_address,
        )
    
    @staticmethod
    def auth_failure(phone: str, ip_address: str, reason: str) -> None:
        """Log failed authentication attempt."""
        AuditLog.log(
            action=AuditAction.LOGIN_FAILED,
            ip_address=ip_address,
            details={"phone": phone[-4:].rjust(len(phone), '*')},  # Mask phone
            success=False,
            error_message=reason,
        )
    
    @staticmethod
    def user_action(
        action: AuditAction,
        actor_id: int,
        actor_role: str,
        target_user_id: int,
        details: Optional[dict] = None,
    ) -> None:
        """Log user management action."""
        AuditLog.log(
            action=action,
            user_id=actor_id,
            user_role=actor_role,
            target_type="user",
            target_id=target_user_id,
            details=details,
        )
    
    @staticmethod
    def financial_action(
        action: AuditAction,
        user_id: int,
        user_role: str,
        amount: float,
        student_id: int,
        details: Optional[dict] = None,
    ) -> None:
        """Log financial transaction."""
        full_details = {"amount": amount, **(details or {})}
        AuditLog.log(
            action=action,
            user_id=user_id,
            user_role=user_role,
            target_type="student",
            target_id=student_id,
            details=full_details,
        )
