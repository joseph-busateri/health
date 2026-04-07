import api from './api';

export interface ControlTowerTrustMetadata {
  lastUpdated?: string;
  dataAvailabilityState: 'complete' | 'partial' | 'minimal';
  missingDataSources?: string[];
  deviceSyncRecency?: string;
}

export interface ControlTowerPriorityCard {
  priority: 'critical' | 'important' | 'optimization';
  title: string;
  source: string;
  actions?: string[];
}

export interface ControlTowerPredictiveCard {
  level: 'low' | 'moderate' | 'high';
  title: string;
  rationale?: string;
}

export interface ControlTowerWorkoutCard {
  title: string;
  summary: string;
  workoutType?: string;
  cycleWeek?: number;
  cyclePhase?: string;
  topAdjustments?: string[];
}

export interface ControlTowerNutritionCard {
  title: string;
  summary: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  hydrationOz?: number;
  topAdjustments?: string[];
}

export interface ControlTowerQuickActions {
  askCoach?: boolean;
  viewWorkout?: boolean;
  viewNutrition?: boolean;
  viewPriorities?: boolean;
}

export interface ControlTowerDailyResponse {
  id: string;
  userId: string;
  date: string;
  overallStatus: 'optimal' | 'moderate' | 'constrained' | 'high_risk';
  headline: string;
  reasoning: string;
  trust: ControlTowerTrustMetadata;
  priorities: ControlTowerPriorityCard[];
  predictiveAlerts: ControlTowerPredictiveCard[];
  workout: ControlTowerWorkoutCard;
  nutrition: ControlTowerNutritionCard;
  quickActions: ControlTowerQuickActions;
  source: 'control_tower_daily';
  createdAt: string;
}

export const controlTowerDailyService = {
  getToday: async (userId: string, regenerate = false): Promise<ControlTowerDailyResponse> => {
    const response = await api.get<{ success: boolean; data: ControlTowerDailyResponse }>(
      `/control-tower/${userId}/today${regenerate ? '?regenerate=true' : ''}`
    );
    return response.data.data;
  },

  getHistory: async (userId: string): Promise<ControlTowerDailyResponse[]> => {
    const response = await api.get<{ success: boolean; data: ControlTowerDailyResponse[] }>(
      `/control-tower/${userId}/history`
    );
    return response.data.data;
  },
};

export default controlTowerDailyService;
