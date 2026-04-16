import { randomUUID } from 'crypto';

import { getDashboardSummary } from './structuredDailyLogService';
import { sendDailyInterviewNotification } from './notificationService';
import { selectVerbalPrompt } from './verbalPromptService';
import { applyInterviewOutputsToEngines, getEngineSnapshot } from './engineStateService';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import type { ControlTowerSummary } from '../types/dailyLog';
import type {
  DailyInterviewSession,
  EngineSnapshot,
  InterviewSubmissionInput,
} from '../types/interviewAgent';

const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);

const dynamicQuestionBank: Record<string, string> = {
  rec: 'How did sleep quality and recovery feel over the last 24 hours?',
  perf: 'What was the biggest blocker to workout adherence today?',
  met: 'Were nutrition habits consistent or disrupted today?',
  cv: 'Any cardio or blood pressure observations worth logging?',
  sh: 'Any sexual health or libido change you want to track?',
};

const normalizeDynamicQuestions = (focusComponents: string[]): string[] => {
  const selected = focusComponents.map(component => dynamicQuestionBank[component]).filter(Boolean);
  if (selected.length === 0) {
    return ['What would make tomorrow a stronger health day across training, recovery, and nutrition?'];
  }
  return selected;
};

const buildFallbackControlTower = (): ControlTowerSummary => ({
  overallScore: null,
  overallStatus: 'No Data',
  overallTrend: 'Stable',
  recommendationSummary: 'Share your day so we can generate tailored adjustments.',
  components: {
    rec: { key: 'rec', label: 'Recovery', score: null, status: 'At Risk', trend: 'Stable' },
    perf: { key: 'perf', label: 'Performance', score: null, status: 'At Risk', trend: 'Stable' },
    met: { key: 'met', label: 'Metabolic', score: null, status: 'At Risk', trend: 'Stable' },
    cv: { key: 'cv', label: 'Cardiovascular', score: null, status: 'At Risk', trend: 'Stable' },
    sh: { key: 'sh', label: 'Sexual Health', score: null, status: 'At Risk', trend: 'Stable' },
  },
});

