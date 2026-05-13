-- Body Composition Schema Migration
-- Purpose: Support smart scale data (InBody, etc.) with comprehensive body composition tracking
-- Features: Multi-source support, trend tracking, segmental analysis, version history

-- ============================================================================
-- 1. BODY COMPOSITION SCANS TABLE
-- ============================================================================
-- Stores individual body composition scan results

CREATE TABLE IF NOT EXISTS body_composition_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- Scan metadata
    scan_date DATE NOT NULL,
    scan_time TIME,
    scan_source TEXT NOT NULL, -- 'inbody_s2', 'inbody_570', 'dexa', 'manual', 'other_scale'
    scan_id TEXT, -- External scan ID if provided
    
    -- User demographics at time of scan
    height_inches DECIMAL(5,2),
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    
    -- Core measurements (in pounds)
    weight_lb DECIMAL(6,2) NOT NULL,
    
    -- Body composition breakdown (in pounds)
    total_body_water_lb DECIMAL(6,2),
    dry_lean_mass_lb DECIMAL(6,2),
    body_fat_mass_lb DECIMAL(6,2),
    
    -- Percentages
    body_fat_percentage DECIMAL(5,2),
    lean_body_mass_percentage DECIMAL(5,2),
    body_water_percentage DECIMAL(5,2),
    
    -- Muscle mass
    skeletal_muscle_mass_lb DECIMAL(6,2),
    skeletal_muscle_mass_percentage DECIMAL(5,2),
    
    -- Fat distribution
    visceral_fat_level INTEGER,
    visceral_fat_area_cm2 DECIMAL(6,2),
    subcutaneous_fat_percentage DECIMAL(5,2),
    
    -- Bone and protein
    bone_mineral_content_lb DECIMAL(5,2),
    protein_mass_lb DECIMAL(5,2),
    protein_percentage DECIMAL(5,2),
    
    -- Metabolic metrics
    basal_metabolic_rate_kcal INTEGER,
    total_energy_expenditure_kcal INTEGER,
    
    -- Body metrics
    bmi DECIMAL(5,2),
    body_mass_index_category TEXT,
    metabolic_age INTEGER,
    body_type TEXT, -- 'athletic', 'standard', 'obese', etc.
    
    -- Segmental analysis (arms, legs, trunk) - in pounds
    right_arm_muscle_lb DECIMAL(5,2),
    left_arm_muscle_lb DECIMAL(5,2),
    trunk_muscle_lb DECIMAL(5,2),
    right_leg_muscle_lb DECIMAL(5,2),
    left_leg_muscle_lb DECIMAL(5,2),
    
    right_arm_fat_lb DECIMAL(5,2),
    left_arm_fat_lb DECIMAL(5,2),
    trunk_fat_lb DECIMAL(5,2),
    right_leg_fat_lb DECIMAL(5,2),
    left_leg_fat_lb DECIMAL(5,2),
    
    -- Segmental lean mass percentages
    right_arm_lean_percentage DECIMAL(5,2),
    left_arm_lean_percentage DECIMAL(5,2),
    trunk_lean_percentage DECIMAL(5,2),
    right_leg_lean_percentage DECIMAL(5,2),
    left_leg_lean_percentage DECIMAL(5,2),
    
    -- Body balance
    muscle_balance_score DECIMAL(5,2), -- Left vs right balance
    upper_lower_balance_score DECIMAL(5,2), -- Upper vs lower body balance
    
    -- Health scores and ratings
    overall_health_score INTEGER,
    muscle_fat_analysis_rating TEXT, -- 'excellent', 'good', 'normal', 'weak', 'very_weak'
    obesity_degree INTEGER, -- 0-4 scale
    
    -- Intracellular/Extracellular water (advanced metrics)
    intracellular_water_lb DECIMAL(6,2),
    extracellular_water_lb DECIMAL(6,2),
    ecw_icw_ratio DECIMAL(5,3), -- Edema indicator
    
    -- Phase angle (cellular health indicator)
    phase_angle_degrees DECIMAL(4,2),
    
    -- Document reference
    document_id UUID, -- Links to uploaded scan image/PDF
    
    -- Quality and notes
    scan_quality TEXT CHECK (scan_quality IN ('excellent', 'good', 'fair', 'poor')),
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_body_comp_user_date ON body_composition_scans(user_id, scan_date DESC);
CREATE INDEX idx_body_comp_source ON body_composition_scans(user_id, scan_source);
CREATE INDEX idx_body_comp_document ON body_composition_scans(document_id);

-- ============================================================================
-- 2. BODY COMPOSITION DOCUMENTS TABLE
-- ============================================================================
-- Stores uploaded scan images/PDFs

CREATE TABLE IF NOT EXISTS body_composition_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- Document info
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    
    -- Processing status
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    
    -- Extracted data
    extracted_text TEXT,
    parsed_scan_data JSONB,
    
    -- Detected scan source
    detected_source TEXT, -- 'inbody_s2', 'inbody_570', 'dexa', etc.
    
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_body_comp_docs_user ON body_composition_documents(user_id);
CREATE INDEX idx_body_comp_docs_status ON body_composition_documents(user_id, processing_status);

