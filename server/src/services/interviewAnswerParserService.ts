/**
 * Phase 22: Interview Answer Parser Service
 * 
 * Purpose: Extract structured, actionable data from natural language interview answers
 * Features: AI-powered extraction, multi-category support, confidence scoring, fallback mechanisms
 * 
 * Architecture:
 * - Uses GPT-4o-mini for intelligent extraction
 * - Falls back to keyword/numeric matching if AI unavailable
 * - Saves structured data to interview_signals table
 * - Enables cross-source correlation and holistic recommendations
 */

import OpenAI from 'openai';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedAnswer {
  // Numeric metrics
  numericValue?: number;
  
  // Text values
  textValue?: string;
  
  // Array values (barriers, triggers, symptoms, etc.)
  arrayValue?: string[];
  
  // Metadata
  category: string;
  subcategory?: string;
  confidence: number;
  extractionMethod: 'ai' | 'keyword' | 'numeric' | 'manual';
  
  // Source
  questionText: string;
  answerText: string;
  questionId?: string;
}

export interface InterviewSignal {
  id: string;
  userId: string;
  sessionId: string;
  signalDate: string;
  category: string;
  subcategory?: string;
  numericValue?: number;
  textValue?: string;
  arrayValue?: string[];
  confidence: number;
  extractionMethod: string;
  questionText: string;
  answerText: string;
  questionId?: string;
  metadata?: any;
}

// ============================================================================
// OPENAI CLIENT
// ============================================================================

let openai: OpenAI | null = null;

const getOpenAI = (): OpenAI | null => {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('⚠️ [PARSER] OpenAI API key not configured');
    return null;
  }
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

// ============================================================================
// CATEGORY DETECTION
// ============================================================================

function detectCategory(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('sleep') || q.includes('rest') || q.includes('wake')) return 'sleep';
  if (q.includes('stress') || q.includes('anxiety') || q.includes('overwhelm')) return 'stress';
  if (q.includes('workout') || q.includes('exercise') || q.includes('train')) return 'workout';
  if (q.includes('nutrition') || q.includes('eat') || q.includes('meal') || q.includes('food')) return 'nutrition';
  if (q.includes('supplement') || q.includes('vitamin') || q.includes('pill')) return 'supplements';
  if (q.includes('energy') || q.includes('fatigue') || q.includes('tired')) return 'energy';
  if (q.includes('mood') || q.includes('feel') || q.includes('emotion')) return 'mood';
  if (q.includes('pain') || q.includes('sore') || q.includes('ache') || q.includes('hurt')) return 'pain';
  if (q.includes('recovery') || q.includes('recover')) return 'recovery';
  if (q.includes('libido') || q.includes('sexual') || q.includes('intimacy')) return 'sexual_health';
  
  return 'general';
}

// ============================================================================
// NUMERIC EXTRACTION
// ============================================================================

function extractNumericValue(answer: string, category: string): number | null {
  const a = answer.toLowerCase();
  
  // Try to extract explicit number (1-10 scale)
  const numMatch = a.match(/\b([0-9]|10)\b/);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }
  
  // Keyword-based extraction for ratings
  if (category === 'sleep' || category === 'stress' || category === 'energy' || category === 'mood') {
    if (a.includes('very poor') || a.includes('terrible') || a.includes('awful')) return 1;
    if (a.includes('poor') || a.includes('bad') || a.includes('low')) return 2;
    if (a.includes('okay') || a.includes('fair') || a.includes('moderate')) return 3;
    if (a.includes('good') || a.includes('well') || a.includes('fine')) return 4;
    if (a.includes('very good') || a.includes('great') || a.includes('excellent')) return 5;
  }
  
  // Extract hours for sleep
  if (category === 'sleep') {
    const hoursMatch = a.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
    if (hoursMatch) return parseFloat(hoursMatch[1]);
  }
  
  return null;
}

// ============================================================================
// KEYWORD EXTRACTION
// ============================================================================

