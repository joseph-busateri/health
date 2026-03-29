import { randomUUID } from 'crypto';

import { getDashboardSummary } from './structuredDailyLogService';
import { sendDailyInterviewNotification } from './notificationService';
import { selectVerbalPrompt } from './verbalPromptService';
import { applyInterviewOutputsToEngines, getEngineSnapshot } from './engineStateService';
import type { ControlTowerSummary } from '../types/dailyLog';
import type {
  DailyInterviewSession,
  EngineSnapshot,
  InterviewSubmissionInput,
} from '../types/interviewAgent';

const sessionStore = new Map<string, DailyInterviewSession[]>();

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
  const existing = (sessionStore.get(userId) ?? []).find(session => session.date === date && session.status === 'pending');
  if (existing) {
    return existing;
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

  const sessions = sessionStore.get(userId) ?? [];
  sessionStore.set(userId, [session, ...sessions]);

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
  const sessions = sessionStore.get(userId) ?? [];
  const today = todayIsoDate();
  return sessions.find(session => session.date === today) ?? null;
};

export const submitInterviewSession = async (
  userId: string,
  sessionId: string,
  submission: InterviewSubmissionInput
): Promise<{ session: DailyInterviewSession; engineSnapshot: EngineSnapshot }> => {
  const sessions = sessionStore.get(userId) ?? [];
  const target = sessions.find(session => session.id === sessionId);

  if (!target) {
    throw new Error('Interview session not found.');
  }

  if (target.status === 'completed') {
    return {
      session: target,
      engineSnapshot: await getEngineSnapshot(userId),
    };
  }

  const engineSnapshot = await applyInterviewOutputsToEngines(userId, submission);

  target.status = 'completed';
  target.completedAt = new Date().toISOString();
  target.submission = submission;

  return {
    session: target,
    engineSnapshot,
  };
};
