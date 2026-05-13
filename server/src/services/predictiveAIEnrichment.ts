import { getOpenAIClient } from './openAIService';
import { logger } from '../utils/logger';
import type { PredictiveEvidence, PredictiveRecommendation, PredictiveRiskLevel } from '../types/predictiveIntelligence';

interface PredictiveAIOutput {
  priority?: 'critical' | 'important' | 'optimization';
  summary?: string;
  rationale?: string;
  actions?: string[];
}

export interface PredictiveAIResult {
  success: boolean;
  output?: PredictiveAIOutput;
  error?: string;
}

export async function enrichPredictiveRecommendationWithAI(
  evidence: PredictiveEvidence,
  riskLevel: PredictiveRiskLevel,
): Promise<PredictiveAIResult> {
  try {
    const openai = getOpenAIClient();

    const prompt = buildPredictivePrompt(evidence, riskLevel);

    logger.info('🟢 Predictive AI enrichment: calling OpenAI', {
      riskLevel,
      signalCount: evidence.signals.length,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a predictive health AI that analyzes multi-day trends to forecast emerging risks and generate proactive recommendations. Your role is to identify patterns before they become problems and provide preventive guidance.

Output valid JSON only with this structure:
{
  "priority": "critical" | "important" | "optimization",
  "summary": "brief forecast of emerging risk or opportunity",
  "rationale": "evidence-based explanation of trend analysis and predictions",
  "actions": ["specific preventive action 1", "specific preventive action 2", "specific preventive action 3"]
}

Be proactive, specific, and evidence-based. Focus on prevention and early intervention.`,
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
      logger.warn('Predictive AI enrichment: no content returned');
      return {
        success: false,
        error: 'No content returned from OpenAI',
      };
    }

    const output = JSON.parse(content) as PredictiveAIOutput;

    logger.info('🟢 Predictive AI enrichment: success', {
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
    logger.error('🔴 Predictive AI enrichment: error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildPredictivePrompt(evidence: PredictiveEvidence, riskLevel: PredictiveRiskLevel): string {
  const signalsText = evidence.signals
    .map(signal => `${signal.name}: ${signal.trend} (values: ${signal.values.join(' → ')})\n   ${signal.interpretation}`)
    .join('\n\n');

  return `Predictive Health Analysis

Risk Level: ${riskLevel.toUpperCase()}

Trend Signals:
${signalsText}

Summary:
${evidence.summary}

Based on these multi-day trends, provide:
1. A forecast of emerging risks or opportunities
2. Evidence-based rationale for your predictions
3. Specific preventive actions to take now

Focus on early intervention and proactive health optimization. Help the user stay ahead of problems before they develop.`;
}

export function buildPredictiveFallbackRecommendation(
  riskLevel: PredictiveRiskLevel,
  evidence: PredictiveEvidence,
): PredictiveRecommendation {
  logger.info('🔵 Building predictive fallback recommendation', { riskLevel });

  let priority: 'critical' | 'important' | 'optimization';
  let summary: string;
  let actions: string[];

  if (riskLevel === 'high') {
    priority = 'critical';
    summary = 'Multiple declining trends detected. High risk of overtraining or injury developing.';
    actions = [
      'Reduce training volume by 30-40% over next 3 days',
      'Prioritize recovery and sleep quality',
      'Monitor symptoms closely for worsening trends',
      'Consider scheduling rest day or active recovery',
      'Avoid high-risk movements and exercises',
    ];
  } else if (riskLevel === 'moderate') {
    priority = 'important';
    summary = 'Trends show early warning signs. Proactive adjustments recommended.';
    actions = [
      'Reduce training intensity by 15-20%',
      'Focus on recovery quality between sessions',
      'Monitor trend progression daily',
      'Adjust volume based on recovery response',
    ];
  } else {
    priority = 'optimization';
    summary = 'Trends are favorable. Continue current approach with minor optimizations.';
    actions = [
      'Maintain current training and recovery protocols',
      'Continue monitoring key metrics',
      'Look for opportunities to optimize performance',
      'Stay consistent with proven strategies',
    ];
  }

  return {
    type: 'predictive',
    priority,
    summary,
    actions,
    source: 'fallback',
  };
}
