-- Conversational AI Schema Migration
-- Purpose: Support AI-powered conversational health assistant with chat sessions, message history, and context management
-- Features: Multi-turn conversations, context awareness, health data integration, personalized responses

-- ============================================================================
-- 1. AI CHAT SESSIONS TABLE
-- ============================================================================
-- Stores conversational AI chat sessions with user context

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- Session metadata
    session_type TEXT NOT NULL CHECK (session_type IN ('general_chat', 'health_analysis', 'workout_planning', 'nutrition_advice', 'goal_setting', 'symptom_check')),
    title TEXT,
    -- Auto-generated or user-provided session title
    
    -- Context and state
    context_snapshot JSONB NOT NULL DEFAULT '{}',
    -- Snapshot of user's health data at session start
    -- Expected structure: {
    --   recovery: { sleepHours, score, status },
    --   stress: { level, sources },
    --   goals: [...],
    --   recentWorkouts: [...],
    --   recentBloodwork: {...},
    --   supplements: [...]
    -- }
    
    session_state JSONB NOT NULL DEFAULT '{}',
    -- Current conversation state
    -- Expected structure: {
    --   topic: string,
    --   intent: string,
    --   entities: {...},
    --   pendingActions: [...],
    --   conversationPhase: string
    -- }
    
    -- AI configuration
    ai_model TEXT DEFAULT 'gpt-4o-mini',
    temperature DECIMAL(2,1) DEFAULT 0.7,
    system_prompt TEXT,
    -- Custom system prompt for this session
    
    -- Session status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metrics
    message_count INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_chat_sessions_user ON ai_chat_sessions(user_id, created_at DESC);
CREATE INDEX idx_ai_chat_sessions_status ON ai_chat_sessions(user_id, status);
CREATE INDEX idx_ai_chat_sessions_type ON ai_chat_sessions(session_type);
CREATE INDEX idx_ai_chat_sessions_activity ON ai_chat_sessions(last_activity_at DESC);

-- ============================================================================
-- 2. AI CHAT MESSAGES TABLE
-- ============================================================================
-- Stores individual messages within chat sessions

CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    
    -- Message content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- Message metadata
    message_order INTEGER NOT NULL,
    -- Order within session (0-indexed)
    
    -- AI response metadata (for assistant messages)
    model TEXT,
    -- Model used to generate this response
    tokens_used INTEGER,
    -- Tokens consumed for this message
    finish_reason TEXT,
    -- 'stop', 'length', 'content_filter', etc.
    
    -- Context and intent
    intent TEXT,
    -- Detected user intent for user messages
    entities JSONB,
    -- Extracted entities from message
    -- Expected structure: {
    --   symptoms: [...],
    --   metrics: [...],
    --   goals: [...],
    --   dates: [...],
    --   numbers: [...]
    -- }
    
    -- Actions and recommendations
    suggested_actions JSONB,
    -- Actions suggested by AI
    -- Expected structure: [
    --   { type: 'log_workout', data: {...} },
    --   { type: 'set_goal', data: {...} },
    --   { type: 'schedule_bloodwork', data: {...} }
    -- ]
    
    -- Feedback and learning
    user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful', 'inaccurate')),
    feedback_note TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_messages_session ON ai_chat_messages(session_id, message_order);
CREATE INDEX idx_ai_chat_messages_role ON ai_chat_messages(role);
CREATE INDEX idx_ai_chat_messages_created ON ai_chat_messages(created_at DESC);

-- ============================================================================
-- 3. AI CONVERSATION CONTEXT TABLE
-- ============================================================================
-- Stores conversation context and memory for personalization

CREATE TABLE IF NOT EXISTS ai_conversation_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- Context type
    context_type TEXT NOT NULL CHECK (context_type IN ('user_preferences', 'health_summary', 'conversation_memory', 'learned_patterns')),
    
    -- Context data
    context_key TEXT NOT NULL,
    -- e.g., 'preferred_workout_time', 'dietary_restrictions', 'communication_style'
    context_value JSONB NOT NULL,
    -- Flexible storage for any context data
    
    -- Metadata
    source TEXT,
    -- Where this context came from: 'user_stated', 'inferred', 'baseline_profile', 'conversation_history'
    confidence DECIMAL(3,2),
    -- Confidence in this context (0.00 to 1.00)
    
    -- Validity
    is_active BOOLEAN DEFAULT true,
    valid_until TIMESTAMPTZ,
    -- Optional expiration for time-sensitive context
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, context_type, context_key)
);

