/**
 * Actuarial Risk AI Enrichment Service
 * Enhances actuarial risk recommendations with AI-powered personalized insights
 * 
 * Uses GPT-4 to provide:
 * - Personalized risk interpretation
 * - Specific, actionable recommendations
 * - Prevention strategies tailored to individual risk profile
 * - Natural language explanations of risk factors
 */

import { getOpenAIClient } from './openAIService';
import { logger } from '../utils/logger';
import type {
  ActuarialEvidence,
  ActuarialRecommendation,
  ActuarialRiskCategory,
} from '../types/actuarialRiskEngine';

// ============================================================================
// AI OUTPUT INTERFACE
// ============================================================================

interface ActuarialAIOutput {
  priority?: 'critical' | 'important' | 'optimization';
  summary?: string;
  actions?: string[];
  rationale?: string;
  primaryRiskDrivers?: string[];
  preventionStrategies?: string[];
  riskReductionPotential?: number;
}

// ============================================================================
// PROMPT BUILDER
// ============================================================================

/**
 * Build AI prompt from actuarial evidence
 */
function buildActuarialPrompt(evidence: ActuarialEvidence): string {
  const {
    framinghamResult,
    ascvdResult,
    combinedRiskPercentage,
    combinedRiskCategory,
    riskFactors,
    lifestyleAdjustment,
    fitnessAdjustment,
    signals,
    summary,
  } = evidence;

  // Build risk factors text
  const riskFactorsText = riskFactors
    .slice(0, 5)
    .map(rf => `- ${rf.factor}: ${rf.value} (${rf.interpretation}) - Contribution: ${rf.contribution.toFixed(0)}%`)
    .join('\n');

  // Build signals text
  const signalsText = signals
    .map(signal => `- ${signal.name}: ${signal.value} (${signal.interpretation})`)
    .join('\n');

  // Build lifestyle context
  const lifestyleContext = lifestyleAdjustment !== 0
    ? `Lifestyle factors ${lifestyleAdjustment > 0 ? 'increase' : 'reduce'} risk by ${Math.abs(lifestyleAdjustment).toFixed(1)}%`
    : 'Lifestyle factors have neutral impact';

  const fitnessContext = fitnessAdjustment !== 0
    ? `Fitness level ${fitnessAdjustment > 0 ? 'increases' : 'reduces'} risk by ${Math.abs(fitnessAdjustment).toFixed(1)}%`
    : 'Fitness level has neutral impact';

  return `You are a cardiovascular risk expert and preventive cardiologist analyzing a patient's 10-year cardiovascular disease risk using validated actuarial models.

RISK ASSESSMENT RESULTS:
- Framingham Risk Score: ${framinghamResult?.riskPercentage.toFixed(1)}% (10-year CHD risk)
- ASCVD Risk Score: ${ascvdResult?.riskPercentage.toFixed(1)}% (10-year ASCVD risk)
- Combined Risk: ${combinedRiskPercentage.toFixed(1)}%
- Risk Category: ${combinedRiskCategory.replace('_', ' ').toUpperCase()}

RISK FACTOR ANALYSIS:
${riskFactorsText}

CLINICAL SIGNALS:
${signalsText}

LIFESTYLE IMPACT:
- ${lifestyleContext}
- ${fitnessContext}

SUMMARY:
${summary}

Based on this comprehensive cardiovascular risk assessment, provide personalized recommendations that:

1. **Explain the risk** in clear, patient-friendly language
2. **Identify primary risk drivers** that need immediate attention
3. **Provide specific, actionable steps** to reduce cardiovascular risk
4. **Outline prevention strategies** tailored to this individual's risk profile
5. **Estimate risk reduction potential** from implementing these recommendations

IMPORTANT GUIDELINES:
- Use evidence-based recommendations aligned with ACC/AHA guidelines
- For high/very high risk: emphasize medical consultation and aggressive risk factor management
- For moderate risk: focus on lifestyle optimization and risk factor control
- For low risk: emphasize maintenance and prevention
- DO NOT diagnose medical conditions
- DO NOT prescribe medications (suggest medical consultation instead)
- Focus on modifiable risk factors (BP, cholesterol, diabetes, smoking, exercise, diet)
- Provide practical, achievable actions
- Be encouraging but realistic about risk reduction potential

Respond in JSON format:
{
  "priority": "critical" | "important" | "optimization",
  "summary": "Clear, patient-friendly explanation of cardiovascular risk and what it means",
  "actions": [
    "Specific action 1 with measurable target",
    "Specific action 2 with measurable target",
    "Specific action 3 with measurable target",
    "Additional actions as needed (5-8 total)"
  ],
  "rationale": "Evidence-based explanation of why these actions will reduce cardiovascular risk",
  "primaryRiskDrivers": [
    "Risk driver 1",
    "Risk driver 2",
    "Risk driver 3"
  ],
  "preventionStrategies": [
    "Prevention strategy 1",
    "Prevention strategy 2",
    "Prevention strategy 3"
  ],
  "riskReductionPotential": <number 0-100 representing estimated % risk reduction>
}

Focus on practical, evidence-based cardiovascular risk reduction strategies.`;
}

