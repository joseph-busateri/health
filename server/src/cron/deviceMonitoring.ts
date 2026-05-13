// Device Sync Monitoring Cron Job
// Runs every hour to check for sync failures and send alerts

import cron from 'node-cron';
import { deviceSyncMonitoringService } from '../services/deviceSyncMonitoringService';
import { logger } from '../utils/logger';

export function initializeDeviceMonitoringCronJob() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running device sync monitoring check');
      await deviceSyncMonitoringService.monitorAllDevices();
      logger.info('Device sync monitoring check completed');
    } catch (error) {
      logger.error('Error in device monitoring cron job', { error });
    }
  });

  logger.info('Device monitoring cron job initialized (runs hourly)');
}
