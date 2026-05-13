/**
 * Clinical Document Formalizer - Phase 19
 * 
 * Purpose: Formalize "uploaded health documents" into structured clinical documents
 * Critical Gap: Documents exist but are vague "uploaded health documents"
 * 
 * Document Types:
 * - Doctor visit summaries
 * - Imaging reports (MRI, X-ray, CT, ultrasound)
 * - Diagnosis summaries
 * - Medication changes
 * - Lab reports (non-bloodwork)
 * - Specialist consultations
 * - Surgical reports
 * - Discharge summaries
 */

import { logger } from '../utils/logger';

// ============================================================================
// CLINICAL DOCUMENT MODEL
// ============================================================================

export type ClinicalDocumentType = 
  | 'doctor_visit'
  | 'imaging_report'
  | 'diagnosis'
  | 'medication_change'
  | 'lab_report'
  | 'specialist_consult'
  | 'surgical_report'
  | 'discharge_summary'
  | 'prescription'
  | 'referral'
  | 'other';

export interface ClinicalDocument {
  id: string;
  userId: string;
  
  // Document classification
  documentType: ClinicalDocumentType;
  documentSubtype?: string;
  title: string;
  description?: string;
  
  // Source information
  source: 'upload' | 'fax' | 'ehr_integration' | 'manual_entry';
  uploadedAt: string;
  effectiveDate: string; // Date of visit/test/procedure
  
  // Provider information
  provider?: {
    name: string;
    specialty?: string;
    facility?: string;
    npi?: string;
  };
  
  // Extracted content
  extractedData: {
    // Conditions/diagnoses
    conditions?: string[];
    icd10Codes?: string[];
    
    // Medications
    medications?: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
      action: 'started' | 'stopped' | 'changed' | 'continued';
    }>;
    
    // Procedures
    procedures?: Array<{
      name: string;
      cptCode?: string;
      date?: string;
    }>;
    
    // Findings
    findings?: string[];
    impressions?: string[];
    
    // Recommendations
    recommendations?: string[];
    followUp?: string[];
    
    // Vitals (if present)
    vitals?: {
      bloodPressure?: string;
      heartRate?: number;
      weight?: number;
      height?: number;
      temperature?: number;
    };
    
    // Lab values (if present)
    labValues?: Array<{
      test: string;
      value: string;
      unit?: string;
      referenceRange?: string;
      flag?: 'normal' | 'low' | 'high' | 'critical';
    }>;
  };
  
  // Safety and constraints
  safetyFlags: {
    contraindications?: string[];
    allergies?: string[];
    warnings?: string[];
    restrictions?: string[];
  };
  
  // Context enrichment
  contextTags: string[];
  relevantDomains: Array<'cardiovascular' | 'metabolic' | 'musculoskeletal' | 'neurological' | 'other'>;
  
  // Document metadata
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  
  // Processing metadata
  extractionMethod: 'ai' | 'manual' | 'ocr' | 'structured';
  extractionConfidence: number; // 0-1
  validated: boolean;
  validatedBy?: string;
  validatedAt?: string;
  
  // Status
  status: 'pending' | 'processed' | 'validated' | 'archived';
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CLINICAL DOCUMENT FORMALIZER
// ============================================================================

export class ClinicalDocumentFormalizer {
  /**
   * Formalize uploaded document into clinical document
   */
  static formalizeDocument(
    userId: string,
    uploadData: any,
    extractedContent?: any
  ): ClinicalDocument {
    const documentType = this.classifyDocument(uploadData, extractedContent);
    const extractedData = this.extractStructuredData(extractedContent, documentType);
    const safetyFlags = this.extractSafetyFlags(extractedData);
    const contextTags = this.generateContextTags(extractedData, documentType);
    const relevantDomains = this.identifyRelevantDomains(extractedData, documentType);

    const document: ClinicalDocument = {
      id: uploadData.id || this.generateId(),
      userId,
      documentType,
      documentSubtype: uploadData.subtype,
      title: uploadData.title || this.generateTitle(documentType, extractedData),
      description: uploadData.description,
      source: uploadData.source || 'upload',
      uploadedAt: uploadData.uploadedAt || new Date().toISOString(),
      effectiveDate: uploadData.effectiveDate || uploadData.visitDate || new Date().toISOString().split('T')[0],
      provider: this.extractProvider(extractedContent),
      extractedData,
      safetyFlags,
      contextTags,
      relevantDomains,
      fileUrl: uploadData.fileUrl,
      fileType: uploadData.fileType,
      fileSize: uploadData.fileSize,
      extractionMethod: extractedContent ? 'ai' : 'manual',
      extractionConfidence: this.calculateExtractionConfidence(extractedContent),
      validated: false,
      status: 'processed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logger.info('✅ [CLINICAL DOCUMENT] Document formalized', {
      userId,
      documentId: document.id,
      documentType: document.documentType,
      extractionConfidence: document.extractionConfidence,
    });

