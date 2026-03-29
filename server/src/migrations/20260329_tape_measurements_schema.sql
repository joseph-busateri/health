-- Tape Measurements Schema
-- Tracks body measurements over time for progress monitoring

-- =====================================================
-- MEASUREMENT TYPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS measurement_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_name VARCHAR(100) NOT NULL UNIQUE,
    body_part VARCHAR(100) NOT NULL, -- 'upper_body', 'lower_body', 'core'
    description TEXT,
    measurement_unit VARCHAR(20) DEFAULT 'inches',
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_measurement_types_body_part ON measurement_types(body_part);

-- =====================================================
-- TAPE MEASUREMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tape_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    measurement_date DATE NOT NULL,
    measurement_type_id UUID REFERENCES measurement_types(id) ON DELETE CASCADE,
    measurement_name VARCHAR(100) NOT NULL, -- Denormalized for quick access
    value_inches DECIMAL(5,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tape_measurements_user ON tape_measurements(user_id);
CREATE INDEX idx_tape_measurements_type ON tape_measurements(measurement_type_id);
CREATE INDEX idx_tape_measurements_date ON tape_measurements(measurement_date);

-- =====================================================
-- MEASUREMENT SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS measurement_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_date DATE NOT NULL,
    total_measurements INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_measurement_sessions_user ON measurement_sessions(user_id);
CREATE INDEX idx_measurement_sessions_date ON measurement_sessions(session_date);

-- =====================================================
-- MEASUREMENT GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS measurement_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    measurement_type_id UUID REFERENCES measurement_types(id) ON DELETE CASCADE,
    measurement_name VARCHAR(100) NOT NULL,
    goal_type VARCHAR(50) NOT NULL, -- 'increase', 'decrease', 'maintain'
    starting_value DECIMAL(5,2) NOT NULL,
    target_value DECIMAL(5,2) NOT NULL,
    target_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'achieved', 'abandoned'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    achieved_at TIMESTAMP
);

