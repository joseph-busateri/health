import { logger } from '../utils/logger';
import { getLatestBodyComposition } from './bodyCompositionService';
import type { BodyCompositionScan } from '../types/bodyComposition';

/**
 * Body Composition Context Service
 * 
 * Purpose: Provide read-only body composition access for engine consumption
 * - Fetches latest structured body composition values for a user
 * - Normalizes field access for engines
 * - Provides safe null handling
 * - Avoids each engine duplicating body composition queries
 * - Reuses existing bodyCompositionService retrieval logic
 */

export interface BodyCompositionContext {
  hasBodyComposition: boolean;
  latestScanDate: string | null;
  scanSource: string | null;
  
  // Core measurements
  weightLb: number | null;
  
  // Body composition percentages
  bodyFatPercentage: number | null;
  leanBodyMassPercentage: number | null;
  bodyWaterPercentage: number | null;
  
  // Mass measurements (in pounds)
  bodyFatMassLb: number | null;
  dryLeanMassLb: number | null;
  skeletalMuscleMassLb: number | null;
  totalBodyWaterLb: number | null;
  
  // Fat distribution
  visceralFatLevel: number | null;
  visceralFatAreaCm2: number | null;
  subcutaneousFatPercentage: number | null;
  
  // Metabolic metrics
  basalMetabolicRateKcal: number | null;
  totalEnergyExpenditureKcal: number | null;
  
  // Body metrics
  bmi: number | null;
  metabolicAge: number | null;
  
  // Advanced metrics
  proteinMassLb: number | null;
  boneMineralContentLb: number | null;
  
  // Segmental analysis (arms, legs, trunk)
  segmentalMuscle: {
    rightArmLb: number | null;
    leftArmLb: number | null;
    trunkLb: number | null;
    rightLegLb: number | null;
    leftLegLb: number | null;
  };
  
  segmentalFat: {
    rightArmLb: number | null;
    leftArmLb: number | null;
    trunkLb: number | null;
    rightLegLb: number | null;
    leftLegLb: number | null;
  };
  
  // Raw scan for advanced usage
  rawScan: BodyCompositionScan | null;
}

/**
 * Get latest body composition context for a user
 * Returns structured body composition data with safe null handling
 * Reuses existing getLatestBodyComposition from bodyCompositionService
 */
export async function getLatestBodyCompositionContext(userId: string): Promise<BodyCompositionContext> {
  try {
    logger.info('🔵 [BODY COMPOSITION CONTEXT] Fetching latest body composition', { userId });

    // Reuse existing service method
    const scan = await getLatestBodyComposition(userId);

    if (!scan) {
      logger.info('⚠️ [BODY COMPOSITION CONTEXT] No body composition found', { userId });
      return createEmptyBodyCompositionContext();
    }

    // Build context from scan
    const context: BodyCompositionContext = {
      hasBodyComposition: true,
      latestScanDate: scan.scanDate,
      scanSource: scan.scanSource,
      
      // Core measurements
      weightLb: scan.weightLb,
      
      // Percentages
      bodyFatPercentage: scan.bodyFatPercentage ?? null,
      leanBodyMassPercentage: scan.leanBodyMassPercentage ?? null,
      bodyWaterPercentage: scan.bodyWaterPercentage ?? null,
      
      // Mass measurements
      bodyFatMassLb: scan.bodyFatMassLb ?? null,
      dryLeanMassLb: scan.dryLeanMassLb ?? null,
      skeletalMuscleMassLb: scan.skeletalMuscleMassLb ?? null,
      totalBodyWaterLb: scan.totalBodyWaterLb ?? null,
      
      // Fat distribution
      visceralFatLevel: scan.visceralFatLevel ?? null,
      visceralFatAreaCm2: scan.visceralFatAreaCm2 ?? null,
      subcutaneousFatPercentage: scan.subcutaneousFatPercentage ?? null,
      
      // Metabolic
      basalMetabolicRateKcal: scan.basalMetabolicRateKcal ?? null,
      totalEnergyExpenditureKcal: scan.totalEnergyExpenditureKcal ?? null,
      
      // Body metrics
      bmi: scan.bmi ?? null,
      metabolicAge: scan.metabolicAge ?? null,
      
      // Advanced
      proteinMassLb: scan.proteinMassLb ?? null,
      boneMineralContentLb: scan.boneMineralContentLb ?? null,
      
      // Segmental muscle
      segmentalMuscle: {
        rightArmLb: scan.rightArmMuscleLb ?? null,
        leftArmLb: scan.leftArmMuscleLb ?? null,
        trunkLb: scan.trunkMuscleLb ?? null,
        rightLegLb: scan.rightLegMuscleLb ?? null,
        leftLegLb: scan.leftLegMuscleLb ?? null,
      },
      
      // Segmental fat
      segmentalFat: {
        rightArmLb: scan.rightArmFatLb ?? null,
        leftArmLb: scan.leftArmFatLb ?? null,
        trunkLb: scan.trunkFatLb ?? null,
        rightLegLb: scan.rightLegFatLb ?? null,
        leftLegLb: scan.leftLegFatLb ?? null,
      },
      
      // Raw scan for advanced usage
      rawScan: scan,
    };

    // Log summary
    logger.info('✅ [BODY COMPOSITION CONTEXT] Body composition loaded', {
      userId,
      latestScanDate: context.latestScanDate,
      scanSource: context.scanSource,
      hasBodyFatPercentage: context.bodyFatPercentage !== null,
      hasLeanMass: context.dryLeanMassLb !== null,
      hasBMR: context.basalMetabolicRateKcal !== null,
      hasVisceralFat: context.visceralFatLevel !== null,
    });

    return context;
  } catch (error) {
    logger.error('❌ [BODY COMPOSITION CONTEXT] Unexpected error', { userId, error });
    return createEmptyBodyCompositionContext();
  }
}

