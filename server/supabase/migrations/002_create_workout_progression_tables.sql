-- Phase 21: Progressive Overload Ledger Schema
-- Adds workout_daily_progressions and workout_weekly_progressions tables

CREATE TABLE IF NOT EXISTS public.workout_daily_progressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    exercise_key TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    plan_date DATE NOT NULL,
    baseline_payload JSONB NOT NULL,
    applied_payload JSONB NOT NULL,
    progression_step TEXT,
    adjustment_source TEXT NOT NULL CHECK (adjustment_source IN ('baseline', 'heuristic', 'ai')),
    readiness_snapshot JSONB,
    joint_snapshot JSONB,
    adherence_snapshot JSONB,
    ai_confidence NUMERIC(5,4),
    rationale TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_weekly_progressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    week_start_date DATE NOT NULL,
    week_label TEXT,
    block_label TEXT,
    summary_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_daily_progressions_user_date
    ON public.workout_daily_progressions(user_id, plan_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_daily_progressions_user_exercise
    ON public.workout_daily_progressions(user_id, exercise_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_workout_daily_progressions_user_exercise_date
    ON public.workout_daily_progressions(user_id, exercise_key, plan_date);

CREATE INDEX IF NOT EXISTS idx_workout_weekly_progressions_user_week
    ON public.workout_weekly_progressions(user_id, week_start_date DESC);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.handle_progression_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_workout_daily_progressions_updated_at ON public.workout_daily_progressions;
CREATE TRIGGER handle_workout_daily_progressions_updated_at
    BEFORE UPDATE ON public.workout_daily_progressions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_progression_updated_at();

DROP TRIGGER IF EXISTS handle_workout_weekly_progressions_updated_at ON public.workout_weekly_progressions;
CREATE TRIGGER handle_workout_weekly_progressions_updated_at
    BEFORE UPDATE ON public.workout_weekly_progressions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_progression_updated_at();

ALTER TABLE public.workout_daily_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_weekly_progressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout daily progressions" ON public.workout_daily_progressions
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own workout daily progressions" ON public.workout_daily_progressions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own workout daily progressions" ON public.workout_daily_progressions
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own workout daily progressions" ON public.workout_daily_progressions
    FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own workout weekly progressions" ON public.workout_weekly_progressions
    FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own workout weekly progressions" ON public.workout_weekly_progressions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own workout weekly progressions" ON public.workout_weekly_progressions
    FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own workout weekly progressions" ON public.workout_weekly_progressions
    FOR DELETE USING (auth.uid()::text = user_id);
