-- Oura Ring Gen 3 Integration Schema
-- Automatic daily sync for Oura Ring health data via OAuth API

-- =====================================================
-- OURA CONNECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS oura_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    
    -- OAuth tokens (AES-256 encrypted)
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP,
    
    -- Encryption metadata
    encryption_iv TEXT NOT NULL, -- Initialization vector for AES-256
    
    -- Connection status
    connection_status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'disconnected', 'error'
    last_sync_date DATE,
    last_successful_sync_date DATE,
    
    -- Sync settings
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency VARCHAR(20) DEFAULT 'daily', -- 'daily', 'twice_daily'
    preferred_sync_time TIME DEFAULT '06:00:00',
    
    -- Oura account info
    oura_user_id VARCHAR(100),
    email VARCHAR(255),
    
    -- Device info
    ring_model VARCHAR(50), -- 'Gen3 Horizon', 'Gen3 Heritage'
    ring_size VARCHAR(10),
    ring_color VARCHAR(50),
    
    -- Error tracking
    consecutive_failures INTEGER DEFAULT 0,
    last_error_message TEXT,
    last_error_at TIMESTAMP,
    
    -- Metadata
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oura_connections_user ON oura_connections(user_id);
CREATE INDEX idx_oura_connections_status ON oura_connections(connection_status);
CREATE INDEX idx_oura_connections_auto_sync ON oura_connections(auto_sync_enabled);

-- =====================================================
-- OURA SLEEP SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS oura_sleep_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Oura identifiers
    oura_sleep_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Sleep period
    sleep_date DATE NOT NULL, -- Day the sleep is attributed to
    bedtime_start TIMESTAMP NOT NULL,
    bedtime_end TIMESTAMP NOT NULL,
    
    -- Sleep duration (minutes)
    total_sleep_duration INTEGER, -- Total sleep time
    awake_time INTEGER,
    rem_sleep_duration INTEGER,
    light_sleep_duration INTEGER,
    deep_sleep_duration INTEGER,
    
    -- Sleep quality metrics
    sleep_score INTEGER, -- 0-100
    sleep_score_total INTEGER, -- Total score
    sleep_score_disturbances INTEGER,
    sleep_score_efficiency INTEGER,
    sleep_score_latency INTEGER,
    sleep_score_rem INTEGER,
    sleep_score_deep INTEGER,
    sleep_score_alignment INTEGER,
    
    -- Sleep efficiency
    efficiency INTEGER, -- Percentage
    sleep_latency INTEGER, -- Minutes to fall asleep
    
    -- Timing
    timing_score INTEGER,
    midpoint_time INTEGER, -- Minutes from midnight
    
    -- Disturbances
    restless_periods INTEGER,
    
    -- Heart rate during sleep
    hr_lowest INTEGER, -- bpm
    hr_average DECIMAL(5,1), -- bpm
    
    -- HRV during sleep
    hrv_average DECIMAL(6,2), -- ms (RMSSD)
    
    -- Respiratory rate
    breath_average DECIMAL(4,1), -- breaths per minute
    
    -- Temperature
    temperature_delta DECIMAL(4,2), -- Deviation from baseline (Celsius)
    temperature_trend_deviation DECIMAL(4,2),
    
    -- Sleep type
    sleep_type VARCHAR(20), -- 'long_sleep', 'late_nap', etc.
    
    -- Metadata
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oura_sleep_user ON oura_sleep_sessions(user_id);
CREATE INDEX idx_oura_sleep_date ON oura_sleep_sessions(sleep_date);
CREATE INDEX idx_oura_sleep_oura_id ON oura_sleep_sessions(oura_sleep_id);
CREATE UNIQUE INDEX idx_oura_sleep_user_date ON oura_sleep_sessions(user_id, sleep_date);

-- =====================================================
-- OURA READINESS DATA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS oura_readiness_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Oura identifiers
    oura_readiness_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Date
    readiness_date DATE NOT NULL,
    
    -- Readiness score
    readiness_score INTEGER, -- 0-100
    
    -- Contributing factors
    temperature_deviation DECIMAL(4,2),
    temperature_trend_deviation DECIMAL(4,2),
    
    -- Activity metrics
    activity_balance INTEGER, -- Score
    previous_day_activity INTEGER,
    
    -- Sleep metrics
    sleep_balance INTEGER, -- Score
    previous_night_sleep INTEGER,
    sleep_regularity INTEGER,
    
    -- Recovery metrics
    recovery_index DECIMAL(5,2),
    resting_heart_rate INTEGER, -- bpm
    hrv_balance INTEGER, -- Score
    
    -- Metadata
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oura_readiness_user ON oura_readiness_data(user_id);
CREATE INDEX idx_oura_readiness_date ON oura_readiness_data(readiness_date);
CREATE INDEX idx_oura_readiness_oura_id ON oura_readiness_data(oura_readiness_id);
CREATE UNIQUE INDEX idx_oura_readiness_user_date ON oura_readiness_data(user_id, readiness_date);

