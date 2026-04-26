/**
 * Actuarial Risk Controller
 * Handles HTTP requests for actuarial risk calculation and retrieval
 * 
 * Endpoints:
 * - POST /:userId/calculate - Calculate actuarial risk
 * - GET /:userId/record - Get current/latest risk record
 * - GET /:userId/history - Get historical risk records
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import {
  calculateActuarialRisk,
  getActuarialRiskRecord,
  getActuarialRiskHistory,
} from '../services/actuarialRiskEngineService';
import { unifyActuarialData } from '../services/actuarialDataUnifier';
import { getLatestBloodPressureContext, getSystolic, getDiastolic } from '../services/bloodPressureContextService';
import type { ActuarialRiskInputs } from '../types/actuarialRiskEngine';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate userId parameter
 */
function validateUserId(userId: any): string | null {
  if (!userId) {
    return null;
  }
  return Array.isArray(userId) ? userId[0] : userId;
}

/**
 * Validate actuarial risk inputs
 */
function validateActuarialInputs(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate demographic
  if (!body.demographic) {
    errors.push('Missing required field: demographic');
  } else {
    if (typeof body.demographic.age !== 'number') {
      errors.push('demographic.age must be a number');
    }
    if (!['male', 'female'].includes(body.demographic.gender)) {
      errors.push('demographic.gender must be "male" or "female"');
    }
    if (!['white', 'african_american', 'other'].includes(body.demographic.race)) {
      errors.push('demographic.race must be "white", "african_american", or "other"');
    }
  }

  // Validate clinical
  if (!body.clinical) {
    errors.push('Missing required field: clinical');
  } else {
    if (typeof body.clinical.systolicBP !== 'number') {
      errors.push('clinical.systolicBP must be a number');
    }
    if (typeof body.clinical.diastolicBP !== 'number') {
      errors.push('clinical.diastolicBP must be a number');
    }
    if (typeof body.clinical.totalCholesterol !== 'number') {
      errors.push('clinical.totalCholesterol must be a number');
    }
    if (typeof body.clinical.hdlCholesterol !== 'number') {
      errors.push('clinical.hdlCholesterol must be a number');
    }
    if (typeof body.clinical.isSmoker !== 'boolean') {
      errors.push('clinical.isSmoker must be a boolean');
    }
    if (typeof body.clinical.isDiabetic !== 'boolean') {
      errors.push('clinical.isDiabetic must be a boolean');
    }
    if (typeof body.clinical.isOnBPMedication !== 'boolean') {
      errors.push('clinical.isOnBPMedication must be a boolean');
    }
  }

  // Validate lifestyle (optional but if present, validate)
  if (body.lifestyle) {
    if (body.lifestyle.exerciseFrequency !== undefined && typeof body.lifestyle.exerciseFrequency !== 'number') {
      errors.push('lifestyle.exerciseFrequency must be a number');
    }
    if (body.lifestyle.vo2Max !== undefined && typeof body.lifestyle.vo2Max !== 'number') {
      errors.push('lifestyle.vo2Max must be a number');
    }
    if (body.lifestyle.bodyFatPercentage !== undefined && typeof body.lifestyle.bodyFatPercentage !== 'number') {
      errors.push('lifestyle.bodyFatPercentage must be a number');
    }
    if (body.lifestyle.bmi !== undefined && typeof body.lifestyle.bmi !== 'number') {
      errors.push('lifestyle.bmi must be a number');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// CONTROLLER HANDLERS
// ============================================================================

/**
 * Calculate actuarial risk for a user
 * POST /:userId/calculate
 */
export const calculateActuarialRiskHandler = async (req: Request, res: Response) => {
  try {
    const userId = validateUserId(req.params.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userId',
      });
    }

    // Validate request body
    const validation = validateActuarialInputs(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: validation.errors,
      });
    }

    logger.info('📊 [ACTUARIAL API] Calculating actuarial risk', { userId });

    // Fetch real BP data from database
    const bpContext = await getLatestBloodPressureContext(userId);
    const realSystolicBP = getSystolic(bpContext);
    const realDiastolicBP = getDiastolic(bpContext);

    logger.info('📊 [ACTUARIAL API] Fetched BP data', {
      userId,
      hasRealBP: bpContext.hasBloodPressure,
      systolicBP: realSystolicBP,
      diastolicBP: realDiastolicBP,
    });

    // Calculate risk - use real BP data if available, otherwise use request body
    const inputs: ActuarialRiskInputs = {
      ...req.body,
      clinical: {
        ...req.body.clinical,
        // Override with real BP data if available
        systolicBP: realSystolicBP ?? req.body.clinical.systolicBP,
        diastolicBP: realDiastolicBP ?? req.body.clinical.diastolicBP,
      },
    };

    const record = await calculateActuarialRisk(userId, inputs);

    logger.info('✅ [ACTUARIAL API] Risk calculation complete', {
      userId,
      riskCategory: record.riskCategory,
      overallRisk: record.overallRisk,
    });

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    logger.error('❌ [ACTUARIAL API] Failed to calculate actuarial risk', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to calculate actuarial risk',
      details: (error as Error).message,
    });
  }
};

