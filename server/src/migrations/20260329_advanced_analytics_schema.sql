-- Advanced Analytics Schema
-- Stores correlation analysis, trend predictions, and insights

-- =====================================================
-- CORRELATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS health_correlations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Correlation details
    metric_a VARCHAR(100) NOT NULL, -- 'sleep_quality', 'hrv', 'workout_volume', etc.
    metric_b VARCHAR(100) NOT NULL,
    correlation_coefficient DECIMAL(5,4), -- -1.0 to 1.0
    correlation_strength VARCHAR(20), -- 'strong', 'moderate', 'weak', 'none'
    correlation_direction VARCHAR(20), -- 'positive', 'negative', 'none'
    
    -- Statistical details
    sample_size INTEGER,
    p_value DECIMAL(10,8), -- Statistical significance
    confidence_level DECIMAL(5,2), -- 95%, 99%, etc.
    
    -- Time period
    analysis_start_date DATE NOT NULL,
    analysis_end_date DATE NOT NULL,
    days_analyzed INTEGER,
    
    -- Insights
    insight_summary TEXT,
    actionable_recommendation TEXT,
    
    -- Metadata
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_correlations_user ON health_correlations(user_id);
CREATE INDEX idx_correlations_metrics ON health_correlations(metric_a, metric_b);
CREATE INDEX idx_correlations_strength ON health_correlations(correlation_strength);
CREATE INDEX idx_correlations_date ON health_correlations(analysis_date);

-- =====================================================
-- TREND PREDICTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trend_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Metric being predicted
    metric_name VARCHAR(100) NOT NULL, -- 'body_weight', 'strength_1rm', 'sleep_iq', etc.
    metric_category VARCHAR(50), -- 'body_composition', 'strength', 'sleep', 'bloodwork'
    
    -- Current state
    current_value DECIMAL(10,2),
    current_trend VARCHAR(20), -- 'increasing', 'decreasing', 'stable', 'volatile'
    trend_percentage DECIMAL(6,2), -- % change over period
    
    -- Predictions
    predicted_7_day DECIMAL(10,2),
    predicted_30_day DECIMAL(10,2),
    predicted_90_day DECIMAL(10,2),
    
    -- Confidence
    prediction_confidence DECIMAL(5,2), -- 0-100%
    prediction_method VARCHAR(50), -- 'linear_regression', 'moving_average', 'exponential_smoothing'
    
    -- Historical data
    data_points_used INTEGER,
    historical_start_date DATE,
    historical_end_date DATE,
    
    -- Variance
    standard_deviation DECIMAL(10,4),
    variance DECIMAL(10,4),
    
    -- Goal tracking
    goal_value DECIMAL(10,2),
    days_to_goal INTEGER,
    goal_achievable BOOLEAN,
    
    -- Insights
    trend_summary TEXT,
    recommendation TEXT,
    
    -- Metadata
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_user ON trend_predictions(user_id);
CREATE INDEX idx_predictions_metric ON trend_predictions(metric_name);
CREATE INDEX idx_predictions_category ON trend_predictions(metric_category);
CREATE INDEX idx_predictions_trend ON trend_predictions(current_trend);
CREATE INDEX idx_predictions_date ON trend_predictions(prediction_date);

-- =====================================================
-- INSIGHTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS health_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Insight details
    insight_type VARCHAR(50) NOT NULL, -- 'correlation', 'trend', 'anomaly', 'achievement', 'warning'
    insight_category VARCHAR(50), -- 'sleep', 'recovery', 'performance', 'nutrition', 'overall'
    priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    
    -- Content
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    detailed_analysis TEXT,
    
    -- Recommendations
    primary_recommendation TEXT,
    secondary_recommendations TEXT[], -- Array of additional recommendations
    
    -- Supporting data
    supporting_metrics JSONB, -- Key metrics that support this insight
    data_visualization_config JSONB, -- Config for charts/graphs
    
    -- Impact
    potential_impact VARCHAR(20), -- 'high', 'medium', 'low'
    affected_areas VARCHAR(100)[], -- ['sleep', 'recovery', 'performance']
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    
    -- Metadata
    generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Some insights may be time-sensitive
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_insights_user ON health_insights(user_id);
CREATE INDEX idx_insights_type ON health_insights(insight_type);
CREATE INDEX idx_insights_category ON health_insights(insight_category);
CREATE INDEX idx_insights_priority ON health_insights(priority);
CREATE INDEX idx_insights_status ON health_insights(status);
CREATE INDEX idx_insights_date ON health_insights(generated_date);

