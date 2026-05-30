/**
 * Bloodwork Recommendation Rules V2
 * 
 * Expanded rule library covering 30+ common bloodwork markers.
 * Organized by clinical category for maintainability.
 * 
 * Each rule defines:
 * - Clinical trigger conditions (thresholds, trends)
 * - Recommendation content (title, text, rationale)
 * - Severity and confidence levels
 */

import type { RecommendationRule } from '../types/bloodworkRecommendations';

// ============================================================================
// CARDIOVASCULAR MARKERS
// ============================================================================

const CARDIOVASCULAR_RULES: RecommendationRule[] = [
  {
    marker_name: 'LDL',
    recommendation_type: 'cardiovascular',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 100 },
      trend_threshold: { operator: '>', value: 10 }
    },
    recommendation: {
      title: 'LDL Cholesterol Increasing',
      text_template: 'Your LDL cholesterol has increased from {prior_value} to {latest_value} mg/dL ({change}%). Consider reviewing your cardiovascular health strategy.',
      rationale_template: 'LDL cholesterol is rising above optimal levels ({latest_value} mg/dL) with a worsening trend over {data_points} measurements.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'LDL',
    recommendation_type: 'cardiovascular',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 130 }
    },
    recommendation: {
      title: 'High LDL Cholesterol Detected',
      text_template: 'Your LDL cholesterol is elevated at {latest_value} mg/dL and has been increasing. This may require intervention.',
      rationale_template: 'LDL cholesterol is significantly elevated ({latest_value} mg/dL) with worsening trend, indicating increased cardiovascular risk.',
      severity: 'high',
      base_confidence: 0.9
    }
  },
  {
    marker_name: 'HDL',
    recommendation_type: 'cardiovascular',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 40 }
    },
    recommendation: {
      title: 'HDL Cholesterol Declining',
      text_template: 'Your HDL (good cholesterol) has decreased to {latest_value} mg/dL, which may reduce cardiovascular protection.',
      rationale_template: 'Low HDL cholesterol ({latest_value} mg/dL) with declining trend reduces cardiovascular protection.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'Triglycerides',
    recommendation_type: 'cardiovascular',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 150 }
    },
    recommendation: {
      title: 'Triglycerides Elevated',
      text_template: 'Your triglycerides have increased to {latest_value} mg/dL, suggesting metabolic stress.',
      rationale_template: 'Elevated triglycerides ({latest_value} mg/dL) with worsening trend indicate metabolic dysfunction.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'ApoB',
    recommendation_type: 'cardiovascular',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 90 }
    },
    recommendation: {
      title: 'ApoB Levels Rising',
      text_template: 'Your ApoB has increased to {latest_value} mg/dL, suggesting increased cardiovascular risk particles.',
      rationale_template: 'Rising ApoB levels ({latest_value} mg/dL) indicate increased atherogenic particle concentration.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'Lp(a)',
    recommendation_type: 'cardiovascular',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 50 }
    },
    recommendation: {
      title: 'Lipoprotein(a) Elevated',
      text_template: 'Your Lp(a) is elevated at {latest_value} mg/dL, indicating genetic cardiovascular risk.',
      rationale_template: 'Elevated Lp(a) ({latest_value} mg/dL) is a genetic risk factor for cardiovascular disease.',
      severity: 'medium',
      base_confidence: 0.7
    }
  }
];

// ============================================================================
// METABOLIC / INFLAMMATION MARKERS
// ============================================================================