CREATE INDEX idx_ai_conversation_context_user ON ai_conversation_context(user_id, context_type);
CREATE INDEX idx_ai_conversation_context_active ON ai_conversation_context(is_active);

-- ============================================================================
-- 4. AI INSIGHTS TABLE
-- ============================================================================
-- Stores AI-generated insights and recommendations from conversations

CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE SET NULL,
    
    -- Insight details
    insight_type TEXT NOT NULL,
    -- e.g., 'health_pattern', 'risk_factor', 'opportunity', 'correlation', 'recommendation'
    category TEXT NOT NULL,
    -- e.g., 'recovery', 'nutrition', 'workout', 'stress', 'metabolic', 'cardiovascular'
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Supporting data
    supporting_evidence JSONB,
    -- Data points that support this insight
    confidence DECIMAL(3,2),
    -- AI confidence in this insight (0.00 to 1.00)
    
    -- Actionability
    is_actionable BOOLEAN DEFAULT false,
    recommended_actions JSONB,
    -- Specific actions user can take
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- User interaction
    user_status TEXT DEFAULT 'new' CHECK (user_status IN ('new', 'viewed', 'acknowledged', 'acted_on', 'dismissed')),
    user_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
    -- Optional expiration for time-sensitive insights
);

CREATE INDEX idx_ai_insights_user ON ai_insights(user_id, created_at DESC);
CREATE INDEX idx_ai_insights_session ON ai_insights(session_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_status ON ai_insights(user_id, user_status);
CREATE INDEX idx_ai_insights_priority ON ai_insights(priority, user_status);

-- ============================================================================
-- 5. AI HEALTH QUERIES TABLE
-- ============================================================================
-- Stores specific health-related queries and AI responses for analytics

CREATE TABLE IF NOT EXISTS ai_health_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE SET NULL,
    
    -- Query details
    query_text TEXT NOT NULL,
    query_type TEXT NOT NULL,
    -- e.g., 'symptom_check', 'metric_interpretation', 'workout_advice', 'nutrition_question', 'goal_planning'
    
    -- AI response
    response_text TEXT NOT NULL,
    response_confidence DECIMAL(3,2),
    
    -- Health data referenced
    referenced_data JSONB,
    -- Health data points used to answer query
    -- Expected structure: {
    --   bloodwork: [...],
    --   workouts: [...],
    --   recovery: [...],
    --   symptoms: [...]
    -- }
    
    -- Medical disclaimer
    requires_medical_disclaimer BOOLEAN DEFAULT true,
    disclaimer_shown BOOLEAN DEFAULT false,
    
    -- Follow-up
    follow_up_questions JSONB,
    -- Suggested follow-up questions
    user_asked_followup BOOLEAN DEFAULT false,
    
    -- Quality metrics
    response_time_ms INTEGER,
    tokens_used INTEGER,
    
    -- User feedback
    was_helpful BOOLEAN,
    feedback_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_health_queries_user ON ai_health_queries(user_id, created_at DESC);
CREATE INDEX idx_ai_health_queries_session ON ai_health_queries(session_id);
CREATE INDEX idx_ai_health_queries_type ON ai_health_queries(query_type);
CREATE INDEX idx_ai_health_queries_helpful ON ai_health_queries(was_helpful);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update last_activity_at on new message
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_chat_sessions
  SET last_activity_at = NOW(),
      message_count = message_count + 1
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_chat_messages_activity
  AFTER INSERT ON ai_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- Auto-update updated_at on context changes
CREATE OR REPLACE FUNCTION update_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_conversation_context_updated
  BEFORE UPDATE ON ai_conversation_context
  FOR EACH ROW
  EXECUTE FUNCTION update_context_timestamp();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get active session for user
CREATE OR REPLACE FUNCTION get_active_ai_session(p_user_id TEXT)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  SELECT id INTO v_session_id
  FROM ai_chat_sessions
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY last_activity_at DESC
  LIMIT 1;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Get conversation history for session
CREATE OR REPLACE FUNCTION get_conversation_history(p_session_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.role, m.content, m.created_at
  FROM ai_chat_messages m
  WHERE m.session_id = p_session_id
  ORDER BY m.message_order ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_chat_sessions IS 'Stores AI-powered conversational health assistant chat sessions';
COMMENT ON TABLE ai_chat_messages IS 'Stores individual messages within AI chat sessions';
COMMENT ON TABLE ai_conversation_context IS 'Stores conversation context and memory for personalization';
COMMENT ON TABLE ai_insights IS 'Stores AI-generated insights and recommendations from conversations';
COMMENT ON TABLE ai_health_queries IS 'Stores specific health-related queries and AI responses for analytics';