-- =====================================================
-- OURA ACTIVITY DATA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS oura_activity_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Oura identifiers
    oura_activity_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Date
    activity_date DATE NOT NULL,
    
    -- Activity score
    activity_score INTEGER, -- 0-100
    
    -- Activity levels (minutes)
    inactive_time INTEGER, -- Minutes
    low_activity_time INTEGER,
    medium_activity_time INTEGER,
    high_activity_time INTEGER,
    
    -- Movement
    steps INTEGER,
    daily_movement INTEGER, -- Meters
    
    -- Calories
    total_calories INTEGER, -- kcal
    active_calories INTEGER, -- kcal
    
    -- Training metrics
    training_frequency VARCHAR(20), -- 'low', 'optimal', 'high'
    training_volume INTEGER, -- Minutes
    
    -- Activity goals
    target_calories INTEGER,
    target_meters INTEGER,
    
    -- Met targets
    met_daily_targets INTEGER, -- Number of targets met
    
    -- Inactivity
    inactivity_alerts INTEGER,
    
    -- Equivalent walking distance
    equivalent_walking_distance INTEGER, -- Meters
    
    -- Metadata
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oura_activity_user ON oura_activity_data(user_id);
CREATE INDEX idx_oura_activity_date ON oura_activity_data(activity_date);
CREATE INDEX idx_oura_activity_oura_id ON oura_activity_data(oura_activity_id);
CREATE UNIQUE INDEX idx_oura_activity_user_date ON oura_activity_data(user_id, activity_date);

-- =====================================================
-- OURA WORKOUTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS oura_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Oura identifiers
    oura_workout_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Workout details
    workout_date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    
    -- Activity type
    activity VARCHAR(100), -- 'cycling', 'running', 'strength_training', etc.
    
    -- Duration
    duration_seconds INTEGER,
    
    -- Intensity
    intensity VARCHAR(20), -- 'easy', 'moderate', 'hard'
    
    -- Calories
    calories INTEGER, -- kcal
    
    -- Distance (if applicable)
    distance_meters INTEGER,
    
    -- Heart rate
    hr_average INTEGER, -- bpm
    hr_max INTEGER, -- bpm
    
    -- Source
    source VARCHAR(50), -- 'manual', 'autodetected', 'confirmed'
    
    -- Metadata
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oura_workouts_user ON oura_workouts(user_id);
CREATE INDEX idx_oura_workouts_date ON oura_workouts(workout_date);
CREATE INDEX idx_oura_workouts_oura_id ON oura_workouts(oura_workout_id);

-- =====================================================
-- OURA HRV DATA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS oura_hrv_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Date
    hrv_date DATE NOT NULL,
    
    -- HRV metrics (from sleep)
    hrv_average DECIMAL(6,2), -- ms (RMSSD)
    hrv_baseline DECIMAL(6,2), -- ms
    hrv_balance INTEGER, -- Score 0-100
    
    -- Metadata
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oura_hrv_user ON oura_hrv_data(user_id);
CREATE INDEX idx_oura_hrv_date ON oura_hrv_data(hrv_date);
CREATE UNIQUE INDEX idx_oura_hrv_user_date ON oura_hrv_data(user_id, hrv_date);

-- =====================================================
-- OURA SYNC QUEUE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS oura_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES oura_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Scheduling
    scheduled_for TIMESTAMP NOT NULL,
    priority INTEGER DEFAULT 5, -- 1-10 (1 = highest)
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    
    -- Processing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Results
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oura_sync_queue_connection ON oura_sync_queue(connection_id);
CREATE INDEX idx_oura_sync_queue_scheduled ON oura_sync_queue(scheduled_for);
CREATE INDEX idx_oura_sync_queue_status ON oura_sync_queue(status);

