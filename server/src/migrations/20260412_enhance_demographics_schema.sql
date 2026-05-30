-- Enhanced Demographics Schema for Phase 0-20
-- Purpose: Align demographic data collection with backend service requirements
-- Date: April 12, 2026

-- =====================================================
-- ENHANCE BASELINE PROFILE TABLE
-- =====================================================
-- Add missing demographic fields needed by engines

ALTER TABLE baseline_profile 
ADD COLUMN IF NOT EXISTS ethnicity VARCHAR(50),
ADD COLUMN IF NOT EXISTS race VARCHAR(50),
ADD COLUMN IF NOT EXISTS geographic_region VARCHAR(100),
ADD COLUMN IF NOT EXISTS occupation VARCHAR(100),
ADD COLUMN IF NOT EXISTS education_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS income_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS children_count INTEGER,
ADD COLUMN IF NOT EXISTS smoking_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS alcohol_consumption VARCHAR(50),
ADD COLUMN IF NOT EXISTS drug_use VARCHAR(50),
ADD COLUMN IF NOT EXISTS dietary_restrictions JSONB,
ADD COLUMN IF NOT EXISTS food_allergies JSONB,
ADD COLUMN IF NOT EXISTS sleep_environment VARCHAR(50),
ADD COLUMN IF NOT EXISTS work_schedule VARCHAR(50),
ADD COLUMN IF NOT EXISTS commute_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS physical_job_activity VARCHAR(50),
ADD COLUMN IF NOT EXISTS recreational_activities JSONB,
ADD COLUMN IF NOT EXISTS sun_exposure VARCHAR(50),
ADD COLUMN IF NOT EXISTS skin_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS hair_loss_pattern VARCHAR(50),
ADD COLUMN IF NOT EXISTS skin_conditions JSONB,
ADD COLUMN IF NOT EXISTS digestive_health VARCHAR(50),
ADD COLUMN IF NOT EXISTS cognitive_health VARCHAR(50),
ADD COLUMN IF NOT EXISTS mental_health_history JSONB,
ADD COLUMN IF NOT EXISTS preventive_care VARCHAR(50),
ADD COLUMN IF NOT EXISTS health_insurance VARCHAR(50),
ADD COLUMN IF NOT EXISTS primary_care_access VARCHAR(50),
ADD COLUMN IF NOT EXISTS emergency_contacts JSONB,
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(50),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS measurement_system VARCHAR(20) DEFAULT 'imperial';