CREATE INDEX idx_measurement_goals_user ON measurement_goals(user_id);
CREATE INDEX idx_measurement_goals_status ON measurement_goals(status);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get measurement progress over time
CREATE OR REPLACE FUNCTION get_measurement_progress(
    p_user_id UUID,
    p_measurement_type_id UUID,
    p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
    measurement_date DATE,
    value_inches DECIMAL,
    change_from_previous DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH measurements AS (
        SELECT 
            tm.measurement_date,
            tm.value_inches,
            LAG(tm.value_inches) OVER (ORDER BY tm.measurement_date) as previous_value
        FROM tape_measurements tm
        WHERE tm.user_id = p_user_id
          AND tm.measurement_type_id = p_measurement_type_id
          AND tm.measurement_date >= CURRENT_DATE - p_days
        ORDER BY tm.measurement_date ASC
    )
    SELECT 
        m.measurement_date,
        m.value_inches,
        CASE 
            WHEN m.previous_value IS NOT NULL 
            THEN ROUND(m.value_inches - m.previous_value, 2)
            ELSE NULL
        END as change_from_previous
    FROM measurements m;
END;
$$ LANGUAGE plpgsql;

-- Get all measurements for a specific date
CREATE OR REPLACE FUNCTION get_measurements_by_date(
    p_user_id UUID,
    p_measurement_date DATE
)
RETURNS TABLE (
    measurement_name VARCHAR,
    value_inches DECIMAL,
    body_part VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.measurement_name,
        tm.value_inches,
        mt.body_part
    FROM tape_measurements tm
    JOIN measurement_types mt ON tm.measurement_type_id = mt.id
    WHERE tm.user_id = p_user_id
      AND tm.measurement_date = p_measurement_date
    ORDER BY mt.display_order;
END;
$$ LANGUAGE plpgsql;

-- Calculate measurement trends
CREATE OR REPLACE FUNCTION calculate_measurement_trend(
    p_user_id UUID,
    p_measurement_type_id UUID,
    p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
    trend_direction VARCHAR,
    total_change DECIMAL,
    percent_change DECIMAL,
    avg_value DECIMAL
) AS $$
DECLARE
    first_value DECIMAL;
    last_value DECIMAL;
    avg_val DECIMAL;
BEGIN
    -- Get first and last values
    SELECT tm.value_inches INTO first_value
    FROM tape_measurements tm
    WHERE tm.user_id = p_user_id
      AND tm.measurement_type_id = p_measurement_type_id
      AND tm.measurement_date >= CURRENT_DATE - p_days
    ORDER BY tm.measurement_date ASC
    LIMIT 1;

    SELECT tm.value_inches INTO last_value
    FROM tape_measurements tm
    WHERE tm.user_id = p_user_id
      AND tm.measurement_type_id = p_measurement_type_id
      AND tm.measurement_date >= CURRENT_DATE - p_days
    ORDER BY tm.measurement_date DESC
    LIMIT 1;

    -- Get average
    SELECT AVG(tm.value_inches) INTO avg_val
    FROM tape_measurements tm
    WHERE tm.user_id = p_user_id
      AND tm.measurement_type_id = p_measurement_type_id
      AND tm.measurement_date >= CURRENT_DATE - p_days;

    -- Return results
    RETURN QUERY
    SELECT 
        CASE 
            WHEN last_value > first_value THEN 'increasing'::VARCHAR
            WHEN last_value < first_value THEN 'decreasing'::VARCHAR
            ELSE 'stable'::VARCHAR
        END as trend_direction,
        ROUND(last_value - first_value, 2) as total_change,
        CASE 
            WHEN first_value > 0 THEN ROUND(((last_value - first_value) / first_value) * 100, 2)
            ELSE 0::DECIMAL
        END as percent_change,
        ROUND(avg_val, 2) as avg_value;
END;
$$ LANGUAGE plpgsql;

-- Check measurement goal progress
CREATE OR REPLACE FUNCTION check_measurement_goal_progress(p_goal_id UUID)
RETURNS TABLE (
    current_value DECIMAL,
    target_value DECIMAL,
    progress_percent DECIMAL,
    is_achieved BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
    v_measurement_type_id UUID;
    v_goal_type VARCHAR;
    v_starting_value DECIMAL;
    v_target_value DECIMAL;
    v_current_value DECIMAL;
    v_progress_percent DECIMAL;
    v_is_achieved BOOLEAN;
BEGIN
    -- Get goal details
    SELECT 
        mg.user_id,
        mg.measurement_type_id,
        mg.goal_type,
        mg.starting_value,
        mg.target_value
    INTO 
        v_user_id,
        v_measurement_type_id,
        v_goal_type,
        v_starting_value,
        v_target_value
    FROM measurement_goals mg
    WHERE mg.id = p_goal_id;

    -- Get current value
    SELECT tm.value_inches INTO v_current_value
    FROM tape_measurements tm
    WHERE tm.user_id = v_user_id
      AND tm.measurement_type_id = v_measurement_type_id
    ORDER BY tm.measurement_date DESC
    LIMIT 1;

    -- Calculate progress
    IF v_current_value IS NOT NULL THEN
        v_progress_percent := ROUND(
            ((v_current_value - v_starting_value) / (v_target_value - v_starting_value)) * 100,
            2
        );

        -- Check if achieved
        IF v_goal_type = 'increase' THEN
            v_is_achieved := v_current_value >= v_target_value;
        ELSIF v_goal_type = 'decrease' THEN
            v_is_achieved := v_current_value <= v_target_value;
        ELSE
            v_is_achieved := ABS(v_current_value - v_target_value) <= 0.5;
        END IF;
    ELSE
        v_progress_percent := 0;
        v_is_achieved := FALSE;
    END IF;

    RETURN QUERY
    SELECT 
        v_current_value,
        v_target_value,
        v_progress_percent,
        v_is_achieved;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA - Common Measurement Types
-- =====================================================
INSERT INTO measurement_types (measurement_name, body_part, description, display_order) VALUES
    ('Neck', 'upper_body', 'Circumference of neck', 1),
    ('Shoulders', 'upper_body', 'Circumference around shoulders', 2),
    ('Chest', 'upper_body', 'Circumference around chest at nipple line', 3),
    ('Left Bicep', 'upper_body', 'Circumference of left bicep flexed', 4),
    ('Right Bicep', 'upper_body', 'Circumference of right bicep flexed', 5),
    ('Left Forearm', 'upper_body', 'Circumference of left forearm', 6),
    ('Right Forearm', 'upper_body', 'Circumference of right forearm', 7),
    ('Waist', 'core', 'Circumference at narrowest point of waist', 8),
    ('Hips', 'core', 'Circumference at widest point of hips', 9),
    ('Left Thigh', 'lower_body', 'Circumference of left thigh', 10),
    ('Right Thigh', 'lower_body', 'Circumference of right thigh', 11),
    ('Left Calf', 'lower_body', 'Circumference of left calf', 12),
    ('Right Calf', 'lower_body', 'Circumference of right calf', 13)
ON CONFLICT (measurement_name) DO NOTHING;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update measurement_sessions when measurements are added
CREATE OR REPLACE FUNCTION update_measurement_session()
RETURNS TRIGGER AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Check if session exists for this date
    SELECT id INTO v_session_id
    FROM measurement_sessions
    WHERE user_id = NEW.user_id
      AND session_date = NEW.measurement_date;

    -- Create session if it doesn't exist
    IF v_session_id IS NULL THEN
        INSERT INTO measurement_sessions (user_id, session_date, total_measurements)
        VALUES (NEW.user_id, NEW.measurement_date, 1)
        RETURNING id INTO v_session_id;
    ELSE
        -- Update session count
        UPDATE measurement_sessions
        SET total_measurements = (
            SELECT COUNT(*)
            FROM tape_measurements
            WHERE user_id = NEW.user_id
              AND measurement_date = NEW.measurement_date
        )
        WHERE id = v_session_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_measurement_session
    AFTER INSERT ON tape_measurements
    FOR EACH ROW
    EXECUTE FUNCTION update_measurement_session();

-- Auto-check goal achievement
CREATE OR REPLACE FUNCTION check_goal_achievement()
RETURNS TRIGGER AS $$
DECLARE
    v_goal RECORD;
    v_is_achieved BOOLEAN;
BEGIN
    -- Check all active goals for this measurement type
    FOR v_goal IN 
        SELECT * FROM measurement_goals
        WHERE user_id = NEW.user_id
          AND measurement_type_id = NEW.measurement_type_id
          AND status = 'active'
    LOOP
        -- Check if goal is achieved
        IF v_goal.goal_type = 'increase' THEN
            v_is_achieved := NEW.value_inches >= v_goal.target_value;
        ELSIF v_goal.goal_type = 'decrease' THEN
            v_is_achieved := NEW.value_inches <= v_goal.target_value;
        ELSE
            v_is_achieved := ABS(NEW.value_inches - v_goal.target_value) <= 0.5;
        END IF;

        -- Update goal if achieved
        IF v_is_achieved THEN
            UPDATE measurement_goals
            SET status = 'achieved',
                achieved_at = CURRENT_TIMESTAMP
            WHERE id = v_goal.id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_goal_achievement
    AFTER INSERT OR UPDATE ON tape_measurements
    FOR EACH ROW
    EXECUTE FUNCTION check_goal_achievement();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE measurement_types IS 'Types of body measurements that can be tracked';
COMMENT ON TABLE tape_measurements IS 'Individual body measurements over time';
COMMENT ON TABLE measurement_sessions IS 'Sessions where multiple measurements were taken';
COMMENT ON TABLE measurement_goals IS 'Goals for specific body measurements';
COMMENT ON FUNCTION get_measurement_progress IS 'Get measurement progress over time with changes';
COMMENT ON FUNCTION get_measurements_by_date IS 'Get all measurements for a specific date';
COMMENT ON FUNCTION calculate_measurement_trend IS 'Calculate trend direction and statistics';
COMMENT ON FUNCTION check_measurement_goal_progress IS 'Check progress toward a measurement goal';