function extractKeywords(answer: string, category: string): string[] | null {
  const a = answer.toLowerCase();
  const keywords: string[] = [];
  
  // Workout barriers
  if (category === 'workout') {
    if (a.includes('no time') || a.includes('too busy')) keywords.push('no time');
    if (a.includes('too tired') || a.includes('exhausted') || a.includes('fatigue')) keywords.push('too tired');
    if (a.includes('forgot') || a.includes('didn\'t remember')) keywords.push('forgot');
    if (a.includes('injury') || a.includes('hurt') || a.includes('pain')) keywords.push('injury');
    if (a.includes('not motivated') || a.includes('no motivation')) keywords.push('no motivation');
    if (a.includes('sick') || a.includes('ill')) keywords.push('sick');
  }
  
  // Stress triggers
  if (category === 'stress') {
    if (a.includes('work') || a.includes('job') || a.includes('deadline')) keywords.push('work');
    if (a.includes('family') || a.includes('relationship')) keywords.push('family');
    if (a.includes('financial') || a.includes('money')) keywords.push('financial');
    if (a.includes('health')) keywords.push('health');
    if (a.includes('sleep')) keywords.push('sleep');
  }
  
  // Pain locations
  if (category === 'pain') {
    if (a.includes('back')) keywords.push('back');
    if (a.includes('knee')) keywords.push('knee');
    if (a.includes('shoulder')) keywords.push('shoulder');
    if (a.includes('neck')) keywords.push('neck');
    if (a.includes('hip')) keywords.push('hip');
    if (a.includes('ankle')) keywords.push('ankle');
    if (a.includes('wrist')) keywords.push('wrist');
    if (a.includes('elbow')) keywords.push('elbow');
  }
  
  return keywords.length > 0 ? keywords : null;
}

// ============================================================================
// AI-POWERED EXTRACTION
// ============================================================================

async function extractWithAI(
  question: string,
  answer: string,
  category: string
): Promise<ParsedAnswer | null> {
  const client = getOpenAI();
  if (!client) return null;
  
  const prompt = `Extract structured data from this health interview answer.

Question: "${question}"
Answer: "${answer}"
Category: ${category}

Extract:
1. Numeric value (if applicable): rating 1-10, hours, count, percentage
2. Text value (if applicable): brief description or single value
3. Array value (if applicable): list of barriers, triggers, symptoms, or locations
4. Subcategory: specific aspect (quality, barriers, triggers, symptoms, adherence, side_effects, etc.)

Return ONLY a JSON object:
{
  "numericValue": number or null,
  "textValue": string or null,
  "arrayValue": string[] or null,
  "subcategory": string or null,
  "confidence": 0.0 to 1.0
}

Examples:
- "I slept 6 hours, quality was poor" → {"numericValue": 6, "textValue": "poor quality", "subcategory": "hours", "confidence": 0.9}
- "I didn't workout because I had no time and was too tired" → {"arrayValue": ["no time", "too tired"], "subcategory": "barriers", "confidence": 0.85}
- "My stress level is about 7 out of 10, mostly from work deadlines" → {"numericValue": 7, "arrayValue": ["work", "deadlines"], "subcategory": "level", "confidence": 0.9}`;
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 200,
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      numericValue: result.numericValue || undefined,
      textValue: result.textValue || undefined,
      arrayValue: result.arrayValue || undefined,
      category,
      subcategory: result.subcategory || undefined,
      confidence: result.confidence || 0.7,
      extractionMethod: 'ai',
      questionText: question,
      answerText: answer,
    };
  } catch (error) {
    logger.error('❌ [PARSER] AI extraction failed', {
      error: (error as Error).message,
    });
    return null;
  }
}

// ============================================================================
// FALLBACK EXTRACTION
// ============================================================================

