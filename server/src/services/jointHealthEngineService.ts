import { randomUUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { getBaselineFields } from './baselineContextService';
import { getEngineSnapshot } from './engineStateService';
import { createChangeEvent } from './pointInTimeService';
import { enrichJointRecommendationWithAI } from './jointAIEnrichment';
import { normalizeJointRecommendation } from './jointRecommendationNormalizer';
import { validateJointRecommendation } from './jointRecommendationValidator';
import { createRecommendation } from './recommendationEngineService';
import type { InputMetadata } from '../types/inputMetadata';
import type {
  JointArea,
  JointEvidence,
  JointEvidenceSignal,
  JointHealthInputs,
  JointHealthRecord,
  JointHealthStatus,
  JointRecommendation,
  JointRecommendationPriority,
  JointRecordEnriched,
  JointRiskLevel,
  JointWorkoutModificationRecommendation,
} from '../types/jointHealthEngine';

const jointStore = new Map<string, JointHealthRecord[]>();

/**
 * Clear all joint health cache
 */
export function clearJointHealthCache(): void {
  jointStore.clear();
  logger.info('🗑️ [JOINT HEALTH ENGINE] All cache cleared');
}

const SHOW_DETAIL_SCREEN_INPUTS = process.env.SHOW_DETAIL_SCREEN_INPUTS === 'true';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toArea = (value?: JointArea): JointArea => value ?? 'other';

/**
 * Calculate individual input score based on value and optimal ranges
 * Returns: 90 (optimal), 70 (moderate), 50 (elevated_risk), or 30 (high_risk)
 */
function calculateJointHealthInputScore(name: string, value: any): number | undefined {
  if (value === undefined || value === null) return undefined;

  switch (name) {
    case 'Pain Level':
      // Lower is better (0-10 scale)
      if (value === 0) return 90;  // optimal (no pain)
      if (value <= 3) return 70;   // moderate (mild pain)
      if (value <= 6) return 50;   // elevated_risk (moderate pain)
      return 30;                    // high_risk (severe pain)

    case 'Tightness Level':
      // Lower is better (0-10 scale)
      if (value === 0) return 90;  // optimal (no tightness)
      if (value <= 3) return 70;   // moderate (mild tightness)
      if (value <= 6) return 50;   // elevated_risk (moderate tightness)
      return 30;                    // high_risk (severe tightness)

    case 'Soreness Level':
      // Lower is better (0-10 scale)
      if (value === 0) return 90;  // optimal (no soreness)
      if (value <= 3) return 70;   // moderate (mild soreness)
      if (value <= 6) return 50;   // elevated_risk (moderate soreness)
      return 30;                    // high_risk (severe soreness)

    case 'Affected Area':
      // Categorical, not scored
      return undefined;

    case 'Workout Load':
      // Moderate load is optimal (1-10 scale)
      if (value >= 4 && value <= 7) return 90;  // optimal (moderate load)
      if (value >= 2 && value <= 8) return 70;  // moderate
      if (value >= 1 && value <= 9) return 50;  // elevated_risk
      return 30;                                 // high_risk (extreme load)

    case 'Recovery Score':
      // Higher is better (0-100 scale)
      if (value >= 75) return 90;  // optimal
      if (value >= 50) return 70;  // moderate
      if (value >= 30) return 50;  // elevated_risk
      return 30;                    // high_risk

    case 'Verbal Notes':
      // Text field, not scored
      return undefined;

    default:
      return undefined;
  }
}

const buildJointInputMetadata = (inputs: JointHealthInputs): InputMetadata[] => {
  const metadata: InputMetadata[] = [];
  const now = new Date().toISOString();

  // Pain Level
  metadata.push({
    name: 'Pain Level',
    value: inputs.painLevel,
    unit: 'scale (0-10)',
    source: inputs.painLevel !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.painLevel !== undefined ? { integration: 'user_reported' } : undefined,
    lastUpdated: inputs.painLevel !== undefined ? now : undefined,
    category: 'Symptoms',
    score: calculateJointHealthInputScore('Pain Level', inputs.painLevel),
  });

  // Tightness Level
  metadata.push({
    name: 'Tightness Level',
    value: inputs.tightnessLevel,
    unit: 'scale (0-10)',
    source: inputs.tightnessLevel !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.tightnessLevel !== undefined ? { integration: 'user_reported' } : undefined,
    lastUpdated: inputs.tightnessLevel !== undefined ? now : undefined,
    category: 'Symptoms',
    score: calculateJointHealthInputScore('Tightness Level', inputs.tightnessLevel),
  });

  // Soreness Level
  metadata.push({
    name: 'Soreness Level',
    value: inputs.sorenessLevel,
    unit: 'scale (0-10)',
    source: inputs.sorenessLevel !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.sorenessLevel !== undefined ? { integration: 'user_reported' } : undefined,
    lastUpdated: inputs.sorenessLevel !== undefined ? now : undefined,
    category: 'Symptoms',
    score: calculateJointHealthInputScore('Soreness Level', inputs.sorenessLevel),
  });

  // Affected Area
  metadata.push({
    name: 'Affected Area',
    value: inputs.affectedArea,
    unit: null,
    source: inputs.affectedArea !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.affectedArea !== undefined ? { integration: 'user_reported' } : undefined,
    lastUpdated: inputs.affectedArea !== undefined ? now : undefined,
    category: 'Symptoms',
    score: calculateJointHealthInputScore('Affected Area', inputs.affectedArea),
  });

  // Workout Load
  metadata.push({
    name: 'Workout Load',
    value: inputs.workoutLoad,
    unit: 'scale (1-10)',
    source: inputs.workoutLoad !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.workoutLoad !== undefined ? { derivedFrom: ['planned_sessions'], formula: 'planned_sessions * 2' } : undefined,
    lastUpdated: inputs.workoutLoad !== undefined ? now : undefined,
    category: 'Training',
    score: calculateJointHealthInputScore('Workout Load', inputs.workoutLoad),
  });

  // Recovery Score
  metadata.push({
    name: 'Recovery Score',
    value: inputs.recoveryScore,
    unit: 'score (0-100)',
    source: inputs.recoveryScore !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.recoveryScore !== undefined ? { derivedFrom: ['recovery_engine'], formula: 'computed by recovery engine' } : undefined,
    lastUpdated: inputs.recoveryScore !== undefined ? now : undefined,
    category: 'Recovery',
    score: calculateJointHealthInputScore('Recovery Score', inputs.recoveryScore),
  });

  // Verbal Notes
  metadata.push({
    name: 'Verbal Notes',
    value: inputs.verbalNotes,
    unit: null,
    source: inputs.verbalNotes !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.verbalNotes !== undefined ? { integration: 'user_reported' } : undefined,
    lastUpdated: inputs.verbalNotes !== undefined ? now : undefined,
    category: 'Symptoms',
    score: calculateJointHealthInputScore('Verbal Notes', inputs.verbalNotes),
  });

  return metadata;
};

const inferAreaFromNotes = (notes?: string): JointArea => {
  if (!notes) {
    return 'other';
  }
  const normalized = notes.toLowerCase();
  if (normalized.includes('shoulder')) return 'shoulder';
  if (normalized.includes('knee')) return 'knee';
  if (normalized.includes('back')) return 'back';
  if (normalized.includes('elbow')) return 'elbow';
  return 'other';
};

const toLoadRisk = (workoutLoad?: number): number => {
  if (workoutLoad == null || !Number.isFinite(workoutLoad)) {
    return 4;
  }
  return clamp(workoutLoad, 1, 10);
};

const toRecoveryRisk = (recoveryScore?: number): number => {
  if (recoveryScore == null || !Number.isFinite(recoveryScore)) {
    return 5;
  }
  return clamp(Math.round((100 - recoveryScore) / 10), 0, 10);
};

export const assessInjuryRisk = (inputs: JointHealthInputs): JointRiskLevel => {
  const pain = clamp(inputs.painLevel ?? 3, 0, 10);
  const tightness = clamp(inputs.tightnessLevel ?? 3, 0, 10);
  const soreness = clamp(inputs.sorenessLevel ?? 3, 0, 10);
  const loadRisk = toLoadRisk(inputs.workoutLoad);
  const recoveryRisk = toRecoveryRisk(inputs.recoveryScore);

  const riskScore = pain * 0.35 + tightness * 0.2 + soreness * 0.2 + loadRisk * 0.15 + recoveryRisk * 0.1;

  if (riskScore >= 7) return 'high';
  if (riskScore >= 4.5) return 'moderate';
  return 'low';
};

export const evaluateJointHealth = (inputs: JointHealthInputs): {
  jointHealthStatus: JointHealthStatus;
  riskLevel: JointRiskLevel;
  affectedArea: JointArea;
} => {
  const riskLevel = assessInjuryRisk(inputs);
  const affectedArea = inputs.affectedArea ?? inferAreaFromNotes(inputs.verbalNotes);

  if (riskLevel === 'high') {
    return { jointHealthStatus: 'aggravated', riskLevel, affectedArea };
  }
  if (riskLevel === 'moderate') {
    return { jointHealthStatus: 'caution', riskLevel, affectedArea };
  }
  return { jointHealthStatus: 'stable', riskLevel, affectedArea };
};

const areaSpecificModifications = (area: JointArea): string[] => {
  switch (area) {
    case 'shoulder':
      return [
        'Reduce overhead pressing load and use neutral-grip pressing variations.',
        'Prioritize controlled tempo and pain-free ROM for upper-body presses.',
      ];
    case 'knee':
      return [
        'Use box squat, split squat, or machine-supported knee-friendly patterns.',
        'Reduce deep knee-flexion loading and avoid high-impact volume today.',
      ];
    case 'back':
      return [
        'Replace heavy axial loading with supported hinge/row variations.',
        'Avoid maximal spinal loading and emphasize bracing + controlled tempo.',
      ];
    case 'elbow':
      return [
        'Use neutral-grip pulling/pressing and reduce repetitive extension stress.',
        'Lower direct arm-isolation volume and avoid aggravating grip angles.',
      ];
    default:
      return [
        'Reduce loading on the symptomatic area and use pain-free alternatives.',
        'Favor controlled tempo, moderate intensity, and range-of-motion tolerance.',
      ];
  }
};

function buildJointEvidence(
  riskLevel: JointRiskLevel,
  jointHealthStatus: JointHealthStatus,
  affectedArea: JointArea,
  sourceInputs: JointHealthInputs,
): JointEvidence {
  const signals: JointEvidenceSignal[] = [];

  if (sourceInputs.painLevel != null) {
    const level = sourceInputs.painLevel;
    signals.push({
      name: 'painLevel',
      value: level,
      interpretation:
        level >= 7
          ? 'Pain is elevated and may significantly limit training capacity'
          : level >= 4
            ? 'Moderate pain present, requiring exercise modifications'
            : 'Pain is manageable',
    });
  }

  if (sourceInputs.tightnessLevel != null) {
    const level = sourceInputs.tightnessLevel;
    signals.push({
      name: 'tightnessLevel',
      value: level,
      interpretation:
        level >= 7
          ? 'Significant tightness may restrict range of motion'
          : level >= 4
            ? 'Moderate tightness present'
            : 'Tightness is minimal',
    });
  }

  if (sourceInputs.sorenessLevel != null) {
    const level = sourceInputs.sorenessLevel;
    signals.push({
      name: 'sorenessLevel',
      value: level,
      interpretation:
        level >= 7
          ? 'High soreness may indicate inadequate recovery'
          : level >= 4
            ? 'Moderate soreness present'
            : 'Soreness is minimal',
    });
  }

  if (sourceInputs.affectedArea != null) {
    const area = sourceInputs.affectedArea;
    const areaInterpretations: Record<JointArea, string> = {
      shoulder: 'Shoulder discomfort may affect pressing or overhead movements',
      knee: 'Knee discomfort may affect squatting, lunging, or loaded lower-body work',
      back: 'Back discomfort may increase risk during axial loading or hinging',
      elbow: 'Elbow discomfort may affect pressing, curls, or triceps work',
      other: 'Joint discomfort requires monitoring and potential exercise modifications',
    };
    signals.push({
      name: 'affectedArea',
      value: area,
      interpretation: areaInterpretations[area],
    });
  }

  if (sourceInputs.workoutLoad != null) {
    const load = sourceInputs.workoutLoad;
    signals.push({
      name: 'workoutLoad',
      value: load,
      interpretation:
        load >= 7
          ? 'High workout load may be increasing joint irritation'
          : load >= 4
            ? 'Moderate workout load contributing to joint stress'
            : 'Workout load is manageable',
    });
  }

  if (sourceInputs.recoveryScore != null) {
    const score = sourceInputs.recoveryScore;
    signals.push({
      name: 'recoveryScore',
      value: score,
      interpretation:
        score < 40
          ? 'Low recovery may limit tissue resilience and increase injury risk'
          : score < 70
            ? 'Moderate recovery capacity'
            : 'Recovery supports tissue resilience',
    });
  }

  const summaryParts: string[] = [];
  summaryParts.push(`Joint health status is ${jointHealthStatus}`);
  summaryParts.push(`with ${riskLevel} risk level`);
  if (affectedArea !== 'other') {
    summaryParts.push(`affecting ${affectedArea}`);
  }

  return {
    riskLevel,
    jointHealthStatus,
    affectedArea,
    sourceInputs,
    signals,
    summary: summaryParts.join(' '),
  };
}

function buildJointFallbackRecommendation(
  riskLevel: JointRiskLevel,
  jointHealthStatus: JointHealthStatus,
  affectedArea: JointArea,
): JointRecommendation {
  const areaModifications = areaSpecificModifications(affectedArea);
  
  let priority: JointRecommendationPriority;
  let summary: string;
  let actions: string[];

  if (riskLevel === 'high' || jointHealthStatus === 'aggravated') {
    priority = 'critical';
    summary = 'Joint signals suggest elevated risk. Shift to protective training choices today.';
    actions = [
      ...areaModifications,
      'Reduce working load by 20-35% or use recovery-focused session.',
      'Avoid max-effort sets and prioritize pain-free movement patterns.',
      'Monitor symptoms closely and seek clinical evaluation if pain persists or worsens.',
    ];
  } else if (riskLevel === 'moderate' || jointHealthStatus === 'caution') {
    priority = 'important';
    summary = 'Joint signals suggest caution. Use conservative load management and exercise modifications.';
    actions = [
      ...areaModifications,
      'Reduce working load by 10-20% and avoid max-effort sets.',
      'Do not push through sharp pain; prioritize movement quality and tolerance.',
    ];
  } else {
    priority = 'optimization';
    summary = 'Joint status appears stable. Continue training with standard form and load hygiene.';
    actions = [
      'Proceed with planned session while monitoring symptoms.',
      'Maintain proper warm-up and movement quality to prevent joint irritation.',
    ];
  }

  return {
    type: 'joint',
    priority,
    summary,
    actions,
    source: 'fallback',
  };
}

export const generateJointRecommendations = (
  area: JointArea,
  status: JointHealthStatus,
): JointWorkoutModificationRecommendation => {
  const base = areaSpecificModifications(area);

  if (status === 'stable') {
    return {
      summary: 'Joint status appears stable. Continue training with standard form and load hygiene.',
      modifications: ['Proceed with planned session while monitoring symptoms.'],
      safetyNotes: [
        'This is not a diagnosis; monitor pain escalation and adjust quickly if symptoms change.',
      ],
    };
  }

  if (status === 'caution') {
    return {
      summary: 'Joint signals suggest caution. Use conservative load management and exercise modifications.',
      modifications: [...base, 'Reduce working load by 10-20% and avoid max-effort sets.'],
      safetyNotes: [
        'Do not push through sharp pain; prioritize movement quality and tolerance.',
      ],
    };
  }

  return {
    summary: 'Joint signals suggest elevated risk. Shift to protective training choices today.',
    modifications: [...base, 'Reduce working load by 20-35% or use recovery-focused session.'],
    safetyNotes: [
      'This engine does not diagnose injuries. Seek qualified clinical evaluation for persistent or worsening symptoms.',
    ],
  };
};

const mergeInputs = async (userId: string, override?: JointHealthInputs): Promise<JointHealthInputs> => {
  const source: JointHealthInputs = { ...override };

  const snapshot = await getEngineSnapshot(userId).catch(() => undefined);
  source.painLevel ??= snapshot?.recoveryCluster?.jointScore != null
    ? clamp(Math.round((100 - snapshot.recoveryCluster.jointScore) / 10), 0, 10)
    : undefined;
  source.recoveryScore ??= snapshot?.recoveryCluster?.recoveryScore;
  source.workoutLoad ??= snapshot?.workout?.plannedSessions != null
    ? clamp(snapshot.workout.plannedSessions * 2, 1, 10)
    : undefined;
  source.verbalNotes ??= snapshot?.recoveryCluster?.notes;

  return source;
};

export const getJointHealthToday = async (
  userId: string,
  options?: { regenerate?: boolean; override?: JointHealthInputs },
): Promise<JointRecordEnriched> => {
  const date = new Date().toISOString().slice(0, 10);
  const existing = jointStore.get(userId)?.find(record => record.date === date);
  if (existing && !options?.regenerate) {
    // Return existing record with backward compatibility - convert old format to new
    return {
      ...existing,
      evidence: undefined,
      recommendation: {
        summary: existing.recommendation.summary,
        actions: existing.recommendation.modifications || [],
        source: 'deterministic' as const,
      },
    };
  }

  // Step 1: Load baseline profile for personalized context
  const baseline = await getBaselineFields(userId);
  logger.info('✅ [JOINT HEALTH ENGINE] Baseline profile loaded', {
    userId,
    age: baseline.age,
    trainingExperience: baseline.trainingExperience,
    weight: baseline.weight,
  });

  // Step 2: Deterministic Joint Engine
  const inputs = await mergeInputs(userId, options?.override);
  const { jointHealthStatus, riskLevel, affectedArea } = evaluateJointHealth(inputs);

  logger.info('🔵 Joint Engine: Deterministic evaluation complete', {
    userId,
    riskLevel,
    jointHealthStatus,
    affectedArea,
  });

  // Step 2: Build Evidence
  const evidence = buildJointEvidence(riskLevel, jointHealthStatus, affectedArea, inputs);

  logger.info('🔵 Joint Engine: Evidence built', {
    userId,
    signalCount: evidence.signals.length,
    summary: evidence.summary,
  });

  // Step 3: Build Fallback Recommendation
  const fallbackRecommendation = buildJointFallbackRecommendation(riskLevel, jointHealthStatus, affectedArea);

  logger.info('🔵 Joint Engine: Fallback recommendation ready', {
    userId,
    priority: fallbackRecommendation.priority,
    source: fallbackRecommendation.source,
  });

  // Step 4: AI Enrichment (if enabled)
  const useAIEnrichment = process.env.USE_AI_ENRICHMENT === 'true' && process.env.USE_AI_ENRICHMENT_JOINT === 'true';
  const shouldEnrich = useAIEnrichment && (riskLevel === 'moderate' || riskLevel === 'high');

  let finalRecommendation: JointRecommendation = fallbackRecommendation;

  if (shouldEnrich) {
    logger.info('🟢 Joint Engine: AI enrichment attempt', {
      userId,
      riskLevel,
      jointHealthStatus,
    });

    try {
      const aiResponse = await enrichJointRecommendationWithAI(evidence, fallbackRecommendation);

      if (aiResponse.success && aiResponse.output) {
        logger.info('🟢 Joint Engine: AI enrichment successful', {
          userId,
          hasSummary: !!aiResponse.output.summary,
          hasRationale: !!aiResponse.output.rationale,
        });

        // Step 5: Normalize AI Output
        const normalized = normalizeJointRecommendation(aiResponse.output, fallbackRecommendation);

        logger.info('🟢 Joint Engine: Normalization complete', {
          userId,
          priority: normalized.priority,
          actionCount: normalized.actions.length,
        });

        // Step 6: Validate
        const validation = validateJointRecommendation(normalized);

        if (validation.valid) {
          finalRecommendation = normalized;
          logger.info('🟢 Joint Engine: Validation passed - using AI-enriched recommendation', {
            userId,
            source: finalRecommendation.source,
          });
        } else {
          logger.warn('🔴 Joint Engine: Validation failed - using fallback', {
            userId,
            errors: validation.errors,
          });
        }
      } else {
        logger.warn('🔴 Joint Engine: AI enrichment failed - using fallback', {
          userId,
          error: aiResponse.error,
        });
      }
    } catch (error) {
      logger.error('🔴 Joint Engine: AI enrichment error - using fallback', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    logger.info('🔵 Joint Engine: AI enrichment skipped', {
      userId,
      useAIEnrichment,
      riskLevel,
      reason: !useAIEnrichment ? 'feature flags disabled' : 'low risk level',
    });
  }

  // Step 7: Persist through RecommendationEngine
  try {
    const recommendationRequest = {
      sourceEngine: 'joint_health' as const,
      sourceRecordId: undefined,
      title: `Joint Health: ${affectedArea} - ${riskLevel} risk`,
      description: finalRecommendation.summary,
      rationale: finalRecommendation.rationale,
      priority: finalRecommendation.priority ?? 'important',
      category: 'injury_prevention' as const,
      actionType: undefined,
      actionTarget: affectedArea,
      actionDetails: {
        riskLevel,
        jointHealthStatus,
        affectedArea,
        actions: finalRecommendation.actions,
        source: finalRecommendation.source,
      },
      confidenceLevel: 'medium' as const,
      dataQualityScore: evidence.signals.length > 3 ? 80 : 60,
      supportingMetrics: evidence.signals.map(s => ({
        name: s.name,
        value: String(s.value),
        status: 'normal' as const,
      })),
    };

    await createRecommendation({
      userId,
      request: recommendationRequest as any,
    });

    logger.info('🟢 Joint Engine: Recommendation persisted', {
      userId,
      source: finalRecommendation.source,
    });
  } catch (error) {
    logger.error('🔴 Joint Engine: Failed to persist recommendation', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Step 8: Build detailed inputs if feature flag is enabled
  let detailedInputs: InputMetadata[] | undefined;
  if (SHOW_DETAIL_SCREEN_INPUTS) {
    detailedInputs = buildJointInputMetadata(inputs);
    logger.info('✅ [JOINT HEALTH ENGINE] Built detailed input metadata', {
      userId,
      inputCount: detailedInputs.length,
      actualCount: detailedInputs.filter(i => i.source === 'ACTUAL').length,
      derivedCount: detailedInputs.filter(i => i.source === 'DERIVED').length,
      notAvailableCount: detailedInputs.filter(i => i.source === 'NOT_AVAILABLE').length,
    });
  }

  // Step 9: Create enriched record
  const record: JointRecordEnriched = {
    id: randomUUID(),
    userId,
    date,
    affectedArea: toArea(affectedArea),
    jointHealthStatus,
    riskLevel,
    inputs,
    evidence,
    recommendation: finalRecommendation,
    createdAt: new Date().toISOString(),
    ...(detailedInputs && { detailedInputs }),
  };

  const history = jointStore.get(userId) ?? [];
  jointStore.set(userId, [record as any, ...history]);

  await createChangeEvent({
    user_id: userId,
    entity_type: 'baseline_profile',
    entity_id: `joint-health-engine-${userId}`,
    field_name: 'joint_risk_level',
    new_value: record.riskLevel,
    change_source: 'agent_adjustment',
    rationale: `Joint/injury engine computed ${record.jointHealthStatus} for ${record.affectedArea}`,
    confidence: 0.86,
  }).catch(() => undefined);

  logger.info('✅ Joint Engine: Complete', {
    userId,
    riskLevel: record.riskLevel,
    source: finalRecommendation.source,
  });

  return record;
};

export const getJointHealthHistory = async (userId: string): Promise<JointHealthRecord[]> => {
  return jointStore.get(userId) ?? [];
};
