-- Daily Interview Schema Migration
-- Purpose: Support AI-powered daily health interviews with session tracking and response storage
-- Features: Session management, conversation history, signal collection, AI integration

-- ============================================================================
-- 1. DAILY INTERVIEW SESSIONS TABLE
-- ============================================================================
-- Stores interview sessions with prompts, questions, and completion status

CREATE TABLE IF NOT EXISTS daily_interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- Session metadata
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'abandoned')),
    
    -- Interview prompts
    primary_prompt TEXT NOT NULL,
    follow_up_prompt TEXT,
    dynamic_questions JSONB NOT NULL DEFAULT '[]',
    -- Expected structure: ["Question 1", "Question 2", ...]
    
    -- Focus areas
    focus_components TEXT[] NOT NULL DEFAULT '{}',
    -- e.g., ['rec', 'perf', 'met', 'cv', 'sh']
    reason TEXT,
    -- Explanation of why these components were selected
    
    -- Submission data
    submission JSONB,
    -- Expected structure: {
    --   primaryResponse?: string,
    --   followUpResponse?: string,
    --   workout?: { adherence: number, notes?: string },
    --   supplement?: { adherence: number, notes?: string },
    --   recoveryCluster?: { sleepHours?: number, sleepQuality?: number, stressLevel?: number }
    -- }
    
    -- Signal tracking
    signals_collected JSONB NOT NULL DEFAULT '{"recovery": false, "stress": false, "workout": false, "nutrition": false, "supplements": false}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_interview_sessions_user_date ON daily_interview_sessions(user_id, date DESC);
CREATE INDEX idx_daily_interview_sessions_status ON daily_interview_sessions(user_id, status);
CREATE INDEX idx_daily_interview_sessions_created ON daily_interview_sessions(created_at DESC);

-- ============================================================================
-- 2. INTERVIEW CONVERSATION HISTORY TABLE
-- ============================================================================
-- Stores individual question-answer pairs within an interview session

CREATE TABLE IF NOT EXISTS interview_conversation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES daily_interview_sessions(id) ON DELETE CASCADE,
    
    -- Conversation turn
    question_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    
    -- Metadata
    category TEXT,
    -- e.g., 'recovery', 'workout', 'nutrition', 'stress', 'general'
    source TEXT NOT NULL CHECK (source IN ('static', 'ai', 'dynamic')),
    priority INTEGER DEFAULT 0,
    
    -- Timing
    time_elapsed_seconds INTEGER,
    -- Time taken to answer this question
    
    -- AI context
    quick_responses JSONB,
    -- Expected structure: ["Option 1", "Option 2", ...]
    ai_confidence DECIMAL(3,2),
    -- AI confidence in question relevance (0.00 to 1.00)
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Order within session
    turn_order INTEGER NOT NULL
);

CREATE INDEX idx_interview_conversation_session ON interview_conversation_history(session_id, turn_order);
CREATE INDEX idx_interview_conversation_category ON interview_conversation_history(category);

-- ============================================================================
-- 3. INTERVIEW INSIGHTS TABLE
-- ============================================================================
-- Stores AI-generated insights and patterns from interview responses

CREATE TABLE IF NOT EXISTS interview_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES daily_interview_sessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    
    -- Insight details
    insight_type TEXT NOT NULL,
    -- e.g., 'recovery_pattern', 'stress_trigger', 'adherence_barrier', 'progress_indicator'
    insight_text TEXT NOT NULL,
    confidence DECIMAL(3,2),
    
    -- Related data
    related_components TEXT[] NOT NULL DEFAULT '{}',
    -- Components this insight relates to
    supporting_evidence JSONB,
    -- Data points that support this insight
    
    -- Actionability
    is_actionable BOOLEAN DEFAULT false,
    recommended_action TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interview_insights_session ON interview_insights(session_id);
CREATE INDEX idx_interview_insights_user ON interview_insights(user_id, created_at DESC);
CREATE INDEX idx_interview_insights_type ON interview_insights(insight_type);

-- ============================================================================
-- 4. HYBRID INTERVIEW SESSIONS TABLE
-- ============================================================================
-- Stores hybrid interview sessions (text + voice + AI)

CREATE TABLE IF NOT EXISTS hybrid_interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- Session metadata
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_time_elapsed INTEGER DEFAULT 0,
    -- Total time in seconds
    
    -- Interview context
    interview_context JSONB NOT NULL DEFAULT '{}',
    -- Full context passed to AI (recovery, stress, workout, etc.)
    
    -- Conversation history
    conversation_history JSONB NOT NULL DEFAULT '[]',
    -- Array of { questionId, question, answer, timestamp, timeElapsed }
    
    -- Signal collection status
    signals_collected JSONB NOT NULL DEFAULT '{"recovery": false, "stress": false, "workout": false, "nutrition": false, "supplements": false}',
    
    -- Completion status
    is_complete BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hybrid_interview_sessions_user ON hybrid_interview_sessions(user_id, started_at DESC);
CREATE INDEX idx_hybrid_interview_sessions_complete ON hybrid_interview_sessions(is_complete);

-- ============================================================================
-- 5. VOICE INTERVIEW TRANSCRIPTS TABLE
-- ============================================================================
-- Stores voice interview audio transcripts and metadata

CREATE TABLE IF NOT EXISTS voice_interview_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES hybrid_interview_sessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    
    -- Audio metadata
    audio_url TEXT,
    audio_duration_seconds INTEGER,
    
    -- Transcript
    transcript_text TEXT NOT NULL,
    transcript_confidence DECIMAL(3,2),
    
    -- Processing
    processed_at TIMESTAMPTZ,
    processing_status TEXT NOT NULL CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Extracted data
    extracted_signals JSONB,
    -- Structured data extracted from transcript
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voice_transcripts_session ON voice_interview_transcripts(session_id);
CREATE INDEX idx_voice_transcripts_user ON voice_interview_transcripts(user_id, created_at DESC);
CREATE INDEX idx_voice_transcripts_status ON voice_interview_transcripts(processing_status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update completed_at when status changes to completed
CREATE OR REPLACE FUNCTION update_interview_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_interview_sessions_completed
  BEFORE UPDATE ON daily_interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_interview_completed_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE daily_interview_sessions IS 'Stores daily health interview sessions with prompts, questions, and completion tracking';
COMMENT ON TABLE interview_conversation_history IS 'Stores individual question-answer pairs within interview sessions';
COMMENT ON TABLE interview_insights IS 'Stores AI-generated insights and patterns from interview responses';
COMMENT ON TABLE hybrid_interview_sessions IS 'Stores hybrid interview sessions combining text, voice, and AI';
COMMENT ON TABLE voice_interview_transcripts IS 'Stores voice interview audio transcripts and extracted data';
