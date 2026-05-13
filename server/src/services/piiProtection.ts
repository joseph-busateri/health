/**
 * PII Protection and Redaction
 * 
 * CRITICAL PRIVACY LAYER for AI services
 * 
 * Purpose:
 * - Prevent Personally Identifiable Information (PII) from being sent to OpenAI
 * - Redact sensitive data before AI processing
 * - Re-identify data after AI processing when needed
 * - Maintain audit trail of PII handling
 * - Ensure HIPAA compliance for health data
 * 
 * This is a PRODUCTION PRIVACY CRITICAL component.
 * Changes must be reviewed by privacy/security staff.
 */

import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface PIIRedactionResult {
  redactedText: string;
  piiMap: PIIMap;
  piiDetected: boolean;
  piiCount: number;
  categories: PIICategory[];
}

export interface PIIMap {
  [placeholder: string]: {
    original: string;
    category: PIICategory;
    position: number;
  };
}

export type PIICategory = 
  | 'name'
  | 'ssn'
  | 'address'
  | 'phone'
  | 'email'
  | 'medical_record_number'
  | 'insurance_id'
  | 'date_of_birth'
  | 'account_number'
  | 'ip_address'
  | 'url'
  | 'credit_card';

export interface PIIAuditLog {
  timestamp: Date;
  userId: string;
  operation: 'redact' | 'restore';
  piiCount: number;
  categories: PIICategory[];
  serviceName: string;
}

// ============================================================================
// PII DETECTION PATTERNS
// ============================================================================

/**
 * Regex patterns for detecting PII
 * These are intentionally conservative to avoid false positives
 */
const PII_PATTERNS: Record<PIICategory, RegExp[]> = {
  // Social Security Numbers
  ssn: [
    /\b\d{3}-\d{2}-\d{4}\b/g,
    /\b\d{3}\s\d{2}\s\d{4}\b/g,
    /\b\d{9}\b/g,
  ],
  
  // Phone numbers
  phone: [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    /\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b/g,
    /\b1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  ],
  
  // Email addresses
  email: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  ],
  
  // Street addresses (basic patterns)
  address: [
    /\b\d+\s+[A-Za-z\s]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)\b/gi,
    /\b\d+\s+[A-Za-z\s]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir),\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}\b/gi,
  ],
  
  // Medical Record Numbers (MRN)
  medical_record_number: [
    /\bMRN[:\s]?\d{6,10}\b/gi,
    /\bMedical\s+Record\s+Number[:\s]?\d{6,10}\b/gi,
  ],
  
  // Insurance IDs
  insurance_id: [
    /\bInsurance\s+ID[:\s]?[A-Z0-9]{6,15}\b/gi,
    /\bPolicy\s+Number[:\s]?[A-Z0-9]{6,15}\b/gi,
  ],
  
  // Dates of Birth
  date_of_birth: [
    /\bDOB[:\s]?\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi,
    /\bDate\s+of\s+Birth[:\s]?\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi,
    /\bBorn[:\s]?\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi,
  ],
  
  // Account numbers
  account_number: [
    /\bAccount\s+Number[:\s]?\d{8,17}\b/gi,
    /\bAcct[:\s]?\d{8,17}\b/gi,
  ],
  
  // IP addresses
  ip_address: [
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  ],
  
  // URLs (may contain sensitive info)
  url: [
    /https?:\/\/[^\s]+/gi,
  ],
  
  // Credit card numbers
  credit_card: [
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ],
  
  // Names (basic pattern - first and last name)
  name: [
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
  ],
};

/**
 * Placeholder prefixes for each PII category
 */
const PLACEHOLDER_PREFIXES: Record<PIICategory, string> = {
  name: 'NAME',
  ssn: 'SSN',
  address: 'ADDRESS',
  phone: 'PHONE',
  email: 'EMAIL',
  medical_record_number: 'MRN',
  insurance_id: 'INSURANCE',
  date_of_birth: 'DOB',
  account_number: 'ACCOUNT',
  ip_address: 'IP',
  url: 'URL',
  credit_card: 'CARD',
};

// ============================================================================
// VALIDATION METRICS
// ============================================================================

interface PIIMetrics {
  totalRedactions: number;
  totalRestorations: number;
  piiDetected: number;
  byCategory: Record<PIICategory, number>;
  auditLogs: PIIAuditLog[];
}

