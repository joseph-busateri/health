-- Migration: Create sync_preferences table for automatic sync settings
-- Date: 2026-04-25
-- Description: Stores user preferences for automatic health data sync from Apple Health

-- Create sync_preferences table
CREATE TABLE IF NOT EXISTS sync_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL,
  automatic_bp_sync BOOLEAN DEFAULT true,
  automatic_watch_sync BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_automatic_bp_sync CHECK (automatic_bp_sync IN (true, false)),
  CONSTRAINT chk_automatic_watch_sync CHECK (automatic_watch_sync IN (true, false))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_pref_user_id ON sync_preferences(user_id);

-- Add table and column comments
COMMENT ON TABLE sync_preferences IS 'User preferences for automatic health data sync from Apple Health';
COMMENT ON COLUMN sync_preferences.id IS 'Unique identifier for the preference record';
COMMENT ON COLUMN sync_preferences.user_id IS 'User ID who owns these preferences';
COMMENT ON COLUMN sync_preferences.automatic_bp_sync IS 'Enable automatic sync for blood pressure monitor via Apple Health';
COMMENT ON COLUMN sync_preferences.automatic_watch_sync IS 'Enable automatic sync for Apple Watch via Apple Health';
COMMENT ON COLUMN sync_preferences.created_at IS 'Timestamp when the preference record was created';
COMMENT ON COLUMN sync_preferences.updated_at IS 'Timestamp when the preference record was last updated';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sync_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sync_preferences_updated_at
  BEFORE UPDATE ON sync_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_preferences_updated_at();

-- Rollback script (for reference):
-- DROP TRIGGER IF EXISTS trigger_update_sync_preferences_updated_at ON sync_preferences;
-- DROP FUNCTION IF EXISTS update_sync_preferences_updated_at();
-- DROP TABLE IF EXISTS sync_preferences;
