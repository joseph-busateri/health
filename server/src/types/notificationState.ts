export type NotificationStatus = 'scheduled' | 'sent' | 'opened' | 'missed';
export type NotificationType = 'daily_check_in' | 'missed_check_in_follow_up';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  status: NotificationStatus;
  scheduledFor: string;
  sentAt?: string;
  openedAt?: string;
  missedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserNotificationSettings {
  userId: string;
  dailyCheckInEnabled: boolean;
  preferredReminderTime: string;
  updatedAt: string;
}

export interface NotificationScheduleRequest {
  userId: string;
  type: NotificationType;
  scheduledFor: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationStatusUpdate {
  notificationId: string;
  status: NotificationStatus;
  timestamp: string;
}
