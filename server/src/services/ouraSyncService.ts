// Oura Ring Automatic Sync Service
// Handles automatic daily sync with AES-256 token encryption

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import {
  ouraApiClient,
  OuraSpo2Data,
  OuraTag,
  OuraSession,
} from './ouraApiClient';
import { ouraAuthService } from './ouraAuthService';

export class OuraSyncService {
  /**
   * Connect Oura account using OAuth code
   */
  async connectAccount(userId: string, code: string, redirectUri: string): Promise<void> {
    try {
      logger.info('Connecting Oura account', { userId });

      // Exchange code for tokens
      const tokens = await ouraApiClient.login(code, redirectUri);

      // Get personal info
      const personalInfo = await ouraApiClient.getPersonalInfo();

      await ouraAuthService.upsertConnection(userId, tokens, {
        ouraUserId: personalInfo.id,
        email: personalInfo.email,
        ringModel: personalInfo?.body?._imported?.ring_model,
        ringSize: personalInfo?.body?._imported?.ring_size,
        ringColor: personalInfo?.body?._imported?.ring_color,
      });

      logger.info('Oura account connected successfully', { userId });

      // Trigger initial sync
      await this.syncUser(userId, 'user_request');
    } catch (error) {
      logger.error('Error connecting Oura account', { error, userId });
      throw error;
    }
  }

  /**
   * Disconnect Oura account
   */
  async disconnectAccount(userId: string): Promise<void> {
    try {
      await ouraAuthService.markDisconnected(userId);

      logger.info('Oura account disconnected', { userId });
    } catch (error) {
      logger.error('Error disconnecting Oura account', { error, userId });
      throw error;
    }
  }

  /**
   * Run automatic sync for all connections
   * Called by cron job
   */
  async runAutomaticSync(): Promise<void> {
    try {
      logger.info('Starting automatic Oura sync');

      // Get pending sync jobs
      const { data: jobs, error } = await supabase.rpc('get_pending_oura_sync_jobs', {
        p_limit: 50,
      });

      if (error) throw error;

      if (!jobs || jobs.length === 0) {
        logger.info('No pending Oura sync jobs');
        return;
      }

      logger.info(`Processing ${jobs.length} Oura sync jobs`);

      // Process each job
      for (const job of jobs) {
        try {
          await this.processSyncJob(job.job_id, job.connection_id, job.user_id);
        } catch (error) {
          logger.error('Error processing sync job', { error, jobId: job.job_id });
        }
      }

      logger.info('Automatic Oura sync completed');
    } catch (error) {
      logger.error('Error in runAutomaticSync', { error });
      throw error;
    }
  }

