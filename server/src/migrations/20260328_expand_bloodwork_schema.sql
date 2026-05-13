-- Migration: Expand bloodwork schema for richer metadata, panels, and results
-- Run against Supabase (PostgreSQL)

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Expand bloodwork document metadata storage
-- ---------------------------------------------------------------------------
ALTER TABLE public.bloodwork_documents
  ADD COLUMN IF NOT EXISTS lab_name TEXT,
  ADD COLUMN IF NOT EXISTS accession_number TEXT,
  ADD COLUMN IF NOT EXISTS physician_name TEXT,
  ADD COLUMN IF NOT EXISTS patient_sex TEXT,
  ADD COLUMN IF NOT EXISTS patient_dob DATE,
  ADD COLUMN IF NOT EXISTS specimen_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS final_reported_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_status TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT,
  ADD COLUMN IF NOT EXISTS panel_names_detected TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_bloodwork_documents_lab_name
  ON public.bloodwork_documents(lab_name);
CREATE INDEX IF NOT EXISTS idx_bloodwork_documents_specimen_datetime
  ON public.bloodwork_documents(specimen_datetime);
CREATE INDEX IF NOT EXISTS idx_bloodwork_documents_final_reported_datetime
  ON public.bloodwork_documents(final_reported_datetime);

-- ---------------------------------------------------------------------------
-- 2. Panel support
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bloodwork_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.bloodwork_documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  panel_name TEXT NOT NULL,
  panel_category TEXT,
  panel_datetime TIMESTAMPTZ,
  panel_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bloodwork_panels_document_id
  ON public.bloodwork_panels(document_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_panels_user_id
  ON public.bloodwork_panels(user_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_panels_panel_name
  ON public.bloodwork_panels(panel_name);

ALTER TABLE public.bloodwork_panels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.bloodwork_panels;
CREATE POLICY "Service role full access" ON public.bloodwork_panels
  FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

DROP POLICY IF EXISTS "Users can view own panels" ON public.bloodwork_panels;
CREATE POLICY "Users can view own panels" ON public.bloodwork_panels
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own panels" ON public.bloodwork_panels;
CREATE POLICY "Users can insert own panels" ON public.bloodwork_panels
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own panels" ON public.bloodwork_panels;
CREATE POLICY "Users can update own panels" ON public.bloodwork_panels
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own panels" ON public.bloodwork_panels;
CREATE POLICY "Users can delete own panels" ON public.bloodwork_panels
  FOR DELETE USING (auth.uid()::text = user_id);

GRANT ALL ON public.bloodwork_panels TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bloodwork_panels TO authenticated;

DROP TRIGGER IF EXISTS handle_bloodwork_panels_updated_at ON public.bloodwork_panels;
CREATE TRIGGER handle_bloodwork_panels_updated_at
  BEFORE UPDATE ON public.bloodwork_panels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Expand bloodwork results storage
-- ---------------------------------------------------------------------------
ALTER TABLE public.bloodwork_results
  ADD COLUMN IF NOT EXISTS panel_id UUID REFERENCES public.bloodwork_panels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS panel_name TEXT,
  ADD COLUMN IF NOT EXISTS sub_category TEXT,
  ADD COLUMN IF NOT EXISTS abnormal_flag_source TEXT,
  ADD COLUMN IF NOT EXISTS lab_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_lab TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Preserve existing data while widening abnormal_flag to TEXT to store raw lab flags
ALTER TABLE public.bloodwork_results
  ALTER COLUMN abnormal_flag TYPE TEXT USING
    CASE
      WHEN abnormal_flag IS NULL THEN NULL
      WHEN LOWER(abnormal_flag::text) IN ('t', 'true') THEN 'true'
      WHEN LOWER(abnormal_flag::text) IN ('f', 'false') THEN 'false'
      ELSE NULL
    END;

CREATE INDEX IF NOT EXISTS idx_bloodwork_results_panel_id
  ON public.bloodwork_results(panel_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_panel_name
  ON public.bloodwork_results(panel_name);
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_sub_category
  ON public.bloodwork_results(sub_category);
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_lab_timestamp
  ON public.bloodwork_results(lab_timestamp) WHERE lab_timestamp IS NOT NULL;

COMMIT;
