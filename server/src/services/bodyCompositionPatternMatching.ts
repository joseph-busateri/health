import { logger } from '../utils/logger';
import type { ParsedScanData } from '../types/bodyComposition';

export interface PatternMatchResult {
  data: ParsedScanData | null;
  confidence: number;
  format: 'inbody' | 'withings' | 'renpho' | 'fitbit_aria' | 'eufy' | 'generic' | 'unknown';
  matchedFields: string[];
  totalFields: number;
}

// Common smart scale patterns
const WEIGHT_PATTERN = /(?:Weight|Body\s+Weight)[:\s]*([\d.]+)\s*(lb|kg|lbs)/i;
const BODY_FAT_PATTERN = /(?:Body\s+Fat|Fat)[:\s]*([\d.]+)\s*%/i;
const MUSCLE_MASS_PATTERN = /(?:Muscle\s+Mass|Skeletal\s+Muscle)[:\s]*([\d.]+)\s*(?:lb|kg)?/i;
const BMI_PATTERN = /BMI[:\s]*([\d.]+)/i;
const WATER_PATTERN = /(?:Body\s+Water|Water)[:\s]*([\d.]+)\s*%/i;
const BONE_MASS_PATTERN = /(?:Bone\s+Mass|Bone)[:\s]*([\d.]+)\s*(?:lb|kg)?/i;
const VISCERAL_FAT_PATTERN = /(?:Visceral\s+Fat)[:\s]*(\d+)/i;
const BMR_PATTERN = /(?:BMR|Basal\s+Metabolic\s+Rate)[:\s]*([\d,]+)\s*(?:kcal)?/i;

