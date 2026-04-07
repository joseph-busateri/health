/**
 * Bloodwork Vertical Slice - Phase 18
 * 
 * Purpose: End-to-end bloodwork integration
 * Flow: Ingestion → Intelligence → Control Tower → Execution → Prediction → Adjustment
 * 
 * Reuses:
 * - Existing bloodwork services (if available)
 * - Control Tower adapter
 * - Execution adapter
 * - Predictive behavior adapter
 * - Autonomous adjustment adapter
 */

import type { BloodworkSource, IngestionRequest, IngestionResult } from '../types/source';
import type { ExecutionTask } from '../types/execution';
import type { BehaviorPrediction } from '../types/predictiveBehavior';
import type { AutonomousAdjustment } from '../types/autonomousAdjustment';
import { SourceNormalizer } from '../ingestion/sourceNormalizer';
import { SourceRouter } from '../ingestion/sourceRouter';

// ============================================================================
// BLOODWORK SLICE SERVICE
// ============================================================================

export class BloodworkSliceService {
  /**
   * Process bloodwork upload end-to-end
   */
  static async processBloodwork(request: IngestionRequest): Promise<IngestionResult> {
    try {
      // 1. NORMALIZE
      const normalized = SourceNormalizer.normalize(request);
      if (!normalized) {
        return {
          success: false,
          errors: ['Failed to normalize bloodwork data'],
          processingTime: 0,
          intelligenceGenerated: false,
          controlTowerUpdated: false,
          executionTasksCreated: 0,
          predictionsGenerated: 0,
          adjustmentsGenerated: 0,
        };
      }

      // 2. ROUTE THROUGH VERTICAL SLICE
      const result = await SourceRouter.route(normalized);

      // 3. GENERATE INTELLIGENCE
      const intelligence = this.generateBloodworkIntelligence(normalized as BloodworkSource);

      // 4. CREATE EXECUTION TASKS
      const executionTasks = this.generateExecutionTasks(normalized as BloodworkSource, intelligence);
      result.executionTasksCreated = executionTasks.length;

      // 5. GENERATE PREDICTIONS
      const predictions = this.generatePredictions(normalized as BloodworkSource, intelligence);
      result.predictionsGenerated = predictions.length;

      // 6. GENERATE ADJUSTMENTS
      const adjustments = this.generateAdjustments(normalized as BloodworkSource, intelligence);
      result.adjustmentsGenerated = adjustments.length;

      return result;
    } catch (error) {
      console.error('Bloodwork slice processing error:', error);
      return {
        success: false,
        errors: [`Processing error: ${error}`],
        processingTime: 0,
        intelligenceGenerated: false,
        controlTowerUpdated: false,
        executionTasksCreated: 0,
        predictionsGenerated: 0,
        adjustmentsGenerated: 0,
      };
    }
  }

  /**
   * Generate bloodwork intelligence
   */
  private static generateBloodworkIntelligence(source: BloodworkSource): BloodworkIntelligence {
    const biomarkers = source.data.biomarkers;
    const criticalBiomarkers = biomarkers.filter(b => b.status === 'critical');
    const abnormalBiomarkers = biomarkers.filter(b => b.status === 'low' || b.status === 'high');

    return {
      sourceId: source.id,
      criticalCount: criticalBiomarkers.length,
      abnormalCount: abnormalBiomarkers.length,
      criticalBiomarkers: criticalBiomarkers.map(b => b.name),
      abnormalBiomarkers: abnormalBiomarkers.map(b => b.name),
      recommendations: this.generateRecommendations(biomarkers),
      priorityLevel: criticalBiomarkers.length > 0 ? 'critical' : 
                     abnormalBiomarkers.length > 2 ? 'high' : 'moderate',
    };
  }

