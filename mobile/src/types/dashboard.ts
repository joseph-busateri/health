import type { BaselineConfig } from './baselineConfig';

export type ComponentStatus = 'Optimal' | 'Stable' | 'At Risk';
export type ComponentTrend = 'Improving' | 'Stable' | 'Declining';

export type HealthComponentKey = 'rec' | 'perf' | 'met' | 'cv' | 'sh';

export interface HealthComponentScore {
  key: HealthComponentKey;
  label: string;
  score: number | null;
  status: ComponentStatus;
  trend: ComponentTrend;
  insights?: string[];
  recommendation?: string;
}

export interface ControlTowerSummary {
  overallScore: number | null;
  overallStatus: 'Optimal' | 'Stable' | 'At Risk' | 'No Data';
  overallTrend: ComponentTrend;
  components: Record<HealthComponentKey, HealthComponentScore>;
  recommendationSummary: string;
}

export interface DashboardLatestLog {
  id: string;
  date: string;
  sleepHours: number;
  recoveryFeeling: number;
  stressLevel: number;
  workoutAdherence: number;
  notes?: string;
}

export interface DashboardSummary {
  latestLog: DashboardLatestLog | null;
  recoveryScore: 'low' | 'moderate' | 'high' | null;
  overallHealthScore: number | null;
  status: 'Optimal' | 'Stable' | 'At Risk' | 'No Data';
  dailyRecommendation: string;
  trendSummary: string;
  baselineConfig: BaselineConfig;
  controlTower: ControlTowerSummary;
}
