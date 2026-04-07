import OpenAI from 'openai';

import { logger } from '../utils/logger';
import type {
  SupplementEvidence,
  SupplementRecommendationEnriched,
} from '../types/supplementEngine';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function enrichSupplementRecommendationWithAI(
  evidence: SupplementEvidence,
  fallbackRecommendation: SupplementRecommendationEnriched,
): Promise<SupplementRecommendationEnriched> {
  try {
    logger.info('🤖 [SUPPLEMENT AI] Enrichment attempt', {
      supplementStatus: evidence.supplementStatus,
      signalCount: evidence.signals.length,
    });

    const prompt = buildSupplementPrompt(evidence, fallbackRecommendation);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert supplement optimization advisor for athletes and health-conscious individuals. Provide evidence-based, practical supplement recommendations that align with recovery, stress, metabolic, cardiovascular, and sexual health goals. Focus on stack optimization, dosage precision, timing strategies, and adherence. Be concise and actionable.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    const aiResponse = JSON.parse(content);

    logger.info('✅ [SUPPLEMENT AI] Enrichment successful', {
      priority: aiResponse.priority,
      actionCount: aiResponse.actions?.length || 0,
    });

    return {
      type: 'supplement',
      priority: aiResponse.priority || fallbackRecommendation.priority,
      summary: aiResponse.summary || fallbackRecommendation.summary,
      actions: aiResponse.actions || fallbackRecommendation.actions,
      rationale: aiResponse.rationale,
      source: 'ai_enriched',
    };
  } catch (error) {
    logger.warn('⚠️ [SUPPLEMENT AI] Enrichment failed, using fallback', {
      error: (error as Error).message,
    });

    return {
      ...fallbackRecommendation,
      source: 'fallback',
    };
  }
}

function buildSupplementPrompt(
  evidence: SupplementEvidence,
  fallbackRecommendation: SupplementRecommendationEnriched,
): string {
  const signalsText = evidence.signals
    .map(s => `- ${s.name}: ${s.value !== undefined ? s.value + ' - ' : ''}${s.interpretation}`)
    .join('\n');

  return `
Supplement Stack Optimization Analysis

Current Status: ${evidence.supplementStatus}

Evidence Signals:
${signalsText}

Summary: ${evidence.summary}

Fallback Recommendation:
Priority: ${fallbackRecommendation.priority}
Summary: ${fallbackRecommendation.summary}
Actions: ${fallbackRecommendation.actions.join(', ')}

Based on this evidence, provide an optimized supplement recommendation in JSON format:

{
  "priority": "critical" | "important" | "optimization",
  "summary": "Brief summary of supplement optimization strategy",
  "actions": ["action 1", "action 2", "action 3"],
  "rationale": "Evidence-based explanation"
}

Guidelines:
- Optimize supplement stack for efficiency and adherence
- Identify and eliminate redundancy
- Suggest evidence-based dosages and timing
- Align supplements with recovery, stress, metabolic, cardiovascular, and sexual health goals
- Prioritize high-impact supplements
- Consider stack complexity and adherence burden
- Be specific about dosages (e.g., "Magnesium glycinate 400mg before bed")
- Suggest timing strategies (e.g., "Take omega-3 with meals")
- Remove conflicting or redundant supplements
- Focus on 3-5 most impactful actions
`.trim();
}
