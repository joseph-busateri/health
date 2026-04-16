/**
 * Phase 24: Correlation History Service
 * 
 * Purpose: Store and retrieve historical correlation detections for trend analysis
 * Features: Save correlations, retrieve history, query by type, track patterns
 */

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import type { CorrelationAnalysis, Correlation } from './crossSourceCorrelationService';

// ============================================================================
// TYPES
// ============================================================================

export interface CorrelationHistoryRecord {
  id: string;
  userId: string;
  detectionDate: string;
  correlationId: string;
  correlationType: string;
  confidence: number;
  severity: 'info' | 'warning' | 'critical';
  pattern: string;
  insight: string;
  recommendation?: string;
  sources: string[];
  createdAt: string;
}

export interface RecurringCorrelation {
  correlationType: string;
  correlationId: string;
  occurrenceCount: number;
  avgConfidence: number;
  mostRecentDate: string;
  severityTrend: 'info' | 'warning' | 'critical';
}

// ============================================================================
// SAVE CORRELATION HISTORY
// ============================================================================

/**
 * Save correlation analysis to history
 */
export async function saveCorrelationHistory(
  analysis: CorrelationAnalysis
): Promise<void> {
  try {
    logger.info('💾 [CORRELATION HISTORY] Saving correlation history', {
      userId: analysis.userId,
      date: analysis.date,
      correlationCount: analysis.correlations.length,
    });

    if (analysis.correlations.length === 0) {
      logger.info('ℹ️ [CORRELATION HISTORY] No correlations to save');
      return;
    }

    // Prepare records for batch insert
    const records = analysis.correlations.map((correlation) => ({
      user_id: analysis.userId,
      detection_date: analysis.date,
      correlation_id: correlation.id,
      correlation_type: correlation.type,
      confidence: correlation.confidence,
      severity: correlation.severity,
      pattern: correlation.pattern,
      insight: correlation.insight,
      recommendation: correlation.recommendation || null,
      sources: correlation.sources,
    }));

    // Batch insert with upsert (on conflict do update)
    const { error } = await supabase
      .from('correlation_history')
      .upsert(records, {
        onConflict: 'user_id,detection_date,correlation_id',
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`Failed to save correlation history: ${error.message}`);
    }

    logger.info('✅ [CORRELATION HISTORY] Saved successfully', {
      userId: analysis.userId,
      recordCount: records.length,
    });
  } catch (error) {
    logger.error('❌ [CORRELATION HISTORY] Failed to save', {
      error: (error as Error).message,
      userId: analysis.userId,
    });
    // Don't throw - history saving failure shouldn't block main flow
  }
}

// ============================================================================
// RETRIEVE CORRELATION HISTORY
// ============================================================================

/**
 * Get correlation history for a user
 */
export async function getCorrelationHistory(
  userId: string,
  days: number = 30
): Promise<CorrelationHistoryRecord[]> {
  try {
    logger.info('📖 [CORRELATION HISTORY] Retrieving history', {
      userId,
      days,
    });

    const { data, error } = await supabase.rpc('get_correlation_history', {
      p_user_id: userId,
      p_days: days,
    });

    if (error) {
      throw new Error(`Failed to retrieve correlation history: ${error.message}`);
    }

    const records: CorrelationHistoryRecord[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      detectionDate: row.detection_date,
      correlationId: row.correlation_id,
      correlationType: row.correlation_type,
      confidence: parseFloat(row.confidence),
      severity: row.severity,
      pattern: row.pattern,
      insight: row.insight,
      recommendation: row.recommendation,
      sources: row.sources,
      createdAt: row.created_at,
    }));

    logger.info('✅ [CORRELATION HISTORY] Retrieved successfully', {
      userId,
      recordCount: records.length,
    });

    return records;
  } catch (error) {
    logger.error('❌ [CORRELATION HISTORY] Failed to retrieve', {
      error: (error as Error).message,
      userId,
    });
    return [];
  }
}

/**
 * Get correlation history by type
 */
