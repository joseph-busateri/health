-- Strength Tracking Schema
-- Tracks 1RM progress, personal records, and strength sessions

-- =====================================================
-- STRENGTH EXERCISES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS strength_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_name VARCHAR(200) NOT NULL,
    exercise_category VARCHAR(100), -- 'compound', 'isolation', 'accessory'
    muscle_group VARCHAR(100), -- 'chest', 'back', 'legs', 'shoulders', 'arms'
    equipment_needed VARCHAR(100), -- 'barbell', 'dumbbell', 'machine', 'bodyweight'
    description TEXT,
    video_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_strength_exercises_category ON strength_exercises(exercise_category);
CREATE INDEX idx_strength_exercises_muscle ON strength_exercises(muscle_group);

-- =====================================================
-- STRENGTH RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS strength_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    exercise_id UUID REFERENCES strength_exercises(id) ON DELETE CASCADE,
    exercise_name VARCHAR(200) NOT NULL, -- Denormalized for quick access
    record_date DATE NOT NULL,
    weight_lb DECIMAL(6,2) NOT NULL,
    reps INTEGER NOT NULL,
    estimated_1rm DECIMAL(6,2), -- Calculated using Epley or Brzycki formula
    rpe DECIMAL(3,1), -- Rate of Perceived Exertion (1-10)
    notes TEXT,
    is_pr BOOLEAN DEFAULT FALSE, -- Personal Record flag
    session_id UUID, -- Link to workout session if applicable
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_strength_records_user ON strength_records(user_id);
CREATE INDEX idx_strength_records_exercise ON strength_records(exercise_id);
CREATE INDEX idx_strength_records_date ON strength_records(record_date);
CREATE INDEX idx_strength_records_pr ON strength_records(is_pr) WHERE is_pr = TRUE;

-- =====================================================
-- STRENGTH SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS strength_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_date DATE NOT NULL,
    session_name VARCHAR(200), -- 'Upper Body', 'Lower Body', 'Push Day', etc.
    total_volume_lb DECIMAL(10,2), -- Total weight lifted (sets × reps × weight)
    total_sets INTEGER,
    total_reps INTEGER,
    duration_minutes INTEGER,
    avg_rpe DECIMAL(3,1),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_strength_sessions_user ON strength_sessions(user_id);
CREATE INDEX idx_strength_sessions_date ON strength_sessions(session_date);