-- ============================================================================
-- 3. BODY COMPOSITION GOALS TABLE
-- ============================================================================
-- User-defined or agent-recommended body composition goals

CREATE TABLE IF NOT EXISTS body_composition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- Goal metadata
    goal_name TEXT NOT NULL,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('weight_loss', 'muscle_gain', 'fat_loss', 'recomp', 'maintenance')),
    created_by TEXT NOT NULL CHECK (created_by IN ('user', 'agent')),
    
    -- Target metrics
    target_weight_lb DECIMAL(6,2),
    target_body_fat_percentage DECIMAL(5,2),
    target_lean_mass_lb DECIMAL(6,2),
    target_skeletal_muscle_lb DECIMAL(6,2),
    target_visceral_fat_level INTEGER,
    
    -- Timeline
    target_date DATE,
    weekly_rate_of_change DECIMAL(5,2), -- lbs per week
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
    
    -- Progress tracking
    starting_scan_id UUID REFERENCES body_composition_scans(id),
    current_progress_percentage DECIMAL(5,2),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_body_comp_goals_user ON body_composition_goals(user_id);
CREATE INDEX idx_body_comp_goals_status ON body_composition_goals(user_id, status);

-- ============================================================================
-- 4. BODY COMPOSITION TRENDS VIEW
-- ============================================================================
-- Aggregated trends for easy querying

CREATE OR REPLACE VIEW body_composition_trends AS
SELECT 
    user_id,
    scan_date,
    weight_lb,
    body_fat_percentage,
    body_fat_mass_lb,
    lean_body_mass_percentage,
    dry_lean_mass_lb,
    skeletal_muscle_mass_lb,
    visceral_fat_level,
    bmi,
    basal_metabolic_rate_kcal,
    
    -- Calculate changes from previous scan
    LAG(weight_lb) OVER (PARTITION BY user_id ORDER BY scan_date) AS previous_weight_lb,
    weight_lb - LAG(weight_lb) OVER (PARTITION BY user_id ORDER BY scan_date) AS weight_change_lb,
    
    LAG(body_fat_percentage) OVER (PARTITION BY user_id ORDER BY scan_date) AS previous_body_fat_percentage,
    body_fat_percentage - LAG(body_fat_percentage) OVER (PARTITION BY user_id ORDER BY scan_date) AS body_fat_change_percentage,
    
    LAG(skeletal_muscle_mass_lb) OVER (PARTITION BY user_id ORDER BY scan_date) AS previous_muscle_mass_lb,
    skeletal_muscle_mass_lb - LAG(skeletal_muscle_mass_lb) OVER (PARTITION BY user_id ORDER BY scan_date) AS muscle_change_lb,
    
    -- Days since last scan
    scan_date - LAG(scan_date) OVER (PARTITION BY user_id ORDER BY scan_date) AS days_since_last_scan
    
