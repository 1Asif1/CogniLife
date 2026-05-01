-- Migration: Change activity_level from VARCHAR to INT
-- This migration updates the daily_logs table to use integer activity levels (1-5)
-- instead of string values ('low', 'moderate', 'high')

-- Step 1: Add a temporary column for the new integer values
ALTER TABLE public.daily_logs ADD COLUMN activity_level_int INTEGER;

-- Step 2: Convert existing string values to integer values
-- Mapping: 'low' -> 1, 'moderate' -> 3, 'high' -> 5
UPDATE public.daily_logs 
SET activity_level_int = CASE 
    WHEN activity_level = 'low' THEN 1
    WHEN activity_level = 'moderate' THEN 3
    WHEN activity_level = 'high' THEN 5
    ELSE 1  -- Default to low for any other values
END
WHERE activity_level IS NOT NULL;

-- Step 3: Drop the old VARCHAR column
ALTER TABLE public.daily_logs DROP COLUMN activity_level;

-- Step 4: Rename the new column to the original name
ALTER TABLE public.daily_logs RENAME COLUMN activity_level_int TO activity_level;

-- Step 5: Add a default value for new records
ALTER TABLE public.daily_logs ALTER COLUMN activity_level SET DEFAULT 1;

-- Step 6: Add a check constraint to ensure values are between 1 and 5
ALTER TABLE public.daily_logs ADD CONSTRAINT check_activity_level_range 
CHECK (activity_level >= 1 AND activity_level <= 5);

-- Verification query (run this to verify the migration)
-- SELECT activity_level, COUNT(*) FROM public.daily_logs GROUP BY activity_level;
