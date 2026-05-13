/**
 * Phase 22: Interview Signals Controller
 * 
 * Purpose: API endpoints for retrieving structured interview signals
 * Features: Query by user, category, date range, trends, recurring patterns
 */

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

// ============================================================================
// GET SIGNALS BY USER AND DATE RANGE
// ============================================================================

export const getInterviewSignals = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { category, subcategory, startDate, endDate, limit = 100 } = req.query;

    let query = supabase
      .from('interview_signals')
      .select('*')
      .eq('user_id', userId);

    if (category) {
      query = query.eq('category', category as string);
    }

    if (subcategory) {
      query = query.eq('subcategory', subcategory as string);
    }

    if (startDate) {
      query = query.gte('signal_date', startDate as string);
    }

    if (endDate) {
      query = query.lte('signal_date', endDate as string);
    }

    const { data, error } = await query
      .order('signal_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      logger.error('❌ [SIGNALS] Failed to fetch signals', { error: error.message });
      return res.status(500).json({ error: 'Failed to fetch interview signals' });
    }

    logger.info('✅ [SIGNALS] Signals retrieved', {
      userId,
      count: data.length,
      category,
    });

    return res.json({
      signals: data.map(signal => ({
        id: signal.id,
        userId: signal.user_id,
        sessionId: signal.session_id,
        signalDate: signal.signal_date,
        category: signal.category,
        subcategory: signal.subcategory,
        numericValue: signal.numeric_value,
        textValue: signal.text_value,
        arrayValue: signal.array_value ? JSON.parse(signal.array_value) : null,
        confidence: signal.confidence,
        extractionMethod: signal.extraction_method,
        questionText: signal.question_text,
        answerText: signal.answer_text,
        createdAt: signal.created_at,
      })),
      count: data.length,
    });
  } catch (error) {
    logger.error('❌ [SIGNALS] Error fetching signals', {
      error: (error as Error).message,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// GET LATEST SIGNAL VALUE
// ============================================================================

export const getLatestSignalValue = async (req: Request, res: Response) => {
  try {
    const { userId, category } = req.params;
    const { subcategory } = req.query;

    const { data, error } = await supabase.rpc('get_latest_signal_value', {
      p_user_id: userId,
      p_category: category,
      p_subcategory: subcategory as string || null,
    });

    if (error) {
      logger.error('❌ [SIGNALS] Failed to fetch latest signal', { error: error.message });
      return res.status(500).json({ error: 'Failed to fetch latest signal value' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No signal found' });
    }

    const signal = data[0];

    logger.info('✅ [SIGNALS] Latest signal retrieved', {
      userId,
      category,
      subcategory,
    });

    return res.json({
      signalDate: signal.signal_date,
      numericValue: signal.numeric_value,
      textValue: signal.text_value,
      arrayValue: signal.array_value,
      confidence: signal.confidence,
    });
  } catch (error) {
    logger.error('❌ [SIGNALS] Error fetching latest signal', {
      error: (error as Error).message,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// GET SIGNAL TREND
// ============================================================================

export const getSignalTrend = async (req: Request, res: Response) => {
  try {
    const { userId, category } = req.params;
    const { subcategory, days = 30 } = req.query;

    const { data, error } = await supabase.rpc('get_signal_trend', {
      p_user_id: userId,
      p_category: category,
      p_subcategory: subcategory as string || null,
      p_days: parseInt(days as string),
    });

    if (error) {
      logger.error('❌ [SIGNALS] Failed to fetch signal trend', { error: error.message });
      return res.status(500).json({ error: 'Failed to fetch signal trend' });
    }

    logger.info('✅ [SIGNALS] Signal trend retrieved', {
      userId,
      category,
      days,
      dataPoints: data.length,
    });

    return res.json({
      trend: data.map((point: any) => ({
        date: point.signal_date,
        avgValue: point.avg_numeric_value,
        count: point.signal_count,
      })),
      category,
      subcategory,
      days: parseInt(days as string),
    });
  } catch (error) {
    logger.error('❌ [SIGNALS] Error fetching signal trend', {
      error: (error as Error).message,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// GET RECURRING PATTERNS
// ============================================================================

export const getRecurringPatterns = async (req: Request, res: Response) => {
  try {
    const { userId, category, subcategory } = req.params;
    const { days = 90 } = req.query;

    const { data, error } = await supabase.rpc('get_recurring_patterns', {
      p_user_id: userId,
      p_category: category,
      p_subcategory: subcategory,
      p_days: parseInt(days as string),
    });

    if (error) {
      logger.error('❌ [SIGNALS] Failed to fetch recurring patterns', { error: error.message });
      return res.status(500).json({ error: 'Failed to fetch recurring patterns' });
    }

    logger.info('✅ [SIGNALS] Recurring patterns retrieved', {
      userId,
      category,
      subcategory,
      patternCount: data.length,
    });

    return res.json({
      patterns: data.map((pattern: any) => ({
        value: pattern.pattern_value,
        occurrences: pattern.occurrence_count,
        lastOccurrence: pattern.last_occurrence,
      })),
      category,
      subcategory,
      days: parseInt(days as string),
    });
  } catch (error) {
    logger.error('❌ [SIGNALS] Error fetching recurring patterns', {
      error: (error as Error).message,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// GET SIGNALS BY SESSION
// ============================================================================

export const getSignalsBySession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .from('interview_signals')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('❌ [SIGNALS] Failed to fetch session signals', { error: error.message });
      return res.status(500).json({ error: 'Failed to fetch session signals' });
    }

    logger.info('✅ [SIGNALS] Session signals retrieved', {
      sessionId,
      count: data.length,
    });

    return res.json({
      signals: data.map(signal => ({
        id: signal.id,
        category: signal.category,
        subcategory: signal.subcategory,
        numericValue: signal.numeric_value,
        textValue: signal.text_value,
        arrayValue: signal.array_value ? JSON.parse(signal.array_value) : null,
        confidence: signal.confidence,
        extractionMethod: signal.extraction_method,
        questionText: signal.question_text,
        answerText: signal.answer_text,
      })),
      sessionId,
      count: data.length,
    });
  } catch (error) {
    logger.error('❌ [SIGNALS] Error fetching session signals', {
      error: (error as Error).message,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// GET SIGNAL SUMMARY BY CATEGORY
// ============================================================================

export const getSignalSummary = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const { data, error } = await supabase
      .from('interview_signals')
      .select('category, subcategory, numeric_value, confidence, extraction_method')
      .eq('user_id', userId)
      .gte('signal_date', startDate.toISOString().split('T')[0]);

    if (error) {
      logger.error('❌ [SIGNALS] Failed to fetch signal summary', { error: error.message });
      return res.status(500).json({ error: 'Failed to fetch signal summary' });
    }

    // Group by category
    const summary: any = {};
    data.forEach(signal => {
      if (!summary[signal.category]) {
        summary[signal.category] = {
          count: 0,
          avgConfidence: 0,
          avgNumericValue: null,
          extractionMethods: {},
        };
      }

      summary[signal.category].count++;
      summary[signal.category].avgConfidence += signal.confidence;

      if (signal.numeric_value !== null) {
        if (summary[signal.category].avgNumericValue === null) {
          summary[signal.category].avgNumericValue = 0;
          summary[signal.category].numericCount = 0;
        }
        summary[signal.category].avgNumericValue += signal.numeric_value;
        summary[signal.category].numericCount++;
      }

      if (!summary[signal.category].extractionMethods[signal.extraction_method]) {
        summary[signal.category].extractionMethods[signal.extraction_method] = 0;
      }
      summary[signal.category].extractionMethods[signal.extraction_method]++;
    });

    // Calculate averages
    Object.keys(summary).forEach(category => {
      summary[category].avgConfidence = summary[category].avgConfidence / summary[category].count;
      if (summary[category].avgNumericValue !== null) {
        summary[category].avgNumericValue = summary[category].avgNumericValue / summary[category].numericCount;
      }
    });

    logger.info('✅ [SIGNALS] Signal summary retrieved', {
      userId,
      days,
      categories: Object.keys(summary).length,
    });

    return res.json({
      summary,
      days: parseInt(days as string),
      totalSignals: data.length,
    });
  } catch (error) {
    logger.error('❌ [SIGNALS] Error fetching signal summary', {
      error: (error as Error).message,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};
