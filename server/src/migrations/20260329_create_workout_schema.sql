-- Workout Schema Migration
-- Purpose: Support 12-week training cycles with agent-managed workout plans
-- Features: Version history, training cycle tracking, flexible exercise execution

-- ============================================================================
-- 1. TRAINING CYCLES TABLE
-- ============================================================================
-- Tracks the 12-week training cycle configuration and current position

CREATE TABLE IF NOT EXISTS training_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    cycle_name TEXT NOT NULL,
    cycle_number INTEGER NOT NULL DEFAULT 1,
    total_weeks INTEGER NOT NULL DEFAULT 12,
    current_week INTEGER NOT NULL DEFAULT 1,
    
    -- Week ranges for different training styles
    concentric_weeks_start INTEGER NOT NULL DEFAULT 1,
    concentric_weeks_end INTEGER NOT NULL DEFAULT 10,
    eccentric_week INTEGER NOT NULL DEFAULT 11,
    isometric_week INTEGER NOT NULL DEFAULT 12,
    
    -- Cycle dates
    cycle_start_date DATE NOT NULL,
    cycle_end_date DATE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, cycle_number)
);

CREATE INDEX idx_training_cycles_user ON training_cycles(user_id);
CREATE INDEX idx_training_cycles_status ON training_cycles(user_id, status);

-- ============================================================================
-- 2. WORKOUT PLAN VERSIONS TABLE
-- ============================================================================
-- Stores different versions of workout plans (baseline, agent updates)

CREATE TABLE IF NOT EXISTS workout_plan_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    training_cycle_id UUID REFERENCES training_cycles(id) ON DELETE CASCADE,
    
    -- Version tracking
    version_number INTEGER NOT NULL DEFAULT 1,
    version_name TEXT,
    is_current BOOLEAN NOT NULL DEFAULT true,
    
    -- Version metadata
    created_by TEXT NOT NULL CHECK (created_by IN ('user', 'agent')),
    created_reason TEXT, -- e.g., "Initial baseline", "Adjusted for recovery", "Performance optimization"
    
    -- Agent recommendation context
    based_on_recommendation_id UUID, -- Links to agent recommendation that triggered this version
    
    -- Timestamps
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, version_number)
);

CREATE INDEX idx_workout_versions_user ON workout_plan_versions(user_id);
CREATE INDEX idx_workout_versions_current ON workout_plan_versions(user_id, is_current);
CREATE INDEX idx_workout_versions_cycle ON workout_plan_versions(training_cycle_id);

-- ============================================================================
-- 3. WORKOUT SPLIT DAYS TABLE
-- ============================================================================
-- Defines the split structure (e.g., Push, Pull, Legs)

CREATE TABLE IF NOT EXISTS workout_split_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_version_id UUID NOT NULL REFERENCES workout_plan_versions(id) ON DELETE CASCADE,
    
    -- Split information
    split_day TEXT NOT NULL, -- e.g., "Day 1", "Monday", "Push Day"
    split_focus TEXT NOT NULL, -- e.g., "Push", "Pull", "Legs", "Upper", "Lower"
    day_order INTEGER NOT NULL, -- Order in the weekly rotation
    
    -- Training style for this day (can vary by week in cycle)
    week_1_10_style TEXT NOT NULL DEFAULT 'concentric' CHECK (week_1_10_style IN ('concentric', 'eccentric', 'isometric')),
    week_11_style TEXT NOT NULL DEFAULT 'eccentric' CHECK (week_11_style IN ('concentric', 'eccentric', 'isometric')),
    week_12_style TEXT NOT NULL DEFAULT 'isometric' CHECK (week_12_style IN ('concentric', 'eccentric', 'isometric')),
    
    -- Optional notes
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(plan_version_id, day_order)
);

CREATE INDEX idx_split_days_version ON workout_split_days(plan_version_id);

-- ============================================================================
-- 4. EXERCISES TABLE
-- ============================================================================
-- Stores exercises for each split day

CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    split_day_id UUID NOT NULL REFERENCES workout_split_days(id) ON DELETE CASCADE,
    
    -- Exercise details
    exercise_name TEXT NOT NULL,
    exercise_description TEXT, -- e.g., "Barbell Bench Press - Flat", "Incline DB Press"
    exercise_order INTEGER NOT NULL, -- Order within the workout
    
    -- Exercise parameters
    sets INTEGER NOT NULL,
    reps TEXT NOT NULL, -- Can be range like "8-12" or specific like "10"
    weight TEXT, -- Can be specific weight or "bodyweight", "progressive"
    
    -- Rest periods
    rest_seconds INTEGER, -- Rest between sets
    
    -- Execution notes
    tempo TEXT, -- e.g., "3-1-1-0" for eccentric-pause-concentric-pause
    execution_notes TEXT, -- Special instructions for different training styles
    
    -- Alternative exercises
    alternative_exercises TEXT[], -- Array of alternative exercise names
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(split_day_id, exercise_order)
);

CREATE INDEX idx_exercises_split_day ON workout_exercises(split_day_id);

-- ============================================================================
-- 5. WORKOUT EXECUTION LOG TABLE
-- ============================================================================
-- Tracks actual workout performance vs planned

CREATE TABLE IF NOT EXISTS workout_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    training_cycle_id UUID REFERENCES training_cycles(id) ON DELETE SET NULL,
    
    -- Execution details
    executed_date DATE NOT NULL,
    week_number INTEGER NOT NULL,
    training_style TEXT NOT NULL CHECK (training_style IN ('concentric', 'eccentric', 'isometric')),
    
    -- Actual performance
    sets_completed INTEGER NOT NULL,
    reps_completed TEXT NOT NULL, -- Can be array like "10,10,8,8" or single value
    weight_used TEXT NOT NULL,
    
    -- Performance metrics
    rpe DECIMAL(3,1), -- Rate of Perceived Exertion (1-10)
    form_quality INTEGER CHECK (form_quality BETWEEN 1 AND 5), -- 1=poor, 5=excellent
    
    -- Notes
    notes TEXT,
    skipped BOOLEAN DEFAULT false,
    skip_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_execution_user_date ON workout_execution_log(user_id, executed_date DESC);
