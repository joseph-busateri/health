-- Migration: Create Central Recommendations Table
-- Date: 2026-04-03
-- Purpose: Create unified recommendations table with lifecycle management, prioritization, and conflict detection

-- ============================================================================
-- RECOMMENDATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source information
  source_engine TEXT NOT NULL CHECK (source_engine IN (
    'recovery',
    'stress',
    'joint_health',
    'adherence',
    'workout',
    'supplement',
    'nutrition',
    'cardiovascular',
    'metabolic',
    'sexual_health',
    'holistic',
    'prediction'
  )),
  source_record_id UUID, -- Reference to the engine record that generated this
  
  -- Recommendation content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT, -- Why this recommendation was made
  
  -- Priority and urgency
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'important', 'optimization')),
  urgency_score INTEGER CHECK (urgency_score >= 0 AND urgency_score <= 100), -- 0-100, higher = more urgent
  
  -- Category and type
  category TEXT NOT NULL CHECK (category IN (
    'workout_modification',
    'supplement_adjustment',
    'nutrition_change',
    'lifestyle_change',
    'medical_consultation',
    'recovery_protocol',
    'stress_management',
    'sleep_optimization',
    'performance_enhancement',
    'injury_prevention',
    'health_monitoring'
  )),
  
  -- Lifecycle state
  state TEXT NOT NULL DEFAULT 'generated' CHECK (state IN (
    'generated',    -- Just created by engine
    'presented',    -- Shown to user
    'accepted',     -- User accepted
    'rejected',     -- User rejected
    'snoozed',      -- User snoozed for later
    'modified',     -- User modified the recommendation
    'completed',    -- User marked as completed
    'expired'       -- Recommendation expired (time-based or superseded)
  )),
  
  -- Lifecycle timestamps
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  presented_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  snoozed_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  modified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  
  -- Action details
  action_type TEXT CHECK (action_type IN (
    'add',
    'remove',
    'modify',
    'increase',
    'decrease',
    'start',
    'stop',
    'consult',
    'monitor',
    'test'
  )),
  action_target TEXT, -- What to act on (e.g., "Creatine", "Bench Press", "Sleep Duration")
  action_details JSONB, -- Specific details about the action
  
  -- Confidence and data quality
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  -- Conflict detection
  conflicts_with UUID[], -- Array of recommendation IDs this conflicts with
  conflict_reason TEXT, -- Why there's a conflict
  conflict_resolved BOOLEAN DEFAULT FALSE,
  
  -- User interaction
  user_notes TEXT,
  user_modified_details JSONB, -- If user modified, what changed
  rejection_reason TEXT,
  snooze_reason TEXT,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  expiration_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (
    (state = 'presented' AND presented_at IS NOT NULL) OR
    (state != 'presented')
  ),
  CHECK (
    (state = 'accepted' AND accepted_at IS NOT NULL) OR
    (state != 'accepted')
  ),
  CHECK (
    (state = 'rejected' AND rejected_at IS NOT NULL) OR
    (state != 'rejected')
  ),
  CHECK (
    (state = 'snoozed' AND snoozed_at IS NOT NULL AND snoozed_until IS NOT NULL) OR
    (state != 'snoozed')
  ),
  CHECK (
    (state = 'completed' AND completed_at IS NOT NULL) OR
    (state != 'completed')
  ),
  CHECK (
    (state = 'expired' AND expired_at IS NOT NULL) OR
    (state != 'expired')
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User and state queries
CREATE INDEX idx_recommendations_user_state ON recommendations(user_id, state);
CREATE INDEX idx_recommendations_user_priority ON recommendations(user_id, priority, state);
CREATE INDEX idx_recommendations_user_created ON recommendations(user_id, created_at DESC);

-- Source engine queries
CREATE INDEX idx_recommendations_source_engine ON recommendations(source_engine, user_id);
CREATE INDEX idx_recommendations_source_record ON recommendations(source_record_id) WHERE source_record_id IS NOT NULL;

-- Lifecycle queries
CREATE INDEX idx_recommendations_state ON recommendations(state);
CREATE INDEX idx_recommendations_generated_at ON recommendations(generated_at DESC);
CREATE INDEX idx_recommendations_expires_at ON recommendations(expires_at) WHERE expires_at IS NOT NULL;

-- Priority and urgency
CREATE INDEX idx_recommendations_priority_urgency ON recommendations(priority, urgency_score DESC);

-- Conflict detection
CREATE INDEX idx_recommendations_conflicts ON recommendations USING GIN(conflicts_with) WHERE conflicts_with IS NOT NULL;

-- Category queries
CREATE INDEX idx_recommendations_category ON recommendations(category, user_id);

-- ============================================================================
-- RECOMMENDATION HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  
  -- State transition
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  
  -- Transition details
  transition_reason TEXT,
  user_action BOOLEAN DEFAULT FALSE, -- Was this a user action or system action?
  
  -- Metadata
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB -- Additional context about the transition
);

-- Index for history queries
CREATE INDEX idx_recommendation_history_recommendation ON recommendation_history(recommendation_id, transitioned_at DESC);
CREATE INDEX idx_recommendation_history_transitions ON recommendation_history(from_state, to_state);

