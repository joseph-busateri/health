/**
 * Recovery + Device Vertical Slice - Phase 18
 * 
 * Purpose: End-to-end recovery + device intelligence integration
 * Flow: Device Data → Recovery Intelligence → Prediction → Adjustment
 * 
 * Reuses:
 * - Device Intelligence (Phase 14)
 * - Predictive Behavior (Phase 16)
 * - Autonomous Adjustment (Phase 17)
 */

import type { DeviceSource, IngestionRequest, IngestionResult } from '../types/source';
import type { BehaviorPrediction } from '../types/predictiveBehavior';
import type { AutonomousAdjustment } from '../types/autonomousAdjustment';
import { SourceNormalizer } from '../ingestion/sourceNormalizer';
import { SourceRouter } from '../ingestion/sourceRouter';

// ============================================================================
// RECOVERY SLICE SERVICE
// ============================================================================

export class RecoverySliceService {
  /**
   * Process device data end-to-end
   */
  static async processDeviceData(request: IngestionRequest): Promise<IngestionResult> {
    try {
      const normalized = SourceNormalizer.normalize(request);
      if (!normalized) {
        return this.getFailedResult('Failed to normalize device data');
      }

      const result = await SourceRouter.route(normalized);
      const intelligence = this.generateRecoveryIntelligence(normalized as DeviceSource);
      const predictions = this.generatePredictions(normalized as DeviceSource, intelligence);
      const adjustments = this.generateAdjustments(normalized as DeviceSource, intelligence);

      result.predictionsGenerated = predictions.length;
      result.adjustmentsGenerated = adjustments.length;

      return result;
    } catch (error) {
      console.error('Recovery slice processing error:', error);
      return this.getFailedResult(`Processing error: ${error}`);
    }
  }

  /**
   * Generate recovery intelligence from device data
   */
  private static generateRecoveryIntelligence(source: DeviceSource): RecoveryIntelligence {
    const metrics = source.data.metrics;
    
    const recoveryScore = this.calculateRecoveryScore(metrics);
    const fatigueRisk = this.assessFatigueRisk(metrics);
    const sleepQuality = metrics.sleep?.quality || 0;
    const hrvStatus = this.assessHRVStatus(metrics.hrv);

    return {
      sourceId: source.id,
      deviceType: source.data.deviceType,
      recoveryScore,
      fatigueRisk,
      sleepQuality,
      hrvStatus,
      restingHR: metrics.restingHR,
      recommendations: this.generateRecoveryRecommendations(recoveryScore, fatigueRisk, sleepQuality),
    };
  }

