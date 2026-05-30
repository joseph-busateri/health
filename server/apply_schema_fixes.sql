-- Fix supplement_baseline table structure
-- Execute these commands in Supabase SQL Editor

-- 1. Add missing document_id column with foreign key
ALTER TABLE public.supplement_baseline 
ADD COLUMN IF NOT EXISTS document_id UUID 
REFERENCES public.supplement_documents(id) ON DELETE CASCADE;

-- 2. Add missing optional columns
ALTER TABLE public.supplement_baseline 
ADD COLUMN IF NOT EXISTS stack_notes TEXT;

ALTER TABLE public.supplement_baseline 
ADD COLUMN IF NOT EXISTS timing_notes TEXT;

ALTER TABLE public.supplement_baseline 
ADD COLUMN IF NOT EXISTS frequency_notes TEXT;

-- 3. Add missing timestamp columns
ALTER TABLE public.supplement_baseline 
ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.supplement_baseline 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Create missing indexes
CREATE INDEX IF NOT EXISTS idx_supplement_baseline_document_id 
ON public.supplement_baseline(document_id);

CREATE INDEX IF NOT EXISTS idx_supplement_baseline_user_id 
ON public.supplement_baseline(user_id);

CREATE INDEX IF NOT EXISTS idx_supplement_baseline_created_at 
ON public.supplement_baseline(created_at DESC);

-- 5. Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_supplement_baseline_updated_at 
ON public.supplement_baseline;

CREATE TRIGGER handle_supplement_baseline_updated_at
BEFORE UPDATE ON public.supplement_baseline
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 6. Ensure RLS is enabled
ALTER TABLE public.supplement_baseline ENABLE ROW LEVEL SECURITY;

-- 7. Ensure service role policy exists
CREATE POLICY IF NOT EXISTS "Service role full access" ON public.supplement_baseline
FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- 8. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 9. Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'supplement_baseline' 
AND table_schema = 'public'
ORDER BY ordinal_position;
