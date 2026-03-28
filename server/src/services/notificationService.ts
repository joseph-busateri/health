import { logger } from '../utils/logger';

export type BloodworkNotificationType = 'complete' | 'failed';

interface BloodworkNotificationPayload {
  documentId: string;
  errorMessage?: string;
}

/**
 * Phase 1 notification helper (local notifications handled on client).
 * For now we simply log the notification event so the frontend can
 * poll the status endpoint or subscribe later when push infrastructure exists.
 */
export async function sendBloodworkProcessingNotification(
  userId: string,
  type: BloodworkNotificationType,
  payload: BloodworkNotificationPayload
): Promise<void> {
  logger.info('Bloodwork processing notification', {
    userId,
    type,
    payload,
  });
}
