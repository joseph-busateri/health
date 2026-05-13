// Oura Ring Automatic Sync Service
// Handles automatic daily sync with AES-256 token encryption

import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { ouraApiClient, OuraTokens } from './ouraApiClient';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!'; // Must be 32 characters for AES-256
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

export class OuraSyncService {
  
  /**
   * Encrypt text using AES-256-CBC
   */
  private encrypt(text: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
    };
  }

  /**
   * Decrypt text using AES-256-CBC
   */
  private decrypt(encrypted: string, ivHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

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

      // Encrypt tokens
      const accessTokenEncrypted = this.encrypt(tokens.accessToken);
      const refreshTokenEncrypted = tokens.refreshToken 
        ? this.encrypt(tokens.refreshToken)
        : null;

      // Save connection
      const { error } = await supabase
        .from('oura_connections')
        .upsert({
          user_id: userId,
          access_token_encrypted: accessTokenEncrypted.encrypted,
          refresh_token_encrypted: refreshTokenEncrypted?.encrypted,
          token_expires_at: tokens.expiresAt.toISOString(),
          encryption_iv: accessTokenEncrypted.iv,
          connection_status: 'active',
          oura_user_id: personalInfo.id,
          email: personalInfo.email,
          auto_sync_enabled: true,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

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
      const { error } = await supabase
        .from('oura_connections')
        .update({
          connection_status: 'disconnected',
          auto_sync_enabled: false,
        })
        .eq('user_id', userId);

      if (error) throw error;

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
      const { data: connection, error: connError } = await supabase
        .from('oura_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (connError) throw connError;

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
  async syncData(connection: any, userId: string): Promise<number> {
    const syncStartTime = new Date();
    let totalRecordsSynced = 0;

    try {
      // Decrypt tokens
      const accessToken = this.decrypt(
        connection.access_token_encrypted,
        connection.encryption_iv
      );
      const refreshToken = connection.refresh_token_encrypted
        ? this.decrypt(connection.refresh_token_encrypted, connection.encryption_iv)
        : null;

      // Set tokens in API client
      ouraApiClient.setTokens({
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt: new Date(connection.token_expires_at),
      });

      // Determine date range
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = connection.last_sync_date
        ? new Date(new Date(connection.last_sync_date).getTime() - 7 * 24 * 60 * 60 * 1000)
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
        totalRecordsSynced,
        triggeredBy: 'cron',
      });

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
      const { data: connection, error } = await supabase
        .from('oura_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('connection_status', 'active')
        .single();

      if (error) throw error;

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
}

export const ouraSyncService = new OuraSyncService();
