-- Migration: Add AI-enriched fields to recommendations table
-- Date: 2026-04-03
-- Purpose: Support AI-enriched recommendation metadata

-- Add AI-enriched fields to recommendations table
ALTER TABLE recommendations
ADD COLUMN IF NOT EXISTS reason_codes TEXT[], -- Array of reason codes
ADD COLUMN IF NOT EXISTS recommendation_group TEXT, -- Group/category
ADD COLUMN IF NOT EXISTS supporting_metrics JSONB, -- Array of supporting metrics
ADD COLUMN IF NOT EXISTS is_insight_only BOOLEAN DEFAULT false, -- Informational only
ADD COLUMN IF NOT EXISTS requires_user_decision BOOLEAN DEFAULT false; -- Requires explicit user action

-- Add indexes for filtering and querying
CREATE INDEX IF NOT EXISTS idx_recommendations_reason_codes ON recommendations USING GIN (reason_codes);
CREATE INDEX IF NOT EXISTS idx_recommendations_recommendation_group ON recommendations (recommendation_group);
CREATE INDEX IF NOT EXISTS idx_recommendations_is_insight_only ON recommendations (is_insight_only);
CREATE INDEX IF NOT EXISTS idx_recommendations_requires_user_decision ON recommendations (requires_user_decision);

-- Add comments
COMMENT ON COLUMN recommendations.reason_codes IS 'Structured reason codes for filtering and grouping (e.g., low_hrv, insufficient_sleep)';
COMMENT ON COLUMN recommendations.recommendation_group IS 'Group/category for organization (e.g., recovery_optimization, stress_management)';
COMMENT ON COLUMN recommendations.supporting_metrics IS 'Array of metrics to display in UI with name, value, status, change, target, unit';
COMMENT ON COLUMN recommendations.is_insight_only IS 'True if this is informational only, not actionable';
COMMENT ON COLUMN recommendations.requires_user_decision IS 'True if user must explicitly accept or reject this recommendation';
