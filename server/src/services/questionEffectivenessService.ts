/**
 * Phase 25: Question Effectiveness Service
 * 
 * Purpose: Track and analyze question performance to improve interview quality
 * Features: Effectiveness tracking, performance scoring, question optimization
 */

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface QuestionEffectiveness {
  id: string;
  userId: string;
  questionId: string;
  questionText: string;
  category: string;
  timesAsked: number;
  timesAnswered: number;
  timesSkipped: number;
  avgResponseQuality?: number;
  avgConfidence?: number;
  signalsExtracted: number;
  dataGapsFilled: number;
  correlationsDiscovered: number;
  firstAsked: string;
  lastAsked?: string;
  lastAnswered?: string;
}

// ============================================================================
// TRACK QUESTION ASKED
// ============================================================================

export async function trackQuestionAsked(
  userId: string,
  questionId: string,
  questionText: string,
  category: string
): Promise<boolean> {
  try {
    logger.info('📝 [QUESTION EFFECTIVENESS] Tracking question asked', {
      userId,
      questionId,
      category,
    });

    // Upsert question effectiveness record
    const { error } = await supabase
      .from('interview_question_effectiveness')
      .upsert({
        user_id: userId,
        question_id: questionId,
        question_text: questionText,
        category,
        times_asked: 1,
        last_asked: new Date().toISOString(),
      }, {
        onConflict: 'user_id,question_id',
        ignoreDuplicates: false,
      });

    if (error) {
      // If record exists, increment times_asked
      const { error: updateError } = await supabase.rpc('increment_question_asked', {
        p_user_id: userId,
        p_question_id: questionId,
      });

      if (updateError) {
        throw new Error(`Failed to track question: ${updateError.message}`);
      }
    }

    return true;
  } catch (error) {
    logger.error('❌ [QUESTION EFFECTIVENESS] Failed to track question asked', {
      error: (error as Error).message,
      userId,
      questionId,
    });
    return false;
  }
}

// ============================================================================
// TRACK QUESTION ANSWERED
// ============================================================================

