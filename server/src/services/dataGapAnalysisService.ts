/**
 * Phase 25: Data Gap Analysis Service
 * 
 * Purpose: Identify missing data across health categories and prioritize data collection
 * Features: Gap detection, completeness scoring, priority ranking
 */

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { getUnifiedHealthSnapshot } from './unifiedHealthDataService';
import { getCorrelationHistory } from './correlationHistoryService';

// ============================================================================
// TYPES
// ============================================================================

export interface DataGap {
  category: string;
  completeness: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  lastDataPoint?: string;
  daysSinceLastData?: number;
  suggestedQuestions: string[];
}

export interface DataGapAnalysis {
  userId: string;
  analyzedAt: string;
  overallCompleteness: number;
  gaps: DataGap[];
  criticalGaps: DataGap[];
  recommendations: string[];
}

// ============================================================================
// ANALYZE DATA GAPS
// ============================================================================

export async function analyzeDataGaps(userId: string): Promise<DataGapAnalysis> {
  try {
    logger.info('🔍 [DATA GAPS] Analyzing data gaps', { userId });

    const snapshot = await getUnifiedHealthSnapshot(userId);
    const gaps: DataGap[] = [];

    // Analyze each category
    gaps.push(await analyzeInterviewSignals(userId, snapshot));
    gaps.push(await analyzeWearableData(userId, snapshot));
    gaps.push(await analyzeNutritionData(userId, snapshot));
    gaps.push(await analyzeWorkoutData(userId, snapshot));
    gaps.push(await analyzeSupplementData(userId, snapshot));
    gaps.push(await analyzeDailyLogsData(userId, snapshot));
    gaps.push(await analyzeBodyCompositionData(userId, snapshot));
    gaps.push(await analyzeBloodworkData(userId, snapshot));

    // Calculate overall completeness
    const overallCompleteness = gaps.reduce((sum, gap) => sum + gap.completeness, 0) / gaps.length;

    // Identify critical gaps
    const criticalGaps = gaps.filter(g => g.priority === 'critical' || g.priority === 'high');

    // Generate recommendations
    const recommendations = generateRecommendations(gaps);

    const analysis: DataGapAnalysis = {
      userId,
      analyzedAt: new Date().toISOString(),
      overallCompleteness,
      gaps: gaps.sort((a, b) => a.completeness - b.completeness),
      criticalGaps,
      recommendations,
    };

    logger.info('✅ [DATA GAPS] Analysis complete', {
      userId,
      overallCompleteness: `${(overallCompleteness * 100).toFixed(1)}%`,
      criticalGaps: criticalGaps.length,
    });

    return analysis;
  } catch (error) {
    logger.error('❌ [DATA GAPS] Failed to analyze data gaps', {
      error: (error as Error).message,
      userId,
    });
    throw error;
  }
}

// ============================================================================
// CATEGORY-SPECIFIC ANALYSIS
// ============================================================================

async function analyzeInterviewSignals(userId: string, snapshot: any): Promise<DataGap> {
  const signals = snapshot.interviewSignals;
  const hasData = signals.available && signals.recentSignals > 0;
  const daysSince = signals.daysSinceLastSignal || 999;

  return {
    category: 'interview_signals',
    completeness: hasData ? Math.max(0, 1 - (daysSince / 7)) : 0,
    priority: daysSince > 3 ? 'high' : daysSince > 1 ? 'medium' : 'low',
    lastDataPoint: signals.lastSignalDate,
    daysSinceLastData: daysSince,
    suggestedQuestions: [
      'How has your sleep quality been lately?',
      'Have you experienced any unusual stress or mood changes?',
      'How are you feeling about your workout recovery?',
    ],
  };
}

async function analyzeWearableData(userId: string, snapshot: any): Promise<DataGap> {
  const wearables = snapshot.wearables;
  const hasData = wearables.appleWatch.connected || wearables.oura.connected || wearables.sleepNumber.connected;
  const daysSince = wearables.daysSinceLastSync || 999;

  return {
    category: 'wearable_data',
    completeness: hasData ? Math.max(0, 1 - (daysSince / 3)) : 0,
    priority: !hasData ? 'critical' : daysSince > 2 ? 'high' : 'low',
    lastDataPoint: wearables.lastSyncDate,
    daysSinceLastData: daysSince,
    suggestedQuestions: hasData ? [] : [
      'Would you like to connect a wearable device for better tracking?',
      'Can you manually share your sleep data from last night?',
    ],
  };
}

async function analyzeNutritionData(userId: string, snapshot: any): Promise<DataGap> {
  const nutrition = snapshot.nutrition;
  const hasData = nutrition.available && nutrition.recentLogs > 0;
  const daysSince = nutrition.daysSinceLastLog || 999;

  return {
    category: 'nutrition',
    completeness: hasData ? Math.max(0, 1 - (daysSince / 2)) : 0,
    priority: daysSince > 2 ? 'high' : daysSince > 1 ? 'medium' : 'low',
    lastDataPoint: nutrition.lastLogDate,
    daysSinceLastData: daysSince,
    suggestedQuestions: [
      'What did you eat for your meals today?',
      'Have you been following your nutrition plan?',
      'Any challenges with meal prep or adherence?',
    ],
  };
}

