-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add preferred_language to users table
-- Run this once in Supabase → SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS logic via DO block)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Add preferred_language column only if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE users
      ADD COLUMN preferred_language TEXT NOT NULL DEFAULT 'en';

    COMMENT ON COLUMN users.preferred_language IS
      'BCP-47 language code selected by the user, e.g. en, hi, kn, ta';
  END IF;
END
$$;

-- Optional: index for analytics queries (e.g. "how many Hindi users?")
CREATE INDEX IF NOT EXISTS idx_users_preferred_language
  ON users (preferred_language);