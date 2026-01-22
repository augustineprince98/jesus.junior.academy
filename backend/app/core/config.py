from pydantic_settings import BaseSettings
import os
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
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
        # Strip quotes from JWT_SECRET if present
        if self.JWT_SECRET:
            self.JWT_SECRET = self.JWT_SECRET.strip('"').strip("'")
        # Strip quotes from CORS_ORIGINS if present
        if self.CORS_ORIGINS:
            self.CORS_ORIGINS = self.CORS_ORIGINS.strip('"').strip("'")
        
        logger.info(f"Database URL configured: {self.DATABASE_URL[:30]}...")
        logger.info(f"CORS Origins: {self.CORS_ORIGINS}")


settings = Settings()
