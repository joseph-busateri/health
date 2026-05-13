-- Mock Blood Pressure Data for Testing
-- This script inserts sample blood pressure readings for testing the automatic sync feature
-- Run this in Supabase SQL Editor or your PostgreSQL client

-- Insert mock blood pressure readings
INSERT INTO blood_pressure_readings (user_id, systolic, diastolic, reading_date, source, synced_at, created_at) VALUES
  -- Normal blood pressure readings (from Apple Health via Omron)
  ('00000000-0000-0000-0000-000000000001', 118, 74, '2026-04-25 08:30:00+00', 'apple_health', '2026-04-25 08:35:00+00', '2026-04-25 08:35:00+00'),
  ('00000000-0000-0000-0000-000000000001', 120, 76, '2026-04-24 08:15:00+00', 'apple_health', '2026-04-24 08:20:00+00', '2026-04-24 08:20:00+00'),
  ('00000000-0000-0000-0000-000000000001', 119, 75, '2026-04-23 08:45:00+00', 'apple_health', '2026-04-23 08:50:00+00', '2026-04-23 08:50:00+00'),
  
  -- Elevated blood pressure reading
  ('00000000-0000-0000-0000-000000000001', 128, 82, '2026-04-22 19:30:00+00', 'apple_health', '2026-04-22 19:35:00+00', '2026-04-22 19:35:00+00'),
  
  -- High blood pressure reading (stage 1)
  ('00000000-0000-0000-0000-000000000001', 135, 88, '2026-04-21 07:00:00+00', 'apple_health', '2026-04-21 07:05:00+00', '2026-04-21 07:05:00+00'),
  
  -- Manual entry for comparison
  ('00000000-0000-0000-0000-000000000001', 122, 78, '2026-04-20 12:00:00+00', 'manual', '2026-04-20 12:00:00+00', '2026-04-20 12:00:00+00'),
  
  -- Apple Watch reading (if you have an Apple Watch)
  ('00000000-0000-0000-0000-000000000001', 115, 72, '2026-04-19 09:00:00+00', 'apple_watch', '2026-04-19 09:05:00+00', '2026-04-19 09:05:00+00'),
  
  -- More recent readings showing trend
  ('00000000-0000-0000-0000-000000000001', 117, 73, '2026-04-26 08:00:00+00', 'apple_health', '2026-04-26 08:05:00+00', '2026-04-26 08:05:00+00'),
  ('00000000-0000-0000-0000-000000000001', 116, 74, '2026-04-27 08:30:00+00', 'apple_health', '2026-04-27 08:35:00+00', '2026-04-27 08:35:00+00'),
  ('00000000-0000-0000-0000-000000000001', 115, 73, '2026-04-28 08:15:00+00', 'apple_health', '2026-04-28 08:20:00+00', '2026-04-28 08:20:00+00');

-- Verify the data was inserted
SELECT 
  user_id,
  systolic,
  diastolic,
  reading_date,
  source,
  synced_at,
  created_at
FROM blood_pressure_readings
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY reading_date DESC;

-- Get BP statistics for the user
SELECT 
  COUNT(*) as total_readings,
  AVG(systolic) as avg_systolic,
  AVG(diastolic) as avg_diastolic,
  MIN(systolic) as min_systolic,
  MAX(systolic) as max_systolic,
  MIN(diastolic) as min_diastolic,
  MAX(diastolic) as max_diastolic,
  source
FROM blood_pressure_readings
WHERE user_id = '00000000-0000-0000-0000-000000000001'
GROUP BY source;

-- Get most recent reading
SELECT 
  systolic,
  diastolic,
  reading_date,
  source
FROM blood_pressure_readings
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY reading_date DESC
LIMIT 1;

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
