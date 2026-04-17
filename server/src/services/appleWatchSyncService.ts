// Apple Watch Automatic Sync Service
// Handles automatic daily sync of Apple Watch data via iOS app background sync

import apn from 'apn';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { appleWatchClient } from './appleWatchClient';

// APNs Configuration
const APNS_KEY = process.env.APNS_KEY || '';
const APNS_KEY_ID = process.env.APNS_KEY_ID || '';
const APNS_TEAM_ID = process.env.APNS_TEAM_ID || '';
const APNS_BUNDLE_ID = process.env.APNS_BUNDLE_ID || 'com.yourcompany.healthapp';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Warn if APNs credentials are not configured
if (!APNS_KEY || !APNS_KEY_ID || !APNS_TEAM_ID) {
  logger.warn('WARNING: APNs credentials not configured. Set APNS_KEY, APNS_KEY_ID, and APNS_TEAM_ID environment variables for push notifications.');
}

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
   * Sends silent background notification to iOS app to trigger HealthKit sync
   */
  private async sendAPNSNotification(deviceToken: string, payload: any): Promise<void> {
    try {
      // Check if APNs is configured
      if (!APNS_KEY || !APNS_KEY_ID || !APNS_TEAM_ID) {
        logger.warn('APNs not configured, skipping notification', { deviceToken });
        return;
      }

      // Decode base64 APNs key if needed
      let apnsKeyContent = APNS_KEY;
      if (APNS_KEY.includes('base64:')) {
        apnsKeyContent = Buffer.from(APNS_KEY.replace('base64:', ''), 'base64').toString('utf8');
      }

      // Create APNs provider
      const apnProvider = new apn.Provider({
        token: {
          key: apnsKeyContent,
          keyId: APNS_KEY_ID,
          teamId: APNS_TEAM_ID,
        },
        production: IS_PRODUCTION,
      });

      // Create silent notification
      const notification = new apn.Notification({
        contentAvailable: 1, // Silent notification
        payload: payload.data,
        topic: APNS_BUNDLE_ID,
        priority: 5, // Send immediately
        pushType: 'background',
      });

      // Send notification
      const result = await apnProvider.send(notification, deviceToken);

      // Check for failures
      if (result.failed && result.failed.length > 0) {
        const failure = result.failed[0];
        logger.error('APNs notification failed', {
          deviceToken,
          status: failure.status,
          response: failure.response,
        });

        // Handle invalid device token
        if (failure.status === '410' || failure.response?.reason === 'Unregistered') {
          await this.handleInvalidDeviceToken(deviceToken);
        }

        throw new Error(`APNs failed: ${failure.response?.reason || 'Unknown error'}`);
      }

      logger.info('APNs notification sent successfully', {
        deviceToken: deviceToken.substring(0, 10) + '...',
        sent: result.sent?.length || 0,
      });

      // Shutdown provider
      apnProvider.shutdown();
    } catch (error) {
      logger.error('Error sending APNs notification', { error });
      throw error;
    }
  }

  /**
   * Handle invalid device token
   * Disables push notifications for user when token is invalid
   */
  private async handleInvalidDeviceToken(deviceToken: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ ios_push_enabled: false })
        .eq('ios_device_token', deviceToken);

      if (error) throw error;

      logger.info('Disabled push notifications for invalid device token', {
        deviceToken: deviceToken.substring(0, 10) + '...',
      });
    } catch (error) {
      logger.error('Error handling invalid device token', { error });
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
   * Get activity rings for today or specific date
   */
  async getTodayActivityRings(userId: string, date?: string): Promise<any> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('apple_watch_health_data')
        .select('move_ring_percentage, exercise_ring_percentage, stand_ring_percentage, move_goal, exercise_goal, stand_goal')
        .eq('user_id', userId)
        .eq('data_date', targetDate)
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

  /**
   * Connect Apple Watch device
   * Called when user authorizes HealthKit
   */
  async connectDevice(userId: string, deviceInfo: any): Promise<void> {
    try {
      logger.info('Connecting Apple Watch device', { userId });

      await appleWatchClient.updateConnection(userId, {
        deviceName: deviceInfo.deviceName,
        deviceModel: deviceInfo.deviceModel,
        watchOsVersion: deviceInfo.watchOsVersion,
        pairedIphoneModel: deviceInfo.pairedIphoneModel,
        healthkitAuthorized: true,
        authorizedDataTypes: deviceInfo.authorizedDataTypes || [
          'heart_rate',
          'hrv',
          'activity',
          'sleep',
          'workouts',
        ],
      });

      logger.info('Apple Watch device connected', { userId });
    } catch (error) {
      logger.error('Error connecting device', { error, userId });
      throw error;
    }
  }

  /**
   * Disconnect Apple Watch device
   */
  async disconnectDevice(userId: string): Promise<void> {
    try {
      logger.info('Disconnecting Apple Watch device', { userId });
      await appleWatchClient.disconnect(userId);
      logger.info('Apple Watch device disconnected', { userId });
    } catch (error) {
      logger.error('Error disconnecting device', { error, userId });
      throw error;
    }
  }

  /**
   * Save HealthKit data from iOS app
   * Called by iOS app after reading from HealthKit
   */
  async saveHealthKitData(userId: string, healthKitData: any): Promise<void> {
    try {
      logger.info('Saving HealthKit data', { userId });

      // Save daily aggregated data
      if (healthKitData.dailyData) {
        for (const dayData of healthKitData.dailyData) {
          await appleWatchClient.saveHealthKitData({
            userId,
            dataDate: dayData.date,
            ...dayData,
          });
        }
      }

      // Save workouts
      if (healthKitData.workouts && healthKitData.workouts.length > 0) {
        for (const workout of healthKitData.workouts) {
          await appleWatchClient.saveWorkout({
            userId,
            ...workout,
          });
        }
      }

      // Save heart rate samples (if detailed data provided)
      if (healthKitData.heartRateSamples && healthKitData.heartRateSamples.length > 0) {
        await appleWatchClient.saveHeartRateSamples(
          healthKitData.heartRateSamples.map((sample: any) => ({
            userId,
            ...sample,
          }))
        );
      }

      logger.info('HealthKit data saved successfully', { userId });
    } catch (error) {
      logger.error('Error saving HealthKit data', { error, userId });
      throw error;
    }
  }

  /**
   * Get workout summary
   */
  async getWorkoutSummary(userId: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      return await appleWatchClient.getWorkoutSummary(userId, start, end);
    } catch (error) {
      logger.error('Error getting workout summary', { error, userId });
      throw error;
    }
  }

  /**
   * Get HRV trend
   */
  async getHRVTrend(userId: string, days: number = 30): Promise<any> {
    try {
      return await appleWatchClient.getHRVTrend(userId, days);
    } catch (error) {
      logger.error('Error getting HRV trend', { error, userId });
      throw error;
    }
  }
}

export const appleWatchSyncService = new AppleWatchSyncService();
