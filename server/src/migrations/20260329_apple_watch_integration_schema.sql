-- Apple Watch Integration Schema
-- Automatic daily sync for Apple Watch Series 9 health data via HealthKit

-- =====================================================
-- APPLE WATCH CONNECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_watch_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    
    -- Device information
    device_name VARCHAR(100), -- "Apple Watch Series 9"
    device_model VARCHAR(50), -- "Watch6,1"
    watch_os_version VARCHAR(20), -- "10.3"
    paired_iphone_model VARCHAR(50),
    
    -- Connection status
    is_connected BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    last_successful_sync_at TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'error', 'disconnected'
    
    -- HealthKit authorization
    healthkit_authorized BOOLEAN DEFAULT FALSE,
    authorized_data_types TEXT[], -- Array of authorized HealthKit data types
    authorization_date TIMESTAMP,
    
    -- Sync settings
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily', 'manual'
    preferred_sync_time TIME DEFAULT '06:00:00', -- When to run daily sync
    
    -- Error tracking
    consecutive_failures INTEGER DEFAULT 0,
    last_error_message TEXT,
    last_error_at TIMESTAMP,
    
    -- Metadata
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_apple_watch_user ON apple_watch_connections(user_id);
CREATE INDEX idx_apple_watch_sync_status ON apple_watch_connections(sync_status);
CREATE INDEX idx_apple_watch_auto_sync ON apple_watch_connections(auto_sync_enabled);

-- =====================================================
-- APPLE WATCH HEALTH DATA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_watch_health_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    data_date DATE NOT NULL,
    
    -- Heart Rate Data
    resting_heart_rate INTEGER, -- bpm
    walking_heart_rate_avg INTEGER, -- bpm
    heart_rate_variability_sdnn DECIMAL(6,2), -- ms (SDNN)
    heart_rate_variability_rmssd DECIMAL(6,2), -- ms (RMSSD)
    vo2_max DECIMAL(5,2), -- ml/kg/min
    
    -- Activity Data
    active_energy_burned INTEGER, -- kcal
    basal_energy_burned INTEGER, -- kcal
    steps INTEGER,
    distance_walking_running DECIMAL(8,2), -- miles
    flights_climbed INTEGER,
    exercise_minutes INTEGER, -- Active minutes
    stand_hours INTEGER, -- Hours with at least 1 minute of standing
    
    -- Activity Rings
    move_ring_percentage INTEGER, -- 0-100+
    exercise_ring_percentage INTEGER, -- 0-100+
    stand_ring_percentage INTEGER, -- 0-100+
    move_goal INTEGER, -- kcal
    exercise_goal INTEGER, -- minutes
    stand_goal INTEGER, -- hours
    
    -- Sleep Data (from Apple Watch)
    sleep_duration_minutes INTEGER,
    sleep_start_time TIMESTAMP,
    sleep_end_time TIMESTAMP,
    time_in_bed_minutes INTEGER,
    time_asleep_minutes INTEGER,
    time_awake_minutes INTEGER,
    
    -- Sleep Stages (Apple Watch Series 9+)
    rem_sleep_minutes INTEGER,
    deep_sleep_minutes INTEGER,
    core_sleep_minutes INTEGER,
    awake_minutes INTEGER,
    sleep_efficiency DECIMAL(5,2), -- percentage
    
    -- Respiratory Data
    respiratory_rate DECIMAL(4,1), -- breaths per minute
    
    -- Blood Oxygen
    blood_oxygen_avg DECIMAL(4,1), -- percentage (SpO2)
    blood_oxygen_min DECIMAL(4,1),
    blood_oxygen_max DECIMAL(4,1),
    
    -- Temperature (Series 9+)
    wrist_temperature_celsius DECIMAL(4,2), -- deviation from baseline
    
    -- Mindfulness
    mindful_minutes INTEGER,
    
    -- Environmental Audio
    headphone_audio_exposure_avg DECIMAL(5,1), -- dB
    environmental_audio_exposure_avg DECIMAL(5,1), -- dB
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'apple_watch', -- 'apple_watch', 'iphone'
    sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_apple_watch_data_user ON apple_watch_health_data(user_id);
CREATE INDEX idx_apple_watch_data_date ON apple_watch_health_data(data_date);
CREATE UNIQUE INDEX idx_apple_watch_data_user_date ON apple_watch_health_data(user_id, data_date);

