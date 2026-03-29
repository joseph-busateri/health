import { logger } from '../utils/logger';

export type BloodworkNotificationType = 'complete' | 'failed';
export type InterviewNotificationType = 'daily_prompt_ready';

interface BloodworkNotificationPayload {
  documentId: string;
  errorMessage?: string;
}

interface DailyInterviewNotificationPayload {
  sessionId: string;
  date: string;
  primaryPrompt: string;
  followUpPrompt?: string;
  dynamicQuestions: string[];
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

export async function sendDailyInterviewNotification(
  userId: string,
  payload: DailyInterviewNotificationPayload
): Promise<void> {
  const type: InterviewNotificationType = 'daily_prompt_ready';

  logger.info('Daily interview notification', {
    userId,
    type,
    payload,
  });
}
