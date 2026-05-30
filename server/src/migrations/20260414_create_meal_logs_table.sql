-- Migration: Create meal_logs table
-- Date: 2026-04-14
-- Purpose: Persist meal logging data from MealLogScreen

CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  photo_uri TEXT NOT NULL,
  meal_label TEXT CHECK (meal_label IN ('breakfast', 'lunch', 'dinner', 'snack')),
  taken_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  ai_status TEXT NOT NULL DEFAULT 'pending' CHECK (ai_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX idx_meal_logs_user_taken_at ON meal_logs(user_id, taken_at DESC);
CREATE INDEX idx_meal_logs_created_at ON meal_logs(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_meal_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meal_logs_updated_at
  BEFORE UPDATE ON meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_meal_logs_updated_at();

-- Enable Row Level Security
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (assuming auth.uid() for authenticated users)
CREATE POLICY "Users can view own meal logs" ON meal_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own meal logs" ON meal_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own meal logs" ON meal_logs
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own meal logs" ON meal_logs
  FOR DELETE USING (auth.uid()::text = user_id);

-- Comments
COMMENT ON TABLE meal_logs IS 'Stores meal logging entries with photos and metadata from MealLogScreen';
COMMENT ON COLUMN meal_logs.ai_status IS 'Status of AI processing for the meal photo';
COMMENT ON COLUMN meal_logs.meal_label IS 'User-selected meal type: breakfast, lunch, dinner, or snack';
