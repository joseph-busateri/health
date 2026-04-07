/**
 * Device Intelligence Types - Phase 11
 * 
 * Unified, normalized device data model supporting:
 * - Sleep Number Bed
 * - Apple Watch Series 9 / Apple Health
 * - Oura Ring Gen 3
 * - Bluetooth Blood Pressure Monitor
 * 
 * This model enables maximum collection from all devices while maintaining
 * a normalized platform-friendly structure for engine consumption.
 */

// ============================================================================
// DEVICE SOURCE TYPES
// ============================================================================

export type DeviceSource = 
  | 'sleep_number'
  | 'apple_watch'
  | 'apple_health'
  | 'oura_ring'
  | 'bp_monitor'
  | 'manual_entry';

export type DeviceType = 
  | 'smart_bed'
  | 'smartwatch'
  | 'smart_ring'
  | 'bp_monitor'
  | 'health_platform';

export type DataQuality = 'high' | 'medium' | 'low' | 'incomplete';

// ============================================================================
// RAW SOURCE METADATA
// ============================================================================

export interface DeviceSourceMetadata {
  source: DeviceSource;
  sourceType: DeviceType;
  sourceRecordId?: string;
  timestamp: string;
  timezone?: string;
  syncTime: string;
  qualityFlag: DataQuality;
  completenessScore: number; // 0-100
  units?: Record<string, string>;
  rawPayload?: any; // Preserved for traceability
}

// ============================================================================
// SLEEP SIGNALS
// ============================================================================

export interface SleepSignals {
  // Duration & Timing
  sleepDurationMinutes?: number;
  sleepOnsetTime?: string; // ISO timestamp
  wakeTime?: string; // ISO timestamp
  timeInBedMinutes?: number;
  
  // Quality & Disturbances
  sleepEfficiencyPercent?: number;
  sleepScore?: number; // Normalized 0-100
  sleepIQScore?: number; // Sleep Number specific
  wakeEvents?: number;
  disturbanceCount?: number;
  
  // Sleep Stages
  lightSleepMinutes?: number;
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
  awakeMinutes?: number;
  restlessSleepMinutes?: number;
  restfulSleepMinutes?: number;
  
  // Overnight Physiological
  overnightHeartRate?: number;
  overnightHeartRateMin?: number;
  overnightHeartRateMax?: number;
  overnightHRV?: number;
  overnightRespiratoryRate?: number;
  overnightRespiratoryRateMin?: number;
  overnightRespiratoryRateMax?: number;
  
  // Movement & Position
  movementCount?: number;
  positionChanges?: number;
  timeOnLeftSideMinutes?: number;
  timeOnRightSideMinutes?: number;
  timeOnBackMinutes?: number;
  timeOnStomachMinutes?: number;
  
  // Recovery & Readiness
  readinessScore?: number; // Oura specific
  recoveryScore?: number;
  
  // Consistency
  sleepConsistencyScore?: number;
  bedtimeConsistency?: number;
  
  // Temperature
  temperatureTrend?: number; // Oura specific
  roomTemperature?: number; // Sleep Number specific
  
  // Source metadata
  source: DeviceSource;
  sourceMetadata: DeviceSourceMetadata;
}

// ============================================================================
// ACTIVITY SIGNALS
// ============================================================================

export interface ActivitySignals {
  // Steps & Distance
  steps?: number;
  distance?: number; // meters
  distanceMiles?: number;
  
  // Calories
  activeCalories?: number;
  totalCalories?: number;
  restingCalories?: number;
  
  // Movement & Exercise
  movementMinutes?: number;
  exerciseMinutes?: number;
  standHours?: number;
  standMinutes?: number;
  
  // Activity Score
  activityScore?: number; // Oura specific, 0-100
  
  // Intensity
  lowIntensityMinutes?: number;
  mediumIntensityMinutes?: number;
  highIntensityMinutes?: number;
  
  // Inactivity
  inactivityAlerts?: number;
  sedentaryMinutes?: number;
  
  // Goals
  moveGoal?: number;
  moveGoalPercent?: number;
  exerciseGoal?: number;
  exerciseGoalPercent?: number;
  standGoal?: number;
  standGoalPercent?: number;
  
