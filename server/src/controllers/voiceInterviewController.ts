import { Request, Response } from 'express';
import { buildInterviewContext } from '../services/interviewContextService';
import { saveInterviewToDatabase } from '../services/interviewContextService';
import {
  startVoiceInterviewSession,
  processVoiceResponse,
  recordVoiceAnswer,
  completeVoiceInterviewSession,
  getVoiceInterviewSession,
} from '../services/voiceInterviewService';
import {
  scheduleVoiceInterviewNotification,
  sendVoiceInterviewNotification,
} from '../services/notificationService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for audio file uploads
const upload = multer({
  dest: 'uploads/audio/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

export const uploadAudio = upload.single('audio');

/**
 * POST /api/voice-interview/start
 * Start a new voice interview session
 */
export const startVoiceInterview = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Build interview context from all data sources
    const context = await buildInterviewContext(userId);

    // Start voice interview session
    const { sessionId, firstQuestion, audioBuffer } = await startVoiceInterviewSession(userId, context);

    // Save audio to temporary file if available
    let audioUrl = null;
    if (audioBuffer) {
      try {
        const audioFilename = `${sessionId}_q1.mp3`;
        const audioPath = path.join('uploads', 'audio', audioFilename);
        fs.writeFileSync(audioPath, audioBuffer);
        audioUrl = `/audio/${audioFilename}`;
      } catch (audioError) {
        console.error('Error saving audio:', audioError);
        // Continue without audio
      }
    }

    res.json({
      sessionId,
      firstQuestion,
      audioUrl,
    });
  } catch (error) {
    console.error('Error starting voice interview:', error);
    res.status(500).json({ error: 'Failed to start voice interview' });
  }
};

/**
 * POST /api/voice-interview/respond
 * Submit voice response and get next question
 */
export const submitVoiceResponse = async (req: Request, res: Response) => {
  try {
    const { userId, sessionId, currentQuestion } = req.body;
    const audioFile = req.file;

    if (!userId || !sessionId || !audioFile || !currentQuestion) {
      return res.status(400).json({ error: 'userId, sessionId, currentQuestion, and audio file are required' });
    }

    // Build context
    const context = await buildInterviewContext(userId);

    // Process voice response with enhanced dynamic question generation
    const result = await processVoiceResponse(sessionId, audioFile.path, context, currentQuestion);

    // Save audio for next question
    const audioFilename = `${sessionId}_q${Date.now()}.mp3`;
    const audioPath = path.join('uploads', 'audio', audioFilename);
    fs.writeFileSync(audioPath, result.audioBuffer);

    // Clean up uploaded file
    fs.unlinkSync(audioFile.path);

    res.json({
      nextQuestion: result.nextQuestion,
      audioUrl: `/audio/${audioFilename}`,
      isFinalQuestion: result.isFinalQuestion,
      isComplete: result.isComplete,
      transcript: result.transcript,
    });
  } catch (error) {
    console.error('Error processing voice response:', error);
    res.status(500).json({ error: 'Failed to process voice response' });
  }
};

/**
 * POST /api/voice-interview/complete
 * Complete voice interview and save data
 */
export const completeVoiceInterview = async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'userId and sessionId are required' });
    }

    // Complete session (now async with database persistence)
    const session = await completeVoiceInterviewSession(sessionId);

    // Save interview data to database
    await saveInterviewToDatabase(
      userId,
      sessionId,
      session.conversationHistory,
      {
        recovery: true,
        stress: true,
        workout: true,
        nutrition: true,
        supplements: true,
      }
    );

    res.json({
      success: true,
      extractedData: {
        totalQuestions: session.conversationHistory.length,
        duration: session.totalTimeElapsed,
      },
      saved: true,
    });
  } catch (error) {
    console.error('Error completing voice interview:', error);
    res.status(500).json({ error: 'Failed to complete voice interview' });
  }
};

/**
 * POST /api/notifications/schedule
 * Schedule daily voice interview notification
 */
export const scheduleNotification = async (req: Request, res: Response) => {
  try {
    const { userId, preferredTime } = req.body;

    if (!userId || !preferredTime) {
      return res.status(400).json({ error: 'userId and preferredTime are required' });
    }

    const result = await scheduleVoiceInterviewNotification(userId, preferredTime);

    res.json(result);
  } catch (error) {
    console.error('Error scheduling notification:', error);
    res.status(500).json({ error: 'Failed to schedule notification' });
  }
};

/**
 * POST /api/notifications/send
 * Send voice interview notification (called by scheduled job)
 */
export const sendNotification = async (req: Request, res: Response) => {
  try {
    const { userId, expoPushToken } = req.body;

    if (!userId || !expoPushToken) {
      return res.status(400).json({ error: 'userId and expoPushToken are required' });
    }

    await sendVoiceInterviewNotification(userId, expoPushToken);

    res.json({ sent: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

/**
 * GET /api/voice-interview/session/:sessionId
 * Get voice interview session details
 */
export const getSessionDetails = async (req: Request, res: Response) => {
  try {
    const sessionId = Array.isArray(req.params.sessionId) 
      ? req.params.sessionId[0] 
      : req.params.sessionId;

    const session = getVoiceInterviewSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error getting session details:', error);
    res.status(500).json({ error: 'Failed to get session details' });
  }
};