const METABOLIC_RULES: RecommendationRule[] = [
  {
    marker_name: 'Glucose',
    recommendation_type: 'metabolic',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 100 }
    },
    recommendation: {
      title: 'Fasting Glucose Elevated',
      text_template: 'Your fasting glucose has increased to {latest_value} mg/dL, suggesting impaired glucose metabolism.',
      rationale_template: 'Elevated fasting glucose ({latest_value} mg/dL) with worsening trend indicates developing insulin resistance.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'HbA1c',
    recommendation_type: 'metabolic',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 5.7 }
    },
    recommendation: {
      title: 'HbA1c Rising - Prediabetic Range',
      text_template: 'Your HbA1c has increased to {latest_value}%, entering prediabetic range.',
      rationale_template: 'HbA1c above 5.7% ({latest_value}%) with worsening trend indicates prediabetes.',
      severity: 'high',
      base_confidence: 0.9
    }
  },
  {
    marker_name: 'Insulin',
    recommendation_type: 'metabolic',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 25 }
    },
    recommendation: {
      title: 'Insulin Levels Increasing',
      text_template: 'Your insulin levels have risen to {latest_value} µIU/mL, suggesting insulin resistance.',
      rationale_template: 'Elevated insulin ({latest_value} µIU/mL) with worsening trend indicates developing insulin resistance.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'hsCRP',
    recommendation_type: 'inflammation',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 3 }
    },
    recommendation: {
      title: 'Inflammation Markers Elevated',
      text_template: 'Your hsCRP is elevated at {latest_value} mg/L and increasing, suggesting systemic inflammation.',
      rationale_template: 'Elevated and rising hsCRP ({latest_value} mg/L) indicates active inflammation requiring follow-up.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'Homocysteine',
    recommendation_type: 'cardiovascular',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 15 }
    },
    recommendation: {
      title: 'Homocysteine Elevated',
      text_template: 'Your homocysteine has increased to {latest_value} µmol/L, which may indicate B-vitamin deficiency.',
      rationale_template: 'Elevated homocysteine ({latest_value} µmol/L) may indicate folate/B12 deficiency and cardiovascular risk.',
      severity: 'medium',
      base_confidence: 0.7
    }
  }
];

// ============================================================================
// LIVER FUNCTION MARKERS
// ============================================================================

const LIVER_RULES: RecommendationRule[] = [
  {
    marker_name: 'ALT',
    recommendation_type: 'liver',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 40 }
    },
    recommendation: {
      title: 'ALT Enzyme Elevated',
      text_template: 'Your ALT has increased to {latest_value} U/L, suggesting liver stress or inflammation.',
      rationale_template: 'Elevated ALT ({latest_value} U/L) with worsening trend indicates hepatocellular stress.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'AST',
    recommendation_type: 'liver',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 40 }
    },
    recommendation: {
      title: 'AST Enzyme Elevated',
      text_template: 'Your AST has increased to {latest_value} U/L, which may indicate liver or muscle stress.',
      rationale_template: 'Elevated AST ({latest_value} U/L) with worsening trend may indicate hepatic or muscle damage.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'GGT',
    recommendation_type: 'liver',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 50 }
    },
    recommendation: {
      title: 'GGT Elevated',
      text_template: 'Your GGT has increased to {latest_value} U/L, suggesting bile duct or liver stress.',
      rationale_template: 'Elevated GGT ({latest_value} U/L) may indicate cholestasis or hepatic dysfunction.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'Bilirubin, Total',
    recommendation_type: 'liver',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 1.2 }
    },
    recommendation: {
      title: 'Bilirubin Elevated',
      text_template: 'Your total bilirubin has increased to {latest_value} mg/dL, which may indicate liver or bile duct issues.',
      rationale_template: 'Elevated bilirubin ({latest_value} mg/dL) with worsening trend may indicate hepatic or biliary dysfunction.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'Alkaline Phosphatase',
    recommendation_type: 'liver',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 120 }
    },
    recommendation: {
      title: 'Alkaline Phosphatase Elevated',
      text_template: 'Your alkaline phosphatase has increased to {latest_value} U/L, which may indicate bone or liver issues.',
      rationale_template: 'Elevated ALP ({latest_value} U/L) may indicate hepatobiliary or bone metabolism issues.',
      severity: 'low',
      base_confidence: 0.6
    }
  }
];

// ============================================================================
// KIDNEY FUNCTION MARKERS
// ============================================================================

