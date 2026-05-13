/**
 * Medical Safety Validator
 * 
 * CRITICAL SAFETY LAYER for AI-generated health recommendations
 * 
 * Purpose:
 * - Prevent unsafe medical recommendations from reaching users
 * - Detect contraindications, medication interactions, and red flag symptoms
 * - Ensure all recommendations defer to medical professionals appropriately
 * - Flag recommendations requiring clinical review
 * 
 * This is a PRODUCTION SAFETY CRITICAL component.
 * Changes must be reviewed by medical/clinical staff.
 */

import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface MedicalSafetyCheck {
  safe: boolean;
  reasons: string[];
  requiresClinicalReview: boolean;
  blockedContent?: string[];
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface UserMedicalContext {
  userId: string;
  medications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
  }>;
  conditions?: string[];
  allergies?: string[];
  age?: number;
  gender?: string;
  pregnancyStatus?: 'pregnant' | 'trying' | 'not_pregnant' | 'unknown';
}

export interface RecommendationContent {
  title: string;
  description: string;
  rationale?: string;
  actionItems?: string[];
  category?: string;
  priority?: string;
}

// ============================================================================
// BLOCKED CONTENT PATTERNS
// ============================================================================

/**
 * Phrases that indicate medical advice (NEVER allowed)
 */
const MEDICAL_ADVICE_PATTERNS = [
  /you should (take|start|stop|increase|decrease|reduce).*(medication|drug|pill|prescription)/i,
  /stop taking.*(medication|drug|pill|prescription)/i,
  /increase.*(dose|dosage|amount).*(medication|drug)/i,
  /decrease.*(dose|dosage|amount).*(medication|drug)/i,
  /switch to.*(medication|drug|different medication)/i,
  /this will cure/i,
  /this will treat your/i,
  /you need.*(medication|prescription|drug)/i,
  /ask your doctor (to prescribe|for a prescription|about medication)/i,
];

/**
 * Phrases that indicate diagnosis (NEVER allowed)
 */
const DIAGNOSIS_PATTERNS = [
  /you (have|are diagnosed with|suffer from|are experiencing)/i,
  /this (is|indicates|suggests|means you have).*(disease|condition|disorder|syndrome)/i,
  /you are (diabetic|hypertensive|pre-diabetic)/i,
  /this means you have/i,
  /you likely have/i,
  /you probably have/i,
  /diagnosis of/i,
  /diagnosed with/i,
];

/**
 * Phrases that contradict physician orders (NEVER allowed)
 */
const PHYSICIAN_CONTRADICTION_PATTERNS = [
  /ignore (your doctor|physician|healthcare provider)/i,
  /don't listen to/i,
  /your doctor is wrong/i,
  /instead of what your doctor said/i,
  /contrary to medical advice/i,
];

/**
 * Red flag symptoms that MUST trigger medical referral
 */
const RED_FLAG_SYMPTOMS = [
  'chest pain',
  'severe headache',
  'sudden vision changes',
  'difficulty breathing',
  'shortness of breath',
  'severe abdominal pain',
  'unexplained bleeding',
  'loss of consciousness',
  'severe allergic reaction',
  'stroke symptoms',
  'heart attack',
  'seizure',
  'severe dizziness',
  'fainting',
  'confusion',
  'slurred speech',
  'numbness',
  'paralysis',
];

/**
 * Medications that require special caution
 */
const HIGH_RISK_MEDICATIONS = [
  'warfarin',
  'coumadin',
  'insulin',
  'metformin',
  'lithium',
  'digoxin',
  'phenytoin',
  'carbamazepine',
  'theophylline',
  'levothyroxine',
];

/**
 * Supplement-medication interactions (common ones)
 */
const SUPPLEMENT_MEDICATION_INTERACTIONS: Record<string, string[]> = {
  'st john\'s wort': ['antidepressants', 'birth control', 'blood thinners', 'warfarin'],
  'ginkgo biloba': ['blood thinners', 'warfarin', 'aspirin', 'nsaids'],
  'garlic supplements': ['blood thinners', 'warfarin', 'aspirin'],
  'vitamin k': ['warfarin', 'coumadin', 'blood thinners'],
  'calcium': ['antibiotics', 'thyroid medication', 'levothyroxine'],
  'iron': ['antibiotics', 'thyroid medication', 'levothyroxine'],
  'magnesium': ['antibiotics', 'blood pressure medication'],
  'fish oil': ['blood thinners', 'warfarin', 'aspirin'],
};

