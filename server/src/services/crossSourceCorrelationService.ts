/**
 * Phase 23: Cross-Source Correlation Service
 * 
 * Purpose: Detect patterns and correlations across multiple data sources
 * Features: Sleep-performance correlation, stress-recovery patterns, nutrition-energy links
 */

import { logger } from '../utils/logger';
import type { UnifiedHealthSnapshot } from './unifiedHealthDataService';

// ============================================================================
// TYPES
// ============================================================================

export interface Correlation {
  id: string;
  type: CorrelationType;
  confidence: number; // 0-1
  sources: string[]; // Data sources involved
  pattern: string;
  insight: string;
  recommendation?: string;
  severity: 'info' | 'warning' | 'critical';
}

export type CorrelationType =
  | 'sleep_performance'
  | 'stress_recovery'
  | 'nutrition_energy'
  | 'supplement_adherence'
  | 'workout_recovery'
  | 'pain_workout'
  | 'bloodwork_symptoms'
  | 'wearable_subjective';

export interface CorrelationAnalysis {
  userId: string;
  date: string;
  correlations: Correlation[];
  summary: {
    totalCorrelations: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
  };
}

// ============================================================================
// CORRELATION DETECTION FUNCTIONS
// ============================================================================

/**
 * Detect sleep-performance correlations
 */
function detectSleepPerformanceCorrelation(
  snapshot: UnifiedHealthSnapshot
): Correlation | null {
  const sleepHours = snapshot.dailyLogs.today?.sleep.hours || 
                     snapshot.wearables.appleWatch?.sleepHours ||
                     snapshot.wearables.sleepNumber?.sleepDuration;
  
  const workoutCompleted = snapshot.workouts.today?.completed;
  const workoutIntensity = snapshot.workouts.today?.intensity;

  if (!sleepHours || workoutCompleted === undefined) {
    return null;
  }

  // Poor sleep + high intensity workout = warning
  if (sleepHours < 6 && workoutIntensity && workoutIntensity > 7) {
    return {
      id: 'sleep_perf_1',
      type: 'sleep_performance',
      confidence: 0.85,
      sources: ['dailyLogs', 'workouts', 'wearables'],
      pattern: `Low sleep (${sleepHours}h) with high-intensity workout planned`,
      insight: 'Inadequate sleep may impair workout performance and increase injury risk',
      recommendation: 'Consider reducing workout intensity or prioritizing recovery',
      severity: 'warning',
    };
  }

  // Good sleep + workout adherence = positive
  if (sleepHours >= 7 && workoutCompleted) {
    return {
      id: 'sleep_perf_2',
      type: 'sleep_performance',
      confidence: 0.75,
      sources: ['dailyLogs', 'workouts'],
      pattern: `Adequate sleep (${sleepHours}h) with completed workout`,
      insight: 'Good sleep supporting consistent workout adherence',
      severity: 'info',
    };
  }

  return null;
}

/**
 * Detect stress-recovery correlations
 */
function detectStressRecoveryCorrelation(
  snapshot: UnifiedHealthSnapshot
): Correlation | null {
  const stressLevel = snapshot.interviewSignals.signals.stress?.value ||
                      snapshot.dailyLogs.today?.stress.level;
  
  const recoveryFeeling = snapshot.interviewSignals.signals.recovery?.value ||
                          snapshot.dailyLogs.today?.recovery.feeling;
  
  const hrv = snapshot.wearables.appleWatch?.heartRateVariability ||
              snapshot.wearables.oura?.hrv;

  if (!stressLevel || !recoveryFeeling) {
    return null;
  }

  // High stress + poor recovery = critical
  if (stressLevel >= 7 && recoveryFeeling <= 4) {
    return {
      id: 'stress_rec_1',
      type: 'stress_recovery',
      confidence: 0.9,
      sources: ['interviewSignals', 'dailyLogs', 'wearables'],
      pattern: `High stress (${stressLevel}/10) with poor recovery (${recoveryFeeling}/10)`,
      insight: 'Chronic stress impairing recovery capacity',
      recommendation: 'Prioritize stress management and active recovery techniques',
      severity: 'critical',
    };
  }

  // HRV confirms stress impact
  if (stressLevel >= 7 && hrv && hrv < 30) {
    return {
      id: 'stress_rec_2',
      type: 'stress_recovery',
      confidence: 0.85,
      sources: ['interviewSignals', 'wearables'],
      pattern: `High stress (${stressLevel}/10) with low HRV (${hrv}ms)`,
      insight: 'Wearable data confirms elevated stress response',
      recommendation: 'Consider meditation, breathing exercises, or rest day',
      severity: 'warning',
    };
  }

  return null;
}

