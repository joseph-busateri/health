-- Supplement Schema Migration
-- Purpose: Support agent-managed supplement stacks with version history
-- Features: Version tracking, adherence monitoring, agent updates, change audit trail

-- ============================================================================
-- 1. SUPPLEMENT STACK VERSIONS TABLE
-- ============================================================================
-- Stores different versions of supplement stacks (baseline, agent updates)

CREATE TABLE IF NOT EXISTS supplement_stack_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- Version tracking
    version_number INTEGER NOT NULL DEFAULT 1,
    version_name TEXT,
    is_current BOOLEAN NOT NULL DEFAULT true,
    
    -- Version metadata
    created_by TEXT NOT NULL CHECK (created_by IN ('user', 'agent')),
    created_reason TEXT, -- e.g., "Initial baseline", "Added for recovery", "Removed due to side effects"
    
    -- Agent recommendation context
    based_on_recommendation_id UUID, -- Links to agent recommendation that triggered this version
    
    -- Timestamps
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, version_number)
);

CREATE INDEX idx_supplement_versions_user ON supplement_stack_versions(user_id);
CREATE INDEX idx_supplement_versions_current ON supplement_stack_versions(user_id, is_current);

-- ============================================================================
-- 2. SUPPLEMENTS TABLE
-- ============================================================================
-- Individual supplements in a stack version

CREATE TABLE IF NOT EXISTS supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stack_version_id UUID NOT NULL REFERENCES supplement_stack_versions(id) ON DELETE CASCADE,
    
    -- Supplement details
    supplement_name TEXT NOT NULL,
    brand TEXT,
    form TEXT, -- e.g., "capsule", "powder", "liquid", "tablet"
    
    -- Dosage information
    dosage_amount DECIMAL(10,2) NOT NULL,
    dosage_unit TEXT NOT NULL, -- e.g., "mg", "g", "IU", "mcg", "ml"
    
    -- Timing and frequency
    timing TEXT NOT NULL, -- e.g., "morning", "evening", "with breakfast", "before bed", "pre-workout", "post-workout"
    frequency TEXT NOT NULL, -- e.g., "daily", "twice daily", "3x daily", "as needed", "every other day"
    times_per_day INTEGER DEFAULT 1,
    
    -- Purpose and reasoning
    goal TEXT, -- e.g., "Recovery", "Performance", "Health", "Sleep", "Cardiovascular"
    reason_to_take TEXT, -- Detailed explanation of why this supplement is in the stack
    
    -- Additional details
    take_with_food BOOLEAN DEFAULT false,
    take_with_water BOOLEAN DEFAULT true,
    avoid_with TEXT[], -- Array of things to avoid taking with (e.g., "caffeine", "calcium")
    
    -- Cost tracking (optional)
    cost_per_serving DECIMAL(10,2),
    servings_per_container INTEGER,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'discontinued')),
    discontinue_reason TEXT,
    
    -- Order in the stack
    supplement_order INTEGER NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(stack_version_id, supplement_order)
);

CREATE INDEX idx_supplements_stack_version ON supplements(stack_version_id);
CREATE INDEX idx_supplements_status ON supplements(stack_version_id, status);

-- ============================================================================
-- 3. SUPPLEMENT ADHERENCE LOG TABLE
-- ============================================================================
-- Tracks actual supplement intake vs planned

CREATE TABLE IF NOT EXISTS supplement_adherence_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
    stack_version_id UUID REFERENCES supplement_stack_versions(id) ON DELETE SET NULL,
    
    -- Adherence details
    scheduled_date DATE NOT NULL,
    scheduled_time TEXT NOT NULL, -- e.g., "morning", "evening"
    
    -- Actual intake
    taken BOOLEAN NOT NULL DEFAULT false,
    taken_at TIMESTAMPTZ,
    
    -- Dosage tracking
    planned_dosage_amount DECIMAL(10,2) NOT NULL,
    actual_dosage_amount DECIMAL(10,2),
    dosage_unit TEXT NOT NULL,
    
    -- Missed dose tracking
    missed BOOLEAN DEFAULT false,
    miss_reason TEXT, -- e.g., "forgot", "ran out", "side effects", "traveling"
    
    -- Side effects
    side_effects_reported BOOLEAN DEFAULT false,
    side_effects_description TEXT,
    side_effects_severity INTEGER CHECK (side_effects_severity BETWEEN 1 AND 5), -- 1=mild, 5=severe
    
    -- Effectiveness
    perceived_effectiveness INTEGER CHECK (perceived_effectiveness BETWEEN 1 AND 5), -- 1=not effective, 5=very effective
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_adherence_user_date ON supplement_adherence_log(user_id, scheduled_date DESC);
CREATE INDEX idx_adherence_supplement ON supplement_adherence_log(supplement_id);
CREATE INDEX idx_adherence_stack_version ON supplement_adherence_log(stack_version_id);
CREATE INDEX idx_adherence_side_effects ON supplement_adherence_log(user_id, side_effects_reported) WHERE side_effects_reported = true;

