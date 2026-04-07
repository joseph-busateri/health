/**
 * Medical Context Normalizer - Phase 19
 * 
 * Purpose: Normalize medical context from multiple sources into canonical model
 * Critical Gap: Medical context scattered across baseline, interviews, documents
 * 
 * Sources:
 * - Baseline profile (conditions, medications, allergies, injuries, surgeries, family history)
 * - Clinical documents (diagnoses, medications, procedures)
 * - Daily interviews (symptoms, concerns)
 * - Device data (health metrics)
 */

import { logger } from '../utils/logger';
import type { BaselineProfile } from './baselineProfileService';
import type { ClinicalDocument } from './clinicalDocumentFormalizer';

// ============================================================================
// CANONICAL MEDICAL CONTEXT MODEL
// ============================================================================

export interface MedicalContext {
  userId: string;
  
  // Current conditions
  conditions: MedicalCondition[];
  
  // Current medications
  medications: Medication[];
  
  // Allergies
  allergies: Allergy[];
  
  // Past medical history
  pastHistory: {
    injuries: Injury[];
    surgeries: Surgery[];
    hospitalizations: Hospitalization[];
  };
  
  // Family history
  familyHistory: FamilyHistoryEntry[];
  
  // Lifestyle factors
  lifestyleFactors: {
    smoking: 'never' | 'former' | 'current';
    alcohol: 'none' | 'light' | 'moderate' | 'heavy';
    exercise: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    diet: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'other';
    stress: 'low' | 'moderate' | 'high' | 'very_high';
  };
  
  // Risk factors
  riskFactors: RiskFactor[];
  
  // Contraindications
  contraindications: Contraindication[];
  
  // Safety constraints
  safetyConstraints: SafetyConstraint[];
  
  // Source tracking
  sources: Array<{
    sourceType: 'baseline' | 'clinical_document' | 'interview' | 'device';
    sourceId: string;
    ingestedAt: string;
  }>;
  
  // Metadata
  lastUpdated: string;
  confidence: number; // 0-1
  completeness: number; // 0-1
}

export interface MedicalCondition {
  name: string;
  icd10Code?: string;
  category: 'cardiovascular' | 'metabolic' | 'musculoskeletal' | 'neurological' | 'respiratory' | 'other';
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'resolved' | 'managed';
  diagnosedDate?: string;
  source: string;
  notes?: string;
}

export interface Medication {
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route?: string;
  purpose: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'discontinued' | 'as_needed';
  prescribedBy?: string;
  source: string;
  sideEffects?: string[];
}

export interface Allergy {
  allergen: string;
  allergyType: 'medication' | 'food' | 'environmental' | 'other';
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  source: string;
}

export interface Injury {
  name: string;
  bodyPart: string;
  date: string;
  severity: 'minor' | 'moderate' | 'major';
  status: 'healed' | 'healing' | 'chronic';
  source: string;
  notes?: string;
}

export interface Surgery {
  name: string;
  date: string;
  surgeon?: string;
  facility?: string;
  complications?: string;
  source: string;
}

export interface Hospitalization {
  reason: string;
  admitDate: string;
  dischargeDate: string;
  facility?: string;
  source: string;
}

export interface FamilyHistoryEntry {
  condition: string;
  relation: 'parent' | 'sibling' | 'grandparent' | 'other';
  ageOfOnset?: number;
  source: string;
}

export interface RiskFactor {
  factor: string;
  category: 'cardiovascular' | 'metabolic' | 'cancer' | 'other';
  severity: 'low' | 'moderate' | 'high';
  modifiable: boolean;
  source: string;
}

export interface Contraindication {
  type: 'exercise' | 'medication' | 'supplement' | 'activity' | 'food';
  item: string;
  reason: string;
  severity: 'absolute' | 'relative';
  source: string;
}

export interface SafetyConstraint {
  domain: 'workout' | 'nutrition' | 'recovery' | 'cardiovascular' | 'general';
  constraint: string;
  reason: string;
  priority: 'critical' | 'high' | 'moderate';
  source: string;
}

// ============================================================================
// MEDICAL CONTEXT NORMALIZER
// ============================================================================

