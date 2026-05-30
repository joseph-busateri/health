import { getOpenAIClient } from './openAIService';
import { logger } from '../utils/logger';
import type { SexualHealthEvidence, SexualHealthRecommendation } from '../types/sexualHealthEngine';

interface SexualHealthAIOutput {
  priority?: 'critical' | 'important' | 'optimization';
  summary?: string;
  actions?: string[];
  rationale?: string;
}

function buildSexualHealthPrompt(evidence: SexualHealthEvidence): string {
  const { sexualHealthStatus, signals, summary } = evidence;

  const signalsText = signals
    .map(signal => `- ${signal.name}: ${signal.value} (${signal.interpretation})`)
    .join('\n');

  return `You are a sexual health and hormonal optimization expert analyzing a patient's sexual health readiness.

Sexual Health Status: ${sexualHealthStatus}
Evidence Summary: ${summary}

Sexual Health Signals:
${signalsText}

Based on this sexual health evidence, provide:
1. A clear, actionable summary of the sexual health situation
2. Specific actions the person should take (recovery optimization, stress management, sleep improvement, training modifications, lifestyle adjustments)
3. A brief rationale explaining why these actions matter for sexual health optimization

IMPORTANT GUIDELINES:
- Focus on safe, practical, health-supportive guidance
- Emphasize recovery, stress management, sleep, and hormonal health
- DO NOT diagnose medical conditions
- For high-risk scenarios, suggest medical consultation but avoid alarmist language
- Integrate recovery, stress, metabolic, and cardiovascular context
- Stay aligned with the broader health optimization system
- Provide evidence-based, actionable recommendations
- Be professional and clinical in tone

Respond in JSON format:
{
  "priority": "critical" | "important" | "optimization",
  "summary": "Clear summary of sexual health status and what it means",
  "actions": ["Specific action 1", "Specific action 2", "Specific action 3"],
  "rationale": "Why these actions are important for sexual health optimization"
}

Focus on practical, evidence-based sexual health interventions.`;
}

export async function enrichSexualHealthRecommendation(
  evidence: SexualHealthEvidence,
  fallbackRecommendation: SexualHealthRecommendation,
): Promise<SexualHealthRecommendation> {
  try {
    logger.info('🤖 [SEXUAL HEALTH AI] Starting AI enrichment');

    const client = getOpenAIClient();
    const prompt = buildSexualHealthPrompt(evidence);

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a sexual health and hormonal optimization expert providing evidence-based, safe recommendations. Never diagnose conditions. Be professional and clinical.',
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
      logger.warn('⚠️ [SEXUAL HEALTH AI] No content in AI response, using fallback');
      return { ...fallbackRecommendation, source: 'fallback' };
    }

    const aiOutput: SexualHealthAIOutput = JSON.parse(content);

    const enrichedRecommendation: SexualHealthRecommendation = {
      type: 'sexual_health',
      priority: aiOutput.priority || fallbackRecommendation.priority,
      summary: aiOutput.summary || fallbackRecommendation.summary,
      actions: aiOutput.actions && aiOutput.actions.length > 0 
        ? aiOutput.actions 
        : fallbackRecommendation.actions,
      rationale: aiOutput.rationale,
      source: 'ai_enriched',
    };

    logger.info('✅ [SEXUAL HEALTH AI] AI enrichment successful', {
      priority: enrichedRecommendation.priority,
      actionCount: enrichedRecommendation.actions.length,
    });

    return enrichedRecommendation;
  } catch (error) {
    logger.error('❌ [SEXUAL HEALTH AI] AI enrichment failed, using fallback', {
      error: (error as Error).message,
    });
    return { ...fallbackRecommendation, source: 'fallback' };
  }
}
