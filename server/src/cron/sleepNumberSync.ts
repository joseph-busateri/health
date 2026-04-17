// Sleep Number Automatic Sync Cron Job
// Runs daily at 6 AM to trigger automatic sync for all connected users

import cron from 'node-cron';
import { sleepNumberSyncService } from '../services/sleepNumberSyncService';
import { logger } from '../utils/logger';

/**
 * Schedule automatic Sleep Number sync
 * Runs every day at 6:00 AM UTC
 */
export function scheduleSleepNumberSync() {
  // Run at 6:00 AM every day
  cron.schedule('0 6 * * *', async () => {
    logger.info('Starting scheduled Sleep Number sync job');
    
    try {
      await sleepNumberSyncService.runAutomaticSync();
      logger.info('Scheduled Sleep Number sync job completed successfully');
    } catch (error) {
      logger.error('Error in scheduled Sleep Number sync job', { error });
    }
  });

  logger.info('Sleep Number sync cron job scheduled (daily at 6:00 AM UTC)');
}

/**
 * Initialize Sleep Number cron jobs
 */
export function initializeSleepNumberCronJobs() {
  scheduleSleepNumberSync();
  logger.info('Sleep Number cron jobs initialized');
}
