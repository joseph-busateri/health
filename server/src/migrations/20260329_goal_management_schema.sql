-- Goal Management Schema
-- Comprehensive goal tracking with templates, progress monitoring, and milestone celebrations

-- =====================================================
-- GOAL TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template details
    template_name VARCHAR(200) NOT NULL,
    template_category VARCHAR(50), -- 'weight_loss', 'muscle_gain', 'strength', 'endurance', 'health', 'performance'
    description TEXT,
    
    -- Goal configuration
    goal_type VARCHAR(50) NOT NULL, -- 'single_metric', 'multi_metric', 'habit', 'milestone'
    primary_metric VARCHAR(100), -- Main metric to track
    secondary_metrics VARCHAR(100)[], -- Additional metrics
    
    -- Target settings
    default_duration_days INTEGER, -- Suggested duration
    difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced', 'expert'
    
    -- Milestones
    milestone_percentages INTEGER[], -- [25, 50, 75, 100]
    milestone_rewards TEXT[], -- Celebration messages
    
    -- Recommendations
    recommended_frequency VARCHAR(50), -- How often to check progress
    success_tips TEXT[],
    common_obstacles TEXT[],
    
    -- Popularity
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2), -- % of users who complete this goal
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goal_templates_category ON goal_templates(template_category);
CREATE INDEX idx_goal_templates_active ON goal_templates(is_active);

-- =====================================================
-- GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    template_id UUID, -- Link to template if used
    
    -- Goal details
    goal_name VARCHAR(200) NOT NULL,
    goal_category VARCHAR(50), -- 'weight_loss', 'muscle_gain', 'strength', 'endurance', 'health', 'performance'
    goal_type VARCHAR(50) NOT NULL, -- 'single_metric', 'multi_metric', 'habit', 'milestone'
    description TEXT,
    
    -- Timeline
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    duration_days INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned', 'paused', 'failed'
    completion_date DATE,
    
    -- Visibility
    is_public BOOLEAN DEFAULT FALSE,
    share_progress BOOLEAN DEFAULT FALSE,
    
    -- Motivation
    why_important TEXT, -- User's personal reason
    motivation_level INTEGER, -- 1-10 scale
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_category ON goals(goal_category);
CREATE INDEX idx_goals_target_date ON goals(target_date);

-- =====================================================
-- GOAL METRICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    
    -- Metric details
    metric_name VARCHAR(100) NOT NULL, -- 'body_weight', 'bench_press_1rm', 'body_fat_percent', etc.
    metric_type VARCHAR(50), -- 'numeric', 'boolean', 'duration', 'count'
    metric_unit VARCHAR(20), -- 'lb', 'kg', '%', 'reps', 'minutes', etc.
    
    -- Target values
    starting_value DECIMAL(10,2) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2),
    
    -- Progress
    progress_percentage DECIMAL(5,2), -- 0-100%
    change_amount DECIMAL(10,2), -- Absolute change
    change_percentage DECIMAL(6,2), -- % change from start
    
    -- Direction
    direction VARCHAR(20), -- 'increase', 'decrease', 'maintain'
    is_primary BOOLEAN DEFAULT FALSE, -- Primary metric for the goal
    
    -- Tracking
    last_updated DATE,
    update_frequency VARCHAR(50), -- 'daily', 'weekly', 'biweekly', 'monthly'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goal_metrics_goal ON goal_metrics(goal_id);
CREATE INDEX idx_goal_metrics_primary ON goal_metrics(is_primary);