// ============================================================================
// VALIDATION METRICS
// ============================================================================

interface ValidationMetrics {
  totalChecks: number;
  unsafeBlocked: number;
  clinicalReviewFlagged: number;
  byRiskLevel: Record<string, number>;
  byReason: Record<string, number>;
}

const metrics: ValidationMetrics = {
  totalChecks: 0,
  unsafeBlocked: 0,
  clinicalReviewFlagged: 0,
  byRiskLevel: {},
  byReason: {},
};

export function getMedicalSafetyMetrics(): ValidationMetrics {
  return { ...metrics };
}

export function resetMedicalSafetyMetrics(): void {
  metrics.totalChecks = 0;
  metrics.unsafeBlocked = 0;
  metrics.clinicalReviewFlagged = 0;
  metrics.byRiskLevel = {};
  metrics.byReason = {};
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate medical safety of AI-generated recommendation
 * 
 * CRITICAL: This function MUST be called before returning any AI-generated
 * health recommendation to a user.
 * 
 * @param recommendation - The AI-generated recommendation content
 * @param userContext - User's medical context (medications, conditions, etc.)
 * @returns Safety check result with detailed reasons
 */
export async function validateMedicalSafety(
  recommendation: RecommendationContent,
  userContext: UserMedicalContext
): Promise<MedicalSafetyCheck> {
  metrics.totalChecks++;
  
  const issues: string[] = [];
  const blockedContent: string[] = [];
  let riskLevel: MedicalSafetyCheck['riskLevel'] = 'none';
  
  logger.info('[MEDICAL SAFETY] Starting validation', {
    userId: userContext.userId,
    category: recommendation.category,
    priority: recommendation.priority,
  });
  
  // Combine all text for analysis
  const fullText = [
    recommendation.title,
    recommendation.description,
    recommendation.rationale || '',
    ...(recommendation.actionItems || []),
  ].join(' ');
  
  // Rule 1: Check for medical advice
  const medicalAdviceCheck = checkForMedicalAdvice(fullText);
  if (medicalAdviceCheck.detected) {
    issues.push('Contains medical advice (medication recommendations)');
    blockedContent.push(...medicalAdviceCheck.matches);
    riskLevel = 'critical';
  }
  
  // Rule 2: Check for diagnosis language
  const diagnosisCheck = checkForDiagnosis(fullText);
  if (diagnosisCheck.detected) {
    issues.push('Contains diagnosis language');
    blockedContent.push(...diagnosisCheck.matches);
    riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
  }
  
  // Rule 3: Check for physician contradictions
  const contradictionCheck = checkForPhysicianContradiction(fullText);
  if (contradictionCheck.detected) {
    issues.push('Contradicts physician orders or medical advice');
    blockedContent.push(...contradictionCheck.matches);
    riskLevel = 'critical';
  }
  
  // Rule 4: Check for red flag symptoms without medical referral
  const redFlagCheck = checkForRedFlagSymptoms(fullText, recommendation);
  if (redFlagCheck.detected) {
    issues.push('Contains red flag symptoms without medical referral');
    blockedContent.push(...redFlagCheck.matches);
    riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
  }
  
  // Rule 5: Check for contraindications
  const contraindicationCheck = await checkContraindications(
    recommendation,
    userContext
  );
  if (contraindicationCheck.detected) {
    issues.push(...contraindicationCheck.issues);
    riskLevel = riskLevel === 'critical' ? 'critical' : 'medium';
  }
  
  // Rule 6: Check for supplement-medication interactions
  const interactionCheck = checkSupplementMedicationInteractions(
    recommendation,
    userContext
  );
  if (interactionCheck.detected) {
    issues.push(...interactionCheck.issues);
    riskLevel = riskLevel === 'critical' ? 'critical' : 'medium';
  }
  
  // Rule 7: Check for pregnancy-related risks
  const pregnancyCheck = checkPregnancyRisks(recommendation, userContext);
  if (pregnancyCheck.detected) {
    issues.push(...pregnancyCheck.issues);
    riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
  }
  
  // Determine if clinical review is required
  const requiresClinicalReview = 
    issues.length > 0 ||
    recommendation.priority === 'critical' ||
    recommendation.category === 'medical_consultation' ||
    riskLevel !== 'none';
  
  // Update metrics
  if (issues.length > 0) {
    metrics.unsafeBlocked++;
  }
  if (requiresClinicalReview) {
    metrics.clinicalReviewFlagged++;
  }
  metrics.byRiskLevel[riskLevel] = (metrics.byRiskLevel[riskLevel] || 0) + 1;
  issues.forEach(issue => {
    metrics.byReason[issue] = (metrics.byReason[issue] || 0) + 1;
  });
  
  const result: MedicalSafetyCheck = {
    safe: issues.length === 0,
    reasons: issues,
    requiresClinicalReview,
    blockedContent: blockedContent.length > 0 ? blockedContent : undefined,
    riskLevel,
  };
  
  if (!result.safe) {
    logger.error('[MEDICAL SAFETY] UNSAFE RECOMMENDATION BLOCKED', {
      userId: userContext.userId,
      reasons: issues,
      riskLevel,
      blockedContent,
    });
  } else if (requiresClinicalReview) {
    logger.warn('[MEDICAL SAFETY] Clinical review required', {
      userId: userContext.userId,
      riskLevel,
    });
  } else {
    logger.info('[MEDICAL SAFETY] Validation passed', {
      userId: userContext.userId,
      riskLevel,
    });
  }
  
  return result;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

function checkForMedicalAdvice(text: string): { detected: boolean; matches: string[] } {
  const matches: string[] = [];
  
  for (const pattern of MEDICAL_ADVICE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      matches.push(match[0]);
    }
  }
  
  return {
    detected: matches.length > 0,
    matches,
  };
}

function checkForDiagnosis(text: string): { detected: boolean; matches: string[] } {
  const matches: string[] = [];
  
  for (const pattern of DIAGNOSIS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      matches.push(match[0]);
    }
  }
  
  return {
    detected: matches.length > 0,
    matches,
  };
}

