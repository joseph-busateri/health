import { randomUUID } from 'crypto';
import { mapInterviewResponsesToStructuredData } from './interviewResponseMapper';
import { getRecoveryToday } from './recoveryEngineService';
import { getStressToday } from './stressEngineService';
import { getJointHealthToday } from './jointHealthEngineService';
import { getAdherenceToday } from './adherenceEngineService';
import { applyInterviewOutputsToEngines } from './engineStateService';
import { createChangeEvent } from './pointInTimeService';
import { withRetry, type RetryOptions } from '../utils/retryHelper';
import type { InterviewState } from '../types/dynamicFollowUps';
import type { 
  StructuredInterviewData, 
  InterviewSaveBackResult, 
  EngineSaveBackStatus 
} from '../types/interviewSaveBack';
import type { 
  RecoverySourceInputs 
} from '../types/recoveryEngine';
import type { 
  StressSourceInputs 
} from '../types/stressEngine';
import type { 
  JointHealthInputs 
} from '../types/jointHealthEngine';
import type { 
  AdherenceInputs 
} from '../types/adherenceEngine';
import type { 
  InterviewSubmissionInput 
} from '../types/interviewAgent';

const conversationStore = new Map<string, StructuredInterviewData>();

const RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  onRetry: (attempt, error) => {
    console.warn(`Engine update retry attempt ${attempt}: ${error.message}`);
  },
};