const KIDNEY_RULES: RecommendationRule[] = [
  {
    marker_name: 'Creatinine',
    recommendation_type: 'kidney',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 1.2 }
    },
    recommendation: {
      title: 'Creatinine Elevated',
      text_template: 'Your creatinine has increased to {latest_value} mg/dL, which may indicate reduced kidney function.',
      rationale_template: 'Elevated creatinine ({latest_value} mg/dL) with worsening trend suggests declining renal function.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'Blood Urea Nitrogen',
    recommendation_type: 'kidney',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 20 }
    },
    recommendation: {
      title: 'BUN Elevated',
      text_template: 'Your BUN has increased to {latest_value} mg/dL, which may indicate kidney stress or dehydration.',
      rationale_template: 'Elevated BUN ({latest_value} mg/dL) may indicate renal dysfunction or protein metabolism issues.',
      severity: 'low',
      base_confidence: 0.6
    }
  },
  {
    marker_name: 'eGFR',
    recommendation_type: 'kidney',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 60 }
    },
    recommendation: {
      title: 'Kidney Function Declining',
      text_template: 'Your estimated GFR has decreased to {latest_value} mL/min, indicating reduced kidney function.',
      rationale_template: 'eGFR below 60 ({latest_value} mL/min) with declining trend indicates chronic kidney disease stage 3.',
      severity: 'high',
      base_confidence: 0.9
    }
  }
];

// ============================================================================
// HEMATOLOGY (BLOOD CELL) MARKERS
// ============================================================================

const HEMATOLOGY_RULES: RecommendationRule[] = [
  {
    marker_name: 'WBC',
    recommendation_type: 'hematology',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 11 }
    },
    recommendation: {
      title: 'White Blood Cell Count Elevated',
      text_template: 'Your WBC has increased to {latest_value} K/µL, which may indicate infection or inflammation.',
      rationale_template: 'Elevated WBC ({latest_value} K/µL) with worsening trend suggests immune activation.',
      severity: 'low',
      base_confidence: 0.6
    }
  },
  {
    marker_name: 'RBC',
    recommendation_type: 'hematology',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 4.5 }
    },
    recommendation: {
      title: 'Red Blood Cell Count Declining',
      text_template: 'Your RBC has decreased to {latest_value} M/µL, which may indicate anemia.',
      rationale_template: 'Low RBC ({latest_value} M/µL) with declining trend suggests developing anemia.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'HGB',
    recommendation_type: 'hematology',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 13.5 }
    },
    recommendation: {
      title: 'Hemoglobin Declining',
      text_template: 'Your hemoglobin has decreased to {latest_value} g/dL, which may indicate anemia.',
      rationale_template: 'Low hemoglobin ({latest_value} g/dL) with declining trend indicates anemia requiring evaluation.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'Platelets',
    recommendation_type: 'hematology',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 150 }
    },
    recommendation: {
      title: 'Platelet Count Low',
      text_template: 'Your platelet count has decreased to {latest_value} K/µL, which may affect clotting.',
      rationale_template: 'Low platelets ({latest_value} K/µL) with declining trend may indicate thrombocytopenia.',
      severity: 'medium',
      base_confidence: 0.7
    }
  }
];

// ============================================================================
// THYROID MARKERS
// ============================================================================

const THYROID_RULES: RecommendationRule[] = [
  {
    marker_name: 'TSH',
    recommendation_type: 'thyroid',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 4.5 }
    },
    recommendation: {
      title: 'TSH Elevated - Possible Hypothyroidism',
      text_template: 'Your TSH has increased to {latest_value} mIU/L, suggesting underactive thyroid.',
      rationale_template: 'Elevated TSH ({latest_value} mIU/L) with worsening trend indicates hypothyroidism.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'Free T3',
    recommendation_type: 'thyroid',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 2.3 }
    },
    recommendation: {
      title: 'Free T3 Declining',
      text_template: 'Your Free T3 has decreased to {latest_value} pg/mL, which may indicate thyroid dysfunction.',
      rationale_template: 'Low Free T3 ({latest_value} pg/mL) with declining trend may indicate hypothyroidism or conversion issues.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'Free T4',
    recommendation_type: 'thyroid',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 0.8 }
    },
    recommendation: {
      title: 'Free T4 Low',
      text_template: 'Your Free T4 has decreased to {latest_value} ng/dL, suggesting thyroid hormone deficiency.',
      rationale_template: 'Low Free T4 ({latest_value} ng/dL) with declining trend indicates hypothyroidism.',
      severity: 'medium',
      base_confidence: 0.8
    }
  }
];

