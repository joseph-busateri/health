-- Recovery Optimization Schema
-- HRV-based recovery scoring, sleep analysis, workout readiness, and deload suggestions

-- =====================================================
-- HRV MEASUREMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS hrv_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    measurement_date DATE NOT NULL,
    measurement_time TIME,
    
    -- HRV metrics
    rmssd INTEGER, -- Root Mean Square of Successive Differences (ms)
    sdnn INTEGER, -- Standard Deviation of NN intervals (ms)
    pnn50 DECIMAL(5,2), -- Percentage of successive RR intervals > 50ms
    hrv_score INTEGER, -- 0-100 normalized score
    
    -- Heart rate
    resting_heart_rate INTEGER,
    avg_heart_rate INTEGER,
    
    -- Context
    measurement_position VARCHAR(20), -- 'lying', 'sitting', 'standing'
    measurement_duration INTEGER, -- seconds
    measurement_quality VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'
    
    -- Device info
    device_source VARCHAR(50), -- 'whoop', 'oura', 'apple_watch', 'manual'
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hrv_user ON hrv_measurements(user_id);
CREATE INDEX idx_hrv_date ON hrv_measurements(measurement_date);
CREATE UNIQUE INDEX idx_hrv_user_date ON hrv_measurements(user_id, measurement_date);

-- =====================================================
-- RECOVERY SCORES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS recovery_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    score_date DATE NOT NULL,
    
    -- Overall recovery score (0-100)
    overall_recovery_score INTEGER NOT NULL,
    recovery_status VARCHAR(20), -- 'excellent', 'good', 'moderate', 'poor', 'critical'
    
    -- Component scores (0-100 each)
    hrv_score INTEGER,
    sleep_score INTEGER,
    soreness_score INTEGER,
    stress_score INTEGER,
    fatigue_score INTEGER,
    
    -- HRV-specific metrics
    hrv_baseline INTEGER, -- User's 7-day average
    hrv_current INTEGER, -- Today's value
    hrv_deviation_percent DECIMAL(6,2), -- % deviation from baseline
    hrv_trend VARCHAR(20), -- 'improving', 'stable', 'declining'
    
    -- Sleep metrics
    sleep_duration_minutes INTEGER,
    sleep_quality_rating INTEGER, -- 1-10
    sleep_debt_minutes INTEGER, -- Accumulated sleep debt
    
    -- Workload metrics
    acute_workload DECIMAL(10,2), -- Last 7 days
    chronic_workload DECIMAL(10,2), -- Last 28 days
    acwr DECIMAL(5,2), -- Acute:Chronic Workload Ratio
    training_monotony DECIMAL(5,2),
    training_strain DECIMAL(10,2),
    
    -- Subjective metrics
    muscle_soreness_level INTEGER, -- 1-10
    energy_level INTEGER, -- 1-10
    mood_rating INTEGER, -- 1-10
    motivation_level INTEGER, -- 1-10
    
    -- Readiness
    workout_readiness_score INTEGER, -- 0-100
    recommended_intensity VARCHAR(20), -- 'high', 'moderate', 'low', 'rest'
    
    -- Insights
    recovery_summary TEXT,
    key_factors TEXT[], -- Array of key factors affecting recovery
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recovery_user ON recovery_scores(user_id);
CREATE INDEX idx_recovery_date ON recovery_scores(score_date);
CREATE INDEX idx_recovery_status ON recovery_scores(recovery_status);
CREATE UNIQUE INDEX idx_recovery_user_date ON recovery_scores(user_id, score_date);

