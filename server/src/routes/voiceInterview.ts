import express from 'express';
import {
  startVoiceInterview,
  submitVoiceResponse,
  completeVoiceInterview,
  scheduleNotification,
  sendNotification,
  getSessionDetails,
  uploadAudio,
} from '../controllers/voiceInterviewController';

const router = express.Router();

/**
 * Voice Interview Routes
 */

// Start new voice interview session
router.post('/start', startVoiceInterview);

// Submit voice response and get next question
router.post('/respond', uploadAudio, submitVoiceResponse);

// Complete interview and save data
router.post('/complete', completeVoiceInterview);

// Get session details
router.get('/session/:sessionId', getSessionDetails);

/**
 * Notification Routes
 */

// Schedule daily notification
router.post('/notifications/schedule', scheduleNotification);

// Send notification (called by scheduled job)
router.post('/notifications/send', sendNotification);

export default router;
