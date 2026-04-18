-- Fix get_active_goals function to match expected return structure
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
    calculate_goal_progress(g.id),
    (g.target_date - CURRENT_DATE)::INTEGER,
    is_goal_on_track(g.id),
    gm.metric_name,
    gm.current_value,
    gm.target_value
  FROM goals g
  LEFT JOIN goal_metrics gm ON g.id = gm.goal_id AND gm.is_primary = TRUE
  WHERE g.user_id = p_user_id
    AND g.status = 'active'
  ORDER BY g.target_date ASC;
END;
$$ LANGUAGE plpgsql;
