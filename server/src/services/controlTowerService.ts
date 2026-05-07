import { getRecoveryToday } from './recoveryEngineService';
import { getStressToday } from './stressEngineService';
import { getJointHealthToday } from './jointHealthEngineService';
import { getAdherenceToday } from './adherenceEngineService';
import { getPerformanceToday } from './performanceEngineService';
import { logger } from '../utils/logger';

export type ComponentStatus = 'Optimal' | 'Stable' | 'Moderate' | 'At Risk';
export type OverallStatus = 'Optimal' | 'Stable' | 'At Risk' | 'No Data';

export interface ComponentScore {
  score: number | null;
  status: ComponentStatus;
}

export interface ControlTowerData {
  overallScore: number | null;
  overallStatus: OverallStatus;
  overallTrend: 'Improving' | 'Stable' | 'Declining';
  components: {
    cv: ComponentScore;   // Cardiovascular
    rec: ComponentScore;  // Recovery
    met: ComponentScore;  // Metabolic
    perf: ComponentScore; // Performance
    sh: ComponentScore;   // Sexual Health
  };
  timestamp: string;
  dataAvailability: {
    recovery: boolean;
    stress: boolean;
    jointHealth: boolean;
    adherence: boolean;
  };
}

function scoreToStatus(score: number | null): ComponentStatus {
  if (score === null) return 'At Risk';
  if (score >= 80) return 'Optimal';
  if (score >= 60) return 'Stable';
  if (score >= 40) return 'Moderate';
  return 'At Risk';
}

function calculateOverallStatus(score: number | null): OverallStatus {
  if (score === null) return 'No Data';
  if (score >= 80) return 'Optimal';
  if (score >= 60) return 'Stable';
  return 'At Risk';
}

export async function getControlTowerOverallHealth(userId: string): Promise<ControlTowerData> {
  try {
    // Fetch data from all engines in parallel
    const [recoveryResult, stressResult, jointHealthResult, adherenceResult, performanceResult] = await Promise.allSettled([
      getRecoveryToday(userId),
      getStressToday(userId),
      getJointHealthToday(userId),
      getAdherenceToday(userId),
      getPerformanceToday(userId),
    ]);

    // Extract data with fallbacks
    const recovery = recoveryResult.status === 'fulfilled' ? recoveryResult.value : null;
    const stress = stressResult.status === 'fulfilled' ? stressResult.value : null;
    const jointHealth = jointHealthResult.status === 'fulfilled' ? jointHealthResult.value : null;
    const adherence = adherenceResult.status === 'fulfilled' ? adherenceResult.value : null;
    const performance = performanceResult.status === 'fulfilled' ? performanceResult.value : null;

    // Track data availability
    const dataAvailability = {
      recovery: recovery !== null,
      stress: stress !== null,
      jointHealth: jointHealth !== null,
      adherence: adherence !== null,
    };

    // Calculate component scores
    
    // Recovery (REC) - Direct from recovery engine
    const recScore = recovery?.recoveryScore ?? null;
    
    // Cardiovascular (CV) - Placeholder (would come from bloodwork/devices)
    // For now, use adherence cardiovascular if available, otherwise default
    const cvScore = adherence ? Math.round((adherence.adherenceScore + 10) * 0.9) : 72;
    
    // Metabolic (MET) - Based on adherence nutrition
    const metScore = adherence?.breakdown?.nutrition ?? 75;
    
    // Performance (PERF) - From dedicated Performance Engine
    const perfScore = performance?.performanceScore ?? null;
    
    // Sexual Health (SH) - Placeholder (would come from bloodwork/interviews)
    // For now, use recovery as proxy (good recovery correlates with hormones)
    const shScore = recovery ? Math.round(recovery.recoveryScore * 1.1) : 70;

    // Calculate overall score (weighted average of available components)
    const componentScores = [
      { score: cvScore, weight: 0.25 },
      { score: recScore, weight: 0.25 },
      { score: metScore, weight: 0.20 },
      { score: perfScore, weight: 0.20 },
      { score: shScore, weight: 0.10 },
    ];

    let totalWeight = 0;
    let weightedSum = 0;
    
    componentScores.forEach(({ score, weight }) => {
      if (score !== null) {
        weightedSum += score * weight;
        totalWeight += weight;
      }
    });

    const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;

    // Determine trend (simplified - would track historical data)
    const overallTrend: 'Improving' | 'Stable' | 'Declining' = 'Stable';

    return {
      overallScore,
      overallStatus: calculateOverallStatus(overallScore),
      overallTrend,
      components: {
        cv: {
          score: cvScore,
          status: scoreToStatus(cvScore),
        },
        rec: {
          score: recScore,
          status: scoreToStatus(recScore),
        },
        met: {
          score: metScore,
          status: scoreToStatus(metScore),
        },
        perf: {
          score: perfScore,
          status: scoreToStatus(perfScore),
        },
        sh: {
          score: shScore,
          status: scoreToStatus(shScore),
        },
      },
      timestamp: new Date().toISOString(),
      dataAvailability,
    };
  } catch (error) {
    logger.error('Control Tower aggregation failed', { error: (error as Error).message, userId });
    throw error;
  }
}
