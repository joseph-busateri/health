import { Request, Response } from 'express';
import {
  generateBloodworkRecommendationsForUser,
  getBloodworkRecommendationsByUser,
  getActiveBloodworkRecommendationsByUser,
  createBloodworkRecommendation,
  markBloodworkRecommendationStatus
} from '../services/bloodworkRecommendationService';
import type {
  GenerateRecommendationsRequest,
  GetBloodworkRecommendationsRequest,
  UpdateRecommendationStatusRequest
} from '../types/bloodworkRecommendations';

export async function generateRecommendationsHandler(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const { force_regenerate } = req.body;

    // Validate required parameters
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required and must be a string'
      });
    }

    const request: GenerateRecommendationsRequest = {
      user_id,
      force_regenerate: Boolean(force_regenerate)
    };

    const result = await generateBloodworkRecommendationsForUser(request);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in generateRecommendationsHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getRecommendationsHandler(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const { 
      status, 
      recommendation_type, 
      severity,
      limit,
      offset 
    } = req.query;

    // Validate required parameters
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required and must be a string'
      });
    }

    // Parse optional parameters
    const request: GetBloodworkRecommendationsRequest = {
      user_id,
      status: status as any,
      recommendation_type: recommendation_type as any,
      severity: severity as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    // Validate parameter values
    if (request.limit !== undefined && (isNaN(request.limit) || request.limit < 1)) {
      return res.status(400).json({
        success: false,
        error: 'limit must be a positive integer'
      });
    }

    if (request.offset !== undefined && (isNaN(request.offset) || request.offset < 0)) {
      return res.status(400).json({
        success: false,
        error: 'offset must be a non-negative integer'
      });
    }

    const result = await getBloodworkRecommendationsByUser(request);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in getRecommendationsHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getActiveRecommendationsHandler(req: Request, res: Response) {
  try {
    const { user_id } = req.params;

    // Validate required parameters
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required and must be a string'
      });
    }

    const result = await getActiveBloodworkRecommendationsByUser(user_id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in getActiveRecommendationsHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function createRecommendationHandler(req: Request, res: Response) {
  try {
    const recommendationData = req.body;

    // Validate required fields
    const requiredFields = [
      'user_id',
      'test_name',
      'recommendation_type',
      'recommendation_title',
      'recommendation_text',
      'rationale',
      'confidence',
      'severity',
      'source_document_ids',
      'source_result_ids',
      'source_trend_window'
    ];

    const missingFields = requiredFields.filter(field => !(field in recommendationData));

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate confidence range
    if (typeof recommendationData.confidence !== 'number' || 
        recommendationData.confidence < 0 || 
        recommendationData.confidence > 1) {
      return res.status(400).json({
        success: false,
        error: 'confidence must be a number between 0 and 1'
      });
    }

    // Validate recommendation_type
    const validTypes = [
      'cardiovascular', 'metabolic', 'hormonal', 'inflammation',
      'follow_up', 'monitoring', 'lifestyle', 'supplement_review', 'workout_review'
    ];

    if (!validTypes.includes(recommendationData.recommendation_type)) {
      return res.status(400).json({
        success: false,
        error: `recommendation_type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high'];
    if (!validSeverities.includes(recommendationData.severity)) {
      return res.status(400).json({
        success: false,
        error: `severity must be one of: ${validSeverities.join(', ')}`
      });
    }

    // Validate source_trend_window structure
    if (!recommendationData.source_trend_window ||
        typeof recommendationData.source_trend_window.start_date !== 'string' ||
        typeof recommendationData.source_trend_window.end_date !== 'string' ||
        typeof recommendationData.source_trend_window.data_points !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'source_trend_window must contain start_date (string), end_date (string), and data_points (number)'
      });
    }

    const result = await createBloodworkRecommendation(recommendationData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in createRecommendationHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function updateRecommendationStatusHandler(req: Request, res: Response) {
  try {
    const { recommendation_id } = req.params;
    const { status } = req.body;

    // Validate required parameters
    if (!recommendation_id || typeof recommendation_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Recommendation ID is required and must be a string'
      });
    }

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Status is required and must be a string'
      });
    }

    // Validate status value
    const validStatuses = ['active', 'superseded', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const request: UpdateRecommendationStatusRequest = { status: status as any };

    const result = await markBloodworkRecommendationStatus(recommendation_id, request);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Recommendation status updated successfully'
    });
  } catch (error) {
    console.error('Error in updateRecommendationStatusHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
