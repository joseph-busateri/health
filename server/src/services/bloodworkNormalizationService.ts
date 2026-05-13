import type { BloodworkNormalizationRule, NormalizationResult } from '../types/bloodworkResults';

const createRule = (config: {
  normalized_name: string;
  patterns: string[];
  category: string;
  sub_category?: string;
  panel_name?: string;
  panel_category?: string;
  priority?: number;
}): BloodworkNormalizationRule => ({
  raw_patterns: config.patterns,
  normalized_name: config.normalized_name,
  category: config.category,
  sub_category: config.sub_category,
  panel_name: config.panel_name,
  panel_category: config.panel_category ?? config.category,
  priority: config.priority ?? 2,
});

// Normalization rules for common bloodwork markers grouped by panel/category
const NORMALIZATION_RULES: BloodworkNormalizationRule[] = [
  // Hormonal markers
  createRule({
    normalized_name: 'Estradiol',
    patterns: ['Estradiol', 'E2', '17β-Estradiol', 'Estradiol, Sensitive'],
    category: 'hormonal',
    panel_name: 'Hormone Panel',
    panel_category: 'hormonal',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Testosterone, Total',
    patterns: ['Testosterone, Total', 'Total Testosterone', 'Serum Testosterone'],
    category: 'hormonal',
    panel_name: 'Hormone Panel',
    panel_category: 'hormonal',
    priority: 1,
  }),
  createRule({
    normalized_name: 'SHBG',
    patterns: ['SHBG', 'Sex Hormone Binding Globulin', 'Sex Hormone-Binding Globulin'],
    category: 'hormonal',
    panel_name: 'Hormone Panel',
    panel_category: 'hormonal',
    priority: 1,
  }),

  // CBC core markers (hematology)
  createRule({
    normalized_name: 'WBC',
    patterns: ['WBC', 'White Blood Cells', 'White Blood Cell Count', 'Leukocytes'],
    category: 'hematology',
    sub_category: 'cbc_core',
    panel_name: 'CBC',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'RBC',
    patterns: ['RBC', 'Red Blood Cells', 'Red Blood Cell Count', 'Erythrocytes'],
    category: 'hematology',
    sub_category: 'cbc_core',
    panel_name: 'CBC',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'HGB',
    patterns: ['HGB', 'Hemoglobin', 'Hb'],
    category: 'hematology',
    sub_category: 'cbc_core',
    panel_name: 'CBC',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'HCT',
    patterns: ['HCT', 'Hematocrit', 'Packed Cell Volume', 'PCV'],
    category: 'hematology',
    sub_category: 'cbc_core',
    panel_name: 'CBC',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'MCV',
    patterns: ['MCV', 'Mean Corpuscular Volume'],
    category: 'hematology',
    sub_category: 'cbc_core',
    panel_name: 'CBC',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'MCH',
    patterns: ['MCH', 'Mean Corpuscular Hemoglobin'],
    category: 'hematology',
    sub_category: 'cbc_core',
    panel_name: 'CBC',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'MCHC',
    patterns: ['MCHC', 'Mean Corpuscular Hemoglobin Concentration'],
    category: 'hematology',
    sub_category: 'cbc_core',
    panel_name: 'CBC',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'RDW',
    patterns: ['RDW', 'Red Cell Distribution Width'],
    category: 'hematology',
    sub_category: 'cbc_core',
    panel_name: 'CBC',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Platelets',
    patterns: ['PLT', 'Platelets', 'Platelet Count'],
    category: 'hematology',
    sub_category: 'cbc_core',
    panel_name: 'CBC',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'MPV',
    patterns: ['MPV', 'Mean Platelet Volume'],
    category: 'hematology',
    sub_category: 'cbc_core',
    panel_name: 'CBC',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'NRBCs',
    patterns: ['NRBC', 'NRBCs', 'Nucleated Red Blood Cells'],
    category: 'hematology',
    sub_category: 'cbc_core',
    panel_name: 'CBC',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Absolute NRBCs',
    patterns: ['Absolute NRBC', 'Absolute NRBCs', 'NRBC Absolute'],
    category: 'hematology',
    sub_category: 'cbc_core',
    panel_name: 'CBC',
    panel_category: 'hematology',
    priority: 1,
  }),

  // CBC differential percent
  createRule({
    normalized_name: 'Neutrophils',
    patterns: ['Neutrophils %', 'Neutrophils Percent', 'Neutrophils'],
    category: 'hematology',
    sub_category: 'cbc_differential_percent',
    panel_name: 'CBC with Differential',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Lymphocytes',
    patterns: ['Lymphocytes %', 'Lymphocytes Percent', 'Lymphocytes'],
    category: 'hematology',
    sub_category: 'cbc_differential_percent',
    panel_name: 'CBC with Differential',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Monocytes',
    patterns: ['Monocytes %', 'Monocytes Percent', 'Monocytes'],
    category: 'hematology',
    sub_category: 'cbc_differential_percent',
    panel_name: 'CBC with Differential',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Eosinophils',
    patterns: ['Eosinophils %', 'Eosinophils Percent', 'Eosinophils'],
    category: 'hematology',
    sub_category: 'cbc_differential_percent',
    panel_name: 'CBC with Differential',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Basophils',
    patterns: ['Basophils %', 'Basophils Percent', 'Basophils'],
    category: 'hematology',
    sub_category: 'cbc_differential_percent',
    panel_name: 'CBC with Differential',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Immature Granulocytes',
    patterns: ['Immature Granulocytes %', 'Immature Granulocytes'],
    category: 'hematology',
    sub_category: 'cbc_differential_percent',
    panel_name: 'CBC with Differential',
    panel_category: 'hematology',
    priority: 1,
  }),

  // CBC differential absolute
  createRule({
    normalized_name: 'Absolute Neutrophils',
    patterns: ['Neutrophils Absolute', 'Absolute Neutrophils', 'Neutrophils (Absolute)'],
    category: 'hematology',
    sub_category: 'cbc_differential_absolute',
    panel_name: 'CBC with Differential',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Absolute Lymphocytes',
    patterns: ['Lymphocytes Absolute', 'Absolute Lymphocytes', 'Lymphocytes (Absolute)'],
    category: 'hematology',
    sub_category: 'cbc_differential_absolute',
    panel_name: 'CBC with Differential',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Absolute Monocytes',
    patterns: ['Monocytes Absolute', 'Absolute Monocytes', 'Monocytes (Absolute)'],
    category: 'hematology',
    sub_category: 'cbc_differential_absolute',
    panel_name: 'CBC with Differential',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Absolute Eosinophils',
    patterns: ['Eosinophils Absolute', 'Absolute Eosinophils', 'Eosinophils (Absolute)'],
    category: 'hematology',
    sub_category: 'cbc_differential_absolute',
    panel_name: 'CBC with Differential',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Absolute Basophils',
    patterns: ['Basophils Absolute', 'Absolute Basophils', 'Basophils (Absolute)'],
    category: 'hematology',
    sub_category: 'cbc_differential_absolute',
    panel_name: 'CBC with Differential',
    panel_category: 'hematology',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Absolute Immature Granulocytes',
    patterns: ['Immature Granulocytes Absolute', 'Absolute Immature Granulocytes', 'Immature Granulocytes (Absolute)'],
    category: 'hematology',
    sub_category: 'cbc_differential_absolute',
    panel_name: 'CBC with Differential',
    panel_category: 'hematology',
    priority: 1,
  }),

  // CMP electrolytes
  createRule({
    normalized_name: 'Sodium',
    patterns: ['Sodium', 'Na', 'Serum Sodium'],
    category: 'electrolyte',
    sub_category: 'cmp_electrolytes',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Potassium',
    patterns: ['Potassium', 'K', 'Serum Potassium'],
    category: 'electrolyte',
    sub_category: 'cmp_electrolytes',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Chloride',
    patterns: ['Chloride', 'Cl', 'Serum Chloride'],
    category: 'electrolyte',
    sub_category: 'cmp_electrolytes',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Carbon Dioxide',
    patterns: ['Carbon Dioxide', 'CO2', 'Bicarbonate'],
    category: 'electrolyte',
    sub_category: 'cmp_electrolytes',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Anion Gap',
    patterns: ['Anion Gap', 'Aniongap'],
    category: 'electrolyte',
    sub_category: 'cmp_electrolytes',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),

  // CMP renal markers
  createRule({
    normalized_name: 'Blood Urea Nitrogen',
    patterns: ['Blood Urea Nitrogen', 'BUN', 'Urea Nitrogen'],
    category: 'renal',
    sub_category: 'cmp_renal',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Creatinine',
    patterns: ['Creatinine', 'Serum Creatinine', 'Cr'],
    category: 'renal',
    sub_category: 'cmp_renal',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),
  createRule({
    normalized_name: 'eGFRcr',
    patterns: ['eGFRcr', 'eGFR', 'Estimated Glomerular Filtration Rate'],
    category: 'renal',
    sub_category: 'cmp_renal',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),

  // CMP metabolic markers
  createRule({
    normalized_name: 'Calcium',
    patterns: ['Calcium', 'Ca'],
    category: 'metabolic',
    sub_category: 'cmp_metabolic',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Glucose',
    patterns: ['Glucose', 'Blood Glucose', 'Serum Glucose', 'Plasma Glucose'],
    category: 'metabolic',
    sub_category: 'cmp_metabolic',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Protein, Total',
    patterns: ['Protein, Total', 'Total Protein', 'Protein Total'],
    category: 'metabolic',
    sub_category: 'cmp_metabolic',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Albumin',
    patterns: ['Albumin', 'Serum Albumin'],
    category: 'metabolic',
    sub_category: 'cmp_metabolic',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),

  // CMP liver markers
  createRule({
    normalized_name: 'ALT',
    patterns: ['ALT', 'SGPT', 'Alanine Aminotransferase', 'Alanine Transaminase'],
    category: 'liver',
    sub_category: 'cmp_liver',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),
  createRule({
    normalized_name: 'AST',
    patterns: ['AST', 'SGOT', 'Aspartate Aminotransferase', 'Aspartate Transaminase'],
    category: 'liver',
    sub_category: 'cmp_liver',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Alkaline Phosphatase',
    patterns: ['Alkaline Phosphatase', 'ALP'],
    category: 'liver',
    sub_category: 'cmp_liver',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),
  createRule({
    normalized_name: 'Bilirubin, Total',
    patterns: ['Bilirubin, Total', 'Total Bilirubin', 'TBIL'],
    category: 'liver',
    sub_category: 'cmp_liver',
    panel_name: 'Comprehensive Metabolic Panel',
    panel_category: 'metabolic',
    priority: 1,
  }),

  // Cardiovascular/lipid markers (retain legacy support)
  createRule({
    normalized_name: 'LDL',
    patterns: ['LDL', 'LDL-C', 'LDL Cholesterol', 'Low Density Lipoprotein', 'LDL-Calc'],
    category: 'cardiovascular',
    panel_name: 'Lipid Panel',
    panel_category: 'cardiovascular',
    priority: 3,
  }),
  createRule({
    normalized_name: 'HDL',
    patterns: ['HDL', 'HDL-C', 'HDL Cholesterol', 'High Density Lipoprotein'],
    category: 'cardiovascular',
    panel_name: 'Lipid Panel',
    panel_category: 'cardiovascular',
    priority: 3,
  }),
  createRule({
    normalized_name: 'Triglycerides',
    patterns: ['Triglycerides', 'TG', 'Triglyceride'],
    category: 'cardiovascular',
    panel_name: 'Lipid Panel',
    panel_category: 'cardiovascular',
    priority: 3,
  }),
  createRule({
    normalized_name: 'ApoB',
    patterns: ['ApoB', 'Apolipoprotein B', 'Apo B'],
    category: 'cardiovascular',
    panel_name: 'Advanced Lipid Panel',
    panel_category: 'cardiovascular',
    priority: 3,
  }),
  createRule({
    normalized_name: 'hsCRP',
    patterns: ['hsCRP', 'CRP', 'C-Reactive Protein', 'High Sensitivity C-Reactive Protein'],
    category: 'cardiovascular',
    panel_name: 'Inflammation Panel',
    panel_category: 'cardiovascular',
    priority: 3,
  }),
  createRule({
    normalized_name: 'Total Cholesterol',
    patterns: ['Total Cholesterol', 'Cholesterol', 'TC', 'Total Chol'],
    category: 'cardiovascular',
    panel_name: 'Lipid Panel',
    panel_category: 'cardiovascular',
    priority: 3,
  }),
];

/**
 * Normalize a bloodwork test name using predefined rules
 */
export function normalizeBloodworkMarker(rawTestName: string): NormalizationResult {
  if (!rawTestName || typeof rawTestName !== 'string') {
    return {
      confidence: 0,
    };
  }

  const cleanedName = rawTestName.trim().toLowerCase();
  
  // Sort rules by priority (higher priority first)
  const sortedRules = [...NORMALIZATION_RULES].sort((a, b) => a.priority - b.priority);
  
  for (const rule of sortedRules) {
    for (const pattern of rule.raw_patterns) {
      const patternLower = pattern.toLowerCase();
      
      // Exact match
      if (cleanedName === patternLower) {
        return {
          normalized_name: rule.normalized_name,
          category: rule.category,
          confidence: 1.0,
          matched_pattern: pattern
        };
      }
      
      // Contains match (lower confidence)
      if (cleanedName.includes(patternLower) || patternLower.includes(cleanedName)) {
        return {
          normalized_name: rule.normalized_name,
          category: rule.category,
          confidence: 0.8,
          matched_pattern: pattern
        };
      }
      
      // Fuzzy matching for close matches
      if (fuzzyMatch(cleanedName, patternLower, 0.8)) {
        return {
          normalized_name: rule.normalized_name,
          category: rule.category,
          confidence: 0.7,
          matched_pattern: pattern
        };
      }
    }
  }
  
  // No match found
  return {
    confidence: 0,
  };
}

/**
 * Simple fuzzy matching implementation
 */
function fuzzyMatch(str1: string, str2: string, threshold: number): boolean {
  if (str1 === str2) return true;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return true;
  
  const distance = levenshteinDistance(longer, shorter);
  const similarity = (longer.length - distance) / longer.length;
  
  return similarity >= threshold;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Get all normalization rules for a specific category
 */
export function getNormalizationRulesByCategory(category: string): BloodworkNormalizationRule[] {
  return NORMALIZATION_RULES.filter(rule => rule.category === category);
}

/**
 * Get all available categories
 */
export function getAvailableCategories(): string[] {
  return [...new Set(NORMALIZATION_RULES.map(rule => rule.category))];
}

/**
 * Add a new normalization rule (for extensibility)
 */
export function addNormalizationRule(rule: BloodworkNormalizationRule): void {
  NORMALIZATION_RULES.push(rule);
}

/**
 * Batch normalize multiple test names
 */
export function batchNormalizeBloodworkMarkers(rawTestNames: string[]): NormalizationResult[] {
  return rawTestNames.map(name => normalizeBloodworkMarker(name));
}