-- =====================================================
-- GOAL PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    
    -- Progress snapshot
    progress_date DATE NOT NULL,
    overall_progress_percentage DECIMAL(5,2) NOT NULL, -- 0-100%
    
    -- Status at this point
    days_elapsed INTEGER,
    days_remaining INTEGER,
    on_track BOOLEAN,
    
    -- Pace analysis
    expected_progress DECIMAL(5,2), -- Where you should be
    actual_progress DECIMAL(5,2), -- Where you are
    pace_vs_target DECIMAL(6,2), -- % ahead or behind
    
    -- Predictions
    predicted_completion_date DATE,
    likelihood_of_success DECIMAL(5,2), -- 0-100%
    
    -- Metrics snapshot
    metrics_snapshot JSONB, -- All metric values at this point
    
    -- Notes
    notes TEXT,
    mood_rating INTEGER, -- 1-10 how you feel about progress
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goal_progress_goal ON goal_progress(goal_id);
CREATE INDEX idx_goal_progress_date ON goal_progress(progress_date);
CREATE UNIQUE INDEX idx_goal_progress_goal_date ON goal_progress(goal_id, progress_date);

-- =====================================================
-- MILESTONES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    
    -- Milestone details
    milestone_name VARCHAR(200) NOT NULL,
    milestone_percentage INTEGER NOT NULL, -- 25, 50, 75, 100
    milestone_order INTEGER, -- 1, 2, 3, 4
    
    -- Target
    target_value DECIMAL(10,2),
    target_date DATE,
    
    -- Achievement
    achieved BOOLEAN DEFAULT FALSE,
    achieved_date DATE,
    achieved_value DECIMAL(10,2),
    days_to_achieve INTEGER,
    
    -- Celebration
    celebration_message TEXT,
    celebration_emoji VARCHAR(10),
    reward_unlocked VARCHAR(100),
    
    -- Sharing
    shared BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_milestones_goal ON goal_milestones(goal_id);
CREATE INDEX idx_milestones_achieved ON goal_milestones(achieved);
CREATE INDEX idx_milestones_percentage ON goal_milestones(milestone_percentage);

