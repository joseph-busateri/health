-- Migration: Move Data from OLD Supplement System to NEW System
-- Date: 2026-04-12
-- Purpose: Migrate existing supplement_items data to new supplement_stack_versions + supplements system

-- ============================================================================
-- STEP 1: Verify old data exists and new system is ready
-- ============================================================================

-- Check old data exists
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM supplement_items;
    SELECT COUNT(*) INTO new_count FROM supplement_stack_versions;
    
    IF old_count = 0 THEN
        RAISE NOTICE 'No data found in supplement_items table - nothing to migrate';
    ELSE
        RAISE NOTICE 'Found % records in supplement_items to migrate', old_count;
    END IF;
    
    RAISE NOTICE 'Current new system has % stack versions', new_count;
END $$;

-- ============================================================================
-- STEP 2: Create stack versions for each user who has supplement_items
-- ============================================================================

-- Insert stack versions for users with existing supplement data
INSERT INTO supplement_stack_versions (
    user_id,
    version_number,
    version_name,
    is_current,
    created_by,
    created_reason,
    effective_from,
    created_at
)
SELECT 
    sb.user_id,
    1 as version_number,
    'Migrated from legacy system' as version_name,
    true as is_current,
    'agent' as created_by,
    'Initial migration from supplement_items table' as created_reason,
    CURRENT_DATE as effective_from,
    NOW() as created_at
FROM supplement_baseline sb
WHERE EXISTS (
    SELECT 1 FROM supplement_items si 
    WHERE si.supplement_baseline_id = sb.id
)
ON CONFLICT (user_id, version_number) DO NOTHING;

-- ============================================================================
-- STEP 3: Migrate supplement items to new supplements table
-- ============================================================================

-- Map old supplement_items to new supplements structure
INSERT INTO supplements (
    stack_version_id,
    supplement_name,
    brand,
    form,
    dosage_amount,
    dosage_unit,
    timing,
    frequency,
    times_per_day,
    goal,
    reason_to_take,
    take_with_food,
    take_with_water,
    status,
    supplement_order,
    created_at
)
SELECT 
    ssv.id as stack_version_id,
    si.supplement_name,
    si.brand,
    si.form,
    COALESCE(si.dosage_amount, 1) as dosage_amount,
    COALESCE(si.dosage_unit, 'unit') as dosage_unit,
    COALESCE(si.timing, 'morning') as timing,
    COALESCE(si.frequency, 'daily') as frequency,
    COALESCE(si.times_per_day, 1) as times_per_day,
    si.goal,
    si.reason_to_take,
    COALESCE(si.take_with_food, false) as take_with_food,
    COALESCE(si.take_with_water, true) as take_with_water,
    COALESCE(si.status, 'active') as status,
    ROW_NUMBER() OVER (PARTITION BY si.supplement_baseline_id ORDER BY si.created_at) as supplement_order,
    si.created_at
FROM supplement_items si
JOIN supplement_baseline sb ON si.supplement_baseline_id = sb.id
JOIN supplement_stack_versions ssv ON ssv.user_id = sb.user_id AND ssv.is_current = true
WHERE NOT EXISTS (
    SELECT 1 FROM supplements s 
    JOIN supplement_stack_versions ssv2 ON s.stack_version_id = ssv2.id
    WHERE ssv2.user_id = sb.user_id 
    AND ssv2.is_current = true
    AND s.supplement_name = si.supplement_name
);

-- ============================================================================
-- STEP 4: Verify migration results
-- ============================================================================

DO $$
DECLARE
    migrated_count INTEGER;
    total_new_count INTEGER;
BEGIN
    -- Count migrated supplements
    SELECT COUNT(*) INTO migrated_count 
    FROM supplements s
    JOIN supplement_stack_versions ssv ON s.stack_version_id = ssv.id
    WHERE ssv.created_reason = 'Initial migration from supplement_items table';
    
    -- Count total supplements in new system
    SELECT COUNT(*) INTO total_new_count FROM supplements;
    
    RAISE NOTICE 'Successfully migrated % supplements to new system', migrated_count;
    RAISE NOTICE 'New system now contains % total supplements', total_new_count;
    
    IF migrated_count > 0 THEN
        RAISE NOTICE 'Migration completed successfully!';
    ELSE
        RAISE NOTICE 'No new supplements were migrated - check for duplicates or existing data';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Show sample of migrated data for verification
-- ============================================================================

-- Show migrated stack versions
SELECT 
    user_id,
    version_number,
    version_name,
    created_reason,
    effective_from
FROM supplement_stack_versions 
WHERE created_reason = 'Initial migration from supplement_items table'
ORDER BY user_id;

-- Show migrated supplements (limit 10 for sample)
SELECT 
    s.supplement_name,
    s.dosage_amount,
    s.dosage_unit,
    s.timing,
    s.frequency,
    ssv.user_id
FROM supplements s
JOIN supplement_stack_versions ssv ON s.stack_version_id = ssv.id
WHERE ssv.created_reason = 'Initial migration from supplement_items table'
ORDER BY ssv.user_id, s.supplement_order
LIMIT 10;

-- ============================================================================
-- CLEANUP NOTES
-- ============================================================================

-- After verifying migration is successful, you can run:
-- DROP TABLE IF EXISTS supplement_change_log CASCADE;
-- DROP TABLE IF EXISTS supplement_items CASCADE;
-- DROP TABLE IF EXISTS supplement_baseline CASCADE;

-- But ONLY after confirming data is correctly migrated and working