export const createOrRefreshDailyInterviewSession = async (userId: string): Promise<DailyInterviewSession> => {
  let controlTower = buildFallbackControlTower();
  try {
    const dashboard = await getDashboardSummary(userId);
    controlTower = dashboard.controlTower;
  } catch (_error) {
    controlTower = buildFallbackControlTower();
  }

  const selection = selectVerbalPrompt({ controlTower });

  const date = todayIsoDate();
  
  // Check for existing session in database
  try {
    const { data: existingData, error: fetchError } = await supabase
      .from('daily_interview_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('status', 'pending')
      .single();

    if (existingData && !fetchError) {
      logger.info('📋 [INTERVIEW] Returning existing session', { userId, date });
      return {
        id: existingData.id,
        userId: existingData.user_id,
        date: existingData.date,
        primaryPrompt: existingData.primary_prompt,
        followUpPrompt: existingData.follow_up_prompt,
        dynamicQuestions: existingData.dynamic_questions || [],
        focusComponents: existingData.focus_components || [],
        reason: existingData.reason,
        status: existingData.status,
        createdAt: existingData.created_at,
        submission: existingData.submission,
        completedAt: existingData.completed_at,
      };
    }
  } catch (error) {
    logger.warn('⚠️ [INTERVIEW] Error checking for existing session', {
      error: (error as Error).message,
    });
  }

  const session: DailyInterviewSession = {
    id: randomUUID(),
    userId,
    date,
    primaryPrompt: selection.primaryPrompt,
    followUpPrompt: selection.followUpPrompt,
    dynamicQuestions: normalizeDynamicQuestions(selection.focusComponents),
    focusComponents: selection.focusComponents,
    reason: selection.reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Persist to database
  try {
    const { error: insertError } = await supabase
      .from('daily_interview_sessions')
      .insert({
        id: session.id,
        user_id: session.userId,
        date: session.date,
        status: session.status,
        primary_prompt: session.primaryPrompt,
        follow_up_prompt: session.followUpPrompt,
        dynamic_questions: session.dynamicQuestions,
        focus_components: session.focusComponents,
        reason: session.reason,
        created_at: session.createdAt,
      });

    if (insertError) {
      logger.error('❌ [INTERVIEW] Failed to persist session to database', {
        error: insertError.message,
      });
    } else {
      logger.info('✅ [INTERVIEW] Session persisted to database', { sessionId: session.id });
    }
  } catch (error) {
    logger.error('❌ [INTERVIEW] Database error', {
      error: (error as Error).message,
    });
  }

  await sendDailyInterviewNotification(userId, {
    sessionId: session.id,
    date: session.date,
    primaryPrompt: session.primaryPrompt,
    followUpPrompt: session.followUpPrompt,
    dynamicQuestions: session.dynamicQuestions,
  });

  return session;
};

export const getTodayInterviewSession = async (userId: string): Promise<DailyInterviewSession | null> => {
  const today = todayIsoDate();
  
  try {
    const { data, error } = await supabase
      .from('daily_interview_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        logger.info('📋 [INTERVIEW] No session found for today', { userId, date: today });
        return null;
      }
      logger.error('❌ [INTERVIEW] Failed to fetch today session', {
        error: error.message,
      });
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      primaryPrompt: data.primary_prompt,
      followUpPrompt: data.follow_up_prompt,
      dynamicQuestions: data.dynamic_questions || [],
      focusComponents: data.focus_components || [],
      reason: data.reason,
      status: data.status,
      createdAt: data.created_at,
      submission: data.submission,
      completedAt: data.completed_at,
    };
  } catch (error) {
    logger.error('❌ [INTERVIEW] Database error fetching today session', {
      error: (error as Error).message,
    });
    return null;
  }
};

export const submitInterviewSession = async (
  userId: string,
  sessionId: string,
  submission: InterviewSubmissionInput
): Promise<{ session: DailyInterviewSession; engineSnapshot: EngineSnapshot }> => {
  // Fetch session from database
  try {
    const { data: target, error: fetchError } = await supabase
      .from('daily_interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !target) {
      logger.error('❌ [INTERVIEW] Session not found', { sessionId, userId });
      throw new Error('Interview session not found.');
    }

    // If already completed, return existing data
    if (target.status === 'completed') {
      logger.info('📋 [INTERVIEW] Session already completed', { sessionId });
      return {
        session: {
          id: target.id,
          userId: target.user_id,
          date: target.date,
          primaryPrompt: target.primary_prompt,
          followUpPrompt: target.follow_up_prompt,
          dynamicQuestions: target.dynamic_questions || [],
          focusComponents: target.focus_components || [],
          reason: target.reason,
          status: target.status,
          createdAt: target.created_at,
          submission: target.submission,
          completedAt: target.completed_at,
        },
        engineSnapshot: await getEngineSnapshot(userId),
      };
    }

    // Apply interview outputs to engines
    const engineSnapshot = await applyInterviewOutputsToEngines(userId, submission);

    // Update session in database
    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('daily_interview_sessions')
      .update({
        status: 'completed',
        completed_at: completedAt,
        submission: submission,
      })
      .eq('id', sessionId);

    if (updateError) {
      logger.error('❌ [INTERVIEW] Failed to update session', {
        error: updateError.message,
      });
    } else {
      logger.info('✅ [INTERVIEW] Session completed and persisted', { sessionId });
    }

    return {
      session: {
        id: target.id,
        userId: target.user_id,
        date: target.date,
        primaryPrompt: target.primary_prompt,
        followUpPrompt: target.follow_up_prompt,
        dynamicQuestions: target.dynamic_questions || [],
        focusComponents: target.focus_components || [],
        reason: target.reason,
        status: 'completed',
        createdAt: target.created_at,
        submission: submission,
        completedAt: completedAt,
      },
      engineSnapshot,
    };
  } catch (error) {
    logger.error('❌ [INTERVIEW] Error submitting session', {
      error: (error as Error).message,
    });
    throw error;
  }
};