export class MedicalContextNormalizer {
  /**
   * Normalize medical context from all sources
   */
  static normalizeContext(
    userId: string,
    baseline: BaselineProfile | null,
    clinicalDocuments: ClinicalDocument[],
    interviewData?: any
  ): MedicalContext {
    const context: MedicalContext = {
      userId,
      conditions: [],
      medications: [],
      allergies: [],
      pastHistory: {
        injuries: [],
        surgeries: [],
        hospitalizations: [],
      },
      familyHistory: [],
      lifestyleFactors: {
        smoking: 'never',
        alcohol: 'none',
        exercise: 'moderate',
        diet: 'standard',
        stress: 'moderate',
      },
      riskFactors: [],
      contraindications: [],
      safetyConstraints: [],
      sources: [],
      lastUpdated: new Date().toISOString(),
      confidence: 0,
      completeness: 0,
    };

    // Integrate baseline profile
    if (baseline) {
      this.integrateBaseline(context, baseline);
    }

    // Integrate clinical documents
    clinicalDocuments.forEach(doc => {
      this.integrateClinicalDocument(context, doc);
    });

    // Integrate interview data
    if (interviewData) {
      this.integrateInterview(context, interviewData);
    }

    // Deduplicate and merge
    this.deduplicateContext(context);

    // Generate risk factors
    context.riskFactors = this.generateRiskFactors(context);

    // Generate contraindications
    context.contraindications = this.generateContraindications(context);

    // Generate safety constraints
    context.safetyConstraints = this.generateSafetyConstraints(context);

    // Calculate confidence and completeness
    context.confidence = this.calculateConfidence(context);
    context.completeness = this.calculateCompleteness(context);

    logger.info('✅ [MEDICAL CONTEXT] Context normalized', {
      userId,
      conditionCount: context.conditions.length,
      medicationCount: context.medications.length,
      confidence: context.confidence.toFixed(2),
      completeness: context.completeness.toFixed(2),
    });

    return context;
  }

  /**
   * Integrate baseline profile
   */
  private static integrateBaseline(context: MedicalContext, baseline: BaselineProfile): void {
    // Conditions
    baseline.conditions?.forEach(condition => {
      context.conditions.push({
        name: condition,
        category: this.categorizeCondition(condition),
        severity: 'moderate',
        status: 'active',
        source: 'baseline',
      });
    });

    // Medications
    baseline.medications?.forEach(medication => {
      context.medications.push({
        name: medication,
        dosage: 'Unknown',
        frequency: 'Unknown',
        purpose: 'Unknown',
        status: 'active',
        source: 'baseline',
      });
    });

    // Allergies
    baseline.allergies?.forEach(allergy => {
      context.allergies.push({
        allergen: allergy,
        allergyType: 'other',
        reaction: 'Unknown',
        severity: 'moderate',
        source: 'baseline',
      });
    });

    // Injuries
    baseline.injuries?.forEach(injury => {
      context.pastHistory.injuries.push({
        name: injury,
        bodyPart: 'Unknown',
        date: 'Unknown',
        severity: 'moderate',
        status: 'chronic',
        source: 'baseline',
      });
    });

    // Surgeries
    baseline.surgeries?.forEach(surgery => {
      context.pastHistory.surgeries.push({
        name: surgery,
        date: 'Unknown',
        source: 'baseline',
      });
    });

    // Family history
    if (baseline.familyHistory) {
      Object.entries(baseline.familyHistory).forEach(([condition, details]: [string, any]) => {
        context.familyHistory.push({
          condition,
          relation: 'other',
          source: 'baseline',
        });
      });
    }

    // Lifestyle factors
    if (baseline.activityLevel) {
      context.lifestyleFactors.exercise = this.mapActivityLevel(baseline.activityLevel);
    }
    if (baseline.stressEnvironment) {
      context.lifestyleFactors.stress = baseline.stressEnvironment;
    }

    // Add source
    context.sources.push({
      sourceType: 'baseline',
      sourceId: 'baseline-profile',
      ingestedAt: baseline.updatedAt || baseline.createdAt || new Date().toISOString(),
    });
  }

  /**
   * Integrate clinical document
   */
  private static integrateClinicalDocument(context: MedicalContext, doc: ClinicalDocument): void {
    // Conditions
    doc.extractedData.conditions?.forEach(condition => {
      context.conditions.push({
        name: condition,
        category: this.categorizeCondition(condition),
        severity: 'moderate',
        status: 'active',
        diagnosedDate: doc.effectiveDate,
        source: `clinical_document:${doc.id}`,
      });
    });

    // Medications
    doc.extractedData.medications?.forEach(med => {
      context.medications.push({
        name: med.name,
        dosage: med.dosage || 'Unknown',
        frequency: med.frequency || 'Unknown',
        purpose: 'Unknown',
        status: med.action === 'stopped' ? 'discontinued' : 'active',
        startDate: doc.effectiveDate,
        source: `clinical_document:${doc.id}`,
      });
    });

    // Procedures (add to surgeries if surgical)
    doc.extractedData.procedures?.forEach(proc => {
      if (this.isSurgicalProcedure(proc.name)) {
        context.pastHistory.surgeries.push({
          name: proc.name,
          date: proc.date || doc.effectiveDate,
          source: `clinical_document:${doc.id}`,
        });
      }
    });

    // Add source
    context.sources.push({
      sourceType: 'clinical_document',
      sourceId: doc.id,
      ingestedAt: doc.uploadedAt,
    });
  }

