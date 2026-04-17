import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabase = createClient<any>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Bloodwork Context Service
 * 
 * Purpose: Provide read-only bloodwork access for engine consumption
 * - Fetches latest structured bloodwork values for a user
 * - Normalizes marker access for engines
 * - Provides safe null handling
 * - Avoids each engine duplicating bloodwork queries
 */

export interface BloodworkMarker {
  normalized_test_name: string;
  value_numeric: number | null;
  value_text: string | null;
  unit: string | null;
  test_date: string | null;
  reference_range_low: number | null;
  reference_range_high: number | null;
  abnormal_flag: string | null;
  category: string | null;
}

export interface BloodworkContext {
  hasBloodwork: boolean;
  latestTestDate: string | null;
  markers: {
    // Metabolic markers
    glucose: BloodworkMarker | null;
    a1c: BloodworkMarker | null;
    insulin: BloodworkMarker | null;
    
    // Lipid panel
    totalCholesterol: BloodworkMarker | null;
    ldl: BloodworkMarker | null;
    hdl: BloodworkMarker | null;
    triglycerides: BloodworkMarker | null;
    apoB: BloodworkMarker | null;
    lpa: BloodworkMarker | null;
    
    // Inflammation
    hsCRP: BloodworkMarker | null;
    
    // Hormonal
    totalTestosterone: BloodworkMarker | null;
    freeTestosterone: BloodworkMarker | null;
    estradiol: BloodworkMarker | null;
    shbg: BloodworkMarker | null;
    psa: BloodworkMarker | null;
    
    // Hematology
    hematocrit: BloodworkMarker | null;
    hemoglobin: BloodworkMarker | null;
    
    // Vitamins/Minerals
    vitaminD: BloodworkMarker | null;
    b12: BloodworkMarker | null;
    folate: BloodworkMarker | null;
    ferritin: BloodworkMarker | null;
    magnesium: BloodworkMarker | null;
    
    // Liver
    alt: BloodworkMarker | null;
    ast: BloodworkMarker | null;
    
    // Renal
    creatinine: BloodworkMarker | null;
    egfr: BloodworkMarker | null;
    
    // Thyroid
    tsh: BloodworkMarker | null;
    t3: BloodworkMarker | null;
    t4: BloodworkMarker | null;
  };
}

/**
 * Get latest bloodwork context for a user
 * Returns structured bloodwork markers with safe null handling
 */
export async function getLatestBloodworkContext(userId: string): Promise<BloodworkContext> {
  try {
    logger.info('🔵 [BLOODWORK CONTEXT] Fetching latest bloodwork', { userId });

    // Fetch all bloodwork results for user, ordered by test date
    const { data: results, error } = await supabase
      .from('bloodwork_results')
      .select('normalized_test_name, value_numeric, value_text, unit, test_date, reference_range_low, reference_range_high, abnormal_flag, category')
      .eq('user_id', userId)
      .not('test_date', 'is', null)
      .order('test_date', { ascending: false });

    if (error) {
      logger.error('❌ [BLOODWORK CONTEXT] Query error', { userId, error: error.message });
      return createEmptyBloodworkContext();
    }

    if (!results || results.length === 0) {
      logger.info('⚠️ [BLOODWORK CONTEXT] No bloodwork found', { userId });
      return createEmptyBloodworkContext();
    }

    // Get latest test date
    const latestTestDate = results[0].test_date;

    // Map normalized test names to markers
    const markerMap = new Map<string, BloodworkMarker>();
    
    for (const result of results) {
      const normalizedName = result.normalized_test_name?.toLowerCase();
      if (!normalizedName || markerMap.has(normalizedName)) {
        continue; // Skip if already have latest for this marker
      }

      markerMap.set(normalizedName, {
        normalized_test_name: result.normalized_test_name || '',
        value_numeric: result.value_numeric,
        value_text: result.value_text,
        unit: result.unit,
        test_date: result.test_date,
        reference_range_low: result.reference_range_low,
        reference_range_high: result.reference_range_high,
        abnormal_flag: result.abnormal_flag,
        category: result.category,
      });
    }

    // Build context with explicit marker mappings
    const context: BloodworkContext = {
      hasBloodwork: true,
      latestTestDate,
      markers: {
        // Metabolic
        glucose: getMarker(markerMap, ['glucose']),
        a1c: getMarker(markerMap, ['hemoglobin a1c', 'a1c', 'hba1c']),
        insulin: getMarker(markerMap, ['insulin']),
        
        // Lipid panel
        totalCholesterol: getMarker(markerMap, ['cholesterol, total', 'total cholesterol']),
        ldl: getMarker(markerMap, ['ldl', 'ldl cholesterol']),
        hdl: getMarker(markerMap, ['hdl', 'hdl cholesterol']),
        triglycerides: getMarker(markerMap, ['triglycerides']),
        apoB: getMarker(markerMap, ['apolipoprotein b', 'apob', 'apo b']),
        lpa: getMarker(markerMap, ['lipoprotein(a)', 'lp(a)', 'lpa']),
        
        // Inflammation
        hsCRP: getMarker(markerMap, ['c-reactive protein, high sensitivity', 'hscrp', 'hs-crp']),
        
        // Hormonal
        totalTestosterone: getMarker(markerMap, ['testosterone, total', 'total testosterone']),
        freeTestosterone: getMarker(markerMap, ['testosterone, free', 'free testosterone']),
        estradiol: getMarker(markerMap, ['estradiol']),
        shbg: getMarker(markerMap, ['shbg', 'sex hormone binding globulin']),
        psa: getMarker(markerMap, ['psa', 'prostate specific antigen']),
        
        // Hematology
        hematocrit: getMarker(markerMap, ['hct', 'hematocrit']),
        hemoglobin: getMarker(markerMap, ['hgb', 'hemoglobin']),
        
        // Vitamins/Minerals
        vitaminD: getMarker(markerMap, ['vitamin d, 25-hydroxy', 'vitamin d', '25-hydroxyvitamin d']),
        b12: getMarker(markerMap, ['vitamin b12', 'b12', 'cobalamin']),
        folate: getMarker(markerMap, ['folate', 'folic acid']),
        ferritin: getMarker(markerMap, ['ferritin']),
        magnesium: getMarker(markerMap, ['magnesium']),
        
        // Liver
        alt: getMarker(markerMap, ['alt', 'alanine aminotransferase']),
        ast: getMarker(markerMap, ['ast', 'aspartate aminotransferase']),
        
        // Renal
        creatinine: getMarker(markerMap, ['creatinine']),
        egfr: getMarker(markerMap, ['egfrcr', 'egfr']),
        
        // Thyroid
        tsh: getMarker(markerMap, ['tsh', 'thyroid stimulating hormone']),
        t3: getMarker(markerMap, ['t3', 'triiodothyronine']),
        t4: getMarker(markerMap, ['t4', 'thyroxine']),
      },
    };

    // Log summary
    const markerCount = Object.values(context.markers).filter(m => m !== null).length;
    logger.info('✅ [BLOODWORK CONTEXT] Bloodwork loaded', {
      userId,
      latestTestDate,
      markerCount,
      totalResults: results.length,
    });

    return context;
  } catch (error) {
    logger.error('❌ [BLOODWORK CONTEXT] Unexpected error', { userId, error });
    return createEmptyBloodworkContext();
  }
}

