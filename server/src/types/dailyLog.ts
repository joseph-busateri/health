import type { BaselineConfig } from './baselineConfig';

export interface DailyLogInput {
  userId: string;
  date?: string; // ISO date string
  sleepHours: number;
  recoveryFeeling: number;
  stressLevel: number;
  workoutAdherence: number;
  notes?: string;
}

export interface DailyLogRecord extends Omit<DailyLogInput, 'date'> {
  id: string;
  date: string;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface SimilarLogMatch {
  id: string;
  similarity: number;
  log: DailyLogRecord;
}

export interface SaveDailyLogResult {
  logSaved: boolean;
  embeddingSaved: boolean;
  warning?: string;
  log: DailyLogRecord;
}

export type ComponentStatus = 'Optimal' | 'Stable' | 'At Risk';
export type ComponentTrend = 'Improving' | 'Stable' | 'Declining';

export type HealthComponentKey = 'cv' | 'rec' | 'met' | 'perf' | 'sh';

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

export interface DashboardSummary {
  latestLog: DailyLogRecord | null;
  recoveryScore: 'low' | 'moderate' | 'high' | null;
  overallHealthScore: number | null;
  status: 'Optimal' | 'Stable' | 'At Risk' | 'No Data';
  dailyRecommendation: string;
  trendSummary: string;
  baselineConfig: BaselineConfig;
  controlTower: ControlTowerSummary;
}
