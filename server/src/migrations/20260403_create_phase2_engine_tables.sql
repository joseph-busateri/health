-- Migration: Create Phase 2 Engine Record Tables
-- Date: 2026-04-03
-- Purpose: Create tables for storing Nutrition, Cardiovascular, Metabolic, and Sexual Health engine records

-- ============================================================================
-- NUTRITION RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Scores
  nutrition_score INTEGER NOT NULL CHECK (nutrition_score >= 0 AND nutrition_score <= 100),
  nutrition_status TEXT NOT NULL CHECK (nutrition_status IN ('optimal', 'adequate', 'suboptimal', 'deficient')),
  
  -- Calorie targets
  calorie_targets JSONB NOT NULL,
  -- Expected structure: { maintenance: number, currentGoal: number, deficit?: number, surplus?: number }
  
  -- Macro targets
  macro_targets JSONB NOT NULL,
  -- Expected structure: { protein: number, carbs: number, fats: number, fiber: number }
  
  -- Metrics
  protein_adequacy INTEGER NOT NULL CHECK (protein_adequacy >= 0 AND protein_adequacy <= 100),
  hydration_score INTEGER NOT NULL CHECK (hydration_score >= 0 AND hydration_score <= 100),
  hydration_level TEXT NOT NULL CHECK (hydration_level IN ('well_hydrated', 'adequate', 'mild_dehydration', 'dehydrated')),
  metabolic_support_score INTEGER NOT NULL CHECK (metabolic_support_score >= 0 AND metabolic_support_score <= 100),
  
  -- Source inputs
  inputs JSONB NOT NULL,
  -- Expected structure: { weight?: number, bodyFat?: number, activityLevel?: string, goal?: string, proteinIntake?: number, hydrationOunces?: number }
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, date)
);

-- Indexes for nutrition_records
CREATE INDEX idx_nutrition_records_user_date ON nutrition_records(user_id, date DESC);
CREATE INDEX idx_nutrition_records_user_created ON nutrition_records(user_id, created_at DESC);

-- ============================================================================
-- CARDIOVASCULAR RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cardiovascular_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Risk assessment
  cardiovascular_risk_score INTEGER NOT NULL CHECK (cardiovascular_risk_score >= 0 AND cardiovascular_risk_score <= 100),
  cardiovascular_risk_level TEXT NOT NULL CHECK (cardiovascular_risk_level IN ('low', 'moderate', 'elevated', 'high')),
  
  -- Resting HR analysis
  resting_hr_analysis JSONB NOT NULL,
  -- Expected structure: { restingHR?: number, hrStatus: string, hrTrend?: string }
  
  -- Blood pressure analysis
  bp_analysis JSONB NOT NULL,
  -- Expected structure: { systolic?: number, diastolic?: number, bpRisk: string, hypertensionRisk: boolean }
  
  -- HRV signal
  hrv_cardiovascular_signal INTEGER,
  
  -- Lipid panel
  lipid_panel JSONB,
  -- Expected structure: { totalCholesterol?: number, ldl?: number, hdl?: number, triglycerides?: number, cholesterolRatio?: number }
  
  -- Source inputs
  inputs JSONB NOT NULL,
  -- Expected structure: { restingHR?: number, hrv?: number, systolicBP?: number, diastolicBP?: number, lipidPanel?: object, age?: number, smokingStatus?: boolean }
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, date)
);

-- Indexes for cardiovascular_records
CREATE INDEX idx_cardiovascular_records_user_date ON cardiovascular_records(user_id, date DESC);
CREATE INDEX idx_cardiovascular_records_user_created ON cardiovascular_records(user_id, created_at DESC);
CREATE INDEX idx_cardiovascular_records_risk_level ON cardiovascular_records(cardiovascular_risk_level);

