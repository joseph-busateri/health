-- Migration: Add totalCholesterol column to bloodwork_results table
-- Run against Supabase (PostgreSQL)

BEGIN;

-- Add totalCholesterol column to bloodwork_results table
ALTER TABLE public.bloodwork_results
  ADD COLUMN IF NOT EXISTS total_cholesterol DECIMAL(10, 4);

-- Add comment
COMMENT ON COLUMN public.bloodwork_results.total_cholesterol IS 'Total cholesterol value (mg/dL) - populated when available from lab results';

COMMIT;
