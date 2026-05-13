import { logger } from '../utils/logger';
import type { ExtractedBloodworkResult, ExtractedBloodworkPanel } from '../types/bloodworkResults';

export interface PatternMatchResult {
  markers: ExtractedBloodworkResult[];
  panels: ExtractedBloodworkPanel[];
  confidence: number;
  format: 'quest' | 'labcorp' | 'healthlab' | 'generic_table' | 'unknown';
  matchedLines: number;
  totalLines: number;
}

interface MarkerMatch {
  testName: string;
  value: string;
  valueNumeric?: number;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: string;
  confidence: number;
}

// Quest Diagnostics pattern: "Test Name    Value Unit    Range"
// Example: "LDL Cholesterol    95 mg/dL    0-129"
const QUEST_PATTERN = /^(.+?)\s{2,}(\d+\.?\d*)\s+(\S+)\s{2,}(.+)$/;

// LabCorp pattern: "Test Name | Value | Unit | Range"
// Example: "LDL-C | 95 | mg/dL | <100"
const LABCORP_PATTERN = /^(.+?)\s*\|\s*(\d+\.?\d*)\s*\|\s*(\S+)\s*\|\s*(.+)$/;

// Generic table pattern: "Test Name    Value Unit    Low-High"
// Example: "Glucose    95 mg/dL    70-100"
const GENERIC_TABLE_PATTERN = /^(.+?)\s{2,}(\d+\.?\d*)\s+(\S+)\s{2,}(\d+\.?\d*\s*-\s*\d+\.?\d*)$/;

// HealthLab pattern: "Test Name    Result    Reference Range    Abnormal"
// Example: "TRIGLYCERIDES, SERUM         479         <150 mg/dL         H"
// More specific: test name should NOT contain "Ratio" and value should be reasonable
const HEALTHLAB_PATTERN = /^([A-Z][A-Za-z0-9,\s\(\)\/\-]+?)\s{2,}(\d+\.?\d*)\s{2,}([<>]?\s*\d+\.?\d*(?:\s*-\s*\d+\.?\d*)?\s*[a-zA-Z\/]+)\s{2,}([HLhl]?)\s*$/;

// Value with unit pattern: "95 mg/dL" or "5.7 %"
const VALUE_UNIT_PATTERN = /(\d+\.?\d*)\s*(\S+)/;