/**
 * Calculate actuarial risk with automatic data unification
 * POST /:userId/calculate-auto
 */
export const calculateActuarialRiskAutoHandler = async (req: Request, res: Response) => {
  try {
    const userId = validateUserId(req.params.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userId',
      });
    }

    logger.info('📊 [ACTUARIAL API] Auto-calculating actuarial risk with data unification', { userId });

    // Unify data from multiple sources
    const inputs = await unifyActuarialData(userId);

    logger.info('✅ [ACTUARIAL API] Data unification complete', {
      userId,
      hasBaseline: !!inputs.demographic,
      hasClinical: !!inputs.clinical,
      hasLifestyle: !!inputs.lifestyle,
    });

    // Calculate risk
    const record = await calculateActuarialRisk(userId, inputs);

    logger.info('✅ [ACTUARIAL API] Auto-calculation complete', {
      userId,
      riskCategory: record.riskCategory,
      overallRisk: record.overallRisk,
    });

    res.status(200).json({
      success: true,
      data: record,
      metadata: {
        dataSource: 'unified',
        unifiedInputs: inputs,
      },
    });
  } catch (error) {
    logger.error('❌ [ACTUARIAL API] Failed to auto-calculate actuarial risk', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to auto-calculate actuarial risk',
      details: (error as Error).message,
    });
  }
};

/**
 * Get actuarial risk record for a user
 * GET /:userId/record
 * Query params:
 * - date (optional): specific date to retrieve
 */
export const getActuarialRiskRecordHandler = async (req: Request, res: Response) => {
  try {
    const userId = validateUserId(req.params.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userId',
      });
    }

    const date = req.query.date as string | undefined;

    logger.info('📊 [ACTUARIAL API] Retrieving actuarial risk record', { userId, date });

    const record = await getActuarialRiskRecord(userId, date);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'No actuarial risk record found',
        details: date ? `No record found for date: ${date}` : 'No records found for user',
      });
    }

    logger.info('✅ [ACTUARIAL API] Risk record retrieved', {
      userId,
      date: record.date,
      riskCategory: record.riskCategory,
    });

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    logger.error('❌ [ACTUARIAL API] Failed to get actuarial risk record', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get actuarial risk record',
      details: (error as Error).message,
    });
  }
};

/**
 * Get actuarial risk history for a user
 * GET /:userId/history
 * Query params:
 * - days (optional): number of days to retrieve (default: 30)
 */
export const getActuarialRiskHistoryHandler = async (req: Request, res: Response) => {
  try {
    const userId = validateUserId(req.params.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userId',
      });
    }

    // Parse and validate days parameter
    let days = 30;
    if (req.query.days) {
      const parsedDays = parseInt(req.query.days as string, 10);
      if (isNaN(parsedDays) || parsedDays < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameter: days must be a positive integer',
        });
      }
      days = parsedDays;
    }

    logger.info('📊 [ACTUARIAL API] Retrieving actuarial risk history', { userId, days });

    const history = await getActuarialRiskHistory(userId, days);

    logger.info('✅ [ACTUARIAL API] Risk history retrieved', {
      userId,
      days,
      recordCount: history.length,
    });

    res.status(200).json({
      success: true,
      data: history,
      metadata: {
        days,
        recordCount: history.length,
      },
    });
  } catch (error) {
    logger.error('❌ [ACTUARIAL API] Failed to get actuarial risk history', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get actuarial risk history',
      details: (error as Error).message,
    });
  }
};