const metrics: PIIMetrics = {
  totalRedactions: 0,
  totalRestorations: 0,
  piiDetected: 0,
  byCategory: {} as Record<PIICategory, number>,
  auditLogs: [],
};

export function getPIIMetrics(): PIIMetrics {
  return {
    ...metrics,
    auditLogs: metrics.auditLogs.slice(-100), // Return last 100 audit logs
  };
}

export function resetPIIMetrics(): void {
  metrics.totalRedactions = 0;
  metrics.totalRestorations = 0;
  metrics.piiDetected = 0;
  metrics.byCategory = {} as Record<PIICategory, number>;
  metrics.auditLogs = [];
}

// ============================================================================
// MAIN REDACTION FUNCTION
// ============================================================================

/**
 * Redact PII from text before sending to AI
 * 
 * CRITICAL: This function MUST be called before sending any user-provided
 * text to OpenAI or other external AI services.
 * 
 * @param text - Original text that may contain PII
 * @param options - Redaction options
 * @returns Redacted text and PII map for restoration
 */
export async function redactPII(
  text: string,
  options: {
    userId: string;
    serviceName: string;
    categories?: PIICategory[];
  }
): Promise<PIIRedactionResult> {
  metrics.totalRedactions++;
  
  const startTime = Date.now();
  const piiMap: PIIMap = {};
  let redactedText = text;
  let piiCount = 0;
  const detectedCategories = new Set<PIICategory>();
  
  logger.info('[PII PROTECTION] Starting redaction', {
    userId: options.userId,
    serviceName: options.serviceName,
    textLength: text.length,
  });
  
  // Determine which categories to check
  const categoriesToCheck = options.categories || Object.keys(PII_PATTERNS) as PIICategory[];
  
  // Process each PII category
  for (const category of categoriesToCheck) {
    const patterns = PII_PATTERNS[category];
    
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      
      for (const match of matches) {
        if (!match[0]) continue;
        
        // Generate unique placeholder
        const placeholder = `[${PLACEHOLDER_PREFIXES[category]}_${randomUUID().substring(0, 8)}]`;
        
        // Store mapping
        piiMap[placeholder] = {
          original: match[0],
          category,
          position: match.index || 0,
        };
        
        // Replace in text
        redactedText = redactedText.replace(match[0], placeholder);
        
        piiCount++;
        detectedCategories.add(category);
        
        // Update metrics
        metrics.byCategory[category] = (metrics.byCategory[category] || 0) + 1;
      }
    }
  }
  
  const categories = Array.from(detectedCategories);
  
  if (piiCount > 0) {
    metrics.piiDetected++;
    
    // Create audit log
    const auditLog: PIIAuditLog = {
      timestamp: new Date(),
      userId: options.userId,
      operation: 'redact',
      piiCount,
      categories,
      serviceName: options.serviceName,
    };
    
    metrics.auditLogs.push(auditLog);
    
    logger.warn('[PII PROTECTION] PII detected and redacted', {
      userId: options.userId,
      serviceName: options.serviceName,
      piiCount,
      categories,
      originalLength: text.length,
      redactedLength: redactedText.length,
      latencyMs: Date.now() - startTime,
    });
  } else {
    logger.info('[PII PROTECTION] No PII detected', {
      userId: options.userId,
      serviceName: options.serviceName,
      textLength: text.length,
      latencyMs: Date.now() - startTime,
    });
  }
  
  return {
    redactedText,
    piiMap,
    piiDetected: piiCount > 0,
    piiCount,
    categories,
  };
}

// ============================================================================
// RESTORATION FUNCTION
// ============================================================================

/**
 * Restore PII in text after AI processing
 * 
 * @param text - Text with PII placeholders
 * @param piiMap - PII map from redaction
 * @param options - Restoration options
 * @returns Text with PII restored
 */
