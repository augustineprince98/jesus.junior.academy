from pydantic_settings import BaseSettings
import os
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str | None = None
    # Production-safe CORS defaults - only allow known origins
    CORS_ORIGINS: str = "https://jesus-junior-academy.vercel.app,http://localhost:3000"
    SECRET_KEY: str = ""  # Optional, for additional security
    APP_ENV: str = "development"  # development, staging, production

    class Config:
        env_file = ".env"
        extra = "ignore"  # Changed from "forbid" to allow extra env vars

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Strip quotes from DATABASE_URL if present (common issue with env vars)
        if self.DATABASE_URL:
            self.DATABASE_URL = self.DATABASE_URL.strip('"').strip("'")
        
        # Handle JWT_SECRET / SECRET_KEY compatibility
        if not self.JWT_SECRET and self.SECRET_KEY:
            self.JWT_SECRET = self.SECRET_KEY
            
        # If still no secret, use a default for development ONLY
        if not self.JWT_SECRET:
            if self.APP_ENV == "development":
                self.JWT_SECRET = "dev-secret-change-me"
                logger.warning("Using default dev JWT_SECRET. Set JWT_SECRET or SECRET_KEY in env!")
            else:
                 raise ValueError("JWT_SECRET or SECRET_KEY must be set in production!")

        # Strip quotes from JWT_SECRET if present
        if self.JWT_SECRET:
            self.JWT_SECRET = self.JWT_SECRET.strip('"').strip("'")
            
        # Strip quotes from CORS_ORIGINS if present
        if self.CORS_ORIGINS:
            self.CORS_ORIGINS = self.CORS_ORIGINS.strip('"').strip("'")
        
        logger.info(f"Database URL configured: {self.DATABASE_URL[:30]}...")
        logger.info(f"CORS Origins: {self.CORS_ORIGINS}")


settings = Settings()
