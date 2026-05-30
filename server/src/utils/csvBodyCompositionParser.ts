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
  // Additional InBody S2 fields
  bodyFatMassLb?: number;
  totalBodyWaterLb?: number;
  intracellularWaterLb?: number;
  extracellularWaterLb?: number;
  visceralFatAreaCm2?: number;
  rightArmMuscleLb?: number;
  leftArmMuscleLb?: number;
  trunkMuscleLb?: number;
  rightLegMuscleLb?: number;
  leftLegMuscleLb?: number;
  rightArmFatLb?: number;
  leftArmFatLb?: number;
  trunkFatLb?: number;
  rightLegFatLb?: number;
  leftLegFatLb?: number;
  proteinMassLb?: number;
  boneMinContentLb?: number;
  phaseAngleDegrees?: number;
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
  bodyFatMassLb?: string;
  totalBodyWaterLb?: string;
  intracellularWaterLb?: string;
  extracellularWaterLb?: string;
  visceralFatAreaCm2?: string;
  rightArmMuscleLb?: string;
  leftArmMuscleLb?: string;
  trunkMuscleLb?: string;
  rightLegMuscleLb?: string;
  leftLegMuscleLb?: string;
  rightArmFatLb?: string;
  leftArmFatLb?: string;
  trunkFatLb?: string;
  rightLegFatLb?: string;
  leftLegFatLb?: string;
  proteinMassLb?: string;
  boneMinContentLb?: string;
  phaseAngleDegrees?: string;
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
  // InBody S2 format (exported CSV)
  {
    date: 'date',
    weight: 'Weight(lb)',
    bodyFatPercentage: 'Percent Body Fat(%)',
    skeletalMuscleMassLb: 'Skeletal Muscle Mass(lb)',
    visceralFatLevel: 'Visceral Fat Level(Level)',
    bmi: 'BMI(kg/m²)',
    basalMetabolicRateKcal: 'Basal Metabolic Rate(kJ)', // Will convert kJ to kcal
    bodyFatMassLb: 'Body Fat Mass(lb)',
    totalBodyWaterLb: 'Total Body Water(lb)',
    intracellularWaterLb: 'Intracellular Water(lb)',
    extracellularWaterLb: 'Extracellular Water(lb)',
    visceralFatAreaCm2: 'Visceral Fat Area(cm²)',
    rightArmMuscleLb: 'Right Arm Lean Mass(lb)',
    leftArmMuscleLb: 'Left Arm Lean Mass(lb)',
    trunkMuscleLb: 'Trunk Lean Mass(lb)',
    rightLegMuscleLb: 'Right Leg Lean Mass(lb)',
    leftLegMuscleLb: 'Left leg Lean Mass(lb)',
    rightArmFatLb: 'Right Arm Fat Mass(lb)',
    leftArmFatLb: 'Left Arm Fat Mass(lb)',
    trunkFatLb: 'Trunk Fat Mass(lb)',
    rightLegFatLb: 'Right Leg Fat Mass(lb)',
    leftLegFatLb: 'Left Leg Fat Mass(lb)',
    proteinMassLb: 'Protein(lb)',
    boneMinContentLb: 'Bone Mineral Content(lb)',
    phaseAngleDegrees: 'Whole Body Phase Angle(°)',
  },
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
  // Additional InBody S2 validation rules
  bodyFatMassLb: { min: 0, max: 200 },
  totalBodyWaterLb: { min: 0, max: 200 },
  intracellularWaterLb: { min: 0, max: 150 },
  extracellularWaterLb: { min: 0, max: 100 },
  visceralFatAreaCm2: { min: 0, max: 300 },
  rightArmMuscleLb: { min: 0, max: 50 },
  leftArmMuscleLb: { min: 0, max: 50 },
  trunkMuscleLb: { min: 0, max: 150 },
  rightLegMuscleLb: { min: 0, max: 100 },
  leftLegMuscleLb: { min: 0, max: 100 },
  rightArmFatLb: { min: 0, max: 50 },
  leftArmFatLb: { min: 0, max: 50 },
  trunkFatLb: { min: 0, max: 150 },
  rightLegFatLb: { min: 0, max: 100 },
  leftLegFatLb: { min: 0, max: 100 },
  proteinMassLb: { min: 0, max: 100 },
  boneMinContentLb: { min: 0, max: 20 },
  phaseAngleDegrees: { min: 0, max: 20 },
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
    logger.info('CSV Headers detected', { headers });
    const mapping = detectColumnMapping(headers);

    if (!mapping) {
      result.errors.push({ 
        row: 1, 
        field: 'headers', 
        message: 'Could not detect required columns (date and weight). Please ensure your CSV has date and weight columns.' 
      });
      return result;
    }

    logger.info('Column mapping detected', { 
      dateColumn: mapping.date,
      weightColumn: mapping.weight,
      bodyFatColumn: mapping.bodyFatPercentage,
      muscleColumn: mapping.skeletalMuscleMassLb,
      bmiColumn: mapping.bmi,
      bmrColumn: mapping.basalMetabolicRateKcal,
      bodyFatMassColumn: mapping.bodyFatMassLb,
      totalBodyWaterColumn: mapping.totalBodyWaterLb,
      intracellularWaterColumn: mapping.intracellularWaterLb,
      extracellularWaterColumn: mapping.extracellularWaterLb,
      visceralFatAreaColumn: mapping.visceralFatAreaCm2,
      rightArmMuscleColumn: mapping.rightArmMuscleLb,
      leftArmMuscleColumn: mapping.leftArmMuscleLb,
      trunkMuscleColumn: mapping.trunkMuscleLb,
      rightLegMuscleColumn: mapping.rightLegMuscleLb,
      leftLegMuscleColumn: mapping.leftLegMuscleLb,
      rightArmFatColumn: mapping.rightArmFatLb,
      leftArmFatColumn: mapping.leftArmFatLb,
      trunkFatColumn: mapping.trunkFatLb,
      rightLegFatColumn: mapping.rightLegFatLb,
      leftLegFatColumn: mapping.leftLegFatLb,
      proteinColumn: mapping.proteinMassLb,
      boneMinColumn: mapping.boneMinContentLb,
      phaseAngleColumn: mapping.phaseAngleDegrees
    });

    // Parse data rows
    const dataRows = rows.slice(1);
    
    for (let i = 0; i < dataRows.length; i++) {
      const rowIndex = i + 2; // 1-indexed for user (header is row 1)
      const row = dataRows[i];
      
      try {
        const scan = parseCSVRow(row, mapping, rowIndex, detectedSource, headers);
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
  
  // Additional InBody S2 fields
  if (mapping.bodyFatMassLb) normalized.bodyFatMassLb = mapping.bodyFatMassLb.toLowerCase();
  if (mapping.totalBodyWaterLb) normalized.totalBodyWaterLb = mapping.totalBodyWaterLb.toLowerCase();
  if (mapping.intracellularWaterLb) normalized.intracellularWaterLb = mapping.intracellularWaterLb.toLowerCase();
  if (mapping.extracellularWaterLb) normalized.extracellularWaterLb = mapping.extracellularWaterLb.toLowerCase();
  if (mapping.visceralFatAreaCm2) normalized.visceralFatAreaCm2 = mapping.visceralFatAreaCm2.toLowerCase();
  if (mapping.rightArmMuscleLb) normalized.rightArmMuscleLb = mapping.rightArmMuscleLb.toLowerCase();
  if (mapping.leftArmMuscleLb) normalized.leftArmMuscleLb = mapping.leftArmMuscleLb.toLowerCase();
  if (mapping.trunkMuscleLb) normalized.trunkMuscleLb = mapping.trunkMuscleLb.toLowerCase();
  if (mapping.rightLegMuscleLb) normalized.rightLegMuscleLb = mapping.rightLegMuscleLb.toLowerCase();
  if (mapping.leftLegMuscleLb) normalized.leftLegMuscleLb = mapping.leftLegMuscleLb.toLowerCase();
  if (mapping.rightArmFatLb) normalized.rightArmFatLb = mapping.rightArmFatLb.toLowerCase();
  if (mapping.leftArmFatLb) normalized.leftArmFatLb = mapping.leftArmFatLb.toLowerCase();
  if (mapping.trunkFatLb) normalized.trunkFatLb = mapping.trunkFatLb.toLowerCase();
  if (mapping.rightLegFatLb) normalized.rightLegFatLb = mapping.rightLegFatLb.toLowerCase();
  if (mapping.leftLegFatLb) normalized.leftLegFatLb = mapping.leftLegFatLb.toLowerCase();
  if (mapping.proteinMassLb) normalized.proteinMassLb = mapping.proteinMassLb.toLowerCase();
  if (mapping.boneMinContentLb) normalized.boneMinContentLb = mapping.boneMinContentLb.toLowerCase();
  if (mapping.phaseAngleDegrees) normalized.phaseAngleDegrees = mapping.phaseAngleDegrees.toLowerCase();

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
  detectedSource?: BodyCompositionSource,
  headers?: string[]
): ParsedCSVScan | null => {
  const rowData: Record<string, string> = {};
  
  // Build row data object by finding column index in headers
  if (headers) {
    Object.entries(mapping).forEach(([key, columnName]) => {
      const columnIndex = headers.indexOf(columnName);
      if (columnIndex !== -1 && row[columnIndex] !== undefined) {
        rowData[columnName] = row[columnIndex].trim();
      }
    });
  } else {
    // Fallback: assume mapping order matches row order (for backward compatibility)
    Object.values(mapping).forEach((column, index) => {
      if (row[index] !== undefined) {
        rowData[column] = row[index].trim();
      }
    });
  }

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
    throw new Error(`Invalid date format: ${dateValue}. Expected YYYY-MM-DD, YYYYMMDD, MM/DD/YYYY, or DD/MM/YYYY`);
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
    let bmr = parseNumber(rowData[mapping.basalMetabolicRateKcal]);
    if (bmr !== null) {
      // Check if this is InBody S2 format with kJ (column name contains 'kJ')
      if (mapping.basalMetabolicRateKcal.includes('kJ')) {
        // Convert kJ to kcal: 1 kJ = 0.239006 kcal
        bmr = Math.round(bmr * 0.239006);
      }
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

  // Parse additional InBody S2 fields
  if (mapping.bodyFatMassLb && rowData[mapping.bodyFatMassLb]) {
    const value = parseNumber(rowData[mapping.bodyFatMassLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.bodyFatMassLb)) {
      scan.bodyFatMassLb = value;
    }
  }

  if (mapping.totalBodyWaterLb && rowData[mapping.totalBodyWaterLb]) {
    const value = parseNumber(rowData[mapping.totalBodyWaterLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.totalBodyWaterLb)) {
      scan.totalBodyWaterLb = value;
    }
  }

  if (mapping.intracellularWaterLb && rowData[mapping.intracellularWaterLb]) {
    const value = parseNumber(rowData[mapping.intracellularWaterLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.intracellularWaterLb)) {
      scan.intracellularWaterLb = value;
    }
  }

  if (mapping.extracellularWaterLb && rowData[mapping.extracellularWaterLb]) {
    const value = parseNumber(rowData[mapping.extracellularWaterLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.extracellularWaterLb)) {
      scan.extracellularWaterLb = value;
    }
  }

  if (mapping.visceralFatAreaCm2 && rowData[mapping.visceralFatAreaCm2]) {
    const value = parseNumber(rowData[mapping.visceralFatAreaCm2]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.visceralFatAreaCm2)) {
      scan.visceralFatAreaCm2 = value;
    }
  }

  if (mapping.rightArmMuscleLb && rowData[mapping.rightArmMuscleLb]) {
    const value = parseNumber(rowData[mapping.rightArmMuscleLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.rightArmMuscleLb)) {
      scan.rightArmMuscleLb = value;
    }
  }

  if (mapping.leftArmMuscleLb && rowData[mapping.leftArmMuscleLb]) {
    const value = parseNumber(rowData[mapping.leftArmMuscleLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.leftArmMuscleLb)) {
      scan.leftArmMuscleLb = value;
    }
  }

  if (mapping.trunkMuscleLb && rowData[mapping.trunkMuscleLb]) {
    const value = parseNumber(rowData[mapping.trunkMuscleLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.trunkMuscleLb)) {
      scan.trunkMuscleLb = value;
    }
  }

  if (mapping.rightLegMuscleLb && rowData[mapping.rightLegMuscleLb]) {
    const value = parseNumber(rowData[mapping.rightLegMuscleLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.rightLegMuscleLb)) {
      scan.rightLegMuscleLb = value;
    }
  }

  if (mapping.leftLegMuscleLb && rowData[mapping.leftLegMuscleLb]) {
    const value = parseNumber(rowData[mapping.leftLegMuscleLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.leftLegMuscleLb)) {
      scan.leftLegMuscleLb = value;
    }
  }

  if (mapping.rightArmFatLb && rowData[mapping.rightArmFatLb]) {
    const value = parseNumber(rowData[mapping.rightArmFatLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.rightArmFatLb)) {
      scan.rightArmFatLb = value;
    }
  }

  if (mapping.leftArmFatLb && rowData[mapping.leftArmFatLb]) {
    const value = parseNumber(rowData[mapping.leftArmFatLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.leftArmFatLb)) {
      scan.leftArmFatLb = value;
    }
  }

  if (mapping.trunkFatLb && rowData[mapping.trunkFatLb]) {
    const value = parseNumber(rowData[mapping.trunkFatLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.trunkFatLb)) {
      scan.trunkFatLb = value;
    }
  }

  if (mapping.rightLegFatLb && rowData[mapping.rightLegFatLb]) {
    const value = parseNumber(rowData[mapping.rightLegFatLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.rightLegFatLb)) {
      scan.rightLegFatLb = value;
    }
  }

  if (mapping.leftLegFatLb && rowData[mapping.leftLegFatLb]) {
    const value = parseNumber(rowData[mapping.leftLegFatLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.leftLegFatLb)) {
      scan.leftLegFatLb = value;
    }
  }

  if (mapping.proteinMassLb && rowData[mapping.proteinMassLb]) {
    const value = parseNumber(rowData[mapping.proteinMassLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.proteinMassLb)) {
      scan.proteinMassLb = value;
    }
  }

  if (mapping.boneMinContentLb && rowData[mapping.boneMinContentLb]) {
    const value = parseNumber(rowData[mapping.boneMinContentLb]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.boneMinContentLb)) {
      scan.boneMinContentLb = value;
    }
  }

  if (mapping.phaseAngleDegrees && rowData[mapping.phaseAngleDegrees]) {
    const value = parseNumber(rowData[mapping.phaseAngleDegrees]);
    if (value !== null && isValidRange(value, VALIDATION_RULES.phaseAngleDegrees)) {
      scan.phaseAngleDegrees = value;
    }
  }

  return scan;
};

