// Body Composition Types
// Supports smart scale data (InBody, DEXA, etc.) with comprehensive tracking

export type BodyCompositionSource = 
  | 'inbody_s2' 
  | 'inbody_570' 
  | 'inbody_770' 
  | 'dexa' 
  | 'manual' 
  | 'other_scale';

export type Gender = 'male' | 'female' | 'other';
export type ScanQuality = 'excellent' | 'good' | 'fair' | 'poor';
export type BodyType = 'athletic' | 'standard' | 'obese' | 'underweight';
export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';
export type MuscleFatRating = 'excellent' | 'good' | 'normal' | 'weak' | 'very_weak';
export type GoalType = 'weight_loss' | 'muscle_gain' | 'fat_loss' | 'recomp' | 'maintenance';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';
export type DocumentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================================================
// BODY COMPOSITION SCAN
// ============================================================================

export interface BodyCompositionScan {
  id: string;
  userId: string;
  
  // Scan metadata
  scanDate: string;
  scanTime?: string;
  scanSource: BodyCompositionSource;
  scanId?: string;
  
  // User demographics at time of scan
  heightInches?: number;
  age?: number;
  gender?: Gender;
  
  // Core measurements (in pounds)
  weightLb: number;
  
  // Body composition breakdown (in pounds)
  totalBodyWaterLb?: number;
  dryLeanMassLb?: number;
  bodyFatMassLb?: number;
  
  // Percentages
  bodyFatPercentage?: number;
  leanBodyMassPercentage?: number;
  bodyWaterPercentage?: number;
  
  // Muscle mass
  skeletalMuscleMassLb?: number;
  skeletalMuscleMassPercentage?: number;
  
  // Fat distribution
  visceralFatLevel?: number;
  visceralFatAreaCm2?: number;
  subcutaneousFatPercentage?: number;
  
  // Bone and protein
  boneMineralContentLb?: number;
  proteinMassLb?: number;
  proteinPercentage?: number;
  
  // Metabolic metrics
  basalMetabolicRateKcal?: number;
  totalEnergyExpenditureKcal?: number;
  
  // Body metrics
  bmi?: number;
  bodyMassIndexCategory?: BMICategory;
  metabolicAge?: number;
  bodyType?: BodyType;
  
  // Segmental analysis (arms, legs, trunk) - in pounds
  rightArmMuscleLb?: number;
  leftArmMuscleLb?: number;
  trunkMuscleLb?: number;
  rightLegMuscleLb?: number;
  leftLegMuscleLb?: number;
  
  rightArmFatLb?: number;
  leftArmFatLb?: number;
  trunkFatLb?: number;
  rightLegFatLb?: number;
  leftLegFatLb?: number;
  
  // Segmental lean mass percentages
  rightArmLeanPercentage?: number;
  leftArmLeanPercentage?: number;
  trunkLeanPercentage?: number;
  rightLegLeanPercentage?: number;
  leftLegLeanPercentage?: number;
  
  // Body balance
  muscleBalanceScore?: number;
  upperLowerBalanceScore?: number;
  
  // Health scores and ratings
  overallHealthScore?: number;
  muscleFatAnalysisRating?: MuscleFatRating;
  obesityDegree?: number;
  
  // Intracellular/Extracellular water (advanced metrics)
  intracellularWaterLb?: number;
  extracellularWaterLb?: number;
  ecwIcwRatio?: number;
  
  // Phase angle (cellular health indicator)
  phaseAngleDegrees?: number;
  
  // Document reference
  documentId?: string;
  
