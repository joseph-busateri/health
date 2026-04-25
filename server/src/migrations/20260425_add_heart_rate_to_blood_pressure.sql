-- Migration: Add heart_rate field to blood_pressure_readings table
-- Date: 2026-04-25
-- Description: Add heart_rate/pulse field to capture complete BP monitor readings

-- Add heart_rate column to blood_pressure_readings table
ALTER TABLE blood_pressure_readings 
ADD COLUMN IF NOT EXISTS heart_rate INTEGER;

-- Add constraint to ensure heart_rate is within reasonable range (30-250 bpm)
ALTER TABLE blood_pressure_readings 
ADD CONSTRAINT chk_heart_rate CHECK (heart_rate IS NULL OR heart_rate BETWEEN 30 AND 250);

-- Add comment to the new column
COMMENT ON COLUMN blood_pressure_readings.heart_rate IS 'Heart rate/pulse in BPM captured during blood pressure measurement (30-250)';

-- Rollback script (for reference):
-- ALTER TABLE blood_pressure_readings DROP CONSTRAINT IF EXISTS chk_heart_rate;
-- ALTER TABLE blood_pressure_readings DROP COLUMN IF EXISTS heart_rate;
