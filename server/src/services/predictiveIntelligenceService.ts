import { randomUUID } from 'crypto';
import { getRecoveryHistory } from './recoveryEngineService';
import { getStressHistory } from './stressEngineService';
import { getJointHealthHistory } from './jointHealthEngineService';
import { analyzeTrends } from './trendAnalysisService';
import { detectPredictiveRisk } from './predictiveRiskService';
import { enrichPredictiveRecommendationWithAI, buildPredictiveFallbackRecommendation } from './predictiveAIEnrichment';
import { normalizePredictiveRecommendation } from './predictiveRecommendationNormalizer';
import { validatePredictiveRecommendation } from './predictiveRecommendationValidator';
import { logger } from '../utils/logger';
import type { PredictiveRecord, PredictiveEvidence, TrendAnalysisInput } from '../types/predictiveIntelligence';

const predictiveStore = new Map<string, PredictiveRecord[]>();

async function fetchHistoricalData(userId: string): Promise<TrendAnalysisInput> {
  logger.info('🔵 Fetching historical data for trend analysis', { userId });

  const [recoveryHistory, stressHistory, jointHistory] = await Promise.all([
    getRecoveryHistory(userId),
    getStressHistory(userId),
    getJointHealthHistory(userId),
  ]);

  const recoveryData = recoveryHistory
    .slice(-7)
    .map(record => ({
      date: record.date,
      score: record.recoveryScore,
    }));

  const stressData = stressHistory
    .slice(-7)
    .map(record => ({
      date: record.date,
      score: record.stressScore,
    }));

  const jointData = jointHistory
    .slice(-7)
    .map(record => ({
      date: record.date,
      riskLevel: record.riskLevel,
    }));

  logger.info('✅ Historical data fetched', {
    userId,
    recoveryDays: recoveryData.length,
    stressDays: stressData.length,
    jointDays: jointData.length,
  });

  return {
    recoveryHistory: recoveryData,
    stressHistory: stressData,
    jointHistory: jointData,
  };
}

export async function getPredictiveToday(
  userId: string,
  options?: { regenerate?: boolean },
): Promise<PredictiveRecord> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = predictiveStore.get(userId)?.find(record => record.date === date);
  if (existing && !options?.regenerate) {
    logger.info('📋 Returning cached predictive record', { userId, date });
    return existing;
  }

  logger.info('🔵 Starting predictive intelligence analysis', { userId });

  // Step 1: Fetch historical data
  const historicalData = await fetchHistoricalData(userId);

  // Check if we have enough data
  if (
    historicalData.recoveryHistory.length < 2 &&
    historicalData.stressHistory.length < 2 &&
    historicalData.jointHistory.length < 2
  ) {
    logger.warn('⚠️  Insufficient historical data for trend analysis', {
      userId,
      recoveryDays: historicalData.recoveryHistory.length,
      stressDays: historicalData.stressHistory.length,
      jointDays: historicalData.jointHistory.length,
    });

    const insufficientDataRecord: PredictiveRecord = {
      id: randomUUID(),
      userId,
      date,
      riskLevel: 'low',
      evidence: {
        signals: [],
        summary: 'Insufficient historical data for trend analysis. Continue monitoring.',
      },
      recommendation: {
        type: 'predictive',
        priority: 'optimization',
        summary: 'Not enough data yet for predictive analysis. Continue tracking metrics.',
        actions: ['Continue logging recovery, stress, and joint data', 'Check back after 3+ days of data'],
        source: 'fallback',
      },
      createdAt: new Date().toISOString(),
    };

    const history = predictiveStore.get(userId) ?? [];
    predictiveStore.set(userId, [insufficientDataRecord, ...history]);

    return insufficientDataRecord;
  }

  // Step 2: Analyze trends
  const trendAnalysis = analyzeTrends(historicalData);

  // Step 3: Build evidence
  const evidence: PredictiveEvidence = {
    signals: trendAnalysis.signals,
    summary: `Analyzed ${historicalData.recoveryHistory.length} days of recovery, ${historicalData.stressHistory.length} days of stress, and ${historicalData.jointHistory.length} days of joint data.`,
  };

  logger.info('📊 Evidence built', {
    userId,
    signalCount: evidence.signals.length,
  });

  // Step 4: Detect risk
  const riskLevel = detectPredictiveRisk(trendAnalysis);

  logger.info('⚠️  Predictive risk detected', {
    userId,
    riskLevel,
  });

  // Step 5: Build fallback recommendation
  const fallbackRecommendation = buildPredictiveFallbackRecommendation(riskLevel, evidence);

  // Step 6: AI enrichment (if enabled and risk is moderate/high)
  const useAI = process.env.USE_AI_ENRICHMENT === 'true' && 
                process.env.USE_AI_ENRICHMENT_PREDICTIVE === 'true' &&
                (riskLevel === 'moderate' || riskLevel === 'high');

  let finalRecommendation = fallbackRecommendation;

  if (useAI) {
    logger.info('🟢 AI enrichment enabled for predictive recommendation', {
      userId,
      riskLevel,
    });

    const aiResult = await enrichPredictiveRecommendationWithAI(evidence, riskLevel);

    if (aiResult.success && aiResult.output) {
      const normalized = normalizePredictiveRecommendation(aiResult.output, fallbackRecommendation);
      const validation = validatePredictiveRecommendation(normalized);

      if (validation.valid) {
        finalRecommendation = normalized;
        logger.info('✅ AI-enriched predictive recommendation validated', { userId });
      } else {
        logger.warn('⚠️  AI-enriched recommendation failed validation, using fallback', {
          userId,
          errors: validation.errors,
        });
      }
    } else {
      logger.warn('⚠️  AI enrichment failed, using fallback', {
        userId,
        error: aiResult.error,
      });
    }
  } else {
    logger.info('ℹ️  Using fallback predictive recommendation', {
      userId,
      reason: !useAI ? 'AI disabled or low risk' : 'unknown',
    });
  }

  // Step 7: Create record
  const record: PredictiveRecord = {
    id: randomUUID(),
    userId,
    date,
    riskLevel,
    evidence,
    recommendation: finalRecommendation,
    createdAt: new Date().toISOString(),
  };

  // Step 8: Store record
  const history = predictiveStore.get(userId) ?? [];
  predictiveStore.set(userId, [record, ...history]);

  logger.info('✅ Predictive intelligence analysis complete', {
    userId,
    riskLevel,
    priority: finalRecommendation.priority,
    source: finalRecommendation.source,
  });

  return record;
}

export async function getPredictiveHistory(userId: string): Promise<PredictiveRecord[]> {
  return predictiveStore.get(userId) ?? [];
}
