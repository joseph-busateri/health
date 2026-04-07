/**
 * Source Normalizer - Phase 18
 * 
 * Purpose: Normalize raw data from various sources into canonical format
 * Rules:
 * - Tolerate missing fields
 * - Provide safe defaults
 * - Never throw runtime errors
 */

import type {
  DataSource,
  IngestionRequest,
  SourceType,
  SourceSystem,
  DataQuality,
  BloodworkSource,
  BodyCompositionSource,
  WorkoutProgramSource,
  DeviceSource,
  DailyInterviewSource,
  NutritionSource,
  SupplementSource,
  ExecutionSource,
} from '../types/source';
import { SourceRegistry } from './sourceRegistry';

// ============================================================================
// SOURCE NORMALIZER
// ============================================================================

export class SourceNormalizer {
  /**
   * Normalize ingestion request into canonical DataSource
   */
  static normalize(request: IngestionRequest): DataSource | null {
    try {
      // Get registry entry
      const entry = SourceRegistry.get(request.sourceType, request.sourceSystem);
      if (!entry || !entry.enabled) {
        console.warn(`Source not registered or disabled: ${request.sourceType}:${request.sourceSystem}`);
        return null;
      }

      // Route to specific normalizer
      switch (request.sourceType) {
        case 'bloodwork':
          return this.normalizeBloodwork(request);
        case 'bodyComposition':
          return this.normalizeBodyComposition(request);
        case 'workoutProgram':
          return this.normalizeWorkoutProgram(request);
        case 'device':
          return this.normalizeDevice(request);
        case 'dailyInterview':
          return this.normalizeDailyInterview(request);
        case 'nutrition':
          return this.normalizeNutrition(request);
        case 'supplements':
          return this.normalizeSupplements(request);
        case 'execution':
          return this.normalizeExecution(request);
        default:
          return this.normalizeGeneric(request);
      }
    } catch (error) {
      console.error('Normalization error:', error);
      return null;
    }
  }

  /**
   * Normalize bloodwork data
   */
  private static normalizeBloodwork(request: IngestionRequest): BloodworkSource {
    const raw = request.rawData;
    
    return {
      id: this.generateId(),
      userId: request.userId,
      sourceType: 'bloodwork',
      sourceSystem: request.sourceSystem,
      ingestedAt: new Date().toISOString(),
      effectiveDate: request.effectiveDate,
      confidence: this.calculateConfidence(raw),
      dataQuality: this.assessDataQuality(raw),
      completeness: this.calculateCompleteness(raw, ['labName', 'testDate', 'biomarkers']),
      status: 'normalized',
      metadata: request.metadata,
      rawData: raw,
      data: {
        labName: raw.labName || raw.lab_name || 'Unknown Lab',
        testDate: raw.testDate || raw.test_date || request.effectiveDate,
        biomarkers: this.normalizeBiomarkers(raw.biomarkers || raw.results || []),
      },
    };
  }

  /**
   * Normalize body composition data
   */
  private static normalizeBodyComposition(request: IngestionRequest): BodyCompositionSource {
    const raw = request.rawData;
    
    return {
      id: this.generateId(),
      userId: request.userId,
      sourceType: 'bodyComposition',
      sourceSystem: request.sourceSystem,
      ingestedAt: new Date().toISOString(),
      effectiveDate: request.effectiveDate,
      confidence: this.calculateConfidence(raw),
      dataQuality: this.assessDataQuality(raw),
      completeness: this.calculateCompleteness(raw, ['weight']),
      status: 'normalized',
      metadata: request.metadata,
      rawData: raw,
      data: {
        weight: raw.weight,
        bodyFat: raw.bodyFat || raw.body_fat_percentage,
        muscleMass: raw.muscleMass || raw.muscle_mass,
        visceralFat: raw.visceralFat || raw.visceral_fat,
        bmr: raw.bmr || raw.basal_metabolic_rate,
        measurementMethod: raw.measurementMethod || raw.method || 'manual',
      },
    };
  }

