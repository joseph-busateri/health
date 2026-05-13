/**
 * DailyHealthSnapshot - Unified data model for all health intelligence
 * 
 * Architecture:
 * - This is the SINGLE SOURCE OF TRUTH for daily health state
 * - All engines write their outputs here
 * - All consumers (Control Tower, Recommendation Engine, UI) read from here
 * - Replaces: EngineSnapshot, InterviewContext, UnifiedHealthProfile
 * 
 * Ownership:
 * - Individual engines own domain calculations (recovery score, stress score, etc.)
 * - DailyHealthSnapshotService owns cross-engine aggregation and derived intelligence
 * - This model is the contract between engines and consumers
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type HealthStatus = 'optimal' | 'stable' | 'moderate' | 'at_risk' | 'critical';
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type ReadinessLevel = 'low' | 'moderate' | 'high';
export type CNSLoadLevel = 'low' | 'moderate' | 'high' | 'overreached';
export type JointStatus = 'stable' | 'caution' | 'aggravated';
export type DataSource = 'device' | 'interview' | 'manual' | 'derived' | 'bloodwork';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// ============================================================================
// RECOVERY SECTION
// ============================================================================

export interface RecoverySnapshot {
  score: number | null; // 0-100
  status: HealthStatus;
  trend: TrendDirection;
  
  // Source signals
  hrv?: number; // ms
  sleepHours?: number;
  sleepQuality?: number; // 1-5
  restingHr?: number; // bpm
  verbalRecoveryFeeling?: number; // 1-5
  
  // Metadata
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}

// ============================================================================
// STRESS SECTION
// ============================================================================

export interface StressSnapshot {
  score: number | null; // 0-100 (higher = less stress)
  status: HealthStatus;
  trend: TrendDirection;
  cnsLoad: CNSLoadLevel;
  
  // Source signals
  interviewStressLevel?: number; // 1-10
  hrvStressIndicator?: number;
  sleepDisruption?: boolean;
  
  // Metadata
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}

// ============================================================================
// WORKOUT SECTION
// ============================================================================

export interface WorkoutSnapshot {
  readinessScore: number | null; // 0-100
  readinessStatus: ReadinessLevel;
  
  // Today's workout
  todayWorkoutPlan?: {
    day: string;
    focus: string;
    exercises: number;
    adjustments: string[];
  };
  
  // Workout load
  workoutLoad?: number; // 0-100
  targetedFocus?: string[]; // Lagging muscle groups
  
  // Metadata
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}

// ============================================================================
// BODY COMPOSITION SECTION
// ============================================================================

export interface BodyCompositionSnapshot {
  // Core metrics
  weight?: number; // lbs or kg
  bodyFat?: number; // percentage
  muscleMass?: number; // lbs or kg
  visceralFat?: number; // level
  
  // Segmental analysis
  segmental?: {
    leftArm?: number;
    rightArm?: number;
    trunk?: number;
    leftLeg?: number;
    rightLeg?: number;
  };
  
  // Derived metrics
  leanBodyMass?: number;
  bodyMassIndex?: number;
  
  // Trends
  weightTrend?: TrendDirection;
  bodyFatTrend?: TrendDirection;
  
  // Metadata
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}

// ============================================================================
// SEXUAL HEALTH SECTION
// ============================================================================

export interface SexualHealthSnapshot {
  score: number | null; // 0-100
  status: HealthStatus;
  trend: TrendDirection;
  
  // Hormonal signals
  testosterone?: {
    total?: number; // ng/dL
    free?: number; // pg/mL
    status: 'optimal' | 'suboptimal' | 'low';
  };
  estradiol?: number; // pg/mL
  shbg?: number; // nmol/L
  prolactin?: number; // ng/mL
  
  // Functional signals
  libidoLevel?: number; // 1-10
  erectileFunctionScore?: number; // 1-10
  morningErections?: number; // per week
  
  // Metadata
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}

// ============================================================================
// METABOLIC SECTION
// ============================================================================

export interface MetabolicSnapshot {
  score: number | null; // 0-100
  status: HealthStatus;
  trend: TrendDirection;
  
  // Glucose metrics
  glucose?: {
    fasting?: number; // mg/dL
    status: 'optimal' | 'prediabetic' | 'diabetic';
  };
  a1c?: {
    value?: number; // percentage
    status: 'optimal' | 'prediabetic' | 'diabetic';
    trend: TrendDirection;
  };
  insulin?: number; // μU/mL
  
  // Derived metrics
  insulinSensitivity?: number; // 0-100 estimate
  metabolicRisk: RiskLevel;
  
  // Metadata
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}

// ============================================================================
// CARDIOVASCULAR SECTION
// ============================================================================

export interface CardiovascularSnapshot {
  riskScore: number | null; // 0-100
  riskLevel: RiskLevel;
  trend: TrendDirection;
  
  // Lipid panel
  lipids?: {
    ldl?: number; // mg/dL
    hdl?: number; // mg/dL
    triglycerides?: number; // mg/dL
    totalCholesterol?: number; // mg/dL
    apoB?: number; // mg/dL
    lpA?: number; // nmol/L
  };
  
  // Inflammatory markers
  hsCRP?: number; // mg/L
  
  // Vitals
  bloodPressure?: {
    systolic?: number; // mmHg
    diastolic?: number; // mmHg
    status: 'optimal' | 'elevated' | 'hypertensive';
  };
  restingHr?: number; // bpm
  hrv?: number; // ms
  
  // Derived risk
  cardiovascularRisk: RiskLevel;
  
  // Metadata
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}

// ============================================================================
// ADHERENCE SECTION
// ============================================================================

export interface AdherenceSnapshot {
  overallScore: number | null; // 0-100
  status: HealthStatus;
  trend: TrendDirection;
  
  // Domain breakdown
  breakdown: {
    workout: number; // 0-100
    nutrition: number; // 0-100
    sleep: number; // 0-100
    supplement: number; // 0-100
  };
  
  // Metadata
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}

// ============================================================================
// JOINT HEALTH SECTION (Part of Workout/Performance)
// ============================================================================

export interface JointHealthSnapshot {
  status: JointStatus;
  riskLevel: RiskLevel;
  
  // Active issues
  affectedAreas?: string[]; // 'knee', 'shoulder', 'elbow', etc.
  painLevel?: number; // 0-10
  tightness?: number; // 0-10
  soreness?: number; // 0-10
  
  // Recommendations
  workoutModifications?: string[];
  
  // Metadata
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}

// ============================================================================
// NUTRITION SECTION (Future)
// ============================================================================

export interface NutritionSnapshot {
  // Targets
  calorieTarget?: number;
  macroTargets?: {
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
  };
  hydrationTarget?: number; // ounces
  
  // Actual intake (if tracked)
  actualIntake?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    hydration?: number;
  };
  
  // Adherence
  adherenceScore?: number; // 0-100
  
  // Metadata
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}

// ============================================================================
// PREDICTION SECTION (Future)
// ============================================================================

export interface PredictionSnapshot {
  // Weight projections
  weightProjection?: {
    fourWeeks?: number;
    eightWeeks?: number;
    twelveWeeks?: number;
  };
  
  // Body fat projections
  bodyFatProjection?: {
    fourWeeks?: number;
    eightWeeks?: number;
    twelveWeeks?: number;
  };
  
  // A1c projections
  a1cProjection?: {
    twelveWeeks?: number;
    twentyFourWeeks?: number;
  };
  
  // Performance projections
  performanceProjection?: {
    fourWeeks?: number;
    eightWeeks?: number;
    twelveWeeks?: number;
  };
  
  // Confidence intervals
  confidence: ConfidenceLevel;
  
  // Metadata
  lastUpdated: string;
  dataSource: DataSource;
}

// ============================================================================
// DERIVED INTELLIGENCE SECTION
// ============================================================================

/**
 * Cross-engine derived intelligence
 * Calculated by DailyHealthSnapshotService, not individual engines
 */