-- =====================================================
-- GOAL RECOMMENDATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Recommendation details
    recommendation_type VARCHAR(50), -- 'new_goal', 'adjust_goal', 'stretch_goal', 'maintenance_goal'
    recommended_goal_template_id UUID REFERENCES goal_templates(id),
    
    -- Reasoning
    recommendation_reason TEXT,
    based_on_data VARCHAR(100)[], -- What data supports this recommendation
    confidence_score DECIMAL(5,2), -- 0-100%
    
    -- Suggested goal
    suggested_goal_name VARCHAR(200),
    suggested_category VARCHAR(50),
    suggested_duration_days INTEGER,
    suggested_target_value DECIMAL(10,2),
    
    -- Priority
    priority VARCHAR(20), -- 'high', 'medium', 'low'
    urgency VARCHAR(20), -- 'immediate', 'within_week', 'within_month', 'anytime'
    
    -- Expected outcomes
    expected_benefit TEXT,
    success_probability DECIMAL(5,2), -- 0-100%
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'dismissed'
    user_response_date DATE,
    goal_created_id UUID REFERENCES goals(id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goal_recommendations_user ON goal_recommendations(user_id);
CREATE INDEX idx_goal_recommendations_status ON goal_recommendations(status);
CREATE INDEX idx_goal_recommendations_priority ON goal_recommendations(priority);

-- =====================================================
-- GOAL ADJUSTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    
    -- Adjustment details
    adjustment_date DATE NOT NULL,
    adjustment_type VARCHAR(50), -- 'target_change', 'timeline_extension', 'timeline_reduction', 'metric_change', 'pause', 'resume'
    
    -- Old values
    old_target_value DECIMAL(10,2),
    old_target_date DATE,
    old_status VARCHAR(20),
    
    -- New values
    new_target_value DECIMAL(10,2),
    new_target_date DATE,
    new_status VARCHAR(20),
    
    -- Reasoning
    reason TEXT,
    adjustment_reason_category VARCHAR(50), -- 'too_easy', 'too_hard', 'life_event', 'injury', 'motivation', 'strategy_change'
    
    -- Impact
    impact_on_progress DECIMAL(6,2), -- % impact
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goal_adjustments_goal ON goal_adjustments(goal_id);
CREATE INDEX idx_goal_adjustments_date ON goal_adjustments(adjustment_date);

-- =====================================================
-- GOAL ACHIEVEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    goal_id UUID NOT NULL REFERENCES goals(id),
    
    -- Achievement details
    achievement_type VARCHAR(50), -- 'goal_completed', 'milestone_reached', 'streak_achieved', 'personal_best'
    achievement_name VARCHAR(200) NOT NULL,
    achievement_date DATE NOT NULL,
    
    -- Details
    achievement_value DECIMAL(10,2),
    achievement_description TEXT,
    
    -- Badges and rewards
    badge_earned VARCHAR(100),
    badge_icon VARCHAR(50),
    points_earned INTEGER,
    
    -- Celebration
    celebration_message TEXT,
    celebration_shown BOOLEAN DEFAULT FALSE,
    
    -- Sharing
    shareable BOOLEAN DEFAULT TRUE,
    shared BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_achievements_user ON goal_achievements(user_id);
CREATE INDEX idx_achievements_goal ON goal_achievements(goal_id);
CREATE INDEX idx_achievements_date ON goal_achievements(achievement_date);
CREATE INDEX idx_achievements_type ON goal_achievements(achievement_type);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Calculate goal progress percentage
CREATE OR REPLACE FUNCTION calculate_goal_progress(
    p_goal_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
    v_progress DECIMAL;
    v_metric_count INTEGER;
BEGIN
    -- Calculate average progress across all metrics
    SELECT 
        AVG(progress_percentage),
        COUNT(*)
    INTO v_progress, v_metric_count
    FROM goal_metrics
    WHERE goal_id = p_goal_id;
    
    RETURN COALESCE(v_progress, 0);
END;
$$ LANGUAGE plpgsql;

-- Check if goal is on track
CREATE OR REPLACE FUNCTION is_goal_on_track(
    p_goal_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_on_track BOOLEAN;
    v_expected_progress DECIMAL;
    v_actual_progress DECIMAL;
    v_start_date DATE;
    v_target_date DATE;
    v_days_elapsed INTEGER;
    v_total_days INTEGER;
BEGIN
    -- Get goal dates
    SELECT start_date, target_date
    INTO v_start_date, v_target_date
    FROM goals
    WHERE id = p_goal_id;
    
    -- Calculate expected progress based on time
    v_days_elapsed := CURRENT_DATE - v_start_date;
    v_total_days := v_target_date - v_start_date;
    
    IF v_total_days > 0 THEN
        v_expected_progress := (v_days_elapsed::DECIMAL / v_total_days) * 100;
    ELSE
        v_expected_progress := 0;
    END IF;
    
    -- Get actual progress
    v_actual_progress := calculate_goal_progress(p_goal_id);
    
    -- On track if actual >= 90% of expected
    v_on_track := v_actual_progress >= (v_expected_progress * 0.9);
    
    RETURN v_on_track;
END;
$$ LANGUAGE plpgsql;

-- Get active goals for user
CREATE OR REPLACE FUNCTION get_active_goals(
    p_user_id UUID
)
RETURNS TABLE (
    goal_id UUID,
    goal_name VARCHAR,
    category VARCHAR,
    progress DECIMAL,
    days_remaining INTEGER,
    on_track BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.goal_name,
        g.goal_category,
        calculate_goal_progress(g.id),
        (g.target_date - CURRENT_DATE)::INTEGER,
        is_goal_on_track(g.id)
    FROM goals g
    WHERE g.user_id = p_user_id
      AND g.status = 'active'
    ORDER BY g.target_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Check for milestone achievements
CREATE OR REPLACE FUNCTION check_milestone_achievements(
    p_goal_id UUID
)
RETURNS TABLE (
    milestone_id UUID,
    milestone_name VARCHAR,
    milestone_percentage INTEGER,
    newly_achieved BOOLEAN
) AS $$
DECLARE
    v_current_progress DECIMAL;
BEGIN
    -- Get current progress
    v_current_progress := calculate_goal_progress(p_goal_id);
    
    RETURN QUERY
    SELECT 
        m.id,
        m.milestone_name,
        m.milestone_percentage,
        (v_current_progress >= m.milestone_percentage AND NOT m.achieved) as newly_achieved
    FROM goal_milestones m
    WHERE m.goal_id = p_goal_id
    ORDER BY m.milestone_order;
END;
$$ LANGUAGE plpgsql;

-- Get goal statistics for user
CREATE OR REPLACE FUNCTION get_goal_statistics(
    p_user_id UUID
)
RETURNS TABLE (
    total_goals INTEGER,
    active_goals INTEGER,
    completed_goals INTEGER,
    abandoned_goals INTEGER,
    completion_rate DECIMAL,
    avg_completion_days DECIMAL,
    total_achievements INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_goals,
        COUNT(*) FILTER (WHERE status = 'active')::INTEGER as active_goals,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_goals,
        COUNT(*) FILTER (WHERE status = 'abandoned')::INTEGER as abandoned_goals,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / 
             NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'abandoned')), 0)) * 100, 
            2
        ) as completion_rate,
        ROUND(
            AVG(completion_date - start_date) FILTER (WHERE status = 'completed'),
            1
        ) as avg_completion_days,
        (SELECT COUNT(*) FROM goal_achievements WHERE user_id = p_user_id)::INTEGER as total_achievements
    FROM goals
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Update goal metric progress
CREATE OR REPLACE FUNCTION update_goal_metric_progress(
    p_metric_id UUID,
    p_new_value DECIMAL
)
RETURNS VOID AS $$
DECLARE
    v_starting_value DECIMAL;
    v_target_value DECIMAL;
    v_progress DECIMAL;
    v_change DECIMAL;
    v_change_pct DECIMAL;
