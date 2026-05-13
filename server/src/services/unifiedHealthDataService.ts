/**
 * Phase 23: Unified Health Data Service
 * 
 * Purpose: Aggregate all 10 data sources into a single comprehensive health snapshot
 * Features: Multi-source aggregation, data normalization, cross-source correlation
 * 
 * Data Sources:
 * 1. Interview Signals (Phase 22) - Voice interview structured data
 * 2. Wearable Data - Apple Watch, Oura, Sleep Number
 * 3. Bloodwork Results - Lab results, trends, flags
 * 4. Nutrition Logs - Meals, macros, adherence
 * 5. Workout Logs - Completed workouts, intensity, adherence
 * 6. Supplement Logs - Taken, missed, side effects
 * 7. Daily Logs - Sleep, stress, energy, mood
 * 8. Body Composition - Weight, body fat, muscle mass, measurements
 * 9. Goal Progress - On track, at risk, achieved
 * 10. Control Tower - Component scores, overall status
 */

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { getControlTowerDaily } from './controlTowerDailyService';

// ============================================================================
// TYPES
// ============================================================================

export interface UnifiedHealthSnapshot {
  userId: string;
  date: string;
  generatedAt: string;
  
  // 1. Interview Signals
  interviewSignals: InterviewSignalsData;
  
  // 2. Wearable Data
  wearables: WearableData;
  
  // 3. Bloodwork
  bloodwork: BloodworkData;
  
  // 4. Nutrition
  nutrition: NutritionData;
  
  // 5. Workouts
  workouts: WorkoutData;
  
  // 6. Supplements
  supplements: SupplementData;
  
  // 7. Daily Logs
  dailyLogs: DailyLogsData;
  
  // 8. Body Composition
  bodyComposition: BodyCompositionData;
  
  // 9. Goals
  goals: GoalProgressData;
  
  // 10. Control Tower
  controlTower: ControlTowerData;
  
  // Metadata
  dataQuality: DataQualityMetrics;
}

export interface InterviewSignalsData {
  available: boolean;
  lastInterview?: string;
  signals: {
    sleep?: { value: number; confidence: number; date: string };
    stress?: { value: number; confidence: number; date: string };
    workout?: { barriers: string[]; confidence: number; date: string };
    nutrition?: { adherence: number; confidence: number; date: string };
    supplements?: { adherence: number; confidence: number; date: string };
    energy?: { value: number; confidence: number; date: string };
    mood?: { value: number; confidence: number; date: string };
    pain?: { locations: string[]; severity: number; confidence: number; date: string };
    recovery?: { value: number; confidence: number; date: string };
    sexualHealth?: { value: number; confidence: number; date: string };
  };
  summary: {
    totalSignals: number;
    avgConfidence: number;
    categoriesCovered: string[];
  };
}

export interface WearableData {
  available: boolean;
  appleWatch?: {
    steps: number;
    activeCalories: number;
    heartRateAvg: number;
    heartRateVariability: number;
    sleepHours: number;
    restingHeartRate: number;
    vo2Max?: number;
    date: string;
  };
  oura?: {
    readinessScore: number;
    sleepScore: number;
    activityScore: number;
    hrv: number;
    bodyTemp: number;
    respiratoryRate: number;
    date: string;
  };
  sleepNumber?: {
    sleepScore: number;
    sleepDuration: number;
    sleepQuality: number;
    restfulnessScore: number;
    date: string;
  };
}

export interface BloodworkData {
  available: boolean;
  mostRecent?: {
    date: string;
    testosterone?: number;
    estradiol?: number;
    iron?: number;
    ferritin?: number;
    vitaminD?: number;
    b12?: number;
    thyroid?: { tsh: number; t3: number; t4: number };
    lipids?: { totalCholesterol: number; ldl: number; hdl: number; triglycerides: number };
    glucose?: number;
    hba1c?: number;
    crp?: number;
  };
  flags: string[];
  trends: Array<{ marker: string; direction: 'improving' | 'declining' | 'stable' }>;
}

