import { API_BASE_URL } from '../config';
import type {
  RecoveryEngineData,
  StressEngineData,
  JointHealthEngineData,
  AdherenceEngineData,
  SupplementEngineData,
  WorkoutEngineData,
  ControlTowerData,
  BloodworkLatest,
  TodayRecommendation,
} from '../types/engines';

// Dashboard service to fetch data from all intelligence engines

export async function getControlTowerData(userId: string): Promise<ControlTowerData> {
  try {
    const response = await fetch(`${API_BASE_URL}/control-tower/overall-health?user_id=${userId}`);
    const data = await response.json();
    
    if (data.success) {
      return {
        overallScore: data.data.overallScore,
        overallStatus: data.data.overallStatus,
        components: data.data.components,
        timestamp: data.data.timestamp,
      };
    }
    throw new Error('Failed to fetch control tower data');
  } catch (error) {
    console.error('Error fetching control tower data:', error);
    throw error;
  }
}

export async function getRecoveryEngineData(userId: string): Promise<RecoveryEngineData> {
  try {
    const response = await fetch(`${API_BASE_URL}/recovery/${userId}/today`);
    const data = await response.json();
    
    if (data.success) {
      return {
        recoveryScore: data.data.recoveryScore,
        recoveryStatus: data.data.recoveryStatus.replace('_recovery', ''),
        hrv: null,
        sleepQuality: null,
        sleepDuration: null,
        recommendations: data.data.recommendation?.actions || [],
        timestamp: data.data.createdAt,
      };
    }
    throw new Error('Failed to fetch recovery engine data');
  } catch (error) {
    console.error('Error fetching recovery engine data:', error);
    throw error;
  }
}

export async function getStressEngineData(userId: string): Promise<StressEngineData> {
  try {
    const response = await fetch(`${API_BASE_URL}/stress/${userId}/today`);
    const data = await response.json();
    
    if (data.success) {
      return {
        stressScore: data.data.stressScore,
        stressLevel: data.data.stressStatus, // API returns 'stressStatus' not 'stressLevel'
        hrvVariability: null,
        workload: null,
        recommendations: data.data.recommendation?.actions || [],
        timestamp: data.data.createdAt,
      };
    }
    throw new Error('Failed to fetch stress engine data');
  } catch (error) {
    console.error('Error fetching stress engine data:', error);
    throw error;
  }
}

export async function getJointHealthEngineData(userId: string): Promise<JointHealthEngineData> {
  try {
    const response = await fetch(`${API_BASE_URL}/joint-health/${userId}/today`);
    const data = await response.json();
    
    if (data.success) {
      // Map score from status: stable=80, moderate=60, at_risk=40
      const scoreMap: Record<string, number> = { stable: 80, moderate: 60, at_risk: 40 };
      const score = scoreMap[data.data.jointHealthStatus] || 70;
      
      return {
        jointHealthScore: score,
        injuryRisk: data.data.riskLevel, // API returns 'riskLevel' not 'injuryRisk'
        painReports: [],
        workoutModifications: data.data.recommendation?.modifications || [],
        recommendations: [data.data.recommendation?.summary || ''],
        timestamp: data.data.createdAt,
      };
    }
    throw new Error('Failed to fetch joint health engine data');
  } catch (error) {
    console.error('Error fetching joint health engine data:', error);
    throw error;
  }
}

export async function getAdherenceEngineData(userId: string): Promise<AdherenceEngineData> {
  try {
    const response = await fetch(`${API_BASE_URL}/adherence/${userId}/today`);
    const data = await response.json();
    
    if (data.success) {
      return {
        overallAdherence: data.data.adherenceScore, // API returns 'adherenceScore' not 'overallAdherence'
        domains: {
          workout: data.data.breakdown?.workout || 0,
          nutrition: data.data.breakdown?.nutrition || 0,
          supplement: data.data.breakdown?.supplement || 0,
        },
        trends: {
          workout: data.data.trend || 'stable',
          nutrition: data.data.trend || 'stable',
          supplement: data.data.trend || 'stable',
        },
        recommendations: [data.data.recommendation?.summary || ''],
        timestamp: data.data.createdAt,
      };
    }
    throw new Error('Failed to fetch adherence engine data');
  } catch (error) {
    console.error('Error fetching adherence engine data:', error);
    throw error;
  }
}