-- =====================================================
-- GOAL PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Goal details
    goal_type VARCHAR(50) NOT NULL, -- 'weight_loss', 'strength_gain', 'sleep_improvement', etc.
    goal_category VARCHAR(50), -- 'body_composition', 'strength', 'sleep', 'recovery'
    
    -- Target
    target_metric VARCHAR(100) NOT NULL,
    starting_value DECIMAL(10,2) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2),
    
    -- Progress
    progress_percentage DECIMAL(5,2), -- 0-100%
    progress_status VARCHAR(20), -- 'on_track', 'ahead', 'behind', 'stalled'
    
    -- Timeline
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    days_elapsed INTEGER,
    days_remaining INTEGER,
    
    -- Rate of change
    required_weekly_change DECIMAL(10,4),
    actual_weekly_change DECIMAL(10,4),
    pace_vs_target DECIMAL(6,2), -- % faster or slower than needed
    
    -- Milestones
    milestones_total INTEGER,
    milestones_achieved INTEGER,
    next_milestone_value DECIMAL(10,2),
    next_milestone_date DATE,
    
    -- Predictions
    predicted_completion_date DATE,
    predicted_final_value DECIMAL(10,2),
    likelihood_of_success DECIMAL(5,2), -- 0-100%
    
    -- Insights
    progress_summary TEXT,
    recommendations TEXT[],
    
    -- Status
    goal_status VARCHAR(20) DEFAULT 'active', -- 'active', 'achieved', 'abandoned', 'revised'
    achieved_at TIMESTAMP,
    
    -- Metadata
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goal_progress_user ON goal_progress(user_id);
CREATE INDEX idx_goal_progress_type ON goal_progress(goal_type);
CREATE INDEX idx_goal_progress_status ON goal_progress(progress_status);
CREATE INDEX idx_goal_progress_goal_status ON goal_progress(goal_status);

