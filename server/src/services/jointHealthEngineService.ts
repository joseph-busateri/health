import { randomUUID } from 'crypto';

import { getEngineSnapshot } from './engineStateService';
import { createChangeEvent } from './pointInTimeService';
import type {
  JointArea,
  JointHealthInputs,
  JointHealthRecord,
  JointHealthStatus,
  JointRiskLevel,
  JointWorkoutModificationRecommendation,
} from '../types/jointHealthEngine';

const jointStore = new Map<string, JointHealthRecord[]>();

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toArea = (value?: JointArea): JointArea => value ?? 'other';

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
): Promise<JointHealthRecord> => {
  const date = new Date().toISOString().slice(0, 10);
  const existing = jointStore.get(userId)?.find(record => record.date === date);
  if (existing && !options?.regenerate) {
    return existing;
  }

  const inputs = await mergeInputs(userId, options?.override);
  const { jointHealthStatus, riskLevel, affectedArea } = evaluateJointHealth(inputs);
  const recommendation = generateJointRecommendations(affectedArea, jointHealthStatus);

  const record: JointHealthRecord = {
    id: randomUUID(),
    userId,
    date,
    affectedArea: toArea(affectedArea),
    jointHealthStatus,
    riskLevel,
    inputs,
    recommendation,
    createdAt: new Date().toISOString(),
  };

  const history = jointStore.get(userId) ?? [];
  jointStore.set(userId, [record, ...history]);

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

  return record;
};

export const getJointHealthHistory = async (userId: string): Promise<JointHealthRecord[]> => {
  return jointStore.get(userId) ?? [];
};
