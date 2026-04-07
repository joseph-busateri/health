import { getOpenAIClient } from './openAIService';
import { logger } from '../utils/logger';
import type { AdaptiveContext, AdaptiveRecommendation } from '../types/adaptiveIntelligence';

interface AdaptiveAIOutput {
  priority?: 'critical' | 'important' | 'optimization';
  summary?: string;
  rationale?: string;
  actions?: string[];
}

export interface AdaptiveAIResult {
  success: boolean;
  output?: AdaptiveAIOutput;
  error?: string;
}

export async function enrichAdaptiveRecommendationWithAI(
  context: AdaptiveContext
): Promise<AdaptiveAIResult> {
  try {
    const openai = getOpenAIClient();

    const prompt = buildAdaptivePrompt(context);

    logger.info('🟢 Adaptive AI enrichment: calling OpenAI', {
      userId: context.userId,
      effectivenessScoreCount: context.effectivenessScores.length,
      patternCount: context.userPatterns.length,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an adaptive health AI that learns from user-specific outcomes and personalizes recommendations. Your role is to analyze what works best for each individual user and provide personalized guidance based on their unique patterns and effectiveness data.

Output valid JSON only with this structure:
{
  "priority": "critical" | "important" | "optimization",
  "summary": "personalized insight based on user's effectiveness data",
  "rationale": "evidence-based explanation using user's specific outcomes",
  "actions": ["personalized action 1", "personalized action 2", "personalized action 3"]
}

Be specific, personalized, and data-driven. Reference the user's actual effectiveness scores and patterns.`,
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
      logger.warn('Adaptive AI enrichment: no content returned');
      return {
        success: false,
        error: 'No content returned from OpenAI',
      };
    }

    const output = JSON.parse(content) as AdaptiveAIOutput;

    logger.info('🟢 Adaptive AI enrichment: success', {
      priority: output.priority,
      hasSummary: !!output.summary,
      hasRationale: !!output.rationale,
      actionCount: output.actions?.length ?? 0,
    });

    return {
      success: true,
      output,
    };
  } catch (error) {
    logger.error('🔴 Adaptive AI enrichment: error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildAdaptivePrompt(context: AdaptiveContext): string {
  const effectivenessText = context.effectivenessScores
    .filter(s => s.sampleSize >= 2)
    .map(s => `${s.recommendationType}: ${Math.round(s.effectiveness * 100)}% effective (${s.sampleSize} samples)`)
    .join('\n');

  const patternsText = context.userPatterns
    .map(p => `${p.patternType}: ${p.description}`)
    .join('\n');

  const recentOutcomesText = context.recentOutcomes
    .slice(-5)
    .map(o => `${o.adherenceStatus} - improvement: ${o.improvementDetected}`)
    .join('\n');

  return `Adaptive Health Intelligence Analysis

User ID: ${context.userId}

Effectiveness Scores:
${effectivenessText || 'No effectiveness data yet'}

User Patterns:
${patternsText || 'No patterns identified yet'}

Recent Outcomes (last 5):
${recentOutcomesText || 'No recent outcomes'}

Based on this user's specific data, provide:
1. Personalized insight about what works best for them
2. Evidence-based rationale using their actual effectiveness scores
3. Specific actions tailored to their patterns

Focus on leveraging what has proven effective for this individual user. Be specific and data-driven.`;
}

export function buildAdaptiveFallbackRecommendation(
  context: AdaptiveContext
): AdaptiveRecommendation {
  logger.info('🔵 Building adaptive fallback recommendation', { userId: context.userId });

  const totalOutcomes = context.effectivenessScores.reduce((sum, s) => sum + s.sampleSize, 0);
  const topEffective = context.effectivenessScores
    .filter(s => s.sampleSize >= 2)
    .sort((a, b) => b.effectiveness - a.effectiveness)[0];

  let priority: 'critical' | 'important' | 'optimization';
  let summary: string;
  let actions: string[];

  if (totalOutcomes < 3) {
    priority = 'optimization';
    summary = 'Continue building your health data history. The system will learn your patterns over time.';
    actions = [
      'Continue logging daily metrics consistently',
      'Follow recommendations to build effectiveness data',
      'Track your adherence and outcomes',
      'Check back after 5+ recommendation cycles',
    ];
  } else if (topEffective && topEffective.effectiveness >= 0.7) {
    priority = 'important';
    summary = `Your data shows ${topEffective.recommendationType} recommendations are ${Math.round(topEffective.effectiveness * 100)}% effective for you. Continue this approach.`;
    actions = [
      `Prioritize ${topEffective.recommendationType} recommendations`,
      'Maintain your current adherence patterns',
      'Continue tracking outcomes',
      'Build on what works for you',
    ];
  } else {
    priority = 'optimization';
    summary = 'Your adaptive intelligence is learning your patterns. Continue following recommendations.';
    actions = [
      'Maintain consistent adherence',
      'Track outcomes after each recommendation',
      'Note which recommendations feel most effective',
      'Continue building your health data',
    ];
  }

  return {
    type: 'adaptive',
    priority,
    summary,
    actions,
    source: 'fallback',
  };
}