FROM body_composition_scans
ORDER BY user_id, scan_date DESC;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get latest body composition scan for user
CREATE OR REPLACE FUNCTION get_latest_body_composition(p_user_id TEXT)
RETURNS TABLE (
    scan_id UUID,
    scan_date DATE,
    weight_lb DECIMAL(6,2),
    body_fat_percentage DECIMAL(5,2),
    lean_mass_lb DECIMAL(6,2),
    muscle_mass_lb DECIMAL(6,2),
    visceral_fat_level INTEGER,
    bmi DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bcs.id,
        bcs.scan_date,
        bcs.weight_lb,
        bcs.body_fat_percentage,
        bcs.dry_lean_mass_lb,
        bcs.skeletal_muscle_mass_lb,
        bcs.visceral_fat_level,
        bcs.bmi
    FROM body_composition_scans bcs
    WHERE bcs.user_id = p_user_id
    ORDER BY bcs.scan_date DESC, bcs.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate body composition progress toward goal
CREATE OR REPLACE FUNCTION calculate_body_comp_progress(p_goal_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_goal RECORD;
    v_starting_scan RECORD;
    v_latest_scan RECORD;
    v_progress DECIMAL(5,2);
BEGIN
    -- Get goal details
    SELECT * INTO v_goal
    FROM body_composition_goals
    WHERE id = p_goal_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Get starting scan
    SELECT * INTO v_starting_scan
    FROM body_composition_scans
    WHERE id = v_goal.starting_scan_id;
    
    -- Get latest scan
    SELECT * INTO v_latest_scan
    FROM body_composition_scans
    WHERE user_id = v_goal.user_id
    ORDER BY scan_date DESC, created_at DESC
    LIMIT 1;
    
    -- Calculate progress based on goal type
    IF v_goal.goal_type = 'weight_loss' THEN
        v_progress := ((v_starting_scan.weight_lb - v_latest_scan.weight_lb) / 
                      (v_starting_scan.weight_lb - v_goal.target_weight_lb)) * 100;
    ELSIF v_goal.goal_type = 'fat_loss' THEN
        v_progress := ((v_starting_scan.body_fat_percentage - v_latest_scan.body_fat_percentage) / 
                      (v_starting_scan.body_fat_percentage - v_goal.target_body_fat_percentage)) * 100;
    ELSIF v_goal.goal_type = 'muscle_gain' THEN
        v_progress := ((v_latest_scan.skeletal_muscle_mass_lb - v_starting_scan.skeletal_muscle_mass_lb) / 
                      (v_goal.target_skeletal_muscle_lb - v_starting_scan.skeletal_muscle_mass_lb)) * 100;
    ELSE
        v_progress := 0;
    END IF;
    
    RETURN ROUND(LEAST(v_progress, 100), 2);
END;
$$ LANGUAGE plpgsql;

-- Function to detect body composition anomalies
CREATE OR REPLACE FUNCTION detect_body_comp_anomalies(p_user_id TEXT, p_scan_id UUID)
RETURNS TABLE (
    anomaly_type TEXT,
    severity TEXT,
    description TEXT,
    recommendation TEXT
) AS $$
DECLARE
    v_scan RECORD;
    v_previous_scan RECORD;
BEGIN
    -- Get current scan
    SELECT * INTO v_scan
    FROM body_composition_scans
    WHERE id = p_scan_id;
    
    -- Get previous scan
    SELECT * INTO v_previous_scan
    FROM body_composition_scans
    WHERE user_id = p_user_id
    AND scan_date < v_scan.scan_date
    ORDER BY scan_date DESC
    LIMIT 1;
    
    -- Check for rapid weight loss (>2% per week)
    IF v_previous_scan.weight_lb IS NOT NULL THEN
        IF (v_previous_scan.weight_lb - v_scan.weight_lb) / v_previous_scan.weight_lb > 0.02 THEN
            RETURN QUERY SELECT 
                'rapid_weight_loss'::TEXT,
                'moderate'::TEXT,
                'Weight decreased by more than 2% since last scan'::TEXT,
                'Consider reviewing caloric intake and training intensity'::TEXT;
        END IF;
    END IF;
    
    -- Check for high visceral fat
    IF v_scan.visceral_fat_level > 15 THEN
        RETURN QUERY SELECT 
            'high_visceral_fat'::TEXT,
            'high'::TEXT,
            'Visceral fat level is elevated (>15)'::TEXT,
            'Focus on cardiovascular exercise and dietary improvements'::TEXT;
    END IF;
    
    -- Check for low muscle mass relative to weight
    IF v_scan.skeletal_muscle_mass_percentage < 35 THEN
        RETURN QUERY SELECT 
            'low_muscle_mass'::TEXT,
            'moderate'::TEXT,
            'Skeletal muscle mass percentage is below optimal range'::TEXT,
            'Consider increasing resistance training and protein intake'::TEXT;
    END IF;
    
    -- Check for high body fat percentage
    IF v_scan.gender = 'male' AND v_scan.body_fat_percentage > 25 THEN
        RETURN QUERY SELECT 
            'high_body_fat'::TEXT,
            'moderate'::TEXT,
            'Body fat percentage is above healthy range for males'::TEXT,
            'Consider caloric deficit and increased activity'::TEXT;
    ELSIF v_scan.gender = 'female' AND v_scan.body_fat_percentage > 32 THEN
        RETURN QUERY SELECT 
            'high_body_fat'::TEXT,
            'moderate'::TEXT,
            'Body fat percentage is above healthy range for females'::TEXT,
            'Consider caloric deficit and increased activity'::TEXT;
    END IF;
    
    -- Check for water retention (high ECW/ICW ratio)
    IF v_scan.ecw_icw_ratio > 0.40 THEN
        RETURN QUERY SELECT 
            'water_retention'::TEXT,
            'moderate'::TEXT,
            'Extracellular water ratio is elevated, indicating possible edema'::TEXT,
            'Monitor sodium intake and consider medical evaluation if persistent'::TEXT;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_body_comp_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER body_comp_scans_update_timestamp
    BEFORE UPDATE ON body_composition_scans
    FOR EACH ROW
    EXECUTE FUNCTION update_body_comp_timestamp();

CREATE TRIGGER body_comp_goals_update_timestamp
    BEFORE UPDATE ON body_composition_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_body_comp_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE body_composition_scans IS 'Stores individual body composition scan results from smart scales and DEXA';
COMMENT ON TABLE body_composition_documents IS 'Uploaded scan images/PDFs with processing status';
COMMENT ON TABLE body_composition_goals IS 'User-defined or agent-recommended body composition goals';
COMMENT ON VIEW body_composition_trends IS 'Aggregated trends with change calculations';

COMMENT ON FUNCTION get_latest_body_composition IS 'Returns the most recent body composition scan for a user';
COMMENT ON FUNCTION calculate_body_comp_progress IS 'Calculates progress percentage toward a body composition goal';
COMMENT ON FUNCTION detect_body_comp_anomalies IS 'Detects anomalies and health concerns in body composition data';