  /**
   * Integrate interview data
   */
  private static integrateInterview(context: MedicalContext, interviewData: any): void {
    // Extract symptoms as potential conditions
    if (interviewData.symptoms) {
      interviewData.symptoms.forEach((symptom: string) => {
        context.conditions.push({
          name: symptom,
          category: 'other',
          severity: 'mild',
          status: 'active',
          source: 'interview',
          notes: 'Self-reported symptom',
        });
      });
    }

    // Add source
    context.sources.push({
      sourceType: 'interview',
      sourceId: interviewData.id || 'interview',
      ingestedAt: interviewData.timestamp || new Date().toISOString(),
    });
  }

  /**
   * Deduplicate context entries
   */
  private static deduplicateContext(context: MedicalContext): void {
    // Deduplicate conditions
    const conditionMap = new Map<string, MedicalCondition>();
    context.conditions.forEach(condition => {
      const key = condition.name.toLowerCase();
      if (!conditionMap.has(key) || condition.source.includes('clinical_document')) {
        conditionMap.set(key, condition);
      }
    });
    context.conditions = Array.from(conditionMap.values());

    // Deduplicate medications
    const medicationMap = new Map<string, Medication>();
    context.medications.forEach(medication => {
      const key = medication.name.toLowerCase();
      if (!medicationMap.has(key) || medication.source.includes('clinical_document')) {
        medicationMap.set(key, medication);
      }
    });
    context.medications = Array.from(medicationMap.values());

    // Deduplicate allergies
    const allergyMap = new Map<string, Allergy>();
    context.allergies.forEach(allergy => {
      const key = allergy.allergen.toLowerCase();
      if (!allergyMap.has(key)) {
        allergyMap.set(key, allergy);
      }
    });
    context.allergies = Array.from(allergyMap.values());
  }

  /**
   * Generate risk factors from context
   */
  private static generateRiskFactors(context: MedicalContext): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    // Cardiovascular risk factors
    const cvConditions = context.conditions.filter(c => c.category === 'cardiovascular');
    if (cvConditions.length > 0) {
      riskFactors.push({
        factor: 'Cardiovascular disease history',
        category: 'cardiovascular',
        severity: 'high',
        modifiable: false,
        source: 'derived',
      });
    }

    // Metabolic risk factors
    const metabolicConditions = context.conditions.filter(c => c.category === 'metabolic');
    if (metabolicConditions.length > 0) {
      riskFactors.push({
        factor: 'Metabolic condition',
        category: 'metabolic',
        severity: 'moderate',
        modifiable: true,
        source: 'derived',
      });
    }

    // Lifestyle risk factors
    if (context.lifestyleFactors.smoking === 'current') {
      riskFactors.push({
        factor: 'Current smoker',
        category: 'cardiovascular',
        severity: 'high',
        modifiable: true,
        source: 'derived',
      });
    }

    if (context.lifestyleFactors.stress === 'high' || context.lifestyleFactors.stress === 'very_high') {
      riskFactors.push({
        factor: 'High stress',
        category: 'cardiovascular',
        severity: 'moderate',
        modifiable: true,
        source: 'derived',
      });
    }

