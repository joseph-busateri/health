/**
 * Base Orchestrator - Phase 20
 * 
 * Purpose: Base class for all vertical slice orchestrators
 * Provides: Common orchestration patterns, provenance tracking, propagation
 */

import { logger } from '../utils/logger';
import { SourceProvenanceService, SourceProvenance, SourceType, SourceSystem } from '../services/sourceProvenanceService';

// ============================================================================
// ORCHESTRATION RESULT
// ============================================================================

export interface OrchestrationResult {
  success: boolean;
  orchestrationId: string;
  userId: string;
  sliceName: string;
  
  // Provenance
  provenanceId?: string;
  
  // Processing steps
  steps: OrchestrationStep[];
  
  // Propagation results
  propagation: {
    controlTower: boolean;
    execution: boolean;
    predictions: boolean;
    adjustments: boolean;
    goalProgress: boolean;
  };
  
  // Explainability
  explainability: {
    summary: string;
    details: string[];
    dataQuality: string;
    confidence: number;
  };
  
  // Timing
  startedAt: string;
  completedAt: string;
  durationMs: number;
  
  // Errors
  errors: string[];
  warnings: string[];
}

export interface OrchestrationStep {
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  result?: any;
  error?: string;
}

// ============================================================================
// BASE ORCHESTRATOR
// ============================================================================

export abstract class BaseOrchestrator {
  protected sliceName: string;

  constructor(sliceName: string) {
    this.sliceName = sliceName;
  }

  /**
   * Main orchestration entry point
   */
  protected async orchestrate(
    userId: string,
    sourceType: SourceType,
    sourceSystem: SourceSystem,
    domain: string,
    effectiveDate: string,
    data: any
  ): Promise<OrchestrationResult> {
    const orchestrationId = this.generateOrchestrationId();
    const startTime = Date.now();

    const result: OrchestrationResult = {
      success: false,
      orchestrationId,
      userId,
      sliceName: this.sliceName,
      steps: [],
      propagation: {
        controlTower: false,
        execution: false,
        predictions: false,
        adjustments: false,
        goalProgress: false,
      },
      explainability: {
        summary: '',
        details: [],
        dataQuality: 'unknown',
        confidence: 0,
      },
      startedAt: new Date().toISOString(),
      completedAt: '',
      durationMs: 0,
      errors: [],
      warnings: [],
    };

    try {
      logger.info(`🎯 [ORCHESTRATOR] Starting ${this.sliceName} orchestration`, {
        orchestrationId,
        userId,
        sourceType,
        sourceSystem,
      });

      // Step 1: Register provenance
      const provenanceStep = await this.executeStep(
        result,
        'Register Provenance',
        async () => {
          const provenance = await SourceProvenanceService.registerProvenance(
            userId,
            sourceType,
            sourceSystem,
            domain,
            effectiveDate,
            {
              metadata: { orchestrationId },
            }
          );
          result.provenanceId = provenance.id;
          result.explainability.dataQuality = provenance.dataQuality;
          result.explainability.confidence = provenance.confidenceScore;
          return provenance;
        }
      );

      if (!provenanceStep.success) {
        throw new Error('Failed to register provenance');
      }

      // Step 2: Detect conflicts
      await this.executeStep(
        result,
        'Detect Conflicts',
        async () => {
          const provenance = provenanceStep.result as SourceProvenance;
          const conflicts = await SourceProvenanceService.detectConflicts(
            userId,
            domain,
            provenance
          );

          if (conflicts.length > 0) {
            result.warnings.push(`Detected ${conflicts.length} potential conflicts`);
            logger.warn(`⚠️ [ORCHESTRATOR] Conflicts detected`, {
              orchestrationId,
              conflictCount: conflicts.length,
            });
          }

          return conflicts;
        }
      );

      // Step 3: Execute slice-specific processing
      await this.executeSliceProcessing(result, userId, data);

      // Step 4: Propagate to downstream systems
      await this.propagateToDownstream(result, userId);

      // Step 5: Generate explainability
      this.generateExplainability(result);

      result.success = result.errors.length === 0;
      result.completedAt = new Date().toISOString();
      result.durationMs = Date.now() - startTime;

      logger.info(`✅ [ORCHESTRATOR] ${this.sliceName} orchestration completed`, {
        orchestrationId,
        success: result.success,
        durationMs: result.durationMs,
        errorCount: result.errors.length,
      });

    } catch (error) {
      result.success = false;
      result.errors.push((error as Error).message);
      result.completedAt = new Date().toISOString();
      result.durationMs = Date.now() - startTime;

      logger.error(`❌ [ORCHESTRATOR] ${this.sliceName} orchestration failed`, {
        orchestrationId,
        error: (error as Error).message,
      });
    }

    return result;
  }

