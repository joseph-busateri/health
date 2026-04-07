import { logger } from '../utils/logger';
import type {
  DeviceSource,
  DeviceSourceMetadata,
  SleepSignals,
  ActivitySignals,
  CardiovascularSignals,
  WorkoutSignals,
  RecoverySignals,
  NormalizedDeviceMetric,
  DeviceNormalizationResult,
  DataQuality,
} from '../types/deviceIntelligence';

/**
 * Device Normalization Service - Phase 11
 * 
 * Normalizes device-specific data into unified platform model
 * Supports: Sleep Number, Apple Watch, Oura Ring, BP Monitor
 */

export class DeviceNormalizationService {
  
  /**
   * Normalize Sleep Number data
   */
  normalizeSleepNumberData(rawData: any, userId: string, date: string): SleepSignals {
    const metadata: DeviceSourceMetadata = {
      source: 'sleep_number',
      sourceType: 'smart_bed',
      sourceRecordId: rawData.id,
      timestamp: rawData.session_date || date,
      syncTime: new Date().toISOString(),
      qualityFlag: this.assessDataQuality(rawData, 'sleep_number'),
      completenessScore: this.calculateCompleteness(rawData, 'sleep_number'),
      rawPayload: rawData,
    };

    return {
      // Duration & Timing
      sleepDurationMinutes: rawData.total_sleep_time_minutes,
      sleepOnsetTime: rawData.in_bed_time,
      wakeTime: rawData.out_of_bed_time,
      timeInBedMinutes: rawData.total_time_in_bed_minutes,
      
      // Quality
      sleepEfficiencyPercent: rawData.sleep_efficiency_percent,
      sleepIQScore: rawData.sleep_iq_score,
      sleepScore: rawData.sleep_iq_score, // Normalized
      wakeEvents: rawData.awake_time_minutes ? Math.floor(rawData.awake_time_minutes / 5) : undefined,
      
      // Sleep Stages
      lightSleepMinutes: rawData.light_sleep_minutes,
      deepSleepMinutes: rawData.deep_sleep_minutes,
      remSleepMinutes: rawData.rem_sleep_minutes,
      awakeMinutes: rawData.awake_time_minutes,
      restlessSleepMinutes: rawData.restless_time_minutes,
      restfulSleepMinutes: rawData.restful_time_minutes,
      
      // Overnight Physiological
      overnightHeartRate: rawData.avg_heart_rate,
      overnightHeartRateMin: rawData.min_heart_rate,
      overnightHeartRateMax: rawData.max_heart_rate,
      overnightRespiratoryRate: rawData.avg_respiratory_rate,
      overnightRespiratoryRateMin: rawData.min_respiratory_rate,
      overnightRespiratoryRateMax: rawData.max_respiratory_rate,
      
      // Movement
      movementCount: rawData.total_movements,
      positionChanges: rawData.position_changes,
      timeOnLeftSideMinutes: rawData.time_on_left_side_minutes,
      timeOnRightSideMinutes: rawData.time_on_right_side_minutes,
      timeOnBackMinutes: rawData.time_on_back_minutes,
      timeOnStomachMinutes: rawData.time_on_stomach_minutes,
      
      // Temperature
      roomTemperature: rawData.room_temperature,
      
      source: 'sleep_number',
      sourceMetadata: metadata,
    };
  }

