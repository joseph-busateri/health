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

interface VoiceInterviewNotificationPayload {
  title: string;
  body: string;
  data: {
    screen: string;
    action: string;
  };
}

/**
 * Send push notification for voice interview
 * Uses Expo Push Notification Service
 */
export async function sendVoiceInterviewNotification(
  userId: string,
  expoPushToken: string
): Promise<void> {
  const payload: VoiceInterviewNotificationPayload = {
    title: 'Time for your daily check-in!',
    body: 'Tap to start your 5-minute health conversation',
    data: {
      screen: 'VoiceInterview',
      action: 'start',
    },
  };

  logger.info('Voice interview notification', {
    userId,
    expoPushToken,
    payload,
  });

  // TODO: Integrate with Expo Push Notification Service
  // const message = {
  //   to: expoPushToken,
  //   sound: 'default',
  //   title: payload.title,
  //   body: payload.body,
  //   data: payload.data,
  // };
  // await fetch('https://exp.host/--/api/v2/push/send', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(message),
  // });
}

/**
 * Schedule daily voice interview notification
 */
export async function scheduleVoiceInterviewNotification(
  userId: string,
  preferredTime: string // "08:00" format
): Promise<{ scheduled: boolean; nextNotificationTime: string }> {
  logger.info('Scheduling voice interview notification', {
    userId,
    preferredTime,
  });

  // TODO: Implement scheduling logic with cron or similar
  // For now, just log the intent
  const [hours, minutes] = preferredTime.split(':');
  const nextNotification = new Date();
  nextNotification.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  if (nextNotification < new Date()) {
    nextNotification.setDate(nextNotification.getDate() + 1);
  }

  return {
    scheduled: true,
    nextNotificationTime: nextNotification.toISOString(),
  };
}