export interface NutritionData {
  available: boolean;
  today?: {
    meals: Array<{ time: string; calories: number; protein: number; carbs: number; fat: number }>;
    dailyTotals: { calories: number; protein: number; carbs: number; fat: number };
    adherence: number;
    deviations: string[];
  };
  recent7Days?: {
    avgCalories: number;
    avgProtein: number;
    avgAdherence: number;
  };
}

export interface WorkoutData {
  available: boolean;
  today?: {
    completed: boolean;
    type?: string;
    duration?: number;
    intensity?: number;
    volume?: number;
  };
  recent7Days?: {
    adherence: number;
    totalWorkouts: number;
    avgDuration: number;
    streak: number;
  };
}

export interface SupplementData {
  available: boolean;
  today?: {
    taken: string[];
    missed: string[];
    adherence: number;
    sideEffects: Array<{ supplement: string; effect: string }>;
  };
  recent7Days?: {
    avgAdherence: number;
    mostMissed: string[];
  };
}

export interface DailyLogsData {
  available: boolean;
  today?: {
    sleep: { hours: number; quality: number };
    stress: { level: number };
    energy: { level: number };
    mood: { level: number };
    recovery: { feeling: number };
  };
  recent7Days?: {
    avgSleepHours: number;
    avgSleepQuality: number;
    avgStress: number;
    avgEnergy: number;
    avgMood: number;
  };
}

export interface BodyCompositionData {
  available: boolean;
  latest?: {
    date: string;
    weight: number;
    bodyFatPercentage?: number;
    muscleMass?: number;
    visceralFat?: number;
    measurements?: {
      chest?: number;
      waist?: number;
      hips?: number;
      thighs?: number;
      arms?: number;
    };
  };
  trends?: {
    weightChange: number;        // vs last week
    bodyFatChange?: number;       // vs last week
    muscleMassChange?: number;    // vs last week
  };
}

export interface GoalProgressData {
  available: boolean;
  summary?: {
    total: number;
    onTrack: number;
    atRisk: number;
    achieved: number;
  };
  details?: Array<{
    goal: string;
    status: string;
    progress: number;
    target: number;
  }>;
}

export interface ControlTowerData {
  available: boolean;
  overallStatus?: string;
  headline?: string;
  hasMetabolic?: boolean;
  hasCardiovascular?: boolean;
  hasSexualHealth?: boolean;
  priorityCount?: number;
}

export interface DataQualityMetrics {
  sourcesAvailable: number;
  totalSources: number;
  completeness: number;  // 0-1
  freshness: {
    interview: string | null;     // 'today', 'yesterday', '2 days ago', etc.
    wearables: string | null;
    bloodwork: string | null;
    nutrition: string | null;
    workouts: string | null;
    supplements: string | null;
    dailyLogs: string | null;
    bodyComposition: string | null;
    goals: string | null;
    controlTower: string | null;
  };
}

// ============================================================================
// DATA AGGREGATION FUNCTIONS
// ============================================================================

/**
 * 1. Get Interview Signals Data
 */
async function getInterviewSignalsData(
  userId: string,
  date: string
): Promise<InterviewSignalsData> {
  try {
    const { data, error } = await supabase
      .from('interview_signals')
      .select('*')
      .eq('user_id', userId)
      .gte('signal_date', date)
      .lte('signal_date', date)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return {
        available: false,
        signals: {},
        summary: { totalSignals: 0, avgConfidence: 0, categoriesCovered: [] },
      };
    }

    // Group signals by category and get latest for each
    const signalsByCategory: any = {};
    const categories = new Set<string>();
    let totalConfidence = 0;

    data.forEach(signal => {
      categories.add(signal.category);
      totalConfidence += signal.confidence;

      if (!signalsByCategory[signal.category]) {
        signalsByCategory[signal.category] = {
          value: signal.numeric_value,
          barriers: signal.array_value ? JSON.parse(signal.array_value) : undefined,
          locations: signal.array_value ? JSON.parse(signal.array_value) : undefined,
          severity: signal.numeric_value,
          adherence: signal.numeric_value,
          confidence: signal.confidence,
          date: signal.signal_date,
        };
      }
    });

    return {
      available: true,
      lastInterview: data[0]?.created_at,
      signals: signalsByCategory,
      summary: {
        totalSignals: data.length,
        avgConfidence: totalConfidence / data.length,
        categoriesCovered: Array.from(categories),
      },
    };
  } catch (error) {
    logger.error('❌ [UNIFIED] Failed to get interview signals', {
      error: (error as Error).message,
    });
    return {
      available: false,
      signals: {},
      summary: { totalSignals: 0, avgConfidence: 0, categoriesCovered: [] },
    };
  }
}

