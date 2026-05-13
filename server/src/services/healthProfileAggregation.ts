import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import type {
  UnifiedHealthProfile,
  BloodworkSummary,
  SleepSummary,
  BodyCompositionSummary,
  ActivitySummary,
  StressSummary,
  NutritionSummary
} from '../types/holisticHealth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Aggregate bloodwork data into summary
 */
async function aggregateBloodwork(userId: string): Promise<BloodworkSummary | undefined> {
  try {
    const { data: trends } = await supabase
      .from('bloodwork_trends')
      .select('*')
      .eq('user_id', userId)
      .order('calculated_at', { ascending: false })
      .limit(50);

    if (!trends || trends.length === 0) {
      return undefined;
    }

    const { data: latestResults } = await supabase
      .from('bloodwork_results')
      .select('test_date')
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(1)
      .single();

    const markers = trends.map(trend => ({
      name: trend.marker_name,
      normalizedName: trend.marker_name,
      category: trend.category || 'general',
      latestValue: trend.latest_value,
      priorValue: trend.prior_value,
      unit: trend.unit || '',
      trendDirection: trend.trend_direction as 'improving' | 'worsening' | 'stable',
      changePercent: trend.change_percent,
      referenceRangeLow: trend.reference_range_low,
      referenceRangeHigh: trend.reference_range_high,
      abnormalFlag: trend.abnormal_flag,
      isOutOfRange: 
        (trend.reference_range_high && trend.latest_value > trend.reference_range_high) ||
        (trend.reference_range_low && trend.latest_value < trend.reference_range_low) ||
        false
    }));

    return {
      markers,
      lastTestDate: latestResults?.test_date,
      dataPoints: trends.length
    };
  } catch (error) {
    logger.error('Error aggregating bloodwork', { error, userId });
    return undefined;
  }
}

/**
 * Aggregate sleep data into summary
 */
async function aggregateSleep(userId: string): Promise<SleepSummary | undefined> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sleepData } = await supabase
      .from('daily_logs')
      .select('sleep_duration, sleep_quality, date')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .not('sleep_duration', 'is', null)
      .order('date', { ascending: false });

    if (!sleepData || sleepData.length === 0) {
      return undefined;
    }

    const avgDuration = sleepData.reduce((sum, d) => sum + (d.sleep_duration || 0), 0) / sleepData.length;
    const avgQuality = sleepData.reduce((sum, d) => sum + (d.sleep_quality || 0), 0) / sleepData.length;

    const recentAvg = sleepData.slice(0, 7).reduce((sum, d) => sum + (d.sleep_duration || 0), 0) / Math.min(7, sleepData.length);
    const olderAvg = sleepData.slice(7, 14).reduce((sum, d) => sum + (d.sleep_duration || 0), 0) / Math.min(7, sleepData.length - 7);

    let trendDirection: 'improving' | 'worsening' | 'stable' = 'stable';
    if (recentAvg > olderAvg + 0.5) trendDirection = 'improving';
    else if (recentAvg < olderAvg - 0.5) trendDirection = 'worsening';

    return {
      avgDuration,
      avgDeepSleep: 0,
      avgRemSleep: 0,
      avgRestfulness: avgQuality,
      trendDirection,
      lastNightDuration: sleepData[0]?.sleep_duration,
      lastNightQuality: sleepData[0]?.sleep_quality,
      dataPoints: sleepData.length
    };
  } catch (error) {
    logger.error('Error aggregating sleep', { error, userId });
    return undefined;
  }
}

/**
 * Aggregate body composition data into summary
 */
async function aggregateBodyComposition(userId: string): Promise<BodyCompositionSummary | undefined> {
  try {
    const { data: measurements } = await supabase
      .from('body_composition')
      .select('*')
      .eq('user_id', userId)
      .order('measurement_date', { ascending: false })
      .limit(10);

    if (!measurements || measurements.length === 0) {
      return undefined;
    }

    const latest = measurements[0];
    const prior = measurements[1];

    const metrics = [];

    if (latest.weight) {
      metrics.push({
        name: 'Weight',
        latestValue: latest.weight,
        priorValue: prior?.weight,
        unit: 'lbs',
        trendDirection: prior ? (latest.weight > prior.weight ? 'worsening' : latest.weight < prior.weight ? 'improving' : 'stable') : 'stable',
        changePercent: prior ? ((latest.weight - prior.weight) / prior.weight) * 100 : undefined
      });
    }

    if (latest.body_fat_percentage) {
      metrics.push({
        name: 'Body Fat %',
        latestValue: latest.body_fat_percentage,
        priorValue: prior?.body_fat_percentage,
        unit: '%',
        trendDirection: prior ? (latest.body_fat_percentage > prior.body_fat_percentage ? 'worsening' : latest.body_fat_percentage < prior.body_fat_percentage ? 'improving' : 'stable') : 'stable',
        changePercent: prior ? ((latest.body_fat_percentage - prior.body_fat_percentage) / prior.body_fat_percentage) * 100 : undefined
      });
    }

    if (latest.muscle_mass) {
      metrics.push({
        name: 'Muscle Mass',
        latestValue: latest.muscle_mass,
        priorValue: prior?.muscle_mass,
        unit: 'lbs',
        trendDirection: prior ? (latest.muscle_mass > prior.muscle_mass ? 'improving' : latest.muscle_mass < prior.muscle_mass ? 'worsening' : 'stable') : 'stable',
        changePercent: prior ? ((latest.muscle_mass - prior.muscle_mass) / prior.muscle_mass) * 100 : undefined
      });
    }

    return {
      metrics,
      lastMeasurementDate: latest.measurement_date,
      dataPoints: measurements.length
    };
  } catch (error) {
    logger.error('Error aggregating body composition', { error, userId });
    return undefined;
  }
}