-- =====================================================
-- PERSONAL RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS personal_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    exercise_id UUID REFERENCES strength_exercises(id) ON DELETE CASCADE,
    exercise_name VARCHAR(200) NOT NULL,
    record_type VARCHAR(50) NOT NULL, -- '1rm', '3rm', '5rm', 'max_reps', 'max_volume'
    record_value DECIMAL(10,2) NOT NULL,
    record_date DATE NOT NULL,
    previous_record DECIMAL(10,2),
    improvement_percent DECIMAL(5,2),
    strength_record_id UUID REFERENCES strength_records(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_personal_records_user ON personal_records(user_id);
CREATE INDEX idx_personal_records_exercise ON personal_records(exercise_id);
CREATE INDEX idx_personal_records_type ON personal_records(record_type);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Calculate estimated 1RM using Epley formula: weight × (1 + reps/30)
CREATE OR REPLACE FUNCTION calculate_1rm_epley(weight DECIMAL, reps INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    IF reps = 1 THEN
        RETURN weight;
    END IF;
    RETURN ROUND(weight * (1 + reps::DECIMAL / 30), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate estimated 1RM using Brzycki formula: weight × (36 / (37 - reps))
CREATE OR REPLACE FUNCTION calculate_1rm_brzycki(weight DECIMAL, reps INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    IF reps = 1 THEN
        RETURN weight;
    END IF;
    IF reps >= 37 THEN
        RETURN weight; -- Formula breaks down above 36 reps
    END IF;
    RETURN ROUND(weight * (36::DECIMAL / (37 - reps)), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-calculate 1RM on insert/update
CREATE OR REPLACE FUNCTION auto_calculate_1rm()
RETURNS TRIGGER AS $$
BEGIN
    -- Use Epley formula as default
    NEW.estimated_1rm := calculate_1rm_epley(NEW.weight_lb, NEW.reps);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_1rm
    BEFORE INSERT OR UPDATE ON strength_records
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_1rm();

-- Auto-detect personal records
CREATE OR REPLACE FUNCTION detect_personal_record()
RETURNS TRIGGER AS $$
DECLARE
    current_pr DECIMAL;
    previous_pr DECIMAL;
BEGIN
    -- Get current PR for this exercise (1RM)
    SELECT MAX(estimated_1rm) INTO current_pr
    FROM strength_records
    WHERE user_id = NEW.user_id
      AND exercise_id = NEW.exercise_id
      AND id != NEW.id;

    -- If new record is higher than previous PR, mark as PR
    IF current_pr IS NULL OR NEW.estimated_1rm > current_pr THEN
        NEW.is_pr := TRUE;
        
        -- Insert into personal_records table
        INSERT INTO personal_records (
            user_id,
            exercise_id,
            exercise_name,
            record_type,
            record_value,
            record_date,
            previous_record,
            improvement_percent,
            strength_record_id
        ) VALUES (
            NEW.user_id,
            NEW.exercise_id,
            NEW.exercise_name,
            '1rm',
            NEW.estimated_1rm,
            NEW.record_date,
            current_pr,
            CASE 
                WHEN current_pr IS NOT NULL THEN ROUND(((NEW.estimated_1rm - current_pr) / current_pr) * 100, 2)
                ELSE NULL
            END,
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_detect_pr
    AFTER INSERT OR UPDATE ON strength_records
    FOR EACH ROW
    EXECUTE FUNCTION detect_personal_record();

-- Get strength progress for an exercise
CREATE OR REPLACE FUNCTION get_strength_progress(
    p_user_id UUID,
    p_exercise_id UUID,
    p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
    record_date DATE,
    weight_lb DECIMAL,
    reps INTEGER,
    estimated_1rm DECIMAL,
    is_pr BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.record_date,
        sr.weight_lb,
        sr.reps,
        sr.estimated_1rm,
        sr.is_pr
    FROM strength_records sr
    WHERE sr.user_id = p_user_id
      AND sr.exercise_id = p_exercise_id
      AND sr.record_date >= CURRENT_DATE - p_days
    ORDER BY sr.record_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Get all personal records for a user
CREATE OR REPLACE FUNCTION get_all_personal_records(p_user_id UUID)
RETURNS TABLE (
    exercise_name VARCHAR,
    record_type VARCHAR,
    record_value DECIMAL,
    record_date DATE,
    improvement_percent DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.exercise_name,
        pr.record_type,
        pr.record_value,
        pr.record_date,
        pr.improvement_percent
    FROM personal_records pr
    WHERE pr.user_id = p_user_id
    ORDER BY pr.record_date DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA - Common Exercises
-- =====================================================
INSERT INTO strength_exercises (exercise_name, exercise_category, muscle_group, equipment_needed) VALUES
    ('Barbell Bench Press', 'compound', 'chest', 'barbell'),
    ('Barbell Squat', 'compound', 'legs', 'barbell'),
    ('Barbell Deadlift', 'compound', 'back', 'barbell'),
    ('Barbell Overhead Press', 'compound', 'shoulders', 'barbell'),
    ('Barbell Row', 'compound', 'back', 'barbell'),
    ('Pull-ups', 'compound', 'back', 'bodyweight'),
    ('Dips', 'compound', 'chest', 'bodyweight'),
    ('Dumbbell Bench Press', 'compound', 'chest', 'dumbbell'),
    ('Dumbbell Shoulder Press', 'compound', 'shoulders', 'dumbbell'),
    ('Leg Press', 'compound', 'legs', 'machine'),
    ('Lat Pulldown', 'compound', 'back', 'machine'),
    ('Barbell Curl', 'isolation', 'arms', 'barbell'),
    ('Tricep Extension', 'isolation', 'arms', 'dumbbell'),
    ('Leg Curl', 'isolation', 'legs', 'machine'),
    ('Leg Extension', 'isolation', 'legs', 'machine')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE strength_exercises IS 'Library of strength training exercises';
COMMENT ON TABLE strength_records IS 'Individual strength training records with 1RM calculations';
COMMENT ON TABLE strength_sessions IS 'Strength training session summaries';
COMMENT ON TABLE personal_records IS 'Personal record achievements for exercises';
COMMENT ON FUNCTION calculate_1rm_epley IS 'Calculate estimated 1RM using Epley formula';
COMMENT ON FUNCTION calculate_1rm_brzycki IS 'Calculate estimated 1RM using Brzycki formula';
COMMENT ON FUNCTION get_strength_progress IS 'Get strength progress for an exercise over time';
COMMENT ON FUNCTION get_all_personal_records IS 'Get all personal records for a user';
