// CSV Body Composition Parser
// Parses CSV files exported from InBody and other body composition devices
// Supports multiple CSV formats with flexible column mapping

import { logger } from '../utils/logger';
import type { CreateBodyCompositionScanInput, BodyCompositionSource } from '../types/bodyComposition';

// ============================================================================
// TYPES
// ============================================================================

export interface CSVRow {
  [key: string]: string | number;
}

export interface ParsedCSVScan {
  date: string;
  weightLb: number;
  bodyFatPercentage?: number;
  skeletalMuscleMassLb?: number;
  visceralFatLevel?: number;
  bmi?: number;
  basalMetabolicRateKcal?: number;
  heightInches?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  scanSource: BodyCompositionSource;
}

export interface CSVParseResult {
  success: boolean;
  scans: ParsedCSVScan[];
  errors: Array<{ row: number; field: string; message: string }>;
  rowCount: number;
}

export interface ColumnMapping {
  date: string;
  weight: string;
  bodyFatPercentage?: string;
  skeletalMuscleMassLb?: string;
  visceralFatLevel?: string;
  bmi?: string;
  basalMetabolicRateKcal?: string;
  heightInches?: string;
  age?: string;
  gender?: string;
}

// ============================================================================
// COLUMN MAPPING CONFIGURATIONS
// ============================================================================

// Standard format (our app's expected format)
const STANDARD_MAPPING: ColumnMapping = {
  date: 'date',
  weight: 'weight_lb',
  bodyFatPercentage: 'body_fat_percentage',
  skeletalMuscleMassLb: 'skeletal_muscle_mass_lb',
  visceralFatLevel: 'visceral_fat_level',
  bmi: 'bmi',
  basalMetabolicRateKcal: 'basal_metabolic_rate_kcal',
  heightInches: 'height_inches',
  age: 'age',
  gender: 'gender',
};

// InBody export format (common variations)
const INBODY_MAPPINGS: ColumnMapping[] = [
  {
    date: 'Date',
    weight: 'Weight',
    bodyFatPercentage: 'Body Fat %',
    skeletalMuscleMassLb: 'Skeletal Muscle Mass',
    visceralFatLevel: 'Visceral Fat Level',
    bmi: 'BMI',
    basalMetabolicRateKcal: 'BMR',
    heightInches: 'Height',
    age: 'Age',
    gender: 'Gender',
  },
  {
    date: 'date',
    weight: 'weight',
    bodyFatPercentage: 'body_fat_%',
    skeletalMuscleMassLb: 'skeletal_muscle_mass',
    visceralFatLevel: 'visceral_fat_level',
    bmi: 'bmi',
    basalMetabolicRateKcal: 'bmr',
    heightInches: 'height',
    age: 'age',
    gender: 'gender',
  },
  {
    date: 'Test Date',
    weight: 'Weight (lb)',
    bodyFatPercentage: '% Body Fat',
    skeletalMuscleMassLb: 'SMM (lb)',
    visceralFatLevel: 'VFL',
    bmi: 'BMI',
    basalMetabolicRateKcal: 'BMR (kcal)',
    heightInches: 'Height (in)',
    age: 'Age',
    gender: 'Sex',
  },
];

// ============================================================================
// VALIDATION RULES
// ============================================================================

const VALIDATION_RULES = {
  weightLb: { min: 50, max: 500 },
  bodyFatPercentage: { min: 0, max: 50 },
  skeletalMuscleMassLb: { min: 0, max: 300 },
  visceralFatLevel: { min: 1, max: 20 },
  bmi: { min: 10, max: 60 },
  basalMetabolicRateKcal: { min: 800, max: 4000 },
  heightInches: { min: 48, max: 96 },
  age: { min: 10, max: 100 },
};

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

