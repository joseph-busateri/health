-- Create recommendation_learning_metrics table for tracking learning patterns

CREATE TABLE IF NOT EXISTS recommendation_learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  
  -- Metrics
  total_recommendations INTEGER NOT NULL,
  acceptance_rate DECIMAL(5,2) NOT NULL,
  
  -- Category weights (stored as JSONB)
  category_weights JSONB NOT NULL,
  
  -- Timestamp
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Index for querying
  CONSTRAINT recommendation_learning_metrics_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_learning_metrics_user ON recommendation_learning_metrics(user_id);
CREATE INDEX idx_learning_metrics_calculated_at ON recommendation_learning_metrics(calculated_at DESC);

COMMENT ON TABLE recommendation_learning_metrics IS 'Stores learning metrics for recommendation system to track acceptance patterns and adjust priorities over time';