-- =====================================================
-- HEALTH SCORE BREAKDOWN TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS health_score_breakdown (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    score_date DATE NOT NULL,
    
    -- Overall score
    overall_health_score INTEGER, -- 0-100
    overall_status VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'
    
    -- Component scores
    cardiovascular_score INTEGER,
    recovery_score INTEGER,
    metabolic_score INTEGER,
    performance_score INTEGER,
    sleep_score INTEGER,
    stress_score INTEGER,
    nutrition_score INTEGER,
    
    -- Score changes
    overall_change_7d INTEGER, -- Change from 7 days ago
    overall_change_30d INTEGER, -- Change from 30 days ago
    
    -- Top contributors (positive)
    top_positive_factors VARCHAR(100)[],
    top_positive_impact INTEGER,
    
    -- Top detractors (negative)
    top_negative_factors VARCHAR(100)[],
    top_negative_impact INTEGER,
    
    -- Recommendations
    priority_improvements VARCHAR(100)[],
    quick_wins VARCHAR(100)[],
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_score_user ON health_score_breakdown(user_id);
CREATE INDEX idx_health_score_date ON health_score_breakdown(score_date);
CREATE UNIQUE INDEX idx_health_score_user_date ON health_score_breakdown(user_id, score_date);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Calculate correlation between two metrics
CREATE OR REPLACE FUNCTION calculate_correlation(
    p_user_id UUID,
    p_metric_a VARCHAR,
    p_metric_b VARCHAR,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    correlation DECIMAL,
    strength VARCHAR,
    direction VARCHAR,
    sample_size INTEGER
) AS $$
DECLARE
    v_correlation DECIMAL;
    v_strength VARCHAR;
    v_direction VARCHAR;
    v_count INTEGER;
BEGIN
    -- This is a simplified version
    -- In production, you'd calculate actual Pearson correlation
    
    -- Placeholder calculation
    v_correlation := 0.0;
    v_count := 0;
    
    -- Determine strength
    IF ABS(v_correlation) >= 0.7 THEN
        v_strength := 'strong';
    ELSIF ABS(v_correlation) >= 0.4 THEN
        v_strength := 'moderate';
    ELSIF ABS(v_correlation) >= 0.2 THEN
        v_strength := 'weak';
    ELSE
        v_strength := 'none';
    END IF;
    
    -- Determine direction
    IF v_correlation > 0.1 THEN
        v_direction := 'positive';
    ELSIF v_correlation < -0.1 THEN
        v_direction := 'negative';
    ELSE
        v_direction := 'none';
    END IF;
    
    RETURN QUERY
    SELECT v_correlation, v_strength, v_direction, v_count;
END;
$$ LANGUAGE plpgsql;

-- Get active insights for user
CREATE OR REPLACE FUNCTION get_active_insights(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    insight_id UUID,
    insight_type VARCHAR,
    priority VARCHAR,
    title VARCHAR,
    summary TEXT,
    generated_date TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        hi.insight_type,
        hi.priority,
        hi.title,
        hi.summary,
        hi.generated_date
    FROM health_insights hi
    WHERE hi.user_id = p_user_id
      AND hi.status = 'active'
      AND (hi.expires_at IS NULL OR hi.expires_at > CURRENT_TIMESTAMP)
    ORDER BY 
        CASE hi.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        hi.generated_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get goal progress summary
CREATE OR REPLACE FUNCTION get_goal_progress_summary(p_user_id UUID)
RETURNS TABLE (
    total_goals INTEGER,
    active_goals INTEGER,
    achieved_goals INTEGER,
    on_track_goals INTEGER,
    behind_goals INTEGER,
    avg_progress DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_goals,
        COUNT(*) FILTER (WHERE goal_status = 'active')::INTEGER as active_goals,
        COUNT(*) FILTER (WHERE goal_status = 'achieved')::INTEGER as achieved_goals,
        COUNT(*) FILTER (WHERE progress_status = 'on_track')::INTEGER as on_track_goals,
        COUNT(*) FILTER (WHERE progress_status = 'behind')::INTEGER as behind_goals,
        ROUND(AVG(progress_percentage), 2) as avg_progress
    FROM goal_progress
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Get health score trend
CREATE OR REPLACE FUNCTION get_health_score_trend(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    score_date DATE,
    overall_score INTEGER,
    cardiovascular_score INTEGER,
    recovery_score INTEGER,
    sleep_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hsb.score_date,
        hsb.overall_health_score,
        hsb.cardiovascular_score,
        hsb.recovery_score,
        hsb.sleep_score
    FROM health_score_breakdown hsb
    WHERE hsb.user_id = p_user_id
      AND hsb.score_date >= CURRENT_DATE - p_days
    ORDER BY hsb.score_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Generate daily health score
CREATE OR REPLACE FUNCTION generate_daily_health_score(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_score_id UUID;
    v_overall_score INTEGER;
BEGIN
    -- Calculate overall score (simplified)
    v_overall_score := 75; -- Placeholder
    
    -- Insert or update today's score
    INSERT INTO health_score_breakdown (
        user_id,
        score_date,
        overall_health_score,
        overall_status
    ) VALUES (
        p_user_id,
        CURRENT_DATE,
        v_overall_score,
        CASE 
            WHEN v_overall_score >= 80 THEN 'excellent'
            WHEN v_overall_score >= 60 THEN 'good'
            WHEN v_overall_score >= 40 THEN 'fair'
            ELSE 'poor'
        END
    )
    ON CONFLICT (user_id, score_date) 
    DO UPDATE SET
        overall_health_score = v_overall_score,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_score_id;
    
    RETURN v_score_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_analytics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_correlations_timestamp
    BEFORE UPDATE ON health_correlations
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamp();

CREATE TRIGGER trigger_update_predictions_timestamp
    BEFORE UPDATE ON trend_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamp();

CREATE TRIGGER trigger_update_insights_timestamp
    BEFORE UPDATE ON health_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE health_correlations IS 'Stores correlation analysis between health metrics';
COMMENT ON TABLE trend_predictions IS 'Stores trend predictions and forecasts for health metrics';
COMMENT ON TABLE health_insights IS 'Stores generated insights and recommendations';
COMMENT ON TABLE goal_progress IS 'Tracks progress toward user health goals';
COMMENT ON TABLE health_score_breakdown IS 'Daily health score breakdown by component';
COMMENT ON FUNCTION calculate_correlation IS 'Calculate correlation between two metrics';
COMMENT ON FUNCTION get_active_insights IS 'Get active insights for a user';
COMMENT ON FUNCTION get_goal_progress_summary IS 'Get summary of goal progress';
COMMENT ON FUNCTION get_health_score_trend IS 'Get health score trend over time';
