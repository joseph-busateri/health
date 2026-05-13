-- Wave 1, Step 4: Versioned Point-in-Time Engine Schema
-- Execute this in Supabase SQL Editor

-- General Change Event Table (Unified across all entity types)
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

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_change_events_user_id ON public.change_events(user_id);
CREATE INDEX IF NOT EXISTS idx_change_events_entity ON public.change_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_events_effective_at ON public.change_events(effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_events_user_effective ON public.change_events(user_id, effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_events_user_entity ON public.change_events(user_id, entity_type, entity_id);

-- RLS
ALTER TABLE public.change_events ENABLE ROW LEVEL SECURITY;

-- Policy for service role
CREATE POLICY IF NOT EXISTS "Service role full access" ON public.change_events
FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- Grant permissions
GRANT ALL ON public.change_events TO service_role;

-- Function to handle updated_at trigger (reuse existing if exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for change_events (if we add updated_at later)
-- ALTER TABLE public.change_events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- DROP TRIGGER IF EXISTS handle_change_events_updated_at ON public.change_events;
-- CREATE TRIGGER handle_change_events_updated_at BEFORE UPDATE ON public.change_events FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Migrate existing change logs to unified model
-- Note: This is a one-time migration script to move existing supplement_change_log entries

-- Create a function to migrate supplement change logs
CREATE OR REPLACE FUNCTION public.migrate_supplement_change_logs()
RETURNS void AS $$
DECLARE
    change_log_record RECORD;
    new_entity_type TEXT;
    new_entity_id UUID;
BEGIN
    -- Migrate supplement_change_log entries
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

-- View for current effective state (materialized view could be considered for performance)
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

-- Function to reconstruct state as of specific date
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

-- Helper function to get baseline document for entity
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
