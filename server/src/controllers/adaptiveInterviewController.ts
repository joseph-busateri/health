/**
 * Phase 25: Adaptive Interview Controller
 * 
 * Purpose: API endpoints for adaptive interview functionality
 * Features: Profile management, question generation, effectiveness tracking
 */

import { Request, Response } from 'express';
import { getOrCreateProfile, updateProfileAfterInterview, getMissingDataCategories } from '../services/userInterviewProfileService';
import { analyzeDataGaps } from '../services/dataGapAnalysisService';
import { generateAdaptiveQuestions } from '../services/adaptiveQuestionService';
import { getQuestionEffectiveness, trackQuestionAsked, trackQuestionAnswered, trackQuestionSkipped } from '../services/questionEffectivenessService';
import { logger } from '../utils/logger';

// ============================================================================
// USER PROFILE
// ============================================================================

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    logger.info('📖 [ADAPTIVE INTERVIEW API] Getting user profile', { userId });

    const profile = await getOrCreateProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    return res.json({
      success: true,
      profile,
    });
  } catch (error) {
    logger.error('❌ [ADAPTIVE INTERVIEW API] Failed to get profile', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
    });
  }
};

// ============================================================================
// DATA GAPS
// ============================================================================

export const getDataGaps = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    logger.info('🔍 [ADAPTIVE INTERVIEW API] Analyzing data gaps', { userId });

    const analysis = await analyzeDataGaps(userId);

    return res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    logger.error('❌ [ADAPTIVE INTERVIEW API] Failed to analyze data gaps', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze data gaps',
    });
  }
};

export const getMissingCategories = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    logger.info('📋 [ADAPTIVE INTERVIEW API] Getting missing categories', { userId });

    const categories = await getMissingDataCategories(userId);

    return res.json({
      success: true,
      missingCategories: categories,
      count: categories.length,
    });
  } catch (error) {
    logger.error('❌ [ADAPTIVE INTERVIEW API] Failed to get missing categories', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to get missing categories',
    });
  }
};

// ============================================================================
// ADAPTIVE QUESTIONS
// ============================================================================

export const getAdaptiveQuestions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const maxQuestions = parseInt(req.query.maxQuestions as string) || 10;

    logger.info('🎯 [ADAPTIVE INTERVIEW API] Generating adaptive questions', {
      userId,
      maxQuestions,
    });

    const questionSet = await generateAdaptiveQuestions(userId, maxQuestions);

    return res.json({
      success: true,
      questionSet,
    });
  } catch (error) {
    logger.error('❌ [ADAPTIVE INTERVIEW API] Failed to generate questions', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to generate adaptive questions',
    });
  }
};

// ============================================================================
// QUESTION EFFECTIVENESS
// ============================================================================

export const getEffectiveness = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const questionId = req.query.questionId as string;

    logger.info('📊 [ADAPTIVE INTERVIEW API] Getting question effectiveness', {
      userId,
      questionId,
    });

    const effectiveness = await getQuestionEffectiveness(userId, questionId);

    return res.json({
      success: true,
      effectiveness,
      count: effectiveness.length,
    });
  } catch (error) {
    logger.error('❌ [ADAPTIVE INTERVIEW API] Failed to get effectiveness', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to get question effectiveness',
    });
  }
};

export const trackQuestion = async (req: Request, res: Response) => {
  try {
    const { action } = req.body;
    const { userId, questionId, questionText, category, responseQuality, confidence } = req.body;

    logger.info('📝 [ADAPTIVE INTERVIEW API] Tracking question', {
      userId,
      questionId,
      action,
    });

    let success = false;

    switch (action) {
      case 'asked':
        success = await trackQuestionAsked(userId, questionId, questionText, category);
        break;
      case 'answered':
        success = await trackQuestionAnswered(userId, questionId, responseQuality, confidence);
        break;
      case 'skipped':
        success = await trackQuestionSkipped(userId, questionId);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
        });
    }

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to track question',
      });
    }

    return res.json({
      success: true,
      message: `Question ${action} tracked successfully`,
    });
  } catch (error) {
    logger.error('❌ [ADAPTIVE INTERVIEW API] Failed to track question', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to track question',
    });
  }
};

// ============================================================================
// INTERVIEW SESSION
// ============================================================================

export const completeInterview = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { questionsAnswered, questionsSkipped, durationSeconds } = req.body;

    logger.info('✅ [ADAPTIVE INTERVIEW API] Completing interview session', {
      userId,
      questionsAnswered,
      questionsSkipped,
      durationSeconds,
    });

    const success = await updateProfileAfterInterview(userId, {
      questionsAnswered,
      questionsSkipped,
      durationSeconds,
    });

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile',
      });
    }

    return res.json({
      success: true,
      message: 'Interview session completed',
    });
  } catch (error) {
    logger.error('❌ [ADAPTIVE INTERVIEW API] Failed to complete interview', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to complete interview session',
    });
  }
};

// ============================================================================
// INSIGHTS
// ============================================================================

export const getInsights = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    logger.info('💡 [ADAPTIVE INTERVIEW API] Getting interview insights', { userId });

    const profile = await getOrCreateProfile(userId);
    const dataGaps = await analyzeDataGaps(userId);
    const effectiveness = await getQuestionEffectiveness(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    const insights = {
      profile: {
        totalInterviews: profile.totalInterviews,
        engagementScore: profile.engagementScore,
        skipRate: profile.skipRate,
        optimalLength: profile.optimalInterviewLength,
      },
      dataCompleteness: {
        overall: dataGaps.overallCompleteness,
        byCategory: profile.dataCompleteness,
        criticalGaps: dataGaps.criticalGaps.length,
      },
      frequentTopics: profile.frequentTopics.slice(0, 5),
      questionPerformance: {
        totalTracked: effectiveness.length,
        avgQuality: effectiveness.reduce((sum, e) => sum + (e.avgResponseQuality || 0), 0) / effectiveness.length || 0,
      },
    };

    return res.json({
      success: true,
      insights,
    });
  } catch (error) {
    logger.error('❌ [ADAPTIVE INTERVIEW API] Failed to get insights', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to get interview insights',
    });
  }
};
