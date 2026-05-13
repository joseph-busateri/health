/**
 * Recommendation Analysis Service
 * 
 * Interprets DailyHealthSnapshot and engine outputs to identify recommendation opportunities.
 * Builds structured evidence for AI enrichment.
 * 
 * Responsibilities:
 * - Analyze health snapshots
 * - Identify recommendation triggers
 * - Build structured evidence
 * - Calculate deterministic fields (priority, urgency, confidence)
 * - Does NOT generate user-facing text (that's AI's job)
 */

import { logger } from '../utils/logger';
import type { DailyHealthSnapshot } from '../types/dailyHealthSnapshot';
import type { RecoveryRecord } from '../types/recoveryEngine';
import type { RecommendationEvidence } from '../types/recommendationSchema';

// ============================================================================
// ANALYSIS THRESHOLDS
// ============================================================================

const THRESHOLDS = {
  recovery: {
    poor: 45,
    moderate: 75,
  },
  hrv: {
    low: 50,
    optimal: 70,
  },
  sleep: {
    insufficient: 6,
    optimal: 7,
  },
  stress: {
    high: 3,
    veryHigh: 4,
  },
  cardiovascular: {
    elevated: 60,
    high: 75,
  },
  metabolic: {
    atRisk: 60,
    impaired: 75,
  },
};

// ============================================================================
// RECOVERY ANALYSIS
// ============================================================================

/**
 * Analyze recovery record and generate recommendation evidence
 */
export function analyzeRecoveryRecord(
  record: RecoveryRecord,
  userId: string
): RecommendationEvidence | null {
  const { recoveryScore, recoveryStatus, sourceInputs } = record;
  
  // Only generate recommendation if recovery is poor or moderate
  if (recoveryScore >= THRESHOLDS.recovery.moderate) {
    return null; // Recovery is good, no recommendation needed
  }
  
  // Identify contributing factors
  const contributingFactors = [];
  
  if (sourceInputs.hrv && sourceInputs.hrv < THRESHOLDS.hrv.low) {
    contributingFactors.push({
      metric: 'hrv',
      value: sourceInputs.hrv,
      threshold: THRESHOLDS.hrv.low,
      status: 'low' as const,
      importance: 'primary' as const,
    });
  }
  
  if (sourceInputs.sleepDurationHours && sourceInputs.sleepDurationHours < THRESHOLDS.sleep.insufficient) {
    contributingFactors.push({
      metric: 'sleep_duration',
      value: sourceInputs.sleepDurationHours,
      threshold: THRESHOLDS.sleep.insufficient,
      status: 'low' as const,
      importance: 'primary' as const,
    });
  }
  
  if (sourceInputs.sleepQuality && sourceInputs.sleepQuality <= 2) {
    contributingFactors.push({
      metric: 'sleep_quality',
      value: sourceInputs.sleepQuality,
      threshold: 3,
      status: 'low' as const,
      importance: 'secondary' as const,
    });
  }
  
  if (sourceInputs.stressLevel && sourceInputs.stressLevel >= THRESHOLDS.stress.high) {
    contributingFactors.push({
      metric: 'stress_level',
      value: sourceInputs.stressLevel,
      threshold: THRESHOLDS.stress.high,
      status: 'high' as const,
      importance: 'secondary' as const,
    });
  }
  
  if (sourceInputs.workoutLoad && sourceInputs.workoutLoad >= 8) {
    contributingFactors.push({
      metric: 'workout_load',
      value: sourceInputs.workoutLoad,
      threshold: 8,
      status: 'high' as const,
      importance: 'tertiary' as const,
    });
  }
  
  // Calculate deterministic fields
  const priority = recoveryScore < THRESHOLDS.recovery.poor ? 'important' : 'optimization';
  const urgencyScore = Math.round(100 - recoveryScore); // Lower recovery = higher urgency
  
  // Calculate confidence based on available data
  const requiredDataPoints = 8;
  const availableDataPoints = Object.values(sourceInputs).filter(v => v !== undefined && v !== null).length;
  const dataAvailability = availableDataPoints / requiredDataPoints;
  
  const confidenceLevel = dataAvailability >= 0.8 ? 'high' : dataAvailability >= 0.5 ? 'medium' : 'low';
  const dataQualityScore = Math.round(dataAvailability * 90 + 10); // 10-100 range
  
  // Build evidence
  const evidence: RecommendationEvidence = {
    sourceEngine: 'recovery',
    sourceRecordId: record.id,
    userId,
    trigger: recoveryStatus,
    recommendationType: 'workout_modification',
    primaryMetric: {
      name: 'recovery_score',
      value: recoveryScore,
      status: recoveryStatus,
      threshold: THRESHOLDS.recovery.moderate,
    },
    contributingFactors,
    priority,
    urgencyScore,
    category: 'workout_modification',
    actionType: recoveryScore < THRESHOLDS.recovery.poor ? 'modify' : 'decrease',
    actionTarget: 'Today\'s Workout',
    confidenceLevel,
    dataQualityScore,
  };
  
  logger.info('Recovery analysis complete', {
    userId,
    recoveryScore,
    priority,
    urgencyScore,
    factorCount: contributingFactors.length,
  });
  
  return evidence;
}