  /**
   * Normalize workout program data
   */
  private static normalizeWorkoutProgram(request: IngestionRequest): WorkoutProgramSource {
    const raw = request.rawData;
    
    return {
      id: this.generateId(),
      userId: request.userId,
      sourceType: 'workoutProgram',
      sourceSystem: request.sourceSystem,
      ingestedAt: new Date().toISOString(),
      effectiveDate: request.effectiveDate,
      confidence: this.calculateConfidence(raw),
      dataQuality: this.assessDataQuality(raw),
      completeness: this.calculateCompleteness(raw, ['programName', 'exercises']),
      status: 'normalized',
      metadata: request.metadata,
      rawData: raw,
      data: {
        programName: raw.programName || raw.name || 'Workout Program',
        duration: raw.duration || 12,
        frequency: raw.frequency || 4,
        focus: raw.focus || [],
        exercises: raw.exercises || [],
      },
    };
  }

  /**
   * Normalize device data
   */
  private static normalizeDevice(request: IngestionRequest): DeviceSource {
    const raw = request.rawData;
    
    return {
      id: this.generateId(),
      userId: request.userId,
      sourceType: 'device',
      sourceSystem: request.sourceSystem,
      ingestedAt: new Date().toISOString(),
      effectiveDate: request.effectiveDate,
      confidence: this.calculateConfidence(raw),
      dataQuality: this.assessDataQuality(raw),
      completeness: this.calculateCompleteness(raw, ['metrics']),
      status: 'normalized',
      metadata: request.metadata,
      rawData: raw,
      data: {
        deviceType: request.sourceSystem as any,
        metrics: {
          hrv: raw.hrv || raw.heart_rate_variability,
          restingHR: raw.restingHR || raw.resting_heart_rate,
          sleep: raw.sleep ? {
            duration: raw.sleep.duration || 0,
            quality: raw.sleep.quality || 0,
            stages: raw.sleep.stages,
          } : undefined,
          activity: raw.activity ? {
            steps: raw.activity.steps || 0,
            calories: raw.activity.calories || 0,
            activeMinutes: raw.activity.activeMinutes || raw.activity.active_minutes || 0,
          } : undefined,
          recovery: raw.recovery ? {
            score: raw.recovery.score || 0,
            strain: raw.recovery.strain || 0,
          } : undefined,
        },
      },
    };
  }

  /**
   * Normalize daily interview data
   */
  private static normalizeDailyInterview(request: IngestionRequest): DailyInterviewSource {
    const raw = request.rawData;
    
    return {
      id: this.generateId(),
      userId: request.userId,
      sourceType: 'dailyInterview',
      sourceSystem: request.sourceSystem,
      ingestedAt: new Date().toISOString(),
      effectiveDate: request.effectiveDate,
      confidence: this.calculateConfidence(raw),
      dataQuality: this.assessDataQuality(raw),
      completeness: this.calculateCompleteness(raw, ['responses']),
      status: 'normalized',
      metadata: request.metadata,
      rawData: raw,
      data: {
        responses: raw.responses || [],
        sentiment: raw.sentiment,
        extractedMetrics: raw.extractedMetrics || raw.extracted_metrics,
      },
    };
  }

  /**
   * Normalize nutrition data
   */
  private static normalizeNutrition(request: IngestionRequest): NutritionSource {
    const raw = request.rawData;
    
    return {
      id: this.generateId(),
      userId: request.userId,
      sourceType: 'nutrition',
      sourceSystem: request.sourceSystem,
      ingestedAt: new Date().toISOString(),
      effectiveDate: request.effectiveDate,
      confidence: this.calculateConfidence(raw),
      dataQuality: this.assessDataQuality(raw),
      completeness: this.calculateCompleteness(raw, ['dailyTotals']),
      status: 'normalized',
      metadata: request.metadata,
      rawData: raw,
      data: {
        meals: raw.meals || [],
        dailyTotals: raw.dailyTotals || raw.daily_totals || {
          protein: 0,
          carbs: 0,
          fat: 0,
          calories: 0,
        },
      },
    };
  }