CREATE INDEX idx_execution_exercise ON workout_execution_log(exercise_id);
CREATE INDEX idx_execution_cycle ON workout_execution_log(training_cycle_id);

-- ============================================================================
-- 6. WORKOUT PLAN CHANGES TABLE
-- ============================================================================
-- Tracks what changed between versions (for agent transparency)

CREATE TABLE IF NOT EXISTS workout_plan_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_version_id UUID REFERENCES workout_plan_versions(id) ON DELETE CASCADE,
    to_version_id UUID NOT NULL REFERENCES workout_plan_versions(id) ON DELETE CASCADE,
    
    -- Change details
    change_type TEXT NOT NULL CHECK (change_type IN ('exercise_added', 'exercise_removed', 'exercise_modified', 'sets_changed', 'reps_changed', 'weight_changed', 'order_changed')),
    change_description TEXT NOT NULL,
    
    -- What changed
    exercise_name TEXT,
    split_day TEXT,
    old_value TEXT,
    new_value TEXT,
    
    -- Why it changed
    reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_changes_version ON workout_plan_changes(to_version_id);

-- ============================================================================
-- 7. WORKOUT BASELINE DOCUMENTS TABLE
-- ============================================================================
-- Stores uploaded Excel/document metadata

CREATE TABLE IF NOT EXISTS workout_baseline_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    plan_version_id UUID REFERENCES workout_plan_versions(id) ON DELETE SET NULL,
    
    -- Document info
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    
    -- Processing status
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    
    -- Extracted data
    extracted_text TEXT,
    parsed_workout_data JSONB,
    
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_baseline_docs_user ON workout_baseline_documents(user_id);
CREATE INDEX idx_baseline_docs_status ON workout_baseline_documents(user_id, processing_status);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current training style based on week number
CREATE OR REPLACE FUNCTION get_training_style_for_week(
    p_cycle_id UUID,
    p_week_number INTEGER
) RETURNS TEXT AS $$
DECLARE
    v_concentric_start INTEGER;
    v_concentric_end INTEGER;
    v_eccentric_week INTEGER;
    v_isometric_week INTEGER;
BEGIN
    SELECT 
        concentric_weeks_start,
        concentric_weeks_end,
        eccentric_week,
        isometric_week
    INTO 
        v_concentric_start,
        v_concentric_end,
        v_eccentric_week,
        v_isometric_week
    FROM training_cycles
    WHERE id = p_cycle_id;
    
    IF p_week_number BETWEEN v_concentric_start AND v_concentric_end THEN
        RETURN 'concentric';
    ELSIF p_week_number = v_eccentric_week THEN
        RETURN 'eccentric';
    ELSIF p_week_number = v_isometric_week THEN
        RETURN 'isometric';
    ELSE
        RETURN 'concentric'; -- Default
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get current workout plan for user
CREATE OR REPLACE FUNCTION get_current_workout_plan(p_user_id TEXT)
RETURNS TABLE (
    plan_version_id UUID,
    version_number INTEGER,
    split_day TEXT,
    split_focus TEXT,
    exercise_name TEXT,
    exercise_description TEXT,
    sets INTEGER,
    reps TEXT,
    weight TEXT,
    exercise_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wpv.id,
        wpv.version_number,
        wsd.split_day,
        wsd.split_focus,
        we.exercise_name,
        we.exercise_description,
        we.sets,
        we.reps,
        we.weight,
        we.exercise_order
    FROM workout_plan_versions wpv
    JOIN workout_split_days wsd ON wsd.plan_version_id = wpv.id
    JOIN workout_exercises we ON we.split_day_id = wsd.id
    WHERE wpv.user_id = p_user_id
    AND wpv.is_current = true
    ORDER BY wsd.day_order, we.exercise_order;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for training_cycles
CREATE OR REPLACE FUNCTION update_training_cycles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_cycles_update_timestamp
    BEFORE UPDATE ON training_cycles
    FOR EACH ROW
    EXECUTE FUNCTION update_training_cycles_timestamp();

-- Ensure only one current version per user
CREATE OR REPLACE FUNCTION ensure_single_current_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = true THEN
        UPDATE workout_plan_versions
        SET is_current = false
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_current = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_version_current_check
    BEFORE INSERT OR UPDATE ON workout_plan_versions
    FOR EACH ROW
    WHEN (NEW.is_current = true)
    EXECUTE FUNCTION ensure_single_current_version();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE training_cycles IS 'Tracks 12-week training cycle configuration and progress';
COMMENT ON TABLE workout_plan_versions IS 'Stores versioned workout plans with change history';
COMMENT ON TABLE workout_split_days IS 'Defines workout split structure (Push/Pull/Legs etc)';
COMMENT ON TABLE workout_exercises IS 'Individual exercises with sets, reps, weight';
COMMENT ON TABLE workout_execution_log IS 'Tracks actual workout performance vs planned';
COMMENT ON TABLE workout_plan_changes IS 'Audit trail of plan modifications';
COMMENT ON TABLE workout_baseline_documents IS 'Uploaded Excel/document metadata and processing status';

COMMENT ON FUNCTION get_training_style_for_week IS 'Returns training style (concentric/eccentric/isometric) for given week';
COMMENT ON FUNCTION get_current_workout_plan IS 'Returns the current active workout plan for a user';
