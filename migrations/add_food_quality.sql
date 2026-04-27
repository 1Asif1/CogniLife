-- Add food_quality column to daily_logs table
-- Values: 0 = Poor, 1 = Average, 2 = Good
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS food_quality INT DEFAULT 1;
