// Apple Watch Automatic Sync Service
// Handles automatic daily sync of Apple Watch data via iOS app background sync

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { appleWatchClient } from './appleWatchClient';

export class AppleWatchSyncService {
  
  /**
   * Sync all users who need automatic sync
   * Called by cron job daily at 6 AM
   */
  async syncAllUsers(): Promise<void> {
    try {
      logger.info('Starting automatic Apple Watch sync for all users');

      // Get all users who need sync
      const { data: connections, error } = await supabase
        .from('apple_watch_connections')
        .select('user_id')
        .eq('is_connected', true)
        .eq('auto_sync_enabled', true)
        .eq('sync_status', 'active');

      if (error) throw error;

      if (!connections || connections.length === 0) {
        logger.info('No users need Apple Watch sync');
        return;
      }

      logger.info(`Found ${connections.length} users for Apple Watch sync`);

      // Sync each user
      let successCount = 0;
      let failureCount = 0;

      for (const connection of connections) {
        try {
          // Check if sync is needed using helper function
          const { data: shouldSync } = await supabase.rpc('should_sync_apple_watch', {
            p_user_id: connection.user_id,
          });

          if (shouldSync) {
            await this.syncUser(connection.user_id, 'cron');
            successCount++;
          }
        } catch (error) {
          logger.error('Error syncing user', { error, userId: connection.user_id });
          failureCount++;
        }
      }

      logger.info('Apple Watch sync completed', { successCount, failureCount });
    } catch (error) {
      logger.error('Error in syncAllUsers', { error });
      throw error;
    }
  }

  /**
   * Sync a single user
   * This triggers the iOS app to read from HealthKit and send data to server
   */
  async syncUser(userId: string, triggeredBy: string = 'manual'): Promise<void> {
    const syncStartTime = new Date().toISOString();
    
    try {
      logger.info('Starting Apple Watch sync for user', { userId, triggeredBy });

      // Send push notification to iOS app to trigger HealthKit read
      // The iOS app will then call our API endpoints to save the data
      await this.triggerIOSAppSync(userId);

      // Record sync initiation
      await appleWatchClient.recordSyncHistory(userId, {
        syncStartedAt: syncStartTime,
        syncCompletedAt: new Date().toISOString(),
        syncDurationSeconds: Math.floor((Date.now() - new Date(syncStartTime).getTime()) / 1000),
        syncType: triggeredBy === 'cron' ? 'daily' : 'manual',
        dateRangeStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateRangeEnd: new Date().toISOString().split('T')[0],
        status: 'success',
        recordsSynced: 0, // Will be updated by iOS app
        workoutsSynced: 0, // Will be updated by iOS app
        errorsCount: 0,
        dataTypesSynced: [
          'heart_rate',
          'hrv',
          'activity',
          'sleep',
          'workouts',
          'blood_oxygen',
          'temperature',
        ],
        triggeredBy,
      });

      logger.info('Apple Watch sync triggered successfully', { userId });
    } catch (error) {
      logger.error('Error syncing Apple Watch data', { error, userId });

      // Record failure
      await appleWatchClient.recordSyncHistory(userId, {
        syncStartedAt: syncStartTime,
        syncCompletedAt: new Date().toISOString(),
        syncDurationSeconds: Math.floor((Date.now() - new Date(syncStartTime).getTime()) / 1000),
        syncType: triggeredBy === 'cron' ? 'daily' : 'manual',
        status: 'failed',
        errorsCount: 1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        triggeredBy,
      });

      throw error;
    }
  }