-- ============================================================================
-- RECOMMENDATION CONFLICTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendation_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_a_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  recommendation_b_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  
  -- Conflict details
  conflict_type TEXT NOT NULL CHECK (conflict_type IN (
    'contradictory',      -- Directly contradicts (e.g., increase vs decrease same thing)
    'mutually_exclusive', -- Can't do both (e.g., rest day vs heavy workout)
    'resource_conflict',  -- Limited resources (e.g., time, budget)
    'timing_conflict',    -- Same time slot
    'dependency',         -- One depends on the other
    'redundant'           -- Essentially the same recommendation
  )),
  conflict_severity TEXT NOT NULL CHECK (conflict_severity IN ('low', 'medium', 'high', 'critical')),
  conflict_description TEXT NOT NULL,
  
  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolution_strategy TEXT CHECK (resolution_strategy IN (
    'keep_higher_priority',
    'keep_both',
    'merge',
    'user_choice',
    'automatic'
  )),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT, -- 'system' or 'user'
  
  -- Metadata
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (recommendation_a_id != recommendation_b_id),
  UNIQUE(recommendation_a_id, recommendation_b_id)
);

-- Index for conflict queries
CREATE INDEX idx_recommendation_conflicts_unresolved ON recommendation_conflicts(resolved) WHERE resolved = FALSE;
CREATE INDEX idx_recommendation_conflicts_severity ON recommendation_conflicts(conflict_severity, resolved);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_recommendations_updated_at();

-- Track state transitions in history
CREATE OR REPLACE FUNCTION track_recommendation_state_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.state != NEW.state THEN
    INSERT INTO recommendation_history (
      recommendation_id,
      from_state,
      to_state,
      transition_reason,
      user_action
    ) VALUES (
      NEW.id,
      OLD.state,
      NEW.state,
      CASE
        WHEN NEW.state = 'presented' THEN 'Recommendation shown to user'
        WHEN NEW.state = 'accepted' THEN 'User accepted recommendation'
        WHEN NEW.state = 'rejected' THEN 'User rejected recommendation'
        WHEN NEW.state = 'snoozed' THEN 'User snoozed recommendation'
        WHEN NEW.state = 'completed' THEN 'User completed recommendation'
        WHEN NEW.state = 'expired' THEN 'Recommendation expired'
        ELSE 'State changed'
      END,
      NEW.state IN ('accepted', 'rejected', 'snoozed', 'completed')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_recommendation_state_change
  AFTER UPDATE ON recommendations
  FOR EACH ROW
  WHEN (OLD.state IS DISTINCT FROM NEW.state)
  EXECUTE FUNCTION track_recommendation_state_change();

-- Auto-expire recommendations
CREATE OR REPLACE FUNCTION auto_expire_recommendations()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() AND NEW.state NOT IN ('completed', 'expired') THEN
    NEW.state = 'expired';
    NEW.expired_at = NOW();
    NEW.expiration_reason = 'Automatic expiration based on expires_at timestamp';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_expire_recommendations
  BEFORE UPDATE ON recommendations
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_recommendations();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get active recommendations for a user
CREATE OR REPLACE FUNCTION get_active_recommendations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  priority TEXT,
  urgency_score INTEGER,
  category TEXT,
  source_engine TEXT,
  state TEXT,
  generated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.priority,
    r.urgency_score,
    r.category,
    r.source_engine,
    r.state,
    r.generated_at,
    r.expires_at
  FROM recommendations r
  WHERE r.user_id = p_user_id
    AND r.state IN ('generated', 'presented', 'snoozed')
    AND (r.expires_at IS NULL OR r.expires_at > NOW())
  ORDER BY
    CASE r.priority
      WHEN 'critical' THEN 1
      WHEN 'important' THEN 2
      WHEN 'optimization' THEN 3
    END,
    r.urgency_score DESC,
    r.generated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get recommendation conflicts for a user
CREATE OR REPLACE FUNCTION get_recommendation_conflicts(p_user_id UUID)
RETURNS TABLE (
  conflict_id UUID,
  recommendation_a_id UUID,
  recommendation_b_id UUID,
  conflict_type TEXT,
  conflict_severity TEXT,
  conflict_description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.recommendation_a_id,
    rc.recommendation_b_id,
    rc.conflict_type,
    rc.conflict_severity,
    rc.conflict_description
  FROM recommendation_conflicts rc
  JOIN recommendations ra ON rc.recommendation_a_id = ra.id
  WHERE ra.user_id = p_user_id
    AND rc.resolved = FALSE
  ORDER BY
    CASE rc.conflict_severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END;
END;
$$ LANGUAGE plpgsql;

-- Get recommendation history
CREATE OR REPLACE FUNCTION get_recommendation_history(p_recommendation_id UUID)
RETURNS TABLE (
  id UUID,
  from_state TEXT,
  to_state TEXT,
  transition_reason TEXT,
  user_action BOOLEAN,
  transitioned_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rh.id,
    rh.from_state,
    rh.to_state,
    rh.transition_reason,
    rh.user_action,
    rh.transitioned_at
  FROM recommendation_history rh
  WHERE rh.recommendation_id = p_recommendation_id
  ORDER BY rh.transitioned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE recommendations IS 'Central table for all health recommendations with lifecycle management and prioritization';
COMMENT ON TABLE recommendation_history IS 'Tracks all state transitions for recommendations';
COMMENT ON TABLE recommendation_conflicts IS 'Tracks conflicts between recommendations for resolution';

COMMENT ON COLUMN recommendations.state IS 'Lifecycle state: generated → presented → accepted/rejected/snoozed → completed/expired';
COMMENT ON COLUMN recommendations.priority IS 'Priority level: critical (health risk), important (significant impact), optimization (nice to have)';
COMMENT ON COLUMN recommendations.urgency_score IS 'Urgency score 0-100, higher = more urgent within same priority level';
COMMENT ON COLUMN recommendations.conflicts_with IS 'Array of recommendation IDs this conflicts with';
COMMENT ON COLUMN recommendations.confidence_level IS 'Confidence in recommendation based on data quality';
