import { getOpenAIClient } from './openAIService';
import type { JointEvidence, JointRecommendation } from '../types/jointHealthEngine';
import { logger } from '../utils/logger';

interface AIJointOutput {
  priority?: string;
  summary?: string;
  rationale?: string;
  actions?: string[];
}

export interface AIJointResponse {
  success: boolean;
  output?: AIJointOutput;
  error?: string;
}

function buildJointPrompt(evidence: JointEvidence, fallback: JointRecommendation): string {
  const { riskLevel, jointHealthStatus, affectedArea, signals, summary } = evidence;

  const signalDescriptions = signals
    .map(s => `- ${s.name}: ${s.value} (${s.interpretation})`)
    .join('\n');

  return `You are a strength and conditioning expert analyzing joint health data to provide training modifications.

CONTEXT:
${summary}

DETAILED SIGNALS:
${signalDescriptions}

AFFECTED AREA: ${affectedArea}
RISK LEVEL: ${riskLevel}
JOINT STATUS: ${jointHealthStatus}

FALLBACK RECOMMENDATION:
${fallback.summary}

TASK:
Generate a joint health recommendation that:
1. Addresses the specific affected area (${affectedArea})
2. Provides practical training modifications based on the risk level
3. Focuses on injury prevention and safe training progression
4. Avoids medical diagnosis language
5. Emphasizes movement quality and pain-free training

Respond in JSON format:
{
  "priority": "critical" | "important" | "optimization",
  "summary": "Brief actionable summary (1-2 sentences)",
  "rationale": "Evidence-based explanation (2-3 sentences)",
  "actions": ["Specific action 1", "Specific action 2", "Specific action 3"]
}

Priority guidelines:
- "critical": High risk or aggravated status requiring immediate protective measures
- "important": Moderate risk or caution status requiring conservative modifications
- "optimization": Low risk or stable status with preventive guidance

Focus on:
- Exercise modifications for the affected area
- Load management strategies
- Movement pattern alternatives
- Recovery and tissue resilience support`;
}

export async function enrichJointRecommendationWithAI(
  evidence: JointEvidence,
  fallback: JointRecommendation,
): Promise<AIJointResponse> {
  try {
    const client = getOpenAIClient();
    if (!client) {
      logger.warn('OpenAI client not available for joint enrichment');
      return { success: false, error: 'OpenAI client not configured' };
    }

    const prompt = buildJointPrompt(evidence, fallback);

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a strength and conditioning expert providing joint health and training modification guidance. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10),
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.warn('Empty response from OpenAI for joint enrichment');
      return { success: false, error: 'Empty AI response' };
    }

    const output = JSON.parse(content) as AIJointOutput;
    logger.info('Joint AI enrichment successful', {
      priority: output.priority,
      hasRationale: !!output.rationale,
      actionCount: output.actions?.length ?? 0,
    });

    return { success: true, output };
  } catch (error) {
    logger.error('Joint AI enrichment failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Fallback to mock enrichment for development/testing
    const mockOutput: AIJointOutput = {
      priority: fallback.priority,
      summary: fallback.summary,
      rationale: `Based on ${evidence.riskLevel} risk level and ${evidence.jointHealthStatus} status for ${evidence.affectedArea}, conservative training modifications are recommended to support tissue health and prevent aggravation.`,
      actions: fallback.actions,
    };

    return { success: true, output: mockOutput };
  }
}
