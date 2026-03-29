import { Router } from 'express';

import {
  getNotificationHistoryHandler,
  getPendingNotificationsHandler,
  getUserNotificationSettingsHandler,
  scheduleDailyCheckInHandler,
  scheduleMissedCheckInFollowUpHandler,
  updateNotificationStatusHandler,
  updateUserNotificationSettingsHandler,
} from '../controllers/notificationStateController';

const router = Router();

// GET /notifications/:user_id/history - Get notification history
router.get('/notifications/:user_id/history', getNotificationHistoryHandler);

// GET /notifications/:user_id/pending - Get pending notifications
router.get('/notifications/:user_id/pending', getPendingNotificationsHandler);

// PUT /notifications/:notification_id/status - Update notification status
router.put('/notifications/:notification_id/status', updateNotificationStatusHandler);

// GET /notifications/:user_id/settings - Get user notification settings
router.get('/notifications/:user_id/settings', getUserNotificationSettingsHandler);

// PUT /notifications/:user_id/settings - Update user notification settings
router.put('/notifications/:user_id/settings', updateUserNotificationSettingsHandler);

// POST /notifications/:user_id/schedule-daily-check-in - Schedule daily check-in
router.post('/notifications/:user_id/schedule-daily-check-in', scheduleDailyCheckInHandler);

// POST /notifications/:user_id/schedule-missed-follow-up - Schedule missed check-in follow-up
router.post('/notifications/:user_id/schedule-missed-follow-up', scheduleMissedCheckInFollowUpHandler);

export default router;
