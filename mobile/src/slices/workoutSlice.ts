/**
 * Workout Vertical Slice - Phase 18
 * 
 * Purpose: End-to-end workout + execution integration
 * Flow: Program Ingestion → Execution Tracking → Adherence → Prediction → Adjustment
 * 
 * Reuses:
 * - Execution Intelligence (Phase 15)
 * - Predictive Behavior (Phase 16)
 * - Autonomous Adjustment (Phase 17)
 */

import type { WorkoutProgramSource, IngestionRequest, IngestionResult } from '../types/source';
import type { ExecutionTask } from '../types/execution';
import type { BehaviorPrediction } from '../types/predictiveBehavior';
import type { AutonomousAdjustment } from '../types/autonomousAdjustment';
import { SourceNormalizer } from '../ingestion/sourceNormalizer';
import { SourceRouter } from '../ingestion/sourceRouter';

// ============================================================================
// WORKOUT SLICE SERVICE
// ============================================================================

export class WorkoutSliceService {
  /**
   * Process workout program end-to-end
   */
  static async processWorkoutProgram(request: IngestionRequest): Promise<IngestionResult> {
    try {
      // 1. NORMALIZE
      const normalized = SourceNormalizer.normalize(request);
      if (!normalized) {
        return this.getFailedResult('Failed to normalize workout program');
      }

      // 2. ROUTE THROUGH VERTICAL SLICE
      const result = await SourceRouter.route(normalized);

      // 3. GENERATE INTELLIGENCE
      const intelligence = this.generateWorkoutIntelligence(normalized as WorkoutProgramSource);

      // 4. CREATE EXECUTION TASKS (Weekly workout sessions)
      const executionTasks = this.generateExecutionTasks(normalized as WorkoutProgramSource, intelligence);
      result.executionTasksCreated = executionTasks.length;

      // 5. GENERATE PREDICTIONS
      const predictions = this.generatePredictions(normalized as WorkoutProgramSource, intelligence);
      result.predictionsGenerated = predictions.length;

      // 6. GENERATE ADJUSTMENTS
      const adjustments = this.generateAdjustments(normalized as WorkoutProgramSource, intelligence);
      result.adjustmentsGenerated = adjustments.length;

      return result;
    } catch (error) {
      console.error('Workout slice processing error:', error);
      return this.getFailedResult(`Processing error: ${error}`);
    }
  }

  /**
   * Track workout execution
   */
  static async trackWorkoutExecution(
    userId: string,
    workoutId: string,
    completed: boolean,
    performance?: WorkoutPerformance
  ): Promise<void> {
    console.log('Tracking workout execution:', { userId, workoutId, completed, performance });
    
    // This would integrate with execution service
    // Update adherence scores
    // Trigger predictions
    // Generate adjustments if needed
  }

  /**
   * Generate workout intelligence
   */
  private static generateWorkoutIntelligence(source: WorkoutProgramSource): WorkoutIntelligence {
    const program = source.data;
    const totalVolume = this.calculateVolume(program);
    const intensity = this.assessIntensity(program);

    return {
      sourceId: source.id,
      programName: program.programName,
      totalVolume,
      intensity,
      weeklyFrequency: program.frequency,
      estimatedDuration: program.duration,
      focus: program.focus,
      complexity: program.exercises.length > 10 ? 'high' : program.exercises.length > 5 ? 'medium' : 'low',
      adherenceRisk: this.assessAdherenceRisk(program),
    };
  }

  /**
   * Generate execution tasks for workout program
   */
  private static generateExecutionTasks(
    source: WorkoutProgramSource,
    intelligence: WorkoutIntelligence
  ): ExecutionTask[] {
    const tasks: ExecutionTask[] = [];
    const program = source.data;

    // Create weekly workout session tasks
    const sessionsPerWeek = program.frequency || 4;
    const sessionNames = ['Upper Body', 'Lower Body', 'Push', 'Pull', 'Legs', 'Full Body'];

    for (let i = 0; i < Math.min(sessionsPerWeek, 7); i++) {
      tasks.push({
        id: `workout-session-${source.id}-${i}`,
        domain: 'workout',
        title: `${sessionNames[i % sessionNames.length]} Workout`,
        description: `${program.programName} - Session ${i + 1}`,
        priority: 'high',
        status: 'pending',
        expectedImpact: `Build strength and muscle according to ${program.programName}`,
      });
    }

    return tasks;
  }

