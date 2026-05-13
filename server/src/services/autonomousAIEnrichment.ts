import { getOpenAIClient } from './openAIService';
import { logger } from '../utils/logger';
import type { AutonomousPlan, OptimizationContext } from '../types/autonomousOptimization';

interface AutonomousAIOutput {
  summary?: string;
  priority?: 'critical' | 'important' | 'optimization';
  enhancedRationale?: string;
}

export interface AutonomousAIResult {
  success: boolean;
  output?: AutonomousAIOutput;
  error?: string;
}

export async function enrichAutonomousPlanWithAI(
  context: OptimizationContext,
  basePlan: AutonomousPlan
): Promise<AutonomousAIResult> {
  try {
    const openai = getOpenAIClient();

    const prompt = buildAutonomousPrompt(context, basePlan);

    logger.info('🟢 Autonomous AI enrichment: calling OpenAI', {
      userId: context.userId,
      adjustmentCount: basePlan.adjustments.length,
      priority: basePlan.priority,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an autonomous health optimization AI that generates personalized daily training plans. Your role is to synthesize signals from recovery, stress, joint health, predictive trends, and adaptive learning to create optimal daily adjustments.

Output valid JSON only with this structure:
{
  "summary": "concise summary of today's optimized plan based on all signals",
  "priority": "critical" | "important" | "optimization",
  "enhancedRationale": "evidence-based explanation of why these adjustments optimize outcomes"
}

Be specific, data-driven, and focused on autonomous optimization. Reference actual metrics and trends.`,
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
      logger.warn('Autonomous AI enrichment: no content returned');
      return {
        success: false,
        error: 'No content returned from OpenAI',
      };
    }

    const output = JSON.parse(content) as AutonomousAIOutput;

    logger.info('🟢 Autonomous AI enrichment: success', {
      hasSummary: !!output.summary,
      priority: output.priority,
      hasRationale: !!output.enhancedRationale,
    });

    return {
      success: true,
      output,
    };
  } catch (error) {
    logger.error('🔴 Autonomous AI enrichment: error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildAutonomousPrompt(context: OptimizationContext, basePlan: AutonomousPlan): string {
  const adjustmentsByCategory = basePlan.adjustments.reduce((acc, adj) => {
    if (!acc[adj.category]) acc[adj.category] = [];
    acc[adj.category].push(`${adj.adjustment} (${adj.priority})`);
    return acc;
  }, {} as Record<string, string[]>);

  const adjustmentsText = Object.entries(adjustmentsByCategory)
    .map(([category, adjs]) => `${category.toUpperCase()}:\n${adjs.map(a => `  - ${a}`).join('\n')}`)
    .join('\n\n');

  return `Autonomous Health Optimization

Current Signals:
- Recovery Score: ${context.recoveryScore ?? 'N/A'}
- Recovery Status: ${context.recoveryStatus ?? 'N/A'}
- Stress Score: ${context.stressScore ?? 'N/A'}
- Stress Status: ${context.stressStatus ?? 'N/A'}
- Joint Risk: ${context.jointRiskLevel ?? 'N/A'}

Predictive Trends:
${context.predictiveTrends ? JSON.stringify(context.predictiveTrends, null, 2) : 'No trend data available'}

Adaptive Insights:
${context.adaptiveInsights ? JSON.stringify(context.adaptiveInsights, null, 2) : 'No adaptive data available'}

Generated Adjustments:
${adjustmentsText}

Base Plan Summary:
${basePlan.summary}

Based on all available signals, trends, and adaptive learning, provide:
1. A concise summary of today's optimized plan
2. Overall priority level
3. Enhanced rationale explaining why these adjustments optimize outcomes

Focus on autonomous optimization - the system is making these adjustments automatically to maximize user outcomes.`;
}