function checkForPhysicianContradiction(text: string): { detected: boolean; matches: string[] } {
  const matches: string[] = [];
  
  for (const pattern of PHYSICIAN_CONTRADICTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      matches.push(match[0]);
    }
  }
  
  return {
    detected: matches.length > 0,
    matches,
  };
}

function checkForRedFlagSymptoms(
  text: string,
  recommendation: RecommendationContent
): { detected: boolean; matches: string[] } {
  const textLower = text.toLowerCase();
  const matches: string[] = [];
  
  for (const symptom of RED_FLAG_SYMPTOMS) {
    if (textLower.includes(symptom.toLowerCase())) {
      matches.push(symptom);
    }
  }
  
  // If red flag symptoms are mentioned, check if medical referral is included
  if (matches.length > 0) {
    const hasMedicalReferral = 
      textLower.includes('consult') ||
      textLower.includes('see a doctor') ||
      textLower.includes('seek medical') ||
      textLower.includes('emergency') ||
      textLower.includes('911') ||
      recommendation.category === 'medical_consultation';
    
    if (!hasMedicalReferral) {
      return { detected: true, matches };
    }
  }
  
  return { detected: false, matches: [] };
}

async function checkContraindications(
  recommendation: RecommendationContent,
  userContext: UserMedicalContext
): Promise<{ detected: boolean; issues: string[] }> {
  const issues: string[] = [];
  
  // Check if recommendation involves supplements and user is on high-risk medications
  if (recommendation.category === 'supplement' || recommendation.category === 'supplement_adjustment') {
    const userMeds = (userContext.medications || []).map(m => m.name.toLowerCase());
    const hasHighRiskMed = userMeds.some(med => 
      HIGH_RISK_MEDICATIONS.some(hrm => med.includes(hrm.toLowerCase()))
    );
    
    if (hasHighRiskMed) {
      issues.push('User is on high-risk medication - supplement changes require medical consultation');
    }
  }
  
  // Check for condition-specific contraindications
  const conditions = (userContext.conditions || []).map(c => c.toLowerCase());
  
  if (conditions.includes('diabetes') || conditions.includes('type 2 diabetes')) {
    if (recommendation.category === 'nutrition_change' && 
        (recommendation.description.toLowerCase().includes('fasting') ||
         recommendation.description.toLowerCase().includes('very low calorie'))) {
      issues.push('Fasting or very low calorie diet may be contraindicated for diabetes - requires medical supervision');
    }
  }
  
  if (conditions.includes('hypertension') || conditions.includes('high blood pressure')) {
    if (recommendation.description.toLowerCase().includes('high intensity') ||
        recommendation.description.toLowerCase().includes('maximum effort')) {
      issues.push('High intensity exercise may require medical clearance for hypertension');
    }
  }
  
  return {
    detected: issues.length > 0,
    issues,
  };
}

