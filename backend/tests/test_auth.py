"""
Authentication Tests

Tests for login, registration, and password reset endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User, ApprovalStatus


class TestLogin:
    """Tests for /auth/login endpoint."""

    def test_login_success(self, client: TestClient, admin_user: User):
        """Test successful login with valid credentials."""
        response = client.post(
            "/api/auth/login",
            json={"phone": "9999999999", "password": "admin123"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_password(self, client: TestClient, admin_user: User):
        """Test login with wrong password."""
        response = client.post(
            "/api/auth/login",
            json={"phone": "9999999999", "password": "wrongpassword"}
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_login_nonexistent_user(self, client: TestClient, db: Session):
        """Test login with phone that doesn't exist."""
        response = client.post(
            "/api/auth/login",
            json={"phone": "0000000000", "password": "anypassword"}
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_login_pending_approval(self, client: TestClient, pending_user: User):
        """Test login for user pending approval."""
        response = client.post(
            "/api/auth/login",
            json={"phone": "6666666666", "password": "pending123"}
        )

        assert response.status_code == 403
        assert "pending approval" in response.json()["detail"].lower()

    def test_login_inactive_user(self, client: TestClient, db: Session, admin_user: User):
        """Test login for deactivated user."""
        admin_user.is_active = False
        db.commit()

        response = client.post(
            "/api/auth/login",
            json={"phone": "9999999999", "password": "admin123"}
        )

        assert response.status_code == 403
        assert "deactivated" in response.json()["detail"].lower()


class TestRegistration:
    """Tests for /register endpoint."""

    def test_register_success(self, client: TestClient, db: Session):
        """Test successful user registration."""
        response = client.post(
            "/api/register/",
            json={
                "name": "New Student",
                "phone": "1234567890",
                "password": "newpass123",
                "email": "new@test.com",
                "role": "STUDENT"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending_approval"
        assert "user_id" in data

        # Verify user was created with pending status
        user = db.query(User).filter(User.phone == "1234567890").first()
        assert user is not None
        assert user.approval_status == ApprovalStatus.PENDING
        assert user.is_approved is False

    def test_register_duplicate_phone(self, client: TestClient, admin_user: User):
        """Test registration with existing phone number."""
        response = client.post(
            "/api/register/",
            json={
                "name": "Duplicate User",
                "phone": "9999999999",  # Admin's phone
                "password": "pass123",
                "role": "STUDENT"
            }
        )

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_invalid_role(self, client: TestClient, db: Session):
        """Test registration with disallowed role."""
        response = client.post(
            "/api/register/",
            json={
                "name": "Admin Wannabe",
                "phone": "1111111111",
                "password": "pass123",
                "role": "ADMIN"  # Public registration shouldn't allow admin
            }
        )

        assert response.status_code == 422

    def test_register_short_password(self, client: TestClient, db: Session):
        """Test registration with password too short."""
        response = client.post(
            "/api/register/",
            json={
                "name": "Short Pass",
                "phone": "2222222222",
                "password": "123",  # Too short
                "role": "STUDENT"
            }
        )

        assert response.status_code == 422

    def test_check_registration_status(self, client: TestClient, pending_user: User):
        """Test checking registration status."""
        response = client.get("/api/register/status/6666666666")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == ApprovalStatus.PENDING
        # Phone should be masked
        assert "****" in data["phone"]


class TestPasswordReset:
    """Tests for password reset endpoints."""

    def test_request_password_reset(self, client: TestClient, admin_user: User):
        """Test requesting password reset OTP."""
        response = client.post(
            "/api/auth/password-reset/request",
            json={"phone": "9999999999"}
        )

        assert response.status_code == 200
        # Response is intentionally vague for security
        assert "OTP" in response.json()["message"]

    def test_request_password_reset_nonexistent_user(self, client: TestClient, db: Session):
        """Test requesting password reset for non-existent phone."""
        response = client.post(
            "/api/auth/password-reset/request",
            json={"phone": "0000000000"}
        )

        # Should return success even if user doesn't exist (security)
        assert response.status_code == 200
