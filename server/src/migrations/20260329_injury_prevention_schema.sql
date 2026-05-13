-- Injury Prevention Schema
-- Joint health tracking, pain logging, mobility assessments, and injury risk scoring

-- =====================================================
-- JOINT HEALTH TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS joint_health_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tracking_date DATE NOT NULL,
    
    -- Joint-specific tracking
    joint_name VARCHAR(50) NOT NULL, -- 'knee_left', 'knee_right', 'shoulder_left', 'shoulder_right', 'elbow_left', 'elbow_right', 'hip_left', 'hip_right', 'ankle_left', 'ankle_right', 'wrist_left', 'wrist_right', 'lower_back', 'upper_back', 'neck'
    
    -- Pain assessment
    pain_level INTEGER, -- 0-10 scale (0 = no pain, 10 = severe)
    pain_type VARCHAR(50), -- 'sharp', 'dull', 'aching', 'burning', 'throbbing', 'stabbing', 'none'
    pain_frequency VARCHAR(50), -- 'constant', 'intermittent', 'only_during_activity', 'only_after_activity', 'none'
    pain_duration_minutes INTEGER,
    
    -- Functional assessment
    range_of_motion_percent INTEGER, -- 0-100% (compared to normal)
    stiffness_level INTEGER, -- 0-10 scale
    swelling_present BOOLEAN DEFAULT FALSE,
    swelling_severity INTEGER, -- 0-10 scale
    
    -- Activity impact
    affects_daily_activities BOOLEAN DEFAULT FALSE,
    affects_workout BOOLEAN DEFAULT FALSE,
    activity_limitations TEXT[], -- Array of limited activities
    
    -- Treatment and interventions
    treatments_used TEXT[], -- 'ice', 'heat', 'compression', 'elevation', 'rest', 'medication', 'stretching', 'massage', 'physical_therapy'
    treatment_effectiveness INTEGER, -- 0-10 scale
    
    -- Context
    triggered_by VARCHAR(100), -- What caused the issue
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_joint_health_user ON joint_health_tracking(user_id);
CREATE INDEX idx_joint_health_date ON joint_health_tracking(tracking_date);
CREATE INDEX idx_joint_health_joint ON joint_health_tracking(joint_name);
CREATE INDEX idx_joint_health_pain ON joint_health_tracking(pain_level);

-- =====================================================
-- PAIN LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pain_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    log_date DATE NOT NULL,
    log_time TIME NOT NULL,
    
    -- Pain details
    body_part VARCHAR(50) NOT NULL,
    pain_level INTEGER NOT NULL, -- 0-10 scale
    pain_type VARCHAR(50), -- 'sharp', 'dull', 'aching', 'burning', 'throbbing', 'stabbing'
    pain_location_specific TEXT, -- Detailed location description
    
    -- Pain characteristics
    onset VARCHAR(50), -- 'sudden', 'gradual', 'chronic'
    duration_minutes INTEGER,
    aggravating_factors TEXT[], -- What makes it worse
    relieving_factors TEXT[], -- What makes it better
    
    -- Associated symptoms
    associated_symptoms TEXT[], -- 'numbness', 'tingling', 'weakness', 'swelling', 'bruising', 'redness', 'warmth'
    
    -- Activity context
    activity_at_onset VARCHAR(100), -- What were you doing when it started
    activity_before_onset VARCHAR(100), -- What did you do before
    
    -- Impact
    functional_impact INTEGER, -- 0-10 scale (how much it affects function)
    sleep_impact BOOLEAN DEFAULT FALSE,
    mood_impact INTEGER, -- 0-10 scale
    
    -- Actions taken
    immediate_actions TEXT[], -- What you did right away
    medications_taken TEXT[],
    
    -- Follow-up
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolution_method VARCHAR(100),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pain_logs_user ON pain_logs(user_id);
CREATE INDEX idx_pain_logs_date ON pain_logs(log_date);
CREATE INDEX idx_pain_logs_body_part ON pain_logs(body_part);
CREATE INDEX idx_pain_logs_pain_level ON pain_logs(pain_level);
CREATE INDEX idx_pain_logs_resolved ON pain_logs(resolved);

-- =====================================================
-- MOBILITY ASSESSMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mobility_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    assessment_date DATE NOT NULL,
    
    -- Assessment type
    assessment_type VARCHAR(50), -- 'self_assessment', 'professional', 'functional_movement_screen'
    assessed_by VARCHAR(100), -- 'self', 'physical_therapist', 'trainer', etc.
    
    -- Overall mobility score
    overall_mobility_score INTEGER, -- 0-100
    
    -- Joint-specific mobility scores (0-100 each)
    ankle_mobility_left INTEGER,
    ankle_mobility_right INTEGER,
    knee_mobility_left INTEGER,
    knee_mobility_right INTEGER,
    hip_mobility_left INTEGER,
    hip_mobility_right INTEGER,
    lower_back_mobility INTEGER,
    upper_back_mobility INTEGER,
    shoulder_mobility_left INTEGER,
    shoulder_mobility_right INTEGER,
    elbow_mobility_left INTEGER,
    elbow_mobility_right INTEGER,
    wrist_mobility_left INTEGER,
    wrist_mobility_right INTEGER,
    neck_mobility INTEGER,
    
    -- Functional movement patterns
    squat_pattern_score INTEGER, -- 0-10
    lunge_pattern_score INTEGER,
    push_pattern_score INTEGER,
    pull_pattern_score INTEGER,
    hinge_pattern_score INTEGER,
    rotation_pattern_score INTEGER,
    
    -- Flexibility tests
    sit_and_reach_cm DECIMAL(5,2),
    shoulder_flexibility_score INTEGER, -- 0-10
    hip_flexor_flexibility_score INTEGER,
    hamstring_flexibility_score INTEGER,
    
    -- Balance and stability
    single_leg_balance_seconds_left INTEGER,
    single_leg_balance_seconds_right INTEGER,
    stability_score INTEGER, -- 0-10
    
    -- Asymmetries detected
    asymmetries_detected BOOLEAN DEFAULT FALSE,
    asymmetry_details TEXT[],
    
    -- Limitations identified
    limitations TEXT[],
    compensations TEXT[], -- Movement compensations observed
    
    -- Recommendations
    recommended_exercises TEXT[],
    recommended_stretches TEXT[],
    areas_to_focus TEXT[],
    
    -- Progress tracking
    improvement_since_last DECIMAL(5,2), -- % improvement
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mobility_user ON mobility_assessments(user_id);
CREATE INDEX idx_mobility_date ON mobility_assessments(assessment_date);
CREATE INDEX idx_mobility_score ON mobility_assessments(overall_mobility_score);

-- =====================================================
-- INJURY RISK SCORES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS injury_risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    score_date DATE NOT NULL,
    
    -- Overall injury risk (0-100, higher = more risk)
    overall_risk_score INTEGER NOT NULL,
    risk_level VARCHAR(20), -- 'very_low', 'low', 'moderate', 'high', 'very_high'
    
    -- Risk component scores
    workload_risk_score INTEGER, -- Based on ACWR
    recovery_risk_score INTEGER, -- Based on recovery metrics
    pain_risk_score INTEGER, -- Based on pain logs
    mobility_risk_score INTEGER, -- Based on mobility assessments
    history_risk_score INTEGER, -- Based on injury history
    
    -- Specific joint risks (0-100 each)
    knee_risk_left INTEGER,
    knee_risk_right INTEGER,
    shoulder_risk_left INTEGER,
    shoulder_risk_right INTEGER,
    lower_back_risk INTEGER,
    hip_risk_left INTEGER,
    hip_risk_right INTEGER,
    ankle_risk_left INTEGER,
    ankle_risk_right INTEGER,
    
    -- Risk factors identified
    primary_risk_factors TEXT[],
    secondary_risk_factors TEXT[],
    
    -- Workload metrics
    acute_workload DECIMAL(10,2),
    chronic_workload DECIMAL(10,2),
    acwr DECIMAL(5,2),
    training_monotony DECIMAL(5,2),
    
    -- Pain metrics
    active_pain_sites INTEGER, -- Number of body parts with pain
    max_pain_level INTEGER, -- Highest pain level
    chronic_pain_sites INTEGER, -- Pain lasting > 3 months
    
    -- Mobility metrics
    mobility_score_avg INTEGER,
    asymmetry_count INTEGER,
    limited_rom_joints INTEGER, -- Joints with limited range of motion
    
    -- Recovery metrics
    recovery_score INTEGER,
    consecutive_poor_recovery_days INTEGER,
    
    -- Predictions
    injury_likely_within_days INTEGER, -- Predicted days until potential injury
    highest_risk_areas TEXT[], -- Body parts at highest risk
    
    -- Recommendations
    immediate_actions TEXT[],
    preventive_measures TEXT[],
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_injury_risk_user ON injury_risk_scores(user_id);
CREATE INDEX idx_injury_risk_date ON injury_risk_scores(score_date);
CREATE INDEX idx_injury_risk_level ON injury_risk_scores(risk_level);
CREATE UNIQUE INDEX idx_injury_risk_user_date ON injury_risk_scores(user_id, score_date);

-- =====================================================
-- INJURY HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS injury_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Injury details
    injury_date DATE NOT NULL,
    body_part VARCHAR(50) NOT NULL,
    injury_type VARCHAR(100), -- 'strain', 'sprain', 'tear', 'fracture', 'tendinitis', 'bursitis', 'impingement', etc.
    severity VARCHAR(20), -- 'minor', 'moderate', 'severe', 'critical'
    
    -- Cause
    cause VARCHAR(100), -- 'overuse', 'acute_trauma', 'poor_form', 'inadequate_warmup', 'fatigue', etc.
    activity_during_injury VARCHAR(100),
    
    -- Diagnosis
    diagnosed_by VARCHAR(100), -- 'self', 'doctor', 'physical_therapist', 'specialist'
    diagnosis TEXT,
    imaging_performed BOOLEAN DEFAULT FALSE,
    imaging_results TEXT,
    
    -- Treatment
    treatment_plan TEXT,
    treatments_received TEXT[],
    medications_prescribed TEXT[],
    physical_therapy BOOLEAN DEFAULT FALSE,
    surgery_required BOOLEAN DEFAULT FALSE,
    
    -- Recovery timeline
    time_off_training_days INTEGER,
    recovery_start_date DATE,
    recovery_end_date DATE,
    full_recovery_achieved BOOLEAN DEFAULT FALSE,
    
    -- Return to activity
    return_to_activity_date DATE,
    modified_activity_period_days INTEGER,
    restrictions TEXT[],
    
    -- Recurrence
    recurrent_injury BOOLEAN DEFAULT FALSE,
    original_injury_id UUID, -- Link to original injury if recurrent
    recurrence_count INTEGER DEFAULT 0,
    
    -- Prevention lessons
    lessons_learned TEXT,
    preventive_measures_implemented TEXT[],
    
    -- Current status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'recovering', 'recovered', 'chronic'
    residual_symptoms TEXT[],
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_injury_history_user ON injury_history(user_id);
CREATE INDEX idx_injury_history_date ON injury_history(injury_date);
CREATE INDEX idx_injury_history_body_part ON injury_history(body_part);
CREATE INDEX idx_injury_history_status ON injury_history(status);
CREATE INDEX idx_injury_history_severity ON injury_history(severity);