export async function trackQuestionAnswered(
  userId: string,
  questionId: string,
  responseQuality: number,
  confidence: number
): Promise<boolean> {
  try {
    logger.info('✅ [QUESTION EFFECTIVENESS] Tracking question answered', {
      userId,
      questionId,
      responseQuality,
      confidence,
    });

    const { data: existing } = await supabase
      .from('interview_question_effectiveness')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();

    if (!existing) {
      logger.warn('⚠️ [QUESTION EFFECTIVENESS] Question not found, cannot track answer', {
        userId,
        questionId,
      });
      return false;
    }

    // Calculate new averages
    const newTimesAnswered = existing.times_answered + 1;
    const newAvgQuality = existing.avg_response_quality
      ? (existing.avg_response_quality * existing.times_answered + responseQuality) / newTimesAnswered
      : responseQuality;
    const newAvgConfidence = existing.avg_confidence
      ? (existing.avg_confidence * existing.times_answered + confidence) / newTimesAnswered
      : confidence;

    const { error } = await supabase
      .from('interview_question_effectiveness')
      .update({
        times_answered: newTimesAnswered,
        avg_response_quality: newAvgQuality,
        avg_confidence: newAvgConfidence,
        last_answered: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('question_id', questionId);

    if (error) {
      throw new Error(`Failed to track answer: ${error.message}`);
    }

    return true;
  } catch (error) {
    logger.error('❌ [QUESTION EFFECTIVENESS] Failed to track question answered', {
      error: (error as Error).message,
      userId,
      questionId,
    });
    return false;
  }
}

// ============================================================================
// TRACK QUESTION SKIPPED
// ============================================================================

export async function trackQuestionSkipped(
  userId: string,
  questionId: string
): Promise<boolean> {
  try {
    logger.info('⏭️ [QUESTION EFFECTIVENESS] Tracking question skipped', {
      userId,
      questionId,
    });

    const { data: existing } = await supabase
      .from('interview_question_effectiveness')
      .select('times_skipped')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();

    if (!existing) {
      logger.warn('⚠️ [QUESTION EFFECTIVENESS] Question not found, cannot track skip', {
        userId,
        questionId,
      });
      return false;
    }

    const { error } = await supabase
      .from('interview_question_effectiveness')
      .update({
        times_skipped: existing.times_skipped + 1,
      })
      .eq('user_id', userId)
      .eq('question_id', questionId);

    if (error) {
      throw new Error(`Failed to track skip: ${error.message}`);
    }

    return true;
  } catch (error) {
    logger.error('❌ [QUESTION EFFECTIVENESS] Failed to track question skipped', {
      error: (error as Error).message,
      userId,
      questionId,
    });
    return false;
  }
}

// ============================================================================
// GET QUESTION EFFECTIVENESS
// ============================================================================

export async function getQuestionEffectiveness(
  userId: string,
  questionId?: string
): Promise<QuestionEffectiveness[]> {
  try {
    logger.info('📊 [QUESTION EFFECTIVENESS] Getting question effectiveness', {
      userId,
      questionId,
    });

    let query = supabase
      .from('interview_question_effectiveness')
      .select('*')
      .eq('user_id', userId);

    if (questionId) {
      query = query.eq('question_id', questionId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get effectiveness: ${error.message}`);
    }

    const effectiveness: QuestionEffectiveness[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      questionId: row.question_id,
      questionText: row.question_text,
      category: row.category,
      timesAsked: row.times_asked,
      timesAnswered: row.times_answered,
      timesSkipped: row.times_skipped,
      avgResponseQuality: row.avg_response_quality ? parseFloat(row.avg_response_quality) : undefined,
      avgConfidence: row.avg_confidence ? parseFloat(row.avg_confidence) : undefined,
      signalsExtracted: row.signals_extracted,
      dataGapsFilled: row.data_gaps_filled,
      correlationsDiscovered: row.correlations_discovered,
      firstAsked: row.first_asked,
      lastAsked: row.last_asked,
      lastAnswered: row.last_answered,
    }));

    logger.info('✅ [QUESTION EFFECTIVENESS] Effectiveness retrieved', {
      userId,
      count: effectiveness.length,
    });

    return effectiveness;
  } catch (error) {
    logger.error('❌ [QUESTION EFFECTIVENESS] Failed to get effectiveness', {
      error: (error as Error).message,
      userId,
    });
    return [];
  }
}

// ============================================================================
// GET TOP PERFORMING QUESTIONS
// ============================================================================

export async function getTopPerformingQuestions(
  category: string,
  limit: number = 10
): Promise<QuestionEffectiveness[]> {
  try {
    logger.info('🏆 [QUESTION EFFECTIVENESS] Getting top performing questions', {
      category,
      limit,
    });

    const { data, error } = await supabase.rpc('get_top_questions_by_category', {
      p_category: category,
      p_limit: limit,
    });

    if (error) {
      throw new Error(`Failed to get top questions: ${error.message}`);
    }

    const questions: QuestionEffectiveness[] = (data || []).map((row: any) => ({
      id: '',
      userId: '',
      questionId: row.question_id,
      questionText: row.question_text,
      category,
      timesAsked: row.times_used,
      timesAnswered: 0,
      timesSkipped: 0,
      avgResponseQuality: parseFloat(row.avg_quality),
      signalsExtracted: 0,
      dataGapsFilled: 0,
      correlationsDiscovered: 0,
      firstAsked: '',
    }));

    logger.info('✅ [QUESTION EFFECTIVENESS] Top questions retrieved', {
      category,
      count: questions.length,
    });

    return questions;
  } catch (error) {
    logger.error('❌ [QUESTION EFFECTIVENESS] Failed to get top questions', {
      error: (error as Error).message,
      category,
    });
    return [];
  }
}

// ============================================================================
// CALCULATE QUESTION SCORE
// ============================================================================

export function calculateQuestionScore(effectiveness: QuestionEffectiveness): number {
  if (effectiveness.timesAsked === 0) return 0;

  const answerRate = effectiveness.timesAnswered / effectiveness.timesAsked;
  const quality = effectiveness.avgResponseQuality || 0.5;
  const confidence = effectiveness.avgConfidence || 0.5;

  // Score = (answer_rate * 0.4) + (quality * 0.3) + (confidence * 0.3)
  return answerRate * 0.4 + quality * 0.3 + confidence * 0.3;
}