async function analyzeWorkoutData(userId: string, snapshot: any): Promise<DataGap> {
  const workouts = snapshot.workouts;
  const hasData = workouts.available && workouts.recentWorkouts > 0;
  const daysSince = workouts.daysSinceLastWorkout || 999;

  return {
    category: 'workouts',
    completeness: hasData ? Math.max(0, 1 - (daysSince / 3)) : 0,
    priority: daysSince > 3 ? 'medium' : 'low',
    lastDataPoint: workouts.lastWorkoutDate,
    daysSinceLastData: daysSince,
    suggestedQuestions: [
      'Have you completed any workouts recently?',
      'How did your last workout feel?',
      'Any soreness or recovery concerns?',
    ],
  };
}

async function analyzeSupplementData(userId: string, snapshot: any): Promise<DataGap> {
  const supplements = snapshot.supplements;
  const hasData = supplements.available && supplements.recentLogs > 0;
  const daysSince = supplements.daysSinceLastLog || 999;

  return {
    category: 'supplements',
    completeness: hasData ? Math.max(0, 1 - (daysSince / 2)) : 0,
    priority: daysSince > 2 ? 'medium' : 'low',
    lastDataPoint: supplements.lastLogDate,
    daysSinceLastData: daysSince,
    suggestedQuestions: [
      'Have you been taking your supplements consistently?',
      'Any side effects or concerns with your supplements?',
    ],
  };
}

async function analyzeDailyLogsData(userId: string, snapshot: any): Promise<DataGap> {
  const dailyLogs = snapshot.dailyLogs;
  const hasData = dailyLogs.available && dailyLogs.recentLogs > 0;
  const daysSince = dailyLogs.daysSinceLastLog || 999;

  return {
    category: 'daily_logs',
    completeness: hasData ? Math.max(0, 1 - (daysSince / 1)) : 0,
    priority: daysSince > 1 ? 'high' : 'low',
    lastDataPoint: dailyLogs.lastLogDate,
    daysSinceLastData: daysSince,
    suggestedQuestions: [
      'How would you rate your energy level today?',
      'How has your mood been?',
      'Any pain or discomfort to report?',
    ],
  };
}

async function analyzeBodyCompositionData(userId: string, snapshot: any): Promise<DataGap> {
  const bodyComp = snapshot.bodyComposition;
  const hasData = bodyComp.available && bodyComp.recentMeasurements > 0;
  const daysSince = bodyComp.daysSinceLastMeasurement || 999;

  return {
    category: 'body_composition',
    completeness: hasData ? Math.max(0, 1 - (daysSince / 7)) : 0,
    priority: daysSince > 14 ? 'medium' : 'low',
    lastDataPoint: bodyComp.lastMeasurementDate,
    daysSinceLastData: daysSince,
    suggestedQuestions: [
      'Have you taken any body measurements recently?',
      'How do you feel about your current physique progress?',
    ],
  };
}

async function analyzeBloodworkData(userId: string, snapshot: any): Promise<DataGap> {
  const bloodwork = snapshot.bloodwork;
  const hasData = bloodwork.available && bloodwork.recentResults > 0;
  const daysSince = bloodwork.daysSinceLastResult || 999;

  return {
    category: 'bloodwork',
    completeness: hasData ? Math.max(0, 1 - (daysSince / 90)) : 0,
    priority: daysSince > 180 ? 'medium' : 'low',
    lastDataPoint: bloodwork.lastResultDate,
    daysSinceLastData: daysSince,
    suggestedQuestions: [
      'Have you had any recent bloodwork done?',
      'Any health markers you\'re concerned about?',
    ],
  };
}

// ============================================================================
// PRIORITIZE DATA GAPS
// ============================================================================

export function prioritizeDataGaps(gaps: DataGap[]): DataGap[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  
  return gaps.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.completeness - b.completeness;
  });
}

// ============================================================================
// GENERATE RECOMMENDATIONS
// ============================================================================

function generateRecommendations(gaps: DataGap[]): string[] {
  const recommendations: string[] = [];
  const criticalGaps = gaps.filter(g => g.priority === 'critical');
  const highGaps = gaps.filter(g => g.priority === 'high');

  if (criticalGaps.length > 0) {
    recommendations.push(
      `Critical: ${criticalGaps.length} data source(s) need immediate attention`
    );
  }

  if (highGaps.length > 0) {
    recommendations.push(
      `High priority: Focus on ${highGaps.map(g => g.category).join(', ')}`
    );
  }

  const lowCompleteness = gaps.filter(g => g.completeness < 0.5);
  if (lowCompleteness.length > 0) {
    recommendations.push(
      `${lowCompleteness.length} categories are less than 50% complete`
    );
  }

  return recommendations;
}

// ============================================================================
// CALCULATE CATEGORY COMPLETENESS
// ============================================================================

export async function calculateCategoryCompleteness(
  userId: string,
  category: string
): Promise<number> {
  try {
    const analysis = await analyzeDataGaps(userId);
    const gap = analysis.gaps.find(g => g.category === category);
    return gap?.completeness || 0;
  } catch (error) {
    logger.error('❌ [DATA GAPS] Failed to calculate category completeness', {
      error: (error as Error).message,
      userId,
      category,
    });
    return 0;
  }
}