  /**
   * Normalize supplement data
   */
  private static normalizeSupplements(request: IngestionRequest): SupplementSource {
    const raw = request.rawData;
    
    return {
      id: this.generateId(),
      userId: request.userId,
      sourceType: 'supplements',
      sourceSystem: request.sourceSystem,
      ingestedAt: new Date().toISOString(),
      effectiveDate: request.effectiveDate,
      confidence: this.calculateConfidence(raw),
      dataQuality: this.assessDataQuality(raw),
      completeness: this.calculateCompleteness(raw, ['supplements']),
      status: 'normalized',
      metadata: request.metadata,
      rawData: raw,
      data: {
        supplements: raw.supplements || [],
      },
    };
  }

  /**
   * Normalize execution data
   */
  private static normalizeExecution(request: IngestionRequest): ExecutionSource {
    const raw = request.rawData;
    
    return {
      id: this.generateId(),
      userId: request.userId,
      sourceType: 'execution',
      sourceSystem: request.sourceSystem,
      ingestedAt: new Date().toISOString(),
      effectiveDate: request.effectiveDate,
      confidence: 1.0,
      dataQuality: 'high',
      completeness: 1.0,
      status: 'normalized',
      metadata: request.metadata,
      rawData: raw,
      data: {
        taskId: raw.taskId || raw.task_id,
        domain: raw.domain,
        status: raw.status,
        completedAt: raw.completedAt || raw.completed_at,
        value: raw.value,
        notes: raw.notes,
      },
    };
  }

  /**
   * Generic normalization fallback
   */
  private static normalizeGeneric(request: IngestionRequest): DataSource {
    return {
      id: this.generateId(),
      userId: request.userId,
      sourceType: request.sourceType,
      sourceSystem: request.sourceSystem,
      ingestedAt: new Date().toISOString(),
      effectiveDate: request.effectiveDate,
      confidence: 0.5,
      dataQuality: 'medium',
      completeness: 0.5,
      status: 'normalized',
      metadata: request.metadata,
      rawData: request.rawData,
    };
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  private static generateId(): string {
    return `src-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static calculateConfidence(data: any): number {
    if (!data) return 0;
    
    // Simple heuristic: more fields = higher confidence
    const fieldCount = Object.keys(data).length;
    return Math.min(fieldCount / 10, 1.0);
  }

  private static assessDataQuality(data: any): DataQuality {
    if (!data) return 'insufficient';
    
    const fieldCount = Object.keys(data).length;
    if (fieldCount >= 5) return 'high';
    if (fieldCount >= 3) return 'medium';
    if (fieldCount >= 1) return 'low';
    return 'insufficient';
  }

  private static calculateCompleteness(data: any, requiredFields: string[]): number {
    if (!data || requiredFields.length === 0) return 0;
    
    const presentFields = requiredFields.filter(field => {
      const value = data[field];
      return value !== undefined && value !== null && value !== '';
    });
    
    return presentFields.length / requiredFields.length;
  }

  private static normalizeBiomarkers(biomarkers: any[]): any[] {
    return biomarkers.map(b => ({
      name: b.name || b.biomarker_name,
      value: b.value || b.result,
      unit: b.unit || b.units,
      referenceRange: b.referenceRange || b.reference_range,
      status: b.status || this.assessBiomarkerStatus(b),
    }));
  }

  private static assessBiomarkerStatus(biomarker: any): 'normal' | 'low' | 'high' | 'critical' {
    if (!biomarker.referenceRange) return 'normal';
    
    const value = biomarker.value;
    const range = biomarker.referenceRange;
    
    if (value < range.min) return value < range.min * 0.8 ? 'critical' : 'low';
    if (value > range.max) return value > range.max * 1.2 ? 'critical' : 'high';
    return 'normal';
  }
}
