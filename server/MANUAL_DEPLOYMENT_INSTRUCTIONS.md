# Manual Supabase Schema Deployment - Workout Baseline Document Engine

## Instructions

Since automated deployment tools aren't available, please execute the following SQL in the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and execute each SQL block below in order

---

## 1. Create Core Tables

### workout_documents table
```sql
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
```

### workout_baselines table
```sql
CREATE TABLE IF NOT EXISTS public.workout_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    document_id UUID NOT NULL REFERENCES public.workout_documents(id) ON DELETE CASCADE,
    
    -- Program Structure
    program_name TEXT,
    split_name TEXT,
    workout_days_per_week INTEGER CHECK (workout_days_per_week >= 1 AND workout_days_per_week <= 7),
    rest_days_per_week INTEGER CHECK (rest_days_per_week >= 0 AND rest_days_per_week <= 6),
    training_style TEXT,
    program_notes TEXT,
    
    -- Weekly Schedule
    monday_plan TEXT,
    tuesday_plan TEXT,
    wednesday_plan TEXT,
    thursday_plan TEXT,
    friday_plan TEXT,
    saturday_plan TEXT,
    sunday_plan TEXT,
    
    -- Workout Context
    muscle_group_focus TEXT[],
    frequency_by_muscle_group JSONB,
    planned_volume_notes TEXT,
    planned_intensity_notes TEXT,
    cardio_or_conditioning_notes TEXT,
    mobility_or_recovery_notes TEXT,
    
    -- Exercise Layer (flexible JSON structure)
    exercises JSONB,
    
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### workout_extracted_sections table
```sql
CREATE TABLE IF NOT EXISTS public.workout_extracted_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    document_id UUID NOT NULL REFERENCES public.workout_documents(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    extraction_confidence DECIMAL(3,2) NOT NULL CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### workout_change_log table
```sql
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
```

---

## 2. Create Indexes for Performance

```sql
-- workout_documents indexes
CREATE INDEX IF NOT EXISTS idx_workout_documents_user_id ON public.workout_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_documents_created_at ON public.workout_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_documents_user_created ON public.workout_documents(user_id, created_at DESC);

-- workout_baselines indexes
CREATE INDEX IF NOT EXISTS idx_workout_baselines_user_id ON public.workout_baselines(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_baselines_document_id ON public.workout_baselines(document_id);
CREATE INDEX IF NOT EXISTS idx_workout_baselines_created_at ON public.workout_baselines(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_baselines_user_created ON public.workout_baselines(user_id, created_at DESC);

-- workout_extracted_sections indexes
CREATE INDEX IF NOT EXISTS idx_workout_extracted_sections_user_id ON public.workout_extracted_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_extracted_sections_document_id ON public.workout_extracted_sections(document_id);
CREATE INDEX IF NOT EXISTS idx_workout_extracted_sections_normalized_name ON public.workout_extracted_sections(normalized_name);

-- workout_change_log indexes
CREATE INDEX IF NOT EXISTS idx_workout_change_log_user_id ON public.workout_change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_change_log_baseline_id ON public.workout_change_log(workout_baseline_id);
CREATE INDEX IF NOT EXISTS idx_workout_change_log_changed_at ON public.workout_change_log(changed_at DESC);
```

---

## 3. Create Updated_at Trigger Function

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
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
```

---

## 4. Enable Row Level Security (RLS)

```sql
ALTER TABLE public.workout_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_extracted_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_change_log ENABLE ROW LEVEL SECURITY;
```

---

## 5. Create RLS Policies

```sql
-- workout_documents policies
CREATE POLICY "Users can view own workout documents" ON public.workout_documents
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own workout documents" ON public.workout_documents
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own workout documents" ON public.workout_documents
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own workout documents" ON public.workout_documents
    FOR DELETE USING (auth.uid()::text = user_id);

-- workout_baselines policies
CREATE POLICY "Users can view own workout baselines" ON public.workout_baselines
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own workout baselines" ON public.workout_baselines
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own workout baselines" ON public.workout_baselines
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own workout baselines" ON public.workout_baselines
    FOR DELETE USING (auth.uid()::text = user_id);

-- workout_extracted_sections policies
CREATE POLICY "Users can view own workout extracted sections" ON public.workout_extracted_sections
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own workout extracted sections" ON public.workout_extracted_sections
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own workout extracted sections" ON public.workout_extracted_sections
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own workout extracted sections" ON public.workout_extracted_sections
    FOR DELETE USING (auth.uid()::text = user_id);

-- workout_change_log policies
CREATE POLICY "Users can view own workout change log" ON public.workout_change_log
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own workout change log" ON public.workout_change_log
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own workout change log" ON public.workout_change_log
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own workout change log" ON public.workout_change_log
    FOR DELETE USING (auth.uid()::text = user_id);
```

---

## 6. Grant Permissions

```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

---

## 7. Create Helpful Views

```sql
-- Latest workout documents per user
CREATE OR REPLACE VIEW public.latest_workout_documents AS
SELECT DISTINCT ON (user_id) 
    wd.*
FROM public.workout_documents wd
ORDER BY user_id, created_at DESC;

-- Latest workout baselines per user
CREATE OR REPLACE VIEW public.latest_workout_baselines AS
SELECT DISTINCT ON (user_id) 
    wb.*
FROM public.workout_baselines wb
ORDER BY user_id, created_at DESC;
```

---

## 8. Verify Deployment

After executing all SQL above, run this verification query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'workout_%'
ORDER BY table_name;
```

You should see:
- workout_documents
- workout_baselines  
- workout_extracted_sections
- workout_change_log

---

## 9. Test PostgREST Access

Finally, test that the tables are accessible via the API:

```sql
-- Test workout_documents access
SELECT count(*) FROM public.workout_documents LIMIT 1;

-- Test workout_baselines access  
SELECT count(*) FROM public.workout_baselines LIMIT 1;
```

---

## Next Steps

After successful deployment:

1. Run the validation script:
   ```bash
   npx ts-node src/scripts/validateWorkoutDocument.ts
   ```

2. Test the API endpoints:
   ```bash
   curl -X POST http://localhost:3000/workout-document -H "Content-Type: application/json" -d @./test_workout_payload.json
   ```

3. Verify frontend integration

The schema is now ready for the Workout Baseline Document Engine!