export interface DerivedIntelligence {
  // Overall health
  overallScore: number | null; // 0-100, weighted average of all components
  overallStatus: HealthStatus;
  overallTrend: TrendDirection;
  
  // Risk signals (cross-engine analysis)
  fatigueRisk: RiskLevel; // Low recovery + high stress + high workout load
  overtrainingRisk: RiskLevel; // Declining HRV + declining performance + persistent soreness
  injuryRisk: RiskLevel; // High joint pain + low recovery + high workout load
  metabolicRisk: RiskLevel; // Glucose/A1c trends + body fat + nutrition adherence
  cardiovascularRisk: RiskLevel; // Lipids + BP + HR + body fat
  
  // Performance indicators
  readinessScore: number | null; // 0-100, composite of recovery + stress + joint health
  performanceCapacity: number | null; // 0-100, ability to perform at high level today
  
  // Trend analysis
  sleepTrend: TrendDirection; // 7-day moving average
  performanceTrend: TrendDirection; // 7-day moving average
  recoveryTrend: TrendDirection; // 7-day moving average
  
  // Calculated at
  calculatedAt: string;
}

// ============================================================================
// DATA QUALITY SECTION
// ============================================================================

/**
 * Tracks data availability, freshness, and confidence
 */
export interface DataQuality {
  // Data availability by domain
  recoveryDataAvailable: boolean;
  stressDataAvailable: boolean;
  workoutDataAvailable: boolean;
  bodyCompDataAvailable: boolean;
  bloodworkDataAvailable: boolean;
  sexualHealthDataAvailable: boolean;
  metabolicDataAvailable: boolean;
  cardiovascularDataAvailable: boolean;
  adherenceDataAvailable: boolean;
  jointHealthDataAvailable: boolean;
  
