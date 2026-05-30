/**
 * Canonical Source Model - Phase 18
 * 
 * Purpose: Unified data source model for all ingestion types
 * Enables vertical slice integration across all data sources
 */

// ============================================================================
// SOURCE TYPES
// ============================================================================

export type SourceType =
  | 'baseline'
  | 'bloodwork'
  | 'bodyComposition'
  | 'workoutProgram'
  | 'device'
  | 'dailyInterview'
  | 'nutrition'
  | 'supplements'
  | 'execution'
  | 'physiquePhoto'
  | 'manualEntry';

export type SourceSystem =
  | 'upload'
  | 'whoop'
  | 'oura'
  | 'garmin'
  | 'appleHealth'
  | 'manual'
  | 'ai_interview'
  | 'execution_tracker'
  | 'derived';

export type DataQuality = 'high' | 'medium' | 'low' | 'insufficient';

export type IngestionStatus = 
  | 'pending'
  | 'processing'
  | 'normalized'
  | 'validated'
  | 'persisted'
  | 'intelligence_generated'
  | 'failed';

// ============================================================================
// CANONICAL DATA SOURCE
// ============================================================================

export interface DataSource {
  // Identity
  id: string;
  userId: string;
  sourceType: SourceType;
  sourceSystem: SourceSystem;
  
  // Temporal
  ingestedAt: string;
  effectiveDate: string;
  validFrom?: string;
  validUntil?: string;
  
  // Quality
  confidence: number; // 0-1
  dataQuality: DataQuality;
  completeness: number; // 0-1
  
  // Processing
  status: IngestionStatus;
  processingErrors?: string[];
  
  // Metadata
  metadata?: Record<string, any>;
  rawData?: any;
}

// ============================================================================
// SOURCE-SPECIFIC EXTENSIONS
// ============================================================================

export interface BloodworkSource extends DataSource {
  sourceType: 'bloodwork';
  data: {
    labName: string;
    testDate: string;
    biomarkers: Array<{
      name: string;
      value: number;
      unit: string;
      referenceRange?: { min: number; max: number };
      status?: 'normal' | 'low' | 'high' | 'critical';
    }>;
  };
}

export interface BodyCompositionSource extends DataSource {
  sourceType: 'bodyComposition';
  data: {
    weight?: number;
    bodyFat?: number;
    muscleMass?: number;
    visceralFat?: number;
    bmr?: number;
    measurementMethod: 'dexa' | 'bioimpedance' | 'manual' | 'photo';
  };
}

export interface WorkoutProgramSource extends DataSource {
  sourceType: 'workoutProgram';
  data: {
    programName: string;
    duration: number; // weeks
    frequency: number; // sessions per week
    focus: string[];
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      rest: number;
    }>;
  };
}

export interface DeviceSource extends DataSource {
  sourceType: 'device';
  data: {
    deviceType: 'whoop' | 'oura' | 'garmin' | 'appleHealth';
    metrics: {
      hrv?: number;
      restingHR?: number;
      sleep?: {
        duration: number;
        quality: number;
        stages?: Record<string, number>;
      };
      activity?: {
        steps: number;
        calories: number;
        activeMinutes: number;
      };
      recovery?: {
        score: number;
        strain: number;
      };
    };
  };
}

export interface DailyInterviewSource extends DataSource {
  sourceType: 'dailyInterview';
  data: {
    responses: Array<{
      question: string;
      answer: string;
      category: string;
    }>;
    sentiment?: 'positive' | 'neutral' | 'negative';
    extractedMetrics?: Record<string, any>;
  };
}

export interface NutritionSource extends DataSource {
  sourceType: 'nutrition';
  data: {
    meals: Array<{
      time: string;
      foods: Array<{
        name: string;
        quantity: number;
        unit: string;
      }>;
      macros: {
        protein: number;
        carbs: number;
        fat: number;
        calories: number;
      };
    }>;
    dailyTotals: {
      protein: number;
      carbs: number;
      fat: number;
      calories: number;
      hydration?: number;
    };
  };
}

export interface SupplementSource extends DataSource {
  sourceType: 'supplements';
  data: {
    supplements: Array<{
      name: string;
      dosage: string;
      timing: string;
      taken: boolean;
    }>;
  };
}

export interface ExecutionSource extends DataSource {
  sourceType: 'execution';
  data: {
    taskId: string;
    domain: 'workout' | 'recovery' | 'nutrition' | 'supplements';
    status: 'completed' | 'partial' | 'skipped';
    completedAt?: string;
    value?: number;
    notes?: string;
  };
}

// ============================================================================
// SOURCE COLLECTION
// ============================================================================

export interface SourceCollection {
  userId: string;
  date: string;
  sources: DataSource[];
  totalSources: number;
  byType: Record<SourceType, number>;
  bySystem: Record<SourceSystem, number>;
  overallQuality: DataQuality;
  completeness: number; // 0-1
  lastUpdated: string;
}

// ============================================================================
// INGESTION REQUEST
// ============================================================================

export interface IngestionRequest {
  userId: string;
  sourceType: SourceType;
  sourceSystem: SourceSystem;
  effectiveDate: string;
  rawData: any;
  metadata?: Record<string, any>;
}

// ============================================================================
// INGESTION RESULT
// ============================================================================

export interface IngestionResult {
  success: boolean;
  sourceId?: string;
  source?: DataSource;
  errors?: string[];
  warnings?: string[];
  processingTime: number; // ms
  intelligenceGenerated: boolean;
  controlTowerUpdated: boolean;
  executionTasksCreated: number;
  predictionsGenerated: number;
  adjustmentsGenerated: number;
}

// ============================================================================
// NORMALIZATION RULES
// ============================================================================

export interface NormalizationRule {
  sourceType: SourceType;
  sourceSystem: SourceSystem;
  fieldMappings: Record<string, string>;
  transformations: Array<{
    field: string;
    transform: (value: any) => any;
  }>;
  validations: Array<{
    field: string;
    validate: (value: any) => boolean;
    errorMessage: string;
  }>;
}

// ============================================================================
// SOURCE REGISTRY
// ============================================================================

export interface SourceRegistryEntry {
  sourceType: SourceType;
  sourceSystem: SourceSystem;
  enabled: boolean;
  priority: number;
  normalizationRules: NormalizationRule;
  intelligenceGenerators: string[];
  controlTowerIntegration: boolean;
  executionIntegration: boolean;
  predictionIntegration: boolean;
  adjustmentIntegration: boolean;
}
