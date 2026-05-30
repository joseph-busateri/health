-- Create bloodwork_results table
CREATE TABLE IF NOT EXISTS bloodwork_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES bloodwork_documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  raw_test_name TEXT NOT NULL,
  normalized_test_name TEXT,
  category TEXT,
  value_text TEXT,
  value_numeric DECIMAL(10, 4),
  unit TEXT,
  reference_range_low DECIMAL(10, 4),
  reference_range_high DECIMAL(10, 4),
  reference_range_text TEXT,
  abnormal_flag BOOLEAN,
  confidence DECIMAL(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  test_date DATE,
  source TEXT DEFAULT 'extraction',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_user_id ON bloodwork_results(user_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_document_id ON bloodwork_results(document_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_normalized_name ON bloodwork_results(normalized_test_name) WHERE normalized_test_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_category ON bloodwork_results(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_test_date ON bloodwork_results(test_date) WHERE test_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bloodwork_results_user_date ON bloodwork_results(user_id, test_date DESC) WHERE test_date IS NOT NULL;

-- Create RLS policies
ALTER TABLE bloodwork_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to make migration rerunnable
DROP POLICY IF EXISTS "Users can read own bloodwork results" ON bloodwork_results;
DROP POLICY IF EXISTS "Users can insert own bloodwork results" ON bloodwork_results;
DROP POLICY IF EXISTS "Users can update own bloodwork results" ON bloodwork_results;
DROP POLICY IF EXISTS "Users can delete own bloodwork results" ON bloodwork_results;
DROP POLICY IF EXISTS "Service role full access to bloodwork_results" ON bloodwork_results;

-- Policy: Users can only read their own results
CREATE POLICY "Users can read own bloodwork results" ON bloodwork_results
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can only insert their own results
CREATE POLICY "Users can insert own bloodwork results" ON bloodwork_results
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can only update their own results
CREATE POLICY "Users can update own bloodwork results" ON bloodwork_results
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can only delete their own results
CREATE POLICY "Users can delete own bloodwork results" ON bloodwork_results
  FOR DELETE USING (auth.uid()::text = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role full access to bloodwork_results" ON bloodwork_results
  FOR ALL USING (role() = 'service_role');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bloodwork_results_updated_at
  BEFORE UPDATE ON bloodwork_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE bloodwork_results IS 'Stores extracted bloodwork test results with both raw and normalized names';
COMMENT ON COLUMN bloodwork_results.raw_test_name IS 'Original test name as extracted from document';
COMMENT ON COLUMN bloodwork_results.normalized_test_name IS 'Standardized test name after normalization';
COMMENT ON COLUMN bloodwork_results.category IS 'Category of the test (Cardiovascular, Metabolic, Hormonal, etc.)';
COMMENT ON COLUMN bloodwork_results.value_text IS 'Original value as text (preserves formatting)';
COMMENT ON COLUMN bloodwork_results.value_numeric IS 'Parsed numeric value for calculations';
COMMENT ON COLUMN bloodwork_results.confidence IS 'Confidence score of extraction (0-1)';
COMMENT ON COLUMN bloodwork_results.source IS 'Source of the result (extraction, manual, etc.)';