  /**
   * Generate behavior predictions
   */
  private static generatePredictions(
    source: WorkoutProgramSource,
    intelligence: WorkoutIntelligence
  ): BehaviorPrediction[] {
    const predictions: BehaviorPrediction[] = [];

    // Predict adherence based on program complexity
    if (intelligence.adherenceRisk > 0.5) {
      predictions.push({
        id: `workout-pred-adherence-${source.id}`,
        predictionType: 'adherenceRisk',
        probability: intelligence.adherenceRisk,
        confidence: 0.75,
        timeframe: 'day',
        explanation: `${intelligence.complexity} complexity program with ${intelligence.weeklyFrequency}x/week frequency may challenge adherence`,
        recommendedAction: intelligence.adherenceRisk > 0.7 
          ? 'Consider reducing frequency or simplifying program'
          : 'Monitor adherence closely',
        timestamp: new Date().toISOString(),
      });
    }

    // Predict completion likelihood
    predictions.push({
      id: `workout-pred-completion-${source.id}`,
      predictionType: 'completionLikelihood',
      probability: 1 - intelligence.adherenceRisk,
      confidence: 0.7,
      timeframe: 'day',
      explanation: `Based on program structure and frequency`,
      timestamp: new Date().toISOString(),
    });

    return predictions;
  }

  /**
   * Generate autonomous adjustments
   */
  private static generateAdjustments(
    source: WorkoutProgramSource,
    intelligence: WorkoutIntelligence
  ): AutonomousAdjustment[] {
    const adjustments: AutonomousAdjustment[] = [];

    // Suggest volume reduction for high-complexity programs
    if (intelligence.complexity === 'high' && intelligence.adherenceRisk > 0.6) {
      adjustments.push({
        id: `workout-adj-reduce-${source.id}`,
        domain: 'workout',
        adjustmentType: 'reduceIntensity',
        reason: 'High program complexity detected - reducing volume to improve adherence',
        confidence: 0.8,
        impact: 'moderate',
        status: 'pending',
        originalValue: `${intelligence.totalVolume} sets/week`,
        adjustedValue: `${Math.round(intelligence.totalVolume * 0.8)} sets/week`,
        triggers: ['High complexity', 'Adherence risk'],
        expectedOutcome: 'Maintain consistency with reduced volume',
        reversible: true,
        requiresConfirmation: true,
        createdAt: new Date().toISOString(),
      });
    }

    return adjustments;
  }

  /**
   * Calculate total weekly volume
   */
  private static calculateVolume(program: any): number {
    const exercises = program.exercises || [];
    const totalSets = exercises.reduce((sum: number, ex: any) => sum + (ex.sets || 3), 0);
    return totalSets * (program.frequency || 4);
  }

  /**
   * Assess program intensity
   */
  private static assessIntensity(program: any): 'low' | 'moderate' | 'high' {
    const frequency = program.frequency || 4;
    const exerciseCount = (program.exercises || []).length;

    if (frequency >= 6 || exerciseCount >= 12) return 'high';
    if (frequency >= 4 || exerciseCount >= 8) return 'moderate';
    return 'low';
  }

  /**
   * Assess adherence risk
   */
  private static assessAdherenceRisk(program: any): number {
    let risk = 0;

    const frequency = program.frequency || 4;
    const exerciseCount = (program.exercises || []).length;

    // High frequency increases risk
    if (frequency >= 6) risk += 0.3;
    else if (frequency >= 5) risk += 0.2;

    // High exercise count increases risk
    if (exerciseCount >= 12) risk += 0.3;
    else if (exerciseCount >= 10) risk += 0.2;

    // Long duration increases risk
    const duration = program.duration || 12;
    if (duration >= 16) risk += 0.2;

    return Math.min(risk, 1.0);
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

interface WorkoutIntelligence {
  sourceId: string;
  programName: string;
  totalVolume: number;
  intensity: 'low' | 'moderate' | 'high';
  weeklyFrequency: number;
  estimatedDuration: number;
  focus: string[];
  complexity: 'low' | 'medium' | 'high';
  adherenceRisk: number;
}

interface WorkoutPerformance {
  setsCompleted: number;
  repsCompleted: number;
  weight?: number;
  rpe?: number; // Rate of perceived exertion
  notes?: string;
}