/**
 * Detect nutrition-energy correlations
 */
function detectNutritionEnergyCorrelation(
  snapshot: UnifiedHealthSnapshot
): Correlation | null {
  const energyLevel = snapshot.interviewSignals.signals.energy?.value ||
                      snapshot.dailyLogs.today?.energy.level;
  
  const nutritionAdherence = snapshot.nutrition.today?.adherence;
  const proteinIntake = snapshot.nutrition.today?.dailyTotals.protein;

  if (!energyLevel || !nutritionAdherence) {
    return null;
  }

  // Low energy + poor nutrition adherence
  if (energyLevel <= 4 && nutritionAdherence < 60) {
    return {
      id: 'nutr_energy_1',
      type: 'nutrition_energy',
      confidence: 0.8,
      sources: ['interviewSignals', 'nutrition'],
      pattern: `Low energy (${energyLevel}/10) with poor nutrition adherence (${nutritionAdherence}%)`,
      insight: 'Inadequate nutrition may be contributing to low energy',
      recommendation: 'Focus on consistent meal timing and adequate protein intake',
      severity: 'warning',
    };
  }

  // Low protein + low energy
  if (energyLevel <= 4 && proteinIntake && proteinIntake < 100) {
    return {
      id: 'nutr_energy_2',
      type: 'nutrition_energy',
      confidence: 0.75,
      sources: ['interviewSignals', 'nutrition'],
      pattern: `Low energy (${energyLevel}/10) with low protein (${proteinIntake}g)`,
      insight: 'Insufficient protein intake may impact energy levels',
      recommendation: 'Increase protein intake to support energy and recovery',
      severity: 'info',
    };
  }

  return null;
}

/**
 * Detect supplement adherence correlations
 */
function detectSupplementAdherenceCorrelation(
  snapshot: UnifiedHealthSnapshot
): Correlation | null {
  const supplementAdherence = snapshot.supplements.today?.adherence;
  const missedSupplements = snapshot.supplements.today?.missed || [];
  const energyLevel = snapshot.interviewSignals.signals.energy?.value;

  if (!supplementAdherence || supplementAdherence >= 80) {
    return null; // Good adherence, no issue
  }

  // Poor supplement adherence
  if (supplementAdherence < 50 && missedSupplements.length > 2) {
    return {
      id: 'supp_adh_1',
      type: 'supplement_adherence',
      confidence: 0.7,
      sources: ['supplements', 'interviewSignals'],
      pattern: `Low supplement adherence (${supplementAdherence}%), missed: ${missedSupplements.join(', ')}`,
      insight: 'Inconsistent supplement routine may reduce effectiveness',
      recommendation: 'Set reminders or link supplements to existing habits',
      severity: 'info',
    };
  }

  return null;
}

/**
 * Detect workout-recovery correlations
 */
