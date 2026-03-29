// Oura Ring Automatic Sync Cron Job
// Runs daily at 6 AM to trigger automatic sync for all connected users

import cron from 'node-cron';
import { ouraSyncService } from '../services/ouraSyncService';
import { logger } from '../utils/logger';

/**
 * Schedule automatic Oura Ring sync
 * Runs every day at 6:00 AM
 */
export function scheduleOuraSync() {
  // Run at 6:00 AM every day
  cron.schedule('0 6 * * *', async () => {
    logger.info('Starting scheduled Oura Ring sync job');
    
    try {
      await ouraSyncService.runAutomaticSync();
      logger.info('Scheduled Oura Ring sync job completed successfully');
    } catch (error) {
      logger.error('Error in scheduled Oura Ring sync job', { error });
    }
  });

  logger.info('Oura Ring sync cron job scheduled (daily at 6:00 AM)');
}

/**
 * Initialize Oura Ring cron jobs
 */
export function initializeOuraCronJobs() {
  scheduleOuraSync();
  logger.info('Oura Ring cron jobs initialized');
}
