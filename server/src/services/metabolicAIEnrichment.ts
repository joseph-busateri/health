import { getOpenAIClient } from './openAIService';
import { logger } from '../utils/logger';
import type { MetabolicEvidence, MetabolicRecommendation } from '../types/metabolicEngine';

interface MetabolicAIOutput {
  priority?: 'critical' | 'important' | 'optimization';
  summary?: string;
  actions?: string[];
  rationale?: string;
}

function buildMetabolicPrompt(evidence: MetabolicEvidence): string {
  const { metabolicStatus, signals, summary } = evidence;

  const signalsText = signals
    .map(signal => `- ${signal.name}: ${signal.value} (${signal.interpretation})`)
    .join('\n');

  return `You are a metabolic health expert analyzing a patient's metabolic status.

Metabolic Status: ${metabolicStatus}
Evidence Summary: ${summary}

Metabolic Signals:
${signalsText}

Based on this metabolic evidence, provide:
1. A clear, actionable summary of the metabolic situation
2. Specific actions the person should take (dietary changes, workout modifications, fasting suggestions, recovery optimization)
3. A brief rationale explaining why these actions matter

Respond in JSON format:
{
  "priority": "critical" | "important" | "optimization",
  "summary": "Clear summary of metabolic status and what it means",
  "actions": ["Specific action 1", "Specific action 2", "Specific action 3"],
  "rationale": "Why these actions are important for metabolic health"
}

Focus on practical, evidence-based metabolic interventions.`;
}

export async function enrichMetabolicRecommendation(
  evidence: MetabolicEvidence,
  fallbackRecommendation: MetabolicRecommendation,
): Promise<MetabolicRecommendation> {
  try {
    logger.info('🤖 [METABOLIC AI] Starting AI enrichment');

    const client = getOpenAIClient();
    const prompt = buildMetabolicPrompt(evidence);

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a metabolic health expert providing evidence-based recommendations.',
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
      logger.warn('⚠️ [METABOLIC AI] No content in AI response, using fallback');
      return { ...fallbackRecommendation, source: 'fallback' };
    }

    const aiOutput: MetabolicAIOutput = JSON.parse(content);

    const enrichedRecommendation: MetabolicRecommendation = {
      type: 'metabolic',
      priority: aiOutput.priority || fallbackRecommendation.priority,
      summary: aiOutput.summary || fallbackRecommendation.summary,
      actions: aiOutput.actions && aiOutput.actions.length > 0 
        ? aiOutput.actions 
        : fallbackRecommendation.actions,
      rationale: aiOutput.rationale,
      source: 'ai_enriched',
    };

    logger.info('✅ [METABOLIC AI] AI enrichment successful', {
      priority: enrichedRecommendation.priority,
      actionCount: enrichedRecommendation.actions.length,
    });

    return enrichedRecommendation;
  } catch (error) {
    logger.error('❌ [METABOLIC AI] AI enrichment failed, using fallback', {
      error: (error as Error).message,
    });
    return { ...fallbackRecommendation, source: 'fallback' };
  }
}
