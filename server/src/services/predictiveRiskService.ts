import { logger } from '../utils/logger';
import type { PredictiveRiskLevel, TrendAnalysisResult } from '../types/predictiveIntelligence';

export function detectPredictiveRisk(trendAnalysis: TrendAnalysisResult): PredictiveRiskLevel {
  const { recoveryTrend, stressTrend, jointTrend } = trendAnalysis;

  logger.info('🔵 Detecting predictive risk', {
    recoveryTrend,
    stressTrend,
    jointTrend,
  });

  // Rule 1: Recovery declining + stress declining → high risk (overtraining)
  if (recoveryTrend === 'declining' && stressTrend === 'declining') {
    logger.warn('⚠️  High risk detected: Recovery declining + Stress rising', {
      recoveryTrend,
      stressTrend,
    });
    return 'high';
  }

  // Rule 2: Joint risk increasing → high risk (injury risk)
  if (jointTrend === 'declining') {
    logger.warn('⚠️  High risk detected: Joint health declining', {
      jointTrend,
    });
    return 'high';
  }

  // Rule 3: Recovery declining + joint declining → critical (mapped to high)
  if (recoveryTrend === 'declining' && jointTrend === 'declining') {
    logger.warn('⚠️  High risk detected: Recovery declining + Joint declining', {
      recoveryTrend,
      jointTrend,
    });
    return 'high';
  }

  // Rule 4: Stress accumulating (declining trend) → important (mapped to moderate)
  if (stressTrend === 'declining') {
    logger.info('ℹ️  Moderate risk detected: Stress accumulating', {
      stressTrend,
    });
    return 'moderate';
  }

  // Rule 5: Multiple moderate trends → important (mapped to moderate)
  const moderateTrends = [
    recoveryTrend === 'stable',
    stressTrend === 'stable',
    jointTrend === 'stable',
  ].filter(Boolean).length;

  if (moderateTrends >= 2) {
    logger.info('ℹ️  Moderate risk detected: Multiple stable trends', {
      moderateTrends,
    });
    return 'moderate';
  }

  // Rule 6: Recovery declining alone → moderate
  if (recoveryTrend === 'declining') {
    logger.info('ℹ️  Moderate risk detected: Recovery declining', {
      recoveryTrend,
    });
    return 'moderate';
  }

  // Rule 7: All improving → optimization (mapped to low)
  if (
    recoveryTrend === 'improving' &&
    stressTrend === 'improving' &&
    jointTrend === 'improving'
  ) {
    logger.info('✅ Low risk detected: All trends improving', {
      recoveryTrend,
      stressTrend,
      jointTrend,
    });
    return 'low';
  }

  // Default: low risk
  logger.info('✅ Low risk detected: Default case', {
    recoveryTrend,
    stressTrend,
    jointTrend,
  });
  return 'low';
}