  /**
   * Process a single sync job
   */
  async processSyncJob(jobId: string, connectionId: string, userId: string): Promise<void> {
    try {
      // Mark job as processing
      await supabase.rpc('start_oura_sync_job', { p_job_id: jobId });

      // Get connection
      const connection = await ouraAuthService.getConnectionById(connectionId);
      if (!connection) {
        throw new Error(`Oura connection ${connectionId} not found`);
      }

      // Sync data
      const recordsSynced = await this.syncData(connection, userId);

      // Mark job as completed
      await supabase.rpc('complete_oura_sync_job', {
        p_job_id: jobId,
        p_status: 'completed',
        p_records_synced: recordsSynced,
      });

      logger.info('Sync job completed', { jobId, recordsSynced });
    } catch (error) {
      logger.error('Error processing sync job', { error, jobId });

      // Mark job as failed
      await supabase.rpc('complete_oura_sync_job', {
        p_job_id: jobId,
        p_status: 'failed',
        p_error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Sync data from Oura API
   */
  async syncData(connection: { id: string; accessToken: string; refreshToken?: string | null; tokenExpiresAt?: Date | null }, userId: string): Promise<number> {
    const syncStartTime = new Date();
    let totalRecordsSynced = 0;

    try {
      // Set tokens in API client
      ouraApiClient.setTokens({
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken || undefined,
        expiresAt: connection.tokenExpiresAt || new Date(),
      });

      // Determine date range
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = connection.tokenExpiresAt
        ? new Date(new Date(connection.tokenExpiresAt).getTime() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      logger.info('Syncing Oura data', { userId, startDate, endDate });

      // Sync sleep sessions
      const sleepSessions = await ouraApiClient.getSleepSessions(startDate, endDate);
      const sleepSynced = await this.saveSleepSessions(userId, sleepSessions);
      totalRecordsSynced += sleepSynced;

      // Sync readiness data
      const readinessData = await ouraApiClient.getReadinessData(startDate, endDate);
      const readinessSynced = await this.saveReadinessData(userId, readinessData);
      totalRecordsSynced += readinessSynced;

      // Sync activity data
      const activityData = await ouraApiClient.getActivityData(startDate, endDate);
      const activitySynced = await this.saveActivityData(userId, activityData);
      totalRecordsSynced += activitySynced;

      // Sync workouts
      const workouts = await ouraApiClient.getWorkouts(startDate, endDate);
      const workoutsSynced = await this.saveWorkouts(userId, workouts);
      totalRecordsSynced += workoutsSynced;

      // Sync SpO2
      const spo2Data = await ouraApiClient.getSpo2Data(startDate, endDate);
      const spo2Synced = await this.saveSpo2Data(userId, spo2Data);
      totalRecordsSynced += spo2Synced;

      // Sync tags
      const tags = await ouraApiClient.getTags(startDate, endDate);
      const tagsSynced = await this.saveTags(userId, tags);
      totalRecordsSynced += tagsSynced;

      // Sync sessions
      const sessions = await ouraApiClient.getSessions(startDate, endDate);
      const sessionsSynced = await this.saveSessions(userId, sessions);
      totalRecordsSynced += sessionsSynced;

      // Record sync history
      const syncDuration = Math.floor((Date.now() - syncStartTime.getTime()) / 1000);
      await this.recordSyncHistory({
        connectionId: connection.id,
        userId,
        syncStartedAt: syncStartTime.toISOString(),
        syncCompletedAt: new Date().toISOString(),
        syncDurationSeconds: syncDuration,
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
        status: 'success',
        sleepSessionsSynced: sleepSynced,
        readinessRecordsSynced: readinessSynced,
        activityRecordsSynced: activitySynced,
        workoutsSynced: workoutsSynced,
        spo2RecordsSynced: spo2Synced,
        tagsSynced,
        sessionsSynced,
        totalRecordsSynced,
        triggeredBy: 'cron',
      });

      const refreshedTokens = ouraApiClient.getActiveTokens();
      if (refreshedTokens) {
        await ouraAuthService.persistTokens(connection.id, refreshedTokens);
      }

      logger.info('Oura data synced successfully', { userId, totalRecordsSynced });

      return totalRecordsSynced;
    } catch (error) {
      logger.error('Error syncing Oura data', { error, userId });

      // Record failed sync
      const syncDuration = Math.floor((Date.now() - syncStartTime.getTime()) / 1000);
      await this.recordSyncHistory({
        connectionId: connection.id,
        userId,
        syncStartedAt: syncStartTime.toISOString(),
        syncCompletedAt: new Date().toISOString(),
        syncDurationSeconds: syncDuration,
        status: 'failed',
        totalRecordsSynced,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        triggeredBy: 'cron',
      });

      throw error;
    }
  }

  /**
   * Sync a specific user (manual trigger)
   */
  async syncUser(userId: string, triggeredBy: string = 'manual'): Promise<void> {
    try {
      const connection = await ouraAuthService.getActiveConnectionByUserId(userId);
      if (!connection) {
        throw new Error('No active Oura connection found for user');
      }

      await this.syncData(connection, userId);
    } catch (error) {
      logger.error('Error syncing user', { error, userId });
      throw error;
    }
  }

  /**
   * Save sleep sessions to database
   */
  private async saveSleepSessions(userId: string, sessions: any[]): Promise<number> {
    if (sessions.length === 0) return 0;

    try {
      const records = sessions.map((session) => ({
        user_id: userId,
        oura_sleep_id: session.id,
        sleep_date: session.day,
        bedtime_start: session.bedtime_start,
        bedtime_end: session.bedtime_end,
        total_sleep_duration: session.total_sleep_duration,
        awake_time: session.awake_time,
        rem_sleep_duration: session.rem_sleep_duration,
        light_sleep_duration: session.light_sleep_duration,
        deep_sleep_duration: session.deep_sleep_duration,
        sleep_score: session.score,
        sleep_score_total: session.contributors?.total_sleep,
        sleep_score_disturbances: session.contributors?.disturbances,
        sleep_score_efficiency: session.contributors?.efficiency,
        sleep_score_latency: session.contributors?.latency,
        sleep_score_rem: session.contributors?.rem_sleep,
        sleep_score_deep: session.contributors?.deep_sleep,
        sleep_score_alignment: session.contributors?.timing,
        efficiency: session.efficiency,
        sleep_latency: session.latency,
        timing_score: session.contributors?.timing,
        midpoint_time: session.midpoint_time,
        restless_periods: session.restless_periods,
        hr_lowest: session.lowest_heart_rate,
        hr_average: session.average_heart_rate,
        hrv_average: session.average_hrv,
        breath_average: session.average_breath,
        temperature_delta: session.temperature_delta,
        temperature_trend_deviation: session.temperature_trend_deviation,
        sleep_type: session.type,
        rmssd: session.rmssd ?? session.average_hrv,
      }));

      const { error } = await supabase
        .from('oura_sleep_sessions')
        .upsert(records, { onConflict: 'oura_sleep_id' });

      if (error) throw error;

      logger.info('Sleep sessions saved', { count: records.length, userId });

      return records.length;
    } catch (error) {
      logger.error('Error saving sleep sessions', { error, userId });
      throw error;
    }
  }

  /**
   * Save readiness data to database
   */
  private async saveReadinessData(userId: string, readinessData: any[]): Promise<number> {
    if (readinessData.length === 0) return 0;

    try {
      const records = readinessData.map((data) => ({
        user_id: userId,
        oura_readiness_id: data.id,
        readiness_date: data.day,
        readiness_score: data.score,
        temperature_deviation: data.contributors?.temperature_deviation,
        temperature_trend_deviation: data.contributors?.temperature_trend_deviation,
        activity_balance: data.contributors?.activity_balance,
        previous_day_activity: data.contributors?.previous_day_activity,
        sleep_balance: data.contributors?.sleep_balance,
        previous_night_sleep: data.contributors?.previous_night,
        sleep_regularity: data.contributors?.sleep_regularity,
        recovery_index: data.contributors?.recovery_index,
        resting_heart_rate: data.contributors?.resting_heart_rate,
        hrv_balance: data.contributors?.hrv_balance,
        hrv_average: data.score_details?.hrv_balance ?? data.contributors?.hrv_balance,
      }));

      const { error } = await supabase
        .from('oura_readiness_data')
        .upsert(records, { onConflict: 'oura_readiness_id' });

      if (error) throw error;

      logger.info('Readiness data saved', { count: records.length, userId });

      return records.length;
    } catch (error) {
      logger.error('Error saving readiness data', { error, userId });
      throw error;
    }
  }

  /**
   * Save activity data to database
   */
  private async saveActivityData(userId: string, activityData: any[]): Promise<number> {
    if (activityData.length === 0) return 0;

    try {
      const records = activityData.map((data) => ({
        user_id: userId,
        oura_activity_id: data.id,
        activity_date: data.day,
        activity_score: data.score,
        inactive_time: data.inactive_time,
        low_activity_time: data.low_activity_time,
        medium_activity_time: data.medium_activity_time,
        high_activity_time: data.high_activity_time,
        steps: data.steps,
        daily_movement: data.daily_movement,
        total_calories: data.total_calories,
        active_calories: data.active_calories,
        training_frequency: data.contributors?.training_frequency,
        training_volume: data.contributors?.training_volume,
        target_calories: data.target_calories,
        target_meters: data.target_meters,
        met_daily_targets: data.met_daily_targets,
        inactivity_alerts: data.inactivity_alerts,
        equivalent_walking_distance: data.equivalent_walking_distance,
        metabolic_equivalent: data.met_minutes,
      }));

      const { error } = await supabase
        .from('oura_activity_data')
        .upsert(records, { onConflict: 'oura_activity_id' });

      if (error) throw error;

      logger.info('Activity data saved', { count: records.length, userId });

      return records.length;
    } catch (error) {
      logger.error('Error saving activity data', { error, userId });
      throw error;
    }
  }

  /**
   * Save workouts to database
   */
  private async saveWorkouts(userId: string, workouts: any[]): Promise<number> {
    if (workouts.length === 0) return 0;

    try {
      const records = workouts.map((workout) => ({
        user_id: userId,
        oura_workout_id: workout.id,
        workout_date: workout.day,
        start_time: workout.start_datetime,
        end_time: workout.end_datetime,
        activity: workout.activity,
        duration_seconds: workout.duration,
        intensity: workout.intensity,
        calories: workout.calories,
        distance_meters: workout.distance,
        hr_average: workout.average_heart_rate,
        hr_max: workout.max_heart_rate,
        source: workout.source,
      }));

      const { error } = await supabase
        .from('oura_workouts')
        .upsert(records, { onConflict: 'oura_workout_id' });

      if (error) throw error;

      logger.info('Workouts saved', { count: records.length, userId });

      return records.length;
    } catch (error) {
      logger.error('Error saving workouts', { error, userId });
      throw error;
    }
  }

  private async saveSpo2Data(userId: string, spo2Data: OuraSpo2Data[]): Promise<number> {
    if (spo2Data.length === 0) return 0;

    try {
      const records = spo2Data.map((spo2) => ({
        user_id: userId,
        oura_spo2_id: spo2.id,
        spo2_date: spo2.day,
        spo2_average: spo2.spo2_average,
        spo2_min: spo2.spo2_min,
        spo2_max: spo2.spo2_max,
      }));

      const { error } = await supabase
        .from('oura_spo2_data')
        .upsert(records, { onConflict: 'oura_spo2_id' });

      if (error) throw error;

      logger.info('SpO2 records saved', { count: records.length, userId });

      return records.length;
    } catch (error) {
      logger.error('Error saving SpO2 data', { error, userId });
      throw error;
    }
  }

  private async saveTags(userId: string, tags: OuraTag[]): Promise<number> {
    if (tags.length === 0) return 0;

    try {
      const records = tags.map((tag) => ({
        user_id: userId,
        oura_tag_id: tag.id,
        tag_date: tag.day,
        tag: tag.tag,
        timestamp: tag.timestamp,
        type: tag.type,
        other_tag: tag.other_tag,
        acquisition_method: tag.acquisition_method,
      }));

      const { error } = await supabase
        .from('oura_tags')
        .upsert(records, { onConflict: 'oura_tag_id' });

      if (error) throw error;

      logger.info('Oura tags saved', { count: records.length, userId });

      return records.length;
    } catch (error) {
      logger.error('Error saving Oura tags', { error, userId });
      throw error;
    }
  }

  private async saveSessions(userId: string, sessions: OuraSession[]): Promise<number> {
    if (sessions.length === 0) return 0;

    try {
      const records = sessions.map((session) => ({
        user_id: userId,
        oura_session_id: session.id,
        session_date: session.day,
        start_time: session.start_datetime,
        end_time: session.end_datetime,
        session_type: session.type,
        mood: session.mood,
        activity_state: session.activity_state,
        heart_rate_average: session.heart_rate_average,
        heart_rate_peak: session.heart_rate_peak,
        heart_rate_min: session.heart_rate_min,
        temperature_deviation: session.temperature_deviation,
      }));

      const { error } = await supabase
        .from('oura_sessions')
        .upsert(records, { onConflict: 'oura_session_id' });

      if (error) throw error;

      logger.info('Oura sessions saved', { count: records.length, userId });

      return records.length;
    } catch (error) {
      logger.error('Error saving Oura sessions', { error, userId });
      throw error;
    }
  }

  /**
   * Record sync history
   */
  private async recordSyncHistory(data: any): Promise<void> {
    try {
      const { error } = await supabase.from('oura_sync_history').insert({
        connection_id: data.connectionId,
        user_id: data.userId,
        sync_started_at: data.syncStartedAt,
        sync_completed_at: data.syncCompletedAt,
        sync_duration_seconds: data.syncDurationSeconds,
        date_range_start: data.dateRangeStart,
        date_range_end: data.dateRangeEnd,
        status: data.status,
        sleep_sessions_synced: data.sleepSessionsSynced || 0,
        readiness_records_synced: data.readinessRecordsSynced || 0,
        activity_records_synced: data.activityRecordsSynced || 0,
        workouts_synced: data.workoutsSynced || 0,
        spo2_records_synced: data.spo2RecordsSynced || 0,
        tags_synced: data.tagsSynced || 0,
        sessions_synced: data.sessionsSynced || 0,
        total_records_synced: data.totalRecordsSynced || 0,
        error_message: data.errorMessage,
        triggered_by: data.triggeredBy,
      });

      if (error) throw error;
    } catch (error) {
      logger.error('Error recording sync history', { error });
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(userId: string, days: number = 30): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_oura_sync_statistics', {
        p_user_id: userId,
        p_days: days,
      });

      if (error) throw error;

      return data?.[0] || null;
    } catch (error) {
      logger.error('Error getting sync statistics', { error, userId });
      throw error;
    }
  }

  /**
   * Get latest readiness score
   */
  async getLatestReadiness(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_latest_oura_readiness', {
        p_user_id: userId,
      });

      if (error) throw error;

      return data?.[0] || null;
    } catch (error) {
      logger.error('Error getting latest readiness', { error, userId });
      throw error;
    }
  }