  // Quality and notes
  scanQuality?: ScanQuality;
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateBodyCompositionScanInput {
  userId: string;
  scanDate: string;
  scanTime?: string;
  scanSource: BodyCompositionSource;
  scanId?: string;
  
  // Demographics
  heightInches?: number;
  age?: number;
  gender?: Gender;
  
  // Core measurements
  weightLb: number;
  
  // Body composition
  totalBodyWaterLb?: number;
  dryLeanMassLb?: number;
  bodyFatMassLb?: number;
  bodyFatPercentage?: number;
  leanBodyMassPercentage?: number;
  bodyWaterPercentage?: number;
  
  // Muscle
  skeletalMuscleMassLb?: number;
  skeletalMuscleMassPercentage?: number;
  
  // Fat
  visceralFatLevel?: number;
  visceralFatAreaCm2?: number;
  subcutaneousFatPercentage?: number;
  
  // Bone and protein
  boneMineralContentLb?: number;
  proteinMassLb?: number;
  proteinPercentage?: number;
  
  // Metabolic
  basalMetabolicRateKcal?: number;
  totalEnergyExpenditureKcal?: number;
  
  // Body metrics
  bmi?: number;
  bodyMassIndexCategory?: BMICategory;
  metabolicAge?: number;
  bodyType?: BodyType;
  
  // Segmental analysis
  rightArmMuscleLb?: number;
  leftArmMuscleLb?: number;
  trunkMuscleLb?: number;
  rightLegMuscleLb?: number;
  leftLegMuscleLb?: number;
  rightArmFatLb?: number;
  leftArmFatLb?: number;
  trunkFatLb?: number;
  rightLegFatLb?: number;
  leftLegFatLb?: number;
  rightArmLeanPercentage?: number;
  leftArmLeanPercentage?: number;
  trunkLeanPercentage?: number;
  rightLegLeanPercentage?: number;
  leftLegLeanPercentage?: number;
  
  // Balance
  muscleBalanceScore?: number;
  upperLowerBalanceScore?: number;
  
  // Health scores
  overallHealthScore?: number;
  muscleFatAnalysisRating?: MuscleFatRating;
  obesityDegree?: number;
  
  // Advanced metrics
  intracellularWaterLb?: number;
  extracellularWaterLb?: number;
  ecwIcwRatio?: number;
  phaseAngleDegrees?: number;
  
  // Document
  documentId?: string;
  
  // Quality
  scanQuality?: ScanQuality;
  notes?: string;
}

// ============================================================================
// BODY COMPOSITION DOCUMENT
// ============================================================================

export interface BodyCompositionDocument {
  id: string;
  userId: string;
  
  // Document info
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  
  // Processing status
  processingStatus: DocumentProcessingStatus;
  processingError?: string;
  
  // Extracted data
  extractedText?: string;
  parsedScanData?: ParsedScanData;
  
  // Detected scan source
  detectedSource?: BodyCompositionSource;
  
  uploadedAt: string;
  processedAt?: string;
}

// ============================================================================
// PARSED SCAN DATA (from image/PDF)
// ============================================================================

export interface ParsedScanData {
  // User info
  scanId?: string;
  height?: string;
  age?: number;
  gender?: Gender;
  testDate?: string;
  
  // Core measurements
  weight?: number;
  weightUnit?: 'lb' | 'kg';
  
  // Body composition
  totalBodyWater?: number;
  dryLeanMass?: number;
  bodyFatMass?: number;
  bodyFatPercentage?: number;
  
  // Additional metrics (if available)
  skeletalMuscleMass?: number;
  visceralFatLevel?: number;
  bmi?: number;
  bmr?: number;
  
  // Segmental data (if available)
  segmentalAnalysis?: {
    rightArm?: SegmentalData;
    leftArm?: SegmentalData;
    trunk?: SegmentalData;
    rightLeg?: SegmentalData;
    leftLeg?: SegmentalData;
  };
  
  // Raw extracted fields
  rawFields?: Record<string, any>;
}

export interface SegmentalData {
  muscle?: number;
  fat?: number;
  leanPercentage?: number;
}

// ============================================================================
// BODY COMPOSITION GOAL
// ============================================================================

export interface BodyCompositionGoal {
  id: string;
  userId: string;
  
  // Goal metadata
  goalName: string;
  goalType: GoalType;
  createdBy: 'user' | 'agent';
  
  // Target metrics
  targetWeightLb?: number;
  targetBodyFatPercentage?: number;
  targetLeanMassLb?: number;
  targetSkeletalMuscleLb?: number;
  targetVisceralFatLevel?: number;
  
