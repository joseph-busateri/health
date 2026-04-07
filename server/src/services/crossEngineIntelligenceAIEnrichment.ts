import OpenAI from 'openai';

import { logger } from '../utils/logger';
import type {
  CrossEngineEngineSnapshot,
  CrossEngineEvidenceSignal,
  CrossEnginePattern,
  CrossEngineRecommendation,
} from '../types/crossEngineIntelligence';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function enrichCrossEngineIntelligenceWithAI(
  engineSnapshot: CrossEngineEngineSnapshot,
  evidence: CrossEngineEvidenceSignal[],
  patterns: CrossEnginePattern[],
  fallbackRecommendation: CrossEngineRecommendation,
): Promise<CrossEngineRecommendation> {
  try {
    logger.info('🤖 [CROSS-ENGINE AI] Enrichment attempt', {
      patternCount: patterns.length,
      evidenceCount: evidence.length,
    });

    const prompt = buildCrossEnginePrompt(
      engineSnapshot,
      evidence,
      patterns,
      fallbackRecommendation,
    );

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert health orchestration AI that reasons across multiple health domains simultaneously. Your role is to detect multi-domain patterns, resolve tradeoffs between competing priorities, and generate coordinated recommendations that optimize the whole system rather than individual domains. Think like one integrated health brain, not separate engines. Be practical, execution-oriented, and avoid diagnosis language. Prioritize actions in the right order considering dependencies and constraints across recovery, training, nutrition, metabolic health, cardiovascular health, stress, adherence, and supplements.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    const aiResponse = JSON.parse(content);

    logger.info('✅ [CROSS-ENGINE AI] Enrichment successful', {
      priority: aiResponse.priority,
      actionCount: aiResponse.actions?.length || 0,
    });

    return {
      type: 'cross_engine_intelligence',
      priority: aiResponse.priority || fallbackRecommendation.priority,
      summary: aiResponse.summary || fallbackRecommendation.summary,
      actions: aiResponse.actions || fallbackRecommendation.actions,
      rationale: aiResponse.rationale,
      source: 'ai_enriched',
    };
  } catch (error) {
    logger.warn('⚠️ [CROSS-ENGINE AI] Enrichment failed, using fallback', {
      error: (error as Error).message,
    });

    return {
      ...fallbackRecommendation,
      source: 'fallback',
    };
  }
}

function buildCrossEnginePrompt(
  engineSnapshot: CrossEngineEngineSnapshot,
  evidence: CrossEngineEvidenceSignal[],
  patterns: CrossEnginePattern[],
  fallbackRecommendation: CrossEngineRecommendation,
): string {
  const snapshotText = Object.entries(engineSnapshot)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  const evidenceText = evidence
    .map(e => {
      const sources = e.sourceEngines?.join(', ') || 'Multiple';
      return `- [${e.severity || 'moderate'}] ${e.name}: ${e.interpretation} (Sources: ${sources})`;
    })
    .join('\n');

  const patternsText = patterns
    .map(p => `- [${p.severity}] ${p.name}: ${p.summary} (Engines: ${p.sourceEngines.join(', ')})`)
    .join('\n');

  return `
Cross-Engine Health Intelligence Analysis

Engine Status Snapshot:
${snapshotText}

Evidence Signals:
${evidenceText}

Detected Patterns:
${patternsText}

Fallback Recommendation:
Priority: ${fallbackRecommendation.priority}
Summary: ${fallbackRecommendation.summary}
Actions: ${fallbackRecommendation.actions.join(', ')}

Based on this multi-domain analysis, provide an orchestrated health recommendation in JSON format:

{
  "priority": "critical" | "important" | "optimization",
  "summary": "Brief orchestrated summary that addresses the whole system",
  "actions": ["action 1", "action 2", "action 3", "action 4"],
  "rationale": "Evidence-based explanation of cross-domain reasoning"
}

Guidelines:
- Reason across ALL domains simultaneously, not one at a time
- Detect compounding risks (e.g., low recovery + high stress + demanding workout = systemic strain)
- Identify reinforcing opportunities (e.g., high recovery + low stress + good adherence = progression window)
- Resolve tradeoffs (e.g., metabolic goals vs. training intensity vs. recovery capacity)
- Prioritize actions in dependency order (e.g., fix recovery before progressing training)
- Generate 3-5 coordinated actions that work together as a system
- Be specific and actionable (e.g., "Reduce workout intensity by 20%" not "Take it easy")
- Consider adherence burden - don't overwhelm with complexity
- Align supplement/nutrition recommendations with training and recovery state
- Think like one integrated health brain, not separate aggregated engines
- Stay practical and execution-oriented
- Avoid diagnosis language
`.trim();
}