export async function restorePII(
  text: string,
  piiMap: PIIMap,
  options: {
    userId: string;
    serviceName: string;
  }
): Promise<string> {
  metrics.totalRestorations++;
  
  let restoredText = text;
  let restoredCount = 0;
  
  // Replace each placeholder with original value
  for (const [placeholder, piiData] of Object.entries(piiMap)) {
    if (restoredText.includes(placeholder)) {
      restoredText = restoredText.replace(placeholder, piiData.original);
      restoredCount++;
    }
  }
  
  if (restoredCount > 0) {
    // Create audit log
    const auditLog: PIIAuditLog = {
      timestamp: new Date(),
      userId: options.userId,
      operation: 'restore',
      piiCount: restoredCount,
      categories: Array.from(new Set(Object.values(piiMap).map(p => p.category))),
      serviceName: options.serviceName,
    };
    
    metrics.auditLogs.push(auditLog);
    
    logger.info('[PII PROTECTION] PII restored', {
      userId: options.userId,
      serviceName: options.serviceName,
      restoredCount,
    });
  }
  
  return restoredText;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if text contains PII without redacting
 * 
 * @param text - Text to check
 * @returns Whether PII was detected
 */
export function containsPII(text: string): {
  detected: boolean;
  categories: PIICategory[];
  count: number;
} {
  const detectedCategories = new Set<PIICategory>();
  let count = 0;
  
  for (const [category, patterns] of Object.entries(PII_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[0]) {
          detectedCategories.add(category as PIICategory);
          count++;
        }
      }
    }
  }
  
  return {
    detected: count > 0,
    categories: Array.from(detectedCategories),
    count,
  };
}

/**
 * Validate that text does not contain PII
 * 
 * @param text - Text to validate
 * @returns Validation result
 */
export function validateNoPII(text: string): {
  valid: boolean;
  violations: Array<{
    category: PIICategory;
    value: string;
    position: number;
  }>;
} {
  const violations: Array<{
    category: PIICategory;
    value: string;
    position: number;
  }> = [];
  
  for (const [category, patterns] of Object.entries(PII_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[0]) {
          violations.push({
            category: category as PIICategory,
            value: match[0],
            position: match.index || 0,
          });
        }
      }
    }
  }
  
  return {
    valid: violations.length === 0,
    violations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get PII audit logs for a user
 * 
 * @param userId - User ID
 * @param limit - Maximum number of logs to return
 * @returns Audit logs
 */
export function getPIIAuditLogs(
  userId: string,
  limit: number = 50
): PIIAuditLog[] {
  return metrics.auditLogs
    .filter(log => log.userId === userId)
    .slice(-limit);
}

/**
 * Get PII statistics for a service
 * 
 * @param serviceName - Service name
 * @returns PII statistics
 */
export function getPIIStatsByService(serviceName: string): {
  totalRedactions: number;
  totalPII: number;
  byCategory: Record<PIICategory, number>;
} {
  const serviceLogs = metrics.auditLogs.filter(
    log => log.serviceName === serviceName && log.operation === 'redact'
  );
  
  const totalRedactions = serviceLogs.length;
  const totalPII = serviceLogs.reduce((sum, log) => sum + log.piiCount, 0);
  const byCategory: Record<PIICategory, number> = {} as Record<PIICategory, number>;
  
  for (const log of serviceLogs) {
    for (const category of log.categories) {
      byCategory[category] = (byCategory[category] || 0) + 1;
    }
  }
  
  return {
    totalRedactions,
    totalPII,
    byCategory,
  };
}

/**
 * Sanitize text for logging (remove PII)
 * 
 * @param text - Text to sanitize
 * @returns Sanitized text safe for logging
 */
export function sanitizeForLogging(text: string): string {
  let sanitized = text;
  
  // Redact common PII patterns with generic placeholders
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  sanitized = sanitized.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE]');
  sanitized = sanitized.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]');
  
  return sanitized;
}

/**
 * Check if service requires PII redaction
 * 
 * @param serviceName - Service name
 * @returns Whether PII redaction is required
 */
export function requiresPIIRedaction(serviceName: string): boolean {
  // All AI services that process user-provided text require PII redaction
  const aiServices = [
    'bloodwork-parser',
    'body-composition-parser',
    'nutrition-extraction',
    'interview-parser',
    'ai-agent-conversation',
    'voice-interview',
    'hybrid-interview',
  ];
  
  return aiServices.includes(serviceName);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  redactPII,
  restorePII,
  containsPII,
  validateNoPII,
  getPIIMetrics,
  resetPIIMetrics,
  getPIIAuditLogs,
  getPIIStatsByService,
  sanitizeForLogging,
  requiresPIIRedaction,
};
