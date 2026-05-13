/**
 * Phase 24: Correlation Alert Service
 * 
 * Purpose: Detect and manage alerts for critical correlations and trend changes
 * Features: Alert detection, creation, acknowledgment, resolution
 */

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import type { Correlation, CorrelationAnalysis } from './crossSourceCorrelationService';
import type { CorrelationHistoryRecord, RecurringCorrelation } from './correlationHistoryService';

// ============================================================================
// TYPES
// ============================================================================

export type AlertType = 'new_critical' | 'severity_increase' | 'recurring_pattern' | 'trend_worsening';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface CorrelationAlert {
  id: string;
  userId: string;
  correlationHistoryId?: string;
  alertType: AlertType;
  message: string;
  actionRequired?: string;
  status: AlertStatus;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  correlationType?: string;
  correlationPattern?: string;
}

export interface AlertDetectionResult {
  newAlerts: CorrelationAlert[];
  alertCount: number;
}

// ============================================================================
// ALERT DETECTION
// ============================================================================

/**
 * Detect alerts based on current and historical correlations
 */
export async function detectAlerts(
  userId: string,
  currentCorrelations: Correlation[],
  historicalCorrelations: CorrelationHistoryRecord[],
  recurringPatterns: RecurringCorrelation[]
): Promise<AlertDetectionResult> {
  try {
    logger.info('🔍 [ALERTS] Detecting correlation alerts', {
      userId,
      currentCount: currentCorrelations.length,
      historicalCount: historicalCorrelations.length,
    });

    const newAlerts: CorrelationAlert[] = [];

    // 1. Detect new critical correlations
    for (const correlation of currentCorrelations) {
      if (correlation.severity === 'critical') {
        const isNew = !historicalCorrelations.some(
          h => h.correlationId === correlation.id && h.severity === 'critical'
        );

        if (isNew) {
          const alert = await createAlert(userId, 'new_critical', {
            message: `New critical correlation detected: ${correlation.type}`,
            actionRequired: correlation.recommendation || 'Review correlation details and take action',
            correlation,
          });
          if (alert) newAlerts.push(alert);
        }
      }
    }

    // 2. Detect severity increases
    for (const correlation of currentCorrelations) {
      const previousSeverity = findPreviousSeverity(correlation.id, historicalCorrelations);
      if (previousSeverity && hasSeverityIncreased(previousSeverity, correlation.severity)) {
        const alert = await createAlert(userId, 'severity_increase', {
          message: `Correlation severity increased: ${correlation.type} (${previousSeverity} → ${correlation.severity})`,
          actionRequired: 'Monitor closely and consider intervention',
          correlation,
        });
        if (alert) newAlerts.push(alert);
      }
    }

    // 3. Detect recurring patterns (3+ occurrences)
    for (const pattern of recurringPatterns) {
      if (pattern.occurrenceCount >= 3 && pattern.severityTrend !== 'info') {
        const alert = await createAlert(userId, 'recurring_pattern', {
          message: `Recurring pattern detected: ${pattern.correlationType} (${pattern.occurrenceCount}x in recent period)`,
          actionRequired: 'Identify root cause and implement preventive measures',
        });
        if (alert) newAlerts.push(alert);
      }
    }

    logger.info('✅ [ALERTS] Alert detection complete', {
      userId,
      newAlerts: newAlerts.length,
    });

    return {
      newAlerts,
      alertCount: newAlerts.length,
    };
  } catch (error) {
    logger.error('❌ [ALERTS] Failed to detect alerts', {
      error: (error as Error).message,
      userId,
    });
    return { newAlerts: [], alertCount: 0 };
  }
}

// ============================================================================
// ALERT CREATION
// ============================================================================

/**
 * Create a new alert
 */
