import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

/**
 * Fitness Context Service
 * 
 * Purpose: Provide fitness metrics access for engine consumption
 * - Fetches VO2 Max from Apple Watch data
 * - Provides safe null handling
 * - Avoids each engine duplicating fitness queries
 * 
 * NOTE: VO2 Max is currently NOT used in cardiovascular risk calculations
 * This service is created for Phase 19 cardiovascular data unification
 * and future enhancement of risk algorithms
 */

export interface FitnessContext {
  hasVO2Max: boolean;
  vo2Max: number | null; // ml/kg/min
  lastUpdated: string | null;
  source: 'apple_watch' | 'none';
}

/**
 * Get latest fitness context for a user
 * Returns VO2 Max data with safe null handling
 */
export async function getLatestFitnessContext(userId: string): Promise<FitnessContext> {
  try {
    logger.info('🔵 [FITNESS CONTEXT] Fetching VO2 Max data', { userId });

    // Fetch latest VO2 Max from Apple Watch
    const { data, error } = await supabase
      .from('apple_watch_health_data')
      .select('vo2_max, date')
      .eq('user_id', userId)
      .not('vo2_max', 'is', null)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('❌ [FITNESS CONTEXT] Query error', { userId, error: error.message });
      return createEmptyFitnessContext();
    }

    if (!data || data.vo2_max === null) {
      logger.info('⚠️ [FITNESS CONTEXT] No VO2 Max data found', { userId });
      return createEmptyFitnessContext();
    }

    // Build context
    const context: FitnessContext = {
      hasVO2Max: true,
      vo2Max: data.vo2_max,
      lastUpdated: data.date,
      source: 'apple_watch',
    };

    logger.info('✅ [FITNESS CONTEXT] VO2 Max loaded', {
      userId,
      vo2Max: context.vo2Max,
      lastUpdated: context.lastUpdated,
    });

    return context;
  } catch (error) {
    logger.error('❌ [FITNESS CONTEXT] Unexpected error', { userId, error });
    return createEmptyFitnessContext();
  }
}

/**
 * Create empty fitness context for fallback
 */
function createEmptyFitnessContext(): FitnessContext {
  return {
    hasVO2Max: false,
    vo2Max: null,
    lastUpdated: null,
    source: 'none',
  };
}

/**
 * Helper: Get VO2 Max value (safe)
 */
export function getVO2Max(context: FitnessContext): number | null {
  return context.vo2Max;
}

/**
 * Helper: Validate VO2 Max is within reasonable range
 */
export function isValidVO2Max(vo2Max: number | null): boolean {
  if (vo2Max === null) return false;
  
  // Reasonable VO2 Max range: 10-100 ml/kg/min
  return vo2Max >= 10 && vo2Max <= 100;
}

/**
 * Helper: Format VO2 Max for display
 */
export function formatVO2Max(context: FitnessContext): string {
  if (!context.hasVO2Max || context.vo2Max === null) {
    return 'Not available';
  }

  return `${context.vo2Max.toFixed(1)} ml/kg/min`;
}

/**
 * Helper: Interpret VO2 Max fitness level
 * Based on age and gender norms
 */
export function interpretVO2MaxLevel(
  vo2Max: number | null,
  age: number,
  gender: 'male' | 'female'
): 'superior' | 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
  if (vo2Max === null) return 'unknown';

  // Simplified interpretation (age-adjusted norms)
  if (gender === 'male') {
    if (age < 30) {
      if (vo2Max >= 55) return 'superior';
      if (vo2Max >= 48) return 'excellent';
      if (vo2Max >= 42) return 'good';
      if (vo2Max >= 35) return 'fair';
      return 'poor';
    } else if (age < 40) {
      if (vo2Max >= 52) return 'superior';
      if (vo2Max >= 45) return 'excellent';
      if (vo2Max >= 39) return 'good';
      if (vo2Max >= 33) return 'fair';
      return 'poor';
    } else if (age < 50) {
      if (vo2Max >= 48) return 'superior';
      if (vo2Max >= 42) return 'excellent';
      if (vo2Max >= 36) return 'good';
      if (vo2Max >= 30) return 'fair';
      return 'poor';
    } else {
      if (vo2Max >= 45) return 'superior';
      if (vo2Max >= 39) return 'excellent';
      if (vo2Max >= 33) return 'good';
      if (vo2Max >= 27) return 'fair';
      return 'poor';
    }
  } else {
    // Female norms
    if (age < 30) {
      if (vo2Max >= 49) return 'superior';
      if (vo2Max >= 43) return 'excellent';
      if (vo2Max >= 37) return 'good';
      if (vo2Max >= 31) return 'fair';
      return 'poor';
    } else if (age < 40) {
      if (vo2Max >= 46) return 'superior';
      if (vo2Max >= 40) return 'excellent';
      if (vo2Max >= 34) return 'good';
      if (vo2Max >= 28) return 'fair';
      return 'poor';
    } else if (age < 50) {
      if (vo2Max >= 42) return 'superior';
      if (vo2Max >= 37) return 'excellent';
      if (vo2Max >= 31) return 'good';
      if (vo2Max >= 25) return 'fair';
      return 'poor';
    } else {
      if (vo2Max >= 39) return 'superior';
      if (vo2Max >= 34) return 'excellent';
      if (vo2Max >= 28) return 'good';
      if (vo2Max >= 22) return 'fair';
      return 'poor';
    }
  }
}
