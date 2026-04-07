-- Baseline Profile & Preferences Schema
-- Production-safe migration for foundational user data
-- Date: April 6, 2026

-- =====================================================
-- BASELINE PROFILE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS baseline_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Demographics
    date_of_birth DATE,
    age INTEGER, -- Calculated or entered
    sex VARCHAR(20), -- 'male', 'female', 'other'
    height_inches DECIMAL(5,2),
    weight_lbs DECIMAL(6,2),
    body_fat_percent DECIMAL(5,2),
    
    -- Training Background
    training_experience_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'elite'
    training_years INTEGER,
    activity_level VARCHAR(50), -- 'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'
    primary_sport VARCHAR(100),
    
    -- Medical Context
    conditions JSONB, -- Array of medical conditions
    medications JSONB, -- Array of medications
    allergies JSONB, -- Array of allergies
    injuries JSONB, -- Array of past injuries
    surgeries JSONB, -- Array of past surgeries
    family_history JSONB, -- Cardiovascular, diabetes, etc.
    
    -- Health Status
    trt_usage BOOLEAN DEFAULT FALSE,
    diabetes_status VARCHAR(50), -- 'none', 'prediabetic', 'type1', 'type2'
    blood_pressure_history VARCHAR(50), -- 'normal', 'elevated', 'hypertension_stage1', 'hypertension_stage2'
    
    -- Lifestyle
    sleep_target_hours DECIMAL(3,1),
    training_days_per_week INTEGER,
    travel_frequency VARCHAR(50), -- 'never', 'rarely', 'monthly', 'weekly', 'daily'
    stress_environment VARCHAR(50), -- 'low', 'moderate', 'high', 'very_high'
    
    -- Baseline Targets (for engines that need defaults)
    baseline_calories INTEGER,
    baseline_protein_g INTEGER,
    baseline_carbs_g INTEGER,
    baseline_fats_g INTEGER,
    baseline_hydration_oz INTEGER,
    
    -- Metadata
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'import', 'onboarding'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_sex CHECK (sex IN ('male', 'female', 'other')),
    CONSTRAINT valid_age CHECK (age >= 0 AND age <= 120),
    CONSTRAINT valid_height CHECK (height_inches > 0 AND height_inches < 120),
    CONSTRAINT valid_weight CHECK (weight_lbs > 0 AND weight_lbs < 1000),
    CONSTRAINT valid_body_fat CHECK (body_fat_percent >= 0 AND body_fat_percent <= 100)
);

CREATE INDEX idx_baseline_profile_user ON baseline_profile(user_id);
CREATE INDEX idx_baseline_profile_created ON baseline_profile(created_at);

-- =====================================================
-- USER PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Training Preferences
    preferred_training_days JSONB, -- ['monday', 'wednesday', 'friday']
    preferred_training_time VARCHAR(50), -- 'morning', 'afternoon', 'evening'
    preferred_workout_duration INTEGER, -- minutes
    preferred_training_style VARCHAR(100), -- 'powerlifting', 'bodybuilding', 'crossfit', 'general_fitness'
    
    -- Sleep Preferences
    preferred_sleep_window JSONB, -- {start: '22:00', end: '06:00'}
    
    -- Nutrition Preferences
    nutrition_preferences JSONB, -- {diet_type: 'flexible', restrictions: [], preferences: []}
    meal_timing_preference VARCHAR(50), -- 'intermittent_fasting', 'regular', 'frequent_small_meals'
    
    -- Supplement Preferences
    supplement_preferences JSONB, -- {brands: [], forms: [], timing: []}
    
    -- Risk & Optimization
    risk_tolerance VARCHAR(50), -- 'conservative', 'moderate', 'aggressive'
    optimization_priority VARCHAR(50), -- 'health', 'performance', 'aesthetics', 'longevity'
    aggressiveness_level VARCHAR(50), -- 'maintenance', 'moderate', 'aggressive', 'extreme'
    
    -- Communication Preferences
    notification_preferences JSONB,
    reminder_preferences JSONB,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_risk_tolerance CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    CONSTRAINT valid_aggressiveness CHECK (aggressiveness_level IN ('maintenance', 'moderate', 'aggressive', 'extreme'))
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age_from_dob(dob DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get complete baseline profile with calculated fields
CREATE OR REPLACE FUNCTION get_baseline_profile_complete(p_user_id VARCHAR)
RETURNS TABLE (
    user_id VARCHAR,
    age INTEGER,
    sex VARCHAR,
    height_inches DECIMAL,
    weight_lbs DECIMAL,
    body_fat_percent DECIMAL,
    training_experience_level VARCHAR,
    activity_level VARCHAR,
    trt_usage BOOLEAN,
    diabetes_status VARCHAR,
    sleep_target_hours DECIMAL,
    baseline_calories INTEGER,
    baseline_protein_g INTEGER,
    baseline_carbs_g INTEGER,
    baseline_fats_g INTEGER,
    conditions JSONB,
    medications JSONB,
    family_history JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.user_id,
        COALESCE(bp.age, calculate_age_from_dob(bp.date_of_birth)) as age,
        bp.sex,
        bp.height_inches,
        bp.weight_lbs,
        bp.body_fat_percent,
        bp.training_experience_level,
        bp.activity_level,
        bp.trt_usage,
        bp.diabetes_status,
        bp.sleep_target_hours,
        bp.baseline_calories,
        bp.baseline_protein_g,
        bp.baseline_carbs_g,
        bp.baseline_fats_g,
        bp.conditions,
        bp.medications,
        bp.family_history
    FROM baseline_profile bp
    WHERE bp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_baseline_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_baseline_profile_timestamp
    BEFORE UPDATE ON baseline_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_baseline_timestamp();

CREATE TRIGGER trigger_update_user_preferences_timestamp
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_baseline_timestamp();

-- Auto-calculate age from date_of_birth
CREATE OR REPLACE FUNCTION auto_calculate_age()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.date_of_birth IS NOT NULL THEN
        NEW.age := calculate_age_from_dob(NEW.date_of_birth);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_age
    BEFORE INSERT OR UPDATE OF date_of_birth ON baseline_profile
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_age();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE baseline_profile IS 'User demographic, medical, and baseline health profile';
COMMENT ON TABLE user_preferences IS 'User preferences for training, nutrition, and optimization';
COMMENT ON COLUMN baseline_profile.conditions IS 'JSONB array of medical conditions';
COMMENT ON COLUMN baseline_profile.medications IS 'JSONB array of current medications';
COMMENT ON COLUMN baseline_profile.family_history IS 'JSONB object with family health history';
COMMENT ON COLUMN user_preferences.preferred_training_days IS 'JSONB array of preferred training days';
COMMENT ON COLUMN user_preferences.nutrition_preferences IS 'JSONB object with diet preferences and restrictions';
COMMENT ON FUNCTION get_baseline_profile_complete IS 'Get complete baseline profile with calculated age';

-- =====================================================
-- MIGRATION NOTES
-- =====================================================
-- This schema extends the existing system without breaking changes
-- Existing baselineConfigService.ts will continue to work
-- New baselineProfileService.ts will use these tables
-- Engines will be updated to use baseline_profile with fallbacks