-- =====================================================
-- APPLE WATCH WORKOUTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_watch_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Workout identification
    healthkit_workout_id VARCHAR(255) UNIQUE, -- UUID from HealthKit
    workout_type VARCHAR(50) NOT NULL, -- 'running', 'cycling', 'strength_training', etc.
    workout_name VARCHAR(200),
    
    -- Timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    -- Metrics
    total_distance DECIMAL(8,2), -- miles
    total_energy_burned INTEGER, -- kcal
    avg_heart_rate INTEGER, -- bpm
    max_heart_rate INTEGER, -- bpm
    min_heart_rate INTEGER, -- bpm
    
    -- Heart Rate Zones (time in each zone)
    time_in_zone_1_minutes INTEGER, -- Very Light (<60% max HR)
    time_in_zone_2_minutes INTEGER, -- Light (60-70% max HR)
    time_in_zone_3_minutes INTEGER, -- Moderate (70-80% max HR)
    time_in_zone_4_minutes INTEGER, -- Hard (80-90% max HR)
    time_in_zone_5_minutes INTEGER, -- Maximum (90-100% max HR)
    
    -- Elevation (for outdoor activities)
    elevation_ascended DECIMAL(8,2), -- feet
    elevation_descended DECIMAL(8,2), -- feet
    
    -- GPS Data
    has_route BOOLEAN DEFAULT FALSE,
    route_data JSONB, -- GPS coordinates if available
    
    -- Swimming specific
    swimming_stroke_count INTEGER,
    swimming_distance_yards DECIMAL(8,2),
    
    -- Cycling specific
    cycling_cadence_avg INTEGER, -- rpm
    cycling_power_avg INTEGER, -- watts
    
    -- Running specific
    running_cadence_avg INTEGER, -- steps per minute
    running_stride_length_avg DECIMAL(5,2), -- meters
    running_vertical_oscillation_avg DECIMAL(5,2), -- cm
    running_ground_contact_time_avg INTEGER, -- ms
    
    -- Weather conditions
    temperature_celsius DECIMAL(4,1),
    humidity_percentage INTEGER,
    
    -- Metadata
    device_name VARCHAR(100),
    sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_apple_watch_workouts_user ON apple_watch_workouts(user_id);
CREATE INDEX idx_apple_watch_workouts_start ON apple_watch_workouts(start_time);
CREATE INDEX idx_apple_watch_workouts_type ON apple_watch_workouts(workout_type);
CREATE INDEX idx_apple_watch_workouts_healthkit_id ON apple_watch_workouts(healthkit_workout_id);

-- =====================================================
-- APPLE WATCH HEART RATE SAMPLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_watch_heart_rate_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Sample data
    sample_time TIMESTAMP NOT NULL,
    heart_rate INTEGER NOT NULL, -- bpm
    
    -- Context
    motion_context VARCHAR(50), -- 'sedentary', 'active', 'not_set'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_apple_watch_hr_user ON apple_watch_heart_rate_samples(user_id);
CREATE INDEX idx_apple_watch_hr_time ON apple_watch_heart_rate_samples(sample_time);
CREATE INDEX idx_apple_watch_hr_user_time ON apple_watch_heart_rate_samples(user_id, sample_time);

