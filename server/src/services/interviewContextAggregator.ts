import { getRecoveryToday } from './recoveryEngineService';
import { getStressToday } from './stressEngineService';
import { getJointHealthToday } from './jointHealthEngineService';
import { getAdherenceToday } from './adherenceEngineService';
import { generateSupplementRecommendations } from './supplementEngineService';
import { generateBloodworkRecommendationsForUser } from './bloodworkRecommendationService';
import { getEngineSnapshot } from './engineStateService';
import { getDailyLogsForUser } from './structuredDailyLogService';
import type { InterviewContext } from '../types/dynamicFollowUps';

export const aggregateInterviewContext = async (userId: string): Promise<InterviewContext> => {
  const context: InterviewContext = { userId };

  try {
    const recoveryData = await getRecoveryToday(userId).catch(() => null);
    if (recoveryData) {
      const scoreMap: Record<string, 'low' | 'moderate' | 'high'> = {
        'poor_recovery': 'low',
        'moderate_recovery': 'moderate',
        'fully_recovered': 'high',
      };

      context.recovery = {
        score: scoreMap[recoveryData.recoveryStatus] ?? 'moderate',
        sleepHours: recoveryData.sourceInputs.sleepDurationHours ?? 7,
        sleepQuality: recoveryData.sourceInputs.sleepQuality ?? 3,
        recoveryFeeling: recoveryData.sourceInputs.verbalRecoveryFeeling ?? 3,
      };
    }
  } catch (error) {
    console.warn('Failed to fetch recovery context:', error);
  }

  try {
    const stressData = await getStressToday(userId).catch(() => null);
    if (stressData) {
      const levelMap: Record<string, 'low' | 'moderate' | 'high'> = {
        'low': 'low',
        'moderate': 'moderate',
        'high': 'high',
      };

      const trendMap: Record<string, 'improving' | 'stable' | 'worsening'> = {
        'improving': 'improving',
        'stable': 'stable',
        'declining': 'worsening',
        'worsening': 'worsening',
      };

      context.stress = {
        level: levelMap[stressData.stressStatus] ?? 'moderate',
        sources: ['work'],
        trend: trendMap[stressData.cnsLoadStatus] ?? 'stable',
      };
    }
  } catch (error) {
    console.warn('Failed to fetch stress context:', error);
  }

  try {
    const jointData = await getJointHealthToday(userId).catch(() => null);
    if (jointData) {
      context.jointPain = {
        hasActivePain: jointData.jointHealthStatus !== 'stable',
        location: [jointData.affectedArea],
        severity: jointData.inputs.painLevel ?? 0,
      };
    }
  } catch (error) {
    console.warn('Failed to fetch joint health context:', error);
  }

  try {
    const adherenceData = await getAdherenceToday(userId).catch(() => null);
    if (adherenceData) {
      context.workoutAdherence = adherenceData.breakdown.workout;
      context.supplementAdherence = adherenceData.breakdown.supplement;
      
      context.nutrition = {
        adherence: adherenceData.breakdown.nutrition,
      };
    }
  } catch (error) {
    console.warn('Failed to fetch adherence context:', error);
  }

  try {
    const supplementData = await generateSupplementRecommendations(userId).catch(() => null);
    if (supplementData) {
      context.supplementAdherence = supplementData.summary.totalRecommendations > 0 
        ? Math.max(50, 100 - (supplementData.summary.totalRecommendations * 10))
        : 85;
    }
  } catch (error) {
    console.warn('Failed to fetch supplement context:', error);
  }

  try {
    const bloodworkRecs = await generateBloodworkRecommendationsForUser({ user_id: userId }).catch(() => null);
    if (bloodworkRecs) {
      const criticalFlags = bloodworkRecs.recommendations
        .filter(r => r.severity === 'high' || r.severity === 'critical')
        .map(r => r.marker_name);

      const allFlags = bloodworkRecs.recommendations.map(r => r.marker_name);

      context.bloodwork = {
        hasRecentResults: bloodworkRecs.recommendations.length > 0,
        criticalFlags,
        flags: allFlags,
        recommendations: bloodworkRecs.recommendations.map(r => r.recommendation_text),
      };
    }
  } catch (error) {
    console.warn('Failed to fetch bloodwork context:', error);
  }

  try {
    const engineSnapshot = await getEngineSnapshot(userId).catch(() => null);
    if (engineSnapshot) {
      if (engineSnapshot.recoveryCluster) {
        context.controlTower = {
          overallHealthScore: Math.round(
            (engineSnapshot.recoveryCluster.recoveryScore * 0.3) +
            (engineSnapshot.recoveryCluster.stressScore * 0.25) +
            (engineSnapshot.recoveryCluster.jointScore * 0.2) +
            (engineSnapshot.recoveryCluster.adherenceScore * 0.25)
          ),
          status: engineSnapshot.recoveryCluster.riskLevel === 'low' ? 'Optimal' :
                  engineSnapshot.recoveryCluster.riskLevel === 'moderate' ? 'Stable' : 'At Risk',
          dailyRecommendation: engineSnapshot.recoveryCluster.notes ?? 'Continue monitoring health metrics',
        };
      }

      if (engineSnapshot.supplement) {
        context.supplementAdherence = engineSnapshot.supplement.adherenceScore;
      }

      if (engineSnapshot.workout) {
        context.workoutAdherence = engineSnapshot.workout.adherenceScore;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch engine snapshot:', error);
  }

  try {
    const dailyLogs = await getDailyLogsForUser(userId, 1).catch(() => []);
    if (dailyLogs.length > 0) {
      const latestLog = dailyLogs[0];
      
      if (!context.recovery) {
        context.recovery = {
          score: latestLog.recoveryFeeling < 3 ? 'low' : latestLog.recoveryFeeling >= 4 ? 'high' : 'moderate',
          sleepHours: latestLog.sleepHours ?? 7,
          sleepQuality: latestLog.sleepQuality ?? 3,
          recoveryFeeling: latestLog.recoveryFeeling ?? 3,
        };
      }

      if (!context.stress) {
        context.stress = {
          level: latestLog.stressLevel >= 4 ? 'high' : latestLog.stressLevel >= 3 ? 'moderate' : 'low',
          sources: ['work'],
          trend: 'stable',
        };
      }

      if (!context.workoutAdherence) {
        context.workoutAdherence = latestLog.workoutAdherence ?? 70;
      }

      if (latestLog.notes) {
        const notes = latestLog.notes.toLowerCase();
        
        if (!context.sexualHealth && (notes.includes('libido') || notes.includes('sexual'))) {
          context.sexualHealth = {
            libido: notes.includes('low libido') ? 'low' : 'moderate',
            performance: 'fair',
            concerns: [],
          };
        }

        if (!context.nutrition) {
          context.nutrition = {
            adherence: notes.includes('on plan') ? 85 : notes.includes('off plan') ? 45 : 70,
          };
        }
      }
    }
  } catch (error) {
    console.warn('Failed to fetch daily logs:', error);
  }

  return context;
};

export const enrichInterviewContext = async (
  userId: string,
  partialContext?: Partial<InterviewContext>
): Promise<InterviewContext> => {
  const aggregatedContext = await aggregateInterviewContext(userId);
  
  return {
    ...aggregatedContext,
    ...partialContext,
    userId,
  };
};