-- ============================================================================
-- 4. SUPPLEMENT STACK CHANGES TABLE
-- ============================================================================
-- Tracks what changed between versions (for agent transparency)

CREATE TABLE IF NOT EXISTS supplement_stack_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_version_id UUID REFERENCES supplement_stack_versions(id) ON DELETE CASCADE,
    to_version_id UUID NOT NULL REFERENCES supplement_stack_versions(id) ON DELETE CASCADE,
    
    -- Change details
    change_type TEXT NOT NULL CHECK (change_type IN ('supplement_added', 'supplement_removed', 'dosage_changed', 'timing_changed', 'frequency_changed', 'status_changed')),
    change_description TEXT NOT NULL,
    
    -- What changed
    supplement_name TEXT,
    old_value TEXT,
    new_value TEXT,
    
    -- Why it changed
    reason TEXT,
    
    -- Supporting data
    triggered_by_bloodwork BOOLEAN DEFAULT false,
    triggered_by_side_effects BOOLEAN DEFAULT false,
    triggered_by_adherence BOOLEAN DEFAULT false,
    triggered_by_performance BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stack_changes_version ON supplement_stack_changes(to_version_id);

-- ============================================================================
-- 5. SUPPLEMENT BASELINE DOCUMENTS TABLE
-- ============================================================================
-- Stores uploaded Excel/document metadata

CREATE TABLE IF NOT EXISTS supplement_baseline_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    stack_version_id UUID REFERENCES supplement_stack_versions(id) ON DELETE SET NULL,
    
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
    parsed_supplement_data JSONB,
    
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_supplement_docs_user ON supplement_baseline_documents(user_id);
CREATE INDEX idx_supplement_docs_status ON supplement_baseline_documents(user_id, processing_status);

-- ============================================================================
-- 6. SUPPLEMENT INTERACTIONS TABLE
-- ============================================================================
-- Tracks known interactions between supplements and medications

CREATE TABLE IF NOT EXISTS supplement_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Interaction details
    supplement_name TEXT NOT NULL,
    interacts_with TEXT NOT NULL, -- Supplement, medication, or food
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('supplement', 'medication', 'food', 'condition')),
    
    -- Severity
    severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
    
    -- Description
    interaction_description TEXT NOT NULL,
    recommendation TEXT, -- e.g., "Take 2 hours apart", "Avoid combination", "Monitor closely"
    
    -- Sources
    source TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(supplement_name, interacts_with)
);

CREATE INDEX idx_interactions_supplement ON supplement_interactions(supplement_name);
CREATE INDEX idx_interactions_severity ON supplement_interactions(severity);

-- ============================================================================
-- 7. SUPPLEMENT INVENTORY TABLE
-- ============================================================================
-- Tracks supplement inventory and reorder needs

