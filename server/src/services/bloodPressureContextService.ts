import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

/**
 * Blood Pressure Context Service
 * 
 * Purpose: Provide read-only blood pressure access for engine consumption
 * - Fetches latest blood pressure reading for a user
 * - Normalizes field access for engines
 * - Provides safe null handling
 * - Avoids each engine duplicating BP queries
 * - NOTE: heart_rate from BP readings is NOT resting heart rate (different metrics)
 */

export interface BloodPressureReading {
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null; // Pulse during BP measurement (NOT resting HR)
  readingDate: string | null;
  source: string | null;
}

export interface BloodPressureContext {
  hasBloodPressure: boolean;
  latestReadingDate: string | null;
  reading: BloodPressureReading;
}

/**
 * Get latest blood pressure context for a user
 * Returns structured BP data with safe null handling
 */
export async function getLatestBloodPressureContext(userId: string): Promise<BloodPressureContext> {
  try {
    logger.info('🔵 [BLOOD PRESSURE CONTEXT] Fetching latest blood pressure', { userId });

    // Fetch latest blood pressure reading
    const { data, error } = await supabase
      .from('blood_pressure_readings')
      .select('systolic, diastolic, heart_rate, reading_date, source')
      .eq('user_id', userId)
      .order('reading_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('❌ [BLOOD PRESSURE CONTEXT] Query error', { userId, error: error.message });
      return createEmptyBloodPressureContext();
    }

    if (!data) {
      logger.info('⚠️ [BLOOD PRESSURE CONTEXT] No blood pressure found', { userId });
      return createEmptyBloodPressureContext();
    }

    // Build context
    const context: BloodPressureContext = {
      hasBloodPressure: true,
      latestReadingDate: data.reading_date,
      reading: {
        systolic: data.systolic,
        diastolic: data.diastolic,
        heartRate: data.heart_rate,
        readingDate: data.reading_date,
        source: data.source,
      },
    };

    logger.info('✅ [BLOOD PRESSURE CONTEXT] Blood pressure loaded', {
      userId,
      latestReadingDate: context.latestReadingDate,
      systolic: context.reading.systolic,
      diastolic: context.reading.diastolic,
      hasHeartRate: context.reading.heartRate !== null,
      source: context.reading.source,
    });

    return context;
  } catch (error) {
    logger.error('❌ [BLOOD PRESSURE CONTEXT] Unexpected error', { userId, error });
    return createEmptyBloodPressureContext();
  }
}

/**
 * Create empty blood pressure context for fallback
 */
function createEmptyBloodPressureContext(): BloodPressureContext {
  return {
    hasBloodPressure: false,
    latestReadingDate: null,
    reading: {
      systolic: null,
      diastolic: null,
      heartRate: null,
      readingDate: null,
      source: null,
    },
  };
}

/**
 * Helper: Get systolic value (safe)
 */
export function getSystolic(context: BloodPressureContext): number | null {
  return context.reading.systolic;
}

/**
 * Helper: Get diastolic value (safe)
 */
export function getDiastolic(context: BloodPressureContext): number | null {
  return context.reading.diastolic;
}

/**
 * Helper: Validate BP reading is within reasonable range
 */
export function isValidBloodPressure(systolic: number | null, diastolic: number | null): boolean {
  if (systolic === null || diastolic === null) return false;
  
  // Reasonable BP ranges
  const systolicValid = systolic >= 70 && systolic <= 200;
  const diastolicValid = diastolic >= 40 && diastolic <= 130;
  
  return systolicValid && diastolicValid;
}

/**
 * Helper: Format BP for display
 */
export function formatBloodPressure(context: BloodPressureContext): string {
  if (!context.hasBloodPressure || context.reading.systolic === null || context.reading.diastolic === null) {
    return 'Not available';
  }

  const heartRate = context.reading.heartRate !== null 
    ? ` | ${context.reading.heartRate} bpm` 
    : '';

  return `${context.reading.systolic}/${context.reading.diastolic} mmHg${heartRate}`;
}
