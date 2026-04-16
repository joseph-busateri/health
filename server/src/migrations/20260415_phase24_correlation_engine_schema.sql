-- Phase 24: Correlation Engine Schema Migration
-- Purpose: Enable historical correlation tracking, trend analysis, and alerting
-- Features: Correlation history storage, alert management, trend detection
-- Part of: Phase 3 Correlation Engine

-- ============================================================================
-- CORRELATION HISTORY TABLE
-- ============================================================================
-- Stores historical correlation detections for trend analysis and pattern recognition

CREATE TABLE IF NOT EXISTS correlation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    detection_date DATE NOT NULL,
    
    -- Correlation identification
    correlation_id TEXT NOT NULL,
    correlation_type TEXT NOT NULL CHECK (correlation_type IN (
        'sleep_performance',
        'stress_recovery',
        'nutrition_energy',
        'supplement_adherence',
        'workout_recovery',
        'pain_workout',
        'bloodwork_symptoms',
        'wearable_subjective'
    )),
    
    -- Correlation metrics
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    
    -- Pattern details
    pattern TEXT NOT NULL,
    insight TEXT NOT NULL,
    recommendation TEXT,
    
    -- Source tracking
    sources JSONB NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate correlations for same user/date/type
    CONSTRAINT correlation_history_unique 
        UNIQUE (user_id, detection_date, correlation_id)
);

-- ============================================================================
-- CORRELATION ALERTS TABLE
-- ============================================================================
-- Stores alerts for critical correlations and trend changes

CREATE TABLE IF NOT EXISTS correlation_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    correlation_history_id UUID REFERENCES correlation_history(id) ON DELETE CASCADE,
    
    -- Alert classification
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'new_critical',
        'severity_increase',
        'recurring_pattern',
        'trend_worsening'
    )),
    
    -- Alert content
    message TEXT NOT NULL,
    action_required TEXT,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Correlation History Indexes
CREATE INDEX idx_correlation_history_user_date 
    ON correlation_history(user_id, detection_date DESC);

CREATE INDEX idx_correlation_history_type 
    ON correlation_history(correlation_type, user_id, detection_date DESC);

CREATE INDEX idx_correlation_history_severity 
    ON correlation_history(severity, user_id, detection_date DESC)
    WHERE severity IN ('warning', 'critical');

CREATE INDEX idx_correlation_history_user_type_date 
    ON correlation_history(user_id, correlation_type, detection_date DESC);

-- Correlation Alerts Indexes
CREATE INDEX idx_correlation_alerts_user_status 
    ON correlation_alerts(user_id, status, created_at DESC);

CREATE INDEX idx_correlation_alerts_active 
    ON correlation_alerts(user_id, created_at DESC)
    WHERE status = 'active';

