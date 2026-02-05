# app/core/auth.py
from typing import Callable, Iterable, Optional
from fastapi import Depends, HTTPException, status, Request, Cookie
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
import jwt

from app.core.database import get_db
from app.models.user import User
from app.core.roles import Role, ROLE_HIERARCHY
from app.core.security import (
    decode_access_token,
    COOKIE_NAME,
)

# OAuth2 scheme that also accepts token from cookie
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def _unauthorized():
    """
    Standard unauthorized response.
    Never leak details.
    """
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_token_from_request(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
    access_token: Optional[str] = Cookie(default=None, alias=COOKIE_NAME),
) -> str:
    """
    Extract token from either:
    1. Authorization header (Bearer token)
    2. httpOnly cookie

    Prioritizes Bearer token if both are present.
    """
    # First check Authorization header
    if bearer_token:
        return bearer_token

    # Then check cookie
    if access_token:
        return access_token

    # No token found
    raise _unauthorized()


def get_current_user(
    token: str = Depends(get_token_from_request),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode JWT, fetch user, and guarantee:
    - valid token
    - valid user id
    - active user
    - no crashes

    Supports both Bearer token and httpOnly cookie authentication.
    """

    # 1️⃣ Decode token safely
    try:
        payload = decode_access_token(token)
    except (JWTError, jwt.exceptions.PyJWTError) as e:
        raise _unauthorized()

    # 2️⃣ Extract subject (user id)
    user_id = payload.get("sub")
    if not user_id:
        raise _unauthorized()

    # 3️⃣ Ensure user_id is integer
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise _unauthorized()

    # 4️⃣ Fetch user safely
    user = db.get(User, user_id)
    if not user:
        raise _unauthorized()

    # 5️⃣ Validate token version (enables token invalidation on password change/deletion)
    token_version = payload.get("tv", 0)
    user_token_version = user.token_version if user.token_version is not None else 0
    if token_version != user_token_version:
        raise _unauthorized()  # Token was invalidated

    # 6️⃣ Ensure user is active
    if not user.is_active:
        raise _unauthorized()

    return user


def get_current_user_optional(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
    access_token: Optional[str] = Cookie(default=None, alias=COOKIE_NAME),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Same as get_current_user but returns None if no valid token found.
    Useful for endpoints that work differently for authenticated vs anonymous users.
    """
    # Try Bearer token first
    token = bearer_token or access_token

    if not token:
        return None

    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
        user = db.get(User, user_id)
        if user and user.is_active:
            return user
    except:
        pass

    return None


def require_roles(*allowed_roles: Iterable[str]) -> Callable:
    """
    Allow only exact roles.
    """

    allowed = {r.name if isinstance(r, Role) else str(r) for r in allowed_roles}

    def _dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for your role",
            )
        return user

    return _dep


def require_role_at_least(minimum_role: Role) -> Callable:
    """
    Require user to have at least the specified role level.
    Uses ROLE_HIERARCHY to check if user's role is sufficient.
    """
    def _dep(user: User = Depends(get_current_user)) -> User:
        try:
            user_role = Role(user.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid user role",
            )

        # Check if user's role level is >= minimum required
        try:
            user_level = ROLE_HIERARCHY.index(user_role)
            min_level = ROLE_HIERARCHY.index(minimum_role)
            if user_level > min_level:  # Higher index = lower privilege
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions",
                )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid role configuration",
            )

        return user

    return _dep
