-- Fix change_events table check constraints to include new entity types and change sources

-- Drop old constraints
ALTER TABLE public.change_events DROP CONSTRAINT IF EXISTS change_events_entity_type_check;
ALTER TABLE public.change_events DROP CONSTRAINT IF EXISTS change_events_change_source_check;

-- Add updated entity type check constraint
ALTER TABLE public.change_events
ADD CONSTRAINT change_events_entity_type_check
CHECK (entity_type IN ('baseline_profile', 'workout_baseline', 'supplement_baseline', 'supplement_item', 'goal', 'workout_plan', 'workout_today'));

-- Add updated change source check constraint
ALTER TABLE public.change_events
ADD CONSTRAINT change_events_change_source_check
CHECK (change_source IN ('document_upload', 'agent_adjustment', 'user_confirmation', 'system_update', 'integrated_workout_engine'));

-- Verify the update
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.change_events'::regclass
  AND conname LIKE 'change_events_%_check';
