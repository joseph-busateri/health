import { createChangeEvent } from './pointInTimeService';
import { getWorkoutBaseline, logWorkoutChange } from './workoutDocumentService';
import { getSupplementBaseline, logSupplementChange } from './supplementDocumentService';
import type {
  EngineSnapshot,
  InterviewSubmissionInput,
  RecoveryClusterEngineState,
  SupplementEngineState,
  WorkoutEngineState,
} from '../types/interviewAgent';

const workoutEngineStore = new Map<string, WorkoutEngineState>();
const supplementEngineStore = new Map<string, SupplementEngineState>();
const recoveryClusterEngineStore = new Map<string, RecoveryClusterEngineState>();

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toWorkoutScore = (plannedSessions: number, completedSessions: number): number => {
  if (plannedSessions <= 0) {
    return clamp(completedSessions * 20, 0, 100);
  }
  return Math.round(clamp((completedSessions / plannedSessions) * 100, 0, 100));
};

const toSupplementScore = (missedItems: number, timingConsistency: number): number => {
  const missedPenalty = clamp(100 - missedItems * 15, 0, 100);
  const timingScore = clamp(timingConsistency, 0, 100);
  return Math.round(missedPenalty * 0.65 + timingScore * 0.35);
};

const computeRecoveryCluster = (
  userId: string,
  input: NonNullable<InterviewSubmissionInput['recoveryCluster']>
): RecoveryClusterEngineState => {
  const sleepNorm = input.sleepHours != null ? clamp((input.sleepHours / 8) * 100, 0, 100) : 60;
  const recoveryNorm = input.recoveryFeeling != null ? clamp(((input.recoveryFeeling - 1) / 4) * 100, 0, 100) : 60;
  const stressNorm = input.stressLevel != null ? clamp(((5 - input.stressLevel) / 4) * 100, 0, 100) : 60;
  const jointNorm = input.jointPainLevel != null ? clamp(((10 - input.jointPainLevel) / 10) * 100, 0, 100) : 70;
  const adherenceNorm = input.adherenceLevel != null ? clamp((input.adherenceLevel / 10) * 100, 0, 100) : 60;

  const recoveryScore = Math.round(sleepNorm * 0.3 + recoveryNorm * 0.4 + stressNorm * 0.3);
  const stressScore = Math.round(stressNorm);
  const jointScore = Math.round(jointNorm);
  const adherenceScore = Math.round(adherenceNorm);

  const weightedRisk = Math.round(recoveryScore * 0.35 + stressScore * 0.25 + jointScore * 0.2 + adherenceScore * 0.2);
  const riskLevel = weightedRisk >= 75 ? 'low' : weightedRisk >= 55 ? 'moderate' : 'high';

  return {
    userId,
    recoveryScore,
    stressScore,
    jointScore,
    adherenceScore,
    riskLevel,
    notes: input.notes,
    updatedAt: new Date().toISOString(),
  };
};

export const getEngineSnapshot = async (userId: string): Promise<EngineSnapshot> => {
  return {
    workout: workoutEngineStore.get(userId),
    supplement: supplementEngineStore.get(userId),
    recoveryCluster: recoveryClusterEngineStore.get(userId),
  };
};

export const applyInterviewOutputsToEngines = async (
  userId: string,
  submission: InterviewSubmissionInput
): Promise<EngineSnapshot> => {
  if (submission.workout) {
    const plannedSessions = submission.workout.plannedSessions ?? 0;
    const completedSessions = submission.workout.completedSessions ?? 0;

    const workoutState: WorkoutEngineState = {
      userId,
      plannedSessions,
      completedSessions,
      adherenceScore: toWorkoutScore(plannedSessions, completedSessions),
      barriers: submission.workout.barriers,
      nextAction: submission.workout.nextAction,
      updatedAt: new Date().toISOString(),
    };

    workoutEngineStore.set(userId, workoutState);

    const baseline = await getWorkoutBaseline(userId).catch(() => null);
    if (baseline?.id && submission.workout.nextAction) {
      await logWorkoutChange(
        userId,
        baseline.id,
        'program_notes',
        baseline.programNotes,
        submission.workout.nextAction,
        'agent_refinement',
        'Daily interview loop save-back'
      ).catch(() => undefined);
    }

    await createChangeEvent({
      user_id: userId,
      entity_type: 'workout_baseline',
      entity_id: baseline?.id ?? `workout-engine-${userId}`,
      field_name: 'adherence_score',
      new_value: String(workoutState.adherenceScore),
      change_source: 'agent_adjustment',
      rationale: 'Structured interview save-back for workout engine',
      confidence: 0.9,
    }).catch(() => undefined);
  }

  if (submission.supplement) {
    const missedItems = submission.supplement.missedItems ?? 0;
    const timingConsistency = submission.supplement.timingConsistency ?? 70;

    const supplementState: SupplementEngineState = {
      userId,
      missedItems,
      timingConsistency,
      adherenceScore: toSupplementScore(missedItems, timingConsistency),
      sideEffects: submission.supplement.sideEffects,
      nextAction: submission.supplement.nextAction,
      updatedAt: new Date().toISOString(),
    };

    supplementEngineStore.set(userId, supplementState);

    const baseline = await getSupplementBaseline(userId).catch(() => null);
    if (baseline?.id && submission.supplement.nextAction) {
      await logSupplementChange({
        user_id: userId,
        supplement_baseline_id: baseline.id,
        field_name: 'timing_notes',
        old_value: baseline.timing_notes ?? undefined,
        new_value: submission.supplement.nextAction,
        change_source: 'agent_refinement',
        rationale: 'Daily interview loop save-back',
      }).catch(() => undefined);
    }

    await createChangeEvent({
      user_id: userId,
      entity_type: 'supplement_baseline',
      entity_id: baseline?.id ?? `supplement-engine-${userId}`,
      field_name: 'adherence_score',
      new_value: String(supplementState.adherenceScore),
      change_source: 'agent_adjustment',
      rationale: 'Structured interview save-back for supplement engine',
      confidence: 0.9,
    }).catch(() => undefined);
  }

  if (submission.recoveryCluster) {
    const state = computeRecoveryCluster(userId, submission.recoveryCluster);
    recoveryClusterEngineStore.set(userId, state);

    await createChangeEvent({
      user_id: userId,
      entity_type: 'baseline_profile',
      entity_id: `recovery-cluster-${userId}`,
      field_name: 'risk_level',
      new_value: state.riskLevel,
      change_source: 'agent_adjustment',
      rationale: 'Structured interview save-back for recovery/stress/joint/adherence engines',
      confidence: 0.85,
    }).catch(() => undefined);
  }

  return getEngineSnapshot(userId);
};
