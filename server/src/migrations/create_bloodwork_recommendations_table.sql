-- Create bloodwork_recommendations table
CREATE TABLE IF NOT EXISTS bloodwork_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  normalized_test_name TEXT,
  category TEXT,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('cardiovascular', 'metabolic', 'hormonal', 'inflammation', 'follow_up', 'monitoring', 'lifestyle', 'supplement_review', 'workout_review')),
  recommendation_title TEXT NOT NULL,
  recommendation_text TEXT NOT NULL,
  rationale TEXT NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'resolved')),
  source_document_ids TEXT[] NOT NULL DEFAULT '{}',
  source_result_ids TEXT[] NOT NULL DEFAULT '{}',
  source_trend_window JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bloodwork_recommendations_user_id ON bloodwork_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_recommendations_status ON bloodwork_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_bloodwork_recommendations_recommendation_type ON bloodwork_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_bloodwork_recommendations_severity ON bloodwork_recommendations(severity);
CREATE INDEX IF NOT EXISTS idx_bloodwork_recommendations_test_name ON bloodwork_recommendations(test_name);
CREATE INDEX IF NOT EXISTS idx_bloodwork_recommendations_normalized_test_name ON bloodwork_recommendations(normalized_test_name) WHERE normalized_test_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bloodwork_recommendations_created_at ON bloodwork_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bloodwork_recommendations_user_status ON bloodwork_recommendations(user_id, status);

-- Create RLS policies
ALTER TABLE bloodwork_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own recommendations
CREATE POLICY "Users can read own bloodwork recommendations" ON bloodwork_recommendations
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own recommendations
CREATE POLICY "Users can insert own bloodwork recommendations" ON bloodwork_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own recommendations
CREATE POLICY "Users can update own bloodwork recommendations" ON bloodwork_recommendations
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own recommendations
CREATE POLICY "Users can delete own bloodwork recommendations" ON bloodwork_recommendations
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role full access to bloodwork_recommendations" ON bloodwork_recommendations
  FOR ALL USING (role() = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_bloodwork_recommendations_updated_at
  BEFORE UPDATE ON bloodwork_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE bloodwork_recommendations IS 'Stores AI-generated recommendations based on bloodwork trends and results';
COMMENT ON COLUMN bloodwork_recommendations.source_trend_window IS 'JSON object with start_date, end_date, and data_points for the trend analysis';
COMMENT ON COLUMN bloodwork_recommendations.confidence IS 'Confidence score (0-1) for the recommendation based on data quality and trend strength';
