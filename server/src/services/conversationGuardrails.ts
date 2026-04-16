/**
 * Conversation Guardrails
 * 
 * CRITICAL SAFETY LAYER for AI-powered conversations
 * 
 * Purpose:
 * - Prevent AI from providing medical advice in conversations
 * - Ensure conversations stay within appropriate scope (health data collection)
 * - Detect and block inappropriate responses
 * - Maintain professional, safe interactions
 * 
 * This is a PRODUCTION SAFETY CRITICAL component.
 * Changes must be reviewed by medical/clinical staff.
 */

import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface GuardrailCheck {
  safe: boolean;
  reasons: string[];
  suggestedResponse?: string;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  requiresHumanReview: boolean;
}

export interface ConversationContext {
  userMessage: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  userId: string;
  sessionType?: string;
}

export interface ConversationResponse {
  message: string;
  suggestions?: string[];
  actions?: any[];
}

// ============================================================================
// BLOCKED PATTERNS
// ============================================================================

/**
 * Phrases that indicate medical advice (NEVER allowed in conversations)
 */
const MEDICAL_ADVICE_PATTERNS = [
  /you should (take|start|stop|increase|decrease).*(medication|drug|pill)/i,
  /i (recommend|suggest|advise).*(medication|drug|prescription)/i,
  /take.*(mg|mcg|iu|units).*(daily|twice|three times)/i,
  /this will (cure|treat|fix|heal) your/i,
  /you need (medication|prescription|drug)/i,
  /stop taking your medication/i,
  /don't take your medication/i,
  /skip your medication/i,
];

/**
 * Phrases that indicate diagnosis (NEVER allowed)
 */
const DIAGNOSIS_PATTERNS = [
  /you (have|are diagnosed with|suffer from)/i,
  /this (is|indicates|means).*(disease|condition|disorder|syndrome)/i,
  /you are (diabetic|hypertensive|depressed|bipolar)/i,
  /based on (this|these symptoms), you have/i,
  /this means you have/i,
  /you definitely have/i,
  /you probably have/i,
];

/**
 * Phrases that interpret symptoms (NOT allowed without medical referral)
 */
const SYMPTOM_INTERPRETATION_PATTERNS = [
  /this symptom (is|indicates|suggests|means)/i,
  /these symptoms (are|indicate|suggest|mean)/i,
  /this is a sign of/i,
  /this could be.*(disease|condition|disorder)/i,
  /this might be.*(disease|condition|disorder)/i,
];

/**
 * Phrases that provide medical opinions (NOT allowed)
 */
const MEDICAL_OPINION_PATTERNS = [
  /in my medical opinion/i,
  /medically speaking/i,
  /from a medical perspective/i,
  /as a doctor would say/i,
  /the medical consensus is/i,
];

/**
 * Out of scope topics (NOT allowed)
 */
const OUT_OF_SCOPE_PATTERNS = [
  /let me tell you about.*(politics|religion|dating|relationships)/i,
  /i can help you with.*(legal|financial|investment)/i,
  /here's my opinion on.*(politics|religion)/i,
];

/**
 * Safe scope indicators (ALLOWED)
 */
const IN_SCOPE_PATTERNS = [
  /let's track your/i,
  /i can help you (log|record|track)/i,
  /would you like to (log|record|track)/i,
  /what (was|is) your.*(sleep|workout|meal|stress level)/i,
  /how (did|do) you feel/i,
  /let me help you understand your (data|metrics|trends)/i,
];

/**
 * Safe medical referral phrases (ALLOWED and ENCOURAGED)
 */
const SAFE_MEDICAL_REFERRAL_PATTERNS = [
  /consult (with )?(your )?(doctor|physician|healthcare provider)/i,
  /talk to (your )?(doctor|physician|healthcare provider)/i,
  /see (your )?(doctor|physician|healthcare provider)/i,
  /seek medical (attention|advice|help)/i,
  /this requires medical (attention|evaluation|consultation)/i,
  /i recommend consulting a healthcare professional/i,
];

// ============================================================================
// VALIDATION METRICS
// ============================================================================

interface GuardrailMetrics {
  totalChecks: number;
  unsafeBlocked: number;
  humanReviewFlagged: number;
  byRiskLevel: Record<string, number>;
  byReason: Record<string, number>;
}

const metrics: GuardrailMetrics = {
  totalChecks: 0,
  unsafeBlocked: 0,
  humanReviewFlagged: 0,
  byRiskLevel: {},
  byReason: {},
};

export function getGuardrailMetrics(): GuardrailMetrics {
  return { ...metrics };
}

