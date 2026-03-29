// Apple Watch API Client
// HealthKit data access via iOS app integration

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface HealthKitData {
  userId: string;
  dataDate: string;
  
  // Heart Rate
  restingHeartRate?: number;
  walkingHeartRateAvg?: number;
  heartRateVariabilitySdnn?: number;
  heartRateVariabilityRmssd?: number;
  vo2Max?: number;
  
  // Activity
  activeEnergyBurned?: number;
  basalEnergyBurned?: number;
  steps?: number;
  distanceWalkingRunning?: number;
  flightsClimbed?: number;
  exerciseMinutes?: number;
  standHours?: number;
  
  // Activity Rings
  moveRingPercentage?: number;
  exerciseRingPercentage?: number;
  standRingPercentage?: number;
  moveGoal?: number;
  exerciseGoal?: number;
  standGoal?: number;
  
  // Sleep
  sleepDurationMinutes?: number;
  sleepStartTime?: string;
  sleepEndTime?: string;
  timeInBedMinutes?: number;
  timeAsleepMinutes?: number;
  timeAwakeMinutes?: number;
  remSleepMinutes?: number;
  deepSleepMinutes?: number;
  coreSleepMinutes?: number;
  awakeSleepMinutes?: number;
  sleepEfficiency?: number;
  
  // Respiratory
  respiratoryRate?: number;
  
  // Blood Oxygen
  bloodOxygenAvg?: number;
  bloodOxygenMin?: number;
  bloodOxygenMax?: number;
  
  // Temperature
  wristTemperatureCelsius?: number;
  
  // Mindfulness
  mindfulMinutes?: number;
  
  // Audio
  headphoneAudioExposureAvg?: number;
  environmentalAudioExposureAvg?: number;
}

export interface HealthKitWorkout {
  userId: string;
  healthkitWorkoutId: string;
  workoutType: string;
  workoutName?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalDistance?: number;
  totalEnergyBurned?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  minHeartRate?: number;
  timeInZone1Minutes?: number;
  timeInZone2Minutes?: number;
  timeInZone3Minutes?: number;
  timeInZone4Minutes?: number;
  timeInZone5Minutes?: number;
  elevationAscended?: number;
  elevationDescended?: number;
  hasRoute?: boolean;
  routeData?: any;
  deviceName?: string;
}

export interface HeartRateSample {
  userId: string;
  sampleTime: string;
  heartRate: number;
  motionContext?: string;
}

export class AppleWatchClient {
  
  /**
   * Save HealthKit data from iOS app
   * This is called by the iOS app after it reads data from HealthKit
   */
  async saveHealthKitData(data: HealthKitData): Promise<void> {
    try {
      const { error } = await supabase
        .from('apple_watch_health_data')
        .upsert({
          user_id: data.userId,
          data_date: data.dataDate,
          resting_heart_rate: data.restingHeartRate,
          walking_heart_rate_avg: data.walkingHeartRateAvg,
          heart_rate_variability_sdnn: data.heartRateVariabilitySdnn,
          heart_rate_variability_rmssd: data.heartRateVariabilityRmssd,
          vo2_max: data.vo2Max,
          active_energy_burned: data.activeEnergyBurned,
          basal_energy_burned: data.basalEnergyBurned,
          steps: data.steps,
          distance_walking_running: data.distanceWalkingRunning,
          flights_climbed: data.flightsClimbed,
          exercise_minutes: data.exerciseMinutes,
          stand_hours: data.standHours,
          move_ring_percentage: data.moveRingPercentage,
          exercise_ring_percentage: data.exerciseRingPercentage,
          stand_ring_percentage: data.standRingPercentage,
          move_goal: data.moveGoal,
          exercise_goal: data.exerciseGoal,
          stand_goal: data.standGoal,
          sleep_duration_minutes: data.sleepDurationMinutes,
          sleep_start_time: data.sleepStartTime,
          sleep_end_time: data.sleepEndTime,
          time_in_bed_minutes: data.timeInBedMinutes,
          time_asleep_minutes: data.timeAsleepMinutes,
          time_awake_minutes: data.timeAwakeMinutes,
          rem_sleep_minutes: data.remSleepMinutes,
          deep_sleep_minutes: data.deepSleepMinutes,
          core_sleep_minutes: data.coreSleepMinutes,
          awake_minutes: data.awakeSleepMinutes,
          sleep_efficiency: data.sleepEfficiency,
          respiratory_rate: data.respiratoryRate,
          blood_oxygen_avg: data.bloodOxygenAvg,
          blood_oxygen_min: data.bloodOxygenMin,
          blood_oxygen_max: data.bloodOxygenMax,
          wrist_temperature_celsius: data.wristTemperatureCelsius,
          mindful_minutes: data.mindfulMinutes,
          headphone_audio_exposure_avg: data.headphoneAudioExposureAvg,
          environmental_audio_exposure_avg: data.environmentalAudioExposureAvg,
          sync_timestamp: new Date().toISOString(),
        }, {
          onConflict: 'user_id,data_date',
        });

      if (error) throw error;

      logger.info('HealthKit data saved', { userId: data.userId, date: data.dataDate });
    } catch (error) {
      logger.error('Error saving HealthKit data', { error, userId: data.userId });
      throw error;
    }
  }

