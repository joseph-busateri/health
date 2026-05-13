-- ===============================================================
-- WAVE 1, STEP 4: VERSIONED POINT-IN-TIME ENGINE DEPLOYMENT
-- ===============================================================
-- Execute this entire script in Supabase SQL Editor
-- ===============================================================

-- ===============================================================
-- 1. GENERAL CHANGE EVENT TABLE (Unified across all entity types)
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.change_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('baseline_profile', 'workout_baseline', 'supplement_baseline', 'supplement_item', 'goal')),
    entity_id UUID NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_source TEXT NOT NULL CHECK (change_source IN ('document_upload', 'agent_adjustment', 'user_confirmation', 'system_update')),
    rationale TEXT,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    effective_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================================
-- 2. INDEXES FOR EFFICIENT QUERYING
-- ===============================================================
CREATE INDEX IF NOT EXISTS idx_change_events_user_id ON public.change_events(user_id);
CREATE INDEX IF NOT EXISTS idx_change_events_entity ON public.change_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_events_effective_at ON public.change_events(effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_events_user_effective ON public.change_events(user_id, effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_events_user_entity ON public.change_events(user_id, entity_type, entity_id);

-- ===============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ===============================================================
ALTER TABLE public.change_events ENABLE ROW LEVEL SECURITY;

-- Policy for service role (full access)
CREATE POLICY IF NOT EXISTS "Service role full access" ON public.change_events
FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- ===============================================================
-- 4. GRANT PERMISSIONS
-- ===============================================================
GRANT ALL ON public.change_events TO service_role;
GRANT SELECT ON public.change_events TO authenticated;
GRANT SELECT ON public.change_events TO anon;

-- ===============================================================
-- 5. HELPER FUNCTION FOR UPDATED_AT TRIGGER
-- ===============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================
-- 6. MIGRATION FUNCTION FOR EXISTING SUPPLEMENT CHANGE LOGS
-- ===============================================================
CREATE OR REPLACE FUNCTION public.migrate_supplement_change_logs()
RETURNS void AS $$
DECLARE
    change_log_record RECORD;
    new_entity_type TEXT;
    new_entity_id UUID;
BEGIN
    -- Migrate supplement_change_log entries to unified change_events
    FOR change_log_record IN 
        SELECT * FROM public.supplement_change_log 
        WHERE changed_at > '1970-01-01'::timestamp
        ORDER BY changed_at
    LOOP
        -- Determine entity type and ID
        IF change_log_record.supplement_item_id IS NOT NULL THEN
            new_entity_type := 'supplement_item';
            new_entity_id := change_log_record.supplement_item_id;
        ELSIF change_log_record.supplement_baseline_id IS NOT NULL THEN
            new_entity_type := 'supplement_baseline';
            new_entity_id := change_log_record.supplement_baseline_id;
        ELSE
            CONTINUE; -- Skip if no entity reference
        END IF;
        
        -- Insert into unified change_events table
        INSERT INTO public.change_events (
            user_id,
            entity_type,
            entity_id,
            field_name,
            old_value,
            new_value,
            change_source,
            rationale,
            effective_at,
            created_at
        ) VALUES (
            change_log_record.user_id,
            new_entity_type,
            new_entity_id,
            change_log_record.field_name,
            change_log_record.old_value,
            change_log_record.new_value,
            change_log_record.change_source,
            change_log_record.rationale,
            change_log_record.changed_at,
            change_log_record.changed_at
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================
-- 7. VIEW FOR CURRENT EFFECTIVE STATE
-- ===============================================================
CREATE OR REPLACE VIEW public.current_effective_state AS
WITH latest_changes AS (
    SELECT DISTINCT ON (user_id, entity_type, entity_id)
        user_id,
        entity_type,
        entity_id,
        field_name,
        new_value as current_value,
        effective_at
    FROM public.change_events
    WHERE effective_at <= NOW()
    ORDER BY user_id, entity_type, entity_id, effective_at DESC
)
SELECT 
    user_id,
    entity_type,
    entity_id,
    jsonb_object_agg(field_name, current_value) as current_fields,
    MAX(effective_at) as last_updated
FROM latest_changes
GROUP BY user_id, entity_type, entity_id;

-- Grant access to the view
GRANT SELECT ON public.current_effective_state TO service_role;
GRANT SELECT ON public.current_effective_state TO authenticated;
GRANT SELECT ON public.current_effective_state TO anon;

-- ===============================================================
-- 8. FUNCTION TO RECONSTRUCT STATE AS OF SPECIFIC DATE
-- ===============================================================
CREATE OR REPLACE FUNCTION public.reconstruct_state_as_of(
    p_user_id TEXT,
    p_target_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    entity_type TEXT,
    entity_id UUID,
    reconstructed_fields JSONB,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH relevant_changes AS (
        SELECT DISTINCT ON (entity_type, entity_id, field_name)
            entity_type,
            entity_id,
            field_name,
            new_value,
            effective_at
        FROM public.change_events
        WHERE user_id = p_user_id 
            AND effective_at <= p_target_date
        ORDER BY entity_type, entity_id, field_name, effective_at DESC
    )
    SELECT 
        rc.entity_type,
        rc.entity_id,
        jsonb_object_agg(rc.field_name, rc.new_value) as reconstructed_fields,
        MAX(rc.effective_at) as last_updated
    FROM relevant_changes rc
    GROUP BY rc.entity_type, rc.entity_id
    ORDER BY rc.entity_type, rc.last_updated DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.reconstruct_state_as_of(TEXT, TIMESTAMP WITH TIME ZONE) TO service_role;
GRANT EXECUTE ON FUNCTION public.reconstruct_state_as_of(TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- ===============================================================
-- 9. HELPER FUNCTION TO GET BASELINE DOCUMENT FOR ENTITY
-- ===============================================================
CREATE OR REPLACE FUNCTION public.get_baseline_document(
    p_entity_type TEXT,
    p_entity_id UUID
)
RETURNS TABLE (
    document_id UUID,
    document_type TEXT,
    upload_date DATE,
    extracted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    CASE p_entity_type
        WHEN 'supplement_baseline' THEN
            RETURN QUERY
            SELECT 
                sb.document_id,
                sd.document_type,
                sd.upload_date,
                sb.extracted_at
            FROM public.supplement_baseline sb
            JOIN public.supplement_documents sd ON sb.document_id = sd.id
            WHERE sb.id = p_entity_id;
        
        WHEN 'workout_baseline' THEN
            RETURN QUERY
            SELECT 
                wb.document_id,
                sd.document_type,
                sd.upload_date,
                wb.extracted_at
            FROM public.workout_baseline wb
            JOIN public.workout_documents wd ON wb.document_id = wd.id
            WHERE wb.id = p_entity_id;
        
        -- Add other entity types as needed
        
        ELSE
            -- Return empty result for unknown entity types
            RETURN;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the helper function
GRANT EXECUTE ON FUNCTION public.get_baseline_document(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_baseline_document(TEXT, UUID) TO authenticated;

-- ===============================================================
-- 10. BASELINE PROFILE TABLE (if required for goals)
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.baseline_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    goals JSONB,
    target_weight DECIMAL(5,2),
    target_body_fat DECIMAL(5,2),
    target_muscle_mass DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for baseline_profile
CREATE INDEX IF NOT EXISTS idx_baseline_profile_user_id ON public.baseline_profile(user_id);

-- RLS for baseline_profile
ALTER TABLE public.baseline_profile ENABLE ROW LEVEL SECURITY;

-- Policy for service role
CREATE POLICY IF NOT EXISTS "Service role full access" ON public.baseline_profile
FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- Grant permissions for baseline_profile
GRANT ALL ON public.baseline_profile TO service_role;
GRANT SELECT ON public.baseline_profile TO authenticated;
GRANT SELECT ON public.baseline_profile TO anon;

-- Updated_at trigger for baseline_profile
CREATE TRIGGER handle_baseline_profile_updated_at 
    BEFORE UPDATE ON public.baseline_profile 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===============================================================
-- 11. WORKOUT BASELINE TABLE (if required)
-- ===============================================================
CREATE TABLE IF NOT EXISTS public.workout_baseline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    document_id UUID NOT NULL,
    split_type TEXT,
    training_days INTEGER,
    rest_days INTEGER,
    session_duration INTEGER,
    focus_areas TEXT[],
    experience_level TEXT,
    notes TEXT,
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (document_id) REFERENCES public.workout_documents(id) ON DELETE CASCADE
);

-- Indexes for workout_baseline
CREATE INDEX IF NOT EXISTS idx_workout_baseline_user_id ON public.workout_baseline(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_baseline_document_id ON public.workout_baseline(document_id);

-- RLS for workout_baseline
ALTER TABLE public.workout_baseline ENABLE ROW LEVEL SECURITY;

-- Policy for service role
CREATE POLICY IF NOT EXISTS "Service role full access" ON public.workout_baseline
FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- Grant permissions for workout_baseline
GRANT ALL ON public.workout_baseline TO service_role;
GRANT SELECT ON public.workout_baseline TO authenticated;
GRANT SELECT ON public.workout_baseline TO anon;

-- Updated_at trigger for workout_baseline
CREATE TRIGGER handle_workout_baseline_updated_at 
    BEFORE UPDATE ON public.workout_baseline 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===============================================================
-- 12. FOREIGN KEY CONSTRAINTS FOR CHANGE_EVENTS
-- ===============================================================
-- Note: These are optional and can be added if you want strict referential integrity
-- They are commented out to allow flexibility in entity references

-- ALTER TABLE public.change_events 
-- ADD CONSTRAINT fk_change_events_supplement_baseline 
-- FOREIGN KEY (entity_id) REFERENCES public.supplement_baseline(id) 
-- ON DELETE CASCADE 
-- ON UPDATE CASCADE 
-- WHERE entity_type = 'supplement_baseline';

-- ALTER TABLE public.change_events 
-- ADD CONSTRAINT fk_change_events_supplement_item 
-- FOREIGN KEY (entity_id) REFERENCES public.supplement_items(id) 
-- ON DELETE CASCADE 
-- ON UPDATE CASCADE 
-- WHERE entity_type = 'supplement_item';

-- ===============================================================
-- 13. MIGRATE EXISTING DATA (Optional)
-- ===============================================================
-- Uncomment to migrate existing supplement change logs
-- SELECT public.migrate_supplement_change_logs();

-- ===============================================================
-- 14. SCHEMA RELOAD FOR POSTGREST
-- ===============================================================
-- This reloads the schema cache for the API
NOTIFY pgrst, 'reload schema';

-- ===============================================================
-- 15. VERIFICATION QUERIES
-- ===============================================================
-- Uncomment these to verify deployment

-- -- Verify change_events table exists
-- SELECT COUNT(*) as change_events_count FROM public.change_events;

-- -- Verify indexes exist
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE tablename IN ('change_events', 'baseline_profile', 'workout_baseline') 
-- AND indexname LIKE 'idx_%';

-- -- Verify functions exist
-- SELECT proname FROM pg_proc WHERE proname IN ('reconstruct_state_as_of', 'get_baseline_document', 'migrate_supplement_change_logs');

-- -- Verify views exist
-- SELECT viewname FROM pg_views WHERE viewname = 'current_effective_state';

-- ===============================================================
-- DEPLOYMENT COMPLETE
-- ===============================================================
-- Next steps:
-- 1. Restart the backend server: cd server && npm run dev
-- 2. Run validation: node validate_point_in_time_e2e.js
-- 3. Test frontend: cd mobile && npx expo start
-- ===============================================================