// Date patterns
const DATE_PATTERN_1 = /(?:Date|Test|Scan)[:\s]*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/i;
const DATE_PATTERN_2 = /(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/i;

// InBody specific patterns
const INBODY_HEADER = /InBody\s+(?:S2|570|770|270)/i;
const INBODY_DRY_LEAN_MASS = /Dry\s+Lean\s+Mass[:\s]*([\d.]+)/i;
const INBODY_TOTAL_BODY_WATER = /Total\s+Body\s+Water[:\s]*([\d.]+)/i;

// Withings specific patterns
const WITHINGS_HEADER = /Withings|Body\+|Body\s+Cardio/i;
const WITHINGS_PULSE_WAVE = /Pulse\s+Wave\s+Velocity/i;

// Renpho specific patterns
const RENPHO_HEADER = /Renpho/i;
const RENPHO_PROTEIN = /Protein[:\s]*([\d.]+)\s*%/i;
const RENPHO_METABOLIC_AGE = /Metabolic\s+Age[:\s]*(\d+)/i;

// Fitbit Aria specific patterns
const FITBIT_HEADER = /Fitbit\s+Aria/i;
const FITBIT_LEAN_MASS = /Lean\s+Mass[:\s]*([\d.]+)/i;

/**
 * Detect smart scale format from text
 */
function detectFormat(text: string): 'inbody' | 'withings' | 'renpho' | 'fitbit_aria' | 'eufy' | 'generic' {
  const lowerText = text.toLowerCase();
  
  if (INBODY_HEADER.test(text)) return 'inbody';
  if (WITHINGS_HEADER.test(text)) return 'withings';
  if (RENPHO_HEADER.test(text)) return 'renpho';
  if (FITBIT_HEADER.test(text)) return 'fitbit_aria';
  if (lowerText.includes('eufy')) return 'eufy';
  
  return 'generic';
}

/**
 * Extract date from text
 */
function extractDate(text: string): string | undefined {
  // Try YYYY-MM-DD format
  const match1 = text.match(DATE_PATTERN_1);
  if (match1) {
    const [, year, month, day] = match1;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try MM-DD-YYYY format
  const match2 = text.match(DATE_PATTERN_2);
  if (match2) {
    const [, month, day, year] = match2;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return undefined;
}

/**
 * Extract weight and unit
 */
function extractWeight(text: string): { weight?: number; unit?: 'lb' | 'kg' } {
  const match = text.match(WEIGHT_PATTERN);
  if (!match) return {};
  
  return {
    weight: parseFloat(match[1]),
    unit: match[2].toLowerCase().replace('lbs', 'lb') as 'lb' | 'kg'
  };
}

/**
 * Try InBody format
 */
function tryInBodyFormat(text: string): ParsedScanData | null {
  if (!INBODY_HEADER.test(text)) return null;
  
  const data: ParsedScanData = {
    rawFields: {}
  };
  
  // Extract weight
  const weightData = extractWeight(text);
  if (weightData.weight) {
    data.weight = weightData.weight;
    data.weightUnit = weightData.unit;
  }
  
  // Extract body fat percentage
  const bodyFatMatch = text.match(BODY_FAT_PATTERN);
  if (bodyFatMatch) {
    data.bodyFatPercentage = parseFloat(bodyFatMatch[1]);
  }
  
  // Extract skeletal muscle mass
  const muscleMatch = text.match(MUSCLE_MASS_PATTERN);
  if (muscleMatch) {
    data.skeletalMuscleMass = parseFloat(muscleMatch[1]);
  }
  
  // InBody specific: Dry Lean Mass
  const dryLeanMatch = text.match(INBODY_DRY_LEAN_MASS);
  if (dryLeanMatch) {
    data.dryLeanMass = parseFloat(dryLeanMatch[1]);
  }
  
  // InBody specific: Total Body Water
  const waterMatch = text.match(INBODY_TOTAL_BODY_WATER);
  if (waterMatch) {
    data.totalBodyWater = parseFloat(waterMatch[1]);
  }
  
  // Extract visceral fat
  const visceralMatch = text.match(VISCERAL_FAT_PATTERN);
  if (visceralMatch) {
    data.visceralFatLevel = parseInt(visceralMatch[1]);
  }
  
  // Extract BMI
  const bmiMatch = text.match(BMI_PATTERN);
  if (bmiMatch) {
    data.bmi = parseFloat(bmiMatch[1]);
  }
  
  // Extract BMR
  const bmrMatch = text.match(BMR_PATTERN);
  if (bmrMatch) {
    data.bmr = parseInt(bmrMatch[1].replace(/,/g, ''));
  }
  
  // Extract date
  data.testDate = extractDate(text);
  
  return data.weight ? data : null;
}

/**
 * Try Withings format
 */
function tryWithingsFormat(text: string): ParsedScanData | null {
  if (!WITHINGS_HEADER.test(text)) return null;
  
  const data: ParsedScanData = {
    rawFields: {}
  };
  
  // Extract weight
  const weightData = extractWeight(text);
  if (weightData.weight) {
    data.weight = weightData.weight;
    data.weightUnit = weightData.unit;
  }
  
  // Extract body fat percentage
  const bodyFatMatch = text.match(BODY_FAT_PATTERN);
  if (bodyFatMatch) {
    data.bodyFatPercentage = parseFloat(bodyFatMatch[1]);
  }
  
  // Extract muscle mass
  const muscleMatch = text.match(MUSCLE_MASS_PATTERN);
  if (muscleMatch) {
    data.skeletalMuscleMass = parseFloat(muscleMatch[1]);
  }
  
  // Extract bone mass
  const boneMatch = text.match(BONE_MASS_PATTERN);
  if (boneMatch) {
    data.rawFields!.boneMass = parseFloat(boneMatch[1]);
  }
  
  // Extract body water
  const waterMatch = text.match(WATER_PATTERN);
  if (waterMatch) {
    data.rawFields!.bodyWaterPercentage = parseFloat(waterMatch[1]);
  }
  
  // Extract BMI
  const bmiMatch = text.match(BMI_PATTERN);
  if (bmiMatch) {
    data.bmi = parseFloat(bmiMatch[1]);
  }
  
  // Extract date
  data.testDate = extractDate(text);
  
  return data.weight ? data : null;
}

/**
 * Try Renpho format
 */
function tryRenphoFormat(text: string): ParsedScanData | null {
  if (!RENPHO_HEADER.test(text)) return null;
  
  const data: ParsedScanData = {
    rawFields: {}
  };
  
  // Extract weight
  const weightData = extractWeight(text);
  if (weightData.weight) {
    data.weight = weightData.weight;
    data.weightUnit = weightData.unit;
  }
  
  // Extract body fat percentage
  const bodyFatMatch = text.match(BODY_FAT_PATTERN);
  if (bodyFatMatch) {
    data.bodyFatPercentage = parseFloat(bodyFatMatch[1]);
  }
  
  // Extract muscle mass
  const muscleMatch = text.match(MUSCLE_MASS_PATTERN);
  if (muscleMatch) {
    data.skeletalMuscleMass = parseFloat(muscleMatch[1]);
  }
  
  // Renpho specific: Protein percentage
  const proteinMatch = text.match(RENPHO_PROTEIN);
  if (proteinMatch) {
    data.rawFields!.proteinPercentage = parseFloat(proteinMatch[1]);
  }
  
  // Renpho specific: Metabolic age
  const metabolicAgeMatch = text.match(RENPHO_METABOLIC_AGE);
  if (metabolicAgeMatch) {
    data.rawFields!.metabolicAge = parseInt(metabolicAgeMatch[1]);
  }
  
  // Extract visceral fat
  const visceralMatch = text.match(VISCERAL_FAT_PATTERN);
  if (visceralMatch) {
    data.visceralFatLevel = parseInt(visceralMatch[1]);
  }
  
  // Extract BMI
  const bmiMatch = text.match(BMI_PATTERN);
  if (bmiMatch) {
    data.bmi = parseFloat(bmiMatch[1]);
  }
  
  // Extract BMR
  const bmrMatch = text.match(BMR_PATTERN);
  if (bmrMatch) {
    data.bmr = parseInt(bmrMatch[1].replace(/,/g, ''));
  }
  
  // Extract date
  data.testDate = extractDate(text);
  
  return data.weight ? data : null;
}

/**
 * Try generic format (any smart scale)
 */
function tryGenericFormat(text: string): ParsedScanData | null {
  const data: ParsedScanData = {
    rawFields: {}
  };
  
  // Extract weight (required)
  const weightData = extractWeight(text);
  if (!weightData.weight) return null;
  
  data.weight = weightData.weight;
  data.weightUnit = weightData.unit;
  
  // Extract body fat percentage (optional)
  const bodyFatMatch = text.match(BODY_FAT_PATTERN);
  if (bodyFatMatch) {
    data.bodyFatPercentage = parseFloat(bodyFatMatch[1]);
  }
  
  // Extract muscle mass (optional)
  const muscleMatch = text.match(MUSCLE_MASS_PATTERN);
  if (muscleMatch) {
    data.skeletalMuscleMass = parseFloat(muscleMatch[1]);
  }
  
  // Extract BMI (optional)
  const bmiMatch = text.match(BMI_PATTERN);
  if (bmiMatch) {
    data.bmi = parseFloat(bmiMatch[1]);
  }
  
  // Extract visceral fat (optional)
  const visceralMatch = text.match(VISCERAL_FAT_PATTERN);
  if (visceralMatch) {
    data.visceralFatLevel = parseInt(visceralMatch[1]);
  }
  
  // Extract BMR (optional)
  const bmrMatch = text.match(BMR_PATTERN);
  if (bmrMatch) {
    data.bmr = parseInt(bmrMatch[1].replace(/,/g, ''));
  }
  
  // Extract date
  data.testDate = extractDate(text);
  
  return data;
}

/**
 * Count matched fields
 */
function countMatchedFields(data: ParsedScanData | null): { matched: string[]; total: number } {
  if (!data) return { matched: [], total: 0 };
  
  const matched: string[] = [];
  
  if (data.weight) matched.push('weight');
  if (data.bodyFatPercentage) matched.push('bodyFatPercentage');
  if (data.skeletalMuscleMass) matched.push('skeletalMuscleMass');
  if (data.bmi) matched.push('bmi');
  if (data.visceralFatLevel) matched.push('visceralFatLevel');
  if (data.bmr) matched.push('bmr');
  if (data.dryLeanMass) matched.push('dryLeanMass');
  if (data.totalBodyWater) matched.push('totalBodyWater');
  if (data.testDate) matched.push('testDate');
  
  // Total possible fields
  const total = 9;
  
  return { matched, total };
}

/**
 * Calculate confidence based on matched fields
 */
function calculateConfidence(matchedFields: string[], totalFields: number, format: string): number {
  const matchRate = matchedFields.length / totalFields;
  
  // Weight is required
  if (!matchedFields.includes('weight')) return 0;
  
  // High confidence: matched 5+ fields
  if (matchedFields.length >= 5) return 0.95;
  
  // Medium-high confidence: matched 3-4 fields
  if (matchedFields.length >= 3) return 0.85;
  
  // Medium confidence: matched 2 fields (weight + 1 other)
  if (matchedFields.length >= 2) return 0.7;
  
  // Low confidence: only weight
  if (matchedFields.length === 1) return 0.5;
  
  return 0;
}

/**
 * Main pattern matching function
 */
export async function tryPatternMatching(text: string): Promise<PatternMatchResult> {
  logger.info('Starting body composition pattern matching');
  
  // Detect format
  const format = detectFormat(text);
  logger.info('Detected format', { format });
  
  let data: ParsedScanData | null = null;
  
  // Try format-specific parsers
  switch (format) {
    case 'inbody':
      data = tryInBodyFormat(text);
      break;
    case 'withings':
      data = tryWithingsFormat(text);
      break;
    case 'renpho':
      data = tryRenphoFormat(text);
      break;
    case 'generic':
      data = tryGenericFormat(text);
      break;
    default:
      // Try generic as fallback
      data = tryGenericFormat(text);
  }
  
  // Count matched fields
  const { matched, total } = countMatchedFields(data);
  
  // Calculate confidence
  const confidence = calculateConfidence(matched, total, format);
  
  logger.info('Pattern matching complete', {
    format,
    fieldsMatched: matched.length,
    totalFields: total,
    confidence: confidence.toFixed(2),
    hasWeight: !!data?.weight
  });
  
  return {
    data,
    confidence,
    format: data ? format : 'unknown',
    matchedFields: matched,
    totalFields: total
  };
}

/**
 * Check if we should skip AI parsing
 */
export function shouldSkipAIParsing(result: PatternMatchResult): boolean {
  // Skip AI if confidence >= 0.85 and we have at least weight + body fat
  return result.confidence >= 0.85 && 
         result.matchedFields.includes('weight') && 
         result.matchedFields.includes('bodyFatPercentage');
}