CREATE TABLE IF NOT EXISTS supplement_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
    
    -- Inventory details
    supplement_name TEXT NOT NULL,
    brand TEXT,
    
    -- Quantity
    current_servings INTEGER NOT NULL DEFAULT 0,
    servings_per_container INTEGER,
    
    -- Reorder tracking
    reorder_threshold INTEGER DEFAULT 7, -- Days of supply before reorder
    needs_reorder BOOLEAN DEFAULT false,
    
    -- Purchase info
    last_purchase_date DATE,
    last_purchase_cost DECIMAL(10,2),
    vendor TEXT,
    
    -- Expiration
    expiration_date DATE,
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_user ON supplement_inventory(user_id);
CREATE INDEX idx_inventory_reorder ON supplement_inventory(user_id, needs_reorder) WHERE needs_reorder = true;
CREATE INDEX idx_inventory_supplement ON supplement_inventory(supplement_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current supplement stack for user
CREATE OR REPLACE FUNCTION get_current_supplement_stack(p_user_id TEXT)
RETURNS TABLE (
    stack_version_id UUID,
    version_number INTEGER,
    supplement_name TEXT,
    dosage_amount DECIMAL(10,2),
    dosage_unit TEXT,
    timing TEXT,
    frequency TEXT,
    goal TEXT,
    reason_to_take TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ssv.id,
        ssv.version_number,
        s.supplement_name,
        s.dosage_amount,
        s.dosage_unit,
        s.timing,
        s.frequency,
        s.goal,
        s.reason_to_take,
        s.status
    FROM supplement_stack_versions ssv
    JOIN supplements s ON s.stack_version_id = ssv.id
    WHERE ssv.user_id = p_user_id
    AND ssv.is_current = true
    AND s.status = 'active'
    ORDER BY s.supplement_order;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate adherence rate for a supplement
CREATE OR REPLACE FUNCTION calculate_supplement_adherence(
    p_supplement_id UUID,
    p_days INTEGER DEFAULT 30
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_scheduled INTEGER;
    v_total_taken INTEGER;
    v_adherence_rate DECIMAL(5,2);
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE taken = true)
    INTO 
        v_total_scheduled,
        v_total_taken
    FROM supplement_adherence_log
    WHERE supplement_id = p_supplement_id
    AND scheduled_date >= CURRENT_DATE - p_days;
    
    IF v_total_scheduled = 0 THEN
        RETURN 0;
    END IF;
    
    v_adherence_rate := (v_total_taken::DECIMAL / v_total_scheduled::DECIMAL) * 100;
    
    RETURN ROUND(v_adherence_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to check for supplement interactions
CREATE OR REPLACE FUNCTION check_supplement_interactions(p_supplement_names TEXT[])
RETURNS TABLE (
    supplement1 TEXT,
    supplement2 TEXT,
    severity TEXT,
    description TEXT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.supplement_name,
        si.interacts_with,
        si.severity,
        si.interaction_description,
        si.recommendation
    FROM supplement_interactions si
    WHERE si.supplement_name = ANY(p_supplement_names)
    AND si.interacts_with = ANY(p_supplement_names)
    ORDER BY 
        CASE si.severity
            WHEN 'severe' THEN 1
            WHEN 'moderate' THEN 2
            WHEN 'mild' THEN 3
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to update inventory after logging adherence
CREATE OR REPLACE FUNCTION update_inventory_on_adherence()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.taken = true THEN
        UPDATE supplement_inventory
        SET 
            current_servings = current_servings - 1,
            needs_reorder = (current_servings - 1) <= reorder_threshold,
            updated_at = NOW()
        WHERE supplement_id = NEW.supplement_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER adherence_update_inventory
    AFTER INSERT OR UPDATE ON supplement_adherence_log
    FOR EACH ROW
    WHEN (NEW.taken = true)
    EXECUTE FUNCTION update_inventory_on_adherence();

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Ensure only one current version per user
CREATE OR REPLACE FUNCTION ensure_single_current_stack_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = true THEN
        UPDATE supplement_stack_versions
        SET is_current = false
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_current = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supplement_version_current_check
    BEFORE INSERT OR UPDATE ON supplement_stack_versions
    FOR EACH ROW
    WHEN (NEW.is_current = true)
    EXECUTE FUNCTION ensure_single_current_stack_version();

-- Update inventory timestamp
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_update_timestamp
    BEFORE UPDATE ON supplement_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_timestamp();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for supplement adherence summary
CREATE OR REPLACE VIEW supplement_adherence_summary AS
SELECT 
    s.id AS supplement_id,
    s.supplement_name,
    s.stack_version_id,
    ssv.user_id,
    COUNT(sal.id) AS total_scheduled,
    COUNT(sal.id) FILTER (WHERE sal.taken = true) AS total_taken,
    COUNT(sal.id) FILTER (WHERE sal.missed = true) AS total_missed,
    ROUND(
        (COUNT(sal.id) FILTER (WHERE sal.taken = true)::DECIMAL / 
         NULLIF(COUNT(sal.id), 0)::DECIMAL) * 100, 
        2
    ) AS adherence_percentage,
    COUNT(sal.id) FILTER (WHERE sal.side_effects_reported = true) AS side_effects_count,
    AVG(sal.perceived_effectiveness) FILTER (WHERE sal.perceived_effectiveness IS NOT NULL) AS avg_effectiveness
FROM supplements s
JOIN supplement_stack_versions ssv ON ssv.id = s.stack_version_id
LEFT JOIN supplement_adherence_log sal ON sal.supplement_id = s.id
WHERE sal.scheduled_date >= CURRENT_DATE - 30
GROUP BY s.id, s.supplement_name, s.stack_version_id, ssv.user_id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE supplement_stack_versions IS 'Stores versioned supplement stacks with change history';
COMMENT ON TABLE supplements IS 'Individual supplements with dosage, timing, and purpose';
COMMENT ON TABLE supplement_adherence_log IS 'Tracks actual supplement intake vs planned';
COMMENT ON TABLE supplement_stack_changes IS 'Audit trail of stack modifications';
COMMENT ON TABLE supplement_baseline_documents IS 'Uploaded Excel/document metadata and processing status';
COMMENT ON TABLE supplement_interactions IS 'Known interactions between supplements and medications';
COMMENT ON TABLE supplement_inventory IS 'Tracks supplement inventory and reorder needs';

COMMENT ON FUNCTION get_current_supplement_stack IS 'Returns the current active supplement stack for a user';
COMMENT ON FUNCTION calculate_supplement_adherence IS 'Calculates adherence rate for a supplement over specified days';
COMMENT ON FUNCTION check_supplement_interactions IS 'Checks for interactions between supplements in a stack';
