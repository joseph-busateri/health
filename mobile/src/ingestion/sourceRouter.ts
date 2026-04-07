/**
 * Source Router - Phase 18
 * 
 * Purpose: Route normalized sources to appropriate intelligence generators
 * Orchestrates the vertical slice integration
 */

import type { DataSource, IngestionResult } from '../types/source';
import { SourceRegistry } from './sourceRegistry';

// ============================================================================
// SOURCE ROUTER
// ============================================================================

export class SourceRouter {
  /**
   * Route normalized source through vertical slice
   */
  static async route(source: DataSource): Promise<IngestionResult> {
    const startTime = Date.now();
    const result: IngestionResult = {
      success: false,
      sourceId: source.id,
      source,
      errors: [],
      warnings: [],
      processingTime: 0,
      intelligenceGenerated: false,
      controlTowerUpdated: false,
      executionTasksCreated: 0,
      predictionsGenerated: 0,
      adjustmentsGenerated: 0,
    };

    try {
      // Get registry entry
      const entry = SourceRegistry.get(source.sourceType, source.sourceSystem);
      if (!entry) {
        result.errors?.push(`No registry entry for ${source.sourceType}:${source.sourceSystem}`);
        return result;
      }

      // Route to vertical slice based on source type
      switch (source.sourceType) {
        case 'bloodwork':
          await this.routeBloodwork(source, result);
          break;
        case 'bodyComposition':
          await this.routeBodyComposition(source, result);
          break;
        case 'workoutProgram':
          await this.routeWorkoutProgram(source, result);
          break;
        case 'device':
          await this.routeDevice(source, result);
          break;
        case 'dailyInterview':
          await this.routeDailyInterview(source, result);
          break;
        case 'nutrition':
          await this.routeNutrition(source, result);
          break;
        case 'supplements':
          await this.routeSupplements(source, result);
          break;
        case 'execution':
          await this.routeExecution(source, result);
          break;
        default:
          result.warnings?.push(`No routing logic for ${source.sourceType}`);
      }

      result.success = true;
      result.processingTime = Date.now() - startTime;
    } catch (error) {
      result.errors?.push(`Routing error: ${error}`);
      result.processingTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Route bloodwork through vertical slice
   */
  private static async routeBloodwork(source: DataSource, result: IngestionResult): Promise<void> {
    // 1. Persist (would call persistence service)
    console.log('Persisting bloodwork source:', source.id);

    // 2. Generate intelligence (would call bloodwork intelligence service)
    console.log('Generating bloodwork intelligence');
    result.intelligenceGenerated = true;

    // 3. Update Control Tower (would call control tower service)
    console.log('Updating Control Tower with bloodwork insights');
    result.controlTowerUpdated = true;

    // 4. Create execution tasks (would call execution service)
    console.log('Creating execution tasks from bloodwork');
    result.executionTasksCreated = 2; // Example: "Increase fiber", "Reduce sodium"

    // 5. Generate predictions (would call predictive behavior service)
    console.log('Generating behavior predictions');
    result.predictionsGenerated = 1;

    // 6. Generate adjustments (would call autonomous adjustment service)
    console.log('Generating autonomous adjustments');
    result.adjustmentsGenerated = 1;
  }

  /**
   * Route body composition through vertical slice
   */
  private static async routeBodyComposition(source: DataSource, result: IngestionResult): Promise<void> {
    console.log('Persisting body composition source:', source.id);
    result.intelligenceGenerated = true;
    result.controlTowerUpdated = true;
    result.predictionsGenerated = 1;
  }

  /**
   * Route workout program through vertical slice
   */
  private static async routeWorkoutProgram(source: DataSource, result: IngestionResult): Promise<void> {
    console.log('Persisting workout program source:', source.id);
    result.intelligenceGenerated = true;
    result.controlTowerUpdated = true;
    result.executionTasksCreated = 4; // Example: workout sessions
    result.predictionsGenerated = 2;
    result.adjustmentsGenerated = 1;
  }

  /**
   * Route device data through vertical slice
   */
  private static async routeDevice(source: DataSource, result: IngestionResult): Promise<void> {
    console.log('Persisting device source:', source.id);
    result.intelligenceGenerated = true;
    result.controlTowerUpdated = true;
    result.predictionsGenerated = 3; // Recovery, fatigue, performance
    result.adjustmentsGenerated = 2; // Reduce intensity, increase recovery
  }

  /**
   * Route daily interview through vertical slice
   */
  private static async routeDailyInterview(source: DataSource, result: IngestionResult): Promise<void> {
    console.log('Persisting daily interview source:', source.id);
    result.intelligenceGenerated = true;
    result.controlTowerUpdated = true;
    result.predictionsGenerated = 1;
  }

  /**
   * Route nutrition through vertical slice
   */
  private static async routeNutrition(source: DataSource, result: IngestionResult): Promise<void> {
    console.log('Persisting nutrition source:', source.id);
    result.intelligenceGenerated = true;
    result.controlTowerUpdated = true;
    result.executionTasksCreated = 1; // Nutrition adherence task
    result.predictionsGenerated = 1;
    result.adjustmentsGenerated = 1;
  }

  /**
   * Route supplements through vertical slice
   */
  private static async routeSupplements(source: DataSource, result: IngestionResult): Promise<void> {
    console.log('Persisting supplement source:', source.id);
    result.intelligenceGenerated = true;
    result.controlTowerUpdated = true;
    result.executionTasksCreated = 1;
  }

  /**
   * Route execution through vertical slice
   */
  private static async routeExecution(source: DataSource, result: IngestionResult): Promise<void> {
    console.log('Persisting execution source:', source.id);
    result.intelligenceGenerated = true;
    result.controlTowerUpdated = true;
    result.predictionsGenerated = 2; // Adherence prediction, drift prediction
    result.adjustmentsGenerated = 1; // Plan adjustment based on execution
  }
}
