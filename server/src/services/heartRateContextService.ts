import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { getDeviceContext } from './deviceContextService';

/**
 * Heart Rate Context Service
 * 
 * Purpose: Provide unified resting heart rate access for engine consumption
 * - Aggregates resting HR from multiple sources with priority hierarchy
 * - Leverages existing deviceContext for device data aggregation
 * - Provides safe null handling and fallback chain
 * - Avoids each engine duplicating HR queries
 * 
 * Priority Chain:
 * 1. deviceContext.cardiovascular.restingHR (Oura > Apple Watch aggregation)
 * 2. recovery_records.source_inputs.restingHr (recovery engine data)
 * 3. apple_health_heart_rate (average of recent samples)
 * 4. Fallback to null (caller decides default)
 */

export interface HeartRateContext {
  hasRestingHR: boolean;
  restingHR: number | null;
  source: 'device_context' | 'recovery_records' | 'apple_health' | 'none';
  lastUpdated: string | null;
}

/**
 * Get latest resting heart rate context for a user
 * Returns unified HR data with source tracking
 */
export async function getLatestHeartRateContext(userId: string): Promise<HeartRateContext> {
  try {
    logger.info('🔵 [HEART RATE CONTEXT] Fetching resting heart rate', { userId });

    // Priority 1: Device Context (already aggregates Oura > Apple Watch)
    try {
      const deviceContext = await getDeviceContext(userId);
      if (deviceContext.cardiovascular?.restingHR) {
        logger.info('✅ [HEART RATE CONTEXT] Resting HR from device context', {
          userId,
          restingHR: deviceContext.cardiovascular.restingHR,
          source: 'device_context',
        });

        return {
          hasRestingHR: true,
          restingHR: deviceContext.cardiovascular.restingHR,
          source: 'device_context',
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (error) {
      logger.warn('⚠️ [HEART RATE CONTEXT] Device context unavailable', { userId, error });
    }

    // Priority 2: Recovery Records
    const { data: recoveryData, error: recoveryError } = await supabase
      .from('recovery_records')
      .select('source_inputs, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!recoveryError && recoveryData?.source_inputs?.restingHr) {
      logger.info('✅ [HEART RATE CONTEXT] Resting HR from recovery records', {
        userId,
        restingHR: recoveryData.source_inputs.restingHr,
        source: 'recovery_records',
      });

      return {
        hasRestingHR: true,
        restingHR: recoveryData.source_inputs.restingHr,
        source: 'recovery_records',
        lastUpdated: recoveryData.created_at,
      };
    }

    // Priority 3: Apple Health Heart Rate (average of last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: heartRateData, error: heartRateError } = await supabase
      .from('apple_health_heart_rate')
      .select('value, start_date')
      .eq('user_id', userId)
      .gte('start_date', sevenDaysAgo.toISOString())
      .order('start_date', { ascending: false });

    if (!heartRateError && heartRateData && heartRateData.length > 0) {
      // Calculate average resting HR from recent samples
      const avgRestingHR = Math.round(
        heartRateData.reduce((sum, record) => sum + record.value, 0) / heartRateData.length
      );

      logger.info('✅ [HEART RATE CONTEXT] Resting HR from Apple Health average', {
        userId,
        restingHR: avgRestingHR,
        sampleCount: heartRateData.length,
        source: 'apple_health',
      });

      return {
        hasRestingHR: true,
        restingHR: avgRestingHR,
        source: 'apple_health',
        lastUpdated: heartRateData[0].start_date,
      };
    }

    // No data found
    logger.info('⚠️ [HEART RATE CONTEXT] No resting heart rate found', { userId });
    return createEmptyHeartRateContext();

  } catch (error) {
    logger.error('❌ [HEART RATE CONTEXT] Unexpected error', { userId, error });
    return createEmptyHeartRateContext();
  }
}

/**
 * Create empty heart rate context for fallback
 */
function createEmptyHeartRateContext(): HeartRateContext {
  return {
    hasRestingHR: false,
    restingHR: null,
    source: 'none',
    lastUpdated: null,
  };
}

/**
 * Helper: Get resting HR value (safe)
 */
export function getRestingHR(context: HeartRateContext): number | null {
  return context.restingHR;
}

/**
 * Helper: Validate resting HR is within reasonable range
 */
export function isValidRestingHR(restingHR: number | null): boolean {
  if (restingHR === null) return false;
  
  // Reasonable resting HR range: 30-250 bpm
  return restingHR >= 30 && restingHR <= 250;
}

/**
 * Helper: Format resting HR for display
 */
export function formatRestingHR(context: HeartRateContext): string {
  if (!context.hasRestingHR || context.restingHR === null) {
    return 'Not available';
  }

  return `${context.restingHR} bpm`;
}