function detectWorkoutRecoveryCorrelation(
  snapshot: UnifiedHealthSnapshot
): Correlation | null {
  const workoutStreak = snapshot.workouts.recent7Days?.streak || 0;
  const recoveryFeeling = snapshot.interviewSignals.signals.recovery?.value ||
                          snapshot.dailyLogs.today?.recovery.feeling;
  const painLocations = snapshot.interviewSignals.signals.pain?.locations || [];

  if (!recoveryFeeling) {
    return null;
  }

  // Long workout streak + poor recovery
  if (workoutStreak >= 5 && recoveryFeeling <= 4) {
    return {
      id: 'workout_rec_1',
      type: 'workout_recovery',
      confidence: 0.85,
      sources: ['workouts', 'interviewSignals'],
      pattern: `${workoutStreak}-day workout streak with poor recovery (${recoveryFeeling}/10)`,
      insight: 'Consecutive workouts without adequate recovery may lead to overtraining',
      recommendation: 'Schedule a rest day or active recovery session',
      severity: 'warning',
    };
  }

  // Workout streak + pain
  if (workoutStreak >= 3 && painLocations.length > 0) {
    return {
      id: 'workout_rec_2',
      type: 'workout_recovery',
      confidence: 0.8,
      sources: ['workouts', 'interviewSignals'],
      pattern: `${workoutStreak}-day streak with pain in: ${painLocations.join(', ')}`,
      insight: 'Pain signals may indicate insufficient recovery between workouts',
      recommendation: 'Consider rest day and monitor pain progression',
      severity: 'warning',
    };
  }

  return null;
}

/**
 * Detect pain-workout correlations
 */
function detectPainWorkoutCorrelation(
  snapshot: UnifiedHealthSnapshot
): Correlation | null {
  const painLocations = snapshot.interviewSignals.signals.pain?.locations || [];
  const painSeverity = snapshot.interviewSignals.signals.pain?.severity;
  const workoutPlanned = snapshot.workouts.today?.completed !== undefined;

  if (painLocations.length === 0 || !painSeverity) {
    return null;
  }

  // Significant pain + workout planned
  if (painSeverity >= 6 && workoutPlanned) {
    return {
      id: 'pain_workout_1',
      type: 'pain_workout',
      confidence: 0.9,
      sources: ['interviewSignals', 'workouts'],
      pattern: `Moderate-severe pain (${painSeverity}/10) in ${painLocations.join(', ')} with workout planned`,
      insight: 'Training through significant pain increases injury risk',
      recommendation: 'Modify or skip workout, consider medical evaluation if pain persists',
      severity: 'critical',
    };
  }

  return null;
}

/**
 * Detect bloodwork-symptoms correlations
 */
function detectBloodworkSymptomsCorrelation(
  snapshot: UnifiedHealthSnapshot
): Correlation | null {
  const bloodwork = snapshot.bloodwork.mostRecent;
  const energyLevel = snapshot.interviewSignals.signals.energy?.value;
  const moodLevel = snapshot.interviewSignals.signals.mood?.value;

  if (!bloodwork) {
    return null;
  }

  // Low vitamin D + low energy/mood
  if (bloodwork.vitaminD && bloodwork.vitaminD < 30 && energyLevel && energyLevel <= 4) {
    return {
      id: 'blood_symp_1',
      type: 'bloodwork_symptoms',
      confidence: 0.85,
      sources: ['bloodwork', 'interviewSignals'],
      pattern: `Low vitamin D (${bloodwork.vitaminD} ng/mL) with low energy (${energyLevel}/10)`,
      insight: 'Vitamin D deficiency commonly associated with fatigue',
      recommendation: 'Consider vitamin D supplementation and sun exposure',
      severity: 'warning',
    };
  }

  // Low iron/ferritin + low energy
  if (bloodwork.ferritin && bloodwork.ferritin < 30 && energyLevel && energyLevel <= 4) {
    return {
      id: 'blood_symp_2',
      type: 'bloodwork_symptoms',
      confidence: 0.9,
      sources: ['bloodwork', 'interviewSignals'],
      pattern: `Low ferritin (${bloodwork.ferritin} ng/mL) with low energy (${energyLevel}/10)`,
      insight: 'Low iron stores can cause persistent fatigue',
      recommendation: 'Discuss iron supplementation with healthcare provider',
      severity: 'warning',
    };
  }

  return null;
}

