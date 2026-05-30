// Apple Watch Automatic Sync Cron Job
// Runs daily at 6 AM to trigger automatic sync for all connected users

import cron from 'node-cron';
import { appleWatchSyncService } from '../services/appleWatchSyncService';
import { logger } from '../utils/logger';

/**
 * Schedule automatic Apple Watch sync
 * Runs every day at 6:00 AM
 */
export function scheduleAppleWatchSync() {
  // Run at 6:00 AM every day
  cron.schedule('0 6 * * *', async () => {
    logger.info('Starting scheduled Apple Watch sync job');
    
    try {
      await appleWatchSyncService.syncAllUsers();
      logger.info('Scheduled Apple Watch sync job completed successfully');
    } catch (error) {
      logger.error('Error in scheduled Apple Watch sync job', { error });
    }
  });

  logger.info('Apple Watch sync cron job scheduled (daily at 6:00 AM)');
}

/**
 * Schedule hourly sync check (for users with hourly sync enabled)
 * Runs every hour
 */
export function scheduleAppleWatchHourlySync() {
  // Run at the top of every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Starting hourly Apple Watch sync check');
    
    try {
      await appleWatchSyncService.syncAllUsers();
      logger.info('Hourly Apple Watch sync check completed');
    } catch (error) {
      logger.error('Error in hourly Apple Watch sync check', { error });
    }
  });

  logger.info('Apple Watch hourly sync check scheduled');
}

/**
 * Initialize all Apple Watch cron jobs
 */
export function initializeAppleWatchCronJobs() {
  scheduleAppleWatchSync();
  scheduleAppleWatchHourlySync();
  logger.info('All Apple Watch cron jobs initialized');
}
