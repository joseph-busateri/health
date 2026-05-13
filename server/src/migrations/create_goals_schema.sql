-- Create comprehensive goals schema to support goal management engine

-- Goal templates table
CREATE TABLE IF NOT EXISTS goal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  template_category VARCHAR(100) NOT NULL,
  description TEXT,
  goal_type VARCHAR(100) NOT NULL,
  primary_metric VARCHAR(100) NOT NULL,
  secondary_metrics JSONB,
  default_duration_days INTEGER NOT NULL DEFAULT 90,
  difficulty_level VARCHAR(50) NOT NULL DEFAULT 'medium',
  milestone_percentages JSONB DEFAULT '[25, 50, 75, 100]',
  success_tips TEXT[],
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  template_id UUID REFERENCES goal_templates(id),
  goal_name VARCHAR(255) NOT NULL,
  goal_category VARCHAR(100) NOT NULL,
  goal_type VARCHAR(100) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  why_important TEXT,
  motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10),
  completion_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, goal_name)
);

-- Goal metrics table
CREATE TABLE IF NOT EXISTS goal_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_type VARCHAR(50) NOT NULL DEFAULT 'numeric',
  metric_unit VARCHAR(50),
  starting_value NUMERIC NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC,
  direction VARCHAR(20) CHECK (direction IN ('increase', 'decrease', 'maintain')) DEFAULT 'increase',
  is_primary BOOLEAN DEFAULT false,
  update_frequency VARCHAR(50) DEFAULT 'weekly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goal milestones table
CREATE TABLE IF NOT EXISTS goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  milestone_name VARCHAR(255) NOT NULL,
  milestone_percentage NUMERIC NOT NULL CHECK (milestone_percentage >= 0 AND milestone_percentage <= 100),
  milestone_order INTEGER NOT NULL,
  target_value NUMERIC,
  target_date DATE,
  achieved BOOLEAN DEFAULT false,
  achieved_date DATE,
  days_to_achieve INTEGER,
  celebration_message TEXT,
  celebration_emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, milestone_percentage)
);

-- Goal progress tracking table
CREATE TABLE IF NOT EXISTS goal_progress (
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  overall_progress_percentage NUMERIC NOT NULL CHECK (overall_progress_percentage >= 0 AND overall_progress_percentage <= 100),
  days_elapsed INTEGER NOT NULL,
  days_remaining INTEGER NOT NULL,
  on_track BOOLEAN DEFAULT false,
  expected_progress NUMERIC NOT NULL,
  actual_progress NUMERIC NOT NULL,
  pace_vs_target NUMERIC,
  predicted_completion_date DATE,
  likelihood_of_success NUMERIC CHECK (likelihood_of_success >= 0 AND likelihood_of_success <= 100),
  metrics_snapshot JSONB,
  notes TEXT,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (goal_id, progress_date)
);

-- Goal achievements table
CREATE TABLE IF NOT EXISTS goal_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  achievement_date DATE NOT NULL,
  achievement_value NUMERIC,
  achievement_description TEXT NOT NULL,
  badge_earned VARCHAR(100),
  badge_icon VARCHAR(50),
  points_earned INTEGER DEFAULT 0,
  celebration_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goal recommendations table
CREATE TABLE IF NOT EXISTS goal_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  recommendation_type VARCHAR(100) NOT NULL,
  recommended_goal_template_id UUID REFERENCES goal_templates(id),
  recommendation_reason TEXT NOT NULL,
  based_on_data TEXT[],
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  suggested_goal_name VARCHAR(255) NOT NULL,
  suggested_category VARCHAR(100) NOT NULL,
  suggested_duration_days INTEGER,
  suggested_target_value NUMERIC,
  priority VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')),
  urgency VARCHAR(50),
  expected_benefit TEXT,
  success_probability NUMERIC CHECK (success_probability >= 0 AND success_probability <= 100),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(goal_category);