  /**
   * Normalize Apple Watch data
   */
  normalizeAppleWatchData(rawData: any, userId: string, date: string): {
    activity?: ActivitySignals;
    cardiovascular?: CardiovascularSignals;
    sleep?: SleepSignals;
  } {
    const metadata: DeviceSourceMetadata = {
      source: 'apple_watch',
      sourceType: 'smartwatch',
      sourceRecordId: rawData.id,
      timestamp: rawData.data_date || date,
      syncTime: new Date().toISOString(),
      qualityFlag: this.assessDataQuality(rawData, 'apple_watch'),
      completenessScore: this.calculateCompleteness(rawData, 'apple_watch'),
      rawPayload: rawData,
    };

    const result: any = {};

    // Activity signals
    if (rawData.steps || rawData.active_calories) {
      result.activity = {
        steps: rawData.steps,
        distance: rawData.distance_meters,
        distanceMiles: rawData.distance_miles,
        activeCalories: rawData.active_calories,
        totalCalories: rawData.total_calories,
        restingCalories: rawData.resting_calories,
        exerciseMinutes: rawData.exercise_minutes,
        standHours: rawData.stand_hours,
        standMinutes: rawData.stand_minutes,
        moveGoal: rawData.move_goal,
        moveGoalPercent: rawData.move_ring_percentage,
        exerciseGoal: rawData.exercise_goal,
        exerciseGoalPercent: rawData.exercise_ring_percentage,
        standGoal: rawData.stand_goal,
        standGoalPercent: rawData.stand_ring_percentage,
        source: 'apple_watch',
        sourceMetadata: metadata,
      };
    }

    // Cardiovascular signals
    if (rawData.resting_heart_rate || rawData.hrv) {
      result.cardiovascular = {
        restingHeartRate: rawData.resting_heart_rate,
        averageHeartRate: rawData.average_heart_rate,
        minHeartRate: rawData.min_heart_rate,
        maxHeartRate: rawData.max_heart_rate,
        walkingHeartRate: rawData.walking_heart_rate,
        hrv: rawData.hrv,
        vo2Max: rawData.vo2_max,
        cardioFitnessLevel: rawData.cardio_fitness_level,
        bloodOxygenPercent: rawData.blood_oxygen_percent,
        bloodOxygenMin: rawData.blood_oxygen_min,
        bloodOxygenMax: rawData.blood_oxygen_max,
        source: 'apple_watch',
        sourceMetadata: metadata,
      };
    }

    // Sleep signals (if available from Apple Health)
    if (rawData.sleep_duration_minutes) {
      result.sleep = {
        sleepDurationMinutes: rawData.sleep_duration_minutes,
        sleepOnsetTime: rawData.sleep_start_time,
        wakeTime: rawData.sleep_end_time,
        lightSleepMinutes: rawData.light_sleep_minutes,
        deepSleepMinutes: rawData.deep_sleep_minutes,
        remSleepMinutes: rawData.rem_sleep_minutes,
        awakeMinutes: rawData.awake_minutes,
        source: 'apple_watch',
        sourceMetadata: metadata,
      };
    }

    return result;
  }

  /**
   * Normalize Oura Ring data
   */
  normalizeOuraData(sleepData: any, readinessData: any, activityData: any, userId: string, date: string): {
    sleep?: SleepSignals;
    recovery?: RecoverySignals;
    activity?: ActivitySignals;
    cardiovascular?: CardiovascularSignals;
  } {
    const metadata: DeviceSourceMetadata = {
      source: 'oura_ring',
      sourceType: 'smart_ring',
      timestamp: date,
      syncTime: new Date().toISOString(),
      qualityFlag: 'high',
      completenessScore: 90,
    };

    const result: any = {};

    // Sleep signals from Oura
    if (sleepData) {
      result.sleep = {
        sleepDurationMinutes: sleepData.total_sleep_duration,
        sleepOnsetTime: sleepData.bedtime_start,
        wakeTime: sleepData.bedtime_end,
        sleepEfficiencyPercent: sleepData.efficiency,
        sleepScore: sleepData.score,
        lightSleepMinutes: sleepData.light_sleep_duration,
        deepSleepMinutes: sleepData.deep_sleep_duration,
        remSleepMinutes: sleepData.rem_sleep_duration,
        awakeMinutes: sleepData.awake_time,
        restlessSleepMinutes: sleepData.restless_periods,
        overnightHeartRate: sleepData.hr_average,
        overnightHeartRateMin: sleepData.hr_lowest,
        overnightHRV: sleepData.rmssd,
        overnightRespiratoryRate: sleepData.breath_average,
        readinessScore: readinessData?.score,
        temperatureTrend: sleepData.temperature_delta,
        source: 'oura_ring',
        sourceMetadata: metadata,
      };
    }

    // Recovery signals from Oura
    if (readinessData) {
      result.recovery = {
        readinessScore: readinessData.score,
        temperatureTrend: readinessData.temperature_deviation,
        recoveryIndex: readinessData.score,
        activityBalance: readinessData.activity_balance,
        source: 'oura_ring',
        sourceMetadata: metadata,
      };
    }

    // Activity signals from Oura
    if (activityData) {
      result.activity = {
        steps: activityData.steps,
        activeCalories: activityData.active_calories,
        totalCalories: activityData.total_calories,
        activityScore: activityData.score,
        lowIntensityMinutes: activityData.low_activity_time,
        mediumIntensityMinutes: activityData.medium_activity_time,
        highIntensityMinutes: activityData.high_activity_time,
        inactivityAlerts: activityData.inactivity_alerts,
        source: 'oura_ring',
        sourceMetadata: metadata,
      };
    }

    // Cardiovascular signals from Oura
    if (readinessData || sleepData) {
      result.cardiovascular = {
        restingHeartRate: readinessData?.resting_heart_rate || sleepData?.hr_lowest,
        hrv: readinessData?.hrv_average || sleepData?.rmssd,
        source: 'oura_ring',
        sourceMetadata: metadata,
      };
    }

    return result;
  }

