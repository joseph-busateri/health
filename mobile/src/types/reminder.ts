export type ReminderType =
  | 'daily_check_in'
  | 'weekly_sexual_health'
  | 'monthly_physique_scan'
  | 'quarterly_bloodwork';

export type ReminderCadence = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface Reminder {
  id: string;
  userId: string;
  reminderType: ReminderType;
  title: string;
  description: string;
  cadence: ReminderCadence;
  nextDueAt: string;
  lastCompletedAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ReminderListResponse {
  reminders: Reminder[];
  dueReminders: Reminder[];
}