export async function getCorrelationByType(
  userId: string,
  correlationType: string,
  days: number = 30
): Promise<CorrelationHistoryRecord[]> {
  try {
    logger.info('📖 [CORRELATION HISTORY] Retrieving by type', {
      userId,
      correlationType,
      days,
    });

    const { data, error } = await supabase.rpc('get_correlation_by_type', {
      p_user_id: userId,
      p_correlation_type: correlationType,
      p_days: days,
    });

    if (error) {
      throw new Error(`Failed to retrieve correlation by type: ${error.message}`);
    }

    const records: CorrelationHistoryRecord[] = (data || []).map((row: any) => ({
      id: '', // Not returned by this function
      userId,
      detectionDate: row.detection_date,
      correlationId: row.correlation_id,
      correlationType,
      confidence: parseFloat(row.confidence),
      severity: row.severity,
      pattern: row.pattern,
      insight: '',
      recommendation: undefined,
      sources: [],
      createdAt: '',
    }));

    logger.info('✅ [CORRELATION HISTORY] Retrieved by type', {
      userId,
      correlationType,
      recordCount: records.length,
    });

    return records;
  } catch (error) {
    logger.error('❌ [CORRELATION HISTORY] Failed to retrieve by type', {
      error: (error as Error).message,
      userId,
      correlationType,
    });
    return [];
  }
}

/**
 * Get recurring correlations (appeared 3+ times)
 */
export async function getRecurringCorrelations(
  userId: string,
  days: number = 30,
  minOccurrences: number = 3
): Promise<RecurringCorrelation[]> {
  try {
    logger.info('🔄 [CORRELATION HISTORY] Finding recurring patterns', {
      userId,
      days,
      minOccurrences,
    });

    const { data, error } = await supabase.rpc('get_recurring_correlations', {
      p_user_id: userId,
      p_days: days,
      p_min_occurrences: minOccurrences,
    });

    if (error) {
      throw new Error(`Failed to get recurring correlations: ${error.message}`);
    }

    const recurring: RecurringCorrelation[] = (data || []).map((row: any) => ({
      correlationType: row.correlation_type,
      correlationId: row.correlation_id,
      occurrenceCount: row.occurrence_count,
      avgConfidence: parseFloat(row.avg_confidence),
      mostRecentDate: row.most_recent_date,
      severityTrend: row.severity_trend,
    }));

    logger.info('✅ [CORRELATION HISTORY] Found recurring patterns', {
      userId,
      recurringCount: recurring.length,
    });

    return recurring;
  } catch (error) {
    logger.error('❌ [CORRELATION HISTORY] Failed to find recurring patterns', {
      error: (error as Error).message,
      userId,
    });
    return [];
  }
}

/**
 * Get correlation trend for specific correlation
 */
export async function getCorrelationTrend(
  userId: string,
  correlationId: string,
  days: number = 30
): Promise<{
  trendDirection: 'improving' | 'worsening' | 'stable';
  severityChanges: number;
  avgConfidence: number;
  occurrenceCount: number;
} | null> {
  try {
    logger.info('📊 [CORRELATION HISTORY] Calculating trend', {
      userId,
      correlationId,
      days,
    });

    const { data, error } = await supabase.rpc('calculate_correlation_trend', {
      p_user_id: userId,
      p_correlation_id: correlationId,
      p_days: days,
    });

    if (error) {
      throw new Error(`Failed to calculate correlation trend: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    const trend = {
      trendDirection: data[0].trend_direction as 'improving' | 'worsening' | 'stable',
      severityChanges: data[0].severity_changes,
      avgConfidence: parseFloat(data[0].avg_confidence),
      occurrenceCount: data[0].occurrence_count,
    };

    logger.info('✅ [CORRELATION HISTORY] Trend calculated', {
      userId,
      correlationId,
      trend: trend.trendDirection,
    });

    return trend;
  } catch (error) {
    logger.error('❌ [CORRELATION HISTORY] Failed to calculate trend', {
      error: (error as Error).message,
      userId,
      correlationId,
    });
    return null;
  }
}

/**
 * Delete old correlation history (cleanup)
 */
export async function cleanupOldHistory(
  daysToKeep: number = 90
): Promise<number> {
  try {
    logger.info('🧹 [CORRELATION HISTORY] Cleaning up old records', {
      daysToKeep,
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('correlation_history')
      .delete()
      .lt('detection_date', cutoffDate.toISOString().split('T')[0])
      .select('id');

    if (error) {
      throw new Error(`Failed to cleanup old history: ${error.message}`);
    }

    const deletedCount = data?.length || 0;

    logger.info('✅ [CORRELATION HISTORY] Cleanup complete', {
      deletedCount,
      daysToKeep,
    });

    return deletedCount;
  } catch (error) {
    logger.error('❌ [CORRELATION HISTORY] Cleanup failed', {
      error: (error as Error).message,
    });
    return 0;
  }
}