  // Source metadata
  source: DeviceSource;
  sourceMetadata: DeviceSourceMetadata;
}

// ============================================================================
// CARDIOVASCULAR SIGNALS
// ============================================================================

export interface CardiovascularSignals {
  // Heart Rate
  restingHeartRate?: number;
  averageHeartRate?: number;
  minHeartRate?: number;
  maxHeartRate?: number;
  walkingHeartRate?: number;
  workoutHeartRate?: number;
  
  // HRV
  hrv?: number; // RMSSD in ms
  hrvAverage?: number;
  hrvMin?: number;
  hrvMax?: number;
  
  // Cardio Fitness
  vo2Max?: number;
  cardioFitnessLevel?: string;
  
  // Heart Rate Recovery
  heartRateRecovery?: number; // 1-minute recovery
  
  // Blood Oxygen
  bloodOxygenPercent?: number;
  bloodOxygenMin?: number;
  bloodOxygenMax?: number;
  
  // Blood Pressure
  systolicBP?: number;
  diastolicBP?: number;
  pulse?: number;
  bpMeasurementTime?: string;
  bpMeasurementPosition?: 'sitting' | 'standing' | 'lying';
  bpMeasurementType?: 'morning' | 'evening' | 'other';
  
  // Source metadata
  source: DeviceSource;
  sourceMetadata: DeviceSourceMetadata;
}

// ============================================================================
// WORKOUT SIGNALS
// ============================================================================

export interface WorkoutSignals {
  // Workout Identification
  workoutType?: string;
  workoutName?: string;
  workoutId?: string;
  
  // Duration & Timing
  workoutDurationMinutes?: number;
  workoutStartTime?: string;
  workoutEndTime?: string;
  
  // Intensity
  workoutIntensity?: 'low' | 'moderate' | 'high' | 'max';
  averageHeartRate?: number;
  maxHeartRate?: number;
  heartRateZones?: {
    zone1Minutes?: number;
    zone2Minutes?: number;
    zone3Minutes?: number;
    zone4Minutes?: number;
    zone5Minutes?: number;
  };
  
  // Energy
  activeCalories?: number;
  totalCalories?: number;
  
  // Distance (for cardio workouts)
  distance?: number; // meters
  pace?: number; // min/mile or min/km
  
  // Performance
  averagePower?: number; // watts
  maxPower?: number;
  
  // Recovery
  heartRateRecovery?: number;
  
  // Source metadata
  source: DeviceSource;
  sourceMetadata: DeviceSourceMetadata;
}

// ============================================================================
// TEMPERATURE & STRESS & RECOVERY SIGNALS
// ============================================================================

export interface RecoverySignals {
  // Temperature
  temperatureTrend?: number; // Oura specific, deviation from baseline
  wristTemperature?: number; // Apple Watch specific
  skinTemperature?: number;
  
  // Readiness & Recovery
  readinessScore?: number; // Oura specific, 0-100
  recoveryIndex?: number; // General recovery metric
  
  // Stress & Resilience
  stressLevel?: 'low' | 'medium' | 'high';
  stressScore?: number;
  resilienceScore?: number;
  
  // Balance
  activityBalance?: number; // Oura specific
  
  // Source metadata
  source: DeviceSource;
  sourceMetadata: DeviceSourceMetadata;
}

// ============================================================================
// NORMALIZED DEVICE METRIC
// ============================================================================

export interface NormalizedDeviceMetric {
  id?: string;
  userId: string;
  metricDate: string; // YYYY-MM-DD
  metricTimestamp: string; // ISO timestamp for intraday metrics
  
  // Categorized signals
  sleep?: SleepSignals;
  activity?: ActivitySignals;
  cardiovascular?: CardiovascularSignals;
  workouts?: WorkoutSignals[];
  recovery?: RecoverySignals;
  
  // Aggregated metadata
  sources: DeviceSource[];
  primarySource: DeviceSource;
  dataQuality: DataQuality;
  completenessScore: number; // 0-100
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// DEVICE DAILY SUMMARY
// ============================================================================

export interface DeviceDailySummary {
  id?: string;
  userId: string;
  summaryDate: string; // YYYY-MM-DD
  