  /**
   * Get sleep trend
   */
  async getSleepTrend(userId: string, days: number = 7): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_oura_sleep_trend', {
        p_user_id: userId,
        p_days: days,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting sleep trend', { error, userId });
      throw error;
    }
  }

  /**
   * Build latest Oura summary containing readiness, sleep, activity, SpO2, connection status
   */
  async getLatestSummary(userId: string): Promise<any> {
    try {
      const [readiness, sleep, activity, spo2, connection, sessions, tags] = await Promise.all([
        supabase
          .from('oura_readiness_data')
          .select('*')
          .eq('user_id', userId)
          .order('readiness_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('oura_sleep_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('sleep_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('oura_activity_data')
          .select('*')
          .eq('user_id', userId)
          .order('activity_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('oura_spo2_data')
          .select('*')
          .eq('user_id', userId)
          .order('spo2_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('oura_connections')
          .select(
            'connection_status, auto_sync_enabled, last_sync_at, last_successful_sync_at, consecutive_failures, last_error_message'
          )
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('oura_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('session_date', { ascending: false })
          .order('start_time', { ascending: false })
          .limit(5),
        supabase
          .from('oura_tags')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(5),
      ]);

      return {
        readiness: readiness.data ?? null,
        sleep: sleep.data ?? null,
        activity: activity.data ?? null,
        spo2: spo2.data ?? null,
        connection: connection?.data ?? null,
        sessions: sessions.data ?? [],
        tags: tags.data ?? [],
      };
    } catch (error) {
      logger.error('Error building latest Oura summary', { error, userId });
      throw error;
    }
  }

  async getRecentSessions(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('oura_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting recent Oura sessions', { error, userId, limit });
      throw error;
    }
  }

  async getRecentTags(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('oura_tags')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting recent Oura tags', { error, userId, limit });
      throw error;
    }
  }
}

export const ouraSyncService = new OuraSyncService();
