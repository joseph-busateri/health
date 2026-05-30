-- Progressive Overload Tracking Schema
-- Execute this in Supabase SQL Editor after workout schema is deployed

-- ============================================================================
-- Table: overload_completion_tracking
-- Purpose: Track progressive overload recommendations and completion status
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.overload_completion_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    exercise_key TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    
    -- Original values (before overload)
    original_sets INTEGER,
    original_reps TEXT,
    original_load TEXT,
    
    -- New values (after overload)
    new_sets INTEGER,
    new_reps TEXT,
    new_load TEXT,
    
    -- Adjustment details
    load_delta_percent DECIMAL(5,2),
    adjustment_type TEXT CHECK (adjustment_type IN ('volume', 'load', 'intensity', 'progressive_overload', 'deload')),
    adjustment_source TEXT CHECK (adjustment_source IN ('ai_overload_planner', 'simple_overload', 'manual')),
    
    -- AI decision metadata (if applicable)
    ai_confidence DECIMAL(3,2),
    ai_justification TEXT,
    ai_cue TEXT,
    
    -- Completion tracking
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, date, exercise_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_overload_tracking_user_date 
    ON public.overload_completion_tracking(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_overload_tracking_user_exercise 
    ON public.overload_completion_tracking(user_id, exercise_key);

CREATE INDEX IF NOT EXISTS idx_overload_tracking_completed 
    ON public.overload_completion_tracking(user_id, completed, date DESC);

-- ============================================================================
-- Table: exercise_classification
-- Purpose: Store exercise classifications (compound vs isolation, movement patterns)
-- Note: This is optional - can use in-memory cache instead
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exercise_classification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_name TEXT UNIQUE NOT NULL,
    exercise_key TEXT UNIQUE NOT NULL,
    
    -- Classification
    classification TEXT NOT NULL CHECK (classification IN ('compound', 'isolation', 'unknown')),
    movement_pattern TEXT CHECK (movement_pattern IN ('squat', 'hinge', 'push', 'pull', 'lunge', 'rotation', 'carry', 'unknown')),
    
    -- Muscle groups
    primary_muscles TEXT[],
    secondary_muscles TEXT[],
    
    -- Metadata
    is_primary_compound BOOLEAN DEFAULT FALSE,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    equipment_required TEXT[],
    
    -- Tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_classification_name 
    ON public.exercise_classification(exercise_name);

CREATE INDEX IF NOT EXISTS idx_exercise_classification_key 
    ON public.exercise_classification(exercise_key);

CREATE INDEX IF NOT EXISTS idx_exercise_classification_type 
    ON public.exercise_classification(classification, movement_pattern);

-- ============================================================================
-- Table: progressive_overload_config
-- Purpose: Store per-user configurable thresholds for progressive overload
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.progressive_overload_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    
    -- Thresholds
    adherence_threshold INTEGER DEFAULT 85 CHECK (adherence_threshold BETWEEN 50 AND 95),
    max_load_delta_percent DECIMAL(5,2) DEFAULT 5.0 CHECK (max_load_delta_percent BETWEEN 2.5 AND 15.0),
    max_set_additions INTEGER DEFAULT 1 CHECK (max_set_additions BETWEEN 1 AND 3),
    
    -- AI settings
    enable_ai_overload BOOLEAN DEFAULT FALSE,
    ai_confidence_threshold DECIMAL(3,2) DEFAULT 0.60 CHECK (ai_confidence_threshold BETWEEN 0.40 AND 0.90),
    
    -- Training phase (can override automatic determination)
    training_phase TEXT CHECK (training_phase IN ('hypertrophy', 'strength', 'peaking', 'maintenance', 'unknown')),
    training_phase_override BOOLEAN DEFAULT FALSE,
    
    -- Feature flags (per-user overrides)
    enable_exercise_classification BOOLEAN DEFAULT TRUE,
    enable_training_phase_logic BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_overload_config_user 
    ON public.progressive_overload_config(user_id);

-- ============================================================================
-- Table: overload_history
-- Purpose: Historical log of all overload decisions for analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.overload_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    
    -- Workout context
    workout_status TEXT NOT NULL CHECK (workout_status IN ('optimal', 'moderate', 'constrained', 'deload')),
    training_phase TEXT,
    
    -- Readiness scores
    recovery_score INTEGER,
    stress_score INTEGER,
    joint_score INTEGER,
    adherence_score INTEGER,
    
    -- Decision metadata
    decision_source TEXT CHECK (decision_source IN ('ai_overload_planner', 'simple_overload', 'none')),
    ai_confidence DECIMAL(3,2),
    adjustments_count INTEGER DEFAULT 0,
    
    -- Summary
    summary TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_overload_history_user_date 
    ON public.overload_history(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_overload_history_decision_source 
    ON public.overload_history(decision_source, date DESC);

-- ============================================================================
-- Functions: Update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_overload_tracking_updated_at
    BEFORE UPDATE ON public.overload_completion_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_classification_updated_at
    BEFORE UPDATE ON public.exercise_classification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overload_config_updated_at
    BEFORE UPDATE ON public.progressive_overload_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.overload_completion_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_classification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progressive_overload_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overload_history ENABLE ROW LEVEL SECURITY;

-- Policies for overload_completion_tracking
CREATE POLICY "Users can view their own overload tracking"
    ON public.overload_completion_tracking FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own overload tracking"
    ON public.overload_completion_tracking FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own overload tracking"
    ON public.overload_completion_tracking FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Policies for exercise_classification (public read, admin write)
CREATE POLICY "Anyone can view exercise classifications"
    ON public.exercise_classification FOR SELECT
    USING (true);

-- Policies for progressive_overload_config
CREATE POLICY "Users can view their own config"
    ON public.progressive_overload_config FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own config"
    ON public.progressive_overload_config FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own config"
    ON public.progressive_overload_config FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Policies for overload_history
CREATE POLICY "Users can view their own history"
    ON public.overload_history FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own history"
    ON public.overload_history FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE public.overload_completion_tracking IS 'Tracks progressive overload recommendations and whether they were completed';
COMMENT ON TABLE public.exercise_classification IS 'Stores exercise classifications (compound/isolation, movement patterns)';
COMMENT ON TABLE public.progressive_overload_config IS 'Per-user configurable thresholds for progressive overload';
COMMENT ON TABLE public.overload_history IS 'Historical log of all overload decisions for analysis';
