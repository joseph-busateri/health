-- Phase 22: Interview Signals Schema Migration
-- Purpose: Extract structured data from voice interview answers for holistic health analysis
-- Features: Structured signal storage, multi-category support, confidence tracking, time-series analysis
-- Part of: Phase 1 Foundation - Voice Interview Enhancement

-- ============================================================================
-- INTERVIEW SIGNALS TABLE
-- ============================================================================
-- Stores structured, queryable data extracted from voice interview answers
-- Enables cross-source correlation, pattern detection, and holistic recommendations

CREATE TABLE IF NOT EXISTS interview_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    session_id UUID REFERENCES voice_interview_transcripts(session_id) ON DELETE CASCADE,
    
    -- Temporal data
    signal_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Signal classification
    category TEXT NOT NULL CHECK (category IN (
        'sleep',
        'stress', 
        'workout',
        'nutrition',
        'supplements',
        'energy',
        'mood',
        'pain',
        'recovery',
        'sexual_health',
        'general'
    )),
    subcategory TEXT,
    
    -- Extracted values
    numeric_value DECIMAL(10,2),
    text_value TEXT,
    array_value JSONB,
    
    -- Extraction metadata
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    extraction_method TEXT NOT NULL CHECK (extraction_method IN (
        'ai',
        'keyword',
        'numeric',
        'manual'
    )),
    
    -- Source context
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    question_id TEXT,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT at_least_one_value CHECK (
        numeric_value IS NOT NULL OR 
        text_value IS NOT NULL OR 
        array_value IS NOT NULL
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_interview_signals_user_date 
    ON interview_signals(user_id, signal_date DESC);

CREATE INDEX idx_interview_signals_category 
    ON interview_signals(category, user_id, signal_date DESC);

CREATE INDEX idx_interview_signals_session 
    ON interview_signals(session_id);

CREATE INDEX idx_interview_signals_user_category_date 
    ON interview_signals(user_id, category, signal_date DESC);

CREATE INDEX idx_interview_signals_subcategory 
    ON interview_signals(category, subcategory, user_id);

CREATE INDEX idx_interview_signals_confidence 
    ON interview_signals(confidence DESC) 
    WHERE confidence >= 0.7;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_latest_signal_value(
    p_user_id TEXT,
    p_category TEXT,
    p_subcategory TEXT DEFAULT NULL
)
RETURNS TABLE (
    signal_date DATE,
    numeric_value DECIMAL,
    text_value TEXT,
    array_value JSONB,
    confidence DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.signal_date,
        s.numeric_value,
        s.text_value,
        s.array_value,
        s.confidence
    FROM interview_signals s
    WHERE s.user_id = p_user_id
        AND s.category = p_category
        AND (p_subcategory IS NULL OR s.subcategory = p_subcategory)
    ORDER BY s.signal_date DESC, s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_signal_trend(
    p_user_id TEXT,
    p_category TEXT,
    p_subcategory TEXT DEFAULT NULL,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    signal_date DATE,
    avg_numeric_value DECIMAL,
    signal_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.signal_date,
        AVG(s.numeric_value)::DECIMAL(10,2) as avg_numeric_value,
        COUNT(*)::INTEGER as signal_count
    FROM interview_signals s
    WHERE s.user_id = p_user_id
        AND s.category = p_category
        AND (p_subcategory IS NULL OR s.subcategory = p_subcategory)
        AND s.signal_date >= CURRENT_DATE - p_days
        AND s.numeric_value IS NOT NULL
    GROUP BY s.signal_date
    ORDER BY s.signal_date DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_recurring_patterns(
    p_user_id TEXT,
    p_category TEXT,
    p_subcategory TEXT,
    p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
    pattern_value TEXT,
    occurrence_count INTEGER,
    last_occurrence DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jsonb_array_elements_text(s.array_value) as pattern_value,
        COUNT(*)::INTEGER as occurrence_count,
        MAX(s.signal_date) as last_occurrence
    FROM interview_signals s
    WHERE s.user_id = p_user_id
        AND s.category = p_category
        AND s.subcategory = p_subcategory
        AND s.signal_date >= CURRENT_DATE - p_days
        AND s.array_value IS NOT NULL
    GROUP BY pattern_value
    HAVING COUNT(*) >= 2
    ORDER BY occurrence_count DESC, last_occurrence DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE interview_signals IS 'Phase 22: Structured data extracted from voice interview answers for holistic health analysis';
COMMENT ON COLUMN interview_signals.category IS 'Primary health category: sleep, stress, workout, nutrition, supplements, energy, mood, pain, recovery, sexual_health, general';
COMMENT ON COLUMN interview_signals.subcategory IS 'Specific aspect: quality, barriers, triggers, symptoms, adherence, side_effects, etc.';
COMMENT ON COLUMN interview_signals.numeric_value IS 'Numeric ratings, hours, counts, percentages';
COMMENT ON COLUMN interview_signals.text_value IS 'Single text values, descriptions, notes';
COMMENT ON COLUMN interview_signals.array_value IS 'Lists of barriers, triggers, symptoms (JSONB array)';
COMMENT ON COLUMN interview_signals.confidence IS 'Parser confidence 0.0-1.0';
COMMENT ON COLUMN interview_signals.extraction_method IS 'How data was extracted: ai, keyword, numeric, manual';