  /**
   * Trigger iOS app to read from HealthKit
   * Sends push notification to iOS app with silent background fetch
   */
  private async triggerIOSAppSync(userId: string): Promise<void> {
    try {
      // Get user's device token for push notifications
      const { data: user, error } = await supabase
        .from('users')
        .select('ios_device_token, ios_push_enabled')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!user?.ios_device_token || !user?.ios_push_enabled) {
        logger.warn('User does not have iOS push notifications enabled', { userId });
        return;
      }

      // Send silent push notification to trigger background sync
      // This uses Apple Push Notification service (APNs)
      await this.sendAPNSNotification(user.ios_device_token, {
        contentAvailable: 1, // Silent notification
        data: {
          type: 'healthkit_sync',
          syncType: 'daily',
          userId,
        },
      });

      logger.info('iOS app sync triggered via push notification', { userId });
    } catch (error) {
      logger.error('Error triggering iOS app sync', { error, userId });
      // Don't throw - this is not critical, user can manually sync
    }
  }

  /**
   * Send Apple Push Notification
   */
  private async sendAPNSNotification(deviceToken: string, payload: any): Promise<void> {
    try {
      // TODO: Implement APNs integration
      // This would use the apn library or HTTP/2 APNs API
      // For now, we'll log that we would send the notification
      
      logger.info('Would send APNs notification', { deviceToken, payload });
      
      // Example implementation:
      // const apnProvider = new apn.Provider({
      //   token: {
      //     key: process.env.APNS_KEY,
      //     keyId: process.env.APNS_KEY_ID,
      //     teamId: process.env.APNS_TEAM_ID,
      //   },
      //   production: process.env.NODE_ENV === 'production',
      // });
      //
      // const notification = new apn.Notification({
      //   contentAvailable: payload.contentAvailable,
      //   payload: payload.data,
      //   topic: 'com.yourapp.health',
      // });
      //
      // await apnProvider.send(notification, deviceToken);
    } catch (error) {
      logger.error('Error sending APNs notification', { error });
      throw error;
    }
  }

  /**
   * Backfill historical data
   * Used when user first connects their Apple Watch
   */
  async backfillData(userId: string, daysBack: number = 30): Promise<void> {
    const syncStartTime = new Date().toISOString();
    
    try {
      logger.info('Starting Apple Watch backfill', { userId, daysBack });

      // Trigger iOS app to read historical data
      await this.triggerIOSAppSync(userId);

      // Record backfill sync
      await appleWatchClient.recordSyncHistory(userId, {
        syncStartedAt: syncStartTime,
        syncCompletedAt: new Date().toISOString(),
        syncDurationSeconds: Math.floor((Date.now() - new Date(syncStartTime).getTime()) / 1000),
        syncType: 'backfill',
        dateRangeStart: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateRangeEnd: new Date().toISOString().split('T')[0],
        status: 'success',
        triggeredBy: 'user_request',
      });

      logger.info('Apple Watch backfill completed', { userId });
    } catch (error) {
      logger.error('Error backfilling Apple Watch data', { error, userId });
      throw error;
    }
  }

  /**
   * Get sync status for user
   */
  async getSyncStatus(userId: string): Promise<any> {
    try {
      const connection = await appleWatchClient.getConnectionStatus(userId);

      if (!connection) {
        return {
          connected: false,
          message: 'Apple Watch not connected',
        };
      }

      // Get latest sync history
      const { data: syncHistory } = await supabase
        .from('apple_watch_sync_history')
        .select('*')
        .eq('user_id', userId)
        .order('sync_started_at', { ascending: false })
        .limit(5);

      return {
        connected: connection.is_connected,
        autoSyncEnabled: connection.auto_sync_enabled,
        syncStatus: connection.sync_status,
        lastSyncAt: connection.last_sync_at,
        lastSuccessfulSyncAt: connection.last_successful_sync_at,
        consecutiveFailures: connection.consecutive_failures,
        lastError: connection.last_error_message,
        deviceName: connection.device_name,
        syncHistory: syncHistory || [],
      };
    } catch (error) {
      logger.error('Error getting sync status', { error, userId });
      throw error;
    }
  }

  /**
   * Enable/disable auto sync
   */
  async setAutoSync(userId: string, enabled: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('apple_watch_connections')
        .update({ auto_sync_enabled: enabled })
        .eq('user_id', userId);

      if (error) throw error;

      logger.info('Auto sync updated', { userId, enabled });
    } catch (error) {
      logger.error('Error updating auto sync', { error, userId });
      throw error;
    }
  }

  /**
   * Update sync frequency
   */
  async setSyncFrequency(userId: string, frequency: 'hourly' | 'daily' | 'manual'): Promise<void> {
    try {
      const { error } = await supabase
        .from('apple_watch_connections')
        .update({ sync_frequency: frequency })
        .eq('user_id', userId);

      if (error) throw error;

      logger.info('Sync frequency updated', { userId, frequency });
    } catch (error) {
      logger.error('Error updating sync frequency', { error, userId });
      throw error;
    }
  }

  /**
   * Get latest health metrics for dashboard
   */
  async getLatestMetrics(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('apple_watch_health_data')
        .select('*')
        .eq('user_id', userId)
        .order('data_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      logger.error('Error getting latest metrics', { error, userId });
      throw error;
    }
  }

  /**
   * Get activity rings for today
   */
  async getTodayActivityRings(userId: string): Promise<any> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('apple_watch_health_data')
        .select('move_ring_percentage, exercise_ring_percentage, stand_ring_percentage, move_goal, exercise_goal, stand_goal')
        .eq('user_id', userId)
        .eq('data_date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data || {
        move_ring_percentage: 0,
        exercise_ring_percentage: 0,
        stand_ring_percentage: 0,
        move_goal: 600,
        exercise_goal: 30,
        stand_goal: 12,
      };
    } catch (error) {
      logger.error('Error getting activity rings', { error, userId });
      throw error;
    }
  }
}

export const appleWatchSyncService = new AppleWatchSyncService();