// ============================================================================
// HORMONAL MARKERS
// ============================================================================

const HORMONAL_RULES: RecommendationRule[] = [
  {
    marker_name: 'Testosterone',
    recommendation_type: 'hormonal',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 300 }
    },
    recommendation: {
      title: 'Testosterone Declining',
      text_template: 'Your testosterone has decreased to {latest_value} ng/dL, which may affect various health aspects.',
      rationale_template: 'Declining testosterone ({latest_value} ng/dL) below optimal levels may impact energy, muscle mass, and libido.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'Free Testosterone',
    recommendation_type: 'hormonal',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 9 }
    },
    recommendation: {
      title: 'Free Testosterone Low',
      text_template: 'Your free testosterone is low at {latest_value} ng/dL, which may indicate hormonal imbalance.',
      rationale_template: 'Low free testosterone ({latest_value} ng/dL) with worsening trend may affect hormonal health.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'SHBG',
    recommendation_type: 'hormonal',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 80 }
    },
    recommendation: {
      title: 'SHBG Levels High',
      text_template: 'Your SHBG has increased to {latest_value} nmol/L, which may affect hormone availability.',
      rationale_template: 'Elevated SHBG ({latest_value} nmol/L) may reduce free hormone availability.',
      severity: 'low',
      base_confidence: 0.6
    }
  },
  {
    marker_name: 'Estradiol',
    recommendation_type: 'hormonal',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 80 }
    },
    recommendation: {
      title: 'Estradiol Elevated',
      text_template: 'Your estradiol has increased to {latest_value} pg/mL, which may indicate hormonal imbalance.',
      rationale_template: 'Elevated estradiol ({latest_value} pg/mL) with worsening trend may affect hormonal balance.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'Cortisol',
    recommendation_type: 'hormonal',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 20 }
    },
    recommendation: {
      title: 'Cortisol Elevated',
      text_template: 'Your cortisol has increased to {latest_value} µg/dL, suggesting elevated stress response.',
      rationale_template: 'Elevated cortisol ({latest_value} µg/dL) with worsening trend indicates chronic stress or HPA axis dysfunction.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'DHEA-S',
    recommendation_type: 'hormonal',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 100 }
    },
    recommendation: {
      title: 'DHEA-S Declining',
      text_template: 'Your DHEA-S has decreased to {latest_value} µg/dL, which may indicate adrenal stress.',
      rationale_template: 'Low DHEA-S ({latest_value} µg/dL) with declining trend may indicate adrenal insufficiency.',
      severity: 'low',
      base_confidence: 0.6
    }
  }
];

// ============================================================================
// VITAMIN / NUTRIENT MARKERS
// ============================================================================