CREATE INDEX IF NOT EXISTS idx_goal_metrics_goal_id ON goal_metrics(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_id ON goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_date ON goal_progress(progress_date);
CREATE INDEX IF NOT EXISTS idx_goal_achievements_user_id ON goal_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_achievements_goal_id ON goal_achievements(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_recommendations_user_id ON goal_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_recommendations_status ON goal_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_goal_templates_category ON goal_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_goal_templates_active ON goal_templates(is_active);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_goal_templates_timestamp
BEFORE UPDATE ON goal_templates
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_goals_timestamp
BEFORE UPDATE ON goals
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_goal_metrics_timestamp
BEFORE UPDATE ON goal_metrics
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_goal_milestones_timestamp
BEFORE UPDATE ON goal_milestones
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Insert default goal templates
INSERT INTO goal_templates (template_name, template_category, description, goal_type, primary_metric, default_duration_days, difficulty_level, milestone_percentages, success_tips) VALUES
('Lose 10 Pounds', 'weight_loss', 'Lose 10 pounds through diet and exercise', 'weight_loss', 'body_weight', 90, 'medium', '[25, 50, 75, 100]', 
 ARRAY['Track calories consistently', 'Exercise 3-4 times per week', 'Drink plenty of water', 'Get adequate sleep']),
('Build Muscle', 'muscle_gain', 'Gain 5 pounds of lean muscle mass', 'muscle_gain', 'lean_body_mass', 120, 'hard', 
 '[20, 40, 60, 80, 100]', ARRAY['Progressive overload is key', 'Eat sufficient protein', 'Allow proper recovery', 'Be consistent']),
('Improve Sleep', 'health', 'Get 8 hours of quality sleep per night', 'health', 'sleep_duration_hours', 60, 'easy', 
 '[33, 66, 100]', ARRAY['Maintain consistent schedule', 'Create relaxing bedtime routine', 'Avoid screens before bed', 'Optimize sleep environment']),
('Increase Bench Press', 'strength', 'Add 50 pounds to bench press 1RM', 'strength', 'bench_press_1rm', 90, 'hard', 
 '[25, 50, 75, 100]', ARRAY['Focus on proper form', 'Include accessory exercises', 'Don''t neglect recovery', 'Track progress']),
('Run 5K', 'endurance', 'Complete a 5K run without stopping', 'endurance', 'running_distance', 45, 'medium', 
 '[25, 50, 75, 100]', ARRAY['Start with walk/run intervals', 'Gradually increase running time', 'Consistency over intensity', 'Listen to your body']),
('Reduce Body Fat', 'health', 'Reduce body fat percentage by 5%', 'health', 'body_fat_percent', 100, 'medium', 
 '[25, 50, 75, 100]', ARRAY['Combine strength and cardio', 'Focus on nutrition', 'Be patient with progress', 'Monitor measurements'])
ON CONFLICT DO NOTHING;

-- Create stored procedures for goal calculations

-- Calculate goal progress
CREATE OR REPLACE FUNCTION calculate_goal_progress(p_goal_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_progress NUMERIC := 0;
  v_primary_metric RECORD;
  v_start_val NUMERIC;
  v_target_val NUMERIC;
  v_current_val NUMERIC;
  v_direction VARCHAR(20);
BEGIN
  -- Get primary metric for this goal
  SELECT INTO v_primary_metric gm.* 
  FROM goal_metrics gm 
  WHERE gm.goal_id = p_goal_id AND gm.is_primary = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  v_start_val := v_primary_metric.starting_value;
  v_target_val := v_primary_metric.target_value;
  v_current_val := COALESCE(v_primary_metric.current_value, v_start_val);
  v_direction := v_primary_metric.direction;
  
  -- Calculate progress based on direction
  IF v_direction = 'increase' THEN
    IF v_target_val > v_start_val THEN
      v_progress := ((v_current_val - v_start_val) / (v_target_val - v_start_val)) * 100;
    END IF;
  ELSIF v_direction = 'decrease' THEN
    IF v_start_val > v_target_val THEN
      v_progress := ((v_start_val - v_current_val) / (v_start_val - v_target_val)) * 100;
    END IF;
  ELSIF v_direction = 'maintain' THEN
    -- For maintain goals, progress is based on staying within range
    IF ABS(v_current_val - v_target_val) <= (v_start_val * 0.05) THEN -- Within 5% of target
      v_progress := 100;
    ELSE
      v_progress := 50; -- Partial progress
    END IF;
  END IF;
  
  -- Ensure progress is within bounds
  v_progress := GREATEST(0, LEAST(100, v_progress));
  
  RETURN v_progress;
END;
$$ LANGUAGE plpgsql;

-- Check if goal is on track
CREATE OR REPLACE FUNCTION is_goal_on_track(p_goal_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_goal RECORD;
  v_progress NUMERIC;
  v_days_elapsed INTEGER;
  v_total_days INTEGER;
  v_expected_progress NUMERIC;
BEGIN
  -- Get goal details
  SELECT INTO v_goal g.* 
  FROM goals g 
  WHERE g.id = p_goal_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Calculate progress
  v_progress := calculate_goal_progress(p_goal_id);
  
  -- Calculate time-based expectations
  v_days_elapsed := CURRENT_DATE - v_goal.start_date;
  v_total_days := v_goal.target_date - v_goal.start_date;
  
  IF v_total_days <= 0 THEN
    RETURN false;
  END IF;
  
  v_expected_progress := (v_days_elapsed::NUMERIC / v_total_days::NUMERIC) * 100;
  
  -- Goal is on track if actual progress is within 20% of expected
  RETURN v_progress >= (v_expected_progress * 0.8);
END;
$$ LANGUAGE plpgsql;

-- Update goal metric progress
CREATE OR REPLACE FUNCTION update_goal_metric_progress(
  p_metric_id UUID,
  p_new_value NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_goal_id UUID;
BEGIN
  -- Update metric value
  UPDATE goal_metrics 
  SET current_value = p_new_value, updated_at = NOW()
  WHERE id = p_metric_id;
  
  -- Get goal ID
  SELECT goal_id INTO v_goal_id
  FROM goal_metrics
  WHERE id = p_metric_id;
  
  IF v_goal_id IS NOT NULL THEN
    -- Record progress snapshot
    INSERT INTO goal_progress (
      goal_id, progress_date, overall_progress_percentage,
      days_elapsed, days_remaining, on_track, expected_progress, actual_progress
    )
    SELECT 
      v_goal_id,
      CURRENT_DATE,
      calculate_goal_progress(v_goal_id),
      CURRENT_DATE - g.start_date,
      g.target_date - CURRENT_DATE,
      is_goal_on_track(v_goal_id),
      ((CURRENT_DATE - g.start_date)::NUMERIC / (g.target_date - g.start_date)::NUMERIC) * 100,
      calculate_goal_progress(v_goal_id)
    FROM goals g
    WHERE g.id = v_goal_id
    ON CONFLICT (goal_id, progress_date) DO UPDATE SET
      overall_progress_percentage = EXCLUDED.overall_progress_percentage,
      days_elapsed = EXCLUDED.days_elapsed,
      days_remaining = EXCLUDED.days_remaining,
      on_track = EXCLUDED.on_track,
      expected_progress = EXCLUDED.expected_progress,
      actual_progress = EXCLUDED.actual_progress;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Check milestone achievements
CREATE OR REPLACE FUNCTION check_milestone_achievements(p_goal_id UUID)
RETURNS TABLE(
  milestone_id UUID,
  milestone_name VARCHAR(255),
  milestone_percentage NUMERIC,
  newly_achieved BOOLEAN
) AS $$
DECLARE
  v_progress NUMERIC;
BEGIN
  v_progress := calculate_goal_progress(p_goal_id);
  
  RETURN QUERY
  SELECT 
    gm.id,
    gm.milestone_name,
    gm.milestone_percentage,
    (NOT gm.achieved AND v_progress >= gm.milestone_percentage) as newly_achieved
  FROM goal_milestones gm
  WHERE gm.goal_id = p_goal_id
  ORDER BY gm.milestone_percentage;
END;
$$ LANGUAGE plpgsql;

-- Get goal statistics for user
CREATE OR REPLACE FUNCTION get_goal_statistics(p_user_id UUID)
RETURNS TABLE(
  total_goals BIGINT,
  active_goals BIGINT,
  completed_goals BIGINT,
  completion_rate NUMERIC,
  average_completion_days NUMERIC,
  total_achievements BIGINT,
  total_points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_goals,
    COUNT(*) FILTER (WHERE status = 'active') as active_goals,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_goals,
    CASE 
      WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100
      ELSE 0
    END as completion_rate,
    AVG(target_date - start_date) FILTER (WHERE status = 'completed') as average_completion_days,
    COUNT(*) as total_achievements,
    COALESCE(SUM(points_earned), 0) as total_points
  FROM goals g
  LEFT JOIN goal_achievements ga ON g.id = ga.goal_id
  WHERE g.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Get active goals for user
CREATE OR REPLACE FUNCTION get_active_goals(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  goal_name VARCHAR(255),
  goal_category VARCHAR(100),
  goal_type VARCHAR(100),
  start_date DATE,
  target_date DATE,
  status VARCHAR(50),
  progress_percentage NUMERIC,
  days_remaining INTEGER,
  on_track BOOLEAN,
  primary_metric_name VARCHAR(100),
  primary_metric_current NUMERIC,
  primary_metric_target NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.goal_name,
    g.goal_category,
    g.goal_type,
    g.start_date,
    g.target_date,
    g.status,
    calculate_goal_progress(g.id) as progress_percentage,
    g.target_date - CURRENT_DATE as days_remaining,
    is_goal_on_track(g.id) as on_track,
    gm.metric_name as primary_metric_name,
    gm.current_value as primary_metric_current,
    gm.target_value as primary_metric_target
  FROM goals g
  LEFT JOIN goal_metrics gm ON g.id = gm.goal_id AND gm.is_primary = true
  WHERE g.user_id = p_user_id AND g.status = 'active'
  ORDER BY g.target_date ASC;
END;
$$ LANGUAGE plpgsql;
