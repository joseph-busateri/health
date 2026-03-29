import type { NextFunction, Request, Response } from 'express';

import {
  createOrRefreshDailyInterviewSession,
  getTodayInterviewSession,
  submitInterviewSession,
} from '../services/interviewAgentService';
import { getEngineSnapshot } from '../services/engineStateService';
import type { InterviewSubmissionInput } from '../types/interviewAgent';

const requiredUserId = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('user_id is required');
  }
  return value;
};

export const triggerDailyInterviewNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requiredUserId(req.params.user_id);
    const session = await createOrRefreshDailyInterviewSession(userId);
    res.status(201).json({ success: true, session });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const getTodayInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requiredUserId(req.params.user_id);
    const session = await getTodayInterviewSession(userId);
    const engineSnapshot = await getEngineSnapshot(userId);

    res.json({
      success: true,
      session,
      engineSnapshot,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const submitInterviewResponsesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawSessionId = req.params.session_id;
    const sessionId = typeof rawSessionId === 'string'
      ? rawSessionId
      : Array.isArray(rawSessionId) && typeof rawSessionId[0] === 'string'
        ? rawSessionId[0]
        : undefined;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'session_id is required' });
    }

    const userId = requiredUserId(req.body?.user_id);
    const submission: InterviewSubmissionInput = {
      primaryResponse: typeof req.body?.primary_response === 'string' ? req.body.primary_response : undefined,
      followUpResponse: typeof req.body?.follow_up_response === 'string' ? req.body.follow_up_response : undefined,
      workout: req.body?.workout,
      supplement: req.body?.supplement,
      recoveryCluster: req.body?.recovery_cluster,
    };

    const result = await submitInterviewSession(userId, sessionId, submission);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};
