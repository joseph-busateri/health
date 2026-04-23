import { logger } from '../utils/logger';
import { getBaselineFields } from './baselineContextService';
import type { TrainingPhase, TrainingPhaseDetermination } from '../types/trainingPhase';

// In-memory cache for training phase
const phaseCache = new Map<string, TrainingPhaseDetermination>();

/**
 * Determine training phase from baseline profile
 */
const determinePhaseFromBaseline = (baseline: any): TrainingPhaseDetermination => {
  const trainingStyle = baseline?.trainingStyle?.toLowerCase() || '';
  
  if (trainingStyle.includes('strength') || trainingStyle.includes('power')) {
    return {
      phase: 'strength',
      rationale: `Training style indicates strength focus: ${baseline.trainingStyle}`,
      confidence: 0.7,
      source: 'baseline',
    };
  }
  
  if (trainingStyle.includes('hypertrophy') || trainingStyle.includes('bodybuilding')) {
    return {
      phase: 'hypertrophy',
      rationale: `Training style indicates hypertrophy focus: ${baseline.trainingStyle}`,
      confidence: 0.7,
      source: 'baseline',
    };
  }
  
  return {
    phase: 'maintenance',
    rationale: `Training style does not indicate specific phase: ${baseline.trainingStyle}`,
    confidence: 0.5,
    source: 'baseline',
  };
};

/**
 * Get training phase for a user
 */
export const getTrainingPhase = async (userId: string): Promise<TrainingPhaseDetermination> => {
  // Check cache
  if (phaseCache.has(userId)) {
    return phaseCache.get(userId)!;
  }
  
  let determination: TrainingPhaseDetermination;
  
  try {
    // Get baseline profile to determine training phase
    const baseline = await getBaselineFields(userId);
    determination = determinePhaseFromBaseline(baseline);
    
  } catch (error) {
    logger.warn('Failed to determine training phase from baseline, using default', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    
    determination = {
      phase: 'maintenance',
      rationale: 'Error determining phase, defaulting to maintenance',
      confidence: 0.3,
      source: 'default',
    };
  }
  
  // Cache result
  phaseCache.set(userId, determination);
  
  logger.info('Training phase determined', {
    userId,
    phase: determination.phase,
    rationale: determination.rationale,
    confidence: determination.confidence,
    source: determination.source,
  });
  
  return determination;
};

/**
 * Clear training phase cache for a user
 */
export const clearTrainingPhaseCache = (userId: string): void => {
  phaseCache.delete(userId);
  logger.info('Training phase cache cleared', { userId });
};

/**
 * Clear all training phase cache
 */
export const clearAllTrainingPhaseCache = (): void => {
  phaseCache.clear();
  logger.info('All training phase cache cleared');
};