BEGIN
    -- Get metric details
    SELECT starting_value, target_value
    INTO v_starting_value, v_target_value
    FROM goal_metrics
    WHERE id = p_metric_id;
    
    -- Calculate progress
    IF v_target_value != v_starting_value THEN
        v_progress := ((p_new_value - v_starting_value) / (v_target_value - v_starting_value)) * 100;
        v_progress := GREATEST(0, LEAST(100, v_progress)); -- Clamp to 0-100
    ELSE
        v_progress := 100;
    END IF;
    
    -- Calculate changes
    v_change := p_new_value - v_starting_value;
    IF v_starting_value != 0 THEN
        v_change_pct := (v_change / v_starting_value) * 100;
    ELSE
        v_change_pct := 0;
    END IF;
    
    -- Update metric
    UPDATE goal_metrics
    SET 
        current_value = p_new_value,
        progress_percentage = v_progress,
        change_amount = v_change,
        change_percentage = v_change_pct,
        last_updated = CURRENT_DATE
    WHERE id = p_metric_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_goal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goals_timestamp
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_timestamp();

-- Auto-calculate duration when dates change
CREATE OR REPLACE FUNCTION calculate_goal_duration()
RETURNS TRIGGER AS $$
BEGIN
    NEW.duration_days := NEW.target_date - NEW.start_date;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_duration
    BEFORE INSERT OR UPDATE OF start_date, target_date ON goals
    FOR EACH ROW
    EXECUTE FUNCTION calculate_goal_duration();

-- =====================================================
-- SEED DATA - GOAL TEMPLATES
-- =====================================================