// ============================================================================
// SNAPSHOT ANALYSIS
// ============================================================================

/**
 * Analyze complete DailyHealthSnapshot for recommendation opportunities
 */
export function analyzeDailyHealthSnapshot(
  snapshot: DailyHealthSnapshot
): RecommendationEvidence[] {
  const evidenceList: RecommendationEvidence[] = [];
  
  // Analyze recovery
  if (snapshot.recovery) {
    const recoveryEvidence = analyzeRecoveryFromSnapshot(snapshot);
    if (recoveryEvidence) {
      evidenceList.push(recoveryEvidence);
    }
  }
  
  // Analyze cardiovascular
  if (snapshot.cardiovascular) {
    const cvEvidence = analyzeCardiovascularFromSnapshot(snapshot);
    if (cvEvidence) {
      evidenceList.push(cvEvidence);
    }
  }
  
  // Analyze metabolic
  if (snapshot.metabolic) {
    const metabolicEvidence = analyzeMetabolicFromSnapshot(snapshot);
    if (metabolicEvidence) {
      evidenceList.push(metabolicEvidence);
    }
  }
  
  // Analyze holistic (cross-engine patterns)
  const holisticEvidence = analyzeHolisticPatterns(snapshot);
  evidenceList.push(...holisticEvidence);
  
  logger.info('Snapshot analysis complete', {
    userId: snapshot.userId,
    evidenceCount: evidenceList.length,
  });
  
  return evidenceList;
}

/**
 * Analyze recovery from snapshot
 */
function analyzeRecoveryFromSnapshot(snapshot: DailyHealthSnapshot): RecommendationEvidence | null {
  const recovery = snapshot.recovery;
  if (!recovery || recovery.score === null) return null;
  
  if (recovery.score >= THRESHOLDS.recovery.moderate) {
    return null; // Recovery is good
  }
  
  const contributingFactors = [];
  
  // Add contributing factors from snapshot
  if (recovery.hrv && recovery.hrv < THRESHOLDS.hrv.low) {
    contributingFactors.push({
      metric: 'hrv',
      value: recovery.hrv,
      threshold: THRESHOLDS.hrv.low,
      status: 'low' as const,
      importance: 'primary' as const,
    });
  }
  
  if (recovery.sleepHours && recovery.sleepHours < THRESHOLDS.sleep.insufficient) {
    contributingFactors.push({
      metric: 'sleep_duration',
      value: recovery.sleepHours,
      threshold: THRESHOLDS.sleep.insufficient,
      status: 'low' as const,
      importance: 'primary' as const,
    });
  }
  
  if (recovery.sleepQuality && recovery.sleepQuality <= 2) {
    contributingFactors.push({
      metric: 'sleep_quality',
      value: recovery.sleepQuality,
      threshold: 3,
      status: 'low' as const,
      importance: 'secondary' as const,
    });
  }
  
  return {
    sourceEngine: 'recovery',
    userId: snapshot.userId,
    trigger: recovery.status === 'at_risk' || recovery.status === 'critical' ? 'poor_recovery' : 'moderate_recovery',
    recommendationType: 'workout_modification',
    primaryMetric: {
      name: 'recovery_score',
      value: recovery.score,
      status: recovery.status,
      threshold: THRESHOLDS.recovery.moderate,
    },
    contributingFactors,
    priority: recovery.score < THRESHOLDS.recovery.poor ? 'important' : 'optimization',
    urgencyScore: Math.round(100 - recovery.score),
    category: 'workout_modification',
    actionType: 'modify',
    actionTarget: 'Today\'s Workout',
    confidenceLevel: recovery.confidence,
    dataQualityScore: 85,
  };
}

/**
 * Analyze cardiovascular from snapshot
 */
function analyzeCardiovascularFromSnapshot(snapshot: DailyHealthSnapshot): RecommendationEvidence | null {
  const cv = snapshot.cardiovascular;
  if (!cv || cv.riskScore === null) return null;
  
  if (cv.riskScore < THRESHOLDS.cardiovascular.elevated) {
    return null; // CV risk is normal
  }
  
  const contributingFactors = [];
  
  if (cv.bloodPressure) {
    const { systolic, diastolic } = cv.bloodPressure;
    if (systolic && systolic >= 130) {
      contributingFactors.push({
        metric: 'systolic_bp',
        value: systolic,
        threshold: 130,
        status: 'high' as const,
        importance: 'primary' as const,
      });
    }
    if (diastolic && diastolic >= 85) {
      contributingFactors.push({
        metric: 'diastolic_bp',
        value: diastolic,
        threshold: 85,
        status: 'high' as const,
        importance: 'primary' as const,
      });
    }
  }
  
  const priority = cv.riskScore >= THRESHOLDS.cardiovascular.high ? 'critical' : 'important';
  
  return {
    sourceEngine: 'cardiovascular',
    userId: snapshot.userId,
    trigger: 'elevated_cardiovascular_risk',
    recommendationType: cv.riskScore >= THRESHOLDS.cardiovascular.high ? 'medical_consultation' : 'lifestyle_change',
    primaryMetric: {
      name: 'cardiovascular_risk_score',
      value: cv.riskScore,
      status: cv.riskLevel,
      threshold: THRESHOLDS.cardiovascular.elevated,
    },
    contributingFactors,
    priority,
    urgencyScore: Math.round(cv.riskScore),
    category: cv.riskScore >= THRESHOLDS.cardiovascular.high ? 'medical_consultation' : 'lifestyle_change',
    actionType: 'consult',
    actionTarget: 'Healthcare Provider',
    confidenceLevel: cv.confidence,
    dataQualityScore: 80,
  };
}

