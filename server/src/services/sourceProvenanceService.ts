/**
 * Source Provenance Service - Phase 20
 * 
 * Purpose: Track source metadata, freshness, confidence, and conflicts for all data ingestion
 * Critical for: Explainability, conflict resolution, data quality assessment
 * 
 * Coordinates with: All vertical slice orchestrators
 */

import { logger } from '../utils/logger';

// ============================================================================
// SOURCE PROVENANCE MODEL
// ============================================================================

export type SourceType = 
  | 'bloodwork'
  | 'body_composition'
  | 'workout_program'
  | 'device_sync'
  | 'daily_interview'
  | 'nutrition_intake'
  | 'nutrition_plan'
  | 'hydration_log'
  | 'supplement_upload'
  | 'clinical_document'
  | 'baseline_profile'
  | 'manual_entry'
  | 'ai_generated'
  | 'derived';

export type SourceSystem = 
  | 'manual_upload'
  | 'whoop'
  | 'oura'
  | 'apple_watch'
  | 'garmin'
  | 'fitbit'
  | 'sleep_number'
  | 'withings'
  | 'ai_agent'
  | 'ocr_extraction'
  | 'user_input'
  | 'system_derived';

export type DataQuality = 'high' | 'medium' | 'low' | 'unknown';
export type FreshnessStatus = 'fresh' | 'recent' | 'stale' | 'expired';
export type ConflictStatus = 'none' | 'detected' | 'resolved' | 'unresolved';

export interface SourceProvenance {
  id: string;
  userId: string;
  
  // Source identification
  sourceType: SourceType;
  sourceSystem: SourceSystem;
  sourceId?: string; // Reference to source record (document ID, sync ID, etc.)
  domain: string; // 'cardiovascular', 'nutrition', 'recovery', etc.
  
  // Temporal tracking
  ingestedAt: string; // When data entered system
  effectiveDate: string; // When data is relevant (test date, measurement date, etc.)
  expiresAt?: string; // When data should be considered stale
  
  // Quality metrics
  confidenceScore: number; // 0-1
  dataQuality: DataQuality;
  freshnessStatus: FreshnessStatus;
  
  // Data references
  rawReference?: string; // Reference to raw data (file URL, API response, etc.)
  normalizedReference?: string; // Reference to normalized data
  