  // Sleep Summary
  sleepDurationMinutes?: number;
  sleepScore?: number;
  sleepQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
  sleepEfficiency?: number;
  
  // Activity Summary
  steps?: number;
  activeCalories?: number;
  exerciseMinutes?: number;
  standHours?: number;
  activityScore?: number;
  
  // Cardiovascular Summary
  restingHeartRate?: number;
  averageHeartRate?: number;
  hrv?: number;
  vo2Max?: number;
  
  // Recovery Summary
  readinessScore?: number;
  recoveryScore?: number;
  stressLevel?: 'low' | 'medium' | 'high';
  
  // Workout Summary
  workoutCount?: number;
  totalWorkoutMinutes?: number;
  workoutCalories?: number;
  
  // Blood Pressure (if measured)
  systolicBP?: number;
  diastolicBP?: number;
  bpMeasurementCount?: number;
  
  // Data Quality
  dataCompleteness: {
    hasSleep: boolean;
    hasActivity: boolean;
    hasCardiovascular: boolean;
    hasWorkout: boolean;
    hasRecovery: boolean;
    hasBP: boolean;
    completenessScore: number; // 0-100
  };
  
  // Source Summary
  activeSources: DeviceSource[];
  primarySleepSource?: DeviceSource;
  primaryActivitySource?: DeviceSource;
  primaryCardioSource?: DeviceSource;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// SOURCE PRIORITY CONFIGURATION
// ============================================================================

export interface SourcePriorityRule {
  metricCategory: 'sleep' | 'activity' | 'cardiovascular' | 'workout' | 'recovery' | 'bp';
  metricName: string;
  priorityOrder: DeviceSource[];
  fallbackBehavior: 'use_secondary' | 'skip' | 'average_all';
  confidenceWeighting?: boolean;
}

export const DEFAULT_SOURCE_PRIORITY: SourcePriorityRule[] = [
  // Sleep priorities
  {
    metricCategory: 'sleep',
    metricName: 'sleep_duration',
    priorityOrder: ['sleep_number', 'oura_ring', 'apple_health'],
    fallbackBehavior: 'use_secondary',
  },
  {
    metricCategory: 'sleep',
    metricName: 'sleep_stages',
    priorityOrder: ['sleep_number', 'oura_ring', 'apple_health'],
    fallbackBehavior: 'use_secondary',
  },
  {
    metricCategory: 'sleep',
    metricName: 'sleep_score',
    priorityOrder: ['oura_ring', 'sleep_number', 'apple_health'],
    fallbackBehavior: 'use_secondary',
  },
  
  // HRV priorities
  {
    metricCategory: 'cardiovascular',
    metricName: 'hrv',
    priorityOrder: ['oura_ring', 'apple_watch', 'sleep_number'],
    fallbackBehavior: 'use_secondary',
  },
  
  // Resting HR priorities
  {
    metricCategory: 'cardiovascular',
    metricName: 'resting_heart_rate',
    priorityOrder: ['oura_ring', 'apple_watch', 'sleep_number'],
    fallbackBehavior: 'use_secondary',
  },
  
  // Activity priorities
  {
    metricCategory: 'activity',
    metricName: 'steps',
    priorityOrder: ['apple_watch', 'oura_ring'],
    fallbackBehavior: 'use_secondary',
  },
  {
    metricCategory: 'activity',
    metricName: 'calories',
    priorityOrder: ['apple_watch', 'oura_ring'],
    fallbackBehavior: 'use_secondary',
  },
  
  // Blood Pressure priorities
  {
    metricCategory: 'bp',
    metricName: 'blood_pressure',
    priorityOrder: ['bp_monitor', 'manual_entry'],
    fallbackBehavior: 'skip',
  },
  
  // Recovery priorities
  {
    metricCategory: 'recovery',
    metricName: 'readiness_score',
    priorityOrder: ['oura_ring'],
    fallbackBehavior: 'skip',
  },
  {
    metricCategory: 'recovery',
    metricName: 'temperature_trend',
    priorityOrder: ['oura_ring', 'apple_watch'],
    fallbackBehavior: 'use_secondary',
  },
];

// ============================================================================
// DEVICE CONTEXT (for engines and intelligence layers)
// ============================================================================

export interface DeviceContext {
  userId: string;
  contextDate: string;
  timestamp: string;
  