-- Add constraints for new fields
ALTER TABLE baseline_profile 
ADD CONSTRAINT valid_ethnicity CHECK (ethnicity IN (
  'caucasian', 'african_american', 'hispanic', 'asian', 'native_american', 
  'pacific_islander', 'middle_eastern', 'mixed', 'other', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_race CHECK (race IN (
  'white', 'black', 'asian', 'native_american', 'pacific_islander', 'mixed', 'other'
)),
ADD CONSTRAINT valid_smoking_status CHECK (smoking_status IN (
  'never', 'former', 'current', 'occasional', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_alcohol_consumption CHECK (alcohol_consumption IN (
  'none', 'occasional', 'moderate', 'heavy', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_drug_use CHECK (drug_use IN (
  'none', 'marijuana', 'recreational', 'prescribed', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_marital_status CHECK (marital_status IN (
  'single', 'married', 'divorced', 'separated', 'widowed', 'domestic_partnership', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_education_level CHECK (education_level IN (
  'high_school', 'some_college', 'bachelors', 'masters', 'doctorate', 'professional', 'other', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_income_level CHECK (income_level IN (
  'low', 'lower_middle', 'middle', 'upper_middle', 'high', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_sleep_environment CHECK (sleep_environment IN (
  'dark_quiet', 'some_light', 'noisy', 'variable', 'shared', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_work_schedule CHECK (work_schedule IN (
  'regular_9_5', 'shifts', 'flexible', 'irregular', 'remote', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_commute_type CHECK (commute_type IN (
  'none', 'driving', 'public_transport', 'walking', 'cycling', 'mixed', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_physical_job_activity CHECK (physical_job_activity IN (
  'sedentary', 'light', 'moderate', 'heavy', 'very_heavy', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_sun_exposure CHECK (sun_exposure IN (
  'minimal', 'low', 'moderate', 'high', 'very_high', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_skin_type CHECK (skin_type IN (
  'type_i', 'type_ii', 'type_iii', 'type_iv', 'type_v', 'type_vi', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_hair_loss_pattern CHECK (hair_loss_pattern IN (
  'none', 'temporal_recession', 'vertex_thinning', 'diffuse_thinning', 'complete', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_digestive_health CHECK (digestive_health IN (
  'excellent', 'good', 'fair', 'poor', 'diagnosed_condition', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_cognitive_health CHECK (cognitive_health IN (
  'excellent', 'good', 'fair', 'poor', 'diagnosed_condition', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_preventive_care CHECK (preventive_care IN (
  'regular', 'occasional', 'rare', 'never', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_health_insurance CHECK (health_insurance IN (
  'private', 'medicare', 'medicaid', 'employer', 'none', 'other', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_primary_care_access CHECK (primary_care_access IN (
  'excellent', 'good', 'fair', 'poor', 'none', 'prefer_not_to_say'
)),
ADD CONSTRAINT valid_measurement_system CHECK (measurement_system IN (
  'imperial', 'metric', 'mixed'
)),
ADD CONSTRAINT valid_children_count CHECK (children_count >= 0 AND children_count <= 20);

-- =====================================================
-- CREATE DEMOGRAPHICS AUDIT TABLE
-- =====================================================
-- Track changes to demographic data for compliance and analytics

CREATE TABLE IF NOT EXISTS demographics_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- Change metadata
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    
    -- Context
    changed_by VARCHAR(50) DEFAULT 'user', -- 'user', 'agent', 'admin', 'system'
    change_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_demographics_audit_user ON demographics_audit_log(user_id);
CREATE INDEX idx_demographics_audit_date ON demographics_audit_log(created_at DESC);
CREATE INDEX idx_demographics_audit_field ON demographics_audit_log(field_name);

-- =====================================================
-- CREATE DEMOGRAPHICS VALIDATION RULES TABLE
-- =====================================================
-- Store validation rules for demographic fields

CREATE TABLE IF NOT EXISTS demographics_validation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_name VARCHAR(100) NOT NULL UNIQUE,
    
    -- Validation rules
    required BOOLEAN DEFAULT FALSE,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'date')),
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    min_length INTEGER,
    max_length INTEGER,
    allowed_values JSONB, -- Array of allowed values for enums
    regex_pattern TEXT,
    
    -- Display rules
    display_order INTEGER DEFAULT 0,
    field_group VARCHAR(50),
    field_label VARCHAR(200),
    help_text TEXT,
    sensitive_data BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_demographics_rules_field ON demographics_validation_rules(field_name);
CREATE INDEX idx_demographics_rules_group ON demographics_validation_rules(field_group);

-- =====================================================
-- CREATE DEMOGRAPHICS COLLECTION PROGRESS TABLE
-- =====================================================
-- Track completion status of demographic data collection

CREATE TABLE IF NOT EXISTS demographics_collection_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    
    -- Progress tracking
    total_fields INTEGER NOT NULL DEFAULT 0,
    completed_fields INTEGER NOT NULL DEFAULT 0,
    completion_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_fields > 0 THEN (completed_fields::DECIMAL / total_fields::DECIMAL) * 100
            ELSE 0
        END
    ) STORED,
    
    -- Collection status
    collection_status VARCHAR(20) NOT NULL DEFAULT 'not_started' 
        CHECK (collection_status IN ('not_started', 'in_progress', 'completed', 'verified')),
    
    -- Last activity
    last_updated_field VARCHAR(100),
    last_updated_at TIMESTAMPTZ,
    
    -- Quality indicators
    data_quality_score DECIMAL(5,2), -- 0-100 based on validation rules
    missing_required_fields JSONB, -- Array of required fields not yet provided
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_demographics_progress_user ON demographics_collection_progress(user_id);
CREATE INDEX idx_demographics_progress_status ON demographics_collection_progress(collection_status);

-- =====================================================
-- ENHANCED FUNCTIONS
-- =====================================================

-- Function to calculate demographic data quality score
CREATE OR REPLACE FUNCTION calculate_demographic_quality_score(p_user_id TEXT)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_fields INTEGER := 0;
    v_completed_fields INTEGER := 0;
    v_quality_score DECIMAL(5,2) := 0;
    v_profile RECORD;
    v_rule RECORD;
    v_field_value TEXT;
BEGIN
    -- Count total fields from validation rules
    SELECT COUNT(*) INTO v_total_fields
    FROM demographics_validation_rules
    WHERE is_active = TRUE;
    
    -- Get user profile
    SELECT * INTO v_profile
    FROM baseline_profile
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Check each field against validation rules
    FOR v_rule IN 
        SELECT * FROM demographics_validation_rules
        WHERE is_active = TRUE
    LOOP
        -- Get field value (simplified for common fields)
        CASE v_rule.field_name
            WHEN 'date_of_birth' THEN v_field_value := v_profile.date_of_birth::TEXT;
            WHEN 'age' THEN v_field_value := v_profile.age::TEXT;
            WHEN 'sex' THEN v_field_value := v_profile.sex;
            WHEN 'height_inches' THEN v_field_value := v_profile.height_inches::TEXT;
            WHEN 'weight_lbs' THEN v_field_value := v_profile.weight_lbs::TEXT;
            WHEN 'ethnicity' THEN v_field_value := v_profile.ethnicity;
            WHEN 'race' THEN v_field_value := v_profile.race;
            WHEN 'smoking_status' THEN v_field_value := v_profile.smoking_status;
            WHEN 'alcohol_consumption' THEN v_field_value := v_profile.alcohol_consumption;
            WHEN 'education_level' THEN v_field_value := v_profile.education_level;
            WHEN 'income_level' THEN v_field_value := v_profile.income_level;
            WHEN 'marital_status' THEN v_field_value := v_profile.marital_status;
            -- Add more field mappings as needed
            ELSE v_field_value := NULL;
        END CASE;
        
        -- Check if field is provided and valid
        IF v_field_value IS NOT NULL AND v_field_value != '' THEN
            -- Additional validation could be added here
            v_completed_fields := v_completed_fields + 1;
        END IF;
    END LOOP;
    
    -- Calculate quality score
    IF v_total_fields > 0 THEN
        v_quality_score := (v_completed_fields::DECIMAL / v_total_fields::DECIMAL) * 100;
    END IF;
    
    -- Update progress table
    INSERT INTO demographics_collection_progress (
        user_id, total_fields, completed_fields, collection_status, last_updated_at, data_quality_score
    ) VALUES (
        p_user_id, v_total_fields, v_completed_fields, 
        CASE WHEN v_quality_score >= 100 THEN 'completed' ELSE 'in_progress' END,
        NOW(), v_quality_score
    ) ON CONFLICT (user_id) DO UPDATE SET
        total_fields = EXCLUDED.total_fields,
        completed_fields = EXCLUDED.completed_fields,
        collection_status = EXCLUDED.collection_status,
        last_updated_at = EXCLUDED.last_updated_at,
        data_quality_score = EXCLUDED.data_quality_score;
    
    RETURN v_quality_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get demographic profile with all fields
CREATE OR REPLACE FUNCTION get_demographic_profile_complete(p_user_id TEXT)
RETURNS TABLE (
    -- Basic demographics
    user_id TEXT,
    date_of_birth DATE,
    age INTEGER,
    sex VARCHAR,
    height_inches DECIMAL,
    weight_lbs DECIMAL,
    body_fat_percent DECIMAL,
    
    -- Extended demographics
    ethnicity VARCHAR,
    race VARCHAR,
    geographic_region VARCHAR,
    occupation VARCHAR,
    education_level VARCHAR,
    income_level VARCHAR,
    marital_status VARCHAR,
    children_count INTEGER,
    
    -- Health behaviors
    smoking_status VARCHAR,
    alcohol_consumption VARCHAR,
    drug_use VARCHAR,
    dietary_restrictions JSONB,
    food_allergies JSONB,
    
    -- Environmental factors
    sleep_environment VARCHAR,
    work_schedule VARCHAR,
    commute_type VARCHAR,
    physical_job_activity VARCHAR,
    recreational_activities JSONB,
    sun_exposure VARCHAR,
    skin_type VARCHAR,
    
    -- Health conditions
    hair_loss_pattern VARCHAR,
    skin_conditions JSONB,
    digestive_health VARCHAR,
    cognitive_health VARCHAR,
    mental_health_history JSONB,
    
    -- Healthcare access
    preventive_care VARCHAR,
    health_insurance VARCHAR,
    primary_care_access VARCHAR,
    emergency_contacts JSONB,
    
    -- Preferences
    preferred_language VARCHAR,
    timezone VARCHAR,
    measurement_system VARCHAR,
    
    -- Metadata
    data_quality_score DECIMAL,
    completion_percentage DECIMAL,
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.user_id,
        bp.date_of_birth,
        bp.age,
        bp.sex,
        bp.height_inches,
        bp.weight_lbs,
        bp.body_fat_percent,
        
        bp.ethnicity,
        bp.race,
        bp.geographic_region,
        bp.occupation,
        bp.education_level,
        bp.income_level,
        bp.marital_status,
        bp.children_count,
        
        bp.smoking_status,
        bp.alcohol_consumption,
        bp.drug_use,
        bp.dietary_restrictions,
        bp.food_allergies,
        
        bp.sleep_environment,
        bp.work_schedule,
        bp.commute_type,
        bp.physical_job_activity,
        bp.recreational_activities,
        bp.sun_exposure,
        bp.skin_type,
        
        bp.hair_loss_pattern,
        bp.skin_conditions,
        bp.digestive_health,
        bp.cognitive_health,
        bp.mental_health_history,
        
        bp.preventive_care,
        bp.health_insurance,
        bp.primary_care_access,
        bp.emergency_contacts,
        
        bp.preferred_language,
        bp.timezone,
        bp.measurement_system,
        
        dcp.data_quality_score,
        dcp.completion_percentage,
        dcp.updated_at as last_updated
        
    FROM baseline_profile bp
    LEFT JOIN demographics_collection_progress dcp ON bp.user_id = dcp.user_id
    WHERE bp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to log demographic changes
CREATE OR REPLACE FUNCTION log_demographic_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log changes to key demographic fields
    IF TG_OP = 'UPDATE' THEN
        -- Check each field for changes and log them
        IF OLD.date_of_birth IS DISTINCT FROM NEW.date_of_birth THEN
            INSERT INTO demographics_audit_log (user_id, change_type, field_name, old_value, new_value)
            VALUES (NEW.user_id, 'update', 'date_of_birth', OLD.date_of_birth::TEXT, NEW.date_of_birth::TEXT);
        END IF;
        
        IF OLD.sex IS DISTINCT FROM NEW.sex THEN
            INSERT INTO demographics_audit_log (user_id, change_type, field_name, old_value, new_value)
            VALUES (NEW.user_id, 'update', 'sex', OLD.sex, NEW.sex);
        END IF;
        
        IF OLD.ethnicity IS DISTINCT FROM NEW.ethnicity THEN
            INSERT INTO demographics_audit_log (user_id, change_type, field_name, old_value, new_value)
            VALUES (NEW.user_id, 'update', 'ethnicity', OLD.ethnicity, NEW.ethnicity);
        END IF;
        
        -- Add more field checks as needed
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_demographic_changes
    AFTER UPDATE ON baseline_profile
    FOR EACH ROW
    EXECUTE FUNCTION log_demographic_changes();

-- Trigger to update quality score on profile changes
CREATE OR REPLACE FUNCTION update_demographic_quality_trigger()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_demographic_quality_score(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_demographic_quality
    AFTER INSERT OR UPDATE ON baseline_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_demographic_quality_trigger();

-- =====================================================
-- INITIAL VALIDATION RULES
-- =====================================================

-- Insert basic validation rules for demographic fields
INSERT INTO demographics_validation_rules (field_name, required, data_type, field_label, field_group, display_order) VALUES
    ('date_of_birth', TRUE, 'date', 'Date of Birth', 'basic_demographics', 1),
    ('age', FALSE, 'number', 'Age', 'basic_demographics', 2),
    ('sex', TRUE, 'string', 'Sex', 'basic_demographics', 3),
    ('height_inches', TRUE, 'number', 'Height (inches)', 'basic_demographics', 4),
    ('weight_lbs', TRUE, 'number', 'Weight (lbs)', 'basic_demographics', 5),
    ('ethnicity', FALSE, 'string', 'Ethnicity', 'extended_demographics', 10),
    ('race', FALSE, 'string', 'Race', 'extended_demographics', 11),
    ('education_level', FALSE, 'string', 'Education Level', 'socioeconomic', 20),
    ('income_level', FALSE, 'string', 'Income Level', 'socioeconomic', 21),
    ('occupation', FALSE, 'string', 'Occupation', 'socioeconomic', 22),
    ('marital_status', FALSE, 'string', 'Marital Status', 'social', 30),
    ('children_count', FALSE, 'number', 'Number of Children', 'social', 31),
    ('smoking_status', FALSE, 'string', 'Smoking Status', 'health_behaviors', 40),
    ('alcohol_consumption', FALSE, 'string', 'Alcohol Consumption', 'health_behaviors', 41),
    ('drug_use', FALSE, 'string', 'Drug Use', 'health_behaviors', 42)
ON CONFLICT (field_name) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE baseline_profile IS 'Enhanced with comprehensive demographic fields for Phase 0-20';
COMMENT ON TABLE demographics_audit_log IS 'Audit trail for demographic data changes';
COMMENT ON TABLE demographics_validation_rules IS 'Validation rules and display configuration for demographic fields';
COMMENT ON TABLE demographics_collection_progress IS 'Track completion status and quality of demographic data collection';

COMMENT ON FUNCTION calculate_demographic_quality_score IS 'Calculate data quality score based on completion and validation';
COMMENT ON FUNCTION get_demographic_profile_complete IS 'Get complete demographic profile with quality metrics';
COMMENT ON FUNCTION log_demographic_changes IS 'Log changes to demographic fields for audit trail';

-- =====================================================
-- MIGRATION NOTES
-- =====================================================
-- This migration enhances the baseline_profile table with comprehensive demographic fields
-- New fields support: ethnicity, race, socioeconomic status, health behaviors, environmental factors
-- Added audit logging, validation rules, and progress tracking
-- Existing services will continue to work with backward compatibility
-- New demographic service layer will utilize these enhanced capabilities