const NUTRIENT_RULES: RecommendationRule[] = [
  {
    marker_name: 'Vitamin D',
    recommendation_type: 'nutritional',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 30 }
    },
    recommendation: {
      title: 'Vitamin D Deficiency',
      text_template: 'Your Vitamin D has decreased to {latest_value} ng/mL, indicating deficiency.',
      rationale_template: 'Low Vitamin D ({latest_value} ng/mL) with declining trend may affect bone health, immunity, and mood.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'Vitamin B12',
    recommendation_type: 'nutritional',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 400 }
    },
    recommendation: {
      title: 'Vitamin B12 Low',
      text_template: 'Your Vitamin B12 has decreased to {latest_value} pg/mL, which may affect energy and cognition.',
      rationale_template: 'Low B12 ({latest_value} pg/mL) with declining trend may cause fatigue, neuropathy, and cognitive issues.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'Ferritin',
    recommendation_type: 'nutritional',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 30 }
    },
    recommendation: {
      title: 'Iron Stores Depleted',
      text_template: 'Your ferritin has decreased to {latest_value} ng/mL, indicating low iron stores.',
      rationale_template: 'Low ferritin ({latest_value} ng/mL) with declining trend indicates iron depletion and risk of anemia.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'Magnesium',
    recommendation_type: 'nutritional',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 1.8 }
    },
    recommendation: {
      title: 'Magnesium Low',
      text_template: 'Your magnesium has decreased to {latest_value} mg/dL, which may affect multiple body systems.',
      rationale_template: 'Low magnesium ({latest_value} mg/dL) may affect muscle function, heart rhythm, and metabolic health.',
      severity: 'low',
      base_confidence: 0.6
    }
  }
];

// ============================================================================
// EXPORT ALL RULES
// ============================================================================

/**
 * Prostate Health Rules
 * Markers: PSA, Free PSA, PSA Ratio
 */
const PROSTATE_RULES: RecommendationRule[] = [
  {
    marker_name: 'PSA',
    recommendation_type: 'prostate',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 4.0 }
    },
    recommendation: {
      title: 'PSA Elevated',
      text_template: 'Your PSA has increased to {latest_value} ng/mL, which is above the normal reference range.',
      rationale_template: 'Elevated PSA ({latest_value} ng/mL) with worsening trend may indicate prostate issues requiring medical evaluation.',
      severity: 'medium',
      base_confidence: 0.75
    }
  },
  {
    marker_name: 'PSA',
    recommendation_type: 'prostate',
    conditions: {
      trend_direction: 'stable',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 10.0 }
    },
    recommendation: {
      title: 'PSA Significantly Elevated',
      text_template: 'Your PSA is {latest_value} ng/mL, which is significantly elevated. Medical evaluation is recommended.',
      rationale_template: 'PSA level of {latest_value} ng/mL is well above normal range and requires immediate medical attention.',
      severity: 'high',
      base_confidence: 0.85
    }
  },
  {
    marker_name: 'Free PSA',
    recommendation_type: 'prostate',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 0.18 }
    },
    recommendation: {
      title: 'Free PSA Ratio Low',
      text_template: 'Your Free PSA ratio is {latest_value}, which is below the optimal threshold.',
      rationale_template: 'Low Free PSA ratio ({latest_value}) with worsening trend may increase risk of prostate issues.',
      severity: 'medium',
      base_confidence: 0.7
    }
  }
];

// ============================================================================

/**
 * Complete rule library V2 - 30+ markers across 9 categories
 */
export const RECOMMENDATION_RULES_V2: RecommendationRule[] = [
  ...CARDIOVASCULAR_RULES,
  ...METABOLIC_RULES,
  ...LIVER_RULES,
  ...KIDNEY_RULES,
  ...HEMATOLOGY_RULES,
  ...THYROID_RULES,
  ...HORMONAL_RULES,
  ...NUTRIENT_RULES,
  ...PROSTATE_RULES
];

/**
 * Get rules by category for targeted evaluation
 */
export function getRulesByCategory(category: string): RecommendationRule[] {
  return RECOMMENDATION_RULES_V2.filter(rule => rule.recommendation_type === category);
}

/**
 * Get all unique marker names covered by rules
 */
export function getCoveredMarkers(): string[] {
  return [...new Set(RECOMMENDATION_RULES_V2.map(rule => rule.marker_name))];
}

/**
 * Get rule count by category
 */
export function getRuleCoverage(): Record<string, number> {
  const coverage: Record<string, number> = {};
  RECOMMENDATION_RULES_V2.forEach(rule => {
    coverage[rule.recommendation_type] = (coverage[rule.recommendation_type] || 0) + 1;
  });
  return coverage;
}