function checkSupplementMedicationInteractions(
  recommendation: RecommendationContent,
  userContext: UserMedicalContext
): { detected: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (recommendation.category !== 'supplement' && recommendation.category !== 'supplement_adjustment') {
    return { detected: false, issues: [] };
  }
  
  const userMeds = (userContext.medications || []).map(m => m.name.toLowerCase());
  const recText = (recommendation.title + ' ' + recommendation.description).toLowerCase();
  
  // Check for known interactions
  for (const [supplement, interactingMeds] of Object.entries(SUPPLEMENT_MEDICATION_INTERACTIONS)) {
    if (recText.includes(supplement)) {
      for (const med of interactingMeds) {
        if (userMeds.some(userMed => userMed.includes(med.toLowerCase()))) {
          issues.push(`Potential interaction between ${supplement} and ${med} - requires medical consultation`);
        }
      }
    }
  }
  
  return {
    detected: issues.length > 0,
    issues,
  };
}

function checkPregnancyRisks(
  recommendation: RecommendationContent,
  userContext: UserMedicalContext
): { detected: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (userContext.pregnancyStatus !== 'pregnant' && userContext.pregnancyStatus !== 'trying') {
    return { detected: false, issues: [] };
  }
  
  const recText = (recommendation.title + ' ' + recommendation.description).toLowerCase();
  
  // Supplements to avoid during pregnancy
  const pregnancyAvoidSupplements = [
    'vitamin a',
    'retinol',
    'high dose vitamin a',
    'dong quai',
    'black cohosh',
    'saw palmetto',
  ];
  
  for (const supplement of pregnancyAvoidSupplements) {
    if (recText.includes(supplement)) {
      issues.push(`${supplement} may not be safe during pregnancy - requires medical consultation`);
    }
  }
  
  // Exercise restrictions during pregnancy
  if (recommendation.category === 'workout_modification') {
    if (recText.includes('high intensity') || 
        recText.includes('maximum effort') ||
        recText.includes('heavy lifting')) {
      issues.push('High intensity exercise during pregnancy requires medical clearance');
    }
  }
  
  return {
    detected: issues.length > 0,
    issues,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get safe fallback recommendation when original is unsafe
 */
export function getSafeFallbackRecommendation(
  originalRecommendation: RecommendationContent,
  safetyCheck: MedicalSafetyCheck
): RecommendationContent {
  return {
    title: 'Consult Healthcare Provider',
    description: 'Based on your health data, we recommend consulting with your healthcare provider for personalized medical advice.',
    rationale: 'Your health metrics suggest professional medical consultation would be beneficial. A healthcare provider can review your complete medical history and provide appropriate recommendations.',
    actionItems: [
      'Schedule an appointment with your healthcare provider',
      'Bring your recent health data and metrics',
      'Discuss your health goals and concerns',
      'Ask about personalized recommendations for your situation',
    ],
    category: 'medical_consultation',
    priority: 'high',
  };
}

/**
 * Check if recommendation requires medical disclaimer
 */
export function requiresMedicalDisclaimer(recommendation: RecommendationContent): boolean {
  const categories = [
    'supplement',
    'supplement_adjustment',
    'nutrition_change',
    'workout_modification',
    'medical_consultation',
  ];
  
  return categories.includes(recommendation.category || '');
}

/**
 * Get appropriate medical disclaimer
 */
export function getMedicalDisclaimer(recommendation: RecommendationContent): string {
  if (recommendation.category === 'medical_consultation') {
    return 'This recommendation is based on your health data. Always consult with a qualified healthcare provider before making any medical decisions.';
  }
  
  if (recommendation.category === 'supplement' || recommendation.category === 'supplement_adjustment') {
    return 'This is general health information. Consult a healthcare provider before starting, stopping, or changing any supplements, especially if you take medications or have medical conditions.';
  }
  
  return 'This is general health information based on your data. Consult a healthcare provider for personalized medical advice.';
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  validateMedicalSafety,
  getMedicalSafetyMetrics,
  resetMedicalSafetyMetrics,
  getSafeFallbackRecommendation,
  requiresMedicalDisclaimer,
  getMedicalDisclaimer,
};
