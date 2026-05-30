-- Migration: Add processing status fields to bloodwork_documents
-- Run against Supabase (PostgreSQL)

BEGIN;

ALTER TABLE public.bloodwork_documents
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (processing_status IN (
    'uploaded',
    'pending',
    'parsing',
    'extracting',
    'generating_trends',
    'generating_recommendations',
    'complete',
    'failed'
  )),
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_progress NUMERIC(5,2);

-- Backfill existing rows to uploaded state where null (safety)
UPDATE public.bloodwork_documents
SET processing_status = COALESCE(processing_status, 'uploaded')
WHERE processing_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_bloodwork_documents_processing_status
  ON public.bloodwork_documents(processing_status);

COMMIT;
