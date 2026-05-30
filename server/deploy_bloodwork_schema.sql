-- ===============================================================
-- WAVE 2, STEP 1: BLOODWORK DOCUMENT UPLOAD ENGINE SCHEMA
-- ===============================================================
-- Execute this in Supabase SQL Editor
-- ===============================================================

-- ===============================================================
-- 1. BLOODWORK DOCUMENTS TABLE
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.bloodwork_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    document_type TEXT NOT NULL CHECK (document_type IN ('lab_panel', 'hormone', 'metabolic', 'cardiac', 'liver', 'kidney', 'lipid', 'vitamin', 'comprehensive', 'other')),
    source TEXT NOT NULL CHECK (source IN ('labcorp', 'quest', 'hospital', 'clinic', 'home_test', 'manual_upload', 'other')),
    test_date DATE,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parse_status TEXT NOT NULL DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'parsed', 'failed', 'needs_review')),
    extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
    notes TEXT,
    metadata JSONB, -- Additional document metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================================
-- 2. INDEXES FOR EFFICIENT QUERYING
-- ===============================================================
CREATE INDEX IF NOT EXISTS idx_bloodwork_documents_user_id ON public.bloodwork_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_documents_test_date ON public.bloodwork_documents(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_bloodwork_documents_upload_date ON public.bloodwork_documents(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_bloodwork_documents_parse_status ON public.bloodwork_documents(parse_status);
CREATE INDEX IF NOT EXISTS idx_bloodwork_documents_document_type ON public.bloodwork_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_bloodwork_documents_source ON public.bloodwork_documents(source);
CREATE INDEX IF NOT EXISTS idx_bloodwork_documents_user_test_date ON public.bloodwork_documents(user_id, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_bloodwork_documents_user_upload_date ON public.bloodwork_documents(user_id, upload_date DESC);

-- ===============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ===============================================================
ALTER TABLE public.bloodwork_documents ENABLE ROW LEVEL SECURITY;

-- Policy for service role (full access)
DROP POLICY IF EXISTS "Service role full access" ON public.bloodwork_documents;
CREATE POLICY "Service role full access" ON public.bloodwork_documents
FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- Policy for authenticated users (own data only)
DROP POLICY IF EXISTS "Users can view own bloodwork documents" ON public.bloodwork_documents;
CREATE POLICY "Users can view own bloodwork documents" ON public.bloodwork_documents
FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own bloodwork documents" ON public.bloodwork_documents;
CREATE POLICY "Users can insert own bloodwork documents" ON public.bloodwork_documents
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own bloodwork documents" ON public.bloodwork_documents;
CREATE POLICY "Users can update own bloodwork documents" ON public.bloodwork_documents
FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own bloodwork documents" ON public.bloodwork_documents;
CREATE POLICY "Users can delete own bloodwork documents" ON public.bloodwork_documents
FOR DELETE USING (auth.uid()::text = user_id);

-- ===============================================================
-- 4. GRANT PERMISSIONS
-- ===============================================================
GRANT ALL ON public.bloodwork_documents TO service_role;
GRANT SELECT ON public.bloodwork_documents TO authenticated;
GRANT INSERT ON public.bloodwork_documents TO authenticated;
GRANT UPDATE ON public.bloodwork_documents TO authenticated;
GRANT DELETE ON public.bloodwork_documents TO authenticated;

-- ===============================================================
-- 5. UPDATED_AT TRIGGER
-- ===============================================================

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_bloodwork_documents_updated_at ON public.bloodwork_documents;
CREATE TRIGGER handle_bloodwork_documents_updated_at 
    BEFORE UPDATE ON public.bloodwork_documents 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===============================================================
-- 6. HELPER FUNCTIONS
-- ===============================================================

-- Function to get latest bloodwork document for user
CREATE OR REPLACE FUNCTION public.get_latest_bloodwork_document(
    p_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    file_url TEXT,
    file_name TEXT,
    document_type TEXT,
    source TEXT,
    test_date DATE,
    upload_date TIMESTAMP WITH TIME ZONE,
    parse_status TEXT,
    extraction_confidence DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bd.id,
        bd.file_url,
        bd.file_name,
        bd.document_type,
        bd.source,
        bd.test_date,
        bd.upload_date,
        bd.parse_status,
        bd.extraction_confidence
    FROM public.bloodwork_documents bd
    WHERE bd.user_id = p_user_id
    ORDER BY bd.upload_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get bloodwork documents by date range
CREATE OR REPLACE FUNCTION public.get_bloodwork_documents_by_date_range(
    p_user_id TEXT,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    file_url TEXT,
    file_name TEXT,
    document_type TEXT,
    source TEXT,
    test_date DATE,
    upload_date TIMESTAMP WITH TIME ZONE,
    parse_status TEXT,
    extraction_confidence DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bd.id,
        bd.file_url,
        bd.file_name,
        bd.document_type,
        bd.source,
        bd.test_date,
        bd.upload_date,
        bd.parse_status,
        bd.extraction_confidence
    FROM public.bloodwork_documents bd
    WHERE bd.user_id = p_user_id
        AND (p_start_date IS NULL OR bd.test_date >= p_start_date)
        AND (p_end_date IS NULL OR bd.test_date <= p_end_date)
    ORDER BY bd.test_date DESC, bd.upload_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================
-- 7. VIEWS FOR COMMON QUERIES
-- ===============================================================

-- Latest bloodwork documents per user
CREATE OR REPLACE VIEW public.latest_bloodwork_documents AS
SELECT DISTINCT ON (user_id) 
    bd.*
FROM public.bloodwork_documents bd
ORDER BY user_id, upload_date DESC;

-- Bloodwork documents by status
CREATE OR REPLACE VIEW public.bloodwork_documents_by_status AS
SELECT 
    user_id,
    parse_status,
    COUNT(*) as document_count,
    MAX(upload_date) as latest_upload,
    AVG(extraction_confidence) as avg_confidence
FROM public.bloodwork_documents
GROUP BY user_id, parse_status
ORDER BY user_id, parse_status;

-- ===============================================================
-- 8. GRANT ACCESS TO FUNCTIONS AND VIEWS
-- ===============================================================
GRANT EXECUTE ON FUNCTION public.get_latest_bloodwork_document(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_latest_bloodwork_document(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bloodwork_documents_by_date_range(TEXT, DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_bloodwork_documents_by_date_range(TEXT, DATE, DATE) TO authenticated;

GRANT SELECT ON public.latest_bloodwork_documents TO service_role;
GRANT SELECT ON public.latest_bloodwork_documents TO authenticated;
GRANT SELECT ON public.bloodwork_documents_by_status TO service_role;
GRANT SELECT ON public.bloodwork_documents_by_status TO authenticated;

-- ===============================================================
-- 9. SCHEMA RELOAD FOR POSTGREST
-- ===============================================================
-- This reloads the schema cache for the API
NOTIFY pgrst, 'reload schema';

-- ===============================================================
-- 10. VERIFICATION QUERIES
-- ===============================================================
-- Uncomment these to verify deployment

-- -- Verify table exists
-- SELECT COUNT(*) as bloodwork_documents_count FROM public.bloodwork_documents;

-- -- Verify indexes exist
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE tablename = 'bloodwork_documents' 
-- AND indexname LIKE 'idx_%';

-- -- Verify functions exist
-- SELECT proname FROM pg_proc WHERE proname IN ('get_latest_bloodwork_document', 'get_bloodwork_documents_by_date_range');

-- -- Verify views exist
-- SELECT viewname FROM pg_views WHERE viewname IN ('latest_bloodwork_documents', 'bloodwork_documents_by_status');

-- ===============================================================
-- DEPLOYMENT COMPLETE
-- ===============================================================
-- Next steps:
-- 1. Restart the backend server: cd server && npm run dev
-- 2. Test bloodwork upload endpoints
-- 3. Verify frontend integration
-- ===============================================================
