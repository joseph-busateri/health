-- Create unified_recommendations table
CREATE TABLE IF NOT EXISTS unified_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Classification
  source TEXT NOT NULL CHECK (source IN (
    'bloodwork', 'body_composition', 'device_data', 'goals', 
    'adherence', 'supplements', 'workout', 'sleep', 'nutrition', 'ai_analysis'
  )),
  category TEXT NOT NULL CHECK (category IN (
    'cardiovascular', 'metabolic', 'hormonal', 'inflammation',
    'body_composition', 'recovery', 'performance', 'lifestyle',
    'nutrition', 'supplement', 'workout', 'sleep', 'stress_management'
  )),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  timeframe TEXT NOT NULL CHECK (timeframe IN ('immediate', 'today', 'this_week', 'this_month', 'long_term')),
  
  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT NOT NULL,
  intended_outcome TEXT NOT NULL,
  action_items JSONB,
  
  -- Metadata
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'dismissed', 'superseded', 'expired')),
  
  -- Source Data
  source_data JSONB NOT NULL,
  
  -- User Interaction
  accepted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissal_reason TEXT,
  user_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- AI Enhancement
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_cost DECIMAL(10,6),
  
  -- Related Recommendations
  related_recommendation_ids UUID[],
  supersedes_recommendation_id UUID REFERENCES unified_recommendations(id)
);

-- Indexes for performance
CREATE INDEX idx_unified_recommendations_user_id ON unified_recommendations(user_id);
CREATE INDEX idx_unified_recommendations_status ON unified_recommendations(status);
CREATE INDEX idx_unified_recommendations_priority ON unified_recommendations(priority);
CREATE INDEX idx_unified_recommendations_timeframe ON unified_recommendations(timeframe);
CREATE INDEX idx_unified_recommendations_source ON unified_recommendations(source);
CREATE INDEX idx_unified_recommendations_category ON unified_recommendations(category);
CREATE INDEX idx_unified_recommendations_created_at ON unified_recommendations(created_at DESC);
CREATE INDEX idx_unified_recommendations_user_status ON unified_recommendations(user_id, status);

-- RLS Policies
ALTER TABLE unified_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations"
  ON unified_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON unified_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_unified_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unified_recommendations_updated_at
  BEFORE UPDATE ON unified_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_unified_recommendations_updated_at();

-- Function to get active recommendations summary
CREATE OR REPLACE FUNCTION get_recommendations_summary(p_user_id UUID)
RETURNS TABLE (
  total_active INTEGER,
  critical_count INTEGER,
  high_count INTEGER,
  medium_count INTEGER,
  low_count INTEGER,
  immediate_count INTEGER,
  today_count INTEGER,
  this_week_count INTEGER,
  accepted_count INTEGER,
  dismissed_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_active,
    COUNT(*) FILTER (WHERE priority = 'critical')::INTEGER AS critical_count,
    COUNT(*) FILTER (WHERE priority = 'high')::INTEGER AS high_count,
    COUNT(*) FILTER (WHERE priority = 'medium')::INTEGER AS medium_count,
    COUNT(*) FILTER (WHERE priority = 'low')::INTEGER AS low_count,
    COUNT(*) FILTER (WHERE timeframe = 'immediate')::INTEGER AS immediate_count,
    COUNT(*) FILTER (WHERE timeframe = 'today')::INTEGER AS today_count,
    COUNT(*) FILTER (WHERE timeframe = 'this_week')::INTEGER AS this_week_count,
    COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER AS accepted_count,
    COUNT(*) FILTER (WHERE status = 'dismissed')::INTEGER AS dismissed_count
  FROM unified_recommendations
  WHERE user_id = p_user_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_recommendations_summary(UUID) TO authenticated;

COMMENT ON TABLE unified_recommendations IS 'Unified recommendation system consolidating all health recommendations';
COMMENT ON COLUMN unified_recommendations.source IS 'Source system that generated the recommendation';
COMMENT ON COLUMN unified_recommendations.category IS 'Health category of the recommendation';
COMMENT ON COLUMN unified_recommendations.priority IS 'Priority level for user action';
COMMENT ON COLUMN unified_recommendations.timeframe IS 'Suggested timeframe for implementation';
COMMENT ON COLUMN unified_recommendations.intended_outcome IS 'Expected result if user implements the recommendation';
COMMENT ON COLUMN unified_recommendations.source_data IS 'JSON containing source IDs and metadata';
COMMENT ON COLUMN unified_recommendations.ai_generated IS 'Whether recommendation was AI-generated vs rule-based';
