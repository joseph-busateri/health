import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import {
  getDemographicProfile,
  updateDemographicProfile,
  getDemographicValidationRules,
  getDemographicCollectionProgress,
  calculateDemographicQualityScore,
  validateDemographicField,
  getDemographicDataForEngines,
  clearDemographicCache,
} from '../services/demographicsService';

export const getDemographicProfileHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    
    if (!normalizedUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const profile = await getDemographicProfile(normalizedUserId);
    
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Failed to get demographic profile', {
      userId: req.params.userId,
      error: (error as Error).message,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve demographic profile',
    });
  }
};

export const updateDemographicProfileHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    const updates = req.body;
    
    if (!normalizedUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    // Validate updates before applying
    const validationResults = await Promise.all(
      Object.entries(updates).map(async ([field, value]) => {
        const validation = await validateDemographicField(field, value);
        return { field, validation };
      })
    );

    const errors = validationResults
      .filter(result => !result.validation.isValid)
      .flatMap(result => result.validation.errors);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const updatedProfile = await updateDemographicProfile(normalizedUserId, updates);
    
    res.json({
      success: true,
      data: updatedProfile,
    });
  } catch (error) {
    logger.error('Failed to update demographic profile', {
      userId: req.params.userId,
      error: (error as Error).message,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update demographic profile',
    });
  }
};

export const getValidationRulesHandler = async (req: Request, res: Response) => {
  try {
    const rules = await getDemographicValidationRules();
    
    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    logger.error('Failed to get validation rules', {
      error: (error as Error).message,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve validation rules',
    });
  }
};

export const getCollectionProgressHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    
    if (!normalizedUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const progress = await getDemographicCollectionProgress(normalizedUserId);
    
    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    logger.error('Failed to get collection progress', {
      userId: req.params.userId,
      error: (error as Error).message,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve collection progress',
    });
  }
};

export const calculateQualityScoreHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    
    if (!normalizedUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const score = await calculateDemographicQualityScore(normalizedUserId);
    
    res.json({
      success: true,
      data: { qualityScore: score },
    });
  } catch (error) {
    logger.error('Failed to calculate quality score', {
      userId: req.params.userId,
      error: (error as Error).message,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to calculate quality score',
    });
  }
};

export const validateFieldHandler = async (req: Request, res: Response) => {
  try {
    const { fieldName } = req.params;
    const normalizedFieldName = Array.isArray(fieldName) ? fieldName[0] : fieldName;
    const { value } = req.body;
    
    if (!normalizedFieldName) {
      return res.status(400).json({
        success: false,
        error: 'Field name is required',
      });
    }

    const validation = await validateDemographicField(normalizedFieldName, value);
    
    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    logger.error('Failed to validate field', {
      fieldName: req.params.fieldName,
      error: (error as Error).message,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to validate field',
    });
  }
};

export const getDemographicDataForEnginesHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    
    if (!normalizedUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const demographicData = await getDemographicDataForEngines(normalizedUserId);
    
    res.json({
      success: true,
      data: demographicData,
    });
  } catch (error) {
    logger.error('Failed to get demographic data for engines', {
      userId: req.params.userId,
      error: (error as Error).message,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve demographic data for engines',
    });
  }
};

export const clearCacheHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = userId && Array.isArray(userId) ? userId[0] : userId;
    
    if (normalizedUserId) {
      clearDemographicCache(normalizedUserId);
    } else {
      clearDemographicCache();
    }
    
    res.json({
      success: true,
      message: userId ? 'Cache cleared for user' : 'Cache cleared for all users',
    });
  } catch (error) {
    logger.error('Failed to clear cache', {
      userId: req.params.userId,
      error: (error as Error).message,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
    });
  }
};