  /**
   * Save workout from HealthKit
   */
  async saveWorkout(workout: HealthKitWorkout): Promise<void> {
    try {
      const { error } = await supabase
        .from('apple_watch_workouts')
        .upsert({
          user_id: workout.userId,
          healthkit_workout_id: workout.healthkitWorkoutId,
          workout_type: workout.workoutType,
          workout_name: workout.workoutName,
          start_time: workout.startTime,
          end_time: workout.endTime,
          duration_minutes: workout.durationMinutes,
          total_distance: workout.totalDistance,
          total_energy_burned: workout.totalEnergyBurned,
          avg_heart_rate: workout.avgHeartRate,
          max_heart_rate: workout.maxHeartRate,
          min_heart_rate: workout.minHeartRate,
          time_in_zone_1_minutes: workout.timeInZone1Minutes,
          time_in_zone_2_minutes: workout.timeInZone2Minutes,
          time_in_zone_3_minutes: workout.timeInZone3Minutes,
          time_in_zone_4_minutes: workout.timeInZone4Minutes,
          time_in_zone_5_minutes: workout.timeInZone5Minutes,
          elevation_ascended: workout.elevationAscended,
          elevation_descended: workout.elevationDescended,
          has_route: workout.hasRoute,
          route_data: workout.routeData,
          device_name: workout.deviceName,
          sync_timestamp: new Date().toISOString(),
        }, {
          onConflict: 'healthkit_workout_id',
        });

      if (error) throw error;

      logger.info('Workout saved', { userId: workout.userId, workoutId: workout.healthkitWorkoutId });
    } catch (error) {
      logger.error('Error saving workout', { error, userId: workout.userId });
      throw error;
    }
  }

  /**
   * Save heart rate samples (for detailed analysis)
   */
  async saveHeartRateSamples(samples: HeartRateSample[]): Promise<void> {
    try {
      if (samples.length === 0) return;

      const { error } = await supabase
        .from('apple_watch_heart_rate_samples')
        .insert(samples.map(sample => ({
          user_id: sample.userId,
          sample_time: sample.sampleTime,
          heart_rate: sample.heartRate,
          motion_context: sample.motionContext,
        })));

      if (error) throw error;

      logger.info('Heart rate samples saved', { count: samples.length, userId: samples[0].userId });
    } catch (error) {
      logger.error('Error saving heart rate samples', { error });
      throw error;
    }
  }

