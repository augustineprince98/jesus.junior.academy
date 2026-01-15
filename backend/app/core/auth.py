# app/core/auth.py
from typing import Callable, Iterable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.core.roles import Role, ROLE_HIERARCHY
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _unauthorized():
    """
    Standard unauthorized response.
    Never leak details.
    """
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode JWT, fetch user, and guarantee:
    - valid token
    - valid user id
    - active user
    - no crashes
    """

    # 1️⃣ Decode token safely
    try:
        payload = decode_access_token(token)
    except JWTError:
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

    # 5️⃣ Ensure user is active
    if not user.is_active:
        raise _unauthorized()

    return user


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
        if ROLE_HIERARCHY.get(user_role, 0) < ROLE_HIERARCHY.get(minimum_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        return user

    return _dep
