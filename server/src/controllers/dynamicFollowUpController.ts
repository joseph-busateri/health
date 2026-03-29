import { Request, Response } from 'express';

import {
  completeInterviewSession,
  determineFollowUp,
  finalizeInterview,
  generateNextQuestion,
  getInterviewSession,
  identifyBranchingScenario,
  recordResponse,
  startInterviewSession,
} from '../services/dynamicFollowUpService';
import { enrichInterviewContext } from '../services/interviewContextAggregator';
import { logger } from '../utils/logger';

export const startInterviewHandler = async (req: Request, res: Response) => {
  try {
    const { userId, context, ...restBody } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const partialContext = context ?? restBody;
    
    // Only aggregate context if no explicit context was provided
    const shouldAggregate = !context && Object.keys(restBody).length === 0;
    const interviewContext = shouldAggregate 
      ? await enrichInterviewContext(userId, {})
      : partialContext;
    
    const state = await startInterviewSession(userId, interviewContext);
    const firstQuestion = await generateNextQuestion(interviewContext, state);

    res.status(200).json({
      success: true,
      data: {
        sessionId: state.sessionId,
        firstQuestion,
      },
    });
  } catch (error) {
    logger.error('Failed to start interview', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to start interview',
      details: (error as Error).message,
    });
  }
};

export const submitResponseHandler = async (req: Request, res: Response) => {
  try {
    const { session_id: sessionId } = req.params;
    const { questionId, question, answer, context } = req.body;

    if (!sessionId || !questionId || !answer) {
      return res.status(400).json({ error: 'Missing required parameters: sessionId, questionId, answer' });
    }

    const updatedState = await recordResponse(
      Array.isArray(sessionId) ? sessionId[0] : sessionId,
      questionId,
      question,
      answer,
    );

    const lastResponse = { questionId, answer };
    const branchingScenario = identifyBranchingScenario(context ?? {}, lastResponse);

    if (branchingScenario) {
      updatedState.branchingPath.push(branchingScenario);
    }

    const followUpDecision = await determineFollowUp(context ?? {}, updatedState, lastResponse);

    res.status(200).json({
      success: true,
      data: {
        state: updatedState,
        followUpDecision,
        branchingScenario,
      },
    });
  } catch (error) {
    logger.error('Failed to submit response', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to submit response',
      details: (error as Error).message,
    });
  }
};

export const getNextQuestionHandler = async (req: Request, res: Response) => {
  try {
    const { session_id: sessionId } = req.params;
    const { context } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing required parameter: sessionId' });
    }

    const state = await getInterviewSession(Array.isArray(sessionId) ? sessionId[0] : sessionId);
    if (!state) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    const nextQuestion = await generateNextQuestion(context ?? {}, state);

    res.status(200).json({
      success: true,
      data: {
        nextQuestion,
        questionsAsked: state.questionsAsked.length,
        signalCollected: state.signalCollected,
      },
    });
  } catch (error) {
    logger.error('Failed to get next question', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get next question',
      details: (error as Error).message,
    });
  }
};

export const finalizeInterviewHandler = async (req: Request, res: Response) => {
  try {
    const { session_id: sessionId } = req.params;
    const { context, reason } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing required parameter: sessionId' });
    }

    const state = await getInterviewSession(Array.isArray(sessionId) ? sessionId[0] : sessionId);
    if (!state) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    const summary = await finalizeInterview(context ?? {}, state);
    await completeInterviewSession(Array.isArray(sessionId) ? sessionId[0] : sessionId, reason ?? 'user_ended');

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Failed to finalize interview', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to finalize interview',
      details: (error as Error).message,
    });
  }
};

export const getInterviewStateHandler = async (req: Request, res: Response) => {
  try {
    const { session_id: sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing required parameter: sessionId' });
    }

    const state = await getInterviewSession(Array.isArray(sessionId) ? sessionId[0] : sessionId);
    if (!state) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    res.status(200).json({
      success: true,
      data: state,
    });
  } catch (error) {
    logger.error('Failed to get interview state', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get interview state',
      details: (error as Error).message,
    });
  }
};
