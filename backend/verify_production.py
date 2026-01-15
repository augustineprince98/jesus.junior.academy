#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Production Readiness Verification Script
Jesus Junior Academy ERP System

This script verifies that the application is ready for production deployment.
Run this before deploying to production.
"""

import sys
import os
from pathlib import Path
from typing import List, Tuple

# Fix Windows console encoding
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())


class ProductionVerifier:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warnings = 0

    def check(self, name: str, condition: bool, error_msg: str = "", warning: bool = False) -> bool:
        """Perform a single check."""
        if condition:
            print(f"✅ {name}")
            self.passed += 1
            return True
        else:
            if warning:
                print(f"⚠️  {name}")
                if error_msg:
                    print(f"   → {error_msg}")
                self.warnings += 1
            else:
                print(f"❌ {name}")
                if error_msg:
                    print(f"   → {error_msg}")
                self.failed += 1
            return False

    def print_summary(self):
        """Print verification summary."""
        print("\n" + "="*60)
        print("VERIFICATION SUMMARY")
        print("="*60)
        print(f"✅ Passed:   {self.passed}")
        print(f"❌ Failed:   {self.failed}")
        print(f"⚠️  Warnings: {self.warnings}")
        print("="*60)

        if self.failed > 0:
            print("\n🚫 PRODUCTION DEPLOYMENT NOT READY")
            print("   Fix the failed checks before deploying to production.")
            return False
        elif self.warnings > 0:
            print("\n⚠️  PRODUCTION DEPLOYMENT READY WITH WARNINGS")
            print("   Review warnings before deploying to production.")
            return True
        else:
            print("\n✅ PRODUCTION DEPLOYMENT READY")
            print("   All checks passed! Safe to deploy.")
            return True


def verify_environment(verifier: ProductionVerifier):
    """Verify environment setup."""
    print("\n🔍 ENVIRONMENT CHECKS")
    print("-" * 60)

    # Check Python version
    import sys
    python_version = sys.version_info
    verifier.check(
        "Python version >= 3.10",
        python_version >= (3, 10),
        f"Current: {python_version.major}.{python_version.minor}.{python_version.micro}"
    )

    # Check .env file
    env_exists = Path(".env").exists()
    verifier.check(
        ".env file exists",
        env_exists,
        "Create .env file with DATABASE_URL and JWT_SECRET"
    )

    if env_exists:
        # Check .env content
        with open(".env", "r") as f:
            env_content = f.read()

        verifier.check(
            "DATABASE_URL configured",
            "DATABASE_URL=" in env_content,
            "Add DATABASE_URL to .env"
        )

        verifier.check(
            "JWT_SECRET configured",
            "JWT_SECRET=" in env_content,
            "Add JWT_SECRET to .env"
        )

        # Security check
        verifier.check(
            "JWT_SECRET is strong (>= 32 chars)",
            len(env_content.split("JWT_SECRET=")[1].split("\n")[0]) >= 32 if "JWT_SECRET=" in env_content else False,
            "Use a strong random secret: python -c \"import secrets; print(secrets.token_hex(32))\"",
            warning=True
        )

    # Check virtual environment
    verifier.check(
        "Virtual environment exists",
        Path(".venv").exists() or Path("venv").exists(),
        "Create virtual environment: python -m venv .venv"
    )

    # Check requirements.txt
    verifier.check(
        "requirements.txt exists",
        Path("requirements.txt").exists(),
        "Generate: pip freeze > requirements.txt"
    )


def verify_database(verifier: ProductionVerifier):
    """Verify database configuration."""
    print("\n🗄️  DATABASE CHECKS")
    print("-" * 60)

    try:
        from app.core.database import engine
        from sqlalchemy import text

        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        verifier.check("Database connection successful", True)

        # Check if tables exist
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema = 'public'"
            ))
            table_count = result.scalar()

        verifier.check(
            "Database tables exist",
            table_count > 0,
            "Run migrations: alembic upgrade head"
        )

    except Exception as e:
        verifier.check(
            "Database connection successful",
            False,
            f"Error: {str(e)}"
        )


def verify_application(verifier: ProductionVerifier):
    """Verify application code."""
    print("\n🔧 APPLICATION CHECKS")
    print("-" * 60)

    # Check if main.py exists
    verifier.check(
        "app/main.py exists",
        Path("app/main.py").exists(),
        "Main application file missing"
    )

    # Try importing the app
    try:
        from app.main import app
        verifier.check("Application imports successfully", True)

        # Check if key routers are registered
        routes = [route.path for route in app.routes]

        verifier.check(
            "/health endpoint exists",
            "/health" in routes,
            "Health endpoint missing"
        )

        verifier.check(
            "/auth/login endpoint exists",
            "/auth/login" in routes,
            "Auth endpoint missing"
        )

        # Check middleware
        middleware_types = [type(m).__name__ for m in app.user_middleware]
        verifier.check(
            "CORS middleware configured",
            "CORSMiddleware" in middleware_types,
            "Add CORS middleware for production",
            warning=True
        )

    except Exception as e:
        verifier.check(
            "Application imports successfully",
            False,
            f"Error: {str(e)}"
        )


def verify_security(verifier: ProductionVerifier):
    """Verify security configuration."""
    print("\n🔒 SECURITY CHECKS")
    print("-" * 60)

    try:
        from app.core import security
        from app.core import config

        # Check password hashing
        verifier.check(
            "Password hashing configured",
            hasattr(security, 'hash_password'),
            "Password hashing function missing"
        )

        # Check JWT configuration
        verifier.check(
            "JWT configuration exists",
            hasattr(security, 'create_access_token'),
            "JWT functions missing"
        )

        # Check settings
        settings = config.settings
        verifier.check(
            "Settings loaded from environment",
            hasattr(settings, 'DATABASE_URL'),
            "Settings not properly configured"
        )

        # CORS warning
        try:
            from app.main import app
            # This is a basic check - manual review recommended
            verifier.check(
                "Review CORS origins for production",
                False,  # Always warn
                "Update CORS allow_origins in app/main.py to specific domains",
                warning=True
            )
        except:
            pass

    except Exception as e:
        verifier.check(
            "Security modules importable",
            False,
            f"Error: {str(e)}"
        )


def verify_migrations(verifier: ProductionVerifier):
    """Verify database migrations."""
    print("\n🔄 MIGRATION CHECKS")
    print("-" * 60)

    import subprocess

    try:
        # Try to import alembic to check if it's installed
        import alembic
        verifier.check("Alembic installed", True)

        # Check current migration using Python module
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "current"],
            capture_output=True,
            text=True
        )
        verifier.check(
            "Database migration status available",
            result.returncode == 0,
            "Check alembic configuration"
        )

        # Check if at head
        if result.returncode == 0:
            if "head" in result.stdout.lower():
                verifier.check("Database at latest migration", True)
            else:
                verifier.check(
                    "Database at latest migration",
                    False,
                    "Run: alembic upgrade head",
                    warning=True
                )

    except ImportError:
        verifier.check(
            "Alembic installed",
            False,
            "Install alembic: pip install alembic"
        )
    except Exception as e:
        verifier.check(
            "Migration check completed",
            False,
            f"Error: {str(e)}",
            warning=True
        )


def verify_files(verifier: ProductionVerifier):
    """Verify required files exist."""
    print("\n📁 FILE STRUCTURE CHECKS")
    print("-" * 60)

    required_files = [
        ("app/__init__.py", False),
        ("app/main.py", False),
        ("app/core/database.py", False),
        ("app/core/config.py", False),
        ("app/core/security.py", False),
        ("app/core/auth.py", False),
        ("alembic.ini", False),
        ("requirements.txt", False),
        (".env", False),
        ("start_server.py", True),  # Optional
        ("PRODUCTION_DEPLOYMENT.md", True),  # Optional
    ]

    for file_path, optional in required_files:
        exists = Path(file_path).exists()
        if optional:
            verifier.check(
                f"{file_path} exists",
                exists,
                f"Recommended: Create {file_path}",
                warning=not exists
            )
        else:
            verifier.check(
                f"{file_path} exists",
                exists,
                f"Required file missing: {file_path}"
            )


def main():
    """Run all verification checks."""
    print("="*60)
    print("PRODUCTION READINESS VERIFICATION")
    print("Jesus Junior Academy ERP System v2.0.0")
    print("="*60)

    verifier = ProductionVerifier()

    verify_environment(verifier)
    verify_files(verifier)
    verify_database(verifier)
    verify_migrations(verifier)
    verify_application(verifier)
    verify_security(verifier)

    verifier.print_summary()

    # Exit with appropriate code
    if verifier.failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
