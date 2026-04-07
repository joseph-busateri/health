/**
 * Source Registry - Phase 18
 * 
 * Purpose: Central registry for all data source types
 * Manages normalization rules and integration points
 */

import type { SourceType, SourceSystem, SourceRegistryEntry } from '../types/source';

// ============================================================================
// SOURCE REGISTRY
// ============================================================================

export class SourceRegistry {
  private static registry: Map<string, SourceRegistryEntry> = new Map();

  /**
   * Register a data source type
   */
  static register(entry: SourceRegistryEntry): void {
    const key = `${entry.sourceType}:${entry.sourceSystem}`;
    this.registry.set(key, entry);
  }

  /**
   * Get registry entry for source
   */
  static get(sourceType: SourceType, sourceSystem: SourceSystem): SourceRegistryEntry | null {
    const key = `${sourceType}:${sourceSystem}`;
    return this.registry.get(key) || null;
  }

  /**
   * Check if source is registered
   */
  static isRegistered(sourceType: SourceType, sourceSystem: SourceSystem): boolean {
    const key = `${sourceType}:${sourceSystem}`;
    return this.registry.has(key);
  }

  /**
   * Get all registered sources
   */
  static getAll(): SourceRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  /**
   * Get sources by type
   */
  static getByType(sourceType: SourceType): SourceRegistryEntry[] {
    return Array.from(this.registry.values()).filter(
      entry => entry.sourceType === sourceType
    );
  }

  /**
   * Get enabled sources
   */
  static getEnabled(): SourceRegistryEntry[] {
    return Array.from(this.registry.values()).filter(entry => entry.enabled);
  }
}

// ============================================================================
// INITIALIZE REGISTRY
// ============================================================================

/**
 * Initialize source registry with all supported sources
 */
export function initializeSourceRegistry(): void {
  // Bloodwork sources
  SourceRegistry.register({
    sourceType: 'bloodwork',
    sourceSystem: 'upload',
    enabled: true,
    priority: 10,
    normalizationRules: {
      sourceType: 'bloodwork',
      sourceSystem: 'upload',
      fieldMappings: {
        'lab_name': 'labName',
        'test_date': 'testDate',
        'results': 'biomarkers',
      },
      transformations: [],
      validations: [
        {
          field: 'testDate',
          validate: (value: any) => !isNaN(Date.parse(value)),
          errorMessage: 'Invalid test date',
        },
      ],
    },
    intelligenceGenerators: ['bloodworkIntelligence', 'trendAnalysis'],
    controlTowerIntegration: true,
    executionIntegration: true,
    predictionIntegration: true,
    adjustmentIntegration: true,
  });

  // Body Composition sources
  SourceRegistry.register({
    sourceType: 'bodyComposition',
    sourceSystem: 'upload',
    enabled: true,
    priority: 8,
    normalizationRules: {
      sourceType: 'bodyComposition',
      sourceSystem: 'upload',
      fieldMappings: {},
      transformations: [],
      validations: [],
    },
    intelligenceGenerators: ['bodyCompositionTrends', 'goalProgress'],
    controlTowerIntegration: true,
    executionIntegration: false,
    predictionIntegration: true,
    adjustmentIntegration: false,
  });

  // Workout Program sources
  SourceRegistry.register({
    sourceType: 'workoutProgram',
    sourceSystem: 'upload',
    enabled: true,
    priority: 9,
    normalizationRules: {
      sourceType: 'workoutProgram',
      sourceSystem: 'upload',
      fieldMappings: {},
      transformations: [],
      validations: [],
    },
    intelligenceGenerators: ['workoutPlanning', 'volumeAnalysis'],
    controlTowerIntegration: true,
    executionIntegration: true,
    predictionIntegration: true,
    adjustmentIntegration: true,
  });

  // Device sources - Whoop
  SourceRegistry.register({
    sourceType: 'device',
    sourceSystem: 'whoop',
    enabled: true,
    priority: 9,
    normalizationRules: {
      sourceType: 'device',
      sourceSystem: 'whoop',
      fieldMappings: {},
      transformations: [],
      validations: [],
    },
    intelligenceGenerators: ['recoveryIntelligence', 'fatigueDetection'],
    controlTowerIntegration: true,
    executionIntegration: false,
    predictionIntegration: true,
    adjustmentIntegration: true,
  });

  // Device sources - Oura
  SourceRegistry.register({
    sourceType: 'device',
    sourceSystem: 'oura',
    enabled: true,
    priority: 9,
    normalizationRules: {
      sourceType: 'device',
      sourceSystem: 'oura',
      fieldMappings: {},
      transformations: [],
      validations: [],
    },
    intelligenceGenerators: ['sleepIntelligence', 'readinessScore'],
    controlTowerIntegration: true,
    executionIntegration: false,
    predictionIntegration: true,
    adjustmentIntegration: true,
  });

  // Daily Interview sources
  SourceRegistry.register({
    sourceType: 'dailyInterview',
    sourceSystem: 'ai_interview',
    enabled: true,
    priority: 7,
    normalizationRules: {
      sourceType: 'dailyInterview',
      sourceSystem: 'ai_interview',
      fieldMappings: {},
      transformations: [],
      validations: [],
    },
    intelligenceGenerators: ['sentimentAnalysis', 'metricExtraction'],
    controlTowerIntegration: true,
    executionIntegration: false,
    predictionIntegration: true,
    adjustmentIntegration: false,
  });

  // Nutrition sources
  SourceRegistry.register({
    sourceType: 'nutrition',
    sourceSystem: 'manual',
    enabled: true,
    priority: 8,
    normalizationRules: {
      sourceType: 'nutrition',
      sourceSystem: 'manual',
      fieldMappings: {},
      transformations: [],
      validations: [],
    },
    intelligenceGenerators: ['nutritionAnalysis', 'macroTracking'],
    controlTowerIntegration: true,
    executionIntegration: true,
    predictionIntegration: true,
    adjustmentIntegration: true,
  });

  // Supplement sources
  SourceRegistry.register({
    sourceType: 'supplements',
    sourceSystem: 'manual',
    enabled: true,
    priority: 6,
    normalizationRules: {
      sourceType: 'supplements',
      sourceSystem: 'manual',
      fieldMappings: {},
      transformations: [],
      validations: [],
    },
    intelligenceGenerators: ['supplementAdherence'],
    controlTowerIntegration: true,
    executionIntegration: true,
    predictionIntegration: false,
    adjustmentIntegration: false,
  });

  // Execution sources
  SourceRegistry.register({
    sourceType: 'execution',
    sourceSystem: 'execution_tracker',
    enabled: true,
    priority: 10,
    normalizationRules: {
      sourceType: 'execution',
      sourceSystem: 'execution_tracker',
      fieldMappings: {},
      transformations: [],
      validations: [],
    },
    intelligenceGenerators: ['adherenceScoring', 'behaviorPrediction'],
    controlTowerIntegration: true,
    executionIntegration: true,
    predictionIntegration: true,
    adjustmentIntegration: true,
  });
}
