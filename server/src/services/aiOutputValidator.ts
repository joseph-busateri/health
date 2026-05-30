/**
 * AI Output Validator
 * 
 * CRITICAL QUALITY LAYER for AI-generated outputs
 * 
 * Purpose:
 * - Validate AI outputs match expected schema
 * - Detect malformed or invalid responses
 * - Ensure type safety and data quality
 * - Provide confidence scoring
 * - Flag outputs requiring manual review
 * 
 * This is a PRODUCTION QUALITY CRITICAL component.
 */

import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'any';
  required?: string[];
  properties?: Record<string, ValidationSchema>;
  items?: ValidationSchema;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  confidence: number; // 0-1 scale
  requiresManualReview: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  severity: 'error' | 'warning';
}

export interface OutputValidationOptions {
  serviceName: string;
  schema: ValidationSchema;
  strictMode?: boolean;
  confidenceThreshold?: number;
}

// ============================================================================
// VALIDATION METRICS
// ============================================================================

interface ValidationMetrics {
  totalValidations: number;
  validOutputs: number;
  invalidOutputs: number;
  manualReviewFlagged: number;
  byService: Record<string, {
    total: number;
    valid: number;
    invalid: number;
    avgConfidence: number;
  }>;
  byErrorType: Record<string, number>;
}

const metrics: ValidationMetrics = {
  totalValidations: 0,
  validOutputs: 0,
  invalidOutputs: 0,
  manualReviewFlagged: 0,
  byService: {},
  byErrorType: {},
};

export function getValidationMetrics(): ValidationMetrics {
  return { ...metrics };
}