  /**
   * Get latest health data for user
   */
  async getLatestHealthData(userId: string, days: number = 7): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_latest_apple_watch_data', {
        p_user_id: userId,
        p_days: days,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting latest health data', { error, userId });
      throw error;
    }
  }

  /**
   * Get workout summary
   */
  async getWorkoutSummary(userId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_apple_watch_workout_summary', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting workout summary', { error, userId });
      throw error;
    }
  }

  /**
   * Get HRV trend
   */
  async getHRVTrend(userId: string, days: number = 30): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_apple_watch_hrv_trend', {
        p_user_id: userId,
        p_days: days,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting HRV trend', { error, userId });
      throw error;
    }
  }

  /**
   * Check connection status
   */
  async getConnectionStatus(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('apple_watch_connections')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      logger.error('Error getting connection status', { error, userId });
      throw error;
    }
  }

  /**
   * Create or update connection
   */
  async updateConnection(
    userId: string,
    deviceInfo: {
      deviceName?: string;
      deviceModel?: string;
      watchOsVersion?: string;
      pairedIphoneModel?: string;
      healthkitAuthorized?: boolean;
      authorizedDataTypes?: string[];
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('apple_watch_connections')
        .upsert({
          user_id: userId,
          device_name: deviceInfo.deviceName,
          device_model: deviceInfo.deviceModel,
          watch_os_version: deviceInfo.watchOsVersion,
          paired_iphone_model: deviceInfo.pairedIphoneModel,
          healthkit_authorized: deviceInfo.healthkitAuthorized,
          authorized_data_types: deviceInfo.authorizedDataTypes,
          authorization_date: deviceInfo.healthkitAuthorized ? new Date().toISOString() : undefined,
          is_connected: true,
          sync_status: 'active',
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      logger.info('Apple Watch connection updated', { userId });
    } catch (error) {
      logger.error('Error updating connection', { error, userId });
      throw error;
    }
  }

  /**
   * Disconnect Apple Watch
   */
  async disconnect(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('apple_watch_connections')
        .update({
          is_connected: false,
          sync_status: 'disconnected',
          auto_sync_enabled: false,
        })
        .eq('user_id', userId);

      if (error) throw error;

      logger.info('Apple Watch disconnected', { userId });
    } catch (error) {
      logger.error('Error disconnecting Apple Watch', { error, userId });
      throw error;
    }
  }

  /**
   * Record sync history
   */
  async recordSyncHistory(
    userId: string,
    syncData: {
      syncStartedAt: string;
      syncCompletedAt?: string;
      syncDurationSeconds?: number;
      syncType: string;
      dateRangeStart?: string;
      dateRangeEnd?: string;
      status: string;
      recordsSynced?: number;
      workoutsSynced?: number;
      errorsCount?: number;
      dataTypesSynced?: string[];
      errorMessage?: string;
      errorDetails?: any;
      triggeredBy: string;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('apple_watch_sync_history')
        .insert({
          user_id: userId,
          sync_started_at: syncData.syncStartedAt,
          sync_completed_at: syncData.syncCompletedAt,
          sync_duration_seconds: syncData.syncDurationSeconds,
          sync_type: syncData.syncType,
          date_range_start: syncData.dateRangeStart,
          date_range_end: syncData.dateRangeEnd,
          status: syncData.status,
          records_synced: syncData.recordsSynced,
          workouts_synced: syncData.workoutsSynced,
          errors_count: syncData.errorsCount,
          data_types_synced: syncData.dataTypesSynced,
          error_message: syncData.errorMessage,
          error_details: syncData.errorDetails,
          triggered_by: syncData.triggeredBy,
        });

      if (error) throw error;

      // Update connection sync status
      await supabase.rpc('update_apple_watch_sync_status', {
        p_user_id: userId,
        p_status: syncData.status,
        p_error_message: syncData.errorMessage,
      });

      logger.info('Sync history recorded', { userId, status: syncData.status });
    } catch (error) {
      logger.error('Error recording sync history', { error, userId });
      throw error;
    }
  }
}

export const appleWatchClient = new AppleWatchClient();