  /**
   * Normalize Blood Pressure data
   */
  normalizeBPData(rawData: any, userId: string, date: string): CardiovascularSignals {
    const metadata: DeviceSourceMetadata = {
      source: 'bp_monitor',
      sourceType: 'bp_monitor',
      timestamp: rawData.measurement_time || date,
      syncTime: new Date().toISOString(),
      qualityFlag: 'high',
      completenessScore: 100,
      rawPayload: rawData,
    };

    return {
      systolicBP: rawData.systolic,
      diastolicBP: rawData.diastolic,
      pulse: rawData.pulse,
      bpMeasurementTime: rawData.measurement_time,
      bpMeasurementPosition: rawData.position,
      bpMeasurementType: rawData.measurement_type,
      source: 'bp_monitor',
      sourceMetadata: metadata,
    };
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(data: any, source: DeviceSource): DataQuality {
    const completeness = this.calculateCompleteness(data, source);
    
    if (completeness >= 90) return 'high';
    if (completeness >= 70) return 'medium';
    if (completeness >= 50) return 'low';
    return 'incomplete';
  }

  /**
   * Calculate data completeness score
   */
  private calculateCompleteness(data: any, source: DeviceSource): number {
    if (!data) return 0;

    let totalFields = 0;
    let populatedFields = 0;

    // Count non-null fields
    for (const key in data) {
      if (key === 'id' || key === 'user_id' || key === 'created_at' || key === 'updated_at') continue;
      totalFields++;
      if (data[key] !== null && data[key] !== undefined) {
        populatedFields++;
      }
    }

    if (totalFields === 0) return 0;
    return Math.round((populatedFields / totalFields) * 100);
  }

  /**
   * Normalize workout data
   */
  normalizeWorkoutData(rawData: any, source: DeviceSource): WorkoutSignals {
    const metadata: DeviceSourceMetadata = {
      source,
      sourceType: source === 'apple_watch' ? 'smartwatch' : 'health_platform',
      sourceRecordId: rawData.id,
      timestamp: rawData.start_time,
      syncTime: new Date().toISOString(),
      qualityFlag: 'high',
      completenessScore: this.calculateCompleteness(rawData, source),
      rawPayload: rawData,
    };

    return {
      workoutType: rawData.workout_type,
      workoutName: rawData.workout_name,
      workoutId: rawData.id,
      workoutDurationMinutes: rawData.duration_minutes,
      workoutStartTime: rawData.start_time,
      workoutEndTime: rawData.end_time,
      workoutIntensity: this.determineWorkoutIntensity(rawData.average_heart_rate, rawData.max_heart_rate),
      averageHeartRate: rawData.average_heart_rate,
      maxHeartRate: rawData.max_heart_rate,
      activeCalories: rawData.active_calories,
      totalCalories: rawData.total_calories,
      distance: rawData.distance_meters,
      heartRateRecovery: rawData.heart_rate_recovery,
      source,
      sourceMetadata: metadata,
    };
  }

  /**
   * Determine workout intensity from heart rate
   */
  private determineWorkoutIntensity(avgHR?: number, maxHR?: number): 'low' | 'moderate' | 'high' | 'max' | undefined {
    if (!avgHR) return undefined;
    
    // Rough estimation based on % of max HR (assuming max HR ~185)
    const estimatedMaxHR = maxHR || 185;
    const percentMax = (avgHR / estimatedMaxHR) * 100;
    
    if (percentMax < 60) return 'low';
    if (percentMax < 75) return 'moderate';
    if (percentMax < 90) return 'high';
    return 'max';
  }

  /**
   * Batch normalize multiple device records
   */
  async batchNormalize(
    records: any[],
    source: DeviceSource,
    userId: string
  ): Promise<DeviceNormalizationResult> {
    const normalizedMetrics: NormalizedDeviceMetric[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let recordsProcessed = 0;
    let recordsNormalized = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;

    for (const record of records) {
      recordsProcessed++;
      
      try {
        let normalized: any;
        const date = record.data_date || record.session_date || record.date;

        switch (source) {
          case 'sleep_number':
            normalized = {
              userId,
              metricDate: date,
              metricTimestamp: new Date().toISOString(),
              sleep: this.normalizeSleepNumberData(record, userId, date),
              sources: ['sleep_number'],
              primarySource: 'sleep_number',
              dataQuality: 'high',
              completenessScore: 90,
            };
            break;

          case 'apple_watch':
            const appleData = this.normalizeAppleWatchData(record, userId, date);
            normalized = {
              userId,
              metricDate: date,
              metricTimestamp: new Date().toISOString(),
              ...appleData,
              sources: ['apple_watch'],
              primarySource: 'apple_watch',
              dataQuality: 'high',
              completenessScore: 85,
            };
            break;

          case 'oura_ring':
            const ouraData = this.normalizeOuraData(record.sleep, record.readiness, record.activity, userId, date);
            normalized = {
              userId,
              metricDate: date,
              metricTimestamp: new Date().toISOString(),
              ...ouraData,
              sources: ['oura_ring'],
              primarySource: 'oura_ring',
              dataQuality: 'high',
              completenessScore: 90,
            };
            break;

          case 'bp_monitor':
            normalized = {
              userId,
              metricDate: date,
              metricTimestamp: record.measurement_time || new Date().toISOString(),
              cardiovascular: this.normalizeBPData(record, userId, date),
              sources: ['bp_monitor'],
              primarySource: 'bp_monitor',
              dataQuality: 'high',
              completenessScore: 100,
            };
            break;

          default:
            warnings.push(`Unknown source: ${source}`);
            recordsSkipped++;
            continue;
        }

        if (normalized) {
          normalizedMetrics.push(normalized);
          recordsNormalized++;
        } else {
          recordsSkipped++;
        }
      } catch (error) {
        recordsFailed++;
        errors.push(`Failed to normalize record: ${(error as Error).message}`);
        logger.error('[DeviceNormalization] Normalization failed', { error, record });
      }
    }

    logger.info('[DeviceNormalization] Batch normalization complete', {
      source,
      recordsProcessed,
      recordsNormalized,
      recordsSkipped,
      recordsFailed,
    });

    return {
      success: recordsFailed === 0,
      normalizedMetrics,
      errors,
      warnings,
      stats: {
        recordsProcessed,
        recordsNormalized,
        recordsSkipped,
        recordsFailed,
      },
    };
  }
}

export const deviceNormalizationService = new DeviceNormalizationService();
