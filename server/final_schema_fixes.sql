-- Final schema fixes for supplement_extracted_sections
-- Execute these commands in Supabase SQL Editor

-- 1. Add missing user_id column
ALTER TABLE public.supplement_extracted_sections 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 2. Add missing normalized_name column  
ALTER TABLE public.supplement_extracted_sections 
ADD COLUMN IF NOT EXISTS normalized_name TEXT;

-- 3. Create missing indexes
CREATE INDEX IF NOT EXISTS idx_supplement_extracted_sections_user_id 
ON public.supplement_extracted_sections(user_id);

CREATE INDEX IF NOT EXISTS idx_supplement_extracted_sections_document_id 
ON public.supplement_extracted_sections(document_id);

-- 4. Ensure RLS is enabled
ALTER TABLE public.supplement_extracted_sections ENABLE ROW LEVEL SECURITY;

-- 5. Ensure service role policy exists
CREATE POLICY IF NOT EXISTS "Service role full access" ON public.supplement_extracted_sections
FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 7. Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'supplement_extracted_sections' 
AND table_schema = 'public'
ORDER BY ordinal_position;
