-- Apple Health / HealthKit Integration Schema
-- Central hub for all device data synced through Apple Health

-- =====================================================
-- SLEEP DATA
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_health_sleep (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    source_name VARCHAR(255),
    value VARCHAR(50), -- 'inBed', 'asleep', 'awake'
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    data_source VARCHAR(100) DEFAULT 'apple_health',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, start_date, end_date)
);

CREATE INDEX idx_apple_health_sleep_user ON apple_health_sleep(user_id);
CREATE INDEX idx_apple_health_sleep_date ON apple_health_sleep(start_date);

-- =====================================================
-- HEART RATE DATA
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_health_heart_rate (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    source_name VARCHAR(255),
    value NUMERIC(5,2) NOT NULL, -- BPM
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    data_source VARCHAR(100) DEFAULT 'apple_health',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, start_date)
);

CREATE INDEX idx_apple_health_hr_user ON apple_health_heart_rate(user_id);
CREATE INDEX idx_apple_health_hr_date ON apple_health_heart_rate(start_date);

-- =====================================================
-- STEPS / ACTIVITY DATA
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_health_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    source_name VARCHAR(255),
    value INTEGER NOT NULL, -- step count
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    data_source VARCHAR(100) DEFAULT 'apple_health',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, start_date)
);

CREATE INDEX idx_apple_health_steps_user ON apple_health_steps(user_id);
CREATE INDEX idx_apple_health_steps_date ON apple_health_steps(start_date);

-- =====================================================
-- WORKOUT DATA
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_health_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    source_name VARCHAR(255),
    workout_type VARCHAR(100),
    duration NUMERIC(10,2), -- minutes
    calories NUMERIC(10,2),
    distance NUMERIC(10,2), -- meters
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    data_source VARCHAR(100) DEFAULT 'apple_health',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, start_date, end_date)
);

CREATE INDEX idx_apple_health_workouts_user ON apple_health_workouts(user_id);
CREATE INDEX idx_apple_health_workouts_date ON apple_health_workouts(start_date);
CREATE INDEX idx_apple_health_workouts_type ON apple_health_workouts(workout_type);

-- =====================================================
-- BODY MEASUREMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_health_body_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    source_name VARCHAR(255),
    measurement_type VARCHAR(50) NOT NULL, -- 'weight', 'body_fat', 'lean_mass', etc.
    value NUMERIC(10,2) NOT NULL,
    unit VARCHAR(20),
    start_date TIMESTAMP NOT NULL,
    data_source VARCHAR(100) DEFAULT 'apple_health',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, measurement_type, start_date)
);

CREATE INDEX idx_apple_health_body_user ON apple_health_body_measurements(user_id);
CREATE INDEX idx_apple_health_body_type ON apple_health_body_measurements(measurement_type);
CREATE INDEX idx_apple_health_body_date ON apple_health_body_measurements(start_date);

-- =====================================================
-- NUTRITION DATA
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_health_nutrition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    source_name VARCHAR(255),
    nutrient_type VARCHAR(50) NOT NULL, -- 'calories', 'protein', 'carbs', 'fat'
    value NUMERIC(10,2) NOT NULL,
    unit VARCHAR(20),
    start_date TIMESTAMP NOT NULL,
    data_source VARCHAR(100) DEFAULT 'apple_health',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, nutrient_type, start_date)
);

CREATE INDEX idx_apple_health_nutrition_user ON apple_health_nutrition(user_id);
CREATE INDEX idx_apple_health_nutrition_type ON apple_health_nutrition(nutrient_type);
CREATE INDEX idx_apple_health_nutrition_date ON apple_health_nutrition(start_date);

-- =====================================================
-- BLOOD GLUCOSE DATA
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_health_blood_glucose (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    source_name VARCHAR(255),
    value NUMERIC(6,2) NOT NULL, -- mg/dL
    unit VARCHAR(20) DEFAULT 'mg/dL',
    start_date TIMESTAMP NOT NULL,
    data_source VARCHAR(100) DEFAULT 'apple_health',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, start_date)
);

CREATE INDEX idx_apple_health_glucose_user ON apple_health_blood_glucose(user_id);
CREATE INDEX idx_apple_health_glucose_date ON apple_health_blood_glucose(start_date);

-- =====================================================
-- HRV (Heart Rate Variability) DATA
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_health_hrv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    source_name VARCHAR(255),
    value NUMERIC(6,2) NOT NULL, -- milliseconds
    start_date TIMESTAMP NOT NULL,
    data_source VARCHAR(100) DEFAULT 'apple_health',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, start_date)
);

