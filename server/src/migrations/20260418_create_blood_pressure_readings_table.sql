-- Migration: Create blood_pressure_readings table for Omron Evolv integration
-- Date: 2026-04-18
-- Description: Stores blood pressure readings from Omron Evolv via Apple HealthKit

-- Create blood_pressure_readings table
CREATE TABLE IF NOT EXISTS blood_pressure_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  reading_date TIMESTAMP WITH TIME ZONE NOT NULL,
  source VARCHAR(100) DEFAULT 'manual',
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_systolic CHECK (systolic BETWEEN 50 AND 300),
  CONSTRAINT chk_diastolic CHECK (diastolic BETWEEN 30 AND 200),
  CONSTRAINT chk_source CHECK (source IN ('omron_evolv', 'apple_health', 'manual', 'apple_watch'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bp_user_id ON blood_pressure_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_bp_reading_date ON blood_pressure_readings(reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_bp_source ON blood_pressure_readings(source);
CREATE INDEX IF NOT EXISTS idx_bp_user_date ON blood_pressure_readings(user_id, reading_date DESC);

-- Add table and column comments
COMMENT ON TABLE blood_pressure_readings IS 'Blood pressure readings from devices (Omron Evolv, Apple Watch) via Apple HealthKit or manual entry';
COMMENT ON COLUMN blood_pressure_readings.id IS 'Unique identifier for the reading';
COMMENT ON COLUMN blood_pressure_readings.user_id IS 'User ID who owns this reading';
COMMENT ON COLUMN blood_pressure_readings.systolic IS 'Systolic blood pressure in mmHg (50-300)';
COMMENT ON COLUMN blood_pressure_readings.diastolic IS 'Diastolic blood pressure in mmHg (30-200)';
COMMENT ON COLUMN blood_pressure_readings.reading_date IS 'Timestamp when the reading was taken';
COMMENT ON COLUMN blood_pressure_readings.source IS 'Data source: omron_evolv, apple_health, manual, apple_watch';
COMMENT ON COLUMN blood_pressure_readings.synced_at IS 'Timestamp when the reading was synced to the backend';
COMMENT ON COLUMN blood_pressure_readings.created_at IS 'Timestamp when the record was created in the database';

-- Rollback script (for reference):
-- DROP TABLE IF EXISTS blood_pressure_readings;