  // Current day summary
  dailySummary: DeviceDailySummary;
  
  // Recent trends (7-day)
  recentTrends?: {
    avgSleepDuration?: number;
    avgSleepScore?: number;
    avgSteps?: number;
    avgRestingHR?: number;
    avgHRV?: number;
    avgReadinessScore?: number;
    trendDirection?: 'improving' | 'stable' | 'declining';
  };
  
  // Sleep context
  sleep?: {
    lastNightDuration?: number;
    lastNightScore?: number;
    lastNightQuality?: 'excellent' | 'good' | 'fair' | 'poor';
    sleepDebt?: number; // minutes
    sleepConsistency?: number; // 0-100
    source?: DeviceSource;
  };
  
  // Recovery context
  recovery?: {
    readinessScore?: number;
    recoveryStatus?: 'recovered' | 'recovering' | 'strained';
    hrvStatus?: 'high' | 'normal' | 'low';
    restingHRStatus?: 'low' | 'normal' | 'elevated';
    source?: DeviceSource;
  };
  
  // Activity context
  activity?: {
    todaySteps?: number;
    todayCalories?: number;
    todayExerciseMinutes?: number;
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    source?: DeviceSource;
  };
  
  // Cardiovascular context
  cardiovascular?: {
    restingHR?: number;
    hrv?: number;
    vo2Max?: number;
    cardioFitnessLevel?: string;
    recentBP?: {
      systolic?: number;
      diastolic?: number;
      measurementDate?: string;
    };
    source?: DeviceSource;
  };
  
  // Workout context
  workouts?: {
    todayWorkoutCount?: number;
    todayWorkoutMinutes?: number;
    lastWorkout?: {
      type?: string;
      duration?: number;
      calories?: number;
      date?: string;
    };
    source?: DeviceSource;
  };
  
  // Source summary
  sourceSummary: {
    activeSources: DeviceSource[];
    connectedDevices: DeviceSource[];
    lastSyncTimes: Partial<Record<DeviceSource, string>>;
    dataFreshness: 'current' | 'stale' | 'missing';
  };
  
  // Data completeness
  completenessScore: number; // 0-100
  dataQuality: DataQuality;
  
  // Flags
  flags: {
    hasSleepData: boolean;
    hasActivityData: boolean;
    hasCardiovascularData: boolean;
    hasRecoveryData: boolean;
    hasWorkoutData: boolean;
    hasBPData: boolean;
  };
}

// ============================================================================
// DEVICE SYNC STATUS
// ============================================================================

export interface DeviceSyncStatus {
  userId: string;
  device: DeviceSource;
  isConnected: boolean;
  connectionStatus: 'active' | 'inactive' | 'error' | 'pending';
  lastSyncAt?: string;
  lastSuccessfulSyncAt?: string;
  nextScheduledSync?: string;
  autoSyncEnabled: boolean;
  syncFrequency?: 'hourly' | 'daily' | 'manual';
  consecutiveFailures: number;
  lastError?: string;
  dataAvailability: {
    hasSleep: boolean;
    hasActivity: boolean;
    hasCardiovascular: boolean;
    hasWorkout: boolean;
    hasRecovery: boolean;
  };
}

// ============================================================================
// DEVICE INGESTION PAYLOAD
// ============================================================================

export interface DeviceIngestionPayload {
  userId: string;
  source: DeviceSource;
  sourceType: DeviceType;
  dataDate: string;
  timestamp: string;
  
  // Raw data (device-specific format)
  rawData: any;
  
  // Metadata
  syncId?: string;
  batchId?: string;
  recordCount?: number;
}

// ============================================================================
// DEVICE NORMALIZATION RESULT
// ============================================================================

export interface DeviceNormalizationResult {
  success: boolean;
  normalizedMetrics: NormalizedDeviceMetric[];
  errors: string[];
  warnings: string[];
  stats: {
    recordsProcessed: number;
    recordsNormalized: number;
    recordsSkipped: number;
    recordsFailed: number;
  };
}
