# app/core/permissions.py
from typing import Iterable
from fastapi import HTTPException, status

from app.core.roles import Role, ROLE_HIERARCHY
from app.models.user import User


def assert_has_role(user: User, *required: Iterable[Role]) -> None:
    """
    Raise 403 if user.role is not present in required roles.
    """
    allowed = {r.name if isinstance(r, Role) else str(r) for r in required}
    if user.role not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")


def assert_at_least(user: User, min_role: Role) -> None:
    """
    Raise 403 if user's role is lower than min_role according to ROLE_HIERARCHY.
    ROLE_HIERARCHY should be ordered from highest privilege to lowest.
    """
    try:
        user_role = Role[user.role]
    except Exception:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unknown user role")

    if ROLE_HIERARCHY.index(user_role) > ROLE_HIERARCHY.index(min_role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges")