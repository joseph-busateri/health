-- Sleep Number Bed Integration Schema
-- Stores sleep tracking data from Sleep Number beds

-- =====================================================
-- SLEEP NUMBER SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sleep_number_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_date DATE NOT NULL,
    bed_id VARCHAR(100),
    sleeper_side VARCHAR(20), -- 'left', 'right', 'both'
    
    -- Session timing
    in_bed_time TIMESTAMP,
    out_of_bed_time TIMESTAMP,
    total_time_in_bed_minutes INTEGER,
    
    -- Sleep duration
    total_sleep_time_minutes INTEGER,
    awake_time_minutes INTEGER,
    restless_time_minutes INTEGER,
    restful_time_minutes INTEGER,
    
    -- Sleep quality metrics
    sleep_iq_score INTEGER, -- 0-100, Sleep Number's proprietary score
    sleep_efficiency_percent DECIMAL(5,2),
    
    -- Heart rate data
    avg_heart_rate INTEGER,
    min_heart_rate INTEGER,
    max_heart_rate INTEGER,
    
    -- Respiratory rate
    avg_respiratory_rate DECIMAL(4,1),
    min_respiratory_rate DECIMAL(4,1),
    max_respiratory_rate DECIMAL(4,1),
    
    -- Movement and position
    total_movements INTEGER,
    position_changes INTEGER,
    time_on_left_side_minutes INTEGER,
    time_on_right_side_minutes INTEGER,
    time_on_back_minutes INTEGER,
    time_on_stomach_minutes INTEGER,
    
    -- Sleep stages (if available)
    light_sleep_minutes INTEGER,
    deep_sleep_minutes INTEGER,
    rem_sleep_minutes INTEGER,
    
    -- Bed settings
    sleep_number_setting INTEGER, -- The firmness setting (0-100)
    avg_sleep_number INTEGER,
    
    -- Environmental
    room_temperature DECIMAL(4,1),
    
    -- Notes and metadata
    notes TEXT,
    data_source VARCHAR(50) DEFAULT 'sleep_number_app', -- 'sleep_number_app', 'manual_entry', 'api'
    raw_data JSONB, -- Store original JSON for reference
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sleep_number_user ON sleep_number_sessions(user_id);
CREATE INDEX idx_sleep_number_date ON sleep_number_sessions(session_date);
CREATE INDEX idx_sleep_number_sleeper ON sleep_number_sessions(sleeper_side);
CREATE UNIQUE INDEX idx_sleep_number_unique ON sleep_number_sessions(user_id, session_date, sleeper_side);

-- =====================================================
-- SLEEP NUMBER HOURLY DATA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sleep_number_hourly_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sleep_number_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    hour_timestamp TIMESTAMP NOT NULL,
    
    -- Metrics per hour
    sleep_state VARCHAR(20), -- 'awake', 'restless', 'restful', 'light', 'deep', 'rem'
    heart_rate INTEGER,
    respiratory_rate DECIMAL(4,1),
    movement_count INTEGER,
    sleep_number_setting INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sleep_hourly_session ON sleep_number_hourly_data(session_id);
CREATE INDEX idx_sleep_hourly_user ON sleep_number_hourly_data(user_id);
CREATE INDEX idx_sleep_hourly_timestamp ON sleep_number_hourly_data(hour_timestamp);

-- =====================================================
-- SLEEP GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sleep_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    goal_type VARCHAR(50) NOT NULL, -- 'sleep_duration', 'sleep_iq', 'consistency', 'deep_sleep'
    target_value DECIMAL(6,2) NOT NULL,
    current_value DECIMAL(6,2),
    target_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'achieved', 'abandoned'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    achieved_at TIMESTAMP
);

CREATE INDEX idx_sleep_goals_user ON sleep_goals(user_id);
CREATE INDEX idx_sleep_goals_status ON sleep_goals(status);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get sleep trends over time
CREATE OR REPLACE FUNCTION get_sleep_trends(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    session_date DATE,
    total_sleep_minutes INTEGER,
    sleep_iq_score INTEGER,
    avg_heart_rate INTEGER,
    sleep_efficiency DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sn.session_date,
        sn.total_sleep_time_minutes,
        sn.sleep_iq_score,
        sn.avg_heart_rate,
        sn.sleep_efficiency_percent
    FROM sleep_number_sessions sn
    WHERE sn.user_id = p_user_id
      AND sn.session_date >= CURRENT_DATE - p_days
    ORDER BY sn.session_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Calculate sleep statistics
CREATE OR REPLACE FUNCTION calculate_sleep_stats(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    avg_sleep_duration INTEGER,
    avg_sleep_iq INTEGER,
    avg_deep_sleep INTEGER,
    avg_heart_rate INTEGER,
    total_nights INTEGER,
    consistency_score DECIMAL
) AS $$
DECLARE
    v_avg_sleep INTEGER;
    v_avg_iq INTEGER;
    v_avg_deep INTEGER;
    v_avg_hr INTEGER;
    v_total_nights INTEGER;
    v_consistency DECIMAL;
    v_std_dev DECIMAL;
BEGIN
    -- Calculate averages
    SELECT 
        ROUND(AVG(total_sleep_time_minutes)),
        ROUND(AVG(sleep_iq_score)),
        ROUND(AVG(deep_sleep_minutes)),
        ROUND(AVG(avg_heart_rate)),
        COUNT(*)
    INTO 
        v_avg_sleep,
        v_avg_iq,
        v_avg_deep,
        v_avg_hr,
        v_total_nights
    FROM sleep_number_sessions
    WHERE user_id = p_user_id
      AND session_date >= CURRENT_DATE - p_days;

    -- Calculate consistency (based on standard deviation of sleep duration)
    SELECT STDDEV(total_sleep_time_minutes) INTO v_std_dev
    FROM sleep_number_sessions
    WHERE user_id = p_user_id
      AND session_date >= CURRENT_DATE - p_days;

    -- Consistency score: lower std dev = higher consistency (0-100 scale)
    v_consistency := CASE 
        WHEN v_std_dev IS NULL THEN 0
        WHEN v_std_dev = 0 THEN 100
        ELSE GREATEST(0, 100 - (v_std_dev / 6))
    END;

    RETURN QUERY
    SELECT 
        v_avg_sleep,
        v_avg_iq,
        v_avg_deep,
        v_avg_hr,
        v_total_nights,
        ROUND(v_consistency, 2);
END;
$$ LANGUAGE plpgsql;

-- Get sleep quality breakdown
CREATE OR REPLACE FUNCTION get_sleep_quality_breakdown(
    p_user_id UUID,
    p_session_date DATE
)
RETURNS TABLE (
    light_sleep_percent DECIMAL,
    deep_sleep_percent DECIMAL,
    rem_sleep_percent DECIMAL,
    awake_percent DECIMAL
) AS $$
DECLARE
    v_total_minutes INTEGER;
BEGIN
    SELECT total_sleep_time_minutes INTO v_total_minutes
    FROM sleep_number_sessions
    WHERE user_id = p_user_id
      AND session_date = p_session_date;

    IF v_total_minutes IS NULL OR v_total_minutes = 0 THEN
        RETURN QUERY SELECT 0::DECIMAL, 0::DECIMAL, 0::DECIMAL, 0::DECIMAL;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        ROUND((light_sleep_minutes::DECIMAL / v_total_minutes) * 100, 2),
        ROUND((deep_sleep_minutes::DECIMAL / v_total_minutes) * 100, 2),
        ROUND((rem_sleep_minutes::DECIMAL / v_total_minutes) * 100, 2),
        ROUND((awake_time_minutes::DECIMAL / v_total_minutes) * 100, 2)
    FROM sleep_number_sessions
    WHERE user_id = p_user_id
      AND session_date = p_session_date;
END;
$$ LANGUAGE plpgsql;

-- Check sleep goal progress
CREATE OR REPLACE FUNCTION check_sleep_goal_progress(p_goal_id UUID)
RETURNS TABLE (
    current_value DECIMAL,
    target_value DECIMAL,
    progress_percent DECIMAL,
    is_achieved BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
    v_goal_type VARCHAR;
    v_target DECIMAL;
    v_current DECIMAL;
    v_progress DECIMAL;
    v_achieved BOOLEAN;
BEGIN
    -- Get goal details
    SELECT user_id, goal_type, target_value
    INTO v_user_id, v_goal_type, v_target
    FROM sleep_goals
    WHERE id = p_goal_id;

    -- Calculate current value based on goal type
    IF v_goal_type = 'sleep_duration' THEN
        SELECT AVG(total_sleep_time_minutes) INTO v_current
        FROM sleep_number_sessions
        WHERE user_id = v_user_id
          AND session_date >= CURRENT_DATE - 7;
    ELSIF v_goal_type = 'sleep_iq' THEN
        SELECT AVG(sleep_iq_score) INTO v_current
        FROM sleep_number_sessions
        WHERE user_id = v_user_id
          AND session_date >= CURRENT_DATE - 7;
    ELSIF v_goal_type = 'deep_sleep' THEN
        SELECT AVG(deep_sleep_minutes) INTO v_current
        FROM sleep_number_sessions
        WHERE user_id = v_user_id
          AND session_date >= CURRENT_DATE - 7;
    END IF;

    -- Calculate progress
    v_progress := CASE 
        WHEN v_target > 0 THEN (v_current / v_target) * 100
        ELSE 0
    END;

    v_achieved := v_current >= v_target;

    -- Update goal if achieved
    IF v_achieved THEN
        UPDATE sleep_goals
        SET status = 'achieved',
            achieved_at = CURRENT_TIMESTAMP,
            current_value = v_current
        WHERE id = p_goal_id;
    END IF;

    RETURN QUERY
    SELECT 
        ROUND(v_current, 2),
        v_target,
        ROUND(v_progress, 2),
        v_achieved;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_sleep_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sleep_timestamp
    BEFORE UPDATE ON sleep_number_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_sleep_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE sleep_number_sessions IS 'Sleep tracking data from Sleep Number beds';
COMMENT ON TABLE sleep_number_hourly_data IS 'Hourly breakdown of sleep metrics';
COMMENT ON TABLE sleep_goals IS 'User-defined sleep goals and targets';
COMMENT ON FUNCTION get_sleep_trends IS 'Get sleep trends over specified days';
COMMENT ON FUNCTION calculate_sleep_stats IS 'Calculate sleep statistics and consistency';
COMMENT ON FUNCTION get_sleep_quality_breakdown IS 'Get sleep stage percentages for a session';
COMMENT ON FUNCTION check_sleep_goal_progress IS 'Check progress toward a sleep goal';
