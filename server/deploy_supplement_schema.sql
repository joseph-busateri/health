-- Supplement Stack Baseline Document Engine Schema
-- Execute this in Supabase SQL Editor

-- Core Tables
CREATE TABLE IF NOT EXISTS public.supplement_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    file_reference TEXT,
    storage_path TEXT,
    upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
    document_type TEXT NOT NULL CHECK (document_type IN ('pdf', 'docx', 'txt', 'manual_entry', 'spreadsheet')),
    parse_status TEXT NOT NULL DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'completed', 'failed')),
    extraction_confidence DECIMAL(3,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplement_baseline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    document_id UUID NOT NULL REFERENCES public.supplement_documents(id) ON DELETE CASCADE,
    stack_name TEXT NOT NULL,
    stack_notes TEXT,
    total_active_items INTEGER NOT NULL DEFAULT 0,
    timing_notes TEXT,
    frequency_notes TEXT,
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplement_baseline_id UUID NOT NULL REFERENCES public.supplement_baseline(id) ON DELETE CASCADE,
    supplement_name TEXT NOT NULL,
    dosage DECIMAL(10,3) NOT NULL,
    dosage_unit TEXT NOT NULL,
    frequency TEXT NOT NULL,
    timing TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'removed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplement_extracted_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    document_id UUID NOT NULL REFERENCES public.supplement_documents(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    extraction_confidence DECIMAL(3,2) NOT NULL CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplement_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    supplement_baseline_id UUID NOT NULL REFERENCES public.supplement_baseline(id) ON DELETE CASCADE,
    supplement_item_id UUID REFERENCES public.supplement_items(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_source TEXT NOT NULL CHECK (change_source IN ('document_upload', 'agent_refinement', 'user_correction', 'system_update')),
    rationale TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_supplement_documents_user_id ON public.supplement_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_documents_created_at ON public.supplement_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplement_documents_user_created ON public.supplement_documents(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_supplement_baseline_user_id ON public.supplement_baseline(user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_baseline_document_id ON public.supplement_baseline(document_id);
CREATE INDEX IF NOT EXISTS idx_supplement_baseline_created_at ON public.supplement_baseline(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplement_baseline_user_created ON public.supplement_baseline(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_supplement_items_baseline_id ON public.supplement_items(supplement_baseline_id);
CREATE INDEX IF NOT EXISTS idx_supplement_items_status ON public.supplement_items(status);
CREATE INDEX IF NOT EXISTS idx_supplement_items_name ON public.supplement_items(supplement_name);

CREATE INDEX IF NOT EXISTS idx_supplement_extracted_sections_user_id ON public.supplement_extracted_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_extracted_sections_document_id ON public.supplement_extracted_sections(document_id);
CREATE INDEX IF NOT EXISTS idx_supplement_change_log_user_id ON public.supplement_change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_change_log_baseline_id ON public.supplement_change_log(supplement_baseline_id);
CREATE INDEX IF NOT EXISTS idx_supplement_change_log_item_id ON public.supplement_change_log(supplement_item_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_supplement_documents_updated_at ON public.supplement_documents;
CREATE TRIGGER handle_supplement_documents_updated_at
    BEFORE UPDATE ON public.supplement_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_supplement_baseline_updated_at ON public.supplement_baseline;
CREATE TRIGGER handle_supplement_baseline_updated_at
    BEFORE UPDATE ON public.supplement_baseline
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_supplement_items_updated_at ON public.supplement_items;
CREATE TRIGGER handle_supplement_items_updated_at
    BEFORE UPDATE ON public.supplement_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.supplement_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_baseline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_extracted_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_change_log ENABLE ROW LEVEL SECURITY;

-- Basic policies for service role (bypass RLS for backend)
CREATE POLICY "Service role full access" ON public.supplement_documents
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

CREATE POLICY "Service role full access" ON public.supplement_baseline
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

CREATE POLICY "Service role full access" ON public.supplement_items
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

CREATE POLICY "Service role full access" ON public.supplement_extracted_sections
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

CREATE POLICY "Service role full access" ON public.supplement_change_log
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