function extractWithFallback(
  question: string,
  answer: string,
  category: string
): ParsedAnswer {
  const numericValue = extractNumericValue(answer, category);
  const arrayValue = extractKeywords(answer, category);
  
  let subcategory: string | undefined;
  let extractionMethod: 'keyword' | 'numeric' = 'keyword';
  
  if (numericValue !== null) {
    subcategory = category === 'sleep' ? 'hours' : 'level';
    extractionMethod = 'numeric';
  } else if (arrayValue) {
    subcategory = category === 'workout' ? 'barriers' : 
                  category === 'stress' ? 'triggers' : 
                  category === 'pain' ? 'locations' : 'keywords';
  }
  
  return {
    numericValue: numericValue || undefined,
    arrayValue: arrayValue || undefined,
    textValue: answer.length <= 100 ? answer : undefined,
    category,
    subcategory,
    confidence: numericValue !== null ? 0.8 : arrayValue ? 0.6 : 0.4,
    extractionMethod,
    questionText: question,
    answerText: answer,
  };
}

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

export async function parseInterviewAnswer(
  question: string,
  answer: string,
  questionId?: string
): Promise<ParsedAnswer> {
  // Detect category from question
  const category = detectCategory(question);
  
  // Try AI extraction first
  const aiResult = await extractWithAI(question, answer, category);
  if (aiResult && aiResult.confidence >= 0.7) {
    logger.info('✅ [PARSER] AI extraction successful', {
      category,
      confidence: aiResult.confidence,
    });
    return { ...aiResult, questionId };
  }
  
  // Fallback to keyword/numeric extraction
  logger.info('⚠️ [PARSER] Using fallback extraction', { category });
  const fallbackResult = extractWithFallback(question, answer, category);
  return { ...fallbackResult, questionId };
}

// ============================================================================
// SAVE TO DATABASE
// ============================================================================

export async function saveInterviewSignal(
  userId: string,
  sessionId: string,
  parsedAnswer: ParsedAnswer
): Promise<InterviewSignal | null> {
  try {
    const signal: any = {
      id: randomUUID(),
      user_id: userId,
      session_id: sessionId,
      signal_date: new Date().toISOString().split('T')[0],
      category: parsedAnswer.category,
      subcategory: parsedAnswer.subcategory || null,
      numeric_value: parsedAnswer.numericValue || null,
      text_value: parsedAnswer.textValue || null,
      array_value: parsedAnswer.arrayValue ? JSON.stringify(parsedAnswer.arrayValue) : null,
      confidence: parsedAnswer.confidence,
      extraction_method: parsedAnswer.extractionMethod,
      question_text: parsedAnswer.questionText,
      answer_text: parsedAnswer.answerText,
      question_id: parsedAnswer.questionId || null,
      metadata: {},
    };
    
    const { data, error } = await supabase
      .from('interview_signals')
      .insert(signal)
      .select()
      .single();
    
    if (error) {
      logger.error('❌ [PARSER] Failed to save signal', {
        error: error.message,
      });
      return null;
    }
    
    logger.info('✅ [PARSER] Signal saved', {
      signalId: data.id,
      category: parsedAnswer.category,
      confidence: parsedAnswer.confidence,
    });
    
    return {
      id: data.id,
      userId: data.user_id,
      sessionId: data.session_id,
      signalDate: data.signal_date,
      category: data.category,
      subcategory: data.subcategory,
      numericValue: data.numeric_value,
      textValue: data.text_value,
      arrayValue: data.array_value ? JSON.parse(data.array_value) : undefined,
      confidence: data.confidence,
      extractionMethod: data.extraction_method,
      questionText: data.question_text,
      answerText: data.answer_text,
      questionId: data.question_id,
      metadata: data.metadata,
    };
  } catch (error) {
    logger.error('❌ [PARSER] Error saving signal', {
      error: (error as Error).message,
    });
    return null;
  }
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

export async function parseAndSaveInterviewAnswers(
  userId: string,
  sessionId: string,
  qaPairs: Array<{ question: string; answer: string; questionId?: string }>
): Promise<InterviewSignal[]> {
  const signals: InterviewSignal[] = [];
  
  for (const pair of qaPairs) {
    const parsed = await parseInterviewAnswer(pair.question, pair.answer, pair.questionId);
    const saved = await saveInterviewSignal(userId, sessionId, parsed);
    if (saved) {
      signals.push(saved);
    }
  }
  
  logger.info('✅ [PARSER] Batch processing complete', {
    userId,
    sessionId,
    totalPairs: qaPairs.length,
    signalsSaved: signals.length,
  });
  
  return signals;
}
