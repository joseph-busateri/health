import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

/**
 * HRV Context Service
 * 
 * Purpose: Provide unified HRV (Heart Rate Variability) access for engine consumption
 * - Aggregates HRV from multiple sources with priority hierarchy
 * - Supports multiple devices: WHOOP, Oura, Apple Watch, manual entry
 * - Provides safe null handling and fallback chain
 * - Avoids each engine duplicating HRV queries
 * 
 * Priority Chain:
 * 1. hrv_measurements.rmssd (most detailed, multi-device)
 * 2. apple_watch_health_data.heart_rate_variability_sdnn (Apple Watch)
 * 3. recovery_records.source_inputs.hrv (recovery engine data)
 * 4. Fallback to null (caller decides default)
 */

export interface HRVContext {
  hasHRV: boolean;
  hrv: number | null; // RMSSD in milliseconds
  sdnn: number | null; // SDNN in milliseconds (if available)
  source: 'hrv_measurements' | 'apple_watch' | 'recovery_records' | 'none';
  deviceSource: 'whoop' | 'oura' | 'apple_watch' | 'manual' | null;
  lastUpdated: string | null;
}

/**
 * Get latest HRV context for a user
 * Returns unified HRV data with source tracking
 */
export async function getLatestHRVContext(userId: string): Promise<HRVContext> {
  try {
    logger.info('🔵 [HRV CONTEXT] Fetching HRV data', { userId });

    // Priority 1: HRV Measurements (most detailed, multi-device)
    const { data: hrvData, error: hrvError } = await supabase
      .from('hrv_measurements')
      .select('rmssd, sdnn, device_source, measurement_date')
      .eq('user_id', userId)
      .order('measurement_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!hrvError && hrvData?.rmssd) {
      logger.info('✅ [HRV CONTEXT] HRV from hrv_measurements', {
        userId,
        rmssd: hrvData.rmssd,
        sdnn: hrvData.sdnn,
        deviceSource: hrvData.device_source,
        source: 'hrv_measurements',
      });

      return {
        hasHRV: true,
        hrv: hrvData.rmssd,
        sdnn: hrvData.sdnn,
        source: 'hrv_measurements',
        deviceSource: hrvData.device_source as 'whoop' | 'oura' | 'apple_watch' | 'manual',
        lastUpdated: hrvData.measurement_date,
      };
    }

    // Priority 2: Apple Watch Health Data
    const { data: appleWatchData, error: appleWatchError } = await supabase
      .from('apple_watch_health_data')
      .select('heart_rate_variability_sdnn, heart_rate_variability_rmssd, date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!appleWatchError && appleWatchData) {
      // Prefer RMSSD if available, fallback to SDNN
      const hrvValue = appleWatchData.heart_rate_variability_rmssd || appleWatchData.heart_rate_variability_sdnn;
      
      if (hrvValue) {
        logger.info('✅ [HRV CONTEXT] HRV from Apple Watch', {
          userId,
          hrv: hrvValue,
          sdnn: appleWatchData.heart_rate_variability_sdnn,
          source: 'apple_watch',
        });

        return {
          hasHRV: true,
          hrv: hrvValue,
          sdnn: appleWatchData.heart_rate_variability_sdnn,
          source: 'apple_watch',
          deviceSource: 'apple_watch',
          lastUpdated: appleWatchData.date,
        };
      }
    }

    // Priority 3: Recovery Records
    const { data: recoveryData, error: recoveryError } = await supabase
      .from('recovery_records')
      .select('source_inputs, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!recoveryError && recoveryData?.source_inputs?.hrv) {
      logger.info('✅ [HRV CONTEXT] HRV from recovery records', {
        userId,
        hrv: recoveryData.source_inputs.hrv,
        source: 'recovery_records',
      });

      return {
        hasHRV: true,
        hrv: recoveryData.source_inputs.hrv,
        sdnn: null,
        source: 'recovery_records',
        deviceSource: null,
        lastUpdated: recoveryData.created_at,
      };
    }

    // No data found
    logger.info('⚠️ [HRV CONTEXT] No HRV data found', { userId });
    return createEmptyHRVContext();

  } catch (error) {
    logger.error('❌ [HRV CONTEXT] Unexpected error', { userId, error });
    return createEmptyHRVContext();
  }
}

/**
 * Create empty HRV context for fallback
 */
function createEmptyHRVContext(): HRVContext {
  return {
    hasHRV: false,
    hrv: null,
    sdnn: null,
    source: 'none',
    deviceSource: null,
    lastUpdated: null,
  };
}

/**
 * Helper: Get HRV value (safe)
 */
export function getHRV(context: HRVContext): number | null {
  return context.hrv;
}

/**
 * Helper: Validate HRV is within reasonable range
 */
export function isValidHRV(hrv: number | null): boolean {
  if (hrv === null) return false;
  
  // Reasonable HRV range: 10-200 ms
  return hrv >= 10 && hrv <= 200;
}

/**
 * Helper: Format HRV for display
 */
export function formatHRV(context: HRVContext): string {
  if (!context.hasHRV || context.hrv === null) {
    return 'Not available';
  }

  const deviceInfo = context.deviceSource ? ` (${context.deviceSource})` : '';
  return `${context.hrv} ms${deviceInfo}`;
}

/**
 * Helper: Interpret HRV status
 */
export function interpretHRVStatus(hrv: number | null): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
  if (hrv === null) return 'unknown';
  
  // General HRV interpretation (varies by age/fitness)
  if (hrv >= 70) return 'excellent';
  if (hrv >= 50) return 'good';
  if (hrv >= 30) return 'fair';
  return 'poor';
}