export async function createAlert(
  userId: string,
  alertType: AlertType,
  options: {
    message: string;
    actionRequired?: string;
    correlation?: Correlation;
    correlationHistoryId?: string;
  }
): Promise<CorrelationAlert | null> {
  try {
    logger.info('📝 [ALERTS] Creating alert', {
      userId,
      alertType,
    });

    const { data, error } = await supabase
      .from('correlation_alerts')
      .insert({
        user_id: userId,
        alert_type: alertType,
        message: options.message,
        action_required: options.actionRequired || null,
        correlation_history_id: options.correlationHistoryId || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create alert: ${error.message}`);
    }

    const alert: CorrelationAlert = {
      id: data.id,
      userId: data.user_id,
      correlationHistoryId: data.correlation_history_id,
      alertType: data.alert_type,
      message: data.message,
      actionRequired: data.action_required,
      status: data.status,
      acknowledgedAt: data.acknowledged_at,
      resolvedAt: data.resolved_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    logger.info('✅ [ALERTS] Alert created', {
      userId,
      alertId: alert.id,
      alertType,
    });

    return alert;
  } catch (error) {
    logger.error('❌ [ALERTS] Failed to create alert', {
      error: (error as Error).message,
      userId,
      alertType,
    });
    return null;
  }
}

// ============================================================================
// ALERT RETRIEVAL
// ============================================================================

/**
 * Get active alerts for a user
 */
export async function getActiveAlerts(userId: string): Promise<CorrelationAlert[]> {
  try {
    logger.info('📖 [ALERTS] Retrieving active alerts', { userId });

    const { data, error } = await supabase.rpc('get_active_alerts', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to get active alerts: ${error.message}`);
    }

    const alerts: CorrelationAlert[] = (data || []).map((row: any) => ({
      id: row.id,
      userId,
      alertType: row.alert_type,
      message: row.message,
      actionRequired: row.action_required,
      status: 'active',
      createdAt: row.created_at,
      updatedAt: row.created_at,
      correlationType: row.correlation_type,
      correlationPattern: row.correlation_pattern,
    }));

    logger.info('✅ [ALERTS] Active alerts retrieved', {
      userId,
      alertCount: alerts.length,
    });

    return alerts;
  } catch (error) {
    logger.error('❌ [ALERTS] Failed to get active alerts', {
      error: (error as Error).message,
      userId,
    });
    return [];
  }
}

/**
 * Get all alerts for a user (including acknowledged/resolved)
 */
export async function getAllAlerts(
  userId: string,
  limit: number = 50
): Promise<CorrelationAlert[]> {
  try {
    logger.info('📖 [ALERTS] Retrieving all alerts', { userId, limit });

    const { data, error } = await supabase
      .from('correlation_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get all alerts: ${error.message}`);
    }

    const alerts: CorrelationAlert[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      correlationHistoryId: row.correlation_history_id,
      alertType: row.alert_type,
      message: row.message,
      actionRequired: row.action_required,
      status: row.status,
      acknowledgedAt: row.acknowledged_at,
      resolvedAt: row.resolved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    logger.info('✅ [ALERTS] All alerts retrieved', {
      userId,
      alertCount: alerts.length,
    });

    return alerts;
  } catch (error) {
    logger.error('❌ [ALERTS] Failed to get all alerts', {
      error: (error as Error).message,
      userId,
    });
    return [];
  }
}

// ============================================================================
// ALERT MANAGEMENT
// ============================================================================

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  try {
    logger.info('✓ [ALERTS] Acknowledging alert', { alertId });

    const { error } = await supabase
      .from('correlation_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }

    logger.info('✅ [ALERTS] Alert acknowledged', { alertId });
    return true;
  } catch (error) {
    logger.error('❌ [ALERTS] Failed to acknowledge alert', {
      error: (error as Error).message,
      alertId,
    });
    return false;
  }
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string): Promise<boolean> {
  try {
    logger.info('✓ [ALERTS] Resolving alert', { alertId });

    const { error } = await supabase
      .from('correlation_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }

    logger.info('✅ [ALERTS] Alert resolved', { alertId });
    return true;
  } catch (error) {
    logger.error('❌ [ALERTS] Failed to resolve alert', {
      error: (error as Error).message,
      alertId,
    });
    return false;
  }
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string): Promise<boolean> {
  try {
    logger.info('🗑️ [ALERTS] Deleting alert', { alertId });

    const { error } = await supabase
      .from('correlation_alerts')
      .delete()
      .eq('id', alertId);

    if (error) {
      throw new Error(`Failed to delete alert: ${error.message}`);
    }

    logger.info('✅ [ALERTS] Alert deleted', { alertId });
    return true;
  } catch (error) {
    logger.error('❌ [ALERTS] Failed to delete alert', {
      error: (error as Error).message,
      alertId,
    });
    return false;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function findPreviousSeverity(
  correlationId: string,
  history: CorrelationHistoryRecord[]
): 'info' | 'warning' | 'critical' | null {
  const previous = history
    .filter(h => h.correlationId === correlationId)
    .sort((a, b) => new Date(b.detectionDate).getTime() - new Date(a.detectionDate).getTime())[0];

  return previous?.severity || null;
}

function hasSeverityIncreased(
  previous: 'info' | 'warning' | 'critical',
  current: 'info' | 'warning' | 'critical'
): boolean {
  const severityLevels = { info: 1, warning: 2, critical: 3 };
  return severityLevels[current] > severityLevels[previous];
}