-- =====================================================
-- WORKOUT READINESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS workout_readiness (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    readiness_date DATE NOT NULL,
    
    -- Overall readiness (0-100)
    readiness_score INTEGER NOT NULL,
    readiness_level VARCHAR(20), -- 'peak', 'high', 'moderate', 'low', 'rest_needed'
    
    -- Contributing factors
    recovery_contribution INTEGER, -- % contribution
    sleep_contribution INTEGER,
    hrv_contribution INTEGER,
    soreness_contribution INTEGER,
    stress_contribution INTEGER,
    
    -- Recommendations
    recommended_workout_type VARCHAR(50), -- 'strength', 'cardio', 'active_recovery', 'rest'
    recommended_intensity_percent INTEGER, -- % of max intensity
    recommended_volume_percent INTEGER, -- % of normal volume
    recommended_duration_minutes INTEGER,
    
    -- Warnings
    injury_risk_level VARCHAR(20), -- 'low', 'moderate', 'high', 'very_high'
    overtraining_risk VARCHAR(20), -- 'low', 'moderate', 'high'
    deload_recommended BOOLEAN DEFAULT FALSE,
    
    -- Guidance
    workout_guidance TEXT,
    modifications TEXT[],
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_readiness_user ON workout_readiness(user_id);
CREATE INDEX idx_readiness_date ON workout_readiness(readiness_date);
CREATE INDEX idx_readiness_level ON workout_readiness(readiness_level);
CREATE UNIQUE INDEX idx_readiness_user_date ON workout_readiness(user_id, readiness_date);

-- =====================================================
-- DELOAD RECOMMENDATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS deload_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Recommendation details
    recommendation_date DATE NOT NULL,
    deload_urgency VARCHAR(20), -- 'immediate', 'within_week', 'within_2_weeks', 'not_needed'
    deload_type VARCHAR(20), -- 'full_rest', 'active_recovery', 'reduced_volume', 'reduced_intensity'
    
    -- Triggers
    trigger_reasons TEXT[], -- Array of reasons why deload is recommended
    primary_indicator VARCHAR(50), -- Main reason for deload
    
    -- Metrics that triggered deload
    consecutive_poor_recovery_days INTEGER,
    acwr_value DECIMAL(5,2), -- Current ACWR
    hrv_decline_percent DECIMAL(6,2),
    sleep_debt_hours DECIMAL(5,2),
    training_monotony DECIMAL(5,2),
    
    -- Deload plan
    recommended_start_date DATE,
    recommended_duration_days INTEGER,
    recommended_activities TEXT[],
    volume_reduction_percent INTEGER,
    intensity_reduction_percent INTEGER,
    
    -- Expected outcomes
    expected_recovery_improvement INTEGER, -- % improvement expected
    estimated_return_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'completed'
    user_response VARCHAR(20), -- 'accepted', 'postponed', 'rejected'
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Results
    recovery_improvement_actual INTEGER, -- Actual % improvement
    effectiveness_rating INTEGER, -- 1-10
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deload_user ON deload_recommendations(user_id);
CREATE INDEX idx_deload_date ON deload_recommendations(recommendation_date);
CREATE INDEX idx_deload_urgency ON deload_recommendations(deload_urgency);
CREATE INDEX idx_deload_status ON deload_recommendations(status);

-- =====================================================
-- RECOVERY STRATEGIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS recovery_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    strategy_date DATE NOT NULL,
    
    -- Strategy details
    strategy_type VARCHAR(50), -- 'sleep', 'nutrition', 'hydration', 'stress_management', 'active_recovery'
    strategy_name VARCHAR(200),
    description TEXT,
    
    -- Implementation
    recommended_frequency VARCHAR(50), -- 'daily', 'twice_daily', 'weekly', 'as_needed'
    recommended_duration VARCHAR(50),
    priority_level VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
    
    -- Expected impact
    expected_recovery_boost INTEGER, -- % improvement expected
    affected_metrics VARCHAR(100)[], -- Metrics this strategy improves
    
    -- Tracking
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
    adherence_rate DECIMAL(5,2), -- % adherence
    effectiveness_rating INTEGER, -- 1-10
    
    -- Results
    actual_recovery_improvement INTEGER,
    user_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_strategies_user ON recovery_strategies(user_id);
CREATE INDEX idx_strategies_type ON recovery_strategies(strategy_type);
CREATE INDEX idx_strategies_status ON recovery_strategies(status);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Calculate HRV baseline (7-day average)
CREATE OR REPLACE FUNCTION calculate_hrv_baseline(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_baseline INTEGER;
BEGIN
    SELECT ROUND(AVG(rmssd))
    INTO v_baseline
    FROM hrv_measurements
    WHERE user_id = p_user_id
      AND measurement_date >= p_date - INTERVAL '7 days'
      AND measurement_date < p_date
      AND measurement_quality IN ('excellent', 'good');
    
    RETURN COALESCE(v_baseline, 0);
END;
$$ LANGUAGE plpgsql;

-- Calculate Acute:Chronic Workload Ratio (ACWR)
CREATE OR REPLACE FUNCTION calculate_acwr(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL AS $$
DECLARE
    v_acute_load DECIMAL;
    v_chronic_load DECIMAL;
    v_acwr DECIMAL;
BEGIN
    -- Acute workload (last 7 days)
    SELECT COALESCE(SUM(total_volume_lb), 0)
    INTO v_acute_load
    FROM strength_sessions
    WHERE user_id = p_user_id
      AND session_date >= p_date - INTERVAL '7 days'
      AND session_date < p_date;
    
    -- Chronic workload (last 28 days)
    SELECT COALESCE(SUM(total_volume_lb), 0)
    INTO v_chronic_load
    FROM strength_sessions
    WHERE user_id = p_user_id
      AND session_date >= p_date - INTERVAL '28 days'
      AND session_date < p_date;
    
    -- Calculate ratio
    IF v_chronic_load > 0 THEN
        v_acwr := (v_acute_load / 7.0) / (v_chronic_load / 28.0);
    ELSE
        v_acwr := 0;
    END IF;
    
    RETURN ROUND(v_acwr, 2);
END;
$$ LANGUAGE plpgsql;

-- Determine if deload is needed
CREATE OR REPLACE FUNCTION check_deload_needed(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    deload_needed BOOLEAN,
    urgency VARCHAR,
    primary_reason VARCHAR
) AS $$
DECLARE
    v_acwr DECIMAL;
    v_poor_recovery_days INTEGER;
    v_hrv_decline DECIMAL;
    v_deload_needed BOOLEAN := FALSE;
    v_urgency VARCHAR := 'not_needed';
    v_reason VARCHAR := 'none';
BEGIN
    -- Check ACWR
    v_acwr := calculate_acwr(p_user_id, p_date);
    
    -- Count consecutive poor recovery days
    SELECT COUNT(*)
    INTO v_poor_recovery_days
    FROM recovery_scores
    WHERE user_id = p_user_id
      AND score_date >= p_date - INTERVAL '7 days'
      AND recovery_status IN ('poor', 'critical');
    
    -- Check HRV decline
    SELECT 
        CASE 
            WHEN hrv_baseline > 0 THEN 
                ((hrv_baseline - hrv_current)::DECIMAL / hrv_baseline) * 100
            ELSE 0
        END
    INTO v_hrv_decline
    FROM recovery_scores
    WHERE user_id = p_user_id
      AND score_date = p_date;
    
    -- Determine if deload needed
    IF v_acwr > 1.5 THEN
        v_deload_needed := TRUE;
        v_urgency := 'immediate';
        v_reason := 'high_acwr';
    ELSIF v_poor_recovery_days >= 5 THEN
        v_deload_needed := TRUE;
        v_urgency := 'immediate';
        v_reason := 'consecutive_poor_recovery';
    ELSIF v_hrv_decline > 15 THEN
        v_deload_needed := TRUE;
        v_urgency := 'within_week';
        v_reason := 'hrv_decline';
    ELSIF v_acwr > 1.3 THEN
        v_deload_needed := TRUE;
        v_urgency := 'within_2_weeks';
        v_reason := 'elevated_acwr';
    ELSIF v_poor_recovery_days >= 3 THEN
        v_deload_needed := TRUE;
        v_urgency := 'within_week';
        v_reason := 'poor_recovery_trend';
    END IF;
    
    RETURN QUERY
    SELECT v_deload_needed, v_urgency, v_reason;
END;
$$ LANGUAGE plpgsql;

-- Get recovery trend
CREATE OR REPLACE FUNCTION get_recovery_trend(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    score_date DATE,
    recovery_score INTEGER,
    hrv_score INTEGER,
    sleep_score INTEGER,
    readiness_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.score_date,
        rs.overall_recovery_score,
        rs.hrv_score,
        rs.sleep_score,
        wr.readiness_score
    FROM recovery_scores rs
    LEFT JOIN workout_readiness wr ON rs.user_id = wr.user_id AND rs.score_date = wr.readiness_date
    WHERE rs.user_id = p_user_id
      AND rs.score_date >= CURRENT_DATE - p_days
    ORDER BY rs.score_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Calculate workout readiness score
CREATE OR REPLACE FUNCTION calculate_workout_readiness(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_recovery_score INTEGER;
    v_sleep_score INTEGER;
    v_hrv_score INTEGER;
    v_soreness INTEGER;
    v_readiness INTEGER;
BEGIN
    -- Get today's recovery metrics
    SELECT 
        overall_recovery_score,
        sleep_score,
        hrv_score,
        muscle_soreness_level
    INTO 
        v_recovery_score,
        v_sleep_score,
        v_hrv_score,
        v_soreness
    FROM recovery_scores
    WHERE user_id = p_user_id
      AND score_date = p_date;
    
    -- Calculate weighted readiness score
    v_readiness := ROUND(
        (COALESCE(v_recovery_score, 50) * 0.3) +
        (COALESCE(v_sleep_score, 50) * 0.25) +
        (COALESCE(v_hrv_score, 50) * 0.25) +
        ((10 - COALESCE(v_soreness, 5)) * 10 * 0.2)
    );
    
    RETURN GREATEST(0, LEAST(100, v_readiness));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_recovery_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recovery_timestamp
    BEFORE UPDATE ON recovery_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_recovery_timestamp();

CREATE TRIGGER trigger_update_deload_timestamp
    BEFORE UPDATE ON deload_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_recovery_timestamp();

CREATE TRIGGER trigger_update_strategies_timestamp
    BEFORE UPDATE ON recovery_strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_recovery_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE hrv_measurements IS 'Heart Rate Variability measurements for recovery tracking';
COMMENT ON TABLE recovery_scores IS 'Daily recovery scores based on HRV, sleep, and subjective metrics';
COMMENT ON TABLE workout_readiness IS 'Daily workout readiness scores and recommendations';
COMMENT ON TABLE deload_recommendations IS 'Deload week recommendations based on recovery metrics';
COMMENT ON TABLE recovery_strategies IS 'Personalized recovery strategies and their effectiveness';
COMMENT ON FUNCTION calculate_hrv_baseline IS 'Calculate 7-day HRV baseline for user';
COMMENT ON FUNCTION calculate_acwr IS 'Calculate Acute:Chronic Workload Ratio';
COMMENT ON FUNCTION check_deload_needed IS 'Check if deload week is needed';
COMMENT ON FUNCTION get_recovery_trend IS 'Get recovery trend over specified days';
COMMENT ON FUNCTION calculate_workout_readiness IS 'Calculate workout readiness score';