  // Conflict tracking
  conflictStatus: ConflictStatus;
  conflictsWith?: string[]; // IDs of conflicting provenance records
  resolvedBy?: 'system' | 'user' | 'precedence_rule';
  resolvedAt?: string;
  resolutionNotes?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SourceMetadata {
  provenanceId: string;
  sourceType: SourceType;
  sourceSystem: SourceSystem;
  confidenceScore: number;
  dataQuality: DataQuality;
  freshnessStatus: FreshnessStatus;
  effectiveDate: string;
}

export interface ConflictDetection {
  conflictId: string;
  conflictType: 'duplicate' | 'contradiction' | 'overlap';
  provenanceIds: string[];
  domain: string;
  detectedAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedResolution?: string;
}

// ============================================================================
// SOURCE PROVENANCE SERVICE
// ============================================================================

export class SourceProvenanceService {
  /**
   * Register source provenance for new data ingestion
   */
  static async registerProvenance(
    userId: string,
    sourceType: SourceType,
    sourceSystem: SourceSystem,
    domain: string,
    effectiveDate: string,
    options?: {
      sourceId?: string;
      confidenceScore?: number;
      dataQuality?: DataQuality;
      rawReference?: string;
      normalizedReference?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<SourceProvenance> {
    const provenance: SourceProvenance = {
      id: this.generateProvenanceId(),
      userId,
      sourceType,
      sourceSystem,
      sourceId: options?.sourceId,
      domain,
      ingestedAt: new Date().toISOString(),
      effectiveDate,
      expiresAt: this.calculateExpiration(sourceType, effectiveDate),
      confidenceScore: options?.confidenceScore ?? this.calculateDefaultConfidence(sourceSystem),
      dataQuality: options?.dataQuality ?? this.assessDataQuality(sourceSystem, sourceType),
      freshnessStatus: this.assessFreshness(effectiveDate),
      rawReference: options?.rawReference,
      normalizedReference: options?.normalizedReference,
      conflictStatus: 'none',
      metadata: options?.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In production, this would persist to database
    logger.info('✅ [PROVENANCE] Source registered', {
      provenanceId: provenance.id,
      userId,
      sourceType,
      sourceSystem,
      domain,
      confidence: provenance.confidenceScore,
      quality: provenance.dataQuality,
    });

    return provenance;
  }

  /**
   * Get provenance by ID
   */
  static async getProvenance(provenanceId: string): Promise<SourceProvenance | null> {
    // In production, this would fetch from database
    logger.info('📋 [PROVENANCE] Fetching provenance', { provenanceId });
    return null;
  }

  /**
   * Get all provenance for user by domain
   */
  static async getProvenanceByDomain(
    userId: string,
    domain: string,
    options?: {
      sourceType?: SourceType;
      limit?: number;
      includeStale?: boolean;
    }
  ): Promise<SourceProvenance[]> {
    // In production, this would fetch from database
    logger.info('📋 [PROVENANCE] Fetching provenance by domain', {
      userId,
      domain,
      sourceType: options?.sourceType,
    });
    return [];
  }

  /**
   * Detect conflicts between provenance records
   */
  static async detectConflicts(
    userId: string,
    domain: string,
    newProvenance: SourceProvenance
  ): Promise<ConflictDetection[]> {
    const conflicts: ConflictDetection[] = [];

    // Get existing provenance for same domain
    const existingProvenance = await this.getProvenanceByDomain(userId, domain, {
      includeStale: false,
    });

    // Check for conflicts
    for (const existing of existingProvenance) {
      // Skip if same source
      if (existing.id === newProvenance.id) continue;

      // Check for duplicate (same source type, close effective dates)
      if (this.isDuplicate(existing, newProvenance)) {
        conflicts.push({
          conflictId: this.generateConflictId(),
          conflictType: 'duplicate',
          provenanceIds: [existing.id, newProvenance.id],
          domain,
          detectedAt: new Date().toISOString(),
          severity: 'low',
          description: `Duplicate ${newProvenance.sourceType} data detected`,
          suggestedResolution: 'Use most recent or highest confidence',
        });
      }

      // Check for contradiction (conflicting values)
      if (this.isContradiction(existing, newProvenance)) {
        conflicts.push({
          conflictId: this.generateConflictId(),
          conflictType: 'contradiction',
          provenanceIds: [existing.id, newProvenance.id],
          domain,
          detectedAt: new Date().toISOString(),
          severity: this.assessConflictSeverity(existing, newProvenance),
          description: `Contradictory ${domain} data from different sources`,
          suggestedResolution: 'Apply precedence rules or user confirmation',
        });
      }
    }

    if (conflicts.length > 0) {
      logger.warn('⚠️ [PROVENANCE] Conflicts detected', {
        userId,
        domain,
        conflictCount: conflicts.length,
      });
    }

    return conflicts;
  }

  /**
   * Resolve conflict using precedence rules
   */
  static async resolveConflict(
    conflict: ConflictDetection,
    resolution: 'use_first' | 'use_second' | 'merge' | 'user_decision'
  ): Promise<void> {
    // In production, this would update provenance records
    logger.info('✅ [PROVENANCE] Conflict resolved', {
      conflictId: conflict.conflictId,
      resolution,
    });
  }

  /**
   * Update freshness status for all provenance
   */
  static async updateFreshnessStatus(userId: string): Promise<void> {
    // In production, this would update all provenance records
    logger.info('🔄 [PROVENANCE] Updating freshness status', { userId });
  }

  /**
   * Get source metadata for downstream consumers
   */
  static async getSourceMetadata(provenanceId: string): Promise<SourceMetadata | null> {
    const provenance = await this.getProvenance(provenanceId);
    if (!provenance) return null;

    return {
      provenanceId: provenance.id,
      sourceType: provenance.sourceType,
      sourceSystem: provenance.sourceSystem,
      confidenceScore: provenance.confidenceScore,
      dataQuality: provenance.dataQuality,
      freshnessStatus: provenance.freshnessStatus,
      effectiveDate: provenance.effectiveDate,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static generateProvenanceId(): string {
    return `prov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateConflictId(): string {
    return `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static calculateDefaultConfidence(sourceSystem: SourceSystem): number {
    const confidenceMap: Record<SourceSystem, number> = {
      manual_upload: 0.7,
      whoop: 0.9,
      oura: 0.9,
      apple_watch: 0.85,
      garmin: 0.85,
      fitbit: 0.8,
      sleep_number: 0.85,
      withings: 0.85,
      ai_agent: 0.75,
      ocr_extraction: 0.6,
      user_input: 0.95,
      system_derived: 0.7,
    };

    return confidenceMap[sourceSystem] ?? 0.5;
  }

  private static assessDataQuality(
    sourceSystem: SourceSystem,
    sourceType: SourceType
  ): DataQuality {
    // High quality: Direct device integrations, user-confirmed input
    if (['whoop', 'oura', 'apple_watch', 'garmin', 'user_input'].includes(sourceSystem)) {
      return 'high';
    }

    // Medium quality: Manual uploads, AI extraction
    if (['manual_upload', 'ai_agent', 'ocr_extraction'].includes(sourceSystem)) {
      return 'medium';
    }

    // Low quality: Derived/inferred data
    if (sourceSystem === 'system_derived') {
      return 'low';
    }

    return 'unknown';
  }

  private static assessFreshness(effectiveDate: string): FreshnessStatus {
    const effective = new Date(effectiveDate);
    const now = new Date();
    const daysDiff = (now.getTime() - effective.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff <= 1) return 'fresh';
    if (daysDiff <= 7) return 'recent';
    if (daysDiff <= 30) return 'stale';
    return 'expired';
  }

  private static calculateExpiration(sourceType: SourceType, effectiveDate: string): string {
    const effective = new Date(effectiveDate);
    
    // Different data types have different expiration windows
    const expirationDays: Record<SourceType, number> = {
      bloodwork: 90, // 3 months
      body_composition: 30, // 1 month
      workout_program: 90, // 3 months
      device_sync: 7, // 1 week
      daily_interview: 1, // 1 day
      nutrition_intake: 1, // 1 day
      nutrition_plan: 90, // 3 months
      hydration_log: 1, // 1 day
      supplement_upload: 90, // 3 months
      clinical_document: 365, // 1 year
      baseline_profile: 365, // 1 year
      manual_entry: 30, // 1 month
      ai_generated: 30, // 1 month
      derived: 7, // 1 week
    };

    const days = expirationDays[sourceType] ?? 30;
    const expiration = new Date(effective);
    expiration.setDate(expiration.getDate() + days);
    
    return expiration.toISOString();
  }

  private static isDuplicate(
    existing: SourceProvenance,
    newProvenance: SourceProvenance
  ): boolean {
    // Same source type
    if (existing.sourceType !== newProvenance.sourceType) return false;

    // Close effective dates (within 1 day)
    const existingDate = new Date(existing.effectiveDate);
    const newDate = new Date(newProvenance.effectiveDate);
    const daysDiff = Math.abs((existingDate.getTime() - newDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysDiff <= 1;
  }

  private static isContradiction(
    existing: SourceProvenance,
    newProvenance: SourceProvenance
  ): boolean {
    // Different source systems for same domain and time period
    if (existing.sourceSystem === newProvenance.sourceSystem) return false;
    if (existing.domain !== newProvenance.domain) return false;

    // Overlapping effective dates
    const existingDate = new Date(existing.effectiveDate);
    const newDate = new Date(newProvenance.effectiveDate);
    const daysDiff = Math.abs((existingDate.getTime() - newDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysDiff <= 7; // Within 1 week
  }

  private static assessConflictSeverity(
    existing: SourceProvenance,
    newProvenance: SourceProvenance
  ): ConflictDetection['severity'] {
    // Critical domains
    if (['cardiovascular', 'medical_context'].includes(existing.domain)) {
      return 'critical';
    }

    // High confidence conflict
    if (existing.confidenceScore > 0.8 && newProvenance.confidenceScore > 0.8) {
      return 'high';
    }

    // Medium confidence conflict
    if (existing.confidenceScore > 0.6 || newProvenance.confidenceScore > 0.6) {
      return 'medium';
    }

    return 'low';
  }
}

// ============================================================================
// PRECEDENCE RULES
// ============================================================================

export class SourcePrecedenceRules {
  /**
   * Determine which source should take precedence in case of conflict
   * 
   * Precedence order (highest to lowest):
   * 1. User-confirmed structured input
   * 2. Validated clinical document extraction
   * 3. Trusted device integration (Whoop, Oura, Apple Watch)
   * 4. Manual upload with high confidence
   * 5. OCR extraction with high confidence
   * 6. AI-generated/inferred signals
   * 7. System-derived data
   */
  static determinePrecedence(
    provenance1: SourceProvenance,
    provenance2: SourceProvenance
  ): SourceProvenance {
    const score1 = this.calculatePrecedenceScore(provenance1);
    const score2 = this.calculatePrecedenceScore(provenance2);

    logger.info('🔍 [PRECEDENCE] Determining precedence', {
      source1: provenance1.sourceSystem,
      score1,
      source2: provenance2.sourceSystem,
      score2,
      winner: score1 >= score2 ? provenance1.sourceSystem : provenance2.sourceSystem,
    });

    return score1 >= score2 ? provenance1 : provenance2;
  }

  private static calculatePrecedenceScore(provenance: SourceProvenance): number {
    let score = 0;

    // Base score by source system
    const systemScores: Record<SourceSystem, number> = {
      user_input: 100,
      whoop: 90,
      oura: 90,
      apple_watch: 85,
      garmin: 85,
      sleep_number: 85,
      withings: 85,
      fitbit: 80,
      manual_upload: 70,
      ai_agent: 60,
      ocr_extraction: 50,
      system_derived: 40,
    };

    score += systemScores[provenance.sourceSystem] ?? 50;

    // Adjust by confidence
    score += provenance.confidenceScore * 20;

    // Adjust by data quality
    const qualityBonus = {
      high: 10,
      medium: 5,
      low: 0,
      unknown: -5,
    };
    score += qualityBonus[provenance.dataQuality];

    // Adjust by freshness
    const freshnessBonus = {
      fresh: 10,
      recent: 5,
      stale: -5,
      expired: -10,
    };
    score += freshnessBonus[provenance.freshnessStatus];

    return score;
  }

  /**
   * Check if user confirmation is required for conflict resolution
   */
  static requiresUserConfirmation(conflict: ConflictDetection): boolean {
    // Critical severity always requires user confirmation
    if (conflict.severity === 'critical') return true;

    // High severity in certain domains requires confirmation
    if (conflict.severity === 'high' && 
        ['cardiovascular', 'medical_context', 'medication'].includes(conflict.domain)) {
      return true;
    }

    return false;
  }
}
