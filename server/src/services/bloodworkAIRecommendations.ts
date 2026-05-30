import OpenAI from 'openai';
import { logger } from '../utils/logger';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface AIRecommendationInput {
  markerName: string;
  latestValue: number;
  priorValue?: number;
  unit: string;
  trendDirection: 'improving' | 'worsening' | 'stable';
  changePercent?: number;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  severity: 'low' | 'medium' | 'high';
  recommendationType: string;
  userContext?: {
    age?: number;
    gender?: string;
    otherMarkers?: Array<{ name: string; value: number; unit: string }>;
  };
}

export interface AIRecommendationResult {
  title: string;
  message: string;
  actionItems: string[];
  rationale: string;
  tokensUsed: number;
  cost: number;
  generatedAt: string;
}

/**
 * Calculate cost based on token usage
 * GPT-4o pricing: $0.0025 per 1K input tokens, $0.01 per 1K output tokens
 */
function calculateCost(usage: { prompt_tokens: number; completion_tokens: number }): number {
  const inputCost = (usage.prompt_tokens / 1000) * 0.0025;
  const outputCost = (usage.completion_tokens / 1000) * 0.01;
  return inputCost + outputCost;
}

/**
 * Generate personalized recommendation text using AI
 * This enhances rule-based recommendations with natural, contextual language
 */
export async function generateAIRecommendationText(
  input: AIRecommendationInput
): Promise<AIRecommendationResult> {
  const startTime = Date.now();
  
  logger.info('Generating AI recommendation text', { 
    marker: input.markerName,
    trend: input.trendDirection,
    severity: input.severity
  });

  try {
    const openai = getOpenAIClient();

    // Build context about the marker
    const changeText = input.priorValue 
      ? `changed from ${input.priorValue} to ${input.latestValue} ${input.unit} (${input.changePercent?.toFixed(1)}% ${input.trendDirection})`
      : `is currently ${input.latestValue} ${input.unit}`;

    const rangeText = input.referenceRangeLow && input.referenceRangeHigh
      ? `The optimal range is ${input.referenceRangeLow}-${input.referenceRangeHigh} ${input.unit}.`
      : input.referenceRangeHigh
      ? `The optimal level is below ${input.referenceRangeHigh} ${input.unit}.`
      : input.referenceRangeLow
      ? `The optimal level is above ${input.referenceRangeLow} ${input.unit}.`
      : '';

    const otherMarkersText = input.userContext?.otherMarkers?.length
      ? `\n\nRelated markers:\n${input.userContext.otherMarkers.map(m => `- ${m.name}: ${m.value} ${m.unit}`).join('\n')}`
      : '';

    const systemPrompt = `You are a health insights assistant helping users understand their bloodwork results. Your role is to:

1. Explain what the biomarker means in simple, non-medical language
2. Provide context about why the trend matters
3. Suggest 2-4 specific, actionable steps the user can take
4. Be encouraging and supportive, not alarmist
5. Recommend consulting a healthcare provider for significant changes

Guidelines:
- Use conversational, friendly tone
- Avoid medical jargon or explain it simply
- Focus on lifestyle interventions (diet, exercise, sleep, stress)
- Be specific with action items (not just "eat better")
- Keep the message concise (2-3 paragraphs max)
- Always recommend professional consultation for concerning trends

Return JSON with this structure:
{
  "title": "Short, clear title (5-8 words)",
  "message": "2-3 paragraph explanation in friendly, conversational tone",
  "actionItems": ["Specific action 1", "Specific action 2", "Specific action 3"],
  "rationale": "Brief clinical context (1-2 sentences)"
}`;

    const userPrompt = `Generate a personalized health recommendation for this bloodwork result:

Biomarker: ${input.markerName}
Current Status: ${changeText}
${rangeText}
Trend: ${input.trendDirection}
Severity: ${input.severity}
Category: ${input.recommendationType}${otherMarkersText}

Create a helpful, actionable recommendation that explains what this means and what the user can do about it.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    // Strip markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonContent);
    const processingTime = Date.now() - startTime;
    const tokensUsed = response.usage?.total_tokens || 0;
    const cost = response.usage ? calculateCost(response.usage) : 0;

    logger.info('AI recommendation generated', {
      marker: input.markerName,
      tokensUsed,
      cost: cost.toFixed(4),
      processingTimeMs: processingTime
    });

    return {
      title: parsed.title,
      message: parsed.message,
      actionItems: parsed.actionItems || [],
      rationale: parsed.rationale,
      tokensUsed,
      cost,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error('AI recommendation generation failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      marker: input.markerName
    });

    // Return fallback recommendation
    return {
      title: `${input.markerName} ${input.trendDirection === 'worsening' ? 'Needs Attention' : 'Update'}`,
      message: `Your ${input.markerName} has ${input.trendDirection === 'worsening' ? 'increased' : 'changed'} to ${input.latestValue} ${input.unit}. Consider discussing this with your healthcare provider to understand what steps you can take.`,
      actionItems: [
        'Review your recent lifestyle changes',
        'Schedule a follow-up with your healthcare provider',
        'Track this marker in future tests'
      ],
      rationale: `${input.markerName} trend requires monitoring and potential intervention.`,
      tokensUsed: 0,
      cost: 0,
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Generate multiple AI recommendations in batch
 * More efficient than individual calls
 */
export async function generateBatchAIRecommendations(
  inputs: AIRecommendationInput[]
): Promise<AIRecommendationResult[]> {
  logger.info('Generating batch AI recommendations', { count: inputs.length });

  const results = await Promise.all(
    inputs.map(input => generateAIRecommendationText(input))
  );

  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
  const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0);

  logger.info('Batch AI recommendations complete', {
    count: results.length,
    totalTokens,
    totalCost: totalCost.toFixed(4)
  });

  return results;
}
