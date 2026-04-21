-- ============================================================
-- Migration: Update daily_logs table schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop old columns
ALTER TABLE daily_logs
  DROP COLUMN IF EXISTS sleep_duration,
  DROP COLUMN IF EXISTS mood,
  DROP COLUMN IF EXISTS stress_level,
  DROP COLUMN IF EXISTS energy_level,
  DROP COLUMN IF EXISTS sleep_quality;

-- Step 2: Add new columns
ALTER TABLE daily_logs
  ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS screen_time FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_night_usage FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sleep_hours FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activity_level VARCHAR(20) DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS sitting_time FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inactivity_periods INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meals_per_day INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS calorie_intake INT DEFAULT 0;

-- Step 3: Add unique constraint for one log per user per day (enables upsert)
ALTER TABLE daily_logs
  ADD CONSTRAINT daily_logs_user_date_unique UNIQUE (user_id, date);

-- Step 4: Create index on date for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);