export function resetGuardrailMetrics(): void {
  metrics.totalChecks = 0;
  metrics.unsafeBlocked = 0;
  metrics.humanReviewFlagged = 0;
  metrics.byRiskLevel = {};
  metrics.byReason = {};
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate conversation response safety
 * 
 * CRITICAL: This function MUST be called before returning any AI-generated
 * conversation response to a user.
 * 
 * @param response - The AI-generated response
 * @param context - Conversation context
 * @returns Guardrail check result with detailed reasons
 */
export async function validateConversationResponse(
  response: string,
  context: ConversationContext
): Promise<GuardrailCheck> {
  metrics.totalChecks++;
  
  const issues: string[] = [];
  let riskLevel: GuardrailCheck['riskLevel'] = 'none';
  
  logger.info('[CONVERSATION GUARDRAILS] Starting validation', {
    userId: context.userId,
    sessionType: context.sessionType,
    responseLength: response.length,
  });
  
  // Rule 1: Check for medical advice
  const medicalAdviceCheck = checkForMedicalAdvice(response);
  if (medicalAdviceCheck.detected) {
    issues.push('Contains medical advice');
    riskLevel = 'critical';
  }
  
  // Rule 2: Check for diagnosis
  const diagnosisCheck = checkForDiagnosis(response);
  if (diagnosisCheck.detected) {
    issues.push('Contains diagnosis');
    riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
  }
  
  // Rule 3: Check for symptom interpretation without medical referral
  const symptomCheck = checkForSymptomInterpretation(response);
  if (symptomCheck.detected) {
    issues.push('Interprets symptoms without medical referral');
    riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
  }
  
  // Rule 4: Check for medical opinions
  const opinionCheck = checkForMedicalOpinion(response);
  if (opinionCheck.detected) {
    issues.push('Provides medical opinion');
    riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
  }
  
  // Rule 5: Check if response is in scope
  const scopeCheck = checkScope(response);
  if (!scopeCheck.inScope) {
    issues.push('Response is out of scope');
    riskLevel = riskLevel === 'critical' ? 'critical' : 'medium';
  }
  
  // Rule 6: Check for inappropriate content
  const inappropriateCheck = checkForInappropriateContent(response);
  if (inappropriateCheck.detected) {
    issues.push('Contains inappropriate content');
    riskLevel = 'critical';
  }
  
  // Rule 7: Check conversation history for patterns
  const historyCheck = checkConversationHistory(context);
  if (historyCheck.detected) {
    issues.push(...historyCheck.issues);
    riskLevel = riskLevel === 'critical' ? 'critical' : 'medium';
  }
  
  // Determine if human review is required
  const requiresHumanReview = 
    issues.length > 0 ||
    riskLevel !== 'none';
  
  // Update metrics
  if (issues.length > 0) {
    metrics.unsafeBlocked++;
  }
  if (requiresHumanReview) {
    metrics.humanReviewFlagged++;
  }
  metrics.byRiskLevel[riskLevel] = (metrics.byRiskLevel[riskLevel] || 0) + 1;
  issues.forEach(issue => {
    metrics.byReason[issue] = (metrics.byReason[issue] || 0) + 1;
  });
  
  const result: GuardrailCheck = {
    safe: issues.length === 0,
    reasons: issues,
    suggestedResponse: issues.length > 0 ? getSafeResponse(context) : undefined,
    riskLevel,
    requiresHumanReview,
  };
  
  if (!result.safe) {
    logger.error('[CONVERSATION GUARDRAILS] UNSAFE RESPONSE BLOCKED', {
      userId: context.userId,
      reasons: issues,
      riskLevel,
      originalResponse: response.substring(0, 200),
    });
  } else {
    logger.info('[CONVERSATION GUARDRAILS] Validation passed', {
      userId: context.userId,
      riskLevel,
    });
  }
  
  return result;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

function checkForMedicalAdvice(response: string): { detected: boolean } {
  for (const pattern of MEDICAL_ADVICE_PATTERNS) {
    if (pattern.test(response)) {
      return { detected: true };
    }
  }
  return { detected: false };
}

function checkForDiagnosis(response: string): { detected: boolean } {
  for (const pattern of DIAGNOSIS_PATTERNS) {
    if (pattern.test(response)) {
      return { detected: true };
    }
  }
  return { detected: false };
}

function checkForSymptomInterpretation(response: string): { detected: boolean } {
  // Check if response interprets symptoms
  for (const pattern of SYMPTOM_INTERPRETATION_PATTERNS) {
    if (pattern.test(response)) {
      // Check if it includes medical referral
      const hasMedicalReferral = SAFE_MEDICAL_REFERRAL_PATTERNS.some(p => p.test(response));
      if (!hasMedicalReferral) {
        return { detected: true };
      }
    }
  }
  return { detected: false };
}

function checkForMedicalOpinion(response: string): { detected: boolean } {
  for (const pattern of MEDICAL_OPINION_PATTERNS) {
    if (pattern.test(response)) {
      return { detected: true };
    }
  }
  return { detected: false };
}

function checkScope(response: string): { inScope: boolean } {
  // Check if response is out of scope
  for (const pattern of OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(response)) {
      return { inScope: false };
    }
  }
  
  // If response is very short, consider it in scope (likely acknowledgment)
  if (response.length < 50) {
    return { inScope: true };
  }
  
  // Check if response contains in-scope indicators
  const hasInScopeIndicators = IN_SCOPE_PATTERNS.some(p => p.test(response));
  
  // Check if response is about health data tracking
  const healthDataKeywords = [
    'sleep', 'workout', 'exercise', 'meal', 'nutrition', 'stress',
    'recovery', 'hrv', 'heart rate', 'blood pressure', 'weight',
    'body composition', 'supplement', 'hydration', 'energy',
  ];
  
  const hasHealthDataKeywords = healthDataKeywords.some(keyword => 
    response.toLowerCase().includes(keyword)
  );
  
  return { inScope: hasInScopeIndicators || hasHealthDataKeywords };
}

function checkForInappropriateContent(response: string): { detected: boolean } {
  const inappropriateKeywords = [
    'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch',
    'stupid', 'idiot', 'moron', 'dumb',
  ];
  
  const responseLower = response.toLowerCase();
  
  for (const keyword of inappropriateKeywords) {
    if (responseLower.includes(keyword)) {
      return { detected: true };
    }
  }
  
  return { detected: false };
}

function checkConversationHistory(
  context: ConversationContext
): { detected: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!context.conversationHistory || context.conversationHistory.length === 0) {
    return { detected: false, issues: [] };
  }
  
  // Check for repeated medical questions
  const userMessages = context.conversationHistory
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase());
  
  const medicalQuestionKeywords = [
    'what does this mean',
    'do i have',
    'am i sick',
    'is this serious',
    'should i be worried',
    'what should i do',
  ];
  
  let medicalQuestionCount = 0;
  for (const message of userMessages) {
    if (medicalQuestionKeywords.some(keyword => message.includes(keyword))) {
      medicalQuestionCount++;
    }
  }
  
  if (medicalQuestionCount >= 3) {
    issues.push('User repeatedly asking medical questions - suggest medical consultation');
  }
  
  // Check for escalating concern
  const concernKeywords = ['worried', 'scared', 'concerned', 'afraid', 'anxious'];
  const recentUserMessages = userMessages.slice(-3);
  const concernCount = recentUserMessages.filter(msg =>
    concernKeywords.some(keyword => msg.includes(keyword))
  ).length;
  
  if (concernCount >= 2) {
    issues.push('User expressing escalating concern - suggest medical consultation');
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
 * Get safe fallback response when original is unsafe
 */
function getSafeResponse(context: ConversationContext): string {
  // Check if user is asking medical questions
  const userMessageLower = context.userMessage.toLowerCase();
  
  if (userMessageLower.includes('what does') || 
      userMessageLower.includes('what is') ||
      userMessageLower.includes('do i have')) {
    return "I'm here to help you track and understand your health data, but I can't provide medical diagnoses or advice. For questions about what your symptoms or test results mean, please consult with your healthcare provider. They can review your complete medical history and provide personalized guidance.";
  }
  
  if (userMessageLower.includes('should i') || 
      userMessageLower.includes('what should')) {
    return "I can help you track your health data and identify patterns, but I can't provide medical advice. For decisions about your health, medications, or treatments, please consult with your healthcare provider.";
  }
  
  if (userMessageLower.includes('worried') || 
      userMessageLower.includes('concerned') ||
      userMessageLower.includes('scared')) {
    return "I understand you're concerned about your health. While I can help you track your health data, I can't provide medical advice or reassurance. If you're worried about your health, please reach out to your healthcare provider. They can address your concerns and provide appropriate guidance.";
  }
  
  // Default safe response
  return "I'm here to help you track your health data and identify patterns. For medical questions, diagnoses, or treatment advice, please consult with your healthcare provider. Is there anything specific about your health data you'd like to track or review?";
}

/**
 * Get safe conversation prompts
 */
export function getSafeConversationPrompts(): string[] {
  return [
    "How did you sleep last night?",
    "Would you like to log today's workout?",
    "How are you feeling today?",
    "What did you eat for your last meal?",
    "How would you rate your stress level today?",
    "Would you like to review your recent health trends?",
    "Is there any health data you'd like to track?",
  ];
}

/**
 * Check if user message requires medical referral
 */
export function requiresMedicalReferral(userMessage: string): boolean {
  const medicalReferralKeywords = [
    'chest pain',
    'can\'t breathe',
    'difficulty breathing',
    'severe pain',
    'bleeding',
    'emergency',
    'heart attack',
    'stroke',
    'unconscious',
    'seizure',
  ];
  
  const messageLower = userMessage.toLowerCase();
  
  return medicalReferralKeywords.some(keyword => messageLower.includes(keyword));
}

/**
 * Get emergency response for critical symptoms
 */
export function getEmergencyResponse(): string {
  return "⚠️ If you're experiencing a medical emergency (chest pain, difficulty breathing, severe bleeding, etc.), please call 911 or go to the nearest emergency room immediately. I'm a health tracking assistant and cannot provide emergency medical care.";
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  validateConversationResponse,
  getGuardrailMetrics,
  resetGuardrailMetrics,
  getSafeConversationPrompts,
  requiresMedicalReferral,
  getEmergencyResponse,
};
