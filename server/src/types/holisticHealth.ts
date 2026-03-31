export interface BloodworkSummary {
  markers: Array<{
    name: string;
    normalizedName: string;
    category: string;
    latestValue: number;
    priorValue?: number;
    unit: string;
    trendDirection: 'improving' | 'worsening' | 'stable';
    changePercent?: number;
    referenceRangeLow?: number;
    referenceRangeHigh?: number;
    abnormalFlag?: string;
    isOutOfRange: boolean;
  }>;
  lastTestDate?: string;
  dataPoints: number;
}

export interface SleepSummary {
  avgDuration: number;
  avgDeepSleep: number;
  avgRemSleep: number;
  avgRestfulness: number;
  trendDirection: 'improving' | 'worsening' | 'stable';
  lastNightDuration?: number;
  lastNightQuality?: number;
  dataPoints: number;
}

export interface BodyCompositionSummary {
  metrics: Array<{
    name: string;
    latestValue: number;
    priorValue?: number;
    unit: string;
    trendDirection: 'improving' | 'worsening' | 'stable';
    changePercent?: number;
  }>;
  lastMeasurementDate?: string;
  dataPoints: number;
}

export interface ActivitySummary {
  weeklyExerciseDays: number;
  avgIntensity: 'low' | 'medium' | 'high';
  avgDuration: number;
  trendDirection: 'improving' | 'worsening' | 'stable';
  dataPoints: number;
}

export interface StressSummary {
  avgDailyScore: number;
  trendDirection: 'improving' | 'worsening' | 'stable';
  highStressDays: number;
  dataPoints: number;
}

export interface NutritionSummary {
  avgCalories?: number;
  avgProtein?: number;
  avgCarbs?: number;
  avgFat?: number;
  dataPoints: number;
}

export interface UnifiedHealthProfile {
  userId: string;
  bloodwork?: BloodworkSummary;
  sleep?: SleepSummary;
  bodyComposition?: BodyCompositionSummary;
  activity?: ActivitySummary;
  stress?: StressSummary;
  nutrition?: NutritionSummary;
  generatedAt: string;
  dataCompleteness: {
    bloodwork: boolean;
    sleep: boolean;
    bodyComposition: boolean;
    activity: boolean;
    stress: boolean;
    nutrition: boolean;
  };
}

export interface HealthInterconnection {
  from: string;
  to: string;
  relationship: string;
  confidence: number;
}

export interface HolisticRecommendation {
  id: string;
  userId: string;
  priority: 1 | 2 | 3;
  issue: string;
  rootCauses: string[];
  interconnections: HealthInterconnection[];
  rationale: string;
  actions: string[];
  affectedSystems: string[];
  confidence: number;
  generationMethod: 'decision_tree' | 'ai_analysis' | 'hybrid';
  aiCost?: number;
  createdAt: string;
}

export interface HolisticAnalysisResult {
  profile: UnifiedHealthProfile;
  recommendations: HolisticRecommendation[];
  rootCauses: string[];
  topPriority: {
    issue: string;
    rationale: string;
    actions: string[];
  };
  secondaryPriorities: Array<{
    issue: string;
    actions: string[];
  }>;
  interconnections: HealthInterconnection[];
  generationMethod: 'decision_tree' | 'ai_analysis' | 'hybrid';
  processingTime: number;
  totalCost: number;
}

export interface DecisionTreeNode {
  id: string;
  name: string;
  condition: (profile: UnifiedHealthProfile) => boolean;
  priority: number;
  recommendation?: {
    issue: string;
    rootCauses: string[];
    rationale: string;
    actions: string[];
    affectedSystems: string[];
    interconnections: HealthInterconnection[];
  };
  children?: DecisionTreeNode[];
  confidence: number;
}

export interface DecisionTreeResult {
  matched: boolean;
  confidence: number;
  matchedNodes: DecisionTreeNode[];
  recommendations: HolisticRecommendation[];
  shouldUseAI: boolean;
}
