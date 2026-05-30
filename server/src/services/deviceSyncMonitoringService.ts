// Device Sync Monitoring Service
// Monitors sync health across all device integrations and sends alerts

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

interface SyncFailureAlert {
  deviceType: 'oura' | 'apple_watch' | 'sleep_number';
  userId: string;
  consecutiveFailures: number;
  lastError: string;
  lastFailureAt: string;
}

interface SyncHealthMetrics {
  deviceType: string;
  totalUsers: number;
  activeUsers: number;
  successRate24h: number;
  successRate7d: number;
  avgSyncDuration: number;
  consecutiveFailuresCount: number;
  lastSyncAt: string;
}

export class DeviceSyncMonitoringService {
  private readonly ALERT_THRESHOLD = 3; // Alert after 3 consecutive failures
  private readonly CRITICAL_THRESHOLD = 5; // Critical alert after 5 consecutive failures

  /**
   * Check all device integrations for sync failures and send alerts
   */
  async monitorAllDevices(): Promise<void> {
    try {
      logger.info('Starting device sync monitoring');

      const [ouraAlerts, appleWatchAlerts, sleepNumberAlerts] = await Promise.all([
        this.checkDeviceFailures('oura'),
        this.checkDeviceFailures('apple_watch'),
        this.checkDeviceFailures('sleep_number'),
      ]);

      const allAlerts = [...ouraAlerts, ...appleWatchAlerts, ...sleepNumberAlerts];

      if (allAlerts.length > 0) {
        logger.warn(`Found ${allAlerts.length} sync failure alerts`, { alerts: allAlerts });
        await this.sendAlerts(allAlerts);
      } else {
        logger.info('All device syncs healthy');
      }
    } catch (error) {
      logger.error('Error monitoring device syncs', { error });
    }
  }

  /**
   * Check for sync failures for a specific device type
   */
  private async checkDeviceFailures(
    deviceType: 'oura' | 'apple_watch' | 'sleep_number'
  ): Promise<SyncFailureAlert[]> {
    try {
      const tableName = `${deviceType}_connections`;
      
      const { data: failures, error } = await supabase
        .from(tableName)
        .select('user_id, consecutive_failures, last_error_message, last_sync_at')
        .gte('consecutive_failures', this.ALERT_THRESHOLD)
        .eq('auto_sync_enabled', true);

      if (error) throw error;

      return (failures || []).map(failure => ({
        deviceType,
        userId: failure.user_id,
        consecutiveFailures: failure.consecutive_failures,
        lastError: failure.last_error_message || 'Unknown error',
        lastFailureAt: failure.last_sync_at,
      }));
    } catch (error) {
      logger.error(`Error checking ${deviceType} failures`, { error });
      return [];
    }
  }

  /**
   * Send alerts for sync failures
   */
  private async sendAlerts(alerts: SyncFailureAlert[]): Promise<void> {
    for (const alert of alerts) {
      const severity = alert.consecutiveFailures >= this.CRITICAL_THRESHOLD ? 'CRITICAL' : 'WARNING';
      
      logger.warn(`${severity}: Device sync failure`, {
        deviceType: alert.deviceType,
        userId: alert.userId,
        consecutiveFailures: alert.consecutiveFailures,
        lastError: alert.lastError,
      });

      // Record alert in database
      await this.recordAlert(alert, severity);

      // TODO: Send notification to admin/ops team
      // This could be email, Slack, PagerDuty, etc.
      // await this.sendNotification(alert, severity);
    }
  }

