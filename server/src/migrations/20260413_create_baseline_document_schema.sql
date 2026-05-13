-- Create comprehensive baseline document schema (Phase 0-20 alignment)
-- All statements are additive and will not modify existing baseline_profile data

BEGIN;

-- ============================================================================
-- BASELINE DOCUMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS baseline_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  file_reference TEXT,
  storage_path TEXT,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('pdf', 'docx', 'txt', 'manual_entry')),
  parse_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'completed', 'failed')),
  extraction_confidence NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- BASELINE PROFILES (document-derived snapshot)
-- ============================================================================
CREATE TABLE IF NOT EXISTS baseline_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  document_id UUID NOT NULL REFERENCES baseline_documents(id) ON DELETE CASCADE,
  demographics JSONB,
  training_context JSONB,
  lifestyle_context JSONB,
  overall_health_goals JSONB,
  sexual_performance_goals JSONB,
  workout_goals JSONB,
  secondary_goals JSONB,
  priority_order JSONB,
  extracted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(document_id)
);

-- ============================================================================
-- BASELINE EXTRACTED SECTIONS (audit trail of OCR / parsing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS baseline_extracted_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  document_id UUID NOT NULL REFERENCES baseline_documents(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  normalized_name VARCHAR(255) NOT NULL,
  extraction_confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- BASELINE CHANGE LOG (manual / agent refinements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS baseline_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  baseline_profile_id UUID NOT NULL REFERENCES baseline_profiles(id) ON DELETE CASCADE,
  field_name VARCHAR(255) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_source VARCHAR(50) NOT NULL CHECK (change_source IN ('document_upload', 'agent_refinement', 'user_correction', 'system_update')),
  rationale TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_baseline_documents_user ON baseline_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_baseline_documents_status ON baseline_documents(parse_status);
CREATE INDEX IF NOT EXISTS idx_baseline_documents_created ON baseline_documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_baseline_profiles_user ON baseline_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_baseline_profiles_document ON baseline_profiles(document_id);
CREATE INDEX IF NOT EXISTS idx_baseline_profiles_created ON baseline_profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_baseline_extracted_sections_user ON baseline_extracted_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_baseline_extracted_sections_document ON baseline_extracted_sections(document_id);
CREATE INDEX IF NOT EXISTS idx_baseline_extracted_sections_normalized ON baseline_extracted_sections(normalized_name);

CREATE INDEX IF NOT EXISTS idx_baseline_change_log_user ON baseline_change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_baseline_change_log_profile ON baseline_change_log(baseline_profile_id);
CREATE INDEX IF NOT EXISTS idx_baseline_change_log_changed_at ON baseline_change_log(changed_at DESC);

-- ============================================================================
-- UPDATED_AT TRIGGERS (idempotent)
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_baseline_documents_timestamp
BEFORE UPDATE ON baseline_documents
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_baseline_profiles_timestamp
BEFORE UPDATE ON baseline_profiles
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

COMMIT;
