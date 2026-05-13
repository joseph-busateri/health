-- Supplement Schema Functions, Triggers, and Views for Phase 0-20 Alignment
-- Date: 2026-04-12

-- Ensure pgcrypto is available for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper function: get current supplement stack for a user
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

-- Helper function: calculate adherence for a supplement
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

-- Helper function: check for interactions between supplements in a stack
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

-- Trigger function: update inventory after adherence entry
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

-- Trigger to keep only one current stack version per user
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

-- Trigger function: update timestamp on inventory updates
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS adherence_update_inventory ON supplement_adherence_log;
CREATE TRIGGER adherence_update_inventory
    AFTER INSERT OR UPDATE ON supplement_adherence_log
    FOR EACH ROW
    WHEN (NEW.taken = true)
    EXECUTE FUNCTION update_inventory_on_adherence();

DROP TRIGGER IF EXISTS supplement_version_current_check ON supplement_stack_versions;
CREATE TRIGGER supplement_version_current_check
    BEFORE INSERT OR UPDATE ON supplement_stack_versions
    FOR EACH ROW
    WHEN (NEW.is_current = true)
    EXECUTE FUNCTION ensure_single_current_stack_version();

DROP TRIGGER IF EXISTS inventory_update_timestamp ON supplement_inventory;
CREATE TRIGGER inventory_update_timestamp
    BEFORE UPDATE ON supplement_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_timestamp();

-- View: supplement adherence summary (30-day default window)
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

-- Additional indexes to support queries
CREATE INDEX IF NOT EXISTS idx_adherence_side_effects
    ON supplement_adherence_log(user_id, side_effects_reported)
    WHERE side_effects_reported = true;

CREATE INDEX IF NOT EXISTS idx_inventory_user
    ON supplement_inventory(user_id);

CREATE INDEX IF NOT EXISTS idx_inventory_reorder
    ON supplement_inventory(user_id, needs_reorder)
    WHERE needs_reorder = true;

CREATE INDEX IF NOT EXISTS idx_inventory_supplement
    ON supplement_inventory(supplement_id);

CREATE INDEX IF NOT EXISTS idx_interactions_supplement
    ON supplement_interactions(supplement_name);

CREATE INDEX IF NOT EXISTS idx_interactions_severity
    ON supplement_interactions(severity);

CREATE INDEX IF NOT EXISTS idx_supplement_docs_status
    ON supplement_baseline_documents(user_id, processing_status);
