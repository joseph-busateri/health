import { randomUUID } from 'crypto';

import type {
  NotificationRecord,
  NotificationScheduleRequest,
  NotificationStatus,
  NotificationStatusUpdate,
  UserNotificationSettings,
} from '../types/notificationState';

const notificationStore = new Map<string, NotificationRecord[]>();
const settingsStore = new Map<string, UserNotificationSettings>();

export const scheduleNotification = async (request: NotificationScheduleRequest): Promise<NotificationRecord> => {
  const record: NotificationRecord = {
    id: randomUUID(),
    userId: request.userId,
    type: request.type,
    status: 'scheduled',
    scheduledFor: request.scheduledFor,
    metadata: request.metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const history = notificationStore.get(request.userId) ?? [];
  notificationStore.set(request.userId, [record, ...history]);

  return record;
};

export const updateNotificationStatus = async (update: NotificationStatusUpdate): Promise<NotificationRecord | null> => {
  for (const [userId, records] of notificationStore.entries()) {
    const target = records.find(r => r.id === update.notificationId);
    if (target) {
      target.status = update.status;
      target.updatedAt = update.timestamp;

      if (update.status === 'sent') {
        target.sentAt = update.timestamp;
      } else if (update.status === 'opened') {
        target.openedAt = update.timestamp;
      } else if (update.status === 'missed') {
        target.missedAt = update.timestamp;
      }

      return target;
    }
  }
  return null;
};

export const getNotificationHistory = async (userId: string, limit = 30): Promise<NotificationRecord[]> => {
  const history = notificationStore.get(userId) ?? [];
  return history.slice(0, limit);
};

export const getPendingNotifications = async (userId: string): Promise<NotificationRecord[]> => {
  const history = notificationStore.get(userId) ?? [];
  return history.filter(r => r.status === 'scheduled');
};

export const getUserNotificationSettings = async (userId: string): Promise<UserNotificationSettings> => {
  const existing = settingsStore.get(userId);
  if (existing) {
    return existing;
  }

  const defaults: UserNotificationSettings = {
    userId,
    dailyCheckInEnabled: true,
    preferredReminderTime: '09:00',
    updatedAt: new Date().toISOString(),
  };

  settingsStore.set(userId, defaults);
  return defaults;
};

export const updateUserNotificationSettings = async (
  userId: string,
  updates: Partial<Pick<UserNotificationSettings, 'dailyCheckInEnabled' | 'preferredReminderTime'>>,
): Promise<UserNotificationSettings> => {
  const current = await getUserNotificationSettings(userId);

  const updated: UserNotificationSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  settingsStore.set(userId, updated);
  return updated;
};

export const scheduleDailyCheckIn = async (userId: string): Promise<NotificationRecord> => {
  const settings = await getUserNotificationSettings(userId);

  if (!settings.dailyCheckInEnabled) {
    throw new Error('Daily check-in notifications are disabled for this user.');
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [hours, minutes] = settings.preferredReminderTime.split(':').map(Number);
  tomorrow.setHours(hours, minutes, 0, 0);

  return scheduleNotification({
    userId,
    type: 'daily_check_in',
    scheduledFor: tomorrow.toISOString(),
    metadata: { preferredTime: settings.preferredReminderTime },
  });
};

export const scheduleMissedCheckInFollowUp = async (userId: string, originalNotificationId: string): Promise<NotificationRecord> => {
  const followUpTime = new Date();
  followUpTime.setHours(followUpTime.getHours() + 4);

  return scheduleNotification({
    userId,
    type: 'missed_check_in_follow_up',
    scheduledFor: followUpTime.toISOString(),
    metadata: { originalNotificationId },
  });
};