  // Freshness
  lastUpdated: string; // ISO timestamp of most recent update
  deviceSyncRecency?: string; // Human-readable: "14 minutes ago"
  bloodworkRecency?: string; // Human-readable: "3 weeks ago"
  bodyCompRecency?: string; // Human-readable: "2 days ago"
  
  // Overall data state
  dataCompletenessScore: number; // 0-100, percentage of available data
  dataAvailabilityState: 'complete' | 'partial' | 'minimal';
  
  // Missing data sources
  missingDataSources: string[];
  
  // Confidence
  overallConfidence: ConfidenceLevel;
}

// ============================================================================
// MAIN SNAPSHOT INTERFACE
// ============================================================================

/**
 * DailyHealthSnapshot - Complete daily health state
 * 
 * This is the unified model that replaces:
 * - EngineSnapshot (engineStateService.ts)
 * - InterviewContext (interviewContextAggregator.ts)
 * - UnifiedHealthProfile (healthProfileAggregation.ts)
 */
export interface DailyHealthSnapshot {
  // Identity
  userId: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO timestamp
  
  // Core health domains (from individual engines)
  recovery: RecoverySnapshot;
  stress: StressSnapshot;
  workout: WorkoutSnapshot;
  bodyComposition: BodyCompositionSnapshot;
  sexualHealth: SexualHealthSnapshot;
  metabolic: MetabolicSnapshot;
  cardiovascular: CardiovascularSnapshot;
  adherence: AdherenceSnapshot;
  jointHealth: JointHealthSnapshot;
  
  // Future domains (placeholders)
  nutrition?: NutritionSnapshot;
  prediction?: PredictionSnapshot;
  
  // Cross-engine intelligence (calculated by DailyHealthSnapshotService)
  derivedIntelligence: DerivedIntelligence;
  
  // Data quality tracking
  dataQuality: DataQuality;
  
  // Versioning (for future schema evolution)
  schemaVersion: string; // e.g., "1.0.0"
}

// ============================================================================
// HELPER TYPES FOR SNAPSHOT GENERATION
// ============================================================================

/**
 * Input from individual engines to build snapshot
 */
export interface SnapshotEngineInput {
  recovery?: RecoverySnapshot;
  stress?: StressSnapshot;
  workout?: WorkoutSnapshot;
  bodyComposition?: BodyCompositionSnapshot;
  sexualHealth?: SexualHealthSnapshot;
  metabolic?: MetabolicSnapshot;
  cardiovascular?: CardiovascularSnapshot;
  adherence?: AdherenceSnapshot;
  jointHealth?: JointHealthSnapshot;
  nutrition?: NutritionSnapshot;
  prediction?: PredictionSnapshot;
}

/**
 * Configuration for derived intelligence calculation
 */
export interface DerivedIntelligenceConfig {
  // Component weights for overall score
  weights: {
    cardiovascular: number; // 0.25
    recovery: number; // 0.25
    metabolic: number; // 0.20
    performance: number; // 0.20
    sexualHealth: number; // 0.10
  };
  
  // Risk thresholds
  riskThresholds: {
    fatigue: { low: number; moderate: number; high: number };
    overtraining: { low: number; moderate: number; high: number };
    injury: { low: number; moderate: number; high: number };
  };
  
  // Status thresholds
  statusThresholds: {
    optimal: number; // >= 80
    stable: number; // >= 60
    moderate: number; // >= 40
    atRisk: number; // < 40
  };
}

// ============================================================================
// CACHE TYPES
// ============================================================================

/**
 * Cache metadata for snapshot
 */
export interface SnapshotCacheMetadata {
  userId: string;
  date: string;
  cachedAt: string;
  expiresAt: string;
  ttlMinutes: number;
}

/**
 * Cached snapshot with metadata
 */
export interface CachedSnapshot {
  snapshot: DailyHealthSnapshot;
  metadata: SnapshotCacheMetadata;
}
