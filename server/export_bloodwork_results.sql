-- ============================================================================
-- Bloodwork Results Export SQL
-- ============================================================================
-- This script provides multiple ways to export bloodwork_results data
-- Run these queries in Supabase SQL Editor or via psql
-- ============================================================================

-- ============================================================================
-- OPTION 1: Simple Export - All Results
-- ============================================================================
SELECT 
  id,
  document_id,
  user_id,
  raw_test_name,
  normalized_test_name,
  category,
  value_text,
  value_numeric,
  unit,
  reference_range_low,
  reference_range_high,
  reference_range_text,
  abnormal_flag,
  confidence,
  test_date,
  source,
  created_at,
  updated_at
FROM bloodwork_results
ORDER BY user_id, test_date DESC, raw_test_name;

-- ============================================================================
-- OPTION 2: Export with Document Context (Joins with bloodwork_documents)
-- ============================================================================
SELECT 
  br.id,
  br.user_id,
  bd.file_name,
  bd.upload_date,
  bd.test_date as document_test_date,
  br.raw_test_name,
  br.normalized_test_name,
  br.category,
  br.value_text,
  br.value_numeric,
  br.unit,
  br.reference_range_low,
  br.reference_range_high,
  br.reference_range_text,
  br.abnormal_flag,
  br.confidence,
  br.test_date,
  br.source,
  br.created_at,
  br.updated_at
FROM bloodwork_results br
JOIN bloodwork_documents bd ON br.document_id = bd.id
ORDER BY br.user_id, br.test_date DESC, br.raw_test_name;

-- ============================================================================
-- OPTION 3: Export for Specific User
-- ============================================================================
-- Replace 'YOUR_USER_ID' with actual user ID
SELECT 
  id,
  document_id,
  user_id,
  raw_test_name,
  normalized_test_name,
  category,
  value_text,
  value_numeric,
  unit,
  reference_range_low,
  reference_range_high,
  reference_range_text,
  abnormal_flag,
  confidence,
  test_date,
  source,
  created_at,
  updated_at
FROM bloodwork_results
WHERE user_id = 'YOUR_USER_ID'
ORDER BY test_date DESC, raw_test_name;

-- ============================================================================
-- OPTION 4: Export by Category
-- ============================================================================
SELECT 
  user_id,
  category,
  COUNT(*) as result_count,
  MIN(test_date) as earliest_test_date,
  MAX(test_date) as latest_test_date
FROM bloodwork_results
WHERE category IS NOT NULL
GROUP BY user_id, category
ORDER BY user_id, category;

-- ============================================================================
-- OPTION 5: Export Abnormal Results Only
-- ============================================================================
SELECT 
  br.id,
  br.user_id,
  bd.file_name,
  br.raw_test_name,
  br.normalized_test_name,
  br.category,
  br.value_text,
  br.value_numeric,
  br.unit,
  br.reference_range_low,
  br.reference_range_high,
  br.reference_range_text,
  br.abnormal_flag,
  br.confidence,
  br.test_date,
  br.source
FROM bloodwork_results br
JOIN bloodwork_documents bd ON br.document_id = bd.id
WHERE br.abnormal_flag = 'true'
ORDER BY br.user_id, br.test_date DESC, br.raw_test_name;

-- ============================================================================
-- OPTION 6: Export as CSV (PostgreSQL COPY command)
-- ============================================================================
-- NOTE: This requires superuser privileges (pg_write_server_files role)
-- This WILL NOT work in Supabase SQL Editor
-- 
-- Alternative: Use Supabase SQL Editor UI "Download as CSV" button
-- Or use psql with \copy command (works for anyone)
--
-- For psql (from command line):
-- \copy (SELECT id, document_id, user_id, raw_test_name, normalized_test_name, category, value_text, value_numeric, unit, reference_range_low, reference_range_high, reference_range_text, abnormal_flag, confidence, test_date, source, created_at, updated_at FROM bloodwork_results ORDER BY user_id, test_date DESC, raw_test_name) TO 'bloodwork_results_export.csv' CSV HEADER