/**
 * 2. Get Wearable Data
 */
async function getWearableData(
  userId: string,
  date: string
): Promise<WearableData> {
  try {
    const [appleWatch, oura, sleepNumber] = await Promise.all([
      // Apple Watch
      supabase
        .from('apple_watch_data')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single(),
      // Oura
      supabase
        .from('oura_daily_data')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single(),
      // Sleep Number
      supabase
        .from('sleep_number_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single(),
    ]);

    return {
      available: !!(appleWatch.data || oura.data || sleepNumber.data),
      appleWatch: appleWatch.data ? {
        steps: appleWatch.data.steps,
        activeCalories: appleWatch.data.active_calories,
        heartRateAvg: appleWatch.data.heart_rate_avg,
        heartRateVariability: appleWatch.data.hrv,
        sleepHours: appleWatch.data.sleep_hours,
        restingHeartRate: appleWatch.data.resting_heart_rate,
        vo2Max: appleWatch.data.vo2_max,
        date: appleWatch.data.date,
      } : undefined,
      oura: oura.data ? {
        readinessScore: oura.data.readiness_score,
        sleepScore: oura.data.sleep_score,
        activityScore: oura.data.activity_score,
        hrv: oura.data.hrv,
        bodyTemp: oura.data.body_temperature,
        respiratoryRate: oura.data.respiratory_rate,
        date: oura.data.date,
      } : undefined,
      sleepNumber: sleepNumber.data ? {
        sleepScore: sleepNumber.data.sleep_score,
        sleepDuration: sleepNumber.data.duration_hours,
        sleepQuality: sleepNumber.data.quality_score,
        restfulnessScore: sleepNumber.data.restfulness_score,
        date: sleepNumber.data.date,
      } : undefined,
    };
  } catch (error) {
    logger.error('❌ [UNIFIED] Failed to get wearable data', {
      error: (error as Error).message,
    });
    return { available: false };
  }
}

/**
 * 3. Get Bloodwork Data
 */
async function getBloodworkData(userId: string): Promise<BloodworkData> {
  try {
    const { data, error } = await supabase
      .from('bloodwork_results')
      .select('*')
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return { available: false, flags: [], trends: [] };
    }

    return {
      available: true,
      mostRecent: {
        date: data.test_date,
        testosterone: data.testosterone,
        estradiol: data.estradiol,
        iron: data.iron,
        ferritin: data.ferritin,
        vitaminD: data.vitamin_d,
        b12: data.b12,
        thyroid: data.tsh ? { tsh: data.tsh, t3: data.t3, t4: data.t4 } : undefined,
        lipids: data.total_cholesterol ? {
          totalCholesterol: data.total_cholesterol,
          ldl: data.ldl,
          hdl: data.hdl,
          triglycerides: data.triglycerides,
        } : undefined,
        glucose: data.glucose,
        hba1c: data.hba1c,
        crp: data.crp,
      },
      flags: data.flags || [],
      trends: data.trends || [],
    };
  } catch (error) {
    logger.error('❌ [UNIFIED] Failed to get bloodwork data', {
      error: (error as Error).message,
    });
    return { available: false, flags: [], trends: [] };
  }
}

/**
 * 4. Get Nutrition Data
 */