CREATE INDEX idx_apple_health_hrv_user ON apple_health_hrv(user_id);
CREATE INDEX idx_apple_health_hrv_date ON apple_health_hrv(start_date);

-- =====================================================
-- SYNC LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_health_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    last_sync TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, data_type)
);

CREATE INDEX idx_apple_health_sync_user ON apple_health_sync_log(user_id);
CREATE INDEX idx_apple_health_sync_type ON apple_health_sync_log(data_type);

-- =====================================================
-- HELPER FUNCTION: Get Health Data Summary
-- =====================================================
CREATE OR REPLACE FUNCTION get_health_data_summary(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    avg_sleep_hours NUMERIC,
    avg_heart_rate NUMERIC,
    total_steps INTEGER,
    total_workouts INTEGER,
    avg_hrv NUMERIC,
    latest_weight NUMERIC,
    data_sources TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH date_range AS (
        SELECT 
            CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL AS start_date,
            CURRENT_TIMESTAMP AS end_date
    ),
    sleep_stats AS (
        SELECT 
            AVG(EXTRACT(EPOCH FROM (end_date - start_date)) / 3600) AS avg_hours
        FROM apple_health_sleep
        WHERE user_id = p_user_id
        AND value = 'asleep'
        AND start_date >= (SELECT start_date FROM date_range)
    ),
    hr_stats AS (
        SELECT AVG(value) AS avg_hr
        FROM apple_health_heart_rate
        WHERE user_id = p_user_id
        AND start_date >= (SELECT start_date FROM date_range)
    ),
    steps_stats AS (
        SELECT SUM(value) AS total
        FROM apple_health_steps
        WHERE user_id = p_user_id
        AND start_date >= (SELECT start_date FROM date_range)
    ),
    workout_stats AS (
        SELECT COUNT(*) AS total
        FROM apple_health_workouts
        WHERE user_id = p_user_id
        AND start_date >= (SELECT start_date FROM date_range)
    ),
    hrv_stats AS (
        SELECT AVG(value) AS avg_hrv
        FROM apple_health_hrv
        WHERE user_id = p_user_id
        AND start_date >= (SELECT start_date FROM date_range)
    ),
    weight_stats AS (
        SELECT value
        FROM apple_health_body_measurements
        WHERE user_id = p_user_id
        AND measurement_type = 'weight'
        ORDER BY start_date DESC
        LIMIT 1
    ),
    sources AS (
        SELECT ARRAY_AGG(DISTINCT source_name) AS sources
        FROM (
            SELECT source_name FROM apple_health_sleep WHERE user_id = p_user_id
            UNION
            SELECT source_name FROM apple_health_heart_rate WHERE user_id = p_user_id
            UNION
            SELECT source_name FROM apple_health_steps WHERE user_id = p_user_id
            UNION
            SELECT source_name FROM apple_health_workouts WHERE user_id = p_user_id
        ) all_sources
    )
    SELECT 
        COALESCE((SELECT avg_hours FROM sleep_stats), 0)::NUMERIC,
        COALESCE((SELECT avg_hr FROM hr_stats), 0)::NUMERIC,
        COALESCE((SELECT total FROM steps_stats), 0)::INTEGER,
        COALESCE((SELECT total FROM workout_stats), 0)::INTEGER,
        COALESCE((SELECT avg_hrv FROM hrv_stats), 0)::NUMERIC,
        COALESCE((SELECT value FROM weight_stats), 0)::NUMERIC,
        COALESCE((SELECT sources FROM sources), ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE apple_health_sleep IS 'Sleep data from Apple Health (Sleep Number, Oura, Apple Watch, etc.)';
COMMENT ON TABLE apple_health_heart_rate IS 'Heart rate data from all connected wearables';
COMMENT ON TABLE apple_health_steps IS 'Daily step count from all activity trackers';
COMMENT ON TABLE apple_health_workouts IS 'Workout sessions from all fitness apps';
COMMENT ON TABLE apple_health_body_measurements IS 'Body measurements from smart scales and manual entries';
COMMENT ON TABLE apple_health_nutrition IS 'Nutrition data from MyFitnessPal, Lose It, etc.';
COMMENT ON TABLE apple_health_blood_glucose IS 'Blood glucose from CGMs (Dexcom, Freestyle Libre)';
COMMENT ON TABLE apple_health_hrv IS 'Heart rate variability from wearables';
COMMENT ON TABLE apple_health_sync_log IS 'Tracks last sync time for each data type';
