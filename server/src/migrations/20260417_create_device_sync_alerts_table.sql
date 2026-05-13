-- Migration: Create device_sync_alerts table
-- Purpose: Track sync failure alerts for monitoring and alerting system
-- Date: 2026-04-17
-- Related: Phase 5 - Integration Testing & Documentation

-- Create device_sync_alerts table
CREATE TABLE IF NOT EXISTS device_sync_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_type TEXT NOT NULL CHECK (device_type IN ('oura', 'apple_watch', 'sleep_number')),
  user_id UUID NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('WARNING', 'CRITICAL')),
  consecutive_failures INTEGER NOT NULL CHECK (consecutive_failures >= 0),
  error_message TEXT,
  alert_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_device_sync_alerts_device_user 
  ON device_sync_alerts(device_type, user_id);

CREATE INDEX IF NOT EXISTS idx_device_sync_alerts_sent_at 
  ON device_sync_alerts(alert_sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_device_sync_alerts_severity 
  ON device_sync_alerts(severity);

CREATE INDEX IF NOT EXISTS idx_device_sync_alerts_user_id 
  ON device_sync_alerts(user_id);

-- Add comments for documentation
COMMENT ON TABLE device_sync_alerts IS 'Tracks sync failure alerts for device integrations (Oura, Apple Watch, Sleep Number)';
COMMENT ON COLUMN device_sync_alerts.device_type IS 'Type of device: oura, apple_watch, or sleep_number';
COMMENT ON COLUMN device_sync_alerts.user_id IS 'User ID associated with the failing sync';
COMMENT ON COLUMN device_sync_alerts.severity IS 'Alert severity: WARNING (3+ failures) or CRITICAL (5+ failures)';
COMMENT ON COLUMN device_sync_alerts.consecutive_failures IS 'Number of consecutive sync failures at time of alert';
COMMENT ON COLUMN device_sync_alerts.error_message IS 'Error message from the failed sync';
COMMENT ON COLUMN device_sync_alerts.alert_sent_at IS 'Timestamp when alert was sent';
COMMENT ON COLUMN device_sync_alerts.created_at IS 'Timestamp when record was created';

-- Create function to clean up old alerts (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_device_sync_alerts(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM device_sync_alerts
  WHERE alert_sent_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_device_sync_alerts IS 'Deletes device sync alerts older than specified days (default 90)';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT ON device_sync_alerts TO your_app_user;
-- GRANT USAGE ON SEQUENCE device_sync_alerts_id_seq TO your_app_user;
