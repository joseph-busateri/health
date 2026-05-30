import { getOpenAIClient } from './openAIService';
import { logger } from '../utils/logger';
import type { PrioritizedRecommendation } from '../types/recommendationPrioritization';

interface AIPrioritizationOutput {
  summary?: string;
  rationale?: string;
  actions?: string[];
}

export interface PrioritizationAIResult {
  success: boolean;
  output?: AIPrioritizationOutput;
  error?: string;
}

export async function enrichPrioritizationWithAI(
  topPriorities: PrioritizedRecommendation[],
  allRecommendations: PrioritizedRecommendation[],
): Promise<PrioritizationAIResult> {
  try {
    const openai = getOpenAIClient();

    const prompt = buildPrioritizationPrompt(topPriorities, allRecommendations);

    logger.info('🟢 Prioritization AI enrichment: calling OpenAI', {
      topCount: topPriorities.length,
      totalCount: allRecommendations.length,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a health optimization AI that synthesizes multiple recommendations into a unified daily priority message. Your role is to create a clear, actionable summary that helps users understand their top priorities for the day.

Output valid JSON only with this structure:
{
  "summary": "brief unified message covering top priorities",
  "rationale": "evidence-based explanation of why these are the priorities",
  "actions": ["specific action 1", "specific action 2", "specific action 3"]
}

Be concise, specific, and actionable. Focus on the most critical items first.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      logger.warn('Prioritization AI enrichment: no content returned');
      return {
        success: false,
        error: 'No content returned from OpenAI',
      };
    }

    const output = JSON.parse(content) as AIPrioritizationOutput;

    logger.info('🟢 Prioritization AI enrichment: success', {
      hasSummary: !!output.summary,
      hasRationale: !!output.rationale,
      actionCount: output.actions?.length ?? 0,
    });

    return {
      success: true,
      output,
    };
  } catch (error) {
    logger.error('🔴 Prioritization AI enrichment: error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildPrioritizationPrompt(
  topPriorities: PrioritizedRecommendation[],
  allRecommendations: PrioritizedRecommendation[],
): string {
  const topText = topPriorities
    .map(
      (rec, i) =>
        `${i + 1}. [${rec.source}] ${rec.priority.toUpperCase()}: ${rec.summary}\n   Actions: ${rec.actions.join('; ')}`,
    )
    .join('\n\n');

  const otherCount = allRecommendations.length - topPriorities.length;

  return `Daily Health Priorities

Top ${topPriorities.length} Priorities:
${topText}

${otherCount > 0 ? `Additional ${otherCount} recommendations available.` : ''}

Based on these top priorities, create a unified daily message that:
1. Summarizes the key focus areas for today
2. Explains why these are the priorities
3. Provides 3-5 specific, actionable steps

Focus on clarity and actionability. Help the user understand what matters most today.`;
}
