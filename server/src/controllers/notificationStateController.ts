import { Request, Response } from 'express';

import {
  getNotificationHistory,
  getPendingNotifications,
  getUserNotificationSettings,
  scheduleDailyCheckIn,
  scheduleMissedCheckInFollowUp,
  updateNotificationStatus,
  updateUserNotificationSettings,
} from '../services/notificationStateService';
import { logger } from '../utils/logger';

export const getNotificationHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const data = await getNotificationHistory(Array.isArray(userId) ? userId[0] : userId, limit);

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get notification history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get notification history',
      details: (error as Error).message,
    });
  }
};

export const getPendingNotificationsHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getPendingNotifications(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get pending notifications', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get pending notifications',
      details: (error as Error).message,
    });
  }
};

export const updateNotificationStatusHandler = async (req: Request, res: Response) => {
  try {
    const { notification_id: notificationId } = req.params;
    const { status, timestamp } = req.body;

    if (!notificationId || !status) {
      return res.status(400).json({ error: 'Missing required parameters: notification_id, status' });
    }

    const data = await updateNotificationStatus({
      notificationId: Array.isArray(notificationId) ? notificationId[0] : notificationId,
      status,
      timestamp: timestamp ?? new Date().toISOString(),
    });

    if (!data) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to update notification status', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to update notification status',
      details: (error as Error).message,
    });
  }
};

export const getUserNotificationSettingsHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getUserNotificationSettings(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get notification settings', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get notification settings',
      details: (error as Error).message,
    });
  }
};

export const updateUserNotificationSettingsHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const { dailyCheckInEnabled, preferredReminderTime } = req.body;
    const data = await updateUserNotificationSettings(Array.isArray(userId) ? userId[0] : userId, {
      dailyCheckInEnabled,
      preferredReminderTime,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to update notification settings', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to update notification settings',
      details: (error as Error).message,
    });
  }
};

export const scheduleDailyCheckInHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await scheduleDailyCheckIn(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to schedule daily check-in', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to schedule daily check-in',
      details: (error as Error).message,
    });
  }
};

export const scheduleMissedCheckInFollowUpHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    const { original_notification_id: originalNotificationId } = req.body;

    if (!userId || !originalNotificationId) {
      return res.status(400).json({ error: 'Missing required parameters: user_id, original_notification_id' });
    }

    const data = await scheduleMissedCheckInFollowUp(
      Array.isArray(userId) ? userId[0] : userId,
      originalNotificationId,
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to schedule missed check-in follow-up', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to schedule missed check-in follow-up',
      details: (error as Error).message,
    });
  }
};