export function resetValidationMetrics(): void {
  metrics.totalValidations = 0;
  metrics.validOutputs = 0;
  metrics.invalidOutputs = 0;
  metrics.manualReviewFlagged = 0;
  metrics.byService = {};
  metrics.byErrorType = {};
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate AI output against schema
 * 
 * @param output - The AI-generated output to validate
 * @param options - Validation options including schema
 * @returns Validation result with errors, warnings, and confidence
 */
export async function validateAIOutput(
  output: any,
  options: OutputValidationOptions
): Promise<ValidationResult> {
  metrics.totalValidations++;
  
  const startTime = Date.now();
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  logger.info('[AI OUTPUT VALIDATOR] Starting validation', {
    serviceName: options.serviceName,
    outputType: typeof output,
  });
  
  // Validate against schema
  validateValue(output, options.schema, '', errors, warnings, options.strictMode);
  
  // Calculate confidence score
  const confidence = calculateConfidence(output, errors, warnings, options);
  
  // Determine if manual review is required
  const confidenceThreshold = options.confidenceThreshold ?? 0.7;
  const requiresManualReview = 
    errors.length > 0 ||
    confidence < confidenceThreshold ||
    warnings.length > 3;
  
  // Update metrics
  const valid = errors.length === 0;
  if (valid) {
    metrics.validOutputs++;
  } else {
    metrics.invalidOutputs++;
  }
  if (requiresManualReview) {
    metrics.manualReviewFlagged++;
  }
  
  // Update service-specific metrics
  if (!metrics.byService[options.serviceName]) {
    metrics.byService[options.serviceName] = {
      total: 0,
      valid: 0,
      invalid: 0,
      avgConfidence: 0,
    };
  }
  const serviceMetrics = metrics.byService[options.serviceName];
  serviceMetrics.total++;
  if (valid) serviceMetrics.valid++;
  else serviceMetrics.invalid++;
  serviceMetrics.avgConfidence = 
    (serviceMetrics.avgConfidence * (serviceMetrics.total - 1) + confidence) / serviceMetrics.total;
  
  // Update error type metrics
  errors.forEach(error => {
    const errorType = error.message.split(':')[0];
    metrics.byErrorType[errorType] = (metrics.byErrorType[errorType] || 0) + 1;
  });
  
  const result: ValidationResult = {
    valid,
    errors,
    warnings,
    confidence,
    requiresManualReview,
  };
  
  const latencyMs = Date.now() - startTime;
  
  if (!valid) {
    logger.error('[AI OUTPUT VALIDATOR] Validation failed', {
      serviceName: options.serviceName,
      errorCount: errors.length,
      warningCount: warnings.length,
      confidence,
      latencyMs,
    });
  } else if (requiresManualReview) {
    logger.warn('[AI OUTPUT VALIDATOR] Manual review required', {
      serviceName: options.serviceName,
      confidence,
      warningCount: warnings.length,
      latencyMs,
    });
  } else {
    logger.info('[AI OUTPUT VALIDATOR] Validation passed', {
      serviceName: options.serviceName,
      confidence,
      latencyMs,
    });
  }
  
  return result;
}

// ============================================================================
// VALIDATION LOGIC
// ============================================================================

function validateValue(
  value: any,
  schema: ValidationSchema,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[],
  strictMode: boolean = false
): void {
  // Type validation
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  if (actualType !== schema.type) {
    errors.push({
      field: path || 'root',
      message: `Type mismatch: expected ${schema.type}, got ${actualType}`,
      value,
      severity: 'error',
    });
    return; // Can't continue validation if type is wrong
  }
  
  // Object validation
  if (schema.type === 'object' && schema.properties) {
    if (value === null || value === undefined) {
      errors.push({
        field: path || 'root',
        message: 'Object is null or undefined',
        value,
        severity: 'error',
      });
      return;
    }
    
    // Check required fields
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in value)) {
          errors.push({
            field: `${path}.${requiredField}`,
            message: `Required field missing: ${requiredField}`,
            severity: 'error',
          });
        }
      }
    }
    
    // Validate each property
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in value) {
        validateValue(
          value[key],
          propSchema,
          path ? `${path}.${key}` : key,
          errors,
          warnings,
          strictMode
        );
      }
    }
    
    // Strict mode: check for unexpected fields
    if (strictMode) {
      for (const key of Object.keys(value)) {
        if (!(key in schema.properties)) {
          warnings.push({
            field: `${path}.${key}`,
            message: `Unexpected field: ${key}`,
            value: value[key],
            severity: 'warning',
          });
        }
      }
    }
  }
  
  // Array validation
  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      errors.push({
        field: path || 'root',
        message: 'Expected array',
        value,
        severity: 'error',
      });
      return;
    }
    
    // Length validation
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        field: path || 'root',
        message: `Array too short: minimum ${schema.minLength}, got ${value.length}`,
        value: value.length,
        severity: 'error',
      });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        field: path || 'root',
        message: `Array too long: maximum ${schema.maxLength}, got ${value.length}`,
        value: value.length,
        severity: 'error',
      });
    }
    
    // Validate items
    if (schema.items) {
      value.forEach((item, index) => {
        validateValue(
          item,
          schema.items!,
          `${path}[${index}]`,
          errors,
          warnings,
          strictMode
        );
      });
    }
  }
  
  // String validation
  if (schema.type === 'string') {
    if (typeof value !== 'string') {
      errors.push({
        field: path || 'root',
        message: 'Expected string',
        value,
        severity: 'error',
      });
      return;
    }
    
    // Length validation
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        field: path || 'root',
        message: `String too short: minimum ${schema.minLength}, got ${value.length}`,
        value: value.length,
        severity: 'error',
      });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        field: path || 'root',
        message: `String too long: maximum ${schema.maxLength}, got ${value.length}`,
        value: value.length,
        severity: 'error',
      });
    }
    
    // Pattern validation
    if (schema.pattern && !schema.pattern.test(value)) {
      errors.push({
        field: path || 'root',
        message: `String does not match pattern: ${schema.pattern}`,
        value,
        severity: 'error',
      });
    }
    
    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        field: path || 'root',
        message: `Value not in enum: expected one of [${schema.enum.join(', ')}]`,
        value,
        severity: 'error',
      });
    }
  }
  
  // Number validation
  if (schema.type === 'number') {
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push({
        field: path || 'root',
        message: 'Expected number',
        value,
        severity: 'error',
      });
      return;
    }
    
    // Range validation
    if (schema.min !== undefined && value < schema.min) {
      errors.push({
        field: path || 'root',
        message: `Number too small: minimum ${schema.min}, got ${value}`,
        value,
        severity: 'error',
      });
    }
    if (schema.max !== undefined && value > schema.max) {
      errors.push({
        field: path || 'root',
        message: `Number too large: maximum ${schema.max}, got ${value}`,
        value,
        severity: 'error',
      });
    }
  }
  
  // Custom validation
  if (schema.custom) {
    try {
      if (!schema.custom(value)) {
        errors.push({
          field: path || 'root',
          message: 'Custom validation failed',
          value,
          severity: 'error',
        });
      }
    } catch (error) {
      errors.push({
        field: path || 'root',
        message: `Custom validation error: ${(error as Error).message}`,
        value,
        severity: 'error',
      });
    }
  }
}

// ============================================================================
// CONFIDENCE CALCULATION
// ============================================================================

function calculateConfidence(
  output: any,
  errors: ValidationError[],
  warnings: ValidationError[],
  options: OutputValidationOptions
): number {
  // Start with perfect confidence
  let confidence = 1.0;
  
  // Deduct for errors (major impact)
  confidence -= errors.length * 0.2;
  
  // Deduct for warnings (minor impact)
  confidence -= warnings.length * 0.05;
  
  // Deduct for missing optional fields
  if (options.schema.type === 'object' && options.schema.properties) {
    const totalFields = Object.keys(options.schema.properties).length;
    const presentFields = Object.keys(output || {}).length;
    const completeness = presentFields / totalFields;
    confidence *= completeness;
  }
  
  // Deduct for empty strings or null values in important fields
  if (typeof output === 'object' && output !== null) {
    const emptyFields = Object.values(output).filter(v => 
      v === '' || v === null || v === undefined
    ).length;
    if (emptyFields > 0) {
      confidence -= emptyFields * 0.05;
    }
  }
  
  // Ensure confidence is in valid range
  return Math.max(0, Math.min(1, confidence));
}

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

/**
 * Schema for recommendation outputs
 */
