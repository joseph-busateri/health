import { randomUUID } from 'crypto';

import type { ReminderCadence, ReminderRecord, ReminderType, ReminderListResponse } from '../types/reminder';

const CADENCE_BY_TYPE: Record<ReminderType, { cadence: ReminderCadence; intervalDays: number }> = {
  daily_check_in: { cadence: 'daily', intervalDays: 1 },
  weekly_sexual_health: { cadence: 'weekly', intervalDays: 7 },
  monthly_physique_scan: { cadence: 'monthly', intervalDays: 30 },
  quarterly_bloodwork: { cadence: 'quarterly', intervalDays: 90 },
};

const DEFAULT_REMINDERS: Array<{
  reminderType: ReminderType;
  title: string;
  description: string;
}> = [
  {
    reminderType: 'daily_check_in',
    title: 'Daily Check-In',
    description: 'Log your sleep, recovery, stress, and workout adherence today.',
  },
  {
    reminderType: 'weekly_sexual_health',
    title: 'Weekly Sexual Health Review',
    description: 'Reflect on sexual health habits and note any changes or concerns.',
  },
  {
    reminderType: 'monthly_physique_scan',
    title: 'Monthly Physique Scan',
    description: 'Capture a monthly physique scan to track foundational changes.',
  },
  {
    reminderType: 'quarterly_bloodwork',
    title: 'Quarterly Bloodwork',
    description: 'Schedule quarterly lab work to stay on top of biomarkers.',
  },
];

const addDays = (base: Date, days: number) => {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result;
};

const remindersStore = new Map<string, ReminderRecord[]>();

const isReminderDue = (reminder: ReminderRecord): boolean => {
  if (!reminder.isActive) {
    return false;
  }

  const dueDate = new Date(reminder.nextDueAt);
  const now = new Date();
  return dueDate.getTime() <= now.getTime();
};

const getCadenceConfig = (type: ReminderType) => {
  const config = CADENCE_BY_TYPE[type];
  if (!config) {
    throw new Error(`Unsupported reminder type: ${type}`);
  }
  return config;
};

export const getRemindersForUser = async (userId: string): Promise<ReminderListResponse> => {
  const reminders = remindersStore.get(userId) ?? [];
  const sorted = [...reminders].sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt));
  const dueReminders = sorted.filter(isReminderDue);

  return {
    reminders: sorted,
    dueReminders,
  };
};

export const completeReminder = async (userId: string, reminderId: string): Promise<ReminderRecord> => {
  const reminders = remindersStore.get(userId) ?? [];
  const index = reminders.findIndex((reminder) => reminder.id === reminderId);

  if (index === -1) {
    throw new Error('Reminder not found.');
  }

  const target = reminders[index];
  const cadenceConfig = getCadenceConfig(target.reminderType);

  const completedAt = new Date();
  const nextDueAt = addDays(completedAt, cadenceConfig.intervalDays);

  const updated: ReminderRecord = {
    ...target,
    lastCompletedAt: completedAt.toISOString(),
    nextDueAt: nextDueAt.toISOString(),
  };

  const updatedReminders = [...reminders];
  updatedReminders[index] = updated;
  remindersStore.set(userId, updatedReminders);

  return updated;
};

export const completeReminderByType = async (userId: string, reminderType: ReminderType): Promise<ReminderRecord | null> => {
  const reminders = remindersStore.get(userId) ?? [];
  const match = reminders.find((reminder) => reminder.reminderType === reminderType);

  if (!match) {
    return null;
  }

  return completeReminder(userId, match.id);
};

export const seedDefaultReminders = async (userId: string): Promise<ReminderListResponse> => {
  const existing = remindersStore.get(userId) ?? [];
  const existingTypes = new Set(existing.map((reminder) => reminder.reminderType));

  const nowIso = new Date().toISOString();
  const newReminders: ReminderRecord[] = DEFAULT_REMINDERS
    .filter((reminder) => !existingTypes.has(reminder.reminderType))
    .map((reminder) => {
      const cadenceConfig = getCadenceConfig(reminder.reminderType);
      return {
        id: randomUUID(),
        userId,
        reminderType: reminder.reminderType,
        title: reminder.title,
        description: reminder.description,
        cadence: cadenceConfig.cadence,
        nextDueAt: nowIso,
        lastCompletedAt: undefined,
        isActive: true,
        createdAt: nowIso,
      };
    });

  const updatedReminders = existing.concat(newReminders);
  remindersStore.set(userId, updatedReminders);

  return getRemindersForUser(userId);
};