export const parseBodyCompositionCSV = (
  csvContent: string,
  userId: string,
  detectedSource?: BodyCompositionSource
): CSVParseResult => {
  const result: CSVParseResult = {
    success: false,
    scans: [],
    errors: [],
    rowCount: 0,
  };

  try {
    // Remove BOM if present (Excel CSV)
    const cleanContent = csvContent.replace(/^\uFEFF/, '');

    // Parse CSV
    const rows = parseCSV(cleanContent);
    result.rowCount = rows.length;

    if (rows.length === 0) {
      result.errors.push({ row: 0, field: 'file', message: 'CSV file is empty' });
      return result;
    }

    if (rows.length < 2) {
      result.errors.push({ row: 0, field: 'file', message: 'CSV must have at least a header row and one data row' });
      return result;
    }

    // Detect column mapping
    const headers = rows[0];
    const mapping = detectColumnMapping(headers);

    if (!mapping) {
      result.errors.push({ 
        row: 1, 
        field: 'headers', 
        message: 'Could not detect required columns (date and weight). Please ensure your CSV has date and weight columns.' 
      });
      return result;
    }

    // Parse data rows
    const dataRows = rows.slice(1);
    
    for (let i = 0; i < dataRows.length; i++) {
      const rowIndex = i + 2; // 1-indexed for user (header is row 1)
      const row = dataRows[i];
      
      try {
        const scan = parseCSVRow(row, mapping, rowIndex, detectedSource);
        if (scan) {
          result.scans.push(scan);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({ row: rowIndex, field: 'row', message });
      }
    }

    // Validate overall result
    if (result.scans.length === 0) {
      result.errors.push({ row: 0, field: 'file', message: 'No valid scans could be parsed from CSV' });
      return result;
    }

    result.success = true;
    logger.info('CSV parsed successfully', { 
      userId, 
      rowCount: result.scans.length,
      errorCount: result.errors.length 
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parsing error';
    result.errors.push({ row: 0, field: 'file', message: `CSV parsing failed: ${message}` });
    logger.error('CSV parsing failed', { error, userId });
  }

  return result;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const parseCSV = (content: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of cell
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      // End of row
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      // Skip \n after \r
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentCell += char;
    }
  }

  // Add last row if present
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
};

const detectColumnMapping = (headers: string[]): ColumnMapping | null => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Check standard mapping first
  if (hasRequiredColumns(normalizedHeaders, STANDARD_MAPPING)) {
    return STANDARD_MAPPING;
  }

  // Check InBody mappings
  for (const mapping of INBODY_MAPPINGS) {
    const normalizedMapping = normalizeMappingKeys(mapping);
    if (hasRequiredColumns(normalizedHeaders, normalizedMapping)) {
      return mapping;
    }
  }

  // Try fuzzy matching for date and weight columns
  const dateIndex = normalizedHeaders.findIndex(h => 
    h.includes('date') || h.includes('time') || h.includes('test')
  );
  const weightIndex = normalizedHeaders.findIndex(h => 
    h.includes('weight') || h.includes('mass') || h.includes('lb') || h.includes('kg')
  );

  if (dateIndex === -1 || weightIndex === -1) {
    return null;
  }

  // Build custom mapping
  const customMapping: ColumnMapping = {
    date: headers[dateIndex],
    weight: headers[weightIndex],
  };

  // Try to find optional columns
  const bodyFatIndex = normalizedHeaders.findIndex(h => 
    h.includes('fat') && h.includes('%')
  );
  if (bodyFatIndex !== -1) {
    customMapping.bodyFatPercentage = headers[bodyFatIndex];
  }

  const muscleIndex = normalizedHeaders.findIndex(h => 
    h.includes('muscle') || h.includes('smm')
  );
  if (muscleIndex !== -1) {
    customMapping.skeletalMuscleMassLb = headers[muscleIndex];
  }

  const visceralIndex = normalizedHeaders.findIndex(h => 
    h.includes('visceral') || h.includes('vfl')
  );
  if (visceralIndex !== -1) {
    customMapping.visceralFatLevel = headers[visceralIndex];
  }

  const bmiIndex = normalizedHeaders.findIndex(h => h.includes('bmi'));
  if (bmiIndex !== -1) {
    customMapping.bmi = headers[bmiIndex];
  }

  const bmrIndex = normalizedHeaders.findIndex(h => h.includes('bmr') || h.includes('metabolic'));
  if (bmrIndex !== -1) {
    customMapping.basalMetabolicRateKcal = headers[bmrIndex];
  }

  return customMapping;
};

const normalizeMappingKeys = (mapping: ColumnMapping): ColumnMapping => {
  const normalized: ColumnMapping = {
    date: mapping.date.toLowerCase(),
    weight: mapping.weight.toLowerCase(),
  };

  if (mapping.bodyFatPercentage) normalized.bodyFatPercentage = mapping.bodyFatPercentage.toLowerCase();
  if (mapping.skeletalMuscleMassLb) normalized.skeletalMuscleMassLb = mapping.skeletalMuscleMassLb.toLowerCase();
  if (mapping.visceralFatLevel) normalized.visceralFatLevel = mapping.visceralFatLevel.toLowerCase();
  if (mapping.bmi) normalized.bmi = mapping.bmi.toLowerCase();
  if (mapping.basalMetabolicRateKcal) normalized.basalMetabolicRateKcal = mapping.basalMetabolicRateKcal.toLowerCase();
  if (mapping.heightInches) normalized.heightInches = mapping.heightInches.toLowerCase();
  if (mapping.age) normalized.age = mapping.age.toLowerCase();
  if (mapping.gender) normalized.gender = mapping.gender.toLowerCase();

  return normalized;
};

const hasRequiredColumns = (headers: string[], mapping: ColumnMapping): boolean => {
  const normalizedMapping = normalizeMappingKeys(mapping);
  return headers.includes(normalizedMapping.date) && headers.includes(normalizedMapping.weight);
};

const parseCSVRow = (
  row: string[],
  mapping: ColumnMapping,
  rowIndex: number,
  detectedSource?: BodyCompositionSource
): ParsedCSVScan | null => {
  const rowData: Record<string, string> = {};
  
  // Build row data object
  Object.values(mapping).forEach((column, index) => {
    if (row[index] !== undefined) {
      rowData[column] = row[index].trim();
    }
  });

  // Validate required fields
  const dateValue = rowData[mapping.date];
  const weightValue = rowData[mapping.weight];

  if (!dateValue) {
    throw new Error(`Missing required field: ${mapping.date}`);
  }

  if (!weightValue) {
    throw new Error(`Missing required field: ${mapping.weight}`);
  }

  // Parse and validate date
  const date = parseDate(dateValue);
  if (!date) {
    throw new Error(`Invalid date format: ${dateValue}. Expected YYYY-MM-DD`);
  }

  // Parse and validate weight
  const weightLb = parseNumber(weightValue);
  if (weightLb === null) {
    throw new Error(`Invalid weight value: ${weightValue}`);
  }

  if (!isValidRange(weightLb, VALIDATION_RULES.weightLb)) {
    throw new Error(`Weight ${weightLb} is out of valid range (${VALIDATION_RULES.weightLb.min}-${VALIDATION_RULES.weightLb.max})`);
  }

  // Parse optional fields
  const scan: ParsedCSVScan = {
    date,
    weightLb,
    scanSource: detectedSource || 'other_scale',
  };

  if (mapping.bodyFatPercentage && rowData[mapping.bodyFatPercentage]) {
    const bodyFat = parseNumber(rowData[mapping.bodyFatPercentage]);
    if (bodyFat !== null) {
      if (isValidRange(bodyFat, VALIDATION_RULES.bodyFatPercentage)) {
        scan.bodyFatPercentage = bodyFat;
      } else {
        logger.warn(`Body fat percentage out of range on row ${rowIndex}`, { value: bodyFat });
      }
    }
  }

  if (mapping.skeletalMuscleMassLb && rowData[mapping.skeletalMuscleMassLb]) {
    const muscle = parseNumber(rowData[mapping.skeletalMuscleMassLb]);
    if (muscle !== null) {
      if (isValidRange(muscle, VALIDATION_RULES.skeletalMuscleMassLb)) {
        scan.skeletalMuscleMassLb = muscle;
      } else {
        logger.warn(`Skeletal muscle mass out of range on row ${rowIndex}`, { value: muscle });
      }
    }
  }

  if (mapping.visceralFatLevel && rowData[mapping.visceralFatLevel]) {
    const visceral = parseNumber(rowData[mapping.visceralFatLevel]);
    if (visceral !== null) {
      if (isValidRange(visceral, VALIDATION_RULES.visceralFatLevel)) {
        scan.visceralFatLevel = visceral;
      } else {
        logger.warn(`Visceral fat level out of range on row ${rowIndex}`, { value: visceral });
      }
    }
  }

  if (mapping.bmi && rowData[mapping.bmi]) {
    const bmi = parseNumber(rowData[mapping.bmi]);
    if (bmi !== null) {
      if (isValidRange(bmi, VALIDATION_RULES.bmi)) {
        scan.bmi = bmi;
      } else {
        logger.warn(`BMI out of range on row ${rowIndex}`, { value: bmi });
      }
    }
  }

  if (mapping.basalMetabolicRateKcal && rowData[mapping.basalMetabolicRateKcal]) {
    const bmr = parseNumber(rowData[mapping.basalMetabolicRateKcal]);
    if (bmr !== null) {
      if (isValidRange(bmr, VALIDATION_RULES.basalMetabolicRateKcal)) {
        scan.basalMetabolicRateKcal = bmr;
      } else {
        logger.warn(`BMR out of range on row ${rowIndex}`, { value: bmr });
      }
    }
  }

  if (mapping.heightInches && rowData[mapping.heightInches]) {
    const height = parseNumber(rowData[mapping.heightInches]);
    if (height !== null) {
      if (isValidRange(height, VALIDATION_RULES.heightInches)) {
        scan.heightInches = height;
      } else {
        logger.warn(`Height out of range on row ${rowIndex}`, { value: height });
      }
    }
  }

  if (mapping.age && rowData[mapping.age]) {
    const age = parseNumber(rowData[mapping.age]);
    if (age !== null) {
      if (isValidRange(age, VALIDATION_RULES.age)) {
        scan.age = age;
      } else {
        logger.warn(`Age out of range on row ${rowIndex}`, { value: age });
      }
    }
  }

  if (mapping.gender && rowData[mapping.gender]) {
    const gender = rowData[mapping.gender].toLowerCase();
    if (gender === 'male' || gender === 'female' || gender === 'other') {
      scan.gender = gender;
    }
  }

  return scan;
};

const parseDate = (value: string): string | null => {
  // Try YYYY-MM-DD format
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return value;
  }

  // Try MM/DD/YYYY format
  const usMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try DD/MM/YYYY format
  const euMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (euMatch) {
    const [, day, month, year] = euMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return null;
};

const parseNumber = (value: string): number | null => {
  // Remove commas and spaces
  const clean = value.replace(/[, ]/g, '');
  
  // Try parsing
  const parsed = parseFloat(clean);
  
  return isNaN(parsed) ? null : parsed;
};

const isValidRange = (value: number, range: { min: number; max: number }): boolean => {
  return value >= range.min && value <= range.max;
};

// ============================================================================
// BATCH CONVERSION
// ============================================================================

export const convertCSVParsedToScanInputs = (
  scans: ParsedCSVScan[],
  userId: string
): CreateBodyCompositionScanInput[] => {
  return scans.map(scan => ({
    userId,
    scanDate: scan.date,
    scanSource: scan.scanSource,
    weightLb: scan.weightLb,
    bodyFatPercentage: scan.bodyFatPercentage,
    skeletalMuscleMassLb: scan.skeletalMuscleMassLb,
    visceralFatLevel: scan.visceralFatLevel,
    bmi: scan.bmi,
    basalMetabolicRateKcal: scan.basalMetabolicRateKcal,
    heightInches: scan.heightInches,
    age: scan.age,
    gender: scan.gender,
  }));
};