  /**
   * Calculate overall recovery score
   */
  private static calculateRecoveryScore(metrics: any): number {
    let score = 50; // Base score

    // HRV contribution (30%)
    if (metrics.hrv) {
      if (metrics.hrv >= 60) score += 30;
      else if (metrics.hrv >= 40) score += 20;
      else if (metrics.hrv >= 20) score += 10;
    }

    // Sleep contribution (40%)
    if (metrics.sleep) {
      const sleepScore = metrics.sleep.quality || 0;
      score += sleepScore * 0.4;
    }

    // Recovery score contribution (30%)
    if (metrics.recovery?.score) {
      score += metrics.recovery.score * 0.3;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Assess fatigue risk
   */
  private static assessFatigueRisk(metrics: any): 'low' | 'moderate' | 'high' {
    const strain = metrics.recovery?.strain || 0;
    const sleepDuration = metrics.sleep?.duration || 0;
    const hrv = metrics.hrv || 0;

    if (strain > 15 || sleepDuration < 6 || hrv < 20) return 'high';
    if (strain > 10 || sleepDuration < 7 || hrv < 40) return 'moderate';
    return 'low';
  }

  /**
   * Assess HRV status
   */
  private static assessHRVStatus(hrv?: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!hrv) return 'fair';
    if (hrv >= 60) return 'excellent';
    if (hrv >= 40) return 'good';
    if (hrv >= 20) return 'fair';
    return 'poor';
  }

  /**
   * Generate recovery recommendations
   */
  private static generateRecoveryRecommendations(
    recoveryScore: number,
    fatigueRisk: 'low' | 'moderate' | 'high',
    sleepQuality: number
  ): string[] {
    const recommendations: string[] = [];

    if (recoveryScore < 50) {
      recommendations.push('Prioritize recovery today');
      recommendations.push('Consider active recovery instead of intense training');
    }

    if (fatigueRisk === 'high') {
      recommendations.push('High fatigue detected - reduce workout intensity');
      recommendations.push('Add extra rest day this week');
    }

    if (sleepQuality < 60) {
      recommendations.push('Improve sleep quality tonight');
      recommendations.push('Aim for 8+ hours of sleep');
      recommendations.push('Reduce caffeine after 2pm');
    }

    if (recoveryScore >= 80) {
      recommendations.push('Excellent recovery - good day for intense training');
    }

    return recommendations;
  }

  /**
   * Generate behavior predictions
   */
  private static generatePredictions(
    source: DeviceSource,
    intelligence: RecoveryIntelligence
  ): BehaviorPrediction[] {
    const predictions: BehaviorPrediction[] = [];

    // Predict workout adherence based on recovery
    if (intelligence.recoveryScore < 50) {
      predictions.push({
        id: `recovery-pred-adherence-${source.id}`,
        predictionType: 'adherenceRisk',
        probability: 0.7,
        confidence: 0.8,
        timeframe: 'day',
        explanation: `Low recovery score (${intelligence.recoveryScore}) suggests high workout skip risk`,
        recommendedAction: 'Reduce workout intensity or switch to active recovery',
        timestamp: new Date().toISOString(),
      });
    }

    // Predict fatigue accumulation
    if (intelligence.fatigueRisk === 'high') {
      predictions.push({
        id: `recovery-pred-fatigue-${source.id}`,
        predictionType: 'executionDrift',
        probability: 0.8,
        confidence: 0.85,
        timeframe: 'day',
        explanation: 'High fatigue risk - performance likely to decline',
        recommendedAction: 'Add rest day or reduce training volume',
        timestamp: new Date().toISOString(),
      });
    }

    return predictions;
  }

  /**
   * Generate autonomous adjustments
   */
  private static generateAdjustments(
    source: DeviceSource,
    intelligence: RecoveryIntelligence
  ): AutonomousAdjustment[] {
    const adjustments: AutonomousAdjustment[] = [];

    // Reduce workout intensity for poor recovery
    if (intelligence.recoveryScore < 40) {
      adjustments.push({
        id: `recovery-adj-reduce-${source.id}`,
        domain: 'workout',
        adjustmentType: 'reduceIntensity',
        reason: `Poor recovery detected (score: ${intelligence.recoveryScore}) - reducing workout intensity`,
        confidence: 0.85,
        impact: 'moderate',
        status: 'pending',
        originalValue: '100% intensity',
        adjustedValue: '70% intensity',
        triggers: [`Recovery score: ${intelligence.recoveryScore}`, `Fatigue risk: ${intelligence.fatigueRisk}`],
        expectedOutcome: 'Prevent overtraining and improve recovery',
        reversible: true,
        requiresConfirmation: true,
        createdAt: new Date().toISOString(),
      });
    }

    // Increase recovery for high fatigue
    if (intelligence.fatigueRisk === 'high') {
      adjustments.push({
        id: `recovery-adj-increase-${source.id}`,
        domain: 'recovery',
        adjustmentType: 'increaseRecovery',
        reason: 'High fatigue risk detected - adding recovery day',
        confidence: 0.9,
        impact: 'major',
        status: 'pending',
        triggers: [`Fatigue risk: ${intelligence.fatigueRisk}`],
        expectedOutcome: 'Reduce fatigue and improve performance',
        reversible: true,
        requiresConfirmation: true,
        createdAt: new Date().toISOString(),
      });
    }

    return adjustments;
  }

  private static getFailedResult(error: string): IngestionResult {
    return {
      success: false,
      errors: [error],
      processingTime: 0,
      intelligenceGenerated: false,
      controlTowerUpdated: false,
      executionTasksCreated: 0,
      predictionsGenerated: 0,
      adjustmentsGenerated: 0,
    };
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface RecoveryIntelligence {
  sourceId: string;
  deviceType: string;
  recoveryScore: number;
  fatigueRisk: 'low' | 'moderate' | 'high';
  sleepQuality: number;
  hrvStatus: 'excellent' | 'good' | 'fair' | 'poor';
  restingHR?: number;
  recommendations: string[];
}
