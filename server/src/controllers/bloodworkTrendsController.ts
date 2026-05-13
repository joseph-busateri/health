import { Request, Response } from 'express';
import {
  getBloodworkTrendsByUser,
  getBloodworkTrendSummary,
  getSupportedMarkers,
  getMarkersByCategory
} from '../services/bloodworkTrendService';
import type {
  GetBloodworkTrendsRequest,
  GetBloodworkTrendSummaryRequest
} from '../types/bloodworkTrends';

export async function getBloodworkTrendsHandler(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const { category, min_data_points } = req.query;

    // Validate required parameters
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required and must be a string'
      });
    }

    // Parse optional parameters
    const request: GetBloodworkTrendsRequest = {
      user_id,
      category: category as string || undefined,
      min_data_points: min_data_points ? parseInt(min_data_points as string) : undefined
    };

    // Validate min_data_points if provided
    if (request.min_data_points !== undefined && 
        (isNaN(request.min_data_points) || request.min_data_points < 1)) {
      return res.status(400).json({
        success: false,
        error: 'min_data_points must be a positive integer'
      });
    }

    const result = await getBloodworkTrendsByUser(request);

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
    console.error('Error in getBloodworkTrendsHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getBloodworkTrendSummaryHandler(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const { category } = req.query;

    // Validate required parameters
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required and must be a string'
      });
    }

    const request: GetBloodworkTrendSummaryRequest = {
      user_id,
      category: category as string || undefined
    };

    const result = await getBloodworkTrendSummary(request);

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
    console.error('Error in getBloodworkTrendSummaryHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getSupportedMarkersHandler(req: Request, res: Response) {
  try {
    const { category } = req.query;

    let markers;
    if (category && typeof category === 'string') {
      markers = getMarkersByCategory(category);
    } else {
      markers = getSupportedMarkers();
    }

    res.json({
      success: true,
      data: {
        markers,
        total: markers.length
      }
    });
  } catch (error) {
    console.error('Error in getSupportedMarkersHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getMarkerCategoriesHandler(req: Request, res: Response) {
  try {
    const supportedMarkers = getSupportedMarkers();
    const categories = [...new Set(supportedMarkers.map(marker => marker.category))];

    res.json({
      success: true,
      data: {
        categories,
        total: categories.length
      }
    });
  } catch (error) {
    console.error('Error in getMarkerCategoriesHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