// Reference range patterns
const RANGE_BETWEEN = /(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/;
const RANGE_LESS_THAN = /<\s*(\d+\.?\d*)/;
const RANGE_GREATER_THAN = />\s*(\d+\.?\d*)/;

// Abnormal flag patterns
const ABNORMAL_FLAGS = ['high', 'low', 'critical', 'abnormal', 'h', 'l', 'crit'];

/**
 * Try to match Quest Diagnostics format
 */
function tryQuestFormat(line: string): MarkerMatch | null {
  const match = line.match(QUEST_PATTERN);
  if (!match) return null;

  const [, testName, valueStr, unit, rangeStr] = match;
  
  return {
    testName: testName.trim(),
    value: `${valueStr} ${unit}`,
    valueNumeric: parseFloat(valueStr),
    unit: unit.trim(),
    referenceRange: rangeStr.trim(),
    confidence: 0.9
  };
}

/**
 * Try to match LabCorp format
 */
function tryLabCorpFormat(line: string): MarkerMatch | null {
  const match = line.match(LABCORP_PATTERN);
  if (!match) return null;

  const [, testName, valueStr, unit, rangeStr] = match;
  
  return {
    testName: testName.trim(),
    value: `${valueStr} ${unit}`,
    valueNumeric: parseFloat(valueStr),
    unit: unit.trim(),
    referenceRange: rangeStr.trim(),
    confidence: 0.9
  };
}

/**
 * Try to match generic table format
 */
function tryGenericTableFormat(line: string): MarkerMatch | null {
  const match = line.match(GENERIC_TABLE_PATTERN);
  if (!match) return null;

  const [, testName, valueStr, unit, rangeStr] = match;
  
  return {
    testName: testName.trim(),
    value: `${valueStr} ${unit}`,
    valueNumeric: parseFloat(valueStr),
    unit: unit.trim(),
    referenceRange: rangeStr.trim(),
    confidence: 0.85
  };
}

/**
 * Try to match HealthLab format
 */
function tryHealthLabFormat(line: string): MarkerMatch | null {
  const match = line.match(HEALTHLAB_PATTERN);
  if (!match) return null;

  const [, testName, valueStr, rangeStr, abnormalFlag] = match;
  
  // Skip ratio lines (they're calculated, not primary markers)
  if (testName.toLowerCase().includes('ratio')) {
    return null;
  }
  
  // Extract unit from range string (e.g., "<150 mg/dL" -> "mg/dL")
  const unitMatch = rangeStr.match(/([a-zA-Z\/]+)$/);
  const unit = unitMatch ? unitMatch[1] : '';
  
  return {
    testName: testName.trim(),
    value: `${valueStr} ${unit}`,
    valueNumeric: parseFloat(valueStr),
    unit: unit.trim(),
    referenceRange: rangeStr.trim(),
    abnormalFlag: abnormalFlag ? (abnormalFlag.toUpperCase() === 'H' ? 'High' : 'Low') : undefined,
    confidence: 0.9
  };
}

/**
 * Parse reference range string into low/high values
 */
function parseReferenceRange(rangeStr: string): {
  low?: number;
  high?: number;
  text: string;
} {
  const result = { text: rangeStr };

  // Try "low-high" format
  const betweenMatch = rangeStr.match(RANGE_BETWEEN);
  if (betweenMatch) {
    return {
      ...result,
      low: parseFloat(betweenMatch[1]),
      high: parseFloat(betweenMatch[2])
    };
  }

  // Try "<high" format
  const lessThanMatch = rangeStr.match(RANGE_LESS_THAN);
  if (lessThanMatch) {
    return {
      ...result,
      high: parseFloat(lessThanMatch[1])
    };
  }

  // Try ">low" format
  const greaterThanMatch = rangeStr.match(RANGE_GREATER_THAN);
  if (greaterThanMatch) {
    return {
      ...result,
      low: parseFloat(greaterThanMatch[1])
    };
  }

  return result;
}

/**
 * Detect abnormal flag in text
 */
function detectAbnormalFlag(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  for (const flag of ABNORMAL_FLAGS) {
    if (lowerText.includes(flag)) {
      if (flag === 'h' || flag === 'high') return 'High';
      if (flag === 'l' || flag === 'low') return 'Low';
      if (flag === 'crit' || flag === 'critical') return 'Critical';
      return 'Abnormal';
    }
  }
  return undefined;
}

/**
 * Detect panel name from text
 */
function detectPanel(text: string): ExtractedBloodworkPanel | null {
  const lowerText = text.toLowerCase();
  
  // Common panel patterns
  const panels: Array<{ pattern: RegExp; panel: ExtractedBloodworkPanel }> = [
    {
      pattern: /lipid\s+panel/i,
      panel: { panel_name: 'Lipid Panel', panel_category: 'cardiovascular' }
    },
    {
      pattern: /comprehensive\s+metabolic\s+panel|cmp/i,
      panel: { panel_name: 'Comprehensive Metabolic Panel', panel_category: 'metabolic' }
    },
    {
      pattern: /basic\s+metabolic\s+panel|bmp/i,
      panel: { panel_name: 'Basic Metabolic Panel', panel_category: 'metabolic' }
    },
    {
      pattern: /complete\s+blood\s+count|cbc/i,
      panel: { panel_name: 'Complete Blood Count', panel_category: 'hematology' }
    },
    {
      pattern: /hormone\s+panel/i,
      panel: { panel_name: 'Hormone Panel', panel_category: 'hormonal' }
    },
    {
      pattern: /thyroid\s+panel/i,
      panel: { panel_name: 'Thyroid Panel', panel_category: 'hormonal' }
    }
  ];

  for (const { pattern, panel } of panels) {
    if (pattern.test(lowerText)) {
      return panel;
    }
  }

  return null;
}

/**
 * Main pattern matching function
 */
export async function tryPatternMatching(text: string): Promise<PatternMatchResult> {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const markers: ExtractedBloodworkResult[] = [];
  const panels: ExtractedBloodworkPanel[] = [];
  let matchedLines = 0;
  let currentPanel: ExtractedBloodworkPanel | null = null;
  let detectedFormat: 'quest' | 'labcorp' | 'generic_table' | 'unknown' = 'unknown';

  logger.info('Starting pattern matching', { totalLines: lines.length });

  for (const line of lines) {
    // Check if line is a panel header
    const panel = detectPanel(line);
    if (panel) {
      currentPanel = panel;
      if (!panels.find(p => p.panel_name === panel.panel_name)) {
        panels.push(panel);
      }
      continue;
    }

    // Try different formats
    let match: MarkerMatch | null = null;

    // Try Quest format
    if (!match) {
      match = tryQuestFormat(line);
      if (match && detectedFormat === 'unknown') {
        detectedFormat = 'quest';
      }
    }

    // Try LabCorp format
    if (!match) {
      match = tryLabCorpFormat(line);
      if (match && detectedFormat === 'unknown') {
        detectedFormat = 'labcorp';
      }
    }

    // Try HealthLab format
    if (!match) {
      match = tryHealthLabFormat(line);
      if (match && detectedFormat === 'unknown') {
        detectedFormat = 'healthlab';
      }
    }

    // Try generic table format
    if (!match) {
      match = tryGenericTableFormat(line);
      if (match && detectedFormat === 'unknown') {
        detectedFormat = 'generic_table';
      }
    }

    // If we found a match, convert to ExtractedBloodworkResult
    if (match) {
      matchedLines++;
      
      const range = parseReferenceRange(match.referenceRange || '');
      const abnormalFlag = detectAbnormalFlag(line);

      const result: ExtractedBloodworkResult = {
        panel_name: currentPanel?.panel_name,
        panel_category: currentPanel?.panel_category,
        raw_test_name: match.testName,
        value_text: match.value,
        value_numeric: match.valueNumeric,
        unit: match.unit,
        reference_range_text: range.text,
        reference_range_low: range.low,
        reference_range_high: range.high,
        abnormal_flag: abnormalFlag,
        confidence: match.confidence
      };

      markers.push(result);
    }
  }

  // Calculate overall confidence
  const matchRate = lines.length > 0 ? matchedLines / lines.length : 0;
  let confidence = 0;

  if (matchRate > 0.5 && markers.length >= 3) {
    // High confidence: matched >50% of lines and found at least 3 markers
    confidence = 0.9;
  } else if (matchRate > 0.3 && markers.length >= 2) {
    // Medium confidence: matched >30% of lines and found at least 2 markers
    confidence = 0.7;
  } else if (markers.length >= 1) {
    // Low confidence: found at least 1 marker
    confidence = 0.5;
  } else {
    // No confidence: found no markers
    confidence = 0;
  }

  logger.info('Pattern matching complete', {
    format: detectedFormat,
    markersFound: markers.length,
    panelsFound: panels.length,
    matchedLines,
    totalLines: lines.length,
    matchRate: matchRate.toFixed(2),
    confidence: confidence.toFixed(2)
  });

  return {
    markers,
    panels,
    confidence,
    format: detectedFormat,
    matchedLines,
    totalLines: lines.length
  };
}

/**
 * Check if pattern matching confidence is high enough to skip AI parsing
 */
export function shouldSkipAIParsing(result: PatternMatchResult): boolean {
  return result.confidence >= 0.8 && result.markers.length >= 2;
}
