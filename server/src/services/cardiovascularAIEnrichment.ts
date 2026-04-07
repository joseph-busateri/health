import { getOpenAIClient } from './openAIService';
import { logger } from '../utils/logger';
import type { CardiovascularEvidence, CardiovascularRecommendation } from '../types/cardiovascularEngine';

interface CardiovascularAIOutput {
  priority?: 'critical' | 'important' | 'optimization';
  summary?: string;
  actions?: string[];
  rationale?: string;
}

function buildCardiovascularPrompt(evidence: CardiovascularEvidence): string {
  const { cardiovascularStatus, signals, summary } = evidence;

  const signalsText = signals
    .map(signal => `- ${signal.name}: ${signal.value} (${signal.interpretation})`)
    .join('\n');

  return `You are a cardiovascular health expert analyzing a patient's cardiovascular status and readiness.

Cardiovascular Status: ${cardiovascularStatus}
Evidence Summary: ${summary}

Cardiovascular Signals:
${signalsText}

Based on this cardiovascular evidence, provide:
1. A clear, actionable summary of the cardiovascular situation
2. Specific actions the person should take (training modifications, recovery behaviors, hydration, activity guidance, sleep/stress/nutrition reinforcement)
3. A brief rationale explaining why these actions matter for cardiovascular health

IMPORTANT GUIDELINES:
- Focus on safe, practical, health-supportive guidance
- DO NOT diagnose medical conditions
- For high-risk scenarios, suggest medical follow-up but avoid alarmist language
- Integrate training, recovery, and daily health context
- Stay aligned with the broader health optimization system
- Provide evidence-based, actionable recommendations

Respond in JSON format:
{
  "priority": "critical" | "important" | "optimization",
  "summary": "Clear summary of cardiovascular status and what it means",
  "actions": ["Specific action 1", "Specific action 2", "Specific action 3"],
  "rationale": "Why these actions are important for cardiovascular health"
}

Focus on practical, evidence-based cardiovascular interventions.`;
}

export async function enrichCardiovascularRecommendation(
  evidence: CardiovascularEvidence,
  fallbackRecommendation: CardiovascularRecommendation,
): Promise<CardiovascularRecommendation> {
  try {
    logger.info('🤖 [CARDIOVASCULAR AI] Starting AI enrichment');

    const client = getOpenAIClient();
    const prompt = buildCardiovascularPrompt(evidence);

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a cardiovascular health expert providing evidence-based, safe recommendations. Never diagnose conditions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      logger.warn('⚠️ [CARDIOVASCULAR AI] No content in AI response, using fallback');
      return { ...fallbackRecommendation, source: 'fallback' };
    }

    const aiOutput: CardiovascularAIOutput = JSON.parse(content);

    const enrichedRecommendation: CardiovascularRecommendation = {
      type: 'cardiovascular',
      priority: aiOutput.priority || fallbackRecommendation.priority,
      summary: aiOutput.summary || fallbackRecommendation.summary,
      actions: aiOutput.actions && aiOutput.actions.length > 0 
        ? aiOutput.actions 
        : fallbackRecommendation.actions,
      rationale: aiOutput.rationale,
      source: 'ai_enriched',
    };

    logger.info('✅ [CARDIOVASCULAR AI] AI enrichment successful', {
      priority: enrichedRecommendation.priority,
      actionCount: enrichedRecommendation.actions.length,
    });

    return enrichedRecommendation;
  } catch (error) {
    logger.error('❌ [CARDIOVASCULAR AI] AI enrichment failed, using fallback', {
      error: (error as Error).message,
    });
    return { ...fallbackRecommendation, source: 'fallback' };
  }
}
