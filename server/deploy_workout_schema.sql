-- Workout Baseline Document Engine Schema
-- Execute this in Supabase SQL Editor

-- Core Tables
CREATE TABLE IF NOT EXISTS public.workout_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    file_reference TEXT,
    storage_path TEXT,
    upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
    document_type TEXT NOT NULL CHECK (document_type IN ('pdf', 'docx', 'txt', 'manual_entry', 'spreadsheet')),
    program_start_date DATE,
    parse_status TEXT NOT NULL DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'completed', 'failed')),
    extraction_confidence DECIMAL(3,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    document_id UUID NOT NULL REFERENCES public.workout_documents(id) ON DELETE CASCADE,
    program_name TEXT,
    split_name TEXT,
    workout_days_per_week INTEGER CHECK (workout_days_per_week >= 1 AND workout_days_per_week <= 7),
    rest_days_per_week INTEGER CHECK (rest_days_per_week >= 0 AND rest_days_per_week <= 6),
    training_style TEXT,
    program_notes TEXT,
    monday_plan TEXT,
    tuesday_plan TEXT,
    wednesday_plan TEXT,
    thursday_plan TEXT,
    friday_plan TEXT,
    saturday_plan TEXT,
    sunday_plan TEXT,
    muscle_group_focus TEXT[],
    frequency_by_muscle_group JSONB,
    planned_volume_notes TEXT,
    planned_intensity_notes TEXT,
    cardio_or_conditioning_notes TEXT,
    mobility_or_recovery_notes TEXT,
    exercises JSONB,
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_extracted_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    document_id UUID NOT NULL REFERENCES public.workout_documents(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    extraction_confidence DECIMAL(3,2) NOT NULL CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    workout_baseline_id UUID NOT NULL REFERENCES public.workout_baselines(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_source TEXT NOT NULL CHECK (change_source IN ('document_upload', 'agent_refinement', 'user_correction', 'system_update')),
    rationale TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workout_documents_user_id ON public.workout_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_documents_created_at ON public.workout_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_documents_user_created ON public.workout_documents(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_baselines_user_id ON public.workout_baselines(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_baselines_document_id ON public.workout_baselines(document_id);
CREATE INDEX IF NOT EXISTS idx_workout_baselines_created_at ON public.workout_baselines(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_baselines_user_created ON public.workout_baselines(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_extracted_sections_user_id ON public.workout_extracted_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_extracted_sections_document_id ON public.workout_extracted_sections(document_id);
CREATE INDEX IF NOT EXISTS idx_workout_change_log_user_id ON public.workout_change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_change_log_baseline_id ON public.workout_change_log(workout_baseline_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_workout_documents_updated_at ON public.workout_documents;
CREATE TRIGGER handle_workout_documents_updated_at
    BEFORE UPDATE ON public.workout_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_workout_baselines_updated_at ON public.workout_baselines;
CREATE TRIGGER handle_workout_baselines_updated_at
    BEFORE UPDATE ON public.workout_baselines
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.workout_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_extracted_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_change_log ENABLE ROW LEVEL SECURITY;

-- Basic policies for service role (bypass RLS for backend)
CREATE POLICY "Service role full access" ON public.workout_documents
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

CREATE POLICY "Service role full access" ON public.workout_baselines
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

CREATE POLICY "Service role full access" ON public.workout_extracted_sections
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

CREATE POLICY "Service role full access" ON public.workout_change_log
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