-- =====================================================
-- OURA SYNC HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS oura_sync_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES oura_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Sync details
    sync_started_at TIMESTAMP NOT NULL,
    sync_completed_at TIMESTAMP,
    sync_duration_seconds INTEGER,
    
    -- Sync scope
    date_range_start DATE,
    date_range_end DATE,
    
    -- Results
    status VARCHAR(20), -- 'success', 'partial', 'failed'
    sleep_sessions_synced INTEGER DEFAULT 0,
    readiness_records_synced INTEGER DEFAULT 0,
    activity_records_synced INTEGER DEFAULT 0,
    workouts_synced INTEGER DEFAULT 0,
    total_records_synced INTEGER DEFAULT 0,
    
    -- Error details
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    triggered_by VARCHAR(50), -- 'cron', 'manual', 'user_request'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oura_sync_history_connection ON oura_sync_history(connection_id);
CREATE INDEX idx_oura_sync_history_user ON oura_sync_history(user_id);
CREATE INDEX idx_oura_sync_history_started ON oura_sync_history(sync_started_at);
CREATE INDEX idx_oura_sync_history_status ON oura_sync_history(status);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Schedule next sync job
CREATE OR REPLACE FUNCTION schedule_next_oura_sync(
    p_connection_id UUID,
    p_user_id UUID,
    p_hours_from_now INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
    v_job_id UUID;
    v_scheduled_time TIMESTAMP;
    v_preferred_time TIME;
BEGIN
    -- Get preferred sync time
    SELECT preferred_sync_time INTO v_preferred_time
    FROM oura_connections
    WHERE id = p_connection_id;
    
    -- Calculate next sync time
    v_scheduled_time := (CURRENT_DATE + 1) + v_preferred_time;
    
    -- If that time has already passed today, schedule for tomorrow
    IF v_scheduled_time <= CURRENT_TIMESTAMP THEN
        v_scheduled_time := v_scheduled_time + INTERVAL '1 day';
    END IF;
    
    -- Insert sync job
    INSERT INTO oura_sync_queue (connection_id, user_id, scheduled_for, priority)
    VALUES (p_connection_id, p_user_id, v_scheduled_time, 5)
    RETURNING id INTO v_job_id;
    
    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Get pending sync jobs
CREATE OR REPLACE FUNCTION get_pending_oura_sync_jobs(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    job_id UUID,
    connection_id UUID,
    user_id UUID,
    scheduled_for TIMESTAMP,
    retry_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.connection_id,
        q.user_id,
        q.scheduled_for,
        q.retry_count
    FROM oura_sync_queue q
    INNER JOIN oura_connections c ON q.connection_id = c.id
    WHERE q.status = 'pending'
      AND q.scheduled_for <= CURRENT_TIMESTAMP
      AND q.retry_count < q.max_retries
      AND c.connection_status = 'active'
      AND c.auto_sync_enabled = TRUE
    ORDER BY q.priority ASC, q.scheduled_for ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Start sync job
CREATE OR REPLACE FUNCTION start_oura_sync_job(
    p_job_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE oura_sync_queue
    SET 
        status = 'processing',
        started_at = CURRENT_TIMESTAMP
    WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Complete sync job
CREATE OR REPLACE FUNCTION complete_oura_sync_job(
    p_job_id UUID,
    p_status VARCHAR(20),
    p_records_synced INTEGER DEFAULT 0,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_connection_id UUID;
    v_user_id UUID;
BEGIN
    -- Get connection info
    SELECT connection_id, user_id INTO v_connection_id, v_user_id
    FROM oura_sync_queue
    WHERE id = p_job_id;
    
    -- Update job status
    UPDATE oura_sync_queue
    SET 
        status = p_status,
        completed_at = CURRENT_TIMESTAMP,
        records_synced = p_records_synced,
        error_message = p_error_message
    WHERE id = p_job_id;
    
    -- If successful, schedule next sync
    IF p_status = 'completed' THEN
        PERFORM schedule_next_oura_sync(v_connection_id, v_user_id);
        
        -- Update connection
        UPDATE oura_connections
        SET 
            last_sync_date = CURRENT_DATE,
            last_successful_sync_date = CURRENT_DATE,
            consecutive_failures = 0
        WHERE id = v_connection_id;
    ELSE
        -- Increment failure count
        UPDATE oura_connections
        SET 
            consecutive_failures = consecutive_failures + 1,
            last_error_message = p_error_message,
            last_error_at = CURRENT_TIMESTAMP
        WHERE id = v_connection_id;
        
        -- If too many failures, mark as error
        UPDATE oura_connections
        SET connection_status = 'error'
        WHERE id = v_connection_id
          AND consecutive_failures >= 3;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Get sync statistics
CREATE OR REPLACE FUNCTION get_oura_sync_statistics(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_syncs BIGINT,
    successful_syncs BIGINT,
    failed_syncs BIGINT,
    success_rate DECIMAL,
    avg_duration_seconds DECIMAL,
    total_records_synced BIGINT,
    last_sync_date TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_syncs,
        COUNT(*) FILTER (WHERE status = 'success') as successful_syncs,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_syncs,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
            2
        ) as success_rate,
        ROUND(AVG(sync_duration_seconds), 1) as avg_duration_seconds,
        SUM(total_records_synced) as total_records_synced,
        MAX(sync_started_at) as last_sync_date
    FROM oura_sync_history
    WHERE user_id = p_user_id
      AND sync_started_at >= CURRENT_DATE - p_days;
END;
$$ LANGUAGE plpgsql;

-- Get latest readiness score
CREATE OR REPLACE FUNCTION get_latest_oura_readiness(
    p_user_id UUID
)
RETURNS TABLE (
    readiness_date DATE,
    readiness_score INTEGER,
    sleep_balance INTEGER,
    activity_balance INTEGER,
    hrv_balance INTEGER,
    resting_heart_rate INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.readiness_date,
        r.readiness_score,
        r.sleep_balance,
        r.activity_balance,
        r.hrv_balance,
        r.resting_heart_rate
    FROM oura_readiness_data r
    WHERE r.user_id = p_user_id
    ORDER BY r.readiness_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get sleep trend
CREATE OR REPLACE FUNCTION get_oura_sleep_trend(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    sleep_date DATE,
    sleep_score INTEGER,
    total_sleep_duration INTEGER,
    deep_sleep_duration INTEGER,
    rem_sleep_duration INTEGER,
    efficiency INTEGER,
    hrv_average DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.sleep_date,
        s.sleep_score,
        s.total_sleep_duration,
        s.deep_sleep_duration,
        s.rem_sleep_duration,
        s.efficiency,
        s.hrv_average
    FROM oura_sleep_sessions s
    WHERE s.user_id = p_user_id
      AND s.sleep_date >= CURRENT_DATE - p_days
    ORDER BY s.sleep_date DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_oura_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_oura_connections_timestamp
    BEFORE UPDATE ON oura_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_oura_connection_timestamp();

-- Auto-schedule initial sync on connection
CREATE OR REPLACE FUNCTION schedule_initial_oura_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule immediate sync for new connections
    PERFORM schedule_next_oura_sync(NEW.id, NEW.user_id, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_schedule_initial_oura_sync
    AFTER INSERT ON oura_connections
    FOR EACH ROW
    EXECUTE FUNCTION schedule_initial_oura_sync();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE oura_connections IS 'Oura Ring OAuth connections with encrypted tokens';
COMMENT ON TABLE oura_sleep_sessions IS 'Daily sleep sessions from Oura Ring';
COMMENT ON TABLE oura_readiness_data IS 'Daily readiness scores and metrics';
COMMENT ON TABLE oura_activity_data IS 'Daily activity and movement data';
COMMENT ON TABLE oura_workouts IS 'Individual workout sessions';
COMMENT ON TABLE oura_hrv_data IS 'Heart rate variability data';
COMMENT ON TABLE oura_sync_queue IS 'Queue for scheduled sync jobs';
COMMENT ON TABLE oura_sync_history IS 'History of all sync operations';
COMMENT ON FUNCTION schedule_next_oura_sync IS 'Schedule next automatic sync job';
COMMENT ON FUNCTION get_pending_oura_sync_jobs IS 'Get sync jobs ready to process';
COMMENT ON FUNCTION start_oura_sync_job IS 'Mark sync job as processing';
COMMENT ON FUNCTION complete_oura_sync_job IS 'Complete sync job and schedule next';
COMMENT ON FUNCTION get_oura_sync_statistics IS 'Get sync statistics for user';
COMMENT ON FUNCTION get_latest_oura_readiness IS 'Get most recent readiness score';
COMMENT ON FUNCTION get_oura_sleep_trend IS 'Get sleep trend for date range';