CREATE INDEX idx_correlation_alerts_type 
    ON correlation_alerts(alert_type, user_id, created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get correlation history for a user over specified days
CREATE OR REPLACE FUNCTION get_correlation_history(
    p_user_id TEXT,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    id UUID,
    detection_date DATE,
    correlation_id TEXT,
    correlation_type TEXT,
    confidence DECIMAL,
    severity TEXT,
    pattern TEXT,
    insight TEXT,
    recommendation TEXT,
    sources JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ch.id,
        ch.detection_date,
        ch.correlation_id,
        ch.correlation_type,
        ch.confidence,
        ch.severity,
        ch.pattern,
        ch.insight,
        ch.recommendation,
        ch.sources,
        ch.created_at
    FROM correlation_history ch
    WHERE ch.user_id = p_user_id
        AND ch.detection_date >= CURRENT_DATE - p_days
    ORDER BY ch.detection_date DESC, ch.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get correlation history by type
CREATE OR REPLACE FUNCTION get_correlation_by_type(
    p_user_id TEXT,
    p_correlation_type TEXT,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    detection_date DATE,
    correlation_id TEXT,
    confidence DECIMAL,
    severity TEXT,
    pattern TEXT,
    occurrence_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ch.detection_date,
        ch.correlation_id,
        ch.confidence,
        ch.severity,
        ch.pattern,
        COUNT(*)::INTEGER as occurrence_count
    FROM correlation_history ch
    WHERE ch.user_id = p_user_id
        AND ch.correlation_type = p_correlation_type
        AND ch.detection_date >= CURRENT_DATE - p_days
    GROUP BY ch.detection_date, ch.correlation_id, ch.confidence, ch.severity, ch.pattern
    ORDER BY ch.detection_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Get recurring correlations (appeared 3+ times)
CREATE OR REPLACE FUNCTION get_recurring_correlations(
    p_user_id TEXT,
    p_days INTEGER DEFAULT 30,
    p_min_occurrences INTEGER DEFAULT 3
)
RETURNS TABLE (
    correlation_type TEXT,
    correlation_id TEXT,
    occurrence_count INTEGER,
    avg_confidence DECIMAL,
    most_recent_date DATE,
    severity_trend TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ch.correlation_type,
        ch.correlation_id,
        COUNT(*)::INTEGER as occurrence_count,
        AVG(ch.confidence)::DECIMAL(3,2) as avg_confidence,
        MAX(ch.detection_date) as most_recent_date,
        CASE 
            WHEN COUNT(CASE WHEN ch.severity = 'critical' THEN 1 END) > COUNT(*) / 2 THEN 'critical'
            WHEN COUNT(CASE WHEN ch.severity = 'warning' THEN 1 END) > COUNT(*) / 2 THEN 'warning'
            ELSE 'info'
        END as severity_trend
    FROM correlation_history ch
    WHERE ch.user_id = p_user_id
        AND ch.detection_date >= CURRENT_DATE - p_days
    GROUP BY ch.correlation_type, ch.correlation_id
    HAVING COUNT(*) >= p_min_occurrences
    ORDER BY occurrence_count DESC, most_recent_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Get active alerts for a user
CREATE OR REPLACE FUNCTION get_active_alerts(
    p_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    alert_type TEXT,
    message TEXT,
    action_required TEXT,
    created_at TIMESTAMPTZ,
    correlation_type TEXT,
    correlation_pattern TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.id,
        ca.alert_type,
        ca.message,
        ca.action_required,
        ca.created_at,
        ch.correlation_type,
        ch.pattern as correlation_pattern
    FROM correlation_alerts ca
    LEFT JOIN correlation_history ch ON ca.correlation_history_id = ch.id
    WHERE ca.user_id = p_user_id
        AND ca.status = 'active'
    ORDER BY ca.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Calculate correlation trend (improving/worsening/stable)
CREATE OR REPLACE FUNCTION calculate_correlation_trend(
    p_user_id TEXT,
    p_correlation_id TEXT,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    trend_direction TEXT,
    severity_changes INTEGER,
    avg_confidence DECIMAL,
    occurrence_count INTEGER
) AS $$
DECLARE
    v_severity_score INTEGER;
    v_prev_severity_score INTEGER;
    v_severity_changes INTEGER := 0;
BEGIN
    -- Calculate severity changes over time
    WITH severity_scores AS (
        SELECT 
            detection_date,
            CASE severity
                WHEN 'critical' THEN 3
                WHEN 'warning' THEN 2
                WHEN 'info' THEN 1
            END as score
        FROM correlation_history
        WHERE user_id = p_user_id
            AND correlation_id = p_correlation_id
            AND detection_date >= CURRENT_DATE - p_days
        ORDER BY detection_date
    )
    SELECT COUNT(*) INTO v_severity_changes
    FROM (
        SELECT 
            score,
            LAG(score) OVER (ORDER BY detection_date) as prev_score
        FROM severity_scores
    ) changes
    WHERE score > prev_score;
    
    RETURN QUERY
    SELECT 
        CASE 
            WHEN v_severity_changes >= 2 THEN 'worsening'
            WHEN v_severity_changes = 0 THEN 'stable'
            ELSE 'improving'
        END as trend_direction,
        v_severity_changes as severity_changes,
        AVG(confidence)::DECIMAL(3,2) as avg_confidence,
        COUNT(*)::INTEGER as occurrence_count
    FROM correlation_history
    WHERE user_id = p_user_id
        AND correlation_id = p_correlation_id
        AND detection_date >= CURRENT_DATE - p_days;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on correlation_alerts
CREATE OR REPLACE FUNCTION update_correlation_alerts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_correlation_alerts_timestamp
    BEFORE UPDATE ON correlation_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_correlation_alerts_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE correlation_history IS 'Phase 24: Historical correlation detections for trend analysis and pattern recognition';
COMMENT ON TABLE correlation_alerts IS 'Phase 24: Alerts for critical correlations and trend changes';

COMMENT ON COLUMN correlation_history.correlation_id IS 'Unique identifier for correlation type instance (e.g., sleep_perf_1)';
COMMENT ON COLUMN correlation_history.correlation_type IS 'Type of correlation detected';
COMMENT ON COLUMN correlation_history.confidence IS 'Detection confidence 0.0-1.0';
COMMENT ON COLUMN correlation_history.severity IS 'Impact severity: info, warning, critical';
COMMENT ON COLUMN correlation_history.sources IS 'JSONB array of data sources involved';

COMMENT ON COLUMN correlation_alerts.alert_type IS 'Type of alert: new_critical, severity_increase, recurring_pattern, trend_worsening';
COMMENT ON COLUMN correlation_alerts.status IS 'Alert status: active, acknowledged, resolved';
