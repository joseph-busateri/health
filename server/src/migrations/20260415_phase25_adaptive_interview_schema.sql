-- Phase 25: Adaptive Interview System Schema Migration
-- Purpose: Enable intelligent, personalized voice interviews that learn from patterns and fill data gaps
-- Features: User profiles, pattern detection, data gap analysis, question effectiveness tracking
-- Part of: Phase 5 Voice Interview Adaptation

-- ============================================================================
-- USER INTERVIEW PROFILES TABLE
-- ============================================================================
-- Stores user-specific interview patterns, preferences, and data completeness metrics

CREATE TABLE IF NOT EXISTS user_interview_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    
    -- Interview statistics
    total_interviews INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    total_questions_skipped INTEGER DEFAULT 0,
    avg_response_length DECIMAL(10,2),
    avg_interview_duration INTEGER, -- seconds
    
    -- Response patterns
    frequent_topics JSONB DEFAULT '[]', -- Array of {topic, count, lastMentioned}
    avoided_topics JSONB DEFAULT '[]', -- Topics user tends to skip
    preferred_question_types JSONB DEFAULT '{}', -- {open_ended: 0.7, yes_no: 0.3}
    
    -- Data quality
    data_completeness JSONB DEFAULT '{}', -- {sleep: 0.9, nutrition: 0.6, ...}
    missing_data_categories JSONB DEFAULT '[]',
    last_data_gap_analysis TIMESTAMPTZ,
    
    -- Engagement metrics
    engagement_score DECIMAL(3,2) DEFAULT 0.5 CHECK (engagement_score >= 0 AND engagement_score <= 1),
    skip_rate DECIMAL(3,2) DEFAULT 0 CHECK (skip_rate >= 0 AND skip_rate <= 1),
    avg_confidence DECIMAL(3,2) CHECK (avg_confidence >= 0 AND avg_confidence <= 1),
    
    -- Personalization
    question_preferences JSONB DEFAULT '{}',
    optimal_interview_length INTEGER DEFAULT 10, -- questions
    best_interview_time TEXT, -- 'morning', 'afternoon', 'evening'
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_interview_at TIMESTAMPTZ
);

-- ============================================================================
-- INTERVIEW QUESTION EFFECTIVENESS TABLE
-- ============================================================================
-- Tracks how effective each question is for each user

CREATE TABLE IF NOT EXISTS interview_question_effectiveness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
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
    
    -- Effectiveness metrics
    times_asked INTEGER DEFAULT 1,
    times_answered INTEGER DEFAULT 0,
    times_skipped INTEGER DEFAULT 0,
    avg_response_quality DECIMAL(3,2) CHECK (avg_response_quality >= 0 AND avg_response_quality <= 1),
    avg_confidence DECIMAL(3,2) CHECK (avg_confidence >= 0 AND avg_confidence <= 1),
    
    -- Outcomes
    signals_extracted INTEGER DEFAULT 0,
    data_gaps_filled INTEGER DEFAULT 0,
    correlations_discovered INTEGER DEFAULT 0,
    
    -- Timing
    first_asked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_asked TIMESTAMPTZ,
    last_answered TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT question_effectiveness_unique 
        UNIQUE (user_id, question_id)
);

-- ============================================================================
-- ADAPTIVE INTERVIEW SESSIONS TABLE
-- ============================================================================
-- Tracks adaptive interview sessions and their outcomes

CREATE TABLE IF NOT EXISTS adaptive_interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    session_id UUID,
    
    -- Adaptation strategy
    strategy TEXT NOT NULL CHECK (strategy IN (
        'data_gap_focused',
        'pattern_exploration',
        'anomaly_investigation',
        'routine_check',
        'follow_up'
    )),
    
    -- Questions selected
    questions_planned JSONB NOT NULL, -- Array of question objects
    questions_asked INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    questions_skipped INTEGER DEFAULT 0,
    
    -- Data gaps targeted
    data_gaps_targeted JSONB DEFAULT '[]',
    data_gaps_filled JSONB DEFAULT '[]',
    
    -- Outcomes
    signals_extracted INTEGER DEFAULT 0,
    new_patterns_discovered INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(3,2) CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User Interview Profiles Indexes
CREATE INDEX idx_user_interview_profiles_user 
    ON user_interview_profiles(user_id);

CREATE INDEX idx_user_interview_profiles_last_interview 
    ON user_interview_profiles(last_interview_at DESC);

CREATE INDEX idx_user_interview_profiles_engagement 
    ON user_interview_profiles(engagement_score DESC)
    WHERE engagement_score IS NOT NULL;

-- Question Effectiveness Indexes
CREATE INDEX idx_question_effectiveness_user 
    ON interview_question_effectiveness(user_id, category);

CREATE INDEX idx_question_effectiveness_question 
    ON interview_question_effectiveness(question_id, user_id);

CREATE INDEX idx_question_effectiveness_performance 
    ON interview_question_effectiveness(category, avg_response_quality DESC)
    WHERE avg_response_quality IS NOT NULL;

-- Adaptive Interview Sessions Indexes
CREATE INDEX idx_adaptive_sessions_user 
    ON adaptive_interview_sessions(user_id, started_at DESC);

