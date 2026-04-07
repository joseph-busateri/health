/**
 * Recommendation Normalizer
 *
 * Ensures AI generated recommendations conform to system schema
 * and prevents runtime failures from unexpected AI output.
 */

export interface NormalizedRecommendation {
  title: string;
  description: string;
  priority: string;
  urgencyScore: number;
  category: string;
  recommendationGroup?: string;
  reasonCodes?: string[];
  supportingMetrics?: any[];
  confidenceLevel?: string;
  dataQualityScore?: number;
  actionType?: string;
  actionTarget?: string;
  actionDetails?: any;
  isInsightOnly?: boolean;
  requiresUserDecision?: boolean;
}

export interface RecommendationValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Main normalization entry point
 */
export function normalizeRecommendation(
  recommendation: any
): NormalizedRecommendation {
  const normalizedCategory = sanitizeCategory(recommendation?.category);
  const normalizedGroup = sanitizeRecommendationGroup(
    recommendation?.recommendationGroup
  );

  return {
    title: sanitizeText(recommendation?.title),
    description: sanitizeText(recommendation?.description),

    priority: sanitizePriority(recommendation?.priority),
    urgencyScore: clampNumber(
      sanitizeNumber(recommendation?.urgencyScore, 50),
      0,
      100
    ),

    category: normalizedCategory,
    recommendationGroup: normalizedGroup,

    reasonCodes: normalizeReasonCodes(
      recommendation?.reasonCodes
    ),

    supportingMetrics: normalizeSupportingMetrics(
      recommendation?.supportingMetrics
    ),

    confidenceLevel: sanitizeConfidenceLevel(
      recommendation?.confidenceLevel
    ),

    dataQualityScore: clampNumber(
      sanitizeNumber(recommendation?.dataQualityScore, 90),
      0,
      100
    ),

    actionType: sanitizeText(recommendation?.actionType),
    actionTarget: sanitizeText(recommendation?.actionTarget),

    actionDetails: recommendation?.actionDetails ?? {},

    isInsightOnly: Boolean(recommendation?.isInsightOnly),
    requiresUserDecision: Boolean(recommendation?.requiresUserDecision),
  };
}

/**
 * Validation function expected by recoveryEngineService.ts
 */
export function validateRecommendation(
  recommendation: any
): RecommendationValidationResult {
  const errors: string[] = [];

  if (!recommendation || typeof recommendation !== 'object') {
    return {
      valid: false,
      errors: ['Recommendation is missing or invalid'],
    };
  }

  if (!sanitizeText(recommendation.title)) {
    errors.push('title is required');
  }

  if (!sanitizeText(recommendation.description)) {
    errors.push('description is required');
  }

  if (!sanitizeCategory(recommendation.category)) {
    errors.push('category is required');
  }

  const priority = sanitizePriority(recommendation.priority);
  if (!['critical', 'important', 'optimization'].includes(priority)) {
    errors.push('priority is invalid');
  }

  const urgencyScore = sanitizeNumber(recommendation.urgencyScore, -1);
  if (urgencyScore < 0 || urgencyScore > 100) {
    errors.push('urgencyScore must be between 0 and 100');
  }

  const dataQualityScore = sanitizeNumber(recommendation.dataQualityScore, -1);
  if (
    dataQualityScore !== -1 &&
    (dataQualityScore < 0 || dataQualityScore > 100)
  ) {
    errors.push('dataQualityScore must be between 0 and 100');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Safe text sanitization
 */
function sanitizeText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeNumber(
  value: unknown,
  defaultValue: number
): number {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  const parsed = Number(value);

  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  return defaultValue;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sanitizePriority(value: unknown): string {
  const priority = sanitizeText(value).toLowerCase();

  if (
    priority === 'critical' ||
    priority === 'important' ||
    priority === 'optimization'
  ) {
    return priority;
  }

  return 'important';
}

function sanitizeConfidenceLevel(value: unknown): string {
  const confidence = sanitizeText(value).toLowerCase();

  if (
    confidence === 'low' ||
    confidence === 'medium' ||
    confidence === 'high'
  ) {
    return confidence;
  }

  return 'medium';
}

/**
 * Default category for Recovery recommendations when AI omits it
 */
function sanitizeCategory(value: unknown): string {
  const category = sanitizeText(value).toLowerCase();

  if (category.length > 0) {
    return category;
  }

  return 'workout_modification';
}

/**
 * Default recommendation group for Recovery recommendations when AI omits it
 */
function sanitizeRecommendationGroup(value: unknown): string {
  const group = sanitizeText(value).toLowerCase();

  if (group.length > 0) {
    return group;
  }

  return 'recovery';
}

function normalizeReasonCodes(
  reasonCodes: unknown
): string[] {
  if (!Array.isArray(reasonCodes)) {
    return [];
  }

  return reasonCodes
    .map((code) => sanitizeText(code))
    .filter((code) => code.length > 0);
}

function normalizeSupportingMetrics(
  metrics: unknown
): any[] {
  if (!Array.isArray(metrics)) {
    return [];
  }

  return metrics.map((metric) => {
    if (metric === null || metric === undefined) {
      return {
        label: '',
        value: '',
      };
    }

    if (
      typeof metric === 'string' ||
      typeof metric === 'number' ||
      typeof metric === 'boolean'
    ) {
      return {
        label: '',
        value: sanitizeText(metric),
      };
    }

    if (typeof metric === 'object') {
      const m = metric as Record<string, unknown>;

      return {
        ...m,
        label: sanitizeText(m.label),
        value: sanitizeText(m.value),
        unit: sanitizeText(m.unit),
        context: sanitizeText(m.context),
      };
    }

    return {
      label: '',
      value: sanitizeText(metric),
    };
  });
}