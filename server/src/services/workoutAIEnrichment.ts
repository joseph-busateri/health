import { getOpenAIClient } from './openAIService';
import type { WorkoutEvidence, WorkoutRecommendation } from '../types/workoutEngine';
import { logger } from '../utils/logger';

export async function enrichWorkoutRecommendationWithAI(
  evidence: WorkoutEvidence,
  fallback: WorkoutRecommendation,
): Promise<unknown> {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      logger.warn('OpenAI client not available for workout enrichment');
      return enrichWithMock(evidence);
    }

    const prompt = buildWorkoutPrompt(evidence, fallback);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert strength and conditioning coach analyzing workout readiness for a health optimization system. Focus on practical training adjustments, volume/intensity management, exercise selection, and injury prevention. Provide specific, actionable workout modifications.',
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
      logger.warn('No content in OpenAI response for workout enrichment');
      return enrichWithMock(evidence);
    }

    return JSON.parse(content);
  } catch (error) {
    logger.error('Workout AI enrichment failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return enrichWithMock(evidence);
  }
}

function buildWorkoutPrompt(evidence: WorkoutEvidence, fallback: WorkoutRecommendation): string {
  const signalsText = evidence.signals
    .map(s => `- ${s.name}: ${s.value} - ${s.interpretation}`)
    .join('\n');

  return `Analyze this workout readiness pattern and provide specific training adjustments.

**Workout Evidence:**
Status: ${evidence.workoutStatus}
Summary: ${evidence.summary}

**Signals:**
${signalsText}

**Fallback Recommendation:**
Priority: ${fallback.priority}
Summary: ${fallback.summary}
Actions: ${fallback.actions.join(', ')}

**Your Task:**
Generate an enriched workout recommendation as JSON with this structure:
{
  "priority": "critical" | "important" | "optimization",
  "summary": "Brief workout adjustment summary (1-2 sentences)",
  "rationale": "Why these adjustments are needed based on readiness signals (2-3 sentences)",
  "actions": ["Specific action 1", "Action 2", "Action 3", "Action 4", "Action 5"]
}

**Guidelines:**
1. Focus on practical, executable workout modifications
2. Be specific about volume (sets/reps) and intensity (% of max, RPE) adjustments
3. Consider exercise substitutions if joint risk is present
4. Balance training stimulus with recovery capacity
5. If deload status: emphasize significant load reduction and recovery
6. If constrained status: reduce volume and cap intensity
7. If moderate status: maintain load but keep effort submaximal
8. If optimal status: support progressive overload opportunities
9. Consider the interaction between recovery, stress, and joint signals
10. Provide actionable guidance that can be implemented immediately

**Examples of good actions:**
- "Reduce total sets by 25% (e.g., 4 sets → 3 sets per exercise)"
- "Cap working sets at RPE 7-8, avoid max effort"
- "Substitute barbell squats with goblet squats or leg press"
- "Extend rest periods to 3-4 minutes between compound lifts"
- "Add 5-10% volume to primary lifts (e.g., 3x8 → 3x9 or 4x8)"

Return only valid JSON.`;
}

function enrichWithMock(evidence: WorkoutEvidence): unknown {
  const priority =
    evidence.workoutStatus === 'deload'
      ? 'critical'
      : evidence.workoutStatus === 'constrained' || evidence.workoutStatus === 'moderate'
      ? 'important'
      : 'optimization';

  const summary =
    evidence.workoutStatus === 'deload'
      ? 'Significant deload required. Reduce volume 30-40% and intensity 20-30%.'
      : evidence.workoutStatus === 'constrained'
      ? 'Training capacity is limited. Reduce volume 20-25% and cap intensity.'
      : evidence.workoutStatus === 'moderate'
      ? 'Maintain current load with submaximal effort. Monitor recovery closely.'
      : 'Training capacity is optimal. Execute planned workout with full intensity.';

  const rationale =
    evidence.workoutStatus === 'deload'
      ? 'Multiple readiness signals indicate insufficient recovery capacity. Deload protocol prevents overtraining and supports recovery. This is a critical adjustment to protect long-term progress.'
      : evidence.workoutStatus === 'constrained'
      ? 'Recovery and stress signals indicate limited training capacity. Volume and intensity reduction allows continued training stimulus while respecting current constraints.'
      : evidence.workoutStatus === 'moderate'
      ? 'Readiness signals are moderate. Maintaining current load while keeping effort submaximal balances training stimulus with recovery needs.'
      : 'All readiness signals support full training capacity. This is an opportunity for progressive overload while maintaining excellent form and monitoring recovery.';

  const actions =
    evidence.workoutStatus === 'deload'
      ? [
          'Reduce total sets by 30-40% across all exercises',
          'Lower working weights to 60-70% of normal loads',
          'Keep all sets at RPE 5-6, focus on movement quality',
          'Extend rest periods to ensure full recovery between sets',
          'Consider replacing one workout with active recovery or complete rest',
        ]
      : evidence.workoutStatus === 'constrained'
      ? [
          'Reduce total sets by 20-25% (e.g., 4 sets → 3 sets)',
          'Cap intensity at 75-80% of working max',
          'Prioritize compound movements, reduce or eliminate accessories',
          'Keep RPE at 7-8 maximum, avoid grinding reps',
          'Monitor fatigue closely and adjust mid-workout if needed',
        ]
      : evidence.workoutStatus === 'moderate'
      ? [
          'Execute planned workout as programmed',
          'Keep working sets at RPE 7-8, leave 2-3 reps in reserve',
          'Maintain strict form throughout, reduce load if form breaks down',
          'Rest 2-3 minutes between compound sets',
          'Prioritize recovery nutrition and sleep post-workout',
        ]
      : [
          'Execute planned workout with full intensity',
          'Push working sets to RPE 8-9 where appropriate',
          'Consider 5-10% volume increase if form remains excellent',
          'Maintain 2-3 minute rest periods for compounds',
          'Continue monitoring recovery signals for next session',
        ];

  return {
    priority,
    summary,
    rationale,
    actions,
  };
}