INSERT INTO goal_templates (template_name, template_category, description, goal_type, primary_metric, default_duration_days, difficulty_level, milestone_percentages, success_tips) VALUES
('Lose 10 Pounds', 'weight_loss', 'Lose 10 pounds through healthy diet and exercise', 'single_metric', 'body_weight', 90, 'beginner', ARRAY[25, 50, 75, 100], ARRAY['Track calories daily', 'Exercise 3-4x per week', 'Stay hydrated', 'Get adequate sleep']),
('Gain 10 Pounds of Muscle', 'muscle_gain', 'Build 10 pounds of lean muscle mass', 'single_metric', 'body_weight', 180, 'intermediate', ARRAY[25, 50, 75, 100], ARRAY['Progressive overload', 'Eat in caloric surplus', 'Prioritize protein', 'Rest and recover']),
('Bench Press 225 lbs', 'strength', 'Achieve a 225 lb bench press 1RM', 'single_metric', 'bench_press_1rm', 120, 'intermediate', ARRAY[25, 50, 75, 100], ARRAY['Follow structured program', 'Focus on form', 'Progressive overload', 'Adequate rest between sessions']),
('Run a 5K', 'endurance', 'Complete a 5K run without stopping', 'milestone', 'running_distance', 60, 'beginner', ARRAY[25, 50, 75, 100], ARRAY['Start with walk/run intervals', 'Gradually increase distance', 'Rest days are important', 'Proper footwear matters']),
('Reduce Body Fat to 15%', 'health', 'Lower body fat percentage to 15%', 'single_metric', 'body_fat_percent', 120, 'intermediate', ARRAY[25, 50, 75, 100], ARRAY['Combine cardio and strength training', 'Track macros', 'Be patient', 'Consistency is key']),
('Squat 315 lbs', 'strength', 'Achieve a 315 lb squat 1RM', 'single_metric', 'squat_1rm', 150, 'advanced', ARRAY[25, 50, 75, 100], ARRAY['Focus on depth and form', 'Build supporting muscles', 'Mobility work', 'Progressive overload']),
('Complete 10 Pull-ups', 'strength', 'Perform 10 consecutive pull-ups', 'single_metric', 'pullup_max_reps', 90, 'intermediate', ARRAY[25, 50, 75, 100], ARRAY['Start with negatives', 'Use assistance if needed', 'Train 2-3x per week', 'Lose excess weight if needed']),
('Improve Sleep Quality', 'health', 'Achieve consistent 8 hours of quality sleep', 'single_metric', 'sleep_duration_hours', 30, 'beginner', ARRAY[25, 50, 75, 100], ARRAY['Consistent sleep schedule', 'Limit screen time before bed', 'Cool, dark room', 'Avoid caffeine late']),
('Lower Resting Heart Rate', 'health', 'Reduce resting heart rate by 10 bpm', 'single_metric', 'resting_heart_rate', 90, 'intermediate', ARRAY[25, 50, 75, 100], ARRAY['Regular cardio exercise', 'Stress management', 'Adequate sleep', 'Stay hydrated']),
('Increase Flexibility', 'health', 'Improve overall flexibility score by 20%', 'single_metric', 'flexibility_score', 60, 'beginner', ARRAY[25, 50, 75, 100], ARRAY['Daily stretching routine', 'Hold stretches 30+ seconds', 'Warm up first', 'Be consistent']);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE goal_templates IS 'Pre-built goal templates for common fitness objectives';
COMMENT ON TABLE goals IS 'User-created goals with timeline and status tracking';
COMMENT ON TABLE goal_metrics IS 'Metrics being tracked for each goal';
COMMENT ON TABLE goal_progress IS 'Historical progress snapshots for goals';
COMMENT ON TABLE goal_milestones IS 'Milestone achievements within goals';
COMMENT ON TABLE goal_recommendations IS 'AI-generated goal recommendations';
COMMENT ON TABLE goal_adjustments IS 'History of goal modifications';
COMMENT ON TABLE goal_achievements IS 'Achievements and badges earned';
COMMENT ON FUNCTION calculate_goal_progress IS 'Calculate overall progress percentage for a goal';
COMMENT ON FUNCTION is_goal_on_track IS 'Determine if goal is on track based on timeline';
COMMENT ON FUNCTION get_active_goals IS 'Get all active goals for a user';
COMMENT ON FUNCTION check_milestone_achievements IS 'Check which milestones have been achieved';
COMMENT ON FUNCTION get_goal_statistics IS 'Get goal statistics for a user';