  /**
   * Generate recommendations from biomarkers
   */
  private static generateRecommendations(biomarkers: any[]): string[] {
    const recommendations: string[] = [];

    biomarkers.forEach(biomarker => {
      if (biomarker.status === 'low' || biomarker.status === 'critical') {
        // Example recommendations based on common biomarkers
        if (biomarker.name.toLowerCase().includes('vitamin d')) {
          recommendations.push('Increase vitamin D supplementation');
          recommendations.push('Get 15-20 minutes of sunlight daily');
        }
        if (biomarker.name.toLowerCase().includes('iron') || biomarker.name.toLowerCase().includes('ferritin')) {
          recommendations.push('Increase iron-rich foods (red meat, spinach)');
          recommendations.push('Consider iron supplementation');
        }
        if (biomarker.name.toLowerCase().includes('b12')) {
          recommendations.push('Add B12 supplementation');
          recommendations.push('Increase animal protein intake');
        }
      }

      if (biomarker.status === 'high' || biomarker.status === 'critical') {
        if (biomarker.name.toLowerCase().includes('cholesterol') || biomarker.name.toLowerCase().includes('ldl')) {
          recommendations.push('Reduce saturated fat intake');
          recommendations.push('Increase fiber consumption');
          recommendations.push('Add omega-3 supplementation');
        }
        if (biomarker.name.toLowerCase().includes('glucose') || biomarker.name.toLowerCase().includes('a1c')) {
          recommendations.push('Reduce refined carbohydrate intake');
          recommendations.push('Increase protein and fiber');
          recommendations.push('Monitor blood sugar regularly');
        }
        if (biomarker.name.toLowerCase().includes('creatinine')) {
          recommendations.push('Increase hydration');
          recommendations.push('Reduce protein powder intake');
        }
      }
    });

    return [...new Set(recommendations)]; // Deduplicate
  }

  /**
   * Generate execution tasks from bloodwork
   */
  private static generateExecutionTasks(
    source: BloodworkSource,
    intelligence: BloodworkIntelligence
  ): ExecutionTask[] {
    const tasks: ExecutionTask[] = [];

    // Create tasks from recommendations
    intelligence.recommendations.slice(0, 3).forEach((recommendation, idx) => {
      const domain = this.inferDomain(recommendation);
      
      tasks.push({
        id: `bloodwork-task-${source.id}-${idx}`,
        domain,
        title: recommendation,
        description: `Based on bloodwork results from ${source.data.testDate}`,
        priority: intelligence.priorityLevel === 'critical' ? 'critical' : 'high',
        status: 'pending',
        expectedImpact: `Address ${intelligence.criticalBiomarkers.length > 0 ? 'critical' : 'abnormal'} biomarker levels`,
      });
    });

    return tasks;
  }

  /**
   * Generate behavior predictions from bloodwork
   */
  private static generatePredictions(
    source: BloodworkSource,
    intelligence: BloodworkIntelligence
  ): BehaviorPrediction[] {
    const predictions: BehaviorPrediction[] = [];

    // Predict adherence challenges based on recommendations
    if (intelligence.recommendations.length > 5) {
      predictions.push({
        id: `bloodwork-pred-${source.id}`,
        predictionType: 'adherenceRisk',
        probability: 0.7,
        confidence: 0.75,
        timeframe: 'day',
        explanation: `${intelligence.recommendations.length} dietary changes recommended - high adherence challenge`,
        recommendedAction: 'Prioritize top 3 most critical changes',
        timestamp: new Date().toISOString(),
      });
    }

    return predictions;
  }

  /**
   * Generate autonomous adjustments from bloodwork
   */
  private static generateAdjustments(
    source: BloodworkSource,
    intelligence: BloodworkIntelligence
  ): AutonomousAdjustment[] {
    const adjustments: AutonomousAdjustment[] = [];

    // Suggest nutrition adjustments for critical biomarkers
    if (intelligence.criticalCount > 0) {
      adjustments.push({
        id: `bloodwork-adj-${source.id}`,
        domain: 'nutrition',
        adjustmentType: 'adjustNutrition',
        reason: `${intelligence.criticalCount} critical biomarker(s) detected - nutrition adjustment needed`,
        confidence: 0.85,
        impact: 'major',
        status: 'pending',
        triggers: intelligence.criticalBiomarkers,
        expectedOutcome: 'Improve biomarker levels through targeted nutrition',
        reversible: true,
        requiresConfirmation: true,
        createdAt: new Date().toISOString(),
      });
    }

    return adjustments;
  }

  /**
   * Infer execution domain from recommendation
   */
  private static inferDomain(recommendation: string): 'workout' | 'recovery' | 'nutrition' | 'supplements' {
    const lower = recommendation.toLowerCase();
    
    if (lower.includes('supplement')) return 'supplements';
    if (lower.includes('food') || lower.includes('diet') || lower.includes('intake') || lower.includes('fiber')) {
      return 'nutrition';
    }
    if (lower.includes('sleep') || lower.includes('rest') || lower.includes('recovery')) {
      return 'recovery';
    }
    if (lower.includes('exercise') || lower.includes('workout')) return 'workout';
    
    return 'nutrition'; // Default
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface BloodworkIntelligence {
  sourceId: string;
  criticalCount: number;
  abnormalCount: number;
  criticalBiomarkers: string[];
  abnormalBiomarkers: string[];
  recommendations: string[];
  priorityLevel: 'critical' | 'high' | 'moderate' | 'low';
}
