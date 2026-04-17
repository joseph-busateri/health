// Sleep Number Automatic Sync Service
// Handles automatic daily syncing of sleep data from Sleep Number API

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { SleepNumberApiClient } from '../integrations/sleepNumberApiClient';
import { sleepNumberService } from './sleepNumberService';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key!!';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

// Warn if using placeholder encryption key
if (!process.env.ENCRYPTION_KEY) {
  logger.warn('WARNING: Using placeholder ENCRYPTION_KEY. Set ENCRYPTION_KEY environment variable for production security.');
}

export interface SyncResult {
  success: boolean;
  sessionsFetched: number;
  sessionsSaved: number;
  sessionsUpdated: number;
  sessionsSkipped: number;
  error?: string;
}

export class SleepNumberSyncService {
  
  /**
   * Connect user's Sleep Number account
   */
  async connectAccount(
    userId: string,
    email: string,
    password: string
  ): Promise<{ connectionId: string; bedId: string }> {
    try {
      // Create API client and login
      const apiClient = new SleepNumberApiClient();
      const tokens = await apiClient.login(email, password);

      // Get user's beds
      const beds = await apiClient.getBeds();
      if (beds.length === 0) {
        throw new Error('No beds found for this account');
      }

      const bedId = beds[0].bedId;

      // Encrypt tokens
      const encryptedAccessToken = this.encrypt(tokens.accessToken);
      const encryptedRefreshToken = this.encrypt(tokens.refreshToken);

      // Save connection
      const { data: connection, error } = await supabase
        .from('sleep_number_connections')
        .insert({
          user_id: userId,
          email: email,
          access_token_encrypted: encryptedAccessToken,
          refresh_token_encrypted: encryptedRefreshToken,
          token_expires_at: tokens.expiresAt.toISOString(),
          connection_status: 'active',
          auto_sync_enabled: true,
          bed_id: bedId,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Sleep Number account connected', {
        userId,
        connectionId: connection.id,
        bedId,
      });

      // Trigger immediate initial sync
      await this.queueSyncJob(connection.id, new Date(), 1);

      return {
        connectionId: connection.id,
        bedId,
      };
    } catch (error: any) {
      logger.error('Failed to connect Sleep Number account', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Disconnect Sleep Number account
   */
  async disconnectAccount(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sleep_number_connections')
        .update({
          connection_status: 'disconnected',
          auto_sync_enabled: false,
        })
        .eq('user_id', userId);

      if (error) throw error;

      logger.info('Sleep Number account disconnected', { userId });
    } catch (error) {
      logger.error('Failed to disconnect account', { error, userId });
      throw error;
    }
  }

  /**
   * Run automatic sync for all active connections
   * This should be called by a cron job daily
   */
  async runAutomaticSync(): Promise<void> {
    try {
      logger.info('Starting automatic sync for all connections');

      // Get pending sync jobs
      const { data: jobs, error } = await supabase
        .rpc('get_pending_sync_jobs', { p_limit: 50 });

      if (error) throw error;

      if (!jobs || jobs.length === 0) {
        logger.info('No pending sync jobs');
        return;
      }

      logger.info(`Processing ${jobs.length} sync jobs`);

      // Process each job
      for (const job of jobs) {
        try {
          await this.processSyncJob(job.job_id, job.connection_id, job.user_id);
        } catch (error) {
          logger.error('Failed to process sync job', { error, jobId: job.job_id });
        }
      }

      logger.info('Automatic sync completed');
    } catch (error) {
      logger.error('Failed to run automatic sync', { error });
      throw error;
    }
  }

  /**
   * Process a single sync job
   */
  async processSyncJob(
    jobId: string,
    connectionId: string,
    userId: string
  ): Promise<SyncResult> {
    try {
      // Mark job as processing
      await supabase.rpc('start_sync_job', { p_job_id: jobId });

      // Get connection details
      const { data: connection, error: connError } = await supabase
        .from('sleep_number_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (connError) throw connError;

      // Create sync history entry
      const { data: syncHistory, error: historyError } = await supabase
        .from('sleep_number_sync_history')
        .insert({
          connection_id: connectionId,
          user_id: userId,
          sync_started_at: new Date().toISOString(),
          sync_status: 'running',
          triggered_by: 'auto_sync',
        })
        .select()
        .single();

      if (historyError) throw historyError;

      // Perform the sync
      const result = await this.syncSleepData(connection, userId);

      // Update sync history
      await supabase
        .from('sleep_number_sync_history')
        .update({
          sync_completed_at: new Date().toISOString(),
          sync_status: result.success ? 'success' : 'failed',
          sessions_fetched: result.sessionsFetched,
          sessions_saved: result.sessionsSaved,
          sessions_updated: result.sessionsUpdated,
          sessions_skipped: result.sessionsSkipped,
          error_message: result.error,
        })
        .eq('id', syncHistory.id);

      // Update connection last sync
      await supabase
        .from('sleep_number_connections')
        .update({
          last_sync_date: new Date().toISOString(),
          last_sync_status: result.success ? 'success' : 'failed',
          last_error_message: result.error,
        })
        .eq('id', connectionId);

      // Complete the job
      await supabase.rpc('complete_sync_job', {
        p_job_id: jobId,
        p_sync_history_id: syncHistory.id,
        p_success: result.success,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to process sync job', { error: error.message, jobId });
      
      // Update job as failed
      await supabase
        .from('sleep_number_sync_queue')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      return {
        success: false,
        sessionsFetched: 0,
        sessionsSaved: 0,
        sessionsUpdated: 0,
        sessionsSkipped: 0,
        error: error.message,
      };
    }
  }

  /**
   * Sync sleep data from Sleep Number API
   */
  async syncSleepData(connection: any, userId: string): Promise<SyncResult> {
    try {
      // Decrypt tokens
      const accessToken = this.decrypt(connection.access_token_encrypted);
      const refreshToken = this.decrypt(connection.refresh_token_encrypted);

      // Create API client with tokens
      const apiClient = new SleepNumberApiClient();
      apiClient.setTokens({
        accessToken,
        refreshToken,
        expiresAt: new Date(connection.token_expires_at),
      });

      // Determine date range to sync
      const endDate = new Date();
      const startDate = new Date();
      
      if (connection.last_sync_date) {
        // Sync from last sync date
        startDate.setTime(new Date(connection.last_sync_date).getTime());
      } else {
        // First sync - get last 30 days
        startDate.setDate(startDate.getDate() - 30);
      }

      // Fetch sleep data
      const sleepData = await apiClient.getSleepData(
        connection.bed_id,
        this.formatDate(startDate),
        this.formatDate(endDate)
      );

      let sessionsSaved = 0;
      let sessionsUpdated = 0;
      let sessionsSkipped = 0;

      // Save each session
      for (const session of sleepData) {
        try {
          // Check if session already exists
          const existing = await sleepNumberService.getSessionByDate(
            userId,
            session.date,
            connection.sleeper_side || 'both'
          );

          if (existing) {
            // Update existing session
            await sleepNumberService.saveSleepSession({
              userId,
              sessionDate: session.date,
              sleeperSide: connection.sleeper_side || 'both',
              bedId: connection.bed_id,
              totalSleepTimeMinutes: session.totalSleepTime,
              sleepIQScore: session.sleepIQ,
              avgHeartRate: session.avgHeartRate,
              avgRespiratoryRate: session.avgRespiratoryRate,
              deepSleepMinutes: session.deepSleep,
              lightSleepMinutes: session.lightSleep,
              remSleepMinutes: session.remSleep,
              awakeTimeMinutes: session.awakeTime,
              restlessTimeMinutes: session.restlessTime,
              restfulTimeMinutes: session.restfulTime,
              inBedTime: session.inBedTime,
              outOfBedTime: session.outOfBedTime,
              sleepNumberSetting: session.sleepNumber,
              dataSource: 'api_sync',
            });
            sessionsUpdated++;
          } else {
            // Save new session
            await sleepNumberService.saveSleepSession({
              userId,
              sessionDate: session.date,
              sleeperSide: connection.sleeper_side || 'both',
              bedId: connection.bed_id,
              totalSleepTimeMinutes: session.totalSleepTime,
              sleepIQScore: session.sleepIQ,
              avgHeartRate: session.avgHeartRate,
              avgRespiratoryRate: session.avgRespiratoryRate,
              deepSleepMinutes: session.deepSleep,
              lightSleepMinutes: session.lightSleep,
              remSleepMinutes: session.remSleep,
              awakeTimeMinutes: session.awakeTime,
              restlessTimeMinutes: session.restlessTime,
              restfulTimeMinutes: session.restfulTime,
              inBedTime: session.inBedTime,
              outOfBedTime: session.outOfBedTime,
              sleepNumberSetting: session.sleepNumber,
              dataSource: 'api_sync',
            });
            sessionsSaved++;
          }
        } catch (error) {
          logger.warn('Failed to save sleep session', { error, date: session.date });
          sessionsSkipped++;
        }
      }

      logger.info('Sleep data synced successfully', {
        userId,
        fetched: sleepData.length,
        saved: sessionsSaved,
        updated: sessionsUpdated,
        skipped: sessionsSkipped,
      });

      return {
        success: true,
        sessionsFetched: sleepData.length,
        sessionsSaved,
        sessionsUpdated,
        sessionsSkipped,
      };
    } catch (error: any) {
      logger.error('Failed to sync sleep data', { error: error.message, userId });
      return {
        success: false,
        sessionsFetched: 0,
        sessionsSaved: 0,
        sessionsUpdated: 0,
        sessionsSkipped: 0,
        error: error.message,
      };
    }
  }

  /**
   * Queue a sync job
   */
  async queueSyncJob(
    connectionId: string,
    scheduledFor: Date,
    priority: number = 5
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('queue_sync_job', {
          p_connection_id: connectionId,
          p_scheduled_for: scheduledFor.toISOString(),
          p_priority: priority,
        });

      if (error) throw error;

      logger.info('Sync job queued', { connectionId, scheduledFor, priority });
      return data;
    } catch (error) {
      logger.error('Failed to queue sync job', { error, connectionId });
      throw error;
    }
  }

  /**
   * Get sync statistics for a user
   */
  async getSyncStatistics(userId: string, days: number = 30): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_sync_statistics', {
          p_user_id: userId,
          p_days: days,
        });

      if (error) throw error;

      return data[0] || {
        total_syncs: 0,
        successful_syncs: 0,
        failed_syncs: 0,
        total_sessions_synced: 0,
        last_sync_date: null,
        success_rate: 0,
      };
    } catch (error) {
      logger.error('Failed to get sync statistics', { error, userId });
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
      iv
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
      iv
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export const sleepNumberSyncService = new SleepNumberSyncService();
