#!/usr/bin/env python3
"""
Production server startup script for Jesus Junior Academy ERP
Author: System Engineer
Last Updated: 2026-01-14
"""

import os
import sys
import subprocess
from pathlib import Path


def check_environment():
    """Verify environment setup before starting server."""
    print("🔍 Checking environment...")

    # Check if .env file exists
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ ERROR: .env file not found!")
        print("   Please create .env with DATABASE_URL and JWT_SECRET")
        sys.exit(1)

    # Check if virtual environment is activated or exists
    venv_path = Path(".venv")
    if not venv_path.exists():
        print("❌ ERROR: Virtual environment not found!")
        print("   Run: python -m venv .venv")
        sys.exit(1)

    print("✅ Environment check passed")


def check_database():
    """Test database connectivity."""
    print("🔍 Checking database connection...")

    try:
        from app.core.database import engine
        from sqlalchemy import text

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connected successfully")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        print("   Please ensure PostgreSQL is running and credentials are correct")
        return False


def run_migrations():
    """Run database migrations if needed."""
    print("🔄 Checking database migrations...")

    try:
        result = subprocess.run(
            ["alembic", "current"],
            capture_output=True,
            text=True,
            check=False
        )

        if result.returncode == 0:
            print("✅ Migrations up to date")
        else:
            print("⚠️  Migration check failed, attempting to upgrade...")
            subprocess.run(["alembic", "upgrade", "head"], check=True)
            print("✅ Migrations applied successfully")
    except Exception as e:
        print(f"⚠️  Migration error: {str(e)}")
        print("   Continuing with server startup...")


def start_server(host="0.0.0.0", port=8000, workers=4, reload=False):
    """Start the uvicorn server."""
    print(f"\n🚀 Starting Jesus Junior Academy ERP Server...")
    print(f"   Host: {host}")
    print(f"   Port: {port}")
    print(f"   Workers: {workers}")
    print(f"   Reload: {reload}")
    print(f"\n📚 API Documentation: http://{host if host != '0.0.0.0' else 'localhost'}:{port}/docs")
    print(f"💚 Health Check: http://{host if host != '0.0.0.0' else 'localhost'}:{port}/health\n")

    cmd = [
        "uvicorn",
        "app.main:app",
        "--host", host,
        "--port", str(port),
    ]

    if reload:
        cmd.append("--reload")
    else:
        cmd.extend(["--workers", str(workers)])

    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped gracefully")
    except Exception as e:
        print(f"\n❌ Server error: {str(e)}")
        sys.exit(1)


def main():
    """Main startup routine."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Jesus Junior Academy ERP Server"
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host to bind (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind (default: 8000)"
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Number of worker processes (default: 4)"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload for development"
    )
    parser.add_argument(
        "--skip-checks",
        action="store_true",
        help="Skip pre-flight checks"
    )

    args = parser.parse_args()

    print("="*60)
    print("Jesus Junior Academy ERP - Server Startup")
    print("="*60 + "\n")

    if not args.skip_checks:
        check_environment()
        if not check_database():
            print("\n⚠️  Database check failed!")
            response = input("Continue anyway? (y/N): ")
            if response.lower() != 'y':
                sys.exit(1)
        run_migrations()

    print()
    start_server(
        host=args.host,
        port=args.port,
        workers=args.workers,
        reload=args.reload
    )


if __name__ == "__main__":
    main()