-- ============================================================================
-- METABOLIC RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS metabolic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Scores
  metabolic_score INTEGER NOT NULL CHECK (metabolic_score >= 0 AND metabolic_score <= 100),
  metabolic_status TEXT NOT NULL CHECK (metabolic_status IN ('optimal', 'healthy', 'at_risk', 'impaired')),
  metabolic_risk TEXT NOT NULL CHECK (metabolic_risk IN ('low', 'moderate', 'high', 'very_high')),
  
  -- Glucose metrics
  glucose_metrics JSONB NOT NULL,
  -- Expected structure: { fastingGlucose?: number, a1c?: number, glucoseStatus: string }
  
  -- Insulin metrics
  insulin_metrics JSONB NOT NULL,
  -- Expected structure: { insulinSensitivity: string, estimatedHOMAIR?: number }
  
  -- Source inputs
  inputs JSONB NOT NULL,
  -- Expected structure: { fastingGlucose?: number, a1c?: number, fastingInsulin?: number, weight?: number, bodyFat?: number, waistCircumference?: number, activityLevel?: string }
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, date)
);

-- Indexes for metabolic_records
CREATE INDEX idx_metabolic_records_user_date ON metabolic_records(user_id, date DESC);
CREATE INDEX idx_metabolic_records_user_created ON metabolic_records(user_id, created_at DESC);
CREATE INDEX idx_metabolic_records_risk ON metabolic_records(metabolic_risk);
CREATE INDEX idx_metabolic_records_status ON metabolic_records(metabolic_status);

-- ============================================================================
-- SEXUAL HEALTH RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sexual_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Scores
  sexual_health_score INTEGER NOT NULL CHECK (sexual_health_score >= 0 AND sexual_health_score <= 100),
  sexual_health_status TEXT NOT NULL CHECK (sexual_health_status IN ('optimal', 'healthy', 'suboptimal', 'concerning')),
  hormonal_risk TEXT NOT NULL CHECK (hormonal_risk IN ('low', 'moderate', 'high')),
  
  -- Testosterone metrics
  testosterone_metrics JSONB NOT NULL,
  -- Expected structure: { totalTestosterone?: number, freeTestosterone?: number, testosteroneStatus: string }
  
  -- Libido metrics
  libido_metrics JSONB NOT NULL,
  -- Expected structure: { libidoLevel: string, libidoScore: number, libidoTrend?: string }
  
  -- Erectile metrics
  erectile_metrics JSONB NOT NULL,
  -- Expected structure: { erectilePerformance: string, erectileScore: number, morningErections?: string }
  
  -- Source inputs
  inputs JSONB NOT NULL,
  -- Expected structure: { totalTestosterone?: number, freeTestosterone?: number, libidoSelfRating?: number, erectileFunctionRating?: number, morningErectionsFrequency?: number, age?: number, stressLevel?: number, sleepQuality?: number }
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, date)
);

-- Indexes for sexual_health_records
CREATE INDEX idx_sexual_health_records_user_date ON sexual_health_records(user_id, date DESC);
CREATE INDEX idx_sexual_health_records_user_created ON sexual_health_records(user_id, created_at DESC);
CREATE INDEX idx_sexual_health_records_hormonal_risk ON sexual_health_records(hormonal_risk);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Nutrition records trigger
CREATE OR REPLACE FUNCTION update_nutrition_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nutrition_records_updated_at
  BEFORE UPDATE ON nutrition_records
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_records_updated_at();

-- Cardiovascular records trigger
CREATE OR REPLACE FUNCTION update_cardiovascular_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cardiovascular_records_updated_at
  BEFORE UPDATE ON cardiovascular_records
  FOR EACH ROW
  EXECUTE FUNCTION update_cardiovascular_records_updated_at();

-- Metabolic records trigger
CREATE OR REPLACE FUNCTION update_metabolic_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER metabolic_records_updated_at
  BEFORE UPDATE ON metabolic_records
  FOR EACH ROW
  EXECUTE FUNCTION update_metabolic_records_updated_at();

-- Sexual health records trigger
CREATE OR REPLACE FUNCTION update_sexual_health_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sexual_health_records_updated_at
  BEFORE UPDATE ON sexual_health_records
  FOR EACH ROW
  EXECUTE FUNCTION update_sexual_health_records_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE nutrition_records IS 'Stores daily nutrition engine calculations including calorie/macro targets and adherence metrics';
COMMENT ON TABLE cardiovascular_records IS 'Stores daily cardiovascular risk assessments including HR, BP, HRV, and lipid analysis';
COMMENT ON TABLE metabolic_records IS 'Stores daily metabolic health assessments including glucose, insulin sensitivity, and metabolic risk';
COMMENT ON TABLE sexual_health_records IS 'Stores daily sexual health assessments including testosterone, libido, and erectile function metrics';
