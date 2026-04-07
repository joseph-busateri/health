import { getOpenAIClient } from './openAIService';
import type { CrossEngineEvidence, CrossEngineRecommendation } from '../types/crossEngine';
import { logger } from '../utils/logger';

interface AICrossEngineOutput {
  priority?: string;
  summary?: string;
  rationale?: string;
  actions?: string[];
}

export interface CrossEngineAIEnrichmentResult {
  success: boolean;
  output?: AICrossEngineOutput;
  error?: string;
}

export async function enrichCrossEngineRecommendationWithAI(
  evidence: CrossEngineEvidence,
  fallback: CrossEngineRecommendation,
): Promise<CrossEngineAIEnrichmentResult> {
  try {
    const openai = getOpenAIClient();

    const prompt = buildCrossEnginePrompt(evidence, fallback);

    logger.info('Cross-Engine AI enrichment: calling OpenAI', {
      overallStatus: evidence.overallStatus,
      signalCount: evidence.signals.length,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a health optimization AI analyzing cross-engine signals from Recovery, Stress, and Joint health systems. Your role is to synthesize these signals into unified, actionable recommendations.

Output valid JSON only with this structure:
{
  "priority": "critical" | "important" | "optimization",
  "summary": "brief synthesis of cross-engine status",
  "rationale": "evidence-based explanation of why this recommendation matters",
  "actions": ["specific action 1", "specific action 2", ...]
}

Be concise, specific, and actionable. Consider interactions between systems (e.g., how stress affects recovery, how recovery affects joint health).`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      logger.warn('Cross-Engine AI enrichment: no content returned');
      return {
        success: false,
        error: 'No content returned from OpenAI',
      };
    }

    const output = JSON.parse(content) as AICrossEngineOutput;

    logger.info('Cross-Engine AI enrichment: success', {
      hasSummary: !!output.summary,
      hasRationale: !!output.rationale,
      actionCount: output.actions?.length ?? 0,
    });

    return {
      success: true,
      output,
    };
  } catch (error) {
    logger.error('Cross-Engine AI enrichment: error', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Fallback to mock enrichment
    return {
      success: true,
      output: {
        priority: fallback.priority,
        summary: fallback.summary,
        rationale: `Cross-engine analysis based on ${evidence.overallStatus} status.`,
        actions: fallback.actions,
      },
    };
  }
}

function buildCrossEnginePrompt(
  evidence: CrossEngineEvidence,
  fallback: CrossEngineRecommendation,
): string {
  const signalsText = evidence.signals
    .map(s => `- ${s.name}: ${s.value} → ${s.interpretation}`)
    .join('\n');

  return `Cross-Engine Health Analysis

Overall Status: ${evidence.overallStatus}

Signals:
${signalsText}

Summary: ${evidence.summary}

Fallback Recommendation:
Priority: ${fallback.priority}
Summary: ${fallback.summary}
Actions: ${fallback.actions.join('; ')}

Based on these cross-engine signals, provide a synthesized recommendation that considers the interactions between Recovery, Stress, and Joint health systems. Focus on how these systems influence each other and what the user should prioritize.`;
}
