-- Seed Exercise Classifications
-- Execute this after 001_create_overload_tracking_tables.sql

-- ============================================================================
-- Seed common exercise classifications
-- ============================================================================

-- Compound Movements (from user-provided comprehensive list)
INSERT INTO public.exercise_classification (exercise_name, exercise_key, classification, movement_pattern, primary_muscles, is_primary_compound) VALUES
('Deadlift', 'deadlift', 'compound', 'hinge', ARRAY['hamstrings', 'glutes', 'lower back'], true),
('Glute Bridge', 'glute_bridge', 'compound', 'hinge', ARRAY['glutes', 'hamstrings'], true),
('Good Morning', 'good_morning', 'compound', 'hinge', ARRAY['hamstrings', 'glutes', 'lower back'], true),
('Hip Thrust', 'hip_thrust', 'compound', 'hinge', ARRAY['glutes', 'hamstrings'], true),
('Romanian Deadlift', 'romanian_deadlift', 'compound', 'hinge', ARRAY['hamstrings', 'glutes'], true),
('Sumo Deadlift', 'sumo_deadlift', 'compound', 'hinge', ARRAY['quadriceps', 'glutes', 'hamstrings'], true),
('Trap Bar Deadlift', 'trap_bar_deadlift', 'compound', 'hinge', ARRAY['quadriceps', 'glutes', 'hamstrings'], true),
('Forward Lunge', 'forward_lunge', 'compound', 'lunge', ARRAY['quadriceps', 'glutes', 'hamstrings'], true),
('Lunge', 'lunge', 'compound', 'lunge', ARRAY['quadriceps', 'glutes', 'hamstrings'], true),
('Lunges', 'lunges', 'compound', 'lunge', ARRAY['quadriceps', 'glutes', 'hamstrings'], true),
('Reverse Lunge', 'reverse_lunge', 'compound', 'lunge', ARRAY['quadriceps', 'glutes', 'hamstrings'], true),
('Step Up', 'step_up', 'compound', 'lunge', ARRAY['quadriceps', 'glutes'], true),
('Walking Lunge', 'walking_lunge', 'compound', 'lunge', ARRAY['quadriceps', 'glutes', 'hamstrings'], true),
('Barbell Row', 'barbell_row', 'compound', 'pull', ARRAY['lats', 'biceps', 'upper back'], true),
('Bent Over Row', 'bent_over_row', 'compound', 'pull', ARRAY['lats', 'biceps', 'upper back'], true),
('Cable Row', 'cable_row', 'compound', 'pull', ARRAY['lats', 'biceps', 'upper back'], true),
('Chin Up', 'chin_up', 'compound', 'pull', ARRAY['lats', 'biceps'], true),
('Close Grip Pulldown', 'close_grip_pulldown', 'compound', 'pull', ARRAY['lats', 'biceps'], true),
('Dumbbell Row', 'dumbbell_row', 'compound', 'pull', ARRAY['lats', 'biceps', 'upper back'], true),
('Lat Pulldown', 'lat_pulldown', 'compound', 'pull', ARRAY['lats', 'biceps'], true),
('Pendlay Row', 'pendlay_row', 'compound', 'pull', ARRAY['lats', 'biceps', 'upper back'], true),
('Pull Up', 'pull_up', 'compound', 'pull', ARRAY['lats', 'biceps', 'upper back'], true),
('Row', 'row', 'compound', 'pull', ARRAY['lats', 'biceps', 'upper back'], true),
('Seated Row', 'seated_row', 'compound', 'pull', ARRAY['lats', 'biceps', 'upper back'], true),
('T-Bar Row', 't_bar_row', 'compound', 'pull', ARRAY['lats', 'biceps', 'upper back'], true),
('Wide Grip Pulldown', 'wide_grip_pulldown', 'compound', 'pull', ARRAY['lats', 'biceps'], true),
('Arnold Press', 'arnold_press', 'compound', 'push', ARRAY['shoulders', 'triceps'], true),
('Bench', 'bench', 'compound', 'push', ARRAY['chest', 'triceps', 'shoulders'], true),
('Bench Press', 'bench_press', 'compound', 'push', ARRAY['chest', 'triceps', 'shoulders'], true),
('Chest Dip', 'chest_dip', 'compound', 'push', ARRAY['chest', 'triceps'], true),
('Decline Bench Press', 'decline_bench_press', 'compound', 'push', ARRAY['lower chest', 'triceps'], true),
('Dip', 'dip', 'compound', 'push', ARRAY['chest', 'triceps', 'shoulders'], true),
('Dumbbell Bench Press', 'dumbbell_bench_press', 'compound', 'push', ARRAY['chest', 'triceps', 'shoulders'], true),
('Dumbbell Press', 'dumbbell_press', 'compound', 'push', ARRAY['chest', 'triceps', 'shoulders'], true),
('Dumbbell Shoulder Press', 'dumbbell_shoulder_press', 'compound', 'push', ARRAY['shoulders', 'triceps'], true),
('Incline Bench', 'incline_bench', 'compound', 'push', ARRAY['upper chest', 'triceps', 'shoulders'], true),
('Incline Bench Press', 'incline_bench_press', 'compound', 'push', ARRAY['upper chest', 'triceps', 'shoulders'], true),
('Military Press', 'military_press', 'compound', 'push', ARRAY['shoulders', 'triceps'], true),
('Overhead Press', 'overhead_press', 'compound', 'push', ARRAY['shoulders', 'triceps'], true),
('Push Press', 'push_press', 'compound', 'push', ARRAY['shoulders', 'triceps', 'legs'], true),
('Push Up', 'push_up', 'compound', 'push', ARRAY['chest', 'triceps', 'shoulders'], true),
('Shoulder Press', 'shoulder_press', 'compound', 'push', ARRAY['shoulders', 'triceps'], true),
('Back Squat', 'back_squat', 'compound', 'squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], true),
('Bulgarian Split Squat', 'bulgarian_split_squat', 'compound', 'squat', ARRAY['quadriceps', 'glutes'], true),
('Front Squat', 'front_squat', 'compound', 'squat', ARRAY['quadriceps', 'glutes'], true),
('Goblet Squat', 'goblet_squat', 'compound', 'squat', ARRAY['quadriceps', 'glutes'], true),
('Hack Squat', 'hack_squat', 'compound', 'squat', ARRAY['quadriceps', 'glutes'], true),
('Leg Press', 'leg_press', 'compound', 'squat', ARRAY['quadriceps', 'glutes'], true),
('Squat', 'squat', 'compound', 'squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], true)
ON CONFLICT (exercise_key) DO NOTHING;

-- Isolation - Arms (Biceps)
INSERT INTO public.exercise_classification (exercise_name, exercise_key, classification, movement_pattern, primary_muscles, is_primary_compound) VALUES
('Bicep Curl', 'bicep_curl', 'isolation', 'unknown', ARRAY['biceps'], false),
('Dumbbell Curl', 'dumbbell_curl', 'isolation', 'unknown', ARRAY['biceps'], false),
('Barbell Curl', 'barbell_curl', 'isolation', 'unknown', ARRAY['biceps'], false),
('Hammer Curl', 'hammer_curl', 'isolation', 'unknown', ARRAY['brachialis', 'biceps'], false),
('Preacher Curl', 'preacher_curl', 'isolation', 'unknown', ARRAY['biceps'], false),
('Cable Curl', 'cable_curl', 'isolation', 'unknown', ARRAY['biceps'], false),
('Concentration Curl', 'concentration_curl', 'isolation', 'unknown', ARRAY['biceps'], false)
ON CONFLICT (exercise_key) DO NOTHING;

-- Isolation - Arms (Triceps)
INSERT INTO public.exercise_classification (exercise_name, exercise_key, classification, movement_pattern, primary_muscles, is_primary_compound) VALUES
('Tricep Extension', 'tricep_extension', 'isolation', 'unknown', ARRAY['triceps'], false),
('Tricep Pushdown', 'tricep_pushdown', 'isolation', 'unknown', ARRAY['triceps'], false),
('Overhead Tricep Extension', 'overhead_tricep_extension', 'isolation', 'unknown', ARRAY['triceps'], false),
('Skullcrusher', 'skullcrusher', 'isolation', 'unknown', ARRAY['triceps'], false),
('Skullcrushers', 'skullcrushers', 'isolation', 'unknown', ARRAY['triceps'], false),
('Tricep Kickback', 'tricep_kickback', 'isolation', 'unknown', ARRAY['triceps'], false),
('Close Grip Bench Press', 'close_grip_bench_press', 'isolation', 'unknown', ARRAY['triceps'], false)
ON CONFLICT (exercise_key) DO NOTHING;

-- Isolation - Shoulders
INSERT INTO public.exercise_classification (exercise_name, exercise_key, classification, movement_pattern, primary_muscles, is_primary_compound) VALUES
('Lateral Raise', 'lateral_raise', 'isolation', 'unknown', ARRAY['side delts'], false),
('Side Lateral Raise', 'side_lateral_raise', 'isolation', 'unknown', ARRAY['side delts'], false),
('Front Raise', 'front_raise', 'isolation', 'unknown', ARRAY['front delts'], false),
('Rear Delt Fly', 'rear_delt_fly', 'isolation', 'unknown', ARRAY['rear delts'], false),
('Rear Delt Raise', 'rear_delt_raise', 'isolation', 'unknown', ARRAY['rear delts'], false),
('Face Pull', 'face_pull', 'isolation', 'unknown', ARRAY['rear delts', 'upper back'], false),
('Shrug', 'shrug', 'isolation', 'unknown', ARRAY['traps'], false),
('Dumbbell Shrug', 'dumbbell_shrug', 'isolation', 'unknown', ARRAY['traps'], false),
('Barbell Shrug', 'barbell_shrug', 'isolation', 'unknown', ARRAY['traps'], false)
ON CONFLICT (exercise_key) DO NOTHING;

-- Isolation - Chest
INSERT INTO public.exercise_classification (exercise_name, exercise_key, classification, movement_pattern, primary_muscles, is_primary_compound) VALUES
('Fly', 'fly', 'isolation', 'unknown', ARRAY['chest'], false),
('Dumbbell Fly', 'dumbbell_fly', 'isolation', 'unknown', ARRAY['chest'], false),
('Cable Fly', 'cable_fly', 'isolation', 'unknown', ARRAY['chest'], false),
('Pec Deck', 'pec_deck', 'isolation', 'unknown', ARRAY['chest'], false),
('Chest Fly', 'chest_fly', 'isolation', 'unknown', ARRAY['chest'], false),
('Incline Fly', 'incline_fly', 'isolation', 'unknown', ARRAY['upper chest'], false)
ON CONFLICT (exercise_key) DO NOTHING;

-- Isolation - Legs
INSERT INTO public.exercise_classification (exercise_name, exercise_key, classification, movement_pattern, primary_muscles, is_primary_compound) VALUES
('Leg Extension', 'leg_extension', 'isolation', 'unknown', ARRAY['quadriceps'], false),
('Leg Curl', 'leg_curl', 'isolation', 'unknown', ARRAY['hamstrings'], false),
('Hamstring Curl', 'hamstring_curl', 'isolation', 'unknown', ARRAY['hamstrings'], false),
('Seated Leg Curl', 'seated_leg_curl', 'isolation', 'unknown', ARRAY['hamstrings'], false),
('Lying Leg Curl', 'lying_leg_curl', 'isolation', 'unknown', ARRAY['hamstrings'], false),
('Calf Raise', 'calf_raise', 'isolation', 'unknown', ARRAY['calves'], false),
('Standing Calf Raise', 'standing_calf_raise', 'isolation', 'unknown', ARRAY['calves'], false),
('Seated Calf Raise', 'seated_calf_raise', 'isolation', 'unknown', ARRAY['calves'], false),
('Leg Abduction', 'leg_abduction', 'isolation', 'unknown', ARRAY['abductors'], false),
('Leg Adduction', 'leg_adduction', 'isolation', 'unknown', ARRAY['adductors'], false)
ON CONFLICT (exercise_key) DO NOTHING;

-- Isolation - Core
INSERT INTO public.exercise_classification (exercise_name, exercise_key, classification, movement_pattern, primary_muscles, is_primary_compound) VALUES
('Crunch', 'crunch', 'isolation', 'unknown', ARRAY['abs'], false),
('Sit Up', 'sit_up', 'isolation', 'unknown', ARRAY['abs'], false),
('Sit-Up', 'sit_up', 'isolation', 'unknown', ARRAY['abs'], false),
('Leg Raise', 'leg_raise', 'isolation', 'unknown', ARRAY['abs', 'hip flexors'], false),
('Hanging Leg Raise', 'hanging_leg_raise', 'isolation', 'unknown', ARRAY['abs', 'hip flexors'], false),
('Plank', 'plank', 'isolation', 'unknown', ARRAY['abs', 'core'], false),
('Side Plank', 'side_plank', 'isolation', 'unknown', ARRAY['obliques', 'core'], false),
('Russian Twist', 'russian_twist', 'isolation', 'unknown', ARRAY['obliques'], false),
('Cable Crunch', 'cable_crunch', 'isolation', 'unknown', ARRAY['abs'], false),
('Ab Wheel', 'ab_wheel', 'isolation', 'unknown', ARRAY['abs', 'core'], false)
ON CONFLICT (exercise_key) DO NOTHING;

-- ============================================================================
-- Update usage counts and metadata
-- ============================================================================

-- Mark all seeded exercises as having been used at least once
UPDATE public.exercise_classification 
SET usage_count = 1, last_used_at = NOW()
WHERE usage_count = 0;

-- ============================================================================
-- Verification
-- ============================================================================

-- Count exercises by classification
SELECT 
    classification,
    movement_pattern,
    COUNT(*) as count
FROM public.exercise_classification
GROUP BY classification, movement_pattern
ORDER BY classification, movement_pattern;

-- Show primary compound movements
SELECT 
    exercise_name,
    movement_pattern,
    primary_muscles
FROM public.exercise_classification
WHERE is_primary_compound = true
ORDER BY movement_pattern, exercise_name;