-- The following COPY command is DISABLED for Supabase - use alternatives above
-- COPY (
--   SELECT 
--     id,
--     document_id,
--     user_id,
--     raw_test_name,
--     normalized_test_name,
--     category,
--     value_text,
--     value_numeric,
--     unit,
--     reference_range_low,
--     reference_range_high,
--     reference_range_text,
--     abnormal_flag,
--     confidence,
--     test_date,
--     source,
--     created_at,
--     updated_at
--   FROM bloodwork_results
--   ORDER BY user_id, test_date DESC, raw_test_name
-- ) TO '/tmp/bloodwork_results_export.csv' 
-- WITH (FORMAT CSV, HEADER, DELIMITER ',');

-- ============================================================================
-- OPTION 7: Export with Test Date Range Filter
-- ============================================================================
SELECT 
  br.id,
  br.user_id,
  bd.file_name,
  br.raw_test_name,
  br.normalized_test_name,
  br.category,
  br.value_text,
  br.value_numeric,
  br.unit,
  br.reference_range_low,
  br.reference_range_high,
  br.reference_range_text,
  br.abnormal_flag,
  br.confidence,
  br.test_date,
  br.source,
  br.created_at
FROM bloodwork_results br
JOIN bloodwork_documents bd ON br.document_id = bd.id
WHERE br.test_date >= '2024-01-01'  -- Adjust start date as needed
  AND br.test_date <= '2026-12-31'  -- Adjust end date as needed
ORDER BY br.user_id, br.test_date DESC, br.raw_test_name;

-- ============================================================================
-- OPTION 8: Export Summary Statistics
-- ============================================================================
SELECT 
  user_id,
  COUNT(*) as total_results,
  COUNT(CASE WHEN abnormal_flag = 'true' THEN 1 END) as abnormal_results,
  COUNT(DISTINCT document_id) as total_documents,
  COUNT(DISTINCT category) as categories_tested,
  MIN(test_date) as earliest_test,
  MAX(test_date) as latest_test,
  AVG(confidence) as avg_confidence
FROM bloodwork_results
GROUP BY user_id
ORDER BY user_id;

-- ============================================================================
-- OPTION 9: Export for Data Migration/Backup
-- ============================================================================
-- This includes all columns in the exact order for easy re-insertion
SELECT 
  id,
  document_id,
  user_id,
  raw_test_name,
  normalized_test_name,
  category,
  value_text,
  value_numeric,
  unit,
  reference_range_low,
  reference_range_high,
  reference_range_text,
  abnormal_flag,
  confidence,
  test_date,
  source,
  created_at,
  updated_at
FROM bloodwork_results
ORDER BY created_at;

-- ============================================================================
-- OPTION 10: Export with Value Formatting
-- ============================================================================
SELECT 
  br.user_id,
  br.raw_test_name,
  br.normalized_test_name,
  br.category,
  CASE 
    WHEN br.value_numeric IS NOT NULL THEN CAST(br.value_numeric AS TEXT)
    ELSE br.value_text 
  END as value,
  br.unit,
  br.reference_range_text,
  CASE 
    WHEN br.abnormal_flag = 'true' THEN 'ABNORMAL'
    ELSE 'NORMAL'
  END as status,
  br.test_date,
  bd.file_name
FROM bloodwork_results br
JOIN bloodwork_documents bd ON br.document_id = bd.id
ORDER BY br.user_id, br.test_date DESC, br.raw_test_name;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
-- 
-- For Supabase SQL Editor:
-- 1. Open Supabase dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste one of the queries above
-- 4. Run the query
-- 5. Export results using the "Download as CSV" button
--
-- For psql command line:
-- 1. Connect to your database: psql -h your-host -U your-user -d your-database
-- 2. Copy and paste one of the queries
-- 3. For CSV export, use OPTION 6 (COPY command)
--
-- For application code:
-- 1. Use the queries in your application code
-- 2. Execute via your database client library
-- 3. Process results as needed
--
-- ============================================================================
