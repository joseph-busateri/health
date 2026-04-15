// Actuarial Risk Engine Types
// 10-year cardiovascular risk prediction using validated actuarial models
// Follows established engine architecture pattern (Engines #1-8)

// ============================================================================
// RISK CATEGORIES
// ============================================================================

export type ActuarialRiskCategory = 
  | 'low_risk'        // <5% 10-year risk
  | 'moderate_risk'   // 5-7.5% 10-year risk
  | 'high_risk'       // 7.5-20% 10-year risk
  | 'very_high_risk'; // 20%+ 10-year risk

export type RiskModelType = 
  | 'framingham'  // Framingham Risk Score
  | 'ascvd';      // ASCVD Risk Calculator (Pooled Cohort Equations)

export type SmokingStatus = 'never' | 'former' | 'current';
export type DiabetesStatus = 'none' | 'prediabetes' | 'diabetes';
export type DietQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type RaceCategory = 'white' | 'black' | 'asian' | 'hispanic' | 'other';

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface DemographicProfile {
  age: number;
  gender: 'male' | 'female';
  race: RaceCategory;
  familyHistory: boolean; // Family history of cardiovascular disease
  smokingStatus: SmokingStatus;
}

export interface ClinicalRiskFactors {
  systolicBP: number;
  diastolicBP: number;
  onBPmedication: boolean;
  totalCholesterol: number;
  hdlCholesterol: number;
  ldlCholesterol?: number;
  triglycerides?: number;
  diabetesStatus: DiabetesStatus;
  a1c?: number;
}

export interface LifestyleRiskFactors {
  exerciseFrequency: number; // days per week
  vo2Max?: number; // ml/kg/min
  bmi: number;
  bodyFatPercent?: number;
  dietQuality: DietQuality;
  sleepQuality: number; // 0-100
  stressLevel: number; // 0-100
}

export interface AdvancedRiskMarkers {
  cacScore?: number; // Coronary Artery Calcium score
  hsCRP?: number; // high-sensitivity C-Reactive Protein
  lipoproteinA?: number;
  apoB?: number;
}

export interface ActuarialRiskInputs {
  demographic: DemographicProfile;
  clinical: ClinicalRiskFactors;
  lifestyle: LifestyleRiskFactors;
  advanced?: AdvancedRiskMarkers;
}

// ============================================================================
// RISK MODEL RESULTS
// ============================================================================

export interface RiskModelResult {
  modelType: RiskModelType;
  riskPercentage: number; // 0-100
  riskCategory: ActuarialRiskCategory;
  confidence: number; // 0-1
}

// ============================================================================
// RISK FACTOR ANALYSIS
// ============================================================================

export interface RiskFactorContribution {
  factor: string;
  contribution: number; // % of total risk
  status: 'positive' | 'negative' | 'neutral';
  value: string;
  interpretation: string;
}

// ============================================================================
// EVIDENCE (follows established pattern)
// ============================================================================

export interface ActuarialEvidenceSignal {
  name: string;
  value: number | string | null;
  interpretation: string;
}

export interface ActuarialEvidence {
  framinghamResult?: RiskModelResult;
  ascvdResult?: RiskModelResult;
  combinedRiskPercentage: number;
  combinedRiskCategory: ActuarialRiskCategory;
  riskFactors: RiskFactorContribution[];
  lifestyleAdjustment: number; // % risk reduction/increase
  fitnessAdjustment: number; // % risk reduction
  signals: ActuarialEvidenceSignal[];
  summary: string;
}

// ============================================================================
// RECOMMENDATION (follows established pattern)
// ============================================================================

export interface ActuarialRecommendation {
  type: 'actuarial_risk';
  priority: 'critical' | 'important' | 'optimization';
  summary: string;
  actions: string[];
  riskReductionPotential: number; // % reduction possible
  primaryRiskDrivers: string[];
  preventionStrategies: string[];
  rationale?: string;
  source: 'deterministic' | 'ai_enriched' | 'fallback';
}

// ============================================================================
// RECORD (follows established pattern)
// ============================================================================

export interface ActuarialRiskRecord {
  id: string;
  userId: string;
  date: string;
  inputs: ActuarialRiskInputs;
  evidence: ActuarialEvidence;
  recommendation: ActuarialRecommendation;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// RISK COMPARISON (for tracking changes over time)
// ============================================================================

export interface RiskComparison {
  currentRisk: number;
  previousRisk?: number;
  riskChange?: number; // % change
  trend: 'improving' | 'stable' | 'worsening';
}

// ============================================================================
// RISK STRATIFICATION (for population health)
// ============================================================================

export interface RiskStratification {
  riskCategory: ActuarialRiskCategory;
  populationPercentile?: number; // Where user falls in population
  ageAdjustedRisk?: number; // Risk adjusted for age
  optimalRisk?: number; // Risk if all factors were optimal
}