/**
 * Aggregate activity data into summary
 */
async function aggregateActivity(userId: string): Promise<ActivitySummary | undefined> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activityData } = await supabase
      .from('daily_logs')
      .select('exercise_duration, exercise_type, date')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .not('exercise_duration', 'is', null)
      .order('date', { ascending: false });

    if (!activityData || activityData.length === 0) {
      return undefined;
    }

    const exerciseDays = activityData.filter(d => d.exercise_duration && d.exercise_duration > 0).length;
    const weeklyExerciseDays = (exerciseDays / 30) * 7;
    const avgDuration = activityData.reduce((sum, d) => sum + (d.exercise_duration || 0), 0) / activityData.length;

    const recentDays = activityData.slice(0, 14).filter(d => d.exercise_duration && d.exercise_duration > 0).length;
    const olderDays = activityData.slice(14, 28).filter(d => d.exercise_duration && d.exercise_duration > 0).length;

    let trendDirection: 'improving' | 'worsening' | 'stable' = 'stable';
    if (recentDays > olderDays + 2) trendDirection = 'improving';
    else if (recentDays < olderDays - 2) trendDirection = 'worsening';

    return {
      weeklyExerciseDays,
      avgIntensity: avgDuration > 45 ? 'high' : avgDuration > 20 ? 'medium' : 'low',
      avgDuration,
      trendDirection,
      dataPoints: activityData.length
    };
  } catch (error) {
    logger.error('Error aggregating activity', { error, userId });
    return undefined;
  }
}

/**
 * Aggregate stress data into summary
 */
async function aggregateStress(userId: string): Promise<StressSummary | undefined> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: stressData } = await supabase
      .from('daily_logs')
      .select('stress_level, date')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .not('stress_level', 'is', null)
      .order('date', { ascending: false });

    if (!stressData || stressData.length === 0) {
      return undefined;
    }

    const avgDailyScore = stressData.reduce((sum, d) => sum + (d.stress_level || 0), 0) / stressData.length;
    const highStressDays = stressData.filter(d => d.stress_level && d.stress_level >= 7).length;

    const recentAvg = stressData.slice(0, 7).reduce((sum, d) => sum + (d.stress_level || 0), 0) / Math.min(7, stressData.length);
    const olderAvg = stressData.slice(7, 14).reduce((sum, d) => sum + (d.stress_level || 0), 0) / Math.min(7, stressData.length - 7);

    let trendDirection: 'improving' | 'worsening' | 'stable' = 'stable';
    if (recentAvg < olderAvg - 1) trendDirection = 'improving';
    else if (recentAvg > olderAvg + 1) trendDirection = 'worsening';

    return {
      avgDailyScore,
      trendDirection,
      highStressDays,
      dataPoints: stressData.length
    };
  } catch (error) {
    logger.error('Error aggregating stress', { error, userId });
    return undefined;
  }
}

/**
 * Aggregate nutrition data into summary
 */
async function aggregateNutrition(userId: string): Promise<NutritionSummary | undefined> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: nutritionData } = await supabase
      .from('daily_logs')
      .select('calories, protein, carbs, fat, date')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .not('calories', 'is', null)
      .order('date', { ascending: false });

    if (!nutritionData || nutritionData.length === 0) {
      return undefined;
    }

    const avgCalories = nutritionData.reduce((sum, d) => sum + (d.calories || 0), 0) / nutritionData.length;
    const avgProtein = nutritionData.reduce((sum, d) => sum + (d.protein || 0), 0) / nutritionData.length;
    const avgCarbs = nutritionData.reduce((sum, d) => sum + (d.carbs || 0), 0) / nutritionData.length;
    const avgFat = nutritionData.reduce((sum, d) => sum + (d.fat || 0), 0) / nutritionData.length;

    return {
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFat,
      dataPoints: nutritionData.length
    };
  } catch (error) {
    logger.error('Error aggregating nutrition', { error, userId });
    return undefined;
  }
}

/**
 * Generate unified health profile for a user
 * Aggregates data from all health systems
 */
export async function generateUnifiedHealthProfile(userId: string): Promise<UnifiedHealthProfile> {
  const startTime = Date.now();

  logger.info('Generating unified health profile', { userId });

  const [bloodwork, sleep, bodyComposition, activity, stress, nutrition] = await Promise.all([
    aggregateBloodwork(userId),
    aggregateSleep(userId),
    aggregateBodyComposition(userId),
    aggregateActivity(userId),
    aggregateStress(userId),
    aggregateNutrition(userId)
  ]);

  const profile: UnifiedHealthProfile = {
    userId,
    bloodwork,
    sleep,
    bodyComposition,
    activity,
    stress,
    nutrition,
    generatedAt: new Date().toISOString(),
    dataCompleteness: {
      bloodwork: !!bloodwork,
      sleep: !!sleep,
      bodyComposition: !!bodyComposition,
      activity: !!activity,
      stress: !!stress,
      nutrition: !!nutrition
    }
  };

  const processingTime = Date.now() - startTime;

  logger.info('Unified health profile generated', {
    userId,
    processingTime,
    dataCompleteness: profile.dataCompleteness
  });

  return profile;
}
