/**
 * Phase 23: Unified Health Data Controller
 * 
 * Purpose: API endpoints for unified health data and cross-source correlations
 * Features: Get snapshot, analyze correlations, data quality metrics
 */

import { Request, Response } from 'express';
import { getUnifiedHealthSnapshot } from '../services/unifiedHealthDataService';
import { analyzeCorrelations } from '../services/crossSourceCorrelationService';
import { logger } from '../utils/logger';

// ============================================================================
// GET UNIFIED HEALTH SNAPSHOT
// ============================================================================

export const getUnifiedSnapshot = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;

    logger.info('📊 [UNIFIED API] Fetching unified health snapshot', {
      userId,
      date: date || 'today',
    });

    const snapshot = await getUnifiedHealthSnapshot(userId, date);

    return res.json({
      success: true,
      snapshot,
    });
  } catch (error) {
    logger.error('❌ [UNIFIED API] Failed to fetch snapshot', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch unified health snapshot',
    });
  }
};

// ============================================================================
// GET CORRELATIONS
// ============================================================================

export const getCorrelations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;

    logger.info('🔍 [UNIFIED API] Analyzing correlations', {
      userId,
      date: date || 'today',
    });

    // Get snapshot first
    const snapshot = await getUnifiedHealthSnapshot(userId, date);

    // Analyze correlations
    const analysis = await analyzeCorrelations(snapshot);

    return res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    logger.error('❌ [UNIFIED API] Failed to analyze correlations', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze correlations',
    });
  }
};

// ============================================================================
// GET DATA QUALITY METRICS
// ============================================================================

export const getDataQuality = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;

    logger.info('📈 [UNIFIED API] Fetching data quality metrics', {
      userId,
      date: date || 'today',
    });

    const snapshot = await getUnifiedHealthSnapshot(userId, date);

    return res.json({
      success: true,
      dataQuality: snapshot.dataQuality,
      date: snapshot.date,
    });
  } catch (error) {
    logger.error('❌ [UNIFIED API] Failed to fetch data quality', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch data quality metrics',
    });
  }
};

// ============================================================================
// GET SNAPSHOT WITH CORRELATIONS (COMBINED)
// ============================================================================

export const getSnapshotWithCorrelations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;

    logger.info('🎯 [UNIFIED API] Fetching snapshot with correlations', {
      userId,
      date: date || 'today',
    });

    // Get snapshot
    const snapshot = await getUnifiedHealthSnapshot(userId, date);

    // Analyze correlations
    const analysis = await analyzeCorrelations(snapshot);

    return res.json({
      success: true,
      snapshot,
      correlations: analysis,
    });
  } catch (error) {
    logger.error('❌ [UNIFIED API] Failed to fetch snapshot with correlations', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch snapshot with correlations',
    });
  }
};

// ============================================================================
// GET SOURCE SUMMARY
// ============================================================================

export const getSourceSummary = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;

    logger.info('📋 [UNIFIED API] Fetching source summary', {
      userId,
      date: date || 'today',
    });

    const snapshot = await getUnifiedHealthSnapshot(userId, date);

    // Build source summary
    const sourceSummary = {
      interviewSignals: {
        available: snapshot.interviewSignals.available,
        totalSignals: snapshot.interviewSignals.summary.totalSignals,
        avgConfidence: snapshot.interviewSignals.summary.avgConfidence,
        categories: snapshot.interviewSignals.summary.categoriesCovered,
      },
      wearables: {
        available: snapshot.wearables.available,
        devices: {
          appleWatch: !!snapshot.wearables.appleWatch,
          oura: !!snapshot.wearables.oura,
          sleepNumber: !!snapshot.wearables.sleepNumber,
        },
      },
      bloodwork: {
        available: snapshot.bloodwork.available,
        lastTest: snapshot.bloodwork.mostRecent?.date,
        flags: snapshot.bloodwork.flags.length,
      },
      nutrition: {
        available: snapshot.nutrition.available,
        adherence: snapshot.nutrition.today?.adherence,
        mealsLogged: snapshot.nutrition.today?.meals.length,
      },
      workouts: {
        available: snapshot.workouts.available,
        completed: snapshot.workouts.today?.completed,
        streak: snapshot.workouts.recent7Days?.streak,
      },
      supplements: {
        available: snapshot.supplements.available,
        adherence: snapshot.supplements.today?.adherence,
        taken: snapshot.supplements.today?.taken.length,
        missed: snapshot.supplements.today?.missed.length,
      },
      dailyLogs: {
        available: snapshot.dailyLogs.available,
        hasToday: !!snapshot.dailyLogs.today,
      },
      bodyComposition: {
        available: snapshot.bodyComposition.available,
        lastMeasurement: snapshot.bodyComposition.latest?.date,
      },
      goals: {
        available: snapshot.goals.available,
        total: snapshot.goals.summary?.total,
        onTrack: snapshot.goals.summary?.onTrack,
        atRisk: snapshot.goals.summary?.atRisk,
      },
      controlTower: {
        available: snapshot.controlTower.available,
        status: snapshot.controlTower.overallStatus,
      },
    };

    return res.json({
      success: true,
      date: snapshot.date,
      dataQuality: snapshot.dataQuality,
      sources: sourceSummary,
    });
  } catch (error) {
    logger.error('❌ [UNIFIED API] Failed to fetch source summary', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch source summary',
    });
  }
};
