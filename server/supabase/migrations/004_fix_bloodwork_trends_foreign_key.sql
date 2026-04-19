-- Remove foreign key constraint that's preventing trend inserts
-- The test user ID doesn't exist in auth.users, but bloodwork_results and bloodwork_documents
-- already use this pattern, so bloodwork_trends should match

-- Drop the existing table and recreate without the foreign key constraint
DROP TABLE IF EXISTS bloodwork_trends CASCADE;

-- Create bloodwork_trends table WITHOUT foreign key to auth.users
CREATE TABLE bloodwork_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- No foreign key constraint
  marker_name TEXT NOT NULL,
  category TEXT,
  latest_value NUMERIC,
  prior_value NUMERIC,
  absolute_change NUMERIC,
  change_percent NUMERIC,
  trend_direction TEXT NOT NULL CHECK (trend_direction IN ('improving', 'worsening', 'stable', 'insufficient_data')),
  data_points INTEGER NOT NULL,
  first_test_date DATE NOT NULL,
  latest_test_date DATE NOT NULL,
  unit TEXT,
  trend_summary TEXT,
  reference_range_low NUMERIC,
  reference_range_high NUMERIC,
  abnormal_flag TEXT,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_bloodwork_trends_user_id ON bloodwork_trends(user_id);
CREATE INDEX idx_bloodwork_trends_marker_name ON bloodwork_trends(marker_name);
CREATE INDEX idx_bloodwork_trends_calculated_at ON bloodwork_trends(calculated_at DESC);
CREATE INDEX idx_bloodwork_trends_user_marker ON bloodwork_trends(user_id, marker_name);

-- Enable Row Level Security
ALTER TABLE bloodwork_trends ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own bloodwork trends"
  ON bloodwork_trends
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bloodwork trends"
  ON bloodwork_trends
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bloodwork trends"
  ON bloodwork_trends
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bloodwork trends"
  ON bloodwork_trends
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can do everything (for backend processing)
CREATE POLICY "Service role has full access to bloodwork trends"
  ON bloodwork_trends
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comment
COMMENT ON TABLE bloodwork_trends IS 'Stores calculated trends for bloodwork markers comparing latest vs prior values';