    return document;
  }

  /**
   * Classify document type
   */
  private static classifyDocument(uploadData: any, extractedContent?: any): ClinicalDocumentType {
    // Check explicit type
    if (uploadData.documentType) {
      return uploadData.documentType;
    }

    // Classify from title/filename
    const text = (uploadData.title || uploadData.filename || '').toLowerCase();
    
    if (text.includes('visit') || text.includes('appointment') || text.includes('office note')) {
      return 'doctor_visit';
    }
    if (text.includes('mri') || text.includes('xray') || text.includes('ct') || text.includes('ultrasound') || text.includes('imaging')) {
      return 'imaging_report';
    }
    if (text.includes('diagnosis') || text.includes('assessment')) {
      return 'diagnosis';
    }
    if (text.includes('medication') || text.includes('prescription') || text.includes('rx')) {
      return 'medication_change';
    }
    if (text.includes('lab') || text.includes('test result')) {
      return 'lab_report';
    }
    if (text.includes('specialist') || text.includes('consult')) {
      return 'specialist_consult';
    }
    if (text.includes('surgery') || text.includes('operation') || text.includes('procedure')) {
      return 'surgical_report';
    }
    if (text.includes('discharge')) {
      return 'discharge_summary';
    }

    // Classify from extracted content
    if (extractedContent) {
      if (extractedContent.procedures && extractedContent.procedures.length > 0) {
        return 'surgical_report';
      }
      if (extractedContent.medications && extractedContent.medications.length > 0) {
        return 'medication_change';
      }
      if (extractedContent.imaging || extractedContent.findings) {
        return 'imaging_report';
      }
    }

    return 'other';
  }

  /**
   * Extract structured data from content
   */
  private static extractStructuredData(
    extractedContent: any,
    documentType: ClinicalDocumentType
  ): ClinicalDocument['extractedData'] {
    if (!extractedContent) {
      return {};
    }

    return {
      conditions: extractedContent.conditions || extractedContent.diagnoses || [],
      icd10Codes: extractedContent.icd10Codes || [],
      medications: this.normalizeMedications(extractedContent.medications || []),
      procedures: extractedContent.procedures || [],
      findings: extractedContent.findings || [],
      impressions: extractedContent.impressions || [],
      recommendations: extractedContent.recommendations || [],
      followUp: extractedContent.followUp || [],
      vitals: extractedContent.vitals,
      labValues: this.normalizeLabValues(extractedContent.labValues || []),
    };
  }

  /**
   * Extract safety flags
   */
  private static extractSafetyFlags(
    extractedData: ClinicalDocument['extractedData']
  ): ClinicalDocument['safetyFlags'] {
    const flags: ClinicalDocument['safetyFlags'] = {
      contraindications: [],
      allergies: [],
      warnings: [],
      restrictions: [],
    };

    // Extract from medications
    extractedData.medications?.forEach(med => {
      if (med.action === 'stopped') {
        flags.contraindications?.push(`Medication stopped: ${med.name}`);
      }
    });

    // Extract from recommendations
    extractedData.recommendations?.forEach(rec => {
      const lower = rec.toLowerCase();
      if (lower.includes('avoid') || lower.includes('do not')) {
        flags.restrictions?.push(rec);
      }
      if (lower.includes('warning') || lower.includes('caution')) {
        flags.warnings?.push(rec);
      }
    });

    return flags;
  }

  /**
   * Generate context tags
   */
  private static generateContextTags(
    extractedData: ClinicalDocument['extractedData'],
    documentType: ClinicalDocumentType
  ): string[] {
    const tags: Set<string> = new Set();

    // Add document type tag
    tags.add(documentType);

    // Add condition tags
    extractedData.conditions?.forEach(condition => {
      const lower = condition.toLowerCase();
      if (lower.includes('diabetes')) tags.add('diabetes');
      if (lower.includes('hypertension') || lower.includes('blood pressure')) tags.add('hypertension');
      if (lower.includes('heart') || lower.includes('cardiac')) tags.add('cardiovascular');
      if (lower.includes('cholesterol') || lower.includes('lipid')) tags.add('lipids');
      if (lower.includes('injury') || lower.includes('pain')) tags.add('musculoskeletal');
    });

    // Add medication tags
    extractedData.medications?.forEach(med => {
      const lower = med.name.toLowerCase();
      if (lower.includes('statin')) tags.add('cholesterol_management');
      if (lower.includes('metformin')) tags.add('diabetes_management');
      if (lower.includes('blood pressure') || lower.includes('bp')) tags.add('hypertension_management');
    });

    return Array.from(tags);
  }

  /**
   * Identify relevant health domains
   */
  private static identifyRelevantDomains(
    extractedData: ClinicalDocument['extractedData'],
    documentType: ClinicalDocumentType
  ): ClinicalDocument['relevantDomains'] {
    const domains: Set<ClinicalDocument['relevantDomains'][number]> = new Set();

    // Check conditions
    extractedData.conditions?.forEach(condition => {
      const lower = condition.toLowerCase();
      if (lower.includes('heart') || lower.includes('cardiac') || lower.includes('blood pressure')) {
        domains.add('cardiovascular');
      }
      if (lower.includes('diabetes') || lower.includes('glucose') || lower.includes('insulin')) {
        domains.add('metabolic');
      }
      if (lower.includes('joint') || lower.includes('muscle') || lower.includes('bone') || lower.includes('injury')) {
        domains.add('musculoskeletal');
      }
      if (lower.includes('brain') || lower.includes('nerve') || lower.includes('neurological')) {
        domains.add('neurological');
      }
    });

    // Check vitals
    if (extractedData.vitals?.bloodPressure || extractedData.vitals?.heartRate) {
      domains.add('cardiovascular');
    }

    // Default to other if no specific domain
    if (domains.size === 0) {
      domains.add('other');
    }

    return Array.from(domains);
  }

  /**
   * Extract provider information
   */
  private static extractProvider(extractedContent: any): ClinicalDocument['provider'] | undefined {
    if (!extractedContent || !extractedContent.provider) {
      return undefined;
    }

    return {
      name: extractedContent.provider.name || extractedContent.providerName,
      specialty: extractedContent.provider.specialty || extractedContent.specialty,
      facility: extractedContent.provider.facility || extractedContent.facility,
      npi: extractedContent.provider.npi,
    };
  }

  /**
   * Normalize medications
   */
  private static normalizeMedications(medications: any[]): ClinicalDocument['extractedData']['medications'] {
    return medications.map(med => ({
      name: med.name || med.medication,
      dosage: med.dosage || med.dose,
      frequency: med.frequency,
      action: med.action || 'continued',
    }));
  }

  /**
   * Normalize lab values
   */
  private static normalizeLabValues(labValues: any[]): ClinicalDocument['extractedData']['labValues'] {
    return labValues.map(lab => ({
      test: lab.test || lab.name,
      value: lab.value?.toString() || '',
      unit: lab.unit,
      referenceRange: lab.referenceRange || lab.range,
      flag: lab.flag || lab.status || 'normal',
    }));
  }

  /**
   * Calculate extraction confidence
   */
  private static calculateExtractionConfidence(extractedContent: any): number {
    if (!extractedContent) return 0.3;

    let confidence = 0.5;

    if (extractedContent.conditions && extractedContent.conditions.length > 0) confidence += 0.15;
    if (extractedContent.medications && extractedContent.medications.length > 0) confidence += 0.15;
    if (extractedContent.findings && extractedContent.findings.length > 0) confidence += 0.1;
    if (extractedContent.recommendations && extractedContent.recommendations.length > 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate title from document type and data
   */
  private static generateTitle(
    documentType: ClinicalDocumentType,
    extractedData: ClinicalDocument['extractedData']
  ): string {
    const typeNames: Record<ClinicalDocumentType, string> = {
      doctor_visit: 'Doctor Visit',
      imaging_report: 'Imaging Report',
      diagnosis: 'Diagnosis',
      medication_change: 'Medication Change',
      lab_report: 'Lab Report',
      specialist_consult: 'Specialist Consultation',
      surgical_report: 'Surgical Report',
      discharge_summary: 'Discharge Summary',
      prescription: 'Prescription',
      referral: 'Referral',
      other: 'Clinical Document',
    };

    let title = typeNames[documentType];

    // Add specifics if available
    if (extractedData.conditions && extractedData.conditions.length > 0) {
      title += ` - ${extractedData.conditions[0]}`;
    } else if (extractedData.procedures && extractedData.procedures.length > 0) {
      title += ` - ${extractedData.procedures[0].name}`;
    }

    return title;
  }

  /**
   * Generate document ID
   */
  private static generateId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// SERVICE METHODS
// ============================================================================

export async function getClinicalDocument(documentId: string): Promise<ClinicalDocument | null> {
  // This would fetch from database
  logger.info('📋 [CLINICAL DOCUMENT] Fetching document', { documentId });
  return null;
}

export async function getClinicalDocuments(userId: string): Promise<ClinicalDocument[]> {
  // This would fetch all documents for user
  logger.info('📋 [CLINICAL DOCUMENT] Fetching documents', { userId });
  return [];
}

export async function saveClinicalDocument(document: ClinicalDocument): Promise<ClinicalDocument> {
  // This would persist to database
  logger.info('✅ [CLINICAL DOCUMENT] Document saved', {
    userId: document.userId,
    documentId: document.id,
    documentType: document.documentType,
  });
  
  return document;
}

export async function validateClinicalDocument(
  documentId: string,
  validatedBy: string
): Promise<ClinicalDocument | null> {
  // This would update validation status
  logger.info('✅ [CLINICAL DOCUMENT] Document validated', { documentId, validatedBy });
  return null;
}