export async function getSupplementEngineData(userId: string): Promise<SupplementEngineData> {
  try {
    const response = await fetch(`${API_BASE_URL}/supplements/recommendations/${userId}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        recommendations: data.data.recommendations || [],
        currentStack: [],
        timestamp: data.data.generatedAt || new Date().toISOString(),
      };
    }
    throw new Error('Failed to fetch supplement engine data');
  } catch (error) {
    console.error('Error fetching supplement engine data:', error);
    throw error;
  }
}

export async function getWorkoutEngineData(userId: string): Promise<WorkoutEngineData> {
  try {
    // Workout engine API not yet implemented - return mock data
    return {
      todayWorkout: null,
      adjustments: [],
      recommendations: ['No workout data available yet'],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching workout engine data:', error);
    throw error;
  }
}

export async function getLatestBloodwork(userId: string): Promise<BloodworkLatest | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/bloodwork/results/latest?user_id=${userId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching latest bloodwork:', error);
    return null;
  }
}

export async function getTodayRecommendations(userId: string): Promise<TodayRecommendation[]> {
  try {
    // Aggregate recommendations from all engines
    const [recovery, stress, joint, adherence, supplement, workout] = await Promise.all([
      getRecoveryEngineData(userId).catch(() => null),
      getStressEngineData(userId).catch(() => null),
      getJointHealthEngineData(userId).catch(() => null),
      getAdherenceEngineData(userId).catch(() => null),
      getSupplementEngineData(userId).catch(() => null),
      getWorkoutEngineData(userId).catch(() => null),
    ]);

    const recommendations: TodayRecommendation[] = [];

    if (recovery?.recommendations) {
      recovery.recommendations.forEach(rec => {
        recommendations.push({
          source: 'Recovery Engine',
          category: 'recovery',
          text: rec,
          priority: 'medium',
        });
      });
    }

    if (stress?.recommendations) {
      stress.recommendations.forEach(rec => {
        recommendations.push({
          source: 'Stress Engine',
          category: 'stress',
          text: rec,
          priority: stress.stressLevel === 'high' ? 'high' : 'medium',
        });
      });
    }

    if (joint?.recommendations) {
      joint.recommendations.forEach(rec => {
        recommendations.push({
          source: 'Joint Health Engine',
          category: 'joint_health',
          text: rec,
          priority: joint.injuryRisk === 'high' ? 'high' : 'medium',
        });
      });
    }

    if (adherence?.recommendations) {
      adherence.recommendations.forEach(rec => {
        recommendations.push({
          source: 'Adherence Engine',
          category: 'adherence',
          text: rec,
          priority: 'low',
        });
      });
    }

    if (supplement?.recommendations) {
      supplement.recommendations.forEach(rec => {
        recommendations.push({
          source: 'Supplement Engine',
          category: 'supplements',
          text: `${rec.action.toUpperCase()}: ${rec.supplement} - ${rec.rationale}`,
          priority: rec.severity === 'high' ? 'high' : rec.severity === 'medium' ? 'medium' : 'low',
        });
      });
    }

    if (workout?.recommendations) {
      workout.recommendations.forEach(rec => {
        recommendations.push({
          source: 'Workout Engine',
          category: 'workout',
          text: rec,
          priority: 'medium',
        });
      });
    }

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  } catch (error) {
    console.error('Error fetching today recommendations:', error);
    return [];
  }
}

// Fetch all dashboard data in one call
export async function getAllDashboardData(userId: string) {
  try {
    const [
      controlTower,
      recovery,
      stress,
      jointHealth,
      adherence,
      supplements,
      workout,
      bloodwork,
      recommendations,
    ] = await Promise.allSettled([
      getControlTowerData(userId),
      getRecoveryEngineData(userId),
      getStressEngineData(userId),
      getJointHealthEngineData(userId),
      getAdherenceEngineData(userId),
      getSupplementEngineData(userId),
      getWorkoutEngineData(userId),
      getLatestBloodwork(userId),
      getTodayRecommendations(userId),
    ]);

    return {
      controlTower: controlTower.status === 'fulfilled' ? controlTower.value : null,
      recovery: recovery.status === 'fulfilled' ? recovery.value : null,
      stress: stress.status === 'fulfilled' ? stress.value : null,
      jointHealth: jointHealth.status === 'fulfilled' ? jointHealth.value : null,
      adherence: adherence.status === 'fulfilled' ? adherence.value : null,
      supplements: supplements.status === 'fulfilled' ? supplements.value : null,
      workout: workout.status === 'fulfilled' ? workout.value : null,
      bloodwork: bloodwork.status === 'fulfilled' ? bloodwork.value : null,
      recommendations: recommendations.status === 'fulfilled' ? recommendations.value : [],
    };
  } catch (error) {
    console.error('Error fetching all dashboard data:', error);
    throw error;
  }
}