  /**
   * Execute a single orchestration step
   */
  protected async executeStep(
    result: OrchestrationResult,
    stepName: string,
    stepFunction: () => Promise<any>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const step: OrchestrationStep = {
      stepName,
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    result.steps.push(step);

    try {
      const stepResult = await stepFunction();
      step.status = 'completed';
      step.completedAt = new Date().toISOString();
      step.durationMs = new Date(step.completedAt).getTime() - new Date(step.startedAt!).getTime();
      step.result = stepResult;

      return { success: true, result: stepResult };
    } catch (error) {
      step.status = 'failed';
      step.completedAt = new Date().toISOString();
      step.durationMs = new Date(step.completedAt).getTime() - new Date(step.startedAt!).getTime();
      step.error = (error as Error).message;

      result.errors.push(`${stepName}: ${(error as Error).message}`);

      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Propagate to downstream systems
   */
  protected async propagateToDownstream(
    result: OrchestrationResult,
    userId: string
  ): Promise<void> {
    // Control Tower propagation
    await this.executeStep(
      result,
      'Propagate to Control Tower',
      async () => {
        const success = await this.propagateToControlTower(userId, result);
        result.propagation.controlTower = success;
        return success;
      }
    );

    // Execution Intelligence propagation
    await this.executeStep(
      result,
      'Propagate to Execution',
      async () => {
        const success = await this.propagateToExecution(userId, result);
        result.propagation.execution = success;
        return success;
      }
    );

    // Predictive Behavior propagation
    await this.executeStep(
      result,
      'Propagate to Predictions',
      async () => {
        const success = await this.propagateToPredictions(userId, result);
        result.propagation.predictions = success;
        return success;
      }
    );

    // Autonomous Adjustment propagation
    await this.executeStep(
      result,
      'Propagate to Adjustments',
      async () => {
        const success = await this.propagateToAdjustments(userId, result);
        result.propagation.adjustments = success;
        return success;
      }
    );

    // Goal Progress propagation
    await this.executeStep(
      result,
      'Propagate to Goal Progress',
      async () => {
        const success = await this.propagateToGoalProgress(userId, result);
        result.propagation.goalProgress = success;
        return success;
      }
    );
  }

  /**
   * Generate explainability summary
   */
  protected generateExplainability(result: OrchestrationResult): void {
    const completedSteps = result.steps.filter(s => s.status === 'completed').length;
    const totalSteps = result.steps.length;

    result.explainability.summary = 
      `${this.sliceName} orchestration completed ${completedSteps}/${totalSteps} steps successfully`;

    result.explainability.details = result.steps.map(step => 
      `${step.stepName}: ${step.status} (${step.durationMs || 0}ms)`
    );
  }

  // ============================================================================
  // ABSTRACT METHODS - Must be implemented by subclasses
  // ============================================================================

  /**
   * Execute slice-specific processing
   */
  protected abstract executeSliceProcessing(
    result: OrchestrationResult,
    userId: string,
    data: any
  ): Promise<void>;

  /**
   * Propagate to Control Tower
   */
  protected abstract propagateToControlTower(
    userId: string,
    result: OrchestrationResult
  ): Promise<boolean>;

  /**
   * Propagate to Execution Intelligence
   */
  protected abstract propagateToExecution(
    userId: string,
    result: OrchestrationResult
  ): Promise<boolean>;

  /**
   * Propagate to Predictive Behavior
   */
  protected abstract propagateToPredictions(
    userId: string,
    result: OrchestrationResult
  ): Promise<boolean>;

  /**
   * Propagate to Autonomous Adjustments
   */
  protected abstract propagateToAdjustments(
    userId: string,
    result: OrchestrationResult
  ): Promise<boolean>;

  /**
   * Propagate to Goal Progress
   */
  protected abstract propagateToGoalProgress(
    userId: string,
    result: OrchestrationResult
  ): Promise<boolean>;

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  protected generateOrchestrationId(): string {
    return `orch-${this.sliceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected logPropagation(
    system: string,
    success: boolean,
    details?: string
  ): void {
    if (success) {
      logger.info(`✅ [ORCHESTRATOR] Propagated to ${system}`, { details });
    } else {
      logger.warn(`⚠️ [ORCHESTRATOR] Failed to propagate to ${system}`, { details });
    }
  }
}