// ============================================================================
// AI ENRICHMENT FUNCTION
// ============================================================================

/**
 * Enrich actuarial recommendation with AI-powered insights
 */
export async function enrichActuarialRecommendation(
  evidence: ActuarialEvidence,
  fallbackRecommendation: ActuarialRecommendation,
): Promise<ActuarialRecommendation> {
  try {
    logger.info('🤖 [ACTUARIAL AI] Starting AI enrichment', {
      riskCategory: evidence.combinedRiskCategory,
      riskPercentage: evidence.combinedRiskPercentage.toFixed(1),
    });

    const client = getOpenAIClient();
    const prompt = buildActuarialPrompt(evidence);

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a cardiovascular risk expert and preventive cardiologist providing evidence-based, safe recommendations aligned with ACC/AHA guidelines. Never diagnose conditions or prescribe medications.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      logger.warn('⚠️ [ACTUARIAL AI] No content in AI response, using fallback');
      return { ...fallbackRecommendation, source: 'fallback' };
    }

    const aiOutput: ActuarialAIOutput = JSON.parse(content);

    // Validate AI output
    if (!aiOutput.summary || !aiOutput.actions || aiOutput.actions.length === 0) {
      logger.warn('⚠️ [ACTUARIAL AI] Invalid AI output structure, using fallback');
      return { ...fallbackRecommendation, source: 'fallback' };
    }

    // Build enriched recommendation
    const enrichedRecommendation: ActuarialRecommendation = {
      type: 'actuarial_risk',
      priority: aiOutput.priority || fallbackRecommendation.priority,
      summary: aiOutput.summary || fallbackRecommendation.summary,
      actions: aiOutput.actions && aiOutput.actions.length > 0
        ? aiOutput.actions
        : fallbackRecommendation.actions,
      rationale: aiOutput.rationale || fallbackRecommendation.rationale,
      riskReductionPotential: typeof aiOutput.riskReductionPotential === 'number'
        ? Math.max(0, Math.min(100, aiOutput.riskReductionPotential))
        : fallbackRecommendation.riskReductionPotential,
      primaryRiskDrivers: aiOutput.primaryRiskDrivers && aiOutput.primaryRiskDrivers.length > 0
        ? aiOutput.primaryRiskDrivers
        : fallbackRecommendation.primaryRiskDrivers,
      preventionStrategies: aiOutput.preventionStrategies && aiOutput.preventionStrategies.length > 0
        ? aiOutput.preventionStrategies
        : fallbackRecommendation.preventionStrategies,
      source: 'ai_enriched',
    };

    logger.info('✅ [ACTUARIAL AI] AI enrichment successful', {
      priority: enrichedRecommendation.priority,
      actionCount: enrichedRecommendation.actions.length,
      riskReductionPotential: enrichedRecommendation.riskReductionPotential,
    });

    return enrichedRecommendation;
  } catch (error) {
    logger.error('❌ [ACTUARIAL AI] AI enrichment failed, using fallback', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    return { ...fallbackRecommendation, source: 'fallback' };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get risk category description for prompts
 */
function getRiskCategoryDescription(category: ActuarialRiskCategory): string {
  switch (category) {
    case 'low_risk':
      return 'Low risk (<5% 10-year cardiovascular disease risk)';
    case 'moderate_risk':
      return 'Moderate risk (5-7.5% 10-year cardiovascular disease risk)';
    case 'high_risk':
      return 'High risk (7.5-20% 10-year cardiovascular disease risk)';
    case 'very_high_risk':
      return 'Very high risk (>20% 10-year cardiovascular disease risk)';
  }
}

/**
 * Validate AI output structure
 */
function validateAIOutput(output: ActuarialAIOutput): boolean {
  if (!output.summary || typeof output.summary !== 'string') return false;
  if (!Array.isArray(output.actions) || output.actions.length === 0) return false;
  if (output.priority && !['critical', 'important', 'optimization'].includes(output.priority)) return false;
  if (output.riskReductionPotential !== undefined) {
    if (typeof output.riskReductionPotential !== 'number') return false;
    if (output.riskReductionPotential < 0 || output.riskReductionPotential > 100) return false;
  }
  return true;
}