CREATE INDEX idx_adaptive_sessions_strategy 
    ON adaptive_interview_sessions(strategy, user_id);

CREATE INDEX idx_adaptive_sessions_session 
    ON adaptive_interview_sessions(session_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get or create user interview profile
CREATE OR REPLACE FUNCTION get_or_create_interview_profile(
    p_user_id TEXT
)
RETURNS user_interview_profiles AS $$
DECLARE
    v_profile user_interview_profiles;
BEGIN
    SELECT * INTO v_profile
    FROM user_interview_profiles
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO user_interview_profiles (user_id)
        VALUES (p_user_id)
        RETURNING * INTO v_profile;
    END IF;
    
    RETURN v_profile;
END;
$$ LANGUAGE plpgsql;

-- Calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
    p_user_id TEXT
)
RETURNS DECIMAL AS $$
DECLARE
    v_total_asked INTEGER;
    v_total_answered INTEGER;
    v_total_skipped INTEGER;
    v_avg_quality DECIMAL;
    v_engagement DECIMAL;
BEGIN
    SELECT 
        COALESCE(SUM(times_asked), 0),
        COALESCE(SUM(times_answered), 0),
        COALESCE(SUM(times_skipped), 0),
        COALESCE(AVG(avg_response_quality), 0.5)
    INTO v_total_asked, v_total_answered, v_total_skipped, v_avg_quality
    FROM interview_question_effectiveness
    WHERE user_id = p_user_id;
    
    IF v_total_asked = 0 THEN
        RETURN 0.5;
    END IF;
    
    -- Engagement = (answer_rate * 0.6) + (quality * 0.4)
    v_engagement := (
        (v_total_answered::DECIMAL / v_total_asked::DECIMAL) * 0.6 +
        v_avg_quality * 0.4
    );
    
    RETURN LEAST(1.0, GREATEST(0.0, v_engagement));
END;
$$ LANGUAGE plpgsql;

-- Get top performing questions by category
CREATE OR REPLACE FUNCTION get_top_questions_by_category(
    p_category TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    question_id TEXT,
    question_text TEXT,
    avg_quality DECIMAL,
    times_used INTEGER,
    success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qe.question_id,
        qe.question_text,
        qe.avg_response_quality as avg_quality,
        qe.times_asked as times_used,
        CASE 
            WHEN qe.times_asked > 0 
            THEN qe.times_answered::DECIMAL / qe.times_asked::DECIMAL
            ELSE 0
        END as success_rate
    FROM interview_question_effectiveness qe
    WHERE qe.category = p_category
        AND qe.times_asked >= 3
    ORDER BY qe.avg_response_quality DESC NULLS LAST, success_rate DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get user's data completeness
CREATE OR REPLACE FUNCTION get_data_completeness(
    p_user_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_completeness JSONB;
BEGIN
    SELECT data_completeness INTO v_completeness
    FROM user_interview_profiles
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_completeness, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Update profile after interview
CREATE OR REPLACE FUNCTION update_profile_after_interview(
    p_user_id TEXT,
    p_questions_answered INTEGER,
    p_questions_skipped INTEGER,
    p_duration_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE user_interview_profiles
    SET 
        total_interviews = total_interviews + 1,
        total_questions_answered = total_questions_answered + p_questions_answered,
        total_questions_skipped = total_questions_skipped + p_questions_skipped,
        avg_interview_duration = CASE 
            WHEN avg_interview_duration IS NULL THEN p_duration_seconds
            ELSE (avg_interview_duration + p_duration_seconds) / 2
        END,
        skip_rate = (total_questions_skipped + p_questions_skipped)::DECIMAL / 
                    NULLIF(total_questions_answered + total_questions_skipped + p_questions_answered + p_questions_skipped, 0),
        engagement_score = calculate_engagement_score(p_user_id),
        last_interview_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO user_interview_profiles (
            user_id,
            total_interviews,
            total_questions_answered,
            total_questions_skipped,
            avg_interview_duration,
            last_interview_at
        ) VALUES (
            p_user_id,
            1,
            p_questions_answered,
            p_questions_skipped,
            p_duration_seconds,
            NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on user_interview_profiles
CREATE OR REPLACE FUNCTION update_interview_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_interview_profile_timestamp
    BEFORE UPDATE ON user_interview_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_interview_profile_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_interview_profiles IS 'Phase 25: User-specific interview patterns, preferences, and data completeness metrics';
COMMENT ON TABLE interview_question_effectiveness IS 'Phase 25: Tracks effectiveness of each question for each user';
COMMENT ON TABLE adaptive_interview_sessions IS 'Phase 25: Tracks adaptive interview sessions and their outcomes';

COMMENT ON COLUMN user_interview_profiles.frequent_topics IS 'JSONB array of {topic, count, lastMentioned}';
COMMENT ON COLUMN user_interview_profiles.data_completeness IS 'JSONB object mapping categories to completeness scores 0-1';
COMMENT ON COLUMN user_interview_profiles.engagement_score IS 'Overall user engagement 0-1';
COMMENT ON COLUMN interview_question_effectiveness.avg_response_quality IS 'Average quality of responses 0-1 based on signal extraction';
COMMENT ON COLUMN adaptive_interview_sessions.strategy IS 'Adaptation strategy used for this session';
