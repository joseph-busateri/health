// Type definitions for all intelligence engines

export interface RecoveryEngineData {
  recoveryScore: number;
  recoveryStatus: 'optimal' | 'moderate' | 'poor';
  hrv: number | null;
  sleepQuality: number | null;
  sleepDuration: number | null;
  recommendations: string[];
  timestamp: string;
}

export interface StressEngineData {
  stressScore: number;
  stressLevel: 'low' | 'moderate' | 'high';
  hrvVariability: number | null;
  workload: number | null;
  recommendations: string[];
  timestamp: string;
}

export interface JointHealthEngineData {
  jointHealthScore: number;
  injuryRisk: 'low' | 'moderate' | 'high';
  painReports: Array<{
    location: string;
    severity: number;
    date: string;
  }>;
  workoutModifications: string[];
  recommendations: string[];
  timestamp: string;
}

export interface AdherenceEngineData {
  overallAdherence: number;
  domains: {
    workout: number;
    nutrition: number;
    supplement: number;
  };
  trends: {
    workout: 'improving' | 'stable' | 'declining';
    nutrition: 'improving' | 'stable' | 'declining';
    supplement: 'improving' | 'stable' | 'declining';
  };
  recommendations: string[];
  timestamp: string;
}

export interface SupplementRecommendation {
  supplement: string;
  action: 'add' | 'remove' | 'adjust';
  dosage?: string;
  timing?: string;
  rationale: string;
  severity: 'low' | 'medium' | 'high';
  priority: number;
}

export interface SupplementEngineData {
  recommendations: SupplementRecommendation[];
  currentStack: Array<{
    name: string;
    dosage: string;
    timing: string;
  }>;
  timestamp: string;
}

export interface WorkoutAdjustment {
  exercise: string;
  modification: string;
  rationale: string;
}

export interface WorkoutEngineData {
  todayWorkout: {
    name: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      notes?: string;
    }>;
  } | null;
  adjustments: WorkoutAdjustment[];
  recommendations: string[];
  timestamp: string;
}

export interface ControlTowerData {
  overallScore: number | null;
  overallStatus: 'Optimal' | 'Stable' | 'At Risk' | 'No Data';
  components: {
    cv: { score: number | null; status: string };
    rec: { score: number | null; status: string };
    met: { score: number | null; status: string };
    perf: { score: number | null; status: string };
    sh: { score: number | null; status: string };
  };
  timestamp: string;
}

export interface BloodworkLatest {
  documentId: string;
  uploadDate: string;
  keyMarkers: Array<{
    name: string;
    value: number;
    unit: string;
    status: 'normal' | 'borderline' | 'abnormal';
  }>;
  concerns: string[];
}

export interface TodayRecommendation {
  source: string;
  category: string;
  text: string;
  priority: 'low' | 'medium' | 'high';
}
