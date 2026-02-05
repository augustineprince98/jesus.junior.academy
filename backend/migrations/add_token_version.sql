-- Migration: Add token_version column to users table
-- This enables JWT token invalidation on password change/deletion

ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0 NOT NULL;

-- Update any NULL values (shouldn't exist, but safety)
UPDATE users SET token_version = 0 WHERE token_version IS NULL;