const parseDate = (value: string): string | null => {
  // Try YYYYMMDD format (e.g., 20260418)
  const compactMatch = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    const [, year, month, day] = compactMatch;
    return `${year}-${month}-${day}`;
  }

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
  // Handle missing values (InBody S2 uses '-' for missing data)
  if (!value || value.trim() === '-' || value.trim() === '') {
    return null;
  }
  
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
    // Additional InBody S2 fields
    bodyFatMassLb: scan.bodyFatMassLb,
    totalBodyWaterLb: scan.totalBodyWaterLb,
    intracellularWaterLb: scan.intracellularWaterLb,
    extracellularWaterLb: scan.extracellularWaterLb,
    visceralFatAreaCm2: scan.visceralFatAreaCm2,
    rightArmMuscleLb: scan.rightArmMuscleLb,
    leftArmMuscleLb: scan.leftArmMuscleLb,
    trunkMuscleLb: scan.trunkMuscleLb,
    rightLegMuscleLb: scan.rightLegMuscleLb,
    leftLegMuscleLb: scan.leftLegMuscleLb,
    rightArmFatLb: scan.rightArmFatLb,
    leftArmFatLb: scan.leftArmFatLb,
    trunkFatLb: scan.trunkFatLb,
    rightLegFatLb: scan.rightLegFatLb,
    leftLegFatLb: scan.leftLegFatLb,
    proteinMassLb: scan.proteinMassLb,
    boneMinContentLb: scan.boneMinContentLb,
    phaseAngleDegrees: scan.phaseAngleDegrees,
  }));
};