async function getNutritionData(
  userId: string,
  date: string
): Promise<NutritionData> {
  try {
    const { data: todayData } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);

    const { data: recent7Days } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('date', date);

    if (!todayData || todayData.length === 0) {
      return { available: false };
    }

    const dailyTotals = todayData.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      available: true,
      today: {
        meals: todayData.map(m => ({
          time: m.meal_time,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
        })),
        dailyTotals,
        adherence: todayData[0]?.adherence || 0,
        deviations: todayData[0]?.deviations || [],
      },
      recent7Days: recent7Days && recent7Days.length > 0 ? {
        avgCalories: recent7Days.reduce((sum, d) => sum + (d.calories || 0), 0) / recent7Days.length,
        avgProtein: recent7Days.reduce((sum, d) => sum + (d.protein || 0), 0) / recent7Days.length,
        avgAdherence: recent7Days.reduce((sum, d) => sum + (d.adherence || 0), 0) / recent7Days.length,
      } : undefined,
    };
  } catch (error) {
    logger.error('❌ [UNIFIED] Failed to get nutrition data', {
      error: (error as Error).message,
    });
    return { available: false };
  }
}

/**
 * 5. Get Workout Data
 */
async function getWorkoutData(
  userId: string,
  date: string
): Promise<WorkoutData> {
  try {
    const { data: todayData } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    const { data: recent7Days } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('date', date);

    return {
      available: !!todayData || (recent7Days && recent7Days.length > 0),
      today: todayData ? {
        completed: todayData.completed,
        type: todayData.workout_type,
        duration: todayData.duration_minutes,
        intensity: todayData.intensity,
        volume: todayData.volume,
      } : undefined,
      recent7Days: recent7Days && recent7Days.length > 0 ? {
        adherence: (recent7Days.filter(w => w.completed).length / 7) * 100,
        totalWorkouts: recent7Days.filter(w => w.completed).length,
        avgDuration: recent7Days.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) / recent7Days.length,
        streak: calculateStreak(recent7Days),
      } : undefined,
    };
  } catch (error) {
    logger.error('❌ [UNIFIED] Failed to get workout data', {
      error: (error as Error).message,
    });
    return { available: false };
  }
}

/**
 * 6. Get Supplement Data
 */
