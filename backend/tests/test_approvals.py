"""
User Approval Tests

Tests for admin approval/rejection of user registrations.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User, ApprovalStatus


class TestPendingApprovals:
    """Tests for viewing pending approvals."""

    def test_get_pending_approvals_as_admin(
        self, client: TestClient, admin_token: str, pending_user: User
    ):
        """Test admin can view pending approvals."""
        response = client.get(
            "/api/users/pending-approvals",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        # Check pending user is in list
        phones = [u["phone"] for u in data]
        assert "6666666666" in phones

    def test_get_pending_approvals_as_teacher(
        self, client: TestClient, teacher_token: str, pending_user: User
    ):
        """Test teacher cannot view pending approvals."""
        response = client.get(
            "/api/users/pending-approvals",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )

        assert response.status_code == 403

    def test_get_pending_approvals_unauthorized(self, client: TestClient, pending_user: User):
        """Test unauthenticated request is rejected."""
        response = client.get("/api/users/pending-approvals")

        assert response.status_code == 401


class TestApproveUser:
    """Tests for approving users."""

    def test_approve_user_success(
        self, client: TestClient, db: Session, admin_token: str, pending_user: User
    ):
        """Test admin can approve a pending user."""
        response = client.post(
            f"/api/users/{pending_user.id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 200
        assert "approved" in response.json()["message"].lower()

        # Verify user was updated
        db.refresh(pending_user)
        assert pending_user.is_approved is True
        assert pending_user.approval_status == ApprovalStatus.APPROVED
        assert pending_user.approved_at is not None

    def test_approve_already_approved_user(
        self, client: TestClient, admin_token: str, student_user: User
    ):
        """Test approving an already approved user."""
        response = client.post(
            f"/api/users/{student_user.id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        # Should still return success or indicate already approved
        assert response.status_code in [200, 400]

    def test_approve_nonexistent_user(self, client: TestClient, admin_token: str):
        """Test approving a user that doesn't exist."""
        response = client.post(
            "/api/users/99999/approve",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 404


class TestRejectUser:
    """Tests for rejecting users."""

    def test_reject_user_success(
        self, client: TestClient, db: Session, admin_token: str, pending_user: User
    ):
        """Test admin can reject a pending user."""
        response = client.post(
            f"/api/users/{pending_user.id}/reject",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"reason": "Incomplete information"}
        )

        assert response.status_code == 200
        assert "rejected" in response.json()["message"].lower()

        # Verify user was updated
        db.refresh(pending_user)
        assert pending_user.is_approved is False
        assert pending_user.approval_status == ApprovalStatus.REJECTED
        assert pending_user.rejection_reason == "Incomplete information"

    def test_reject_without_reason(
        self, client: TestClient, db: Session, admin_token: str, pending_user: User
    ):
        """Test rejecting user without providing a reason."""
        response = client.post(
            f"/api/users/{pending_user.id}/reject",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={}
        )

        # Should either require reason or accept empty
        assert response.status_code in [200, 422]


class TestApprovalStats:
    """Tests for approval statistics."""

    def test_get_approval_stats(
        self, client: TestClient, admin_token: str, pending_user: User
    ):
        """Test admin can view approval stats."""
        response = client.get(
            "/api/users/approval-stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "pending" in data
        assert data["pending"] >= 1


class TestApprovedUserLogin:
    """Tests for login after approval."""

    def test_user_can_login_after_approval(
        self, client: TestClient, db: Session, admin_token: str, pending_user: User
    ):
        """Test that approved user can then login."""
        # First approve the user
        client.post(
            f"/api/users/{pending_user.id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        # Now try to login
        response = client.post(
            "/api/auth/login",
            json={"phone": "6666666666", "password": "pending123"}
        )

        assert response.status_code == 200
        assert "access_token" in response.json()
