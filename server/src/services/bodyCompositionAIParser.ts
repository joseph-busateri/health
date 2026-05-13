import OpenAI from 'openai';
import { logger } from '../utils/logger';
import type { ParsedScanData } from '../types/bodyComposition';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Calculate cost for OpenAI API usage
 * GPT-4o pricing: $2.50 per 1M input tokens, $10.00 per 1M output tokens
 */
function calculateCost(usage: { prompt_tokens: number; completion_tokens: number }): number {
  const inputCost = (usage.prompt_tokens / 1_000_000) * 2.50;
  const outputCost = (usage.completion_tokens / 1_000_000) * 10.00;
  return inputCost + outputCost;
}

interface AIParseResult {
  data: ParsedScanData | null;
  confidence: number;
  tokensUsed: number;
  cost: number;
}

/**
 * Parse body composition scan using AI
 */
export async function parseWithAI(text: string): Promise<AIParseResult> {
  const startTime = Date.now();
  
  try {
    logger.info('Starting AI body composition parsing');
    
    const openai = getOpenAIClient();
    
    const systemPrompt = `You are a body composition scan parser. Extract structured data from smart scale reports.

IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no explanations.

Extract these fields (use null if not found):
- weight (number, in original unit)
- weightUnit ("lb" or "kg")
- bodyFatPercentage (number, percentage)
- bodyFatMass (number, in lb or kg)
- skeletalMuscleMass (number, in lb or kg)
- leanBodyMass (number, in lb or kg)
- totalBodyWater (number, in lb or kg)
- dryLeanMass (number, in lb or kg)
- visceralFatLevel (integer, 1-20 scale)
- bmi (number)
- bmr (integer, kcal/day)
- metabolicAge (integer, years)
- boneMass (number, in lb or kg)
- proteinMass (number, in lb or kg)
- testDate (string, YYYY-MM-DD format)
- scanSource (string, e.g., "InBody S2", "Withings Body+", "Renpho")

Return JSON object with these fields. Use null for missing values.`;

    const userPrompt = `Parse this body composition scan report:

${text}

Return JSON only.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Remove markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```')) {
      const lines = jsonContent.split('\n');
      lines.shift(); // Remove opening ```
      if (lines[lines.length - 1].trim() === '```') {
        lines.pop(); // Remove closing ```
      }
      jsonContent = lines.join('\n').trim();
    }

    // Parse JSON
    const parsed = JSON.parse(jsonContent);

    // Convert to ParsedScanData format
    const data: ParsedScanData = {
      weight: parsed.weight || undefined,
      weightUnit: parsed.weightUnit || undefined,
      bodyFatPercentage: parsed.bodyFatPercentage || undefined,
      bodyFatMass: parsed.bodyFatMass || undefined,
      skeletalMuscleMass: parsed.skeletalMuscleMass || undefined,
      totalBodyWater: parsed.totalBodyWater || undefined,
      dryLeanMass: parsed.dryLeanMass || undefined,
      visceralFatLevel: parsed.visceralFatLevel || undefined,
      bmi: parsed.bmi || undefined,
      bmr: parsed.bmr || undefined,
      testDate: parsed.testDate || undefined,
      rawFields: {
        metabolicAge: parsed.metabolicAge || undefined,
        boneMass: parsed.boneMass || undefined,
        proteinMass: parsed.proteinMass || undefined,
        leanBodyMass: parsed.leanBodyMass || undefined,
        scanSource: parsed.scanSource || undefined
      }
    };

    // Calculate confidence based on fields extracted
    let confidence = 0.5; // Base confidence for AI
    let fieldsExtracted = 0;

    if (data.weight) fieldsExtracted++;
    if (data.bodyFatPercentage) fieldsExtracted++;
    if (data.skeletalMuscleMass) fieldsExtracted++;
    if (data.bmi) fieldsExtracted++;
    if (data.visceralFatLevel) fieldsExtracted++;
    if (data.bmr) fieldsExtracted++;

    // Confidence increases with more fields
    if (fieldsExtracted >= 5) confidence = 0.85;
    else if (fieldsExtracted >= 3) confidence = 0.75;
    else if (fieldsExtracted >= 2) confidence = 0.65;
    else if (fieldsExtracted >= 1) confidence = 0.55;

    const cost = response.usage ? calculateCost(response.usage) : 0;
    const tokensUsed = response.usage?.total_tokens || 0;
    const processingTime = Date.now() - startTime;

    logger.info('AI body composition parsing complete', {
      fieldsExtracted,
      confidence: confidence.toFixed(2),
      tokensUsed,
      cost: cost.toFixed(4),
      processingTime: `${processingTime}ms`
    });

    return {
      data: data.weight ? data : null,
      confidence,
      tokensUsed,
      cost
    };

  } catch (error) {
    logger.error('AI body composition parsing failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: `${Date.now() - startTime}ms`
    });
    
    return {
      data: null,
      confidence: 0,
      tokensUsed: 0,
      cost: 0
    };
  }
}

/**
 * Generate AI-enhanced description for body composition changes
 */
export async function generateBodyCompositionInsight(
  currentScan: ParsedScanData,
  previousScan?: ParsedScanData
): Promise<{ insight: string; cost: number }> {
  try {
    const openai = getOpenAIClient();

    const systemPrompt = `You are a body composition expert. Provide brief, actionable insights about body composition changes.

Keep responses under 100 words. Be specific, friendly, and encouraging.`;

    let userPrompt = '';
    
    if (previousScan) {
      userPrompt = `Current scan:
- Weight: ${currentScan.weight} ${currentScan.weightUnit}
- Body Fat: ${currentScan.bodyFatPercentage}%
- Muscle Mass: ${currentScan.skeletalMuscleMass} ${currentScan.weightUnit}

Previous scan:
- Weight: ${previousScan.weight} ${previousScan.weightUnit}
- Body Fat: ${previousScan.bodyFatPercentage}%
- Muscle Mass: ${previousScan.skeletalMuscleMass} ${previousScan.weightUnit}

Provide a brief insight about the changes.`;
    } else {
      userPrompt = `Scan results:
- Weight: ${currentScan.weight} ${currentScan.weightUnit}
- Body Fat: ${currentScan.bodyFatPercentage}%
- Muscle Mass: ${currentScan.skeletalMuscleMass} ${currentScan.weightUnit}
- BMI: ${currentScan.bmi}

Provide a brief assessment.`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const insight = response.choices[0].message.content || 'No insight generated.';
    const cost = response.usage ? calculateCost(response.usage) : 0;

    logger.info('Body composition insight generated', { cost: cost.toFixed(4) });

    return { insight, cost };

  } catch (error) {
    logger.error('Failed to generate body composition insight', { error });
    return { 
      insight: 'Unable to generate insight at this time.', 
      cost: 0 
    };
  }
}