async function getSupplementData(
  userId: string,
  date: string
): Promise<SupplementData> {
  try {
    const { data: todayData } = await supabase
      .from('supplement_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);

    const { data: recent7Days } = await supabase
      .from('supplement_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('date', date);

    if (!todayData || todayData.length === 0) {
      return { available: false };
    }

    return {
      available: true,
      today: {
        taken: todayData.filter(s => s.taken).map(s => s.supplement_name),
        missed: todayData.filter(s => !s.taken).map(s => s.supplement_name),
        adherence: (todayData.filter(s => s.taken).length / todayData.length) * 100,
        sideEffects: todayData.filter(s => s.side_effects).map(s => ({
          supplement: s.supplement_name,
          effect: s.side_effects,
        })),
      },
      recent7Days: recent7Days && recent7Days.length > 0 ? {
        avgAdherence: (recent7Days.filter(s => s.taken).length / recent7Days.length) * 100,
        mostMissed: getMostMissed(recent7Days),
      } : undefined,
    };
  } catch (error) {
    logger.error('❌ [UNIFIED] Failed to get supplement data', {
      error: (error as Error).message,
    });
    return { available: false };
  }
}

/**
 * 7. Get Daily Logs Data
 */
async function getDailyLogsData(
  userId: string,
  date: string
): Promise<DailyLogsData> {
  try {
    const { data: todayData } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    const { data: recent7Days } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('date', date);

    return {
      available: !!todayData || (recent7Days && recent7Days.length > 0),
      today: todayData ? {
        sleep: { hours: todayData.sleep_hours, quality: todayData.sleep_quality },
        stress: { level: todayData.stress_level },
        energy: { level: todayData.energy_level },
        mood: { level: todayData.mood_level },
        recovery: { feeling: todayData.recovery_feeling },
      } : undefined,
      recent7Days: recent7Days && recent7Days.length > 0 ? {
        avgSleepHours: recent7Days.reduce((sum, d) => sum + (d.sleep_hours || 0), 0) / recent7Days.length,
        avgSleepQuality: recent7Days.reduce((sum, d) => sum + (d.sleep_quality || 0), 0) / recent7Days.length,
        avgStress: recent7Days.reduce((sum, d) => sum + (d.stress_level || 0), 0) / recent7Days.length,
        avgEnergy: recent7Days.reduce((sum, d) => sum + (d.energy_level || 0), 0) / recent7Days.length,
        avgMood: recent7Days.reduce((sum, d) => sum + (d.mood_level || 0), 0) / recent7Days.length,
      } : undefined,
    };
  } catch (error) {
    logger.error('❌ [UNIFIED] Failed to get daily logs data', {
      error: (error as Error).message,
    });
    return { available: false };
  }
}

/**
 * 8. Get Body Composition Data
 */
async function getBodyCompositionData(userId: string): Promise<BodyCompositionData> {
  try {
    const { data: latest } = await supabase
      .from('body_composition')
      .select('*')
      .eq('user_id', userId)
      .order('measurement_date', { ascending: false })
      .limit(1)
      .single();

    const { data: lastWeek } = await supabase
      .from('body_composition')
      .select('*')
      .eq('user_id', userId)
      .lte('measurement_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('measurement_date', { ascending: false })
      .limit(1)
      .single();

    if (!latest) {
      return { available: false };
    }

    return {
      available: true,
      latest: {
        date: latest.measurement_date,
        weight: latest.weight,
        bodyFatPercentage: latest.body_fat_percentage,
        muscleMass: latest.muscle_mass,
        visceralFat: latest.visceral_fat,
        measurements: {
          chest: latest.chest,
          waist: latest.waist,
          hips: latest.hips,
          thighs: latest.thighs,
          arms: latest.arms,
        },
      },
      trends: lastWeek ? {
        weightChange: latest.weight - lastWeek.weight,
        bodyFatChange: latest.body_fat_percentage ? latest.body_fat_percentage - (lastWeek.body_fat_percentage || 0) : undefined,
        muscleMassChange: latest.muscle_mass ? latest.muscle_mass - (lastWeek.muscle_mass || 0) : undefined,
      } : undefined,
    };
  } catch (error) {
    logger.error('❌ [UNIFIED] Failed to get body composition data', {
      error: (error as Error).message,
    });
    return { available: false };
  }
}

/**
 * 9. Get Goal Progress Data
 */
async function getGoalProgressData(userId: string): Promise<GoalProgressData> {
  try {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (!data || data.length === 0) {
      return { available: false };
    }

    const summary = {
      total: data.length,
      onTrack: data.filter(g => g.progress_status === 'on_track').length,
      atRisk: data.filter(g => g.progress_status === 'at_risk').length,
      achieved: data.filter(g => g.progress_status === 'achieved').length,
    };

    const details = data.map(g => ({
      goal: g.goal_name,
      status: g.progress_status,
      progress: g.current_value,
      target: g.target_value,
    }));

    return {
      available: true,
      summary,
      details,
    };
  } catch (error) {
    logger.error('❌ [UNIFIED] Failed to get goal progress data', {
      error: (error as Error).message,
    });
    return { available: false };
  }
}

/**
 * 10. Get Control Tower Data
 */
async function getControlTowerDataSnapshot(userId: string): Promise<ControlTowerData> {
  try {
    const controlTower = await getControlTowerDaily(userId);

    if (!controlTower) {
      return { available: false };
    }

    return {
      available: true,
      overallStatus: controlTower.overallStatus,
      headline: controlTower.headline,
      hasMetabolic: !!controlTower.metabolic,
      hasCardiovascular: !!controlTower.cardiovascular,
      hasSexualHealth: !!controlTower.sexualHealth,
      priorityCount: controlTower.priorities?.length || 0,
    };
  } catch (error) {
    logger.error('❌ [UNIFIED] Failed to get control tower data', {
      error: (error as Error).message,
    });
    return { available: false };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateStreak(workouts: any[]): number {
  let streak = 0;
  const sortedWorkouts = workouts.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  for (const workout of sortedWorkouts) {
    if (workout.completed) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function getMostMissed(supplements: any[]): string[] {
  const missedCounts: Record<string, number> = {};
  
  supplements.forEach(s => {
    if (!s.taken) {
      missedCounts[s.supplement_name] = (missedCounts[s.supplement_name] || 0) + 1;
    }
  });
  
  return Object.entries(missedCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);
}

function calculateDataQuality(snapshot: UnifiedHealthSnapshot): DataQualityMetrics {
  const sources = [
    snapshot.interviewSignals.available,
    snapshot.wearables.available,
    snapshot.bloodwork.available,
    snapshot.nutrition.available,
    snapshot.workouts.available,
    snapshot.supplements.available,
    snapshot.dailyLogs.available,
    snapshot.bodyComposition.available,
    snapshot.goals.available,
    snapshot.controlTower.available,
  ];
  
  const sourcesAvailable = sources.filter(Boolean).length;
  const totalSources = sources.length;
  const completeness = sourcesAvailable / totalSources;
  
  return {
    sourcesAvailable,
    totalSources,
    completeness,
    freshness: {
      interview: snapshot.interviewSignals.lastInterview ? 'today' : null,
      wearables: snapshot.wearables.appleWatch?.date || snapshot.wearables.oura?.date || null,
      bloodwork: snapshot.bloodwork.mostRecent?.date || null,
      nutrition: snapshot.nutrition.today ? 'today' : null,
      workouts: snapshot.workouts.today ? 'today' : null,
      supplements: snapshot.supplements.today ? 'today' : null,
      dailyLogs: snapshot.dailyLogs.today ? 'today' : null,
      bodyComposition: snapshot.bodyComposition.latest?.date || null,
      goals: snapshot.goals.available ? 'current' : null,
      controlTower: snapshot.controlTower.available ? 'today' : null,
    },
  };
}

// ============================================================================
// MAIN AGGREGATION FUNCTION
// ============================================================================

/**
 * Get unified health snapshot for a user on a specific date
 */
export async function getUnifiedHealthSnapshot(
  userId: string,
  date?: string
): Promise<UnifiedHealthSnapshot> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  logger.info('🔄 [UNIFIED] Aggregating health data from all sources', {
    userId,
    date: targetDate,
  });
  
  try {
    // Aggregate all data sources in parallel
    const [
      interviewSignals,
      wearables,
      bloodwork,
      nutrition,
      workouts,
      supplements,
      dailyLogs,
      bodyComposition,
      goals,
      controlTower,
    ] = await Promise.all([
      getInterviewSignalsData(userId, targetDate),
      getWearableData(userId, targetDate),
      getBloodworkData(userId),
      getNutritionData(userId, targetDate),
      getWorkoutData(userId, targetDate),
      getSupplementData(userId, targetDate),
      getDailyLogsData(userId, targetDate),
      getBodyCompositionData(userId),
      getGoalProgressData(userId),
      getControlTowerDataSnapshot(userId),
    ]);
    
    const snapshot: UnifiedHealthSnapshot = {
      userId,
      date: targetDate,
      generatedAt: new Date().toISOString(),
      interviewSignals,
      wearables,
      bloodwork,
      nutrition,
      workouts,
      supplements,
      dailyLogs,
      bodyComposition,
      goals,
      controlTower,
      dataQuality: {} as DataQualityMetrics, // Will be calculated next
    };
    
    // Calculate data quality metrics
    snapshot.dataQuality = calculateDataQuality(snapshot);
    
    logger.info('✅ [UNIFIED] Health data aggregation complete', {
      userId,
      sourcesAvailable: snapshot.dataQuality.sourcesAvailable,
      completeness: `${(snapshot.dataQuality.completeness * 100).toFixed(1)}%`,
    });
    
    return snapshot;
  } catch (error) {
    logger.error('❌ [UNIFIED] Failed to aggregate health data', {
      error: (error as Error).message,
      userId,
      date: targetDate,
    });
    throw error;
  }
}