export const saveInterviewOutputs = async (
  userId: string,
  interviewState: InterviewState,
  conversationId?: string
): Promise<InterviewSaveBackResult> => {
  const cid = conversationId ?? randomUUID();
  const errors: string[] = [];
  const enginesUpdated: string[] = [];
  
  try {
    const structuredData = mapInterviewResponsesToStructuredData(userId, interviewState, cid);
    
    conversationStore.set(cid, structuredData);
    
    const engineStatuses = await updateEngineInputs(userId, structuredData);
    
    for (const status of engineStatuses) {
      if (status.success) {
        enginesUpdated.push(status.engine);
      } else if (status.error) {
        errors.push(`${status.engine}: ${status.error}`);
      }
    }
    
    const pointInTimeRecordId = await createInterviewPointInTimeRecord(userId, structuredData, cid);
    
    return {
      success: errors.length === 0,
      conversationId: cid,
      structuredData,
      enginesUpdated,
      pointInTimeRecordId,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    errors.push(`Save back failed: ${(error as Error).message}`);
    return {
      success: false,
      conversationId: cid,
      structuredData: {
        userId,
        interviewDate: new Date().toISOString().split('T')[0],
        conversationId: cid,
        rawConversation: interviewState.responsesCollected,
      },
      enginesUpdated,
      errors,
    };
  }
};

export const updateEngineInputs = async (
  userId: string,
  structuredData: StructuredInterviewData
): Promise<EngineSaveBackStatus[]> => {
  const statuses: EngineSaveBackStatus[] = [];
  
  if (structuredData.recovery) {
    const recoveryInputs: RecoverySourceInputs = {
      sleepDurationHours: structuredData.recovery.sleepHours,
      sleepQuality: structuredData.recovery.sleepQuality,
      verbalRecoveryFeeling: structuredData.recovery.recoveryFeeling,
      hrv: structuredData.recovery.hrv,
      restingHr: structuredData.recovery.restingHr,
    };
    
    const retryResult = await withRetry(
      () => getRecoveryToday(userId, {
        regenerate: true,
        override: recoveryInputs,
      }),
      RETRY_OPTIONS
    );
    
    if (retryResult.success && retryResult.result) {
      statuses.push({
        engine: 'recovery',
        success: true,
        recordId: retryResult.result.id,
      });
      
      if (retryResult.attempts > 1) {
        console.log(`Recovery engine updated after ${retryResult.attempts} attempts (${retryResult.totalDurationMs}ms)`);
      }
    } else {
      statuses.push({
        engine: 'recovery',
        success: false,
        error: retryResult.error?.message || 'Unknown error',
      });
      console.error(`Recovery engine update failed after ${retryResult.attempts} attempts: ${retryResult.error?.message}`);
    }
  }
  
  if (structuredData.stress) {
    const stressInputs: StressSourceInputs = {
      interviewStressLevel: structuredData.stress.level,
    };
    
    const retryResult = await withRetry(
      () => getStressToday(userId, {
        regenerate: true,
        override: stressInputs,
      }),
      RETRY_OPTIONS
    );
    
    if (retryResult.success && retryResult.result) {
      statuses.push({
        engine: 'stress',
        success: true,
        recordId: retryResult.result.id,
      });
      
      if (retryResult.attempts > 1) {
        console.log(`Stress engine updated after ${retryResult.attempts} attempts (${retryResult.totalDurationMs}ms)`);
      }
    } else {
      statuses.push({
        engine: 'stress',
        success: false,
        error: retryResult.error?.message || 'Unknown error',
      });
      console.error(`Stress engine update failed after ${retryResult.attempts} attempts: ${retryResult.error?.message}`);
    }
  }
  
  if (structuredData.jointHealth) {
    const jointInputs: JointHealthInputs = {
      painLevel: structuredData.jointHealth.painLevel,
      tightnessLevel: structuredData.jointHealth.tightnessLevel,
      sorenessLevel: structuredData.jointHealth.sorenessLevel,
      affectedArea: structuredData.jointHealth.affectedAreas?.[0] as any,
    };
    
    const retryResult = await withRetry(
      () => getJointHealthToday(userId, {
        regenerate: true,
        override: jointInputs,
      }),
      RETRY_OPTIONS
    );
    
    if (retryResult.success && retryResult.result) {
      statuses.push({
        engine: 'joint_health',
        success: true,
        recordId: retryResult.result.id,
      });
      
      if (retryResult.attempts > 1) {
        console.log(`Joint health engine updated after ${retryResult.attempts} attempts (${retryResult.totalDurationMs}ms)`);
      }
    } else {
      statuses.push({
        engine: 'joint_health',
        success: false,
        error: retryResult.error?.message || 'Unknown error',
      });
      console.error(`Joint health engine update failed after ${retryResult.attempts} attempts: ${retryResult.error?.message}`);
    }
  }
  
  if (structuredData.adherence) {
    const adherenceInputs: AdherenceInputs = {
      workoutAdherence: structuredData.adherence.workoutAdherence,
      nutritionAdherence: structuredData.adherence.nutritionAdherence,
      supplementAdherence: structuredData.adherence.supplementAdherence,
      sleepAdherence: structuredData.adherence.sleepAdherence,
    };
    
    const retryResult = await withRetry(
      () => getAdherenceToday(userId, {
        regenerate: true,
        override: adherenceInputs,
      }),
      RETRY_OPTIONS
    );
    
    if (retryResult.success && retryResult.result) {
      statuses.push({
        engine: 'adherence',
        success: true,
        recordId: retryResult.result.id,
      });
      
      if (retryResult.attempts > 1) {
        console.log(`Adherence engine updated after ${retryResult.attempts} attempts (${retryResult.totalDurationMs}ms)`);
      }
    } else {
      statuses.push({
        engine: 'adherence',
        success: false,
        error: retryResult.error?.message || 'Unknown error',
      });
      console.error(`Adherence engine update failed after ${retryResult.attempts} attempts: ${retryResult.error?.message}`);
    }
  }
  
  if (structuredData.workoutReadiness || structuredData.adherence) {
    const interviewSubmission: InterviewSubmissionInput = {};
    
    if (structuredData.workoutReadiness) {
      interviewSubmission.workout = {
        plannedSessions: structuredData.workoutReadiness.plannedSessions ?? 0,
        completedSessions: structuredData.workoutReadiness.completedSessions ?? (structuredData.workoutReadiness.completed ? 1 : 0),
        barriers: structuredData.workoutReadiness.skipReason,
        nextAction: structuredData.workoutReadiness.performance === 'worse' || structuredData.workoutReadiness.performance === 'much worse'
          ? 'Consider deload or recovery focus'
          : undefined,
      };
    }
    
    if (structuredData.recovery || structuredData.stress || structuredData.jointHealth || structuredData.adherence) {
      interviewSubmission.recoveryCluster = {
        sleepHours: structuredData.recovery?.sleepHours,
        recoveryFeeling: structuredData.recovery?.recoveryFeeling,
        stressLevel: structuredData.stress?.level,
        jointPainLevel: structuredData.jointHealth?.painLevel,
        adherenceLevel: structuredData.adherence?.workoutAdherence ? Math.round(structuredData.adherence.workoutAdherence / 10) : undefined,
        notes: structuredData.additionalNotes,
      };
    }
    
    const retryResult = await withRetry(
      () => applyInterviewOutputsToEngines(userId, interviewSubmission),
      RETRY_OPTIONS
    );
    
    if (retryResult.success) {
      statuses.push({
        engine: 'engine_state',
        success: true,
      });
      
      if (retryResult.attempts > 1) {
        console.log(`Engine state updated after ${retryResult.attempts} attempts (${retryResult.totalDurationMs}ms)`);
      }
    } else {
      statuses.push({
        engine: 'engine_state',
        success: false,
        error: retryResult.error?.message || 'Unknown error',
      });
      console.error(`Engine state update failed after ${retryResult.attempts} attempts: ${retryResult.error?.message}`);
    }
  }
  
  return statuses;
};

export const triggerEngineRecalculations = async (
  userId: string,
  structuredData: StructuredInterviewData
): Promise<void> => {
  const recalculations: Promise<any>[] = [];
  
  if (structuredData.recovery) {
    recalculations.push(
      getRecoveryToday(userId, { regenerate: true }).catch(() => null)
    );
  }
  
  if (structuredData.stress) {
    recalculations.push(
      getStressToday(userId, { regenerate: true }).catch(() => null)
    );
  }
  
  if (structuredData.jointHealth) {
    recalculations.push(
      getJointHealthToday(userId, { regenerate: true }).catch(() => null)
    );
  }
  
  if (structuredData.adherence) {
    recalculations.push(
      getAdherenceToday(userId, { regenerate: true }).catch(() => null)
    );
  }
  
  await Promise.all(recalculations);
};

const createInterviewPointInTimeRecord = async (
  userId: string,
  structuredData: StructuredInterviewData,
  conversationId: string
): Promise<string | undefined> => {
  try {
    const summaryFields: string[] = [];
    
    if (structuredData.recovery) {
      summaryFields.push(`Sleep: ${structuredData.recovery.sleepHours ?? 'N/A'}hrs, Quality: ${structuredData.recovery.sleepQuality ?? 'N/A'}/5`);
    }
    
    if (structuredData.stress) {
      summaryFields.push(`Stress: ${structuredData.stress.level ?? 'N/A'}/5`);
    }
    
    if (structuredData.jointHealth?.hasActivePain) {
      summaryFields.push(`Joint Pain: ${structuredData.jointHealth.painLevel ?? 'N/A'}/10 (${structuredData.jointHealth.affectedAreas?.join(', ') ?? 'unspecified'})`);
    }
    
    if (structuredData.adherence) {
      summaryFields.push(`Adherence: Workout ${structuredData.adherence.workoutAdherence ?? 'N/A'}%, Nutrition ${structuredData.adherence.nutritionAdherence ?? 'N/A'}%`);
    }
    
    const summary = summaryFields.join(' | ');
    
    console.log('Creating point-in-time record for interview:', conversationId);
    
    const record = await createChangeEvent({
      user_id: userId,
      entity_type: 'baseline_profile',
      entity_id: `interview-${conversationId}`,
      field_name: 'interview_completion',
      new_value: summary,
      change_source: 'agent_adjustment',
      rationale: `Daily interview completed with ${structuredData.rawConversation.length} responses`,
      confidence: 0.95,
    });
    
    console.log('Point-in-time record created:', record?.id);
    
    return record?.id || conversationId;
  } catch (error) {
    console.error('Failed to create point-in-time record:', error);
    console.warn('Continuing without point-in-time record - this is non-critical');
    return conversationId;
  }
};

export const getConversationById = async (conversationId: string): Promise<StructuredInterviewData | null> => {
  return conversationStore.get(conversationId) ?? null;
};

export const getConversationsByUser = async (userId: string): Promise<StructuredInterviewData[]> => {
  const conversations: StructuredInterviewData[] = [];
  
  for (const [, data] of conversationStore) {
    if (data.userId === userId) {
      conversations.push(data);
    }
  }
  
  return conversations.sort((a, b) => b.interviewDate.localeCompare(a.interviewDate));
};