-- =====================================================
-- PREVENTIVE RECOMMENDATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS preventive_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    recommendation_date DATE NOT NULL,
    
    -- Recommendation details
    recommendation_type VARCHAR(50), -- 'exercise', 'stretching', 'rest', 'modification', 'equipment', 'technique', 'medical'
    priority VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
    urgency VARCHAR(20), -- 'immediate', 'within_week', 'within_month', 'ongoing'
    
    -- Target
    target_body_part VARCHAR(50),
    target_issue VARCHAR(100), -- What this addresses
    
    -- Recommendation content
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    detailed_instructions TEXT,
    
    -- Implementation
    frequency VARCHAR(50), -- 'daily', 'twice_daily', '3x_per_week', 'before_workouts', 'after_workouts'
    duration_minutes INTEGER,
    sets INTEGER,
    reps INTEGER,
    
    -- Expected outcomes
    expected_benefit TEXT,
    expected_timeframe_days INTEGER, -- How long until benefit
    success_metrics TEXT[], -- How to measure success
    
    -- Risk reduction
    risk_reduction_percent INTEGER, -- Expected % reduction in injury risk
    addresses_risk_factors TEXT[],
    
    -- Resources
    video_url VARCHAR(500),
    image_url VARCHAR(500),
    external_resources TEXT[],
    
    -- Tracking
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'dismissed', 'superseded'
    adherence_rate DECIMAL(5,2), -- % adherence
    effectiveness_rating INTEGER, -- 1-10 user rating
    
    -- Results
    actual_benefit TEXT,
    user_feedback TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_preventive_user ON preventive_recommendations(user_id);
