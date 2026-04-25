-- Mock Blood Pressure Data for Testing
-- This script inserts a single blood pressure reading with heart rate for testing
-- Run this in Supabase SQL Editor or your PostgreSQL client
-- NOTE: Make sure to run the migration 20260425_add_heart_rate_to_blood_pressure.sql first to add the heart_rate column

-- Insert a single mock blood pressure reading with heart rate
INSERT INTO blood_pressure_readings (user_id, systolic, diastolic, heart_rate, reading_date, source, synced_at, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 118, 74, 72, '2026-04-25 08:30:00+00', 'apple_health', '2026-04-25 08:35:00+00', '2026-04-25 08:35:00+00');

-- Verify the data was inserted
SELECT 
  user_id,
  systolic,
  diastolic,
  heart_rate,
  reading_date,
  source,
  synced_at,
  created_at
FROM blood_pressure_readings
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY reading_date DESC;
