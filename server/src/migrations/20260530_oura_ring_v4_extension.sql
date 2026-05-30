-- Oura Ring V4 Extension Migration
-- Adds supplemental tables and columns required for expanded Oura metrics

BEGIN;

-- =====================================================
-- SpO2 DATA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS oura_spo2_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    oura_spo2_id VARCHAR(100) UNIQUE NOT NULL,
    spo2_date DATE NOT NULL,
    spo2_average DECIMAL(5,2),
    spo2_min DECIMAL(5,2),
    spo2_max DECIMAL(5,2),
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oura_spo2_user ON oura_spo2_data(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_oura_spo2_user_date ON oura_spo2_data(user_id, spo2_date);

-- =====================================================
-- TAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS oura_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    oura_tag_id VARCHAR(100) UNIQUE NOT NULL,
    tag_date DATE NOT NULL,
    tag VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP,
    type VARCHAR(50),
    other_tag VARCHAR(100),
    acquisition_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oura_tags_user ON oura_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_oura_tags_date ON oura_tags(tag_date);

-- =====================================================
-- SESSIONS TABLE (meditations, breathwork, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS oura_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    oura_session_id VARCHAR(100) UNIQUE NOT NULL,
    session_date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    session_type VARCHAR(50) NOT NULL,
    mood VARCHAR(50),
    activity_state VARCHAR(50),
    heart_rate_average INTEGER,
    heart_rate_peak INTEGER,
    heart_rate_min INTEGER,
    temperature_deviation DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oura_sessions_user ON oura_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_oura_sessions_date ON oura_sessions(session_date);

-- =====================================================
-- COLUMN AUGMENTATIONS FOR EXISTING TABLES
-- =====================================================
ALTER TABLE oura_sleep_sessions
  ADD COLUMN IF NOT EXISTS rmssd DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS hrv_average DECIMAL(6,2);

ALTER TABLE oura_readiness_data
  ADD COLUMN IF NOT EXISTS hrv_average DECIMAL(6,2);

ALTER TABLE oura_activity_data
  ADD COLUMN IF NOT EXISTS metabolic_equivalent INTEGER;

ALTER TABLE oura_sync_history
  ADD COLUMN IF NOT EXISTS spo2_records_synced INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags_synced INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sessions_synced INTEGER DEFAULT 0;

COMMIT;
