import { getOpenAIClient } from './openAIService';
import type { AdherenceEvidence, AdherenceRecommendation } from '../types/adherenceEngine';
import { logger } from '../utils/logger';

export async function enrichAdherenceRecommendationWithAI(
  evidence: AdherenceEvidence,
  fallback: AdherenceRecommendation,
): Promise<unknown> {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      logger.warn('OpenAI client not available for adherence enrichment');
      return enrichWithMock(evidence);
    }

    const prompt = buildAdherencePrompt(evidence, fallback);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert behavior change coach analyzing adherence patterns for a health optimization system. Focus on execution realism, consistency improvement, and reducing plan friction. Provide concise, actionable guidance.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      logger.warn('No content in OpenAI response for adherence enrichment');
      return enrichWithMock(evidence);
    }

    return JSON.parse(content);
  } catch (error) {
    logger.error('Adherence AI enrichment failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return enrichWithMock(evidence);
  }
}

function buildAdherencePrompt(evidence: AdherenceEvidence, fallback: AdherenceRecommendation): string {
  const signalsText = evidence.signals
    .map(s => `- ${s.name}: ${s.value} - ${s.interpretation}`)
    .join('\n');

  return `Analyze this adherence pattern and provide behavior-change guidance.

**Adherence Evidence:**
Score: ${evidence.adherenceScore}
Status: ${evidence.adherenceStatus}
Summary: ${evidence.summary}

**Signals:**
${signalsText}

**Fallback Recommendation:**
Priority: ${fallback.priority}
Summary: ${fallback.summary}
Note: ${fallback.note}
Actions: ${fallback.actions?.join(', ')}

**Your Task:**
Generate an enriched adherence recommendation as JSON with this structure:
{
  "priority": "critical" | "important" | "optimization",
  "summary": "Brief execution-focused summary (1-2 sentences)",
  "rationale": "Why this adherence pattern matters and what it reveals about plan fit (2-3 sentences)",
  "actions": ["Specific behavior change action 1", "Action 2", "Action 3", "Action 4"]
}

**Guidelines:**
1. Focus on execution realism and behavior change, not motivation
2. Identify friction points and simplification opportunities
3. Recommend concrete actions to improve consistency
4. Avoid generic advice - be specific to the adherence pattern
5. If adherence is low, emphasize simplification and reducing plan complexity
6. If adherence is high, emphasize maintaining consistency and gradual progression
7. Consider which domains are strong vs weak and provide targeted guidance
8. Keep language direct and actionable

Return only valid JSON.`;
}

function enrichWithMock(evidence: AdherenceEvidence): unknown {
  const priority =
    evidence.adherenceStatus === 'low'
      ? 'critical'
      : evidence.adherenceStatus === 'moderate'
      ? 'important'
      : 'optimization';

  const summary =
    evidence.adherenceStatus === 'low'
      ? 'Execution consistency is too low for effective optimization.'
      : evidence.adherenceStatus === 'moderate'
      ? 'Mixed execution patterns suggest plan friction or capacity mismatch.'
      : 'Strong execution consistency enables effective optimization.';

  const rationale =
    evidence.adherenceStatus === 'low'
      ? 'Low adherence across multiple domains indicates the current plan may be too complex or not aligned with execution capacity. Simplification is critical.'
      : evidence.adherenceStatus === 'moderate'
      ? 'Moderate adherence with inconsistent patterns suggests some plan elements work while others create friction. Focus on reinforcing what works.'
      : 'High adherence demonstrates good plan fit and execution capacity. Maintain current systems while selectively progressing.';

  const actions =
    evidence.adherenceStatus === 'low'
      ? [
          'Reduce plan to 1-2 non-negotiable daily actions',
          'Remove all optional or lower-priority items',
          'Focus exclusively on the highest-impact behavior',
          'Reassess plan complexity after 3-5 days of consistent execution',
        ]
      : evidence.adherenceStatus === 'moderate'
      ? [
          'Identify which domains have strong adherence and maintain those',
          'Simplify or remove actions in weak adherence domains',
          'Reduce total number of daily actions by 30-40%',
          'Build consistency in one weak domain before adding complexity',
        ]
      : [
          'Maintain current routine without changes',
          'Continue tracking to identify any emerging patterns',
          'Consider small progressive challenge in one domain only',
          'Preserve execution momentum as top priority',
        ];

  return {
    priority,
    summary,
    rationale,
    actions,
  };
}