-- =====================================================
-- APPLE WATCH SYNC HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS apple_watch_sync_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Sync details
    sync_started_at TIMESTAMP NOT NULL,
    sync_completed_at TIMESTAMP,
    sync_duration_seconds INTEGER,
    
    -- Sync scope
    sync_type VARCHAR(20), -- 'daily', 'hourly', 'manual', 'backfill'
    date_range_start DATE,
    date_range_end DATE,
    
    -- Results
    status VARCHAR(20), -- 'success', 'partial', 'failed'
    records_synced INTEGER DEFAULT 0,
    workouts_synced INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- Data types synced
    data_types_synced TEXT[], -- Array of synced data types
    
    -- Error details
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    triggered_by VARCHAR(50), -- 'cron', 'manual', 'user_request'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_apple_watch_sync_user ON apple_watch_sync_history(user_id);
CREATE INDEX idx_apple_watch_sync_started ON apple_watch_sync_history(sync_started_at);
CREATE INDEX idx_apple_watch_sync_status ON apple_watch_sync_history(status);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get latest Apple Watch data for user
CREATE OR REPLACE FUNCTION get_latest_apple_watch_data(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    data_date DATE,
    resting_hr INTEGER,
    hrv DECIMAL,
    steps INTEGER,
    active_calories INTEGER,
    sleep_minutes INTEGER,
    move_ring INTEGER,
    exercise_ring INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.data_date,
        d.resting_heart_rate,
        d.heart_rate_variability_sdnn,
        d.steps,
        d.active_energy_burned,
        d.sleep_duration_minutes,
        d.move_ring_percentage,
        d.exercise_ring_percentage
    FROM apple_watch_health_data d
    WHERE d.user_id = p_user_id
      AND d.data_date >= CURRENT_DATE - p_days
    ORDER BY d.data_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Get workout summary for date range
CREATE OR REPLACE FUNCTION get_apple_watch_workout_summary(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    workout_type VARCHAR,
    workout_count BIGINT,
    total_duration_minutes BIGINT,
    total_calories BIGINT,
    avg_heart_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.workout_type,
        COUNT(*) as workout_count,
        SUM(w.duration_minutes) as total_duration_minutes,
        SUM(w.total_energy_burned) as total_calories,
        ROUND(AVG(w.avg_heart_rate), 0) as avg_heart_rate
    FROM apple_watch_workouts w
    WHERE w.user_id = p_user_id
      AND DATE(w.start_time) BETWEEN p_start_date AND p_end_date
    GROUP BY w.workout_type
    ORDER BY workout_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Check if sync is needed
CREATE OR REPLACE FUNCTION should_sync_apple_watch(
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_last_sync TIMESTAMP;
    v_auto_sync_enabled BOOLEAN;
    v_sync_frequency VARCHAR(20);
    v_hours_since_sync INTEGER;
BEGIN
    -- Get connection details
    SELECT 
        last_sync_at,
        auto_sync_enabled,
        sync_frequency
    INTO 
        v_last_sync,
        v_auto_sync_enabled,
        v_sync_frequency
    FROM apple_watch_connections
    WHERE user_id = p_user_id
      AND is_connected = TRUE
      AND sync_status = 'active';
    
    -- If no connection found, don't sync
    IF NOT FOUND OR NOT v_auto_sync_enabled THEN
        RETURN FALSE;
    END IF;
    
    -- If never synced, sync now
    IF v_last_sync IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Calculate hours since last sync
    v_hours_since_sync := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - v_last_sync)) / 3600;
    
    -- Check based on frequency
    IF v_sync_frequency = 'hourly' AND v_hours_since_sync >= 1 THEN
        RETURN TRUE;
    ELSIF v_sync_frequency = 'daily' AND v_hours_since_sync >= 24 THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Update sync status
CREATE OR REPLACE FUNCTION update_apple_watch_sync_status(
    p_user_id UUID,
    p_status VARCHAR(20),
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    IF p_status = 'success' THEN
        UPDATE apple_watch_connections
        SET 
            last_sync_at = CURRENT_TIMESTAMP,
            last_successful_sync_at = CURRENT_TIMESTAMP,
            consecutive_failures = 0,
            last_error_message = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id;
    ELSE
        UPDATE apple_watch_connections
        SET 
            last_sync_at = CURRENT_TIMESTAMP,
            consecutive_failures = consecutive_failures + 1,
            last_error_message = p_error_message,
            last_error_at = CURRENT_TIMESTAMP,
            sync_status = CASE 
                WHEN consecutive_failures >= 3 THEN 'error'
                ELSE sync_status
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Get HRV trend
CREATE OR REPLACE FUNCTION get_apple_watch_hrv_trend(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    data_date DATE,
    hrv_sdnn DECIMAL,
    hrv_7day_avg DECIMAL,
    trend VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH hrv_data AS (
        SELECT 
            d.data_date,
            d.heart_rate_variability_sdnn,
            AVG(d.heart_rate_variability_sdnn) OVER (
                ORDER BY d.data_date 
                ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
            ) as rolling_avg
        FROM apple_watch_health_data d
        WHERE d.user_id = p_user_id
          AND d.data_date >= CURRENT_DATE - p_days
          AND d.heart_rate_variability_sdnn IS NOT NULL
    )
    SELECT 
        h.data_date,
        h.heart_rate_variability_sdnn,
        ROUND(h.rolling_avg, 2),
        CASE 
            WHEN h.heart_rate_variability_sdnn > h.rolling_avg * 1.1 THEN 'improving'
            WHEN h.heart_rate_variability_sdnn < h.rolling_avg * 0.9 THEN 'declining'
            ELSE 'stable'
        END as trend
    FROM hrv_data h
    ORDER BY h.data_date DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_apple_watch_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_apple_watch_connections_timestamp
    BEFORE UPDATE ON apple_watch_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_apple_watch_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE apple_watch_connections IS 'Apple Watch device connections and sync settings';
COMMENT ON TABLE apple_watch_health_data IS 'Daily aggregated health data from Apple Watch';
COMMENT ON TABLE apple_watch_workouts IS 'Individual workout sessions from Apple Watch';
COMMENT ON TABLE apple_watch_heart_rate_samples IS 'Raw heart rate samples for detailed analysis';
COMMENT ON TABLE apple_watch_sync_history IS 'History of sync operations';
COMMENT ON FUNCTION get_latest_apple_watch_data IS 'Get recent Apple Watch health data';
COMMENT ON FUNCTION get_apple_watch_workout_summary IS 'Get workout summary for date range';
COMMENT ON FUNCTION should_sync_apple_watch IS 'Check if automatic sync is needed';
COMMENT ON FUNCTION update_apple_watch_sync_status IS 'Update sync status after sync attempt';
COMMENT ON FUNCTION get_apple_watch_hrv_trend IS 'Get HRV trend with 7-day rolling average';