    return riskFactors;
  }

  /**
   * Generate contraindications from context
   */
  private static generateContraindications(context: MedicalContext): Contraindication[] {
    const contraindications: Contraindication[] = [];

    // Injury-based contraindications
    context.pastHistory.injuries.forEach(injury => {
      if (injury.status === 'healing' || injury.status === 'chronic') {
        contraindications.push({
          type: 'exercise',
          item: `High-impact exercises involving ${injury.bodyPart}`,
          reason: `Active/chronic injury: ${injury.name}`,
          severity: 'relative',
          source: 'derived',
        });
      }
    });

    // Cardiovascular contraindications
    const hasCardiovascular = context.conditions.some(c => c.category === 'cardiovascular');
    if (hasCardiovascular) {
      contraindications.push({
        type: 'exercise',
        item: 'Maximum intensity training without medical clearance',
        reason: 'Cardiovascular condition present',
        severity: 'absolute',
        source: 'derived',
      });
    }

    return contraindications;
  }

  /**
   * Generate safety constraints from context
   */
  private static generateSafetyConstraints(context: MedicalContext): SafetyConstraint[] {
    const constraints: SafetyConstraint[] = [];

    // Cardiovascular constraints
    const cvConditions = context.conditions.filter(c => c.category === 'cardiovascular');
    if (cvConditions.length > 0) {
      constraints.push({
        domain: 'cardiovascular',
        constraint: 'Monitor heart rate during exercise',
        reason: 'Cardiovascular condition present',
        priority: 'critical',
        source: 'derived',
      });
      constraints.push({
        domain: 'workout',
        constraint: 'Limit maximum heart rate to 80% of age-predicted max',
        reason: 'Cardiovascular safety',
        priority: 'high',
        source: 'derived',
      });
    }

    // Injury constraints
    context.pastHistory.injuries.forEach(injury => {
      if (injury.status !== 'healed') {
        constraints.push({
          domain: 'workout',
          constraint: `Avoid exercises stressing ${injury.bodyPart}`,
          reason: `Active injury: ${injury.name}`,
          priority: 'high',
          source: 'derived',
        });
      }
    });

    return constraints;
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(context: MedicalContext): number {
    let confidence = 0.5;

    // More sources = higher confidence
    if (context.sources.length >= 3) confidence += 0.2;
    else if (context.sources.length >= 2) confidence += 0.1;

    // Clinical documents = higher confidence
    const hasClinicalDocs = context.sources.some(s => s.sourceType === 'clinical_document');
    if (hasClinicalDocs) confidence += 0.2;

    // Complete data = higher confidence
    if (context.conditions.length > 0) confidence += 0.05;
    if (context.medications.length > 0) confidence += 0.05;
    if (context.allergies.length > 0) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate completeness score
   */
  private static calculateCompleteness(context: MedicalContext): number {
    let score = 0;
    let maxScore = 7;

    if (context.conditions.length > 0) score++;
    if (context.medications.length > 0) score++;
    if (context.allergies.length > 0) score++;
    if (context.pastHistory.injuries.length > 0 || context.pastHistory.surgeries.length > 0) score++;
    if (context.familyHistory.length > 0) score++;
    if (context.riskFactors.length > 0) score++;
    if (context.safetyConstraints.length > 0) score++;

    return score / maxScore;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static categorizeCondition(condition: string): MedicalCondition['category'] {
    const lower = condition.toLowerCase();
    
    if (lower.includes('heart') || lower.includes('cardiac') || lower.includes('blood pressure') || lower.includes('hypertension')) {
      return 'cardiovascular';
    }
    if (lower.includes('diabetes') || lower.includes('glucose') || lower.includes('metabolic')) {
      return 'metabolic';
    }
    if (lower.includes('joint') || lower.includes('muscle') || lower.includes('bone') || lower.includes('arthritis')) {
      return 'musculoskeletal';
    }
    if (lower.includes('brain') || lower.includes('nerve') || lower.includes('neurological')) {
      return 'neurological';
    }
    if (lower.includes('lung') || lower.includes('asthma') || lower.includes('respiratory')) {
      return 'respiratory';
    }
    
    return 'other';
  }

  private static mapActivityLevel(activityLevel: string): MedicalContext['lifestyleFactors']['exercise'] {
    switch (activityLevel) {
      case 'sedentary': return 'sedentary';
      case 'lightly_active': return 'light';
      case 'moderately_active': return 'moderate';
      case 'very_active': return 'active';
      case 'extremely_active': return 'very_active';
      default: return 'moderate';
    }
  }

  private static isSurgicalProcedure(procedureName: string): boolean {
    const lower = procedureName.toLowerCase();
    return lower.includes('surgery') || 
           lower.includes('operation') || 
           lower.includes('repair') ||
           lower.includes('replacement') ||
           lower.includes('removal');
  }
}

// ============================================================================
// SERVICE METHODS
// ============================================================================

export async function getMedicalContext(userId: string): Promise<MedicalContext | null> {
  // This would fetch and normalize from all sources
  logger.info('📋 [MEDICAL CONTEXT] Fetching context', { userId });
  return null;
}

export async function saveMedicalContext(context: MedicalContext): Promise<MedicalContext> {
  // This would persist normalized context
  logger.info('✅ [MEDICAL CONTEXT] Context saved', {
    userId: context.userId,
    conditionCount: context.conditions.length,
    medicationCount: context.medications.length,
  });
  
  return context;
}