  // Timeline
  targetDate?: string;
  weeklyRateOfChange?: number;
  
  // Status
  status: GoalStatus;
  
  // Progress tracking
  startingScanId?: string;
  currentProgressPercentage?: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateBodyCompositionGoalInput {
  userId: string;
  goalName: string;
  goalType: GoalType;
  createdBy: 'user' | 'agent';
  targetWeightLb?: number;
  targetBodyFatPercentage?: number;
  targetLeanMassLb?: number;
  targetSkeletalMuscleLb?: number;
  targetVisceralFatLevel?: number;
  targetDate?: string;
  weeklyRateOfChange?: number;
  startingScanId?: string;
}

// ============================================================================
// BODY COMPOSITION TREND
// ============================================================================

export interface BodyCompositionTrend {
  userId: string;
  scanDate: string;
  weightLb: number;
  bodyFatPercentage?: number;
  bodyFatMassLb?: number;
  leanBodyMassPercentage?: number;
  dryLeanMassLb?: number;
  skeletalMuscleMassLb?: number;
  visceralFatLevel?: number;
  bmi?: number;
  basalMetabolicRateKcal?: number;
  
  // Changes from previous scan
  previousWeightLb?: number;
  weightChangeLb?: number;
  previousBodyFatPercentage?: number;
  bodyFatChangePercentage?: number;
  previousMuscleMassLb?: number;
  muscleChangeLb?: number;
  daysSinceLastScan?: number;
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

export interface BodyCompositionAnomaly {
  anomalyType: string;
  severity: 'low' | 'moderate' | 'high';
  description: string;
  recommendation: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface UploadBodyCompositionDocumentRequest {
  userId: string;
  file: Buffer;
  fileName: string;
  mimeType: string;
}

export interface GetLatestBodyCompositionResponse {
  success: boolean;
  data?: {
    scanId: string;
    scanDate: string;
    weightLb: number;
    bodyFatPercentage?: number;
    leanMassLb?: number;
    muscleMassLb?: number;
    visceralFatLevel?: number;
    bmi?: number;
  };
  error?: string;
}

export interface GetBodyCompositionTrendsResponse {
  success: boolean;
  data?: {
    trends: BodyCompositionTrend[];
    summary: {
      totalScans: number;
      dateRange: {
        start: string;
        end: string;
      };
      overallChange: {
        weightLb: number;
        bodyFatPercentage: number;
        muscleMassLb: number;
      };
    };
  };
  error?: string;
}

export interface GetBodyCompositionGoalProgressResponse {
  success: boolean;
  data?: {
    goal: BodyCompositionGoal;
    currentScan: BodyCompositionScan;
    startingScan: BodyCompositionScan;
    progressPercentage: number;
    onTrack: boolean;
    estimatedCompletionDate?: string;
  };
  error?: string;
}

export interface DetectAnomaliesResponse {
  success: boolean;
  data?: {
    anomalies: BodyCompositionAnomaly[];
    hasAnomalies: boolean;
    highSeverityCount: number;
  };
  error?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface BodyCompositionSummary {
  latestScan?: BodyCompositionScan;
  previousScan?: BodyCompositionScan;
  changes: {
    weightLb: number;
    bodyFatPercentage: number;
    muscleMassLb: number;
    daysBetweenScans: number;
  };
  activeGoals: BodyCompositionGoal[];
  anomalies: BodyCompositionAnomaly[];
}

// Backward compatibility with existing code
export type BodyCompositionSourceType = BodyCompositionSource;

export interface BodyCompositionUploadInput extends CreateBodyCompositionScanInput {
  takenAt?: string;
  sourceType?: BodyCompositionSource;
  fileUri?: string;
  weightKg?: number;
  bodyFatPercent?: number;
  leanMassKg?: number;
  fatMassKg?: number;
  visceralFatRating?: number;
  metadata?: Record<string, unknown>;
}

export interface BodyCompositionRecord extends BodyCompositionScan {
  takenAt: string;
  processingStatus: 'uploaded' | 'parsed' | 'manual';
}