export const RecommendationSchema: ValidationSchema = {
  type: 'object',
  required: ['title', 'description', 'priority', 'category'],
  properties: {
    title: {
      type: 'string',
      minLength: 5,
      maxLength: 200,
    },
    description: {
      type: 'string',
      minLength: 20,
      maxLength: 1000,
    },
    rationale: {
      type: 'string',
      maxLength: 2000,
    },
    priority: {
      type: 'string',
      enum: ['critical', 'important', 'optimization'],
    },
    category: {
      type: 'string',
      enum: [
        'workout_modification',
        'supplement_adjustment',
        'nutrition_change',
        'lifestyle_change',
        'medical_consultation',
        'recovery_protocol',
        'stress_management',
        'sleep_optimization',
      ],
    },
    actionItems: {
      type: 'array',
      minLength: 1,
      maxLength: 10,
      items: {
        type: 'string',
        minLength: 5,
        maxLength: 200,
      },
    },
    confidence: {
      type: 'number',
      min: 0,
      max: 1,
    },
  },
};

/**
 * Schema for parsed bloodwork results
 */
export const BloodworkParseSchema: ValidationSchema = {
  type: 'object',
  required: ['markers'],
  properties: {
    panels: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          category: {
            type: 'string',
          },
        },
      },
    },
    markers: {
      type: 'array',
      minLength: 1,
      items: {
        type: 'object',
        required: ['test_name', 'value'],
        properties: {
          panel: {
            type: 'string',
          },
          test_name: {
            type: 'string',
            minLength: 2,
          },
          value: {
            type: 'string',
            minLength: 1,
          },
          value_numeric: {
            type: 'number',
          },
          unit: {
            type: 'any',
            custom: (value) => {
              // Allow strings, numbers, null, or empty objects (will be cleaned up)
              return typeof value === 'string' || value === null || 
                     (typeof value === 'object' && !Object.keys(value).length);
            },
          },
          reference_range: {
            type: 'any',
            custom: (value) => {
              // Allow strings, null, or empty objects (will be cleaned up)
              return typeof value === 'string' || value === null || 
                     (typeof value === 'object' && !Object.keys(value).length);
            },
          },
          reference_range_low: {
            type: 'any',
            custom: (value) => {
              // Allow numbers, null, or empty objects (will be cleaned up)
              return typeof value === 'number' || value === null || 
                     (typeof value === 'object' && !Object.keys(value).length);
            },
          },
          reference_range_high: {
            type: 'any',
            custom: (value) => {
              // Allow numbers, null, or empty objects (will be cleaned up)
              return typeof value === 'number' || value === null || 
                     (typeof value === 'object' && !Object.keys(value).length);
            },
          },
          abnormal_flag: {
            type: 'any',
            custom: (value) => {
              // Allow strings, null, or empty objects (will be cleaned up)
              if (typeof value === 'string') {
                return ['High', 'Low', 'Critical', 'Abnormal', 'Normal'].includes(value);
              }
              return value === null || (typeof value === 'object' && !Object.keys(value).length);
            },
          },
        },
      },
    },
    confidence: {
      type: 'number',
      min: 0,
      max: 1,
    },
  },
};

/**
 * Schema for conversation responses
 */
export const ConversationResponseSchema: ValidationSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'string',
      minLength: 1,
      maxLength: 2000,
    },
    suggestions: {
      type: 'array',
      maxLength: 5,
      items: {
        type: 'string',
        minLength: 5,
        maxLength: 100,
      },
    },
    actions: {
      type: 'array',
      maxLength: 3,
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get validation summary for a service
 */
export function getServiceValidationSummary(serviceName: string): {
  total: number;
  valid: number;
  invalid: number;
  successRate: number;
  avgConfidence: number;
} {
  const serviceMetrics = metrics.byService[serviceName];
  
  if (!serviceMetrics) {
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      successRate: 0,
      avgConfidence: 0,
    };
  }
  
  return {
    total: serviceMetrics.total,
    valid: serviceMetrics.valid,
    invalid: serviceMetrics.invalid,
    successRate: serviceMetrics.total > 0 ? serviceMetrics.valid / serviceMetrics.total : 0,
    avgConfidence: serviceMetrics.avgConfidence,
  };
}

/**
 * Check if output requires manual review based on validation
 */
export function requiresManualReview(validationResult: ValidationResult): boolean {
  return validationResult.requiresManualReview;
}

/**
 * Get human-readable validation summary
 */
export function getValidationSummary(validationResult: ValidationResult): string {
  if (validationResult.valid && !validationResult.requiresManualReview) {
    return `Validation passed with ${(validationResult.confidence * 100).toFixed(0)}% confidence`;
  }
  
  if (validationResult.valid && validationResult.requiresManualReview) {
    return `Validation passed but requires manual review (${(validationResult.confidence * 100).toFixed(0)}% confidence, ${validationResult.warnings.length} warnings)`;
  }
  
  return `Validation failed: ${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  validateAIOutput,
  getValidationMetrics,
  resetValidationMetrics,
  getServiceValidationSummary,
  requiresManualReview,
  getValidationSummary,
  RecommendationSchema,
  BloodworkParseSchema,
  ConversationResponseSchema,
};