CREATE INDEX idx_preventive_date ON preventive_recommendations(recommendation_date);
CREATE INDEX idx_preventive_type ON preventive_recommendations(recommendation_type);
CREATE INDEX idx_preventive_priority ON preventive_recommendations(priority);
CREATE INDEX idx_preventive_status ON preventive_recommendations(status);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Calculate overall injury risk score
CREATE OR REPLACE FUNCTION calculate_injury_risk_score(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_workload_risk INTEGER := 0;
    v_recovery_risk INTEGER := 0;
    v_pain_risk INTEGER := 0;
    v_mobility_risk INTEGER := 0;
    v_history_risk INTEGER := 0;
    v_overall_risk INTEGER;
BEGIN
    -- Workload risk (based on ACWR)
    SELECT 
        CASE 
            WHEN acwr > 1.5 THEN 100
            WHEN acwr > 1.3 THEN 80
            WHEN acwr > 1.2 THEN 60
            WHEN acwr < 0.8 THEN 40
            ELSE 20
        END
    INTO v_workload_risk
    FROM recovery_scores
    WHERE user_id = p_user_id
      AND score_date = p_date;
    
    -- Recovery risk (inverse of recovery score)
    SELECT 100 - overall_recovery_score
    INTO v_recovery_risk
    FROM recovery_scores
    WHERE user_id = p_user_id
      AND score_date = p_date;
    
    -- Pain risk (based on recent pain logs)
    SELECT 
        CASE 
            WHEN COUNT(*) >= 5 THEN 100
            WHEN COUNT(*) >= 3 THEN 80
            WHEN COUNT(*) >= 1 THEN 60
            ELSE 20
        END
    INTO v_pain_risk
    FROM pain_logs
    WHERE user_id = p_user_id
      AND log_date >= p_date - INTERVAL '7 days'
      AND pain_level >= 5;
    
    -- Mobility risk (inverse of mobility score)
    SELECT 100 - overall_mobility_score
    INTO v_mobility_risk
    FROM mobility_assessments
    WHERE user_id = p_user_id
      AND assessment_date <= p_date
    ORDER BY assessment_date DESC
    LIMIT 1;
    
    -- History risk (based on recent injuries)
    SELECT 
        CASE 
            WHEN COUNT(*) >= 3 THEN 100
            WHEN COUNT(*) >= 2 THEN 70
            WHEN COUNT(*) >= 1 THEN 50
            ELSE 10
        END
    INTO v_history_risk
    FROM injury_history
    WHERE user_id = p_user_id
      AND injury_date >= p_date - INTERVAL '6 months'
      AND severity IN ('moderate', 'severe', 'critical');
    
    -- Calculate weighted overall risk
    v_overall_risk := ROUND(
        (COALESCE(v_workload_risk, 20) * 0.25) +
        (COALESCE(v_recovery_risk, 20) * 0.25) +
        (COALESCE(v_pain_risk, 20) * 0.25) +
        (COALESCE(v_mobility_risk, 20) * 0.15) +
        (COALESCE(v_history_risk, 10) * 0.10)
    );
    
    RETURN GREATEST(0, LEAST(100, v_overall_risk));
END;
$$ LANGUAGE plpgsql;

-- Get active pain sites
CREATE OR REPLACE FUNCTION get_active_pain_sites(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    body_part VARCHAR,
    avg_pain_level DECIMAL,
    occurrence_count INTEGER,
    last_occurrence DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pl.body_part,
        ROUND(AVG(pl.pain_level), 1) as avg_pain_level,
        COUNT(*)::INTEGER as occurrence_count,
        MAX(pl.log_date) as last_occurrence
    FROM pain_logs pl
    WHERE pl.user_id = p_user_id
      AND pl.log_date >= CURRENT_DATE - p_days
      AND pl.resolved = FALSE
    GROUP BY pl.body_part
    ORDER BY avg_pain_level DESC, occurrence_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Get mobility trend
CREATE OR REPLACE FUNCTION get_mobility_trend(
    p_user_id UUID,
    p_months INTEGER DEFAULT 3
)
RETURNS TABLE (
    assessment_date DATE,
    overall_score INTEGER,
    improvement DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ma.assessment_date,
        ma.overall_mobility_score,
        ma.improvement_since_last
    FROM mobility_assessments ma
    WHERE ma.user_id = p_user_id
      AND ma.assessment_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
    ORDER BY ma.assessment_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Get injury risk trend
CREATE OR REPLACE FUNCTION get_injury_risk_trend(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    score_date DATE,
    risk_score INTEGER,
    risk_level VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        irs.score_date,
        irs.overall_risk_score,
        irs.risk_level
    FROM injury_risk_scores irs
    WHERE irs.user_id = p_user_id
      AND irs.score_date >= CURRENT_DATE - p_days
    ORDER BY irs.score_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Check if joint has chronic pain
CREATE OR REPLACE FUNCTION check_chronic_pain(
    p_user_id UUID,
    p_joint_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_chronic BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM joint_health_tracking
        WHERE user_id = p_user_id
          AND joint_name = p_joint_name
          AND pain_level >= 3
          AND tracking_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY joint_name
        HAVING COUNT(*) >= 60 -- Pain on 60+ days in last 90 days
    ) INTO v_chronic;
    
    RETURN COALESCE(v_chronic, FALSE);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_injury_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_joint_health_timestamp
    BEFORE UPDATE ON joint_health_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_injury_timestamp();

CREATE TRIGGER trigger_update_injury_history_timestamp
    BEFORE UPDATE ON injury_history
    FOR EACH ROW
    EXECUTE FUNCTION update_injury_timestamp();

CREATE TRIGGER trigger_update_preventive_timestamp
    BEFORE UPDATE ON preventive_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_injury_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE joint_health_tracking IS 'Daily joint health tracking with pain and functional assessments';
COMMENT ON TABLE pain_logs IS 'Detailed pain logging with context and impact tracking';
COMMENT ON TABLE mobility_assessments IS 'Comprehensive mobility and flexibility assessments';
COMMENT ON TABLE injury_risk_scores IS 'Daily injury risk scores based on multiple factors';
COMMENT ON TABLE injury_history IS 'Historical injury tracking with treatment and recovery details';
COMMENT ON TABLE preventive_recommendations IS 'Personalized injury prevention recommendations';
COMMENT ON FUNCTION calculate_injury_risk_score IS 'Calculate overall injury risk score from multiple factors';
COMMENT ON FUNCTION get_active_pain_sites IS 'Get currently active pain sites with statistics';
COMMENT ON FUNCTION get_mobility_trend IS 'Get mobility score trend over time';
COMMENT ON FUNCTION get_injury_risk_trend IS 'Get injury risk trend over time';
COMMENT ON FUNCTION check_chronic_pain IS 'Check if a joint has chronic pain (60+ days in 90 days)';
