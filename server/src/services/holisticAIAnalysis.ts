import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import type {
  UnifiedHealthProfile,
  HolisticRecommendation,
  HealthInterconnection
} from '../types/holisticHealth';

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

interface AIHolisticAnalysisResponse {
  rootCauses: string[];
  interconnections: Array<{
    from: string;
    to: string;
    relationship: string;
    confidence: number;
  }>;
  topPriority: {
    issue: string;
    rationale: string;
    actions: string[];
    affectedSystems: string[];
  };
  secondaryPriorities: Array<{
    issue: string;
    rationale: string;
    actions: string[];
    affectedSystems: string[];
  }>;
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
 * Format health profile for AI analysis
 */
function formatProfileForAI(profile: UnifiedHealthProfile): string {
  let summary = '';

  if (profile.bloodwork) {
    summary += '\n**Bloodwork:**\n';
    const outOfRange = profile.bloodwork.markers.filter(m => m.isOutOfRange);
    const worsening = profile.bloodwork.markers.filter(m => m.trendDirection === 'worsening');
    
    if (outOfRange.length > 0) {
      summary += `Out of range markers (${outOfRange.length}):\n`;
      outOfRange.forEach(m => {
        summary += `- ${m.name}: ${m.latestValue} ${m.unit} (${m.trendDirection})`;
        if (m.abnormalFlag) summary += ` [${m.abnormalFlag}]`;
        summary += '\n';
      });
    }
    
    if (worsening.length > 0) {
      summary += `Worsening trends (${worsening.length}):\n`;
      worsening.forEach(m => {
        summary += `- ${m.name}: ${m.priorValue} → ${m.latestValue} ${m.unit} (${m.changePercent?.toFixed(1)}%)\n`;
      });
    }
  }

  if (profile.sleep) {
    summary += '\n**Sleep:**\n';
    summary += `- Average duration: ${profile.sleep.avgDuration.toFixed(1)} hours (trend: ${profile.sleep.trendDirection})\n`;
    summary += `- Average quality: ${profile.sleep.avgRestfulness.toFixed(1)}/10\n`;
    if (profile.sleep.avgDuration < 7) {
      summary += `- ⚠️ Below recommended 7-8 hours\n`;
    }
  }

  if (profile.bodyComposition) {
    summary += '\n**Body Composition:**\n';
    profile.bodyComposition.metrics.forEach(m => {
      summary += `- ${m.name}: ${m.latestValue} ${m.unit} (${m.trendDirection})`;
      if (m.changePercent) {
        summary += ` [${m.changePercent > 0 ? '+' : ''}${m.changePercent.toFixed(1)}%]`;
      }
      summary += '\n';
    });
  }

  if (profile.activity) {
    summary += '\n**Activity:**\n';
    summary += `- Exercise frequency: ${profile.activity.weeklyExerciseDays.toFixed(1)} days/week (${profile.activity.avgIntensity} intensity)\n`;
    summary += `- Average duration: ${profile.activity.avgDuration.toFixed(0)} minutes\n`;
    summary += `- Trend: ${profile.activity.trendDirection}\n`;
    if (profile.activity.weeklyExerciseDays < 3) {
      summary += `- ⚠️ Below recommended 3-5 days/week\n`;
    }
  }

  if (profile.stress) {
    summary += '\n**Stress:**\n';
    summary += `- Average daily stress: ${profile.stress.avgDailyScore.toFixed(1)}/10 (${profile.stress.trendDirection})\n`;
    summary += `- High stress days: ${profile.stress.highStressDays} in last 30 days\n`;
    if (profile.stress.avgDailyScore >= 7) {
      summary += `- ⚠️ Chronically elevated stress levels\n`;
    }
  }

  if (profile.nutrition) {
    summary += '\n**Nutrition:**\n';
    if (profile.nutrition.avgCalories) {
      summary += `- Average calories: ${profile.nutrition.avgCalories.toFixed(0)}/day\n`;
    }
    if (profile.nutrition.avgProtein) {
      summary += `- Average protein: ${profile.nutrition.avgProtein.toFixed(0)}g/day\n`;
    }
  }

  return summary;
}

/**
 * Analyze complete health profile using AI
 * Identifies root causes, interconnections, and prioritized recommendations
 */
export async function analyzeHealthProfileWithAI(
  profile: UnifiedHealthProfile
): Promise<{
  recommendations: HolisticRecommendation[];
  rootCauses: string[];
  interconnections: HealthInterconnection[];
  topPriority: { issue: string; rationale: string; actions: string[] };
  secondaryPriorities: Array<{ issue: string; actions: string[] }>;
  cost: number;
  tokensUsed: number;
}> {
  const startTime = Date.now();

  logger.info('Starting AI holistic health analysis', { userId: profile.userId });

  try {
    const openai = getOpenAIClient();

    const profileSummary = formatProfileForAI(profile);

    const systemPrompt = `You are a holistic health insights engine that analyzes complete health profiles to identify root causes and interconnections between different health systems.

Your role is to:
1. Identify PRIMARY root causes (not just symptoms)
2. Map interconnections between health systems (how one issue affects another)
3. Determine the highest-leverage intervention point
4. Prioritize recommendations by impact

Key principles:
- Look for cascading effects (e.g., poor sleep → high cortisol → low testosterone → body fat gain)
- Identify foundational issues that affect multiple systems
- Prioritize interventions that create positive ripple effects
- Be specific and actionable
- Consider the whole person, not isolated metrics

Return JSON with this exact structure:
{
  "rootCauses": ["Primary cause 1", "Primary cause 2"],
  "interconnections": [
    {
      "from": "System/Issue A",
      "to": "System/Issue B",
      "relationship": "How A affects B",
      "confidence": 0.85
    }
  ],
  "topPriority": {
    "issue": "Most important issue to address",
    "rationale": "Why this is the highest leverage point",
    "actions": ["Specific action 1", "Specific action 2", "Specific action 3"],
    "affectedSystems": ["system1", "system2"]
  },
  "secondaryPriorities": [
    {
      "issue": "Second priority",
      "rationale": "Why this matters",
      "actions": ["Action 1", "Action 2"],
      "affectedSystems": ["system1"]
    }
  ]
}`;

    const userPrompt = `Analyze this complete health profile and provide holistic insights:

${profileSummary}

**Data Completeness:**
- Bloodwork: ${profile.dataCompleteness.bloodwork ? 'Yes' : 'No'}
- Sleep: ${profile.dataCompleteness.sleep ? 'Yes' : 'No'}
- Body Composition: ${profile.dataCompleteness.bodyComposition ? 'Yes' : 'No'}
- Activity: ${profile.dataCompleteness.activity ? 'Yes' : 'No'}
- Stress: ${profile.dataCompleteness.stress ? 'Yes' : 'No'}
- Nutrition: ${profile.dataCompleteness.nutrition ? 'Yes' : 'No'}

Provide a holistic analysis that:
1. Identifies root causes (not symptoms)
2. Maps how different systems affect each other
3. Determines the highest-leverage intervention
4. Prioritizes recommendations by impact

Focus on actionable insights that address multiple systems simultaneously.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
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

    const parsed: AIHolisticAnalysisResponse = JSON.parse(jsonContent);
    const processingTime = Date.now() - startTime;
    const tokensUsed = response.usage?.total_tokens || 0;
    const cost = response.usage ? calculateCost(response.usage) : 0;

    // Convert to holistic recommendations
    const recommendations: HolisticRecommendation[] = [];

    // Add top priority
    recommendations.push({
      id: uuidv4(),
      userId: profile.userId,
      priority: 1,
      issue: parsed.topPriority.issue,
      rootCauses: parsed.rootCauses,
      interconnections: parsed.interconnections,
      rationale: parsed.topPriority.rationale,
      actions: parsed.topPriority.actions,
      affectedSystems: parsed.topPriority.affectedSystems,
      confidence: 0.85,
      generationMethod: 'ai_analysis',
      aiCost: cost,
      createdAt: new Date().toISOString()
    });

    // Add secondary priorities
    parsed.secondaryPriorities.forEach((priority, index) => {
      recommendations.push({
        id: uuidv4(),
        userId: profile.userId,
        priority: (index + 2) as 2 | 3,
        issue: priority.issue,
        rootCauses: parsed.rootCauses,
        interconnections: parsed.interconnections,
        rationale: priority.rationale,
        actions: priority.actions,
        affectedSystems: priority.affectedSystems,
        confidence: 0.8,
        generationMethod: 'ai_analysis',
        aiCost: cost / (parsed.secondaryPriorities.length + 1),
        createdAt: new Date().toISOString()
      });
    });

    logger.info('AI holistic analysis complete', {
      userId: profile.userId,
      recommendations: recommendations.length,
      tokensUsed,
      cost: cost.toFixed(4),
      processingTime
    });

    return {
      recommendations,
      rootCauses: parsed.rootCauses,
      interconnections: parsed.interconnections,
      topPriority: parsed.topPriority,
      secondaryPriorities: parsed.secondaryPriorities,
      cost,
      tokensUsed
    };

  } catch (error) {
    logger.error('AI holistic analysis failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: profile.userId
    });

    // Return fallback recommendation
    return {
      recommendations: [{
        id: uuidv4(),
        userId: profile.userId,
        priority: 1,
        issue: 'Health Profile Review Needed',
        rootCauses: ['Multiple health metrics require attention'],
        interconnections: [],
        rationale: 'Your health data shows several areas that could benefit from attention. Consider consulting with a healthcare provider for personalized guidance.',
        actions: [
          'Review your recent health trends',
          'Schedule a check-up with your healthcare provider',
          'Focus on foundational health: sleep, nutrition, activity',
          'Track your progress over the next 2-4 weeks'
        ],
        affectedSystems: ['general'],
        confidence: 0.5,
        generationMethod: 'ai_analysis',
        aiCost: 0,
        createdAt: new Date().toISOString()
      }],
      rootCauses: ['Multiple health metrics require attention'],
      interconnections: [],
      topPriority: {
        issue: 'Health Profile Review Needed',
        rationale: 'Consult healthcare provider for personalized guidance',
        actions: ['Review trends', 'Schedule check-up', 'Focus on fundamentals']
      },
      secondaryPriorities: [],
      cost: 0,
      tokensUsed: 0
    };
  }
}
