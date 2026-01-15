"""
Test Configuration

Pytest fixtures and configuration for testing the backend.
"""

import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.core.roles import Role
from app.models.user import User, ApprovalStatus


# Test database URL - uses SQLite in memory for speed
TEST_DATABASE_URL = "sqlite:///:memory:"

# Create test engine
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create test session factory
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """
    Create a fresh database for each test.
    """
    # Create all tables
    Base.metadata.create_all(bind=test_engine)

    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """
    Create a test client with database dependency override.
    """
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db: Session) -> User:
    """
    Create an admin user for tests.
    """
    user = User(
        name="Test Admin",
        phone="9999999999",
        email="admin@test.com",
        password_hash=hash_password("admin123"),
        role=Role.ADMIN.value,
        is_active=True,
        is_approved=True,
        approval_status=ApprovalStatus.APPROVED,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def teacher_user(db: Session) -> User:
    """
    Create a teacher user for tests.
    """
    user = User(
        name="Test Teacher",
        phone="8888888888",
        email="teacher@test.com",
        password_hash=hash_password("teacher123"),
        role=Role.TEACHER.value,
        is_active=True,
        is_approved=True,
        approval_status=ApprovalStatus.APPROVED,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def student_user(db: Session) -> User:
    """
    Create a student user for tests.
    """
    user = User(
        name="Test Student",
        phone="7777777777",
        email="student@test.com",
        password_hash=hash_password("student123"),
        role=Role.STUDENT.value,
        is_active=True,
        is_approved=True,
        approval_status=ApprovalStatus.APPROVED,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def pending_user(db: Session) -> User:
    """
    Create a pending approval user for tests.
    """
    user = User(
        name="Pending User",
        phone="6666666666",
        email="pending@test.com",
        password_hash=hash_password("pending123"),
        role=Role.STUDENT.value,
        is_active=True,
        is_approved=False,
        approval_status=ApprovalStatus.PENDING,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(client: TestClient, admin_user: User) -> str:
    """
    Get auth token for admin user.
    """
    response = client.post(
        "/api/auth/login",
        json={"phone": "9999999999", "password": "admin123"}
    )
    return response.json()["access_token"]


@pytest.fixture
def teacher_token(client: TestClient, teacher_user: User) -> str:
    """
    Get auth token for teacher user.
    """
    response = client.post(
        "/api/auth/login",
        json={"phone": "8888888888", "password": "teacher123"}
    )
    return response.json()["access_token"]


@pytest.fixture
def student_token(client: TestClient, student_user: User) -> str:
    """
    Get auth token for student user.
    """
    response = client.post(
        "/api/auth/login",
        json={"phone": "7777777777", "password": "student123"}
    )
    return response.json()["access_token"]
