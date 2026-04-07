/**
 * RecommendationEngine Controller
 * 
 * HTTP handlers for the central recommendation engine.
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import {
  createRecommendation,
  batchCreateRecommendations,
  getActiveRecommendations,
  getPrioritizedRecommendations,
  acceptRecommendation,
  rejectRecommendation,
  snoozeRecommendation,
  completeRecommendation,
  modifyRecommendation,
} from '../services/recommendationEngineService';
import type {
  RecommendationRequest,
  CreateRecommendationInput,
  BatchCreateRecommendationsInput,
  AcceptRecommendationInput,
  RejectRecommendationInput,
  SnoozeRecommendationInput,
  CompleteRecommendationInput,
  ModifyRecommendationInput,
} from '../types/recommendationEngine';

// ============================================================================
// CREATE RECOMMENDATION
// ============================================================================

/**
 * POST /recommendations
 * Create a single recommendation from an engine request
 */
export async function createRecommendationHandler(req: Request, res: Response) {
  try {
    const { userId, request } = req.body as {
      userId: string;
      request: RecommendationRequest;
    };
    
    if (!userId || !request) {
      return res.status(400).json({
        error: 'Missing required fields: userId, request',
      });
    }
    
    const result = await createRecommendation({ userId, request });
    
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to create recommendation', { error });
    res.status(500).json({
      error: 'Failed to create recommendation',
      message: error.message,
    });
  }
}

// ============================================================================
// BATCH CREATE RECOMMENDATIONS
// ============================================================================

/**
 * POST /recommendations/batch
 * Create multiple recommendations from engine requests
 */
export async function batchCreateRecommendationsHandler(req: Request, res: Response) {
  try {
    const { userId, requests } = req.body as BatchCreateRecommendationsInput;
    
    if (!userId || !requests || !Array.isArray(requests)) {
      return res.status(400).json({
        error: 'Missing required fields: userId, requests (array)',
      });
    }
    
    const result = await batchCreateRecommendations({ userId, requests });
    
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to batch create recommendations', { error });
    res.status(500).json({
      error: 'Failed to batch create recommendations',
      message: error.message,
    });
  }
}

// ============================================================================
// GET RECOMMENDATIONS
// ============================================================================

/**
 * GET /recommendations/active/:userId
 * Get all active recommendations for a user
 */
export async function getActiveRecommendationsHandler(req: Request, res: Response) {
  try {
    const userId = req.params.userId as string;
    
    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameter: userId',
      });
    }
    
    const result = await getActiveRecommendations(userId);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to get active recommendations', { error });
    res.status(500).json({
      error: 'Failed to get active recommendations',
      message: error.message,
    });
  }
}

/**
 * GET /recommendations/prioritized/:userId
 * Get prioritized recommendations grouped by priority level
 */
export async function getPrioritizedRecommendationsHandler(req: Request, res: Response) {
  try {
    const userId = req.params.userId as string;
    
    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameter: userId',
      });
    }
    
    const result = await getPrioritizedRecommendations(userId);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to get prioritized recommendations', { error });
    res.status(500).json({
      error: 'Failed to get prioritized recommendations',
      message: error.message,
    });
  }
}

// ============================================================================
// UPDATE RECOMMENDATION STATE
// ============================================================================

/**
 * POST /recommendations/:recommendationId/accept
 * Accept a recommendation
 */
export async function acceptRecommendationHandler(req: Request, res: Response) {
  try {
    const recommendationId = req.params.recommendationId as string;
    const { userNotes } = req.body;
    
    if (!recommendationId) {
      return res.status(400).json({
        error: 'Missing required parameter: recommendationId',
      });
    }
    
    const input: AcceptRecommendationInput = {
      recommendationId,
      userNotes,
    };
    
    const result = await acceptRecommendation(input);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to accept recommendation', { error });
    res.status(500).json({
      error: 'Failed to accept recommendation',
      message: error.message,
    });
  }
}

/**
 * POST /recommendations/:recommendationId/reject
 * Reject a recommendation
 */
export async function rejectRecommendationHandler(req: Request, res: Response) {
  try {
    const recommendationId = req.params.recommendationId as string;
    const { rejectionReason } = req.body;
    
    if (!recommendationId) {
      return res.status(400).json({
        error: 'Missing required parameter: recommendationId',
      });
    }
    
    const input: RejectRecommendationInput = {
      recommendationId,
      rejectionReason,
    };
    
    const result = await rejectRecommendation(input);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to reject recommendation', { error });
    res.status(500).json({
      error: 'Failed to reject recommendation',
      message: error.message,
    });
  }
}

/**
 * POST /recommendations/:recommendationId/snooze
 * Snooze a recommendation
 */
export async function snoozeRecommendationHandler(req: Request, res: Response) {
  try {
    const recommendationId = req.params.recommendationId as string;
    const { snoozedUntil, snoozeReason } = req.body;
    
    if (!recommendationId || !snoozedUntil) {
      return res.status(400).json({
        error: 'Missing required fields: recommendationId, snoozedUntil',
      });
    }
    
    const input: SnoozeRecommendationInput = {
      recommendationId,
      snoozedUntil: new Date(snoozedUntil),
      snoozeReason,
    };
    
    const result = await snoozeRecommendation(input);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to snooze recommendation', { error });
    res.status(500).json({
      error: 'Failed to snooze recommendation',
      message: error.message,
    });
  }
}

/**
 * POST /recommendations/:recommendationId/complete
 * Complete a recommendation
 */
export async function completeRecommendationHandler(req: Request, res: Response) {
  try {
    const recommendationId = req.params.recommendationId as string;
    const { userNotes } = req.body;
    
    if (!recommendationId) {
      return res.status(400).json({
        error: 'Missing required parameter: recommendationId',
      });
    }
    
    const input: CompleteRecommendationInput = {
      recommendationId,
      userNotes,
    };
    
    const result = await completeRecommendation(input);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to complete recommendation', { error });
    res.status(500).json({
      error: 'Failed to complete recommendation',
      message: error.message,
    });
  }
}

/**
 * POST /recommendations/:recommendationId/modify
 * Modify a recommendation
 */
export async function modifyRecommendationHandler(req: Request, res: Response) {
  try {
    const recommendationId = req.params.recommendationId as string;
    const { modifiedDetails, userNotes } = req.body;
    
    if (!recommendationId || !modifiedDetails) {
      return res.status(400).json({
        error: 'Missing required fields: recommendationId, modifiedDetails',
      });
    }
    
    const input: ModifyRecommendationInput = {
      recommendationId,
      modifiedDetails,
      userNotes,
    };
    
    const result = await modifyRecommendation(input);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to modify recommendation', { error });
    res.status(500).json({
      error: 'Failed to modify recommendation',
      message: error.message,
    });
  }
}
