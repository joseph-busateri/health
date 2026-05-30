-- Sleep Number API Integration Functions Only
-- Run this if tables exist but functions are missing

-- =====================================================
-- DROP EXISTING TRIGGERS (must drop before functions)
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_connection_timestamp ON sleep_number_connections;
DROP TRIGGER IF EXISTS trigger_schedule_initial_sync ON sleep_number_connections;

-- =====================================================
-- DROP EXISTING FUNCTIONS (to handle return type changes)
-- =====================================================

DROP FUNCTION IF EXISTS queue_sync_job(UUID, TIMESTAMP, INTEGER);
DROP FUNCTION IF EXISTS schedule_next_sync(UUID);
DROP FUNCTION IF EXISTS get_pending_sync_jobs(INTEGER);
DROP FUNCTION IF EXISTS start_sync_job(UUID);
DROP FUNCTION IF EXISTS complete_sync_job(UUID, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS get_sync_statistics(UUID, INTEGER);
DROP FUNCTION IF EXISTS update_connection_timestamp();
DROP FUNCTION IF EXISTS schedule_initial_sync();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Schedule next sync for a connection
CREATE OR REPLACE FUNCTION schedule_next_sync(p_connection_id UUID)
RETURNS TIMESTAMP
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (
        CASE
            WHEN (SELECT sync_frequency FROM sleep_number_connections WHERE id = p_connection_id) = 'hourly'
            THEN CURRENT_TIMESTAMP + INTERVAL '1 hour'
            WHEN (SELECT sync_frequency FROM sleep_number_connections WHERE id = p_connection_id) = 'twice_daily'
            THEN (CURRENT_DATE + (SELECT preferred_sync_time FROM sleep_number_connections WHERE id = p_connection_id)::TIME)::TIMESTAMP + INTERVAL '12 hours'
            ELSE (CURRENT_DATE + INTERVAL '1 day' + (SELECT preferred_sync_time FROM sleep_number_connections WHERE id = p_connection_id)::TIME)::TIMESTAMP
        END
    );
END;
$$;

-- Add sync job to queue
CREATE OR REPLACE FUNCTION queue_sync_job(
    p_connection_id UUID,
    p_scheduled_for TIMESTAMP DEFAULT NULL,
    p_priority INTEGER DEFAULT 5
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO sleep_number_sync_queue (connection_id, user_id, scheduled_for, priority, status)
    SELECT 
        p_connection_id,
        user_id,
        COALESCE(p_scheduled_for, schedule_next_sync(p_connection_id)),
        p_priority,
        'pending'
    FROM sleep_number_connections
    WHERE id = p_connection_id;
END;
$$;

-- Get pending sync jobs
CREATE OR REPLACE FUNCTION get_pending_sync_jobs(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    job_id UUID,
    connection_id UUID,
    user_id UUID,
    scheduled_for TIMESTAMP,
    priority INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT sq.id, sq.connection_id, sq.user_id, sq.scheduled_for, sq.priority
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
$$;

-- Mark sync job as processing
CREATE OR REPLACE FUNCTION start_sync_job(p_job_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE sleep_number_sync_queue
    SET status = 'processing',
        last_attempt_at = CURRENT_TIMESTAMP,
        retry_count = retry_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_job_id AND status = 'pending';
    RETURN FOUND;
END;
$$;

-- Complete sync job
CREATE OR REPLACE FUNCTION complete_sync_job(
    p_job_id UUID,
    p_sync_history_id UUID,
    p_success BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE sleep_number_sync_queue
    SET status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
        sync_history_id = p_sync_history_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_job_id;
    
    IF p_success THEN
        PERFORM queue_sync_job(
            (SELECT connection_id FROM sleep_number_sync_queue WHERE id = p_job_id),
            NULL,
            5
        );
    END IF;
END;
$$;

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
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_syncs,
        COUNT(*) FILTER (WHERE sync_status = 'success')::INTEGER as successful_syncs,
        COUNT(*) FILTER (WHERE sync_status = 'failed')::INTEGER as failed_syncs,
        COALESCE(SUM(sessions_saved), 0)::INTEGER as total_sessions_synced,
        MAX(sync_completed_at) as last_sync_date,
        CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE sync_status = 'success')::DECIMAL / COUNT(*)) * 100, 2) ELSE 0 END as success_rate
    FROM sleep_number_sync_history
    WHERE user_id = p_user_id
      AND sync_started_at >= CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_connection_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_connection_timestamp
    BEFORE UPDATE ON sleep_number_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_connection_timestamp();

-- Auto-schedule first sync when connection is created
CREATE OR REPLACE FUNCTION schedule_initial_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.auto_sync_enabled = TRUE THEN
        PERFORM queue_sync_job(NEW.id, CURRENT_TIMESTAMP + INTERVAL '5 minutes', 1);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_schedule_initial_sync
    AFTER INSERT ON sleep_number_connections
    FOR EACH ROW
    EXECUTE FUNCTION schedule_initial_sync();
