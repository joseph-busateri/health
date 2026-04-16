-- Migration: Create nutrition_extractions table
-- Date: 2026-04-14
-- Purpose: Persist nutrition extraction data from NutritionExtractionScreen

CREATE TABLE IF NOT EXISTS nutrition_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  photo_uri TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Extracted nutrition data
  extracted_foods TEXT[],
  calories NUMERIC(7,2),
  protein_g NUMERIC(6,2),
  carbs_g NUMERIC(6,2),
  fat_g NUMERIC(6,2),
  fiber_g NUMERIC(6,2),
  
  -- AI metadata
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  ai_model TEXT,
  processing_time_ms INTEGER,
  
  -- Status tracking
  extraction_status TEXT NOT NULL DEFAULT 'completed' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_nutrition_extractions_user_id ON nutrition_extractions(user_id);
CREATE INDEX idx_nutrition_extractions_user_timestamp ON nutrition_extractions(user_id, timestamp DESC);
CREATE INDEX idx_nutrition_extractions_created_at ON nutrition_extractions(created_at DESC);
CREATE INDEX idx_nutrition_extractions_status ON nutrition_extractions(extraction_status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_nutrition_extractions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nutrition_extractions_updated_at
  BEFORE UPDATE ON nutrition_extractions
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_extractions_updated_at();

-- Enable Row Level Security
ALTER TABLE nutrition_extractions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own nutrition extractions" ON nutrition_extractions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own nutrition extractions" ON nutrition_extractions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own nutrition extractions" ON nutrition_extractions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own nutrition extractions" ON nutrition_extractions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Comments
COMMENT ON TABLE nutrition_extractions IS 'Stores AI-extracted nutrition data from food photos via NutritionExtractionScreen';
COMMENT ON COLUMN nutrition_extractions.extracted_foods IS 'Array of food items identified in the photo';
COMMENT ON COLUMN nutrition_extractions.confidence IS 'AI confidence score between 0 and 1';
COMMENT ON COLUMN nutrition_extractions.extraction_status IS 'Status of the extraction process';