/**
 * Detect wearable-subjective correlations
 */
function detectWearableSubjectiveCorrelation(
  snapshot: UnifiedHealthSnapshot
): Correlation | null {
  const ouraReadiness = snapshot.wearables.oura?.readinessScore;
  const subjectiveRecovery = snapshot.interviewSignals.signals.recovery?.value ||
                             snapshot.dailyLogs.today?.recovery.feeling;

  if (!ouraReadiness || !subjectiveRecovery) {
    return null;
  }

  // Mismatch: High readiness but low subjective recovery
  if (ouraReadiness >= 80 && subjectiveRecovery <= 4) {
    return {
      id: 'wear_subj_1',
      type: 'wearable_subjective',
      confidence: 0.7,
      sources: ['wearables', 'interviewSignals'],
      pattern: `High Oura readiness (${ouraReadiness}) but low subjective recovery (${subjectiveRecovery}/10)`,
      insight: 'Disconnect between objective and subjective recovery signals',
      recommendation: 'Trust subjective feeling - may indicate stress or other factors not captured by wearable',
      severity: 'info',
    };
  }

  // Mismatch: Low readiness but high subjective recovery
  if (ouraReadiness <= 60 && subjectiveRecovery >= 7) {
    return {
      id: 'wear_subj_2',
      type: 'wearable_subjective',
      confidence: 0.7,
      sources: ['wearables', 'interviewSignals'],
      pattern: `Low Oura readiness (${ouraReadiness}) but high subjective recovery (${subjectiveRecovery}/10)`,
      insight: 'Objective data suggests caution despite feeling good',
      recommendation: 'Consider moderating intensity - wearable may detect subtle fatigue',
      severity: 'info',
    };
  }

  return null;
}

// ============================================================================
// MAIN CORRELATION ANALYSIS
// ============================================================================

/**
 * Analyze unified health snapshot for cross-source correlations
 */
export async function analyzeCorrelations(
  snapshot: UnifiedHealthSnapshot
): Promise<CorrelationAnalysis> {
  logger.info('🔍 [CORRELATION] Analyzing cross-source patterns', {
    userId: snapshot.userId,
    sourcesAvailable: snapshot.dataQuality.sourcesAvailable,
  });

  const correlations: Correlation[] = [];

  // Run all correlation detectors
  const detectors = [
    detectSleepPerformanceCorrelation,
    detectStressRecoveryCorrelation,
    detectNutritionEnergyCorrelation,
    detectSupplementAdherenceCorrelation,
    detectWorkoutRecoveryCorrelation,
    detectPainWorkoutCorrelation,
    detectBloodworkSymptomsCorrelation,
    detectWearableSubjectiveCorrelation,
  ];

  for (const detector of detectors) {
    try {
      const correlation = detector(snapshot);
      if (correlation) {
        correlations.push(correlation);
      }
    } catch (error) {
      logger.warn('⚠️ [CORRELATION] Detector failed', {
        detector: detector.name,
        error: (error as Error).message,
      });
    }
  }

  // Calculate summary
  const summary = {
    totalCorrelations: correlations.length,
    criticalCount: correlations.filter(c => c.severity === 'critical').length,
    warningCount: correlations.filter(c => c.severity === 'warning').length,
    infoCount: correlations.filter(c => c.severity === 'info').length,
  };

  logger.info('✅ [CORRELATION] Analysis complete', {
    userId: snapshot.userId,
    totalCorrelations: summary.totalCorrelations,
    critical: summary.criticalCount,
    warnings: summary.warningCount,
  });

  return {
    userId: snapshot.userId,
    date: snapshot.date,
    correlations,
    summary,
  };
}
