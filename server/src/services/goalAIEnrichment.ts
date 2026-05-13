import { getOpenAIClient } from './openAIService';
import { logger } from '../utils/logger';
import type { GoalDrivenPlan, GoalOptimizationContext } from '../types/goalOptimization';

interface GoalAIOutput {
  summary?: string;
  enhancedRationale?: string;
  goalAlignment?: number;
}

export interface GoalAIResult {
  success: boolean;
  output?: GoalAIOutput;
  error?: string;
}

export async function enrichGoalPlanWithAI(
  context: GoalOptimizationContext,
  basePlan: GoalDrivenPlan
): Promise<GoalAIResult> {
  try {
    const openai = getOpenAIClient();

    const prompt = buildGoalPrompt(context, basePlan);

    logger.info('🟢 Goal AI enrichment: calling OpenAI', {
      userId: context.userId,
      goalCount: context.goals.length,
      adjustmentCount: basePlan.adjustments.length,
      primaryGoal: basePlan.primaryGoal,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a goal-driven health optimization AI that generates personalized plans aligned with user goals. Your role is to synthesize user goals, current health signals, predictive trends, adaptive learning, and autonomous optimizations to create goal-aligned recommendations.

Output valid JSON only with this structure:
{
  "summary": "concise summary of how today's plan optimizes toward user goals",
  "enhancedRationale": "evidence-based explanation of goal alignment and trade-offs",
  "goalAlignment": number (0-100, how well plan aligns with goals)
}

Be specific, goal-focused, and data-driven. Reference actual metrics, goals, and trade-offs.`,
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
      logger.warn('Goal AI enrichment: no content returned');
      return {
        success: false,
        error: 'No content returned from OpenAI',
      };
    }

    const output = JSON.parse(content) as GoalAIOutput;

    logger.info('🟢 Goal AI enrichment: success', {
      hasSummary: !!output.summary,
      hasRationale: !!output.enhancedRationale,
      goalAlignment: output.goalAlignment,
    });

    return {
      success: true,
      output,
    };
  } catch (error) {
    logger.error('🔴 Goal AI enrichment: error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildGoalPrompt(context: GoalOptimizationContext, basePlan: GoalDrivenPlan): string {
  const goalsText = context.goals
    .map(g => `- ${formatGoalName(g.type)} (priority: ${g.priority}/10)`)
    .join('\n');

  const adjustmentsByGoal = basePlan.adjustments.reduce((acc, adj) => {
    if (!acc[adj.goal]) acc[adj.goal] = [];
    acc[adj.goal].push(`  - ${adj.adjustment} (${adj.priority}, ${adj.impact} impact)`);
    return acc;
  }, {} as Record<string, string[]>);

  const adjustmentsText = Object.entries(adjustmentsByGoal)
    .map(([goal, adjs]) => `${formatGoalName(goal)}:\n${adjs.join('\n')}`)
    .join('\n\n');

  return `Goal-Driven Health Optimization

User Goals:
${goalsText}

Primary Goal: ${basePlan.primaryGoal ? formatGoalName(basePlan.primaryGoal) : 'None'}

Current Health Signals:
- Recovery Score: ${context.recoveryScore ?? 'N/A'}
- Recovery Status: ${context.recoveryStatus ?? 'N/A'}
- Stress Score: ${context.stressScore ?? 'N/A'}
- Stress Status: ${context.stressStatus ?? 'N/A'}
- Joint Risk: ${context.jointRiskLevel ?? 'N/A'}

Predictive Trends:
${context.predictiveTrends ? JSON.stringify(context.predictiveTrends, null, 2) : 'No trend data available'}

Adaptive Insights:
${context.adaptiveInsights ? JSON.stringify(context.adaptiveInsights, null, 2) : 'No adaptive data available'}

Autonomous Plan:
${context.autonomousPlan ? JSON.stringify(context.autonomousPlan, null, 2) : 'No autonomous plan available'}

Generated Goal-Driven Adjustments:
${adjustmentsText}

Base Plan Summary:
${basePlan.summary}

Base Goal Alignment: ${basePlan.goalAlignment}%

Based on user goals and all available intelligence, provide:
1. A concise summary of how today's plan optimizes toward user goals
2. Enhanced rationale explaining goal alignment, trade-offs, and expected outcomes
3. Updated goal alignment score (0-100)

Focus on goal-driven optimization - the system is aligning all recommendations with user's stated goals.`;
}

function formatGoalName(goal: string): string {
  return goal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
