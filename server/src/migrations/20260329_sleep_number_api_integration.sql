-- Sleep Number API Integration Schema
-- Stores OAuth tokens and sync status for automatic daily uploads

-- =====================================================
-- SLEEP NUMBER CONNECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sleep_number_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    sleep_number_user_id VARCHAR(200),
    email VARCHAR(255),
    
    -- OAuth tokens (encrypted)
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    token_expires_at TIMESTAMP NOT NULL,
    
    -- Connection status
    connection_status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'disconnected', 'error'
    last_sync_date TIMESTAMP,
    last_sync_status VARCHAR(50), -- 'success', 'failed', 'partial'
    last_error_message TEXT,
    
    -- Sync settings
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency VARCHAR(20) DEFAULT 'daily', -- 'daily', 'twice_daily', 'hourly'
    preferred_sync_time TIME DEFAULT '06:00:00', -- When to sync (user's timezone)
    
    -- Metadata
    bed_id VARCHAR(100),
    sleeper_side VARCHAR(20) DEFAULT 'both', -- 'left', 'right', 'both'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sleep_connections_user ON sleep_number_connections(user_id);
CREATE INDEX idx_sleep_connections_status ON sleep_number_connections(connection_status);
CREATE INDEX idx_sleep_connections_sync ON sleep_number_connections(auto_sync_enabled) WHERE auto_sync_enabled = TRUE;
CREATE UNIQUE INDEX idx_sleep_connections_user_unique ON sleep_number_connections(user_id);

-- =====================================================
-- SYNC HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sleep_number_sync_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID REFERENCES sleep_number_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Sync details
    sync_started_at TIMESTAMP NOT NULL,
    sync_completed_at TIMESTAMP,
    sync_status VARCHAR(50) NOT NULL, -- 'running', 'success', 'failed', 'partial'
    
    -- Results
    sessions_fetched INTEGER DEFAULT 0,
    sessions_saved INTEGER DEFAULT 0,
    sessions_updated INTEGER DEFAULT 0,
    sessions_skipped INTEGER DEFAULT 0,
    
    -- Date range synced
    sync_from_date DATE,
    sync_to_date DATE,
    
    -- Error tracking
    error_message TEXT,
    error_code VARCHAR(50),
    
    -- Metadata
    triggered_by VARCHAR(50) DEFAULT 'auto_sync', -- 'auto_sync', 'manual', 'retry'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_history_connection ON sleep_number_sync_history(connection_id);
CREATE INDEX idx_sync_history_user ON sleep_number_sync_history(user_id);
CREATE INDEX idx_sync_history_status ON sleep_number_sync_history(sync_status);
CREATE INDEX idx_sync_history_date ON sleep_number_sync_history(sync_started_at);

-- =====================================================
-- SYNC QUEUE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sleep_number_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID REFERENCES sleep_number_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Queue details
    scheduled_for TIMESTAMP NOT NULL,
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP,
    
    -- Results
    sync_history_id UUID REFERENCES sleep_number_sync_history(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_queue_scheduled ON sleep_number_sync_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_sync_queue_status ON sleep_number_sync_queue(status);
CREATE INDEX idx_sync_queue_priority ON sleep_number_sync_queue(priority, scheduled_for);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Schedule next sync for a connection
CREATE OR REPLACE FUNCTION schedule_next_sync(p_connection_id UUID)
RETURNS TIMESTAMP AS $$
DECLARE
    v_sync_frequency VARCHAR;
    v_preferred_time TIME;
    v_next_sync TIMESTAMP;
BEGIN
    -- Get connection settings
    SELECT sync_frequency, preferred_sync_time
    INTO v_sync_frequency, v_preferred_time
    FROM sleep_number_connections
    WHERE id = p_connection_id;

    -- Calculate next sync time
    IF v_sync_frequency = 'hourly' THEN
        v_next_sync := CURRENT_TIMESTAMP + INTERVAL '1 hour';
    ELSIF v_sync_frequency = 'twice_daily' THEN
        -- Next sync at 6 AM or 6 PM
        v_next_sync := (CURRENT_DATE + v_preferred_time::TIME)::TIMESTAMP;
        IF v_next_sync < CURRENT_TIMESTAMP THEN
            v_next_sync := v_next_sync + INTERVAL '12 hours';
        END IF;
    ELSE -- daily
        -- Next sync at preferred time tomorrow
        v_next_sync := (CURRENT_DATE + INTERVAL '1 day' + v_preferred_time::TIME)::TIMESTAMP;
    END IF;

    RETURN v_next_sync;
END;
$$ LANGUAGE plpgsql;

-- Add sync job to queue
CREATE OR REPLACE FUNCTION queue_sync_job(
    p_connection_id UUID,
    p_scheduled_for TIMESTAMP DEFAULT NULL,
    p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_job_id UUID;
    v_scheduled_time TIMESTAMP;
BEGIN
    -- Get user ID
    SELECT user_id INTO v_user_id
    FROM sleep_number_connections
    WHERE id = p_connection_id;

    -- Use provided time or calculate next sync
    v_scheduled_time := COALESCE(p_scheduled_for, schedule_next_sync(p_connection_id));

    -- Insert into queue
    INSERT INTO sleep_number_sync_queue (
        connection_id,
        user_id,
        scheduled_for,
        priority,
        status
    ) VALUES (
        p_connection_id,
        v_user_id,
        v_scheduled_time,
        p_priority,
        'pending'
    ) RETURNING id INTO v_job_id;

    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Get pending sync jobs
CREATE OR REPLACE FUNCTION get_pending_sync_jobs(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    job_id UUID,
    connection_id UUID,
    user_id UUID,
    scheduled_for TIMESTAMP,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sq.id,
        sq.connection_id,
        sq.user_id,
        sq.scheduled_for,
        sq.priority
    FROM sleep_number_sync_queue sq
    JOIN sleep_number_connections sc ON sq.connection_id = sc.id
    WHERE sq.status = 'pending'
      AND sq.scheduled_for <= CURRENT_TIMESTAMP
      AND sq.retry_count < sq.max_retries
      AND sc.connection_status = 'active'
      AND sc.auto_sync_enabled = TRUE
    ORDER BY sq.priority ASC, sq.scheduled_for ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Mark sync job as processing
CREATE OR REPLACE FUNCTION start_sync_job(p_job_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sleep_number_sync_queue
    SET status = 'processing',
        last_attempt_at = CURRENT_TIMESTAMP,
        retry_count = retry_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_job_id
      AND status = 'pending';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Complete sync job
CREATE OR REPLACE FUNCTION complete_sync_job(
    p_job_id UUID,
    p_sync_history_id UUID,
    p_success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    UPDATE sleep_number_sync_queue
    SET status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
        sync_history_id = p_sync_history_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_job_id;

    -- If successful, schedule next sync
    IF p_success THEN
        PERFORM queue_sync_job(
            (SELECT connection_id FROM sleep_number_sync_queue WHERE id = p_job_id),
            NULL,
            5
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Get sync statistics
CREATE OR REPLACE FUNCTION get_sync_statistics(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_syncs INTEGER,
    successful_syncs INTEGER,
    failed_syncs INTEGER,
    total_sessions_synced INTEGER,
    last_sync_date TIMESTAMP,
    success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_syncs,
        COUNT(*) FILTER (WHERE sync_status = 'success')::INTEGER as successful_syncs,
        COUNT(*) FILTER (WHERE sync_status = 'failed')::INTEGER as failed_syncs,
        COALESCE(SUM(sessions_saved), 0)::INTEGER as total_sessions_synced,
        MAX(sync_completed_at) as last_sync_date,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE sync_status = 'success')::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END as success_rate
    FROM sleep_number_sync_history
    WHERE user_id = p_user_id
      AND sync_started_at >= CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_connection_timestamp
    BEFORE UPDATE ON sleep_number_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_connection_timestamp();

-- Auto-schedule first sync when connection is created
CREATE OR REPLACE FUNCTION schedule_initial_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.auto_sync_enabled = TRUE THEN
        -- Schedule immediate sync for new connections
        PERFORM queue_sync_job(NEW.id, CURRENT_TIMESTAMP + INTERVAL '5 minutes', 1);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_schedule_initial_sync
    AFTER INSERT ON sleep_number_connections
    FOR EACH ROW
    EXECUTE FUNCTION schedule_initial_sync();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE sleep_number_connections IS 'OAuth connections to Sleep Number API for automatic sync';
COMMENT ON TABLE sleep_number_sync_history IS 'History of all sync operations';
COMMENT ON TABLE sleep_number_sync_queue IS 'Queue for scheduled sync jobs';
COMMENT ON FUNCTION schedule_next_sync IS 'Calculate next sync time based on frequency';
COMMENT ON FUNCTION queue_sync_job IS 'Add a sync job to the queue';
COMMENT ON FUNCTION get_pending_sync_jobs IS 'Get jobs ready to be processed';
COMMENT ON FUNCTION get_sync_statistics IS 'Get sync statistics for a user';