/**
 * Get a specific bloodwork marker by normalized name
 * Tries multiple name variations
 */
function getMarker(
  markerMap: Map<string, BloodworkMarker>,
  nameVariations: string[]
): BloodworkMarker | null {
  for (const name of nameVariations) {
    const marker = markerMap.get(name.toLowerCase());
    if (marker) {
      return marker;
    }
  }
  return null;
}

/**
 * Create empty bloodwork context for fallback
 */
function createEmptyBloodworkContext(): BloodworkContext {
  return {
    hasBloodwork: false,
    latestTestDate: null,
    markers: {
      glucose: null,
      a1c: null,
      insulin: null,
      totalCholesterol: null,
      ldl: null,
      hdl: null,
      triglycerides: null,
      apoB: null,
      lpa: null,
      hsCRP: null,
      totalTestosterone: null,
      freeTestosterone: null,
      estradiol: null,
      shbg: null,
      psa: null,
      hematocrit: null,
      hemoglobin: null,
      vitaminD: null,
      b12: null,
      folate: null,
      ferritin: null,
      magnesium: null,
      alt: null,
      ast: null,
      creatinine: null,
      egfr: null,
      tsh: null,
      t3: null,
      t4: null,
    },
  };
}

/**
 * Helper: Check if marker is abnormal (out of reference range)
 */
export function isMarkerAbnormal(marker: BloodworkMarker | null): boolean {
  if (!marker || marker.value_numeric === null) {
    return false;
  }

  // Check explicit abnormal flag
  if (marker.abnormal_flag && marker.abnormal_flag.toLowerCase() !== 'false') {
    return true;
  }

  // Check reference range
  if (marker.reference_range_low !== null && marker.value_numeric < marker.reference_range_low) {
    return true;
  }

  if (marker.reference_range_high !== null && marker.value_numeric > marker.reference_range_high) {
    return true;
  }

  return false;
}

/**
 * Helper: Get marker value as number (safe)
 */
export function getMarkerValue(marker: BloodworkMarker | null): number | null {
  return marker?.value_numeric ?? null;
}

/**
 * Helper: Format marker for display
 */
export function formatMarker(marker: BloodworkMarker | null): string {
  if (!marker) {
    return 'Not available';
  }

  if (marker.value_numeric !== null && marker.unit) {
    return `${marker.value_numeric} ${marker.unit}`;
  }

  return marker.value_text || 'Not available';
}