/**
 * Analyze metabolic from snapshot
 */
function analyzeMetabolicFromSnapshot(snapshot: DailyHealthSnapshot): RecommendationEvidence | null {
  const metabolic = snapshot.metabolic;
  if (!metabolic || metabolic.score === null) return null;
  
  if (metabolic.score >= THRESHOLDS.metabolic.atRisk) {
    return null; // Metabolic health is good
  }
  
  const contributingFactors = [];
  
  if (metabolic.glucose?.fasting && metabolic.glucose.fasting >= 100) {
    contributingFactors.push({
      metric: 'fasting_glucose',
      value: metabolic.glucose.fasting,
      threshold: 100,
      status: 'high' as const,
      importance: 'primary' as const,
    });
  }
  
  if (metabolic.a1c?.value && metabolic.a1c.value >= 5.7) {
    contributingFactors.push({
      metric: 'a1c',
      value: metabolic.a1c.value,
      threshold: 5.7,
      status: 'high' as const,
      importance: 'primary' as const,
    });
  }
  
  const priority = metabolic.score < 40 ? 'critical' : 'important';
  
  return {
    sourceEngine: 'metabolic',
    userId: snapshot.userId,
    trigger: 'metabolic_risk',
    recommendationType: 'health_monitoring',
    primaryMetric: {
      name: 'metabolic_score',
      value: metabolic.score,
      status: metabolic.status,
      threshold: THRESHOLDS.metabolic.atRisk,
    },
    contributingFactors,
    priority,
    urgencyScore: Math.round(100 - metabolic.score),
    category: 'health_monitoring',
    actionType: 'monitor',
    actionTarget: 'Blood Glucose',
    confidenceLevel: metabolic.confidence,
    dataQualityScore: 70,
  };
}

/**
 * Analyze holistic patterns across engines
 */
function analyzeHolisticPatterns(snapshot: DailyHealthSnapshot): RecommendationEvidence[] {
  const evidenceList: RecommendationEvidence[] = [];
  
  // Pattern: High fatigue risk + poor recovery + high stress
  if (
    snapshot.derivedIntelligence?.fatigueRisk === 'high' &&
    snapshot.recovery?.score !== null &&
    snapshot.recovery.score < 50 &&
    snapshot.stress?.score !== null &&
    snapshot.stress.score < 30 // Note: stress score is 0-100 where higher = less stress
  ) {
    evidenceList.push({
      sourceEngine: 'holistic',
      userId: snapshot.userId,
      trigger: 'accumulated_fatigue_pattern',
      recommendationType: 'recovery_protocol',
      primaryMetric: {
        name: 'fatigue_risk',
        value: 100,
        status: 'high',
      },
      contributingFactors: [
        {
          metric: 'recovery_score',
          value: snapshot.recovery.score,
          threshold: 50,
          status: 'low',
          importance: 'primary',
        },
        {
          metric: 'stress_score',
          value: snapshot.stress.score,
          threshold: 30,
          status: 'low',
          importance: 'primary',
        },
      ],
      priority: 'important',
      urgencyScore: 85,
      category: 'recovery_protocol',
      actionType: 'start',
      actionTarget: 'Recovery Protocol',
      confidenceLevel: 'high',
      dataQualityScore: 90,
    });
  }
  
  return evidenceList;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate data quality score from multiple factors
 */
export function calculateDataQuality(factors: {
  dataAvailability: number; // 0-1
  dataRecency: number; // 0-1
  dataAccuracy: number; // 0-1
}): number {
  const score = (
    factors.dataAvailability * 0.5 +
    factors.dataRecency * 0.3 +
    factors.dataAccuracy * 0.2
  ) * 100;
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Determine confidence level from data availability
 */
export function determineConfidenceLevel(
  requiredDataPoints: number,
  availableDataPoints: number
): 'low' | 'medium' | 'high' {
  const availability = availableDataPoints / requiredDataPoints;
  
  if (availability >= 0.8) return 'high';
  if (availability >= 0.5) return 'medium';
  return 'low';
}
