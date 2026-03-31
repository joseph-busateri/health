import type { Request, Response, NextFunction } from 'express';
import {
  startInterviewSession,
  selectNextQuestion,
  recordAnswer,
  shouldContinueInterview,
  completeInterviewSession,
  getInterviewSession,
  type InterviewContext,
} from '../services/hybridInterviewService';
import {
  buildInterviewContext,
  saveInterviewToDatabase,
} from '../services/interviewContextService';

export const startInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = typeof req.params.user_id === 'string' ? req.params.user_id : req.params.user_id?.[0];
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const session = startInterviewSession(userId);

    // Build real context from database
    const context: InterviewContext = await buildInterviewContext(userId);
    const firstQuestion = await selectNextQuestion(context, []);

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        question: firstQuestion,
        timeRemaining: 180,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = typeof req.params.session_id === 'string' ? req.params.session_id : req.params.session_id?.[0];
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'session_id is required' });
    }

    const { question_id, question, answer, category, context } = req.body;

    if (!question_id || !question || !answer || !category) {
      return res.status(400).json({
        success: false,
        error: 'question_id, question, answer, and category are required',
      });
    }

    const session = recordAnswer(sessionId, question_id, question, answer, category);

    const shouldContinue = shouldContinueInterview(session);

    if (!shouldContinue) {
      const completedSession = completeInterviewSession(sessionId);
      
      // Save interview data to database
      await saveInterviewToDatabase(
        completedSession.userId,
        completedSession.sessionId,
        completedSession.conversationHistory,
        completedSession.signalCollected
      );
      
      return res.json({
        success: true,
        data: {
          isComplete: true,
          session: completedSession,
          summary: {
            totalQuestions: completedSession.conversationHistory.length,
            totalTime: completedSession.totalTimeElapsed,
            signalCollected: completedSession.signalCollected,
          },
        },
      });
    }

    // Build fresh context for next question
    const interviewContext: InterviewContext = await buildInterviewContext(session.userId);
    const nextQuestion = await selectNextQuestion(interviewContext, session.conversationHistory);

    const timeRemaining = 180 - session.totalTimeElapsed;

    res.json({
      success: true,
      data: {
        isComplete: false,
        nextQuestion,
        timeRemaining,
        questionsAsked: session.conversationHistory.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = typeof req.params.session_id === 'string' ? req.params.session_id : req.params.session_id?.[0];
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'session_id is required' });
    }

    const session = getInterviewSession(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

export const completeInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = typeof req.params.session_id === 'string' ? req.params.session_id : req.params.session_id?.[0];
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'session_id is required' });
    }

    const session = completeInterviewSession(sessionId);

    res.json({
      success: true,
      data: {
        session,
        summary: {
          totalQuestions: session.conversationHistory.length,
          totalTime: session.totalTimeElapsed,
          signalCollected: session.signalCollected,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