/**
 * Create empty body composition context for fallback
 */
function createEmptyBodyCompositionContext(): BodyCompositionContext {
  return {
    hasBodyComposition: false,
    latestScanDate: null,
    scanSource: null,
    weightLb: null,
    bodyFatPercentage: null,
    leanBodyMassPercentage: null,
    bodyWaterPercentage: null,
    bodyFatMassLb: null,
    dryLeanMassLb: null,
    skeletalMuscleMassLb: null,
    totalBodyWaterLb: null,
    visceralFatLevel: null,
    visceralFatAreaCm2: null,
    subcutaneousFatPercentage: null,
    basalMetabolicRateKcal: null,
    totalEnergyExpenditureKcal: null,
    bmi: null,
    metabolicAge: null,
    proteinMassLb: null,
    boneMineralContentLb: null,
    segmentalMuscle: {
      rightArmLb: null,
      leftArmLb: null,
      trunkLb: null,
      rightLegLb: null,
      leftLegLb: null,
    },
    segmentalFat: {
      rightArmLb: null,
      leftArmLb: null,
      trunkLb: null,
      rightLegLb: null,
      leftLegLb: null,
    },
    rawScan: null,
  };
}

/**
 * Helper: Calculate lean body mass in pounds
 * Uses dry lean mass if available, otherwise calculates from weight and body fat %
 */
export function calculateLeanBodyMassLb(context: BodyCompositionContext): number | null {
  if (context.dryLeanMassLb !== null) {
    return context.dryLeanMassLb;
  }
  
  if (context.weightLb !== null && context.bodyFatPercentage !== null) {
    const bodyFatMassLb = context.weightLb * (context.bodyFatPercentage / 100);
    return context.weightLb - bodyFatMassLb;
  }
  
  return null;
}

/**
 * Helper: Get body fat category
 */
export function getBodyFatCategory(bodyFatPercentage: number | null, sex: 'male' | 'female'): string {
  if (bodyFatPercentage === null) {
    return 'Unknown';
  }

  if (sex === 'male') {
    if (bodyFatPercentage < 6) return 'Essential';
    if (bodyFatPercentage < 14) return 'Athletic';
    if (bodyFatPercentage < 18) return 'Fitness';
    if (bodyFatPercentage < 25) return 'Average';
    return 'Obese';
  } else {
    if (bodyFatPercentage < 14) return 'Essential';
    if (bodyFatPercentage < 21) return 'Athletic';
    if (bodyFatPercentage < 25) return 'Fitness';
    if (bodyFatPercentage < 32) return 'Average';
    return 'Obese';
  }
}

/**
 * Helper: Get visceral fat risk level
 */
export function getVisceralFatRisk(visceralFatLevel: number | null): string {
  if (visceralFatLevel === null) {
    return 'Unknown';
  }

  if (visceralFatLevel < 10) return 'Normal';
  if (visceralFatLevel < 15) return 'Elevated';
  return 'High';
}

/**
 * Helper: Format body composition value for display
 */
export function formatBodyCompositionValue(value: number | null, unit: string): string {
  if (value === null) {
    return 'Not available';
  }
  
  return `${value.toFixed(1)} ${unit}`;
}
