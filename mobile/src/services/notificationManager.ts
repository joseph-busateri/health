import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import api from './api';

export interface ScheduleNotificationParams {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  trigger: Date | { hour: number; minute: number; repeats: boolean };
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

export const scheduleLocalNotification = async (params: ScheduleNotificationParams): Promise<string> => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    throw new Error('Notification permissions not granted');
  }

  const trigger =
    params.trigger instanceof Date
      ? params.trigger
      : {
          hour: params.trigger.hour,
          minute: params.trigger.minute,
          repeats: params.trigger.repeats,
        };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data ?? {},
    },
    trigger,
  });

  return notificationId;
};

export const cancelNotification = async (notificationId: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const scheduleDailyCheckInNotification = async (
  userId: string,
  preferredTime: string,
): Promise<string> => {
  const [hours, minutes] = preferredTime.split(':').map(Number);

  const notificationId = await scheduleLocalNotification({
    title: 'Daily Health Check-In',
    body: 'Share how you\'re feeling today to get personalized insights.',
    data: {
      type: 'daily_check_in',
      userId,
      screen: 'Agent',
    },
    trigger: {
      hour: hours,
      minute: minutes,
      repeats: true,
    },
  });

  await api.post(`/notifications/${userId}/schedule-daily-check-in`);

  return notificationId;
};

export const scheduleMissedCheckInFollowUp = async (
  userId: string,
  originalNotificationId: string,
): Promise<string> => {
  const followUpTime = new Date();
  followUpTime.setHours(followUpTime.getHours() + 4);

  const notificationId = await scheduleLocalNotification({
    title: 'Quick Check-In Reminder',
    body: 'A 2-minute check-in helps keep your health plan on track.',
    data: {
      type: 'missed_check_in_follow_up',
      userId,
      originalNotificationId,
      screen: 'Agent',
    },
    trigger: followUpTime,
  });

  await api.post(`/notifications/${userId}/schedule-missed-follow-up`, {
    original_notification_id: originalNotificationId,
  });

  return notificationId;
};

export const updateNotificationStatus = async (
  notificationId: string,
  status: 'sent' | 'opened' | 'missed',
): Promise<void> => {
  await api.put(`/notifications/${notificationId}/status`, {
    status,
    timestamp: new Date().toISOString(),
  });
};

export const setupNotificationResponseListener = (
  onNotificationTap: (data: Record<string, unknown>) => void,
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    onNotificationTap(data);
  });
};