  /**
   * Record alert in database for tracking
   */
  private async recordAlert(alert: SyncFailureAlert, severity: string): Promise<void> {
    try {
      const { error } = await supabase.from('device_sync_alerts').insert({
        device_type: alert.deviceType,
        user_id: alert.userId,
        severity,
        consecutive_failures: alert.consecutiveFailures,
        error_message: alert.lastError,
        alert_sent_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      logger.error('Error recording alert', { error, alert });
    }
  }

  /**
   * Get sync health metrics for all devices
   */
  async getSyncHealthMetrics(): Promise<SyncHealthMetrics[]> {
    try {
      const [ouraMetrics, appleWatchMetrics, sleepNumberMetrics] = await Promise.all([
        this.getDeviceMetrics('oura'),
        this.getDeviceMetrics('apple_watch'),
        this.getDeviceMetrics('sleep_number'),
      ]);

      return [ouraMetrics, appleWatchMetrics, sleepNumberMetrics];
    } catch (error) {
      logger.error('Error getting sync health metrics', { error });
      return [];
    }
  }

  /**
   * Get metrics for a specific device type
   */
  private async getDeviceMetrics(
    deviceType: 'oura' | 'apple_watch' | 'sleep_number'
  ): Promise<SyncHealthMetrics> {
    try {
      const tableName = `${deviceType}_connections`;
      const historyTable = `${deviceType}_sync_history`;

      // Get connection counts
      const { data: connections, error: connError } = await supabase
        .from(tableName)
        .select('user_id, consecutive_failures, last_sync_at')
        .eq('is_connected', true);

      if (connError) throw connError;

      const totalUsers = connections?.length || 0;
      const activeUsers = connections?.filter(c => c.consecutive_failures === 0).length || 0;
      const consecutiveFailuresCount = connections?.filter(c => c.consecutive_failures >= this.ALERT_THRESHOLD).length || 0;

      // Get success rates
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data: syncs24h, error: sync24hError } = await supabase
        .from(historyTable)
        .select('status, sync_duration_seconds')
        .gte('sync_started_at', oneDayAgo.toISOString());

      if (sync24hError) throw sync24hError;

      const { data: syncs7d, error: sync7dError } = await supabase
        .from(historyTable)
        .select('status')
        .gte('sync_started_at', sevenDaysAgo.toISOString());

      if (sync7dError) throw sync7dError;

      const successRate24h = this.calculateSuccessRate(syncs24h || []);
      const successRate7d = this.calculateSuccessRate(syncs7d || []);
      const avgSyncDuration = this.calculateAvgDuration(syncs24h || []);

      const lastSync = connections?.reduce((latest, conn) => {
        if (!latest || (conn.last_sync_at && conn.last_sync_at > latest)) {
          return conn.last_sync_at;
        }
        return latest;
      }, null as string | null);

      return {
        deviceType,
        totalUsers,
        activeUsers,
        successRate24h,
        successRate7d,
        avgSyncDuration,
        consecutiveFailuresCount,
        lastSyncAt: lastSync || 'Never',
      };
    } catch (error) {
      logger.error(`Error getting ${deviceType} metrics`, { error });
      return {
        deviceType,
        totalUsers: 0,
        activeUsers: 0,
        successRate24h: 0,
        successRate7d: 0,
        avgSyncDuration: 0,
        consecutiveFailuresCount: 0,
        lastSyncAt: 'Error',
      };
    }
  }

  /**
   * Calculate success rate from sync history
   */
  private calculateSuccessRate(syncs: any[]): number {
    if (syncs.length === 0) return 100;
    const successful = syncs.filter(s => s.status === 'success').length;
    return Math.round((successful / syncs.length) * 100);
  }

  /**
   * Calculate average sync duration
   */
  private calculateAvgDuration(syncs: any[]): number {
    if (syncs.length === 0) return 0;
    const validDurations = syncs
      .filter(s => s.sync_duration_seconds != null)
      .map(s => s.sync_duration_seconds);
    
    if (validDurations.length === 0) return 0;
    
    const sum = validDurations.reduce((a, b) => a + b, 0);
    return Math.round(sum / validDurations.length);
  }

  /**
   * Get detailed sync history for a user
   */
  async getUserSyncHistory(
    userId: string,
    deviceType: 'oura' | 'apple_watch' | 'sleep_number',
    limit: number = 10
  ): Promise<any[]> {
    try {
      const historyTable = `${deviceType}_sync_history`;

      const { data, error } = await supabase
        .from(historyTable)
        .select('*')
        .eq('user_id', userId)
        .order('sync_started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting user sync history', { error, userId, deviceType });
      return [];
    }
  }

  /**
   * Reset consecutive failures for a user (after manual intervention)
   */
  async resetConsecutiveFailures(
    userId: string,
    deviceType: 'oura' | 'apple_watch' | 'sleep_number'
  ): Promise<void> {
    try {
      const tableName = `${deviceType}_connections`;

      const { error } = await supabase
        .from(tableName)
        .update({
          consecutive_failures: 0,
          last_error_message: null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      logger.info('Reset consecutive failures', { userId, deviceType });
    } catch (error) {
      logger.error('Error resetting consecutive failures', { error, userId, deviceType });
      throw error;
    }
  }

  /**
   * Get users with failing syncs for manual intervention
   */
  async getFailingUsers(): Promise<any[]> {
    try {
      const [ouraFailing, appleWatchFailing, sleepNumberFailing] = await Promise.all([
        this.getFailingUsersForDevice('oura'),
        this.getFailingUsersForDevice('apple_watch'),
        this.getFailingUsersForDevice('sleep_number'),
      ]);

      return [...ouraFailing, ...appleWatchFailing, ...sleepNumberFailing];
    } catch (error) {
      logger.error('Error getting failing users', { error });
      return [];
    }
  }

  /**
   * Get failing users for a specific device
   */
  private async getFailingUsersForDevice(
    deviceType: 'oura' | 'apple_watch' | 'sleep_number'
  ): Promise<any[]> {
    try {
      const tableName = `${deviceType}_connections`;

      const { data, error } = await supabase
        .from(tableName)
        .select('user_id, consecutive_failures, last_error_message, last_sync_at')
        .gte('consecutive_failures', this.ALERT_THRESHOLD)
        .eq('auto_sync_enabled', true);

      if (error) throw error;

      return (data || []).map(user => ({
        ...user,
        deviceType,
      }));
    } catch (error) {
      logger.error(`Error getting failing users for ${deviceType}`, { error });
      return [];
    }
  }
}

export const deviceSyncMonitoringService = new DeviceSyncMonitoringService();
