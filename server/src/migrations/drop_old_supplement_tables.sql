-- Migration: Drop OLD Supplement System Tables
-- Date: 2026-03-30
-- Purpose: Remove deprecated supplement_baseline and supplement_items tables after migration to NEW system

-- IMPORTANT: Only run this after verifying:
-- 1. All data has been migrated to supplement_stack_versions + supplements
-- 2. All services are using the NEW system
-- 3. No active references to OLD tables exist

-- Verification queries (run these first):
-- SELECT COUNT(*) FROM supplement_baseline;
-- SELECT COUNT(*) FROM supplement_items;
-- SELECT COUNT(*) FROM supplement_change_log;

-- If counts are 0 or data is no longer needed, proceed with drop

-- ============================================================================
-- DROP OLD SYSTEM TABLES
-- ============================================================================

-- Drop dependent tables first
DROP TABLE IF EXISTS supplement_change_log CASCADE;
DROP TABLE IF EXISTS supplement_items CASCADE;
DROP TABLE IF EXISTS supplement_baseline CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables are dropped
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('supplement_baseline', 'supplement_items', 'supplement_change_log')
  ) THEN
    RAISE EXCEPTION 'OLD supplement tables still exist!';
  ELSE
    RAISE NOTICE 'OLD supplement tables successfully dropped';
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON SCHEMA public IS 'OLD supplement system tables (supplement_baseline, supplement_items, supplement_change_log) have been dropped. System now uses supplement_stack_versions + supplements.';
