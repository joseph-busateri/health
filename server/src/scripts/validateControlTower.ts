import { __testing } from '../services/structuredDailyLogService';
import { selectVerbalPrompt } from '../services/verbalPromptService';
import type {
  ComponentTrend,
  DailyLogRecord,
  HealthComponentKey,
} from '../types/dailyLog';
import type { BaselineConfig } from '../types/baselineConfig';
import type { MealLogRecord } from '../types/mealLog';
import type { ReminderListResponse, ReminderRecord, ReminderType } from '../types/reminder';
import type {
  CardioMetricRecord,
  SexualHealthCheckInRecord,
  SexualHealthStatusRecord,
  SexualHealthStatusLevel,
} from '../types/healthMetrics';

const { buildControlTowerSummary } = __testing;

const baseDate = new Date();
baseDate.setHours(12, 0, 0, 0);

const baseline: BaselineConfig = {
  userId: 'validation-user',
  defaultSleepTarget: 7.5,
  stressTolerance: 3,
  recoverySensitivity: 0.5,
};

type ScoreBand = 'low' | 'moderate' | 'high';

interface ScenarioExpectation {
  recBand?: ScoreBand;
  perfBand?: ScoreBand;
  metBand?: ScoreBand;
  cvBand?: ScoreBand;
  shBand?: ScoreBand;
  overallBand?: ScoreBand;
  overallStatus?: 'Optimal' | 'Stable' | 'At Risk';
  cvTrend?: ComponentTrend;
  shTrend?: ComponentTrend;
  recommendationPattern?: RegExp;
  primaryFocus?: HealthComponentKey[];
  primaryPromptPattern?: RegExp;
  followUpExpected?: boolean;
  extraChecks?: (summaryScore: number, components: Record<string, { score: number | null }>) => { pass: boolean; message: string };
}

interface ScenarioConfig {
  name: string;
  logs: DailyLogRecord[];
  mealLogs: MealLogRecord[];
  reminders: ReminderListResponse;
  cardioMetrics?: CardioMetricRecord[];
  sexualCheckIns?: SexualHealthCheckInRecord[];
  sexualStatus?: SexualHealthStatusRecord | null;
  expectation: ScenarioExpectation;
}

const statusToBand: Record<'Optimal' | 'Stable' | 'At Risk', ScoreBand> = {
  Optimal: 'high',
  Stable: 'moderate',
  'At Risk': 'low',
};

const round = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const toBand = (score: number | null): ScoreBand => {
  if (score === null || Number.isNaN(score)) {
    return 'low';
  }
  if (score >= 80) {
    return 'high';
  }
  if (score >= 60) {
    return 'moderate';
  }
  return 'low';
};

const makeLog = (idSuffix: string, daysAgo: number, values: Partial<DailyLogRecord>): DailyLogRecord => {
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() - daysAgo);
  const isoDate = date.toISOString();

  return {
    id: `log-${idSuffix}`,
    userId: baseline.userId,
    date: isoDate.split('T')[0],
    sleepHours: values.sleepHours ?? 7,
    recoveryFeeling: values.recoveryFeeling ?? 3,
    stressLevel: values.stressLevel ?? 3,
    workoutAdherence: values.workoutAdherence ?? 70,
    notes: values.notes,
    embedding: [],
    createdAt: isoDate,
    updatedAt: isoDate,
  };
};

const makeMealLog = (idSuffix: string, daysAgo: number): MealLogRecord => {
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() - daysAgo);
  const iso = date.toISOString();
  return {
    id: `meal-${idSuffix}`,
    userId: baseline.userId,
    takenAt: iso,
    photoUri: `mock://meal/${idSuffix}`,
    mealLabel: 'dinner',
    notes: undefined,
    aiStatus: 'complete',
    createdAt: iso,
  } as MealLogRecord;
};

const makeReminder = (idSuffix: string, type: ReminderType, due: boolean, overrides: Partial<ReminderRecord> = {}): ReminderRecord => {
  const createdAt = new Date(baseDate);
  createdAt.setMonth(baseDate.getMonth() - 1);
  return {
    id: `reminder-${idSuffix}`,
    userId: baseline.userId,
    reminderType: type,
    title: overrides.title ?? (type === 'weekly_sexual_health' ? 'Sexual Health Check-in' : type === 'quarterly_bloodwork' ? 'Quarterly Bloodwork' : 'Reminder'),
    description:
      overrides.description ??
      (type === 'weekly_sexual_health'
        ? 'Weekly accountability touchpoint'
        : type === 'quarterly_bloodwork'
          ? 'Schedule quarterly labs to stay ahead of markers.'
          : 'Auto-generated reminder'),
    cadence: overrides.cadence ?? (type === 'quarterly_bloodwork' ? 'quarterly' : type === 'weekly_sexual_health' ? 'weekly' : 'monthly'),
    nextDueAt: new Date(baseDate.getTime() + (due ? 0 : 3 * 24 * 60 * 60 * 1000)).toISOString(),
    lastCompletedAt: due ? null : new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    createdAt: createdAt.toISOString(),
    ...overrides,
  };
};

const emptyReminderList: ReminderListResponse = {
  reminders: [],
  dueReminders: [],
};

const buildReminderList = (...seeds: Array<{ record: ReminderRecord; due: boolean }>): ReminderListResponse => {
  const reminders = seeds.map((seed) => seed.record);
  const dueReminders = seeds.filter((seed) => seed.due).map((seed) => seed.record);
  return { reminders, dueReminders };
};

const makeCardioMetric = (
  idSuffix: string,
  daysAgo: number,
  values: Pick<CardioMetricRecord, 'systolic' | 'diastolic' | 'restingHeartRate'>,
): CardioMetricRecord => {
  const takenAt = new Date(baseDate);
  takenAt.setDate(baseDate.getDate() - daysAgo);
  return {
    userId: baseline.userId,
    takenAt: takenAt.toISOString(),
    systolic: values.systolic,
    diastolic: values.diastolic,
    restingHeartRate: values.restingHeartRate,
    source: 'validation',
    notes: `cardio-${idSuffix}`,
  };
};

const makeSexualCheckIn = (
  idSuffix: string,
  daysAgo: number,
  values: Pick<SexualHealthCheckInRecord, 'desireLevel' | 'satisfactionLevel' | 'stressImpact' | 'status'>,
): SexualHealthCheckInRecord => {
  const takenAt = new Date(baseDate);
  takenAt.setDate(baseDate.getDate() - daysAgo);
  return {
    userId: baseline.userId,
    takenAt: takenAt.toISOString(),
    desireLevel: values.desireLevel,
    satisfactionLevel: values.satisfactionLevel,
    stressImpact: values.stressImpact,
    status: values.status,
    notes: `sexual-${idSuffix}`,
  };
};

const makeSexualStatus = (
  status: SexualHealthStatusLevel,
  daysAgo: number,
  confidence = 0.6,
): SexualHealthStatusRecord => {
  const takenAt = new Date(baseDate);
  takenAt.setDate(baseDate.getDate() - daysAgo);
  return {
    userId: baseline.userId,
    takenAt: takenAt.toISOString(),
    status,
    confidence,
    summary: `status-${status}`,
  };
};

const scenario1: ScenarioConfig = {
  name: 'Scenario 1: Poor recovery & workouts, strong nutrition',
  logs: [
    makeLog('1a', 0, { sleepHours: 5, recoveryFeeling: 2, stressLevel: 4, workoutAdherence: 35 }),
    makeLog('1b', 1, { sleepHours: 5.5, recoveryFeeling: 2, stressLevel: 4, workoutAdherence: 40 }),
    makeLog('1c', 2, { sleepHours: 5.8, recoveryFeeling: 3, stressLevel: 4, workoutAdherence: 45 }),
  ],
  mealLogs: [0, 1, 2, 3, 4].map((offset) => makeMealLog(`1-${offset}`, offset)),
  reminders: emptyReminderList,
  expectation: {
    recBand: 'low',
    perfBand: 'low',
    metBand: 'moderate',
    overallBand: 'low',
    overallStatus: 'At Risk',
    recommendationPattern: /Recovery, Performance/,
    primaryFocus: ['rec', 'perf'],
    primaryPromptPattern: /Recovery is down/,
    followUpExpected: true,
  },
};

const scenario2: ScenarioConfig = {
  name: 'Scenario 2: Strong recovery & workouts, moderate nutrition',
  logs: [
    makeLog('2a', 0, { sleepHours: 8.2, recoveryFeeling: 5, stressLevel: 2, workoutAdherence: 95 }),
    makeLog('2b', 1, { sleepHours: 7.9, recoveryFeeling: 4, stressLevel: 2, workoutAdherence: 90 }),
    makeLog('2c', 2, { sleepHours: 8, recoveryFeeling: 5, stressLevel: 2, workoutAdherence: 88 }),
  ],
  mealLogs: [0, 1, 3, 4, 6].map((offset) => makeMealLog(`2-${offset}`, offset)),
  reminders: {
    reminders: [makeReminder('2', 'weekly_sexual_health', false)],
    dueReminders: [],
  },
  expectation: {
    recBand: 'high',
    perfBand: 'high',
    metBand: 'moderate',
    overallBand: 'high',
    overallStatus: 'Optimal',
    recommendationPattern: /Focus today: Cardiovascular/,
    primaryFocus: [],
    primaryPromptPattern: /steady/i,
    followUpExpected: false,
  },
};

const scenario3: ScenarioConfig = {
  name: 'Scenario 3: Mixed inputs with weighted aggregation check',
  logs: [
    makeLog('3a', 0, { sleepHours: 6.8, recoveryFeeling: 3, stressLevel: 3, workoutAdherence: 75 }),
    makeLog('3b', 1, { sleepHours: 7.2, recoveryFeeling: 4, stressLevel: 2, workoutAdherence: 80 }),
    makeLog('3c', 2, { sleepHours: 6.4, recoveryFeeling: 3, stressLevel: 3, workoutAdherence: 65 }),
  ],
  mealLogs: [0, 4].map((offset) => makeMealLog(`3-${offset}`, offset)),
  reminders: {
    reminders: [makeReminder('3', 'weekly_sexual_health', false)],
    dueReminders: [],
  },
  expectation: {
    recBand: 'moderate',
    perfBand: 'moderate',
    metBand: 'low',
    overallBand: 'moderate',
    overallStatus: 'Stable',
    extraChecks: (overallScore, components) => {
      const weights: Record<string, number> = { rec: 0.25, perf: 0.2, met: 0.2, cv: 0.2, sh: 0.15 };
      const manual = Object.entries(components).reduce((total, [key, component]) => {
        const score = component.score ?? 60;
        return total + weights[key] * score;
      }, 0);
      const withinTolerance = Math.abs(manual - overallScore) <= 1;
      return {
        pass: withinTolerance,
        message: `Weighted average check ${withinTolerance ? 'passed' : 'failed'} (manual=${round(manual)}, reported=${round(overallScore)})`,
      };
    },
    recommendationPattern: /Focus today: Metabolic, Cardiovascular/,
    primaryFocus: ['rec', 'met'],
    primaryPromptPattern: /Recovery trend dipped/,
    followUpExpected: true,
  },
};

const scenario4: ScenarioConfig = {
  name: 'Scenario 4: Low cardiovascular readiness',
  logs: [
    makeLog('4a', 0, { stressLevel: 4, sleepHours: 6.2, recoveryFeeling: 3, workoutAdherence: 60 }),
    makeLog('4b', 1, { stressLevel: 3, sleepHours: 6.5, recoveryFeeling: 3, workoutAdherence: 62 }),
  ],
  mealLogs: [0, 2, 4].map((offset) => makeMealLog(`4-${offset}`, offset)),
  reminders: buildReminderList({ record: makeReminder('4a', 'quarterly_bloodwork', true), due: true }),
  cardioMetrics: [
    makeCardioMetric('4-0', 0, { systolic: 145, diastolic: 92, restingHeartRate: 82 }),
    makeCardioMetric('4-1', 2, { systolic: 138, diastolic: 88, restingHeartRate: 78 }),
    makeCardioMetric('4-2', 4, { systolic: 130, diastolic: 84, restingHeartRate: 74 }),
  ],
  expectation: {
    recBand: 'moderate',
    perfBand: 'low',
    metBand: 'low',
    cvBand: 'low',
    overallStatus: 'At Risk',
    cvTrend: 'Declining',
    recommendationPattern: /Cardio/i, 
    primaryFocus: ['rec', 'perf'],
    primaryPromptPattern: /Recovery trend dipped/,
    followUpExpected: true,
  },
};

const scenario5: ScenarioConfig = {
  name: 'Scenario 5: Strong cardiovascular readiness',
  logs: [
    makeLog('5a', 0, { stressLevel: 2, sleepHours: 8.2, recoveryFeeling: 5, workoutAdherence: 92 }),
    makeLog('5b', 1, { stressLevel: 2, sleepHours: 8, recoveryFeeling: 5, workoutAdherence: 90 }),
  ],
  mealLogs: [0, 1, 2, 3, 4].map((offset) => makeMealLog(`5-${offset}`, offset)),
  reminders: buildReminderList(
    { record: makeReminder('5a', 'quarterly_bloodwork', false), due: false },
    { record: makeReminder('5b', 'weekly_sexual_health', false), due: false },
  ),
  cardioMetrics: [
    makeCardioMetric('5-0', 0, { systolic: 110, diastolic: 70, restingHeartRate: 56 }),
    makeCardioMetric('5-1', 2, { systolic: 112, diastolic: 72, restingHeartRate: 58 }),
    makeCardioMetric('5-2', 4, { systolic: 114, diastolic: 74, restingHeartRate: 60 }),
  ],
  sexualCheckIns: [
    makeSexualCheckIn('5-0', 0, { desireLevel: 4, satisfactionLevel: 5, stressImpact: 2, status: 'Aligned' }),
  ],
  sexualStatus: makeSexualStatus('Aligned', 0, 0.8),
  expectation: {
    cvBand: 'high',
    overallStatus: 'Optimal',
    cvTrend: 'Improving',
    recommendationPattern: /Momentum is solid|Cardio vitals look strong/, 
    primaryFocus: [],
    primaryPromptPattern: /steady|anything specific/i,
    followUpExpected: false,
  },
};

const scenario6: ScenarioConfig = {
  name: 'Scenario 6: Low sexual health cadence',
  logs: [makeLog('6a', 0, { sleepHours: 7, recoveryFeeling: 3, stressLevel: 3, workoutAdherence: 70 })],
  mealLogs: [0].map((offset) => makeMealLog(`6-${offset}`, offset)),
  reminders: buildReminderList({ record: makeReminder('6a', 'weekly_sexual_health', true), due: true }),
  sexualCheckIns: [
    makeSexualCheckIn('6-0', 0, { desireLevel: 2, satisfactionLevel: 2, stressImpact: 4, status: 'Concerned' }),
    makeSexualCheckIn('6-1', 7, { desireLevel: 2, satisfactionLevel: 3, stressImpact: 4, status: 'Monitoring' }),
  ],
  sexualStatus: makeSexualStatus('Concerned', 0, 0.4),
  expectation: {
    shBand: 'low',
    shTrend: 'Declining',
    recommendationPattern: /Metabolic, Cardiovascular, Sexual Health/, 
    primaryFocus: ['met', 'sh'],
    primaryPromptPattern: /Nutrition consistency/,
    followUpExpected: true,
  },
};

const scenario7: ScenarioConfig = {
  name: 'Scenario 7: Strong sexual health cadence',
  logs: [makeLog('7a', 0, { stressLevel: 2, recoveryFeeling: 4, workoutAdherence: 80 })],
  mealLogs: [0].map((offset) => makeMealLog(`7-${offset}`, offset)),
  reminders: buildReminderList({ record: makeReminder('7a', 'weekly_sexual_health', false), due: false }),
  cardioMetrics: [
    makeCardioMetric('7-0', 0, { systolic: 106, diastolic: 66, restingHeartRate: 54 }),
    makeCardioMetric('7-1', 3, { systolic: 118, diastolic: 76, restingHeartRate: 62 }),
    makeCardioMetric('7-2', 6, { systolic: 110, diastolic: 70, restingHeartRate: 58 }),
  ],
  sexualCheckIns: [
    makeSexualCheckIn('7-0', 0, { desireLevel: 4, satisfactionLevel: 5, stressImpact: 2, status: 'Aligned' }),
    makeSexualCheckIn('7-1', 7, { desireLevel: 4, satisfactionLevel: 4, stressImpact: 2, status: 'Aligned' }),
  ],
  sexualStatus: makeSexualStatus('Aligned', 0, 0.8),
  expectation: {
    shBand: 'high',
    shTrend: 'Improving',
    cvBand: 'high',
    cvTrend: 'Improving',
    overallStatus: 'Stable',
    recommendationPattern: /Focus today: Metabolic/,
    primaryFocus: ['met'],
    primaryPromptPattern: /Nutrition consistency/,
    followUpExpected: false,
  },
};

const scenario8: ScenarioConfig = {
  name: 'Scenario 8: Mixed CV/SH with other components',
  logs: [
    makeLog('8a', 0, { sleepHours: 5.5, recoveryFeeling: 2, stressLevel: 4, workoutAdherence: 55 }),
    makeLog('8b', 1, { sleepHours: 6, recoveryFeeling: 3, stressLevel: 4, workoutAdherence: 60 }),
  ],
  mealLogs: [0, 3, 5].map((offset) => makeMealLog(`8-${offset}`, offset)),
  reminders: buildReminderList(
    { record: makeReminder('8a', 'weekly_sexual_health', true), due: true },
    { record: makeReminder('8b', 'quarterly_bloodwork', false), due: false },
  ),
  cardioMetrics: [
    makeCardioMetric('8-0', 0, { systolic: 120, diastolic: 80, restingHeartRate: 68 }),
    makeCardioMetric('8-1', 3, { systolic: 125, diastolic: 82, restingHeartRate: 72 }),
  ],
  sexualCheckIns: [
    makeSexualCheckIn('8-0', 0, { desireLevel: 4, satisfactionLevel: 3, stressImpact: 3, status: 'Monitoring' }),
    makeSexualCheckIn('8-1', 7, { desireLevel: 3, satisfactionLevel: 3, stressImpact: 3, status: 'Monitoring' }),
  ],
  sexualStatus: makeSexualStatus('Monitoring', 0, 0.6),
  expectation: {
    recBand: 'low',
    perfBand: 'low',
    cvBand: 'low',
    shBand: 'low',
    overallStatus: 'At Risk',
    recommendationPattern: /Recovery, Performance/,
    primaryFocus: ['rec', 'perf'],
    primaryPromptPattern: /Recovery is down/,
    followUpExpected: true,
  },
};

const scenarios: ScenarioConfig[] = [scenario1, scenario2, scenario3, scenario4, scenario5, scenario6, scenario7, scenario8];

interface ScenarioOutcome {
  name: string;
  passed: boolean;
  details: string[];
}

const formatComponentLine = (key: string, score: number | null, status: string, trend: string, insights?: string[]): string => {
  const scoreText = score === null ? '—' : round(score).toString();
  const insightsText = insights && insights.length > 0 ? ` | Insights: ${insights.join('; ')}` : '';
  return `${key.toUpperCase()}: score=${scoreText}, status=${status}, trend=${trend}${insightsText}`;
};

const evaluateScenario = (scenario: ScenarioConfig): ScenarioOutcome => {
  const summary = buildControlTowerSummary(
    baseline,
    scenario.reminders,
    scenario.mealLogs,
    scenario.logs,
    scenario.cardioMetrics ?? [],
    scenario.sexualCheckIns ?? [],
    scenario.sexualStatus ?? null,
  );
  const { expectation } = scenario;

  const rec = summary.components.rec;
  const perf = summary.components.perf;
  const met = summary.components.met;
  const cv = summary.components.cv;
  const sh = summary.components.sh;

  const recBand = toBand(rec.score);
  const perfBand = toBand(perf.score);
  const metBand = toBand(met.score);
  const overallBand = statusToBand[summary.overallStatus === 'No Data' ? 'At Risk' : summary.overallStatus];

  const details: string[] = [
    `Overall: score=${round(summary.overallScore ?? NaN)}, status=${summary.overallStatus}, trend=${summary.overallTrend}`,
    formatComponentLine('rec', rec.score, rec.status, rec.trend, rec.insights),
    formatComponentLine('perf', perf.score, perf.status, perf.trend, perf.insights),
    formatComponentLine('met', met.score, met.status, met.trend, met.insights),
    formatComponentLine('cv', summary.components.cv.score, summary.components.cv.status, summary.components.cv.trend, summary.components.cv.insights),
    formatComponentLine('sh', summary.components.sh.score, summary.components.sh.status, summary.components.sh.trend, summary.components.sh.insights),
    `Recommendation summary: ${summary.recommendationSummary}`,
  ];

  const bandChecks = [
    { name: 'Recovery band', expected: expectation.recBand, actual: recBand },
    { name: 'Performance band', expected: expectation.perfBand, actual: perfBand },
    { name: 'Metabolic band', expected: expectation.metBand, actual: metBand },
    { name: 'Overall band', expected: expectation.overallBand, actual: expectation.overallBand ? overallBand : undefined },
  ];

  const statusCheck = {
    name: 'Overall status',
    expected: expectation.overallStatus,
    actual: summary.overallStatus,
  };

  const failedChecks = bandChecks
    .filter((check) => check.expected !== undefined && check.expected !== check.actual)
    .map((check) => `${check.name} expected ${check.expected} but got ${check.actual}`);

  if (statusCheck.expected && statusCheck.expected !== summary.overallStatus) {
    failedChecks.push(`Overall status expected ${statusCheck.expected} but got ${statusCheck.actual}`);
  }

  if (expectation.cvBand) {
    const cvBand = toBand(cv.score);
    if (cvBand !== expectation.cvBand) {
      failedChecks.push(`Cardio band expected ${expectation.cvBand} but got ${cvBand}`);
    }
  }

  if (expectation.shBand) {
    const shBand = toBand(sh.score);
    if (shBand !== expectation.shBand) {
      failedChecks.push(`Sexual health band expected ${expectation.shBand} but got ${shBand}`);
    }
  }

  if (expectation.cvTrend && cv.trend !== expectation.cvTrend) {
    failedChecks.push(`Cardio trend expected ${expectation.cvTrend} but got ${cv.trend}`);
  }

  if (expectation.shTrend && sh.trend !== expectation.shTrend) {
    failedChecks.push(`Sexual health trend expected ${expectation.shTrend} but got ${sh.trend}`);
  }

  if (expectation.extraChecks) {
    const extraResult = expectation.extraChecks(summary.overallScore ?? 0, summary.components as Record<string, { score: number | null }>);
    details.push(extraResult.message);
    if (!extraResult.pass) {
      failedChecks.push('Extra weighted scoring check failed');
    }
  }

  if (expectation.recommendationPattern && !expectation.recommendationPattern.test(summary.recommendationSummary)) {
    failedChecks.push(`Recommendation summary mismatch: ${summary.recommendationSummary}`);
  }

  const prompt = selectVerbalPrompt({ controlTower: summary });
  if (expectation.primaryFocus) {
    const focusMatch = JSON.stringify(prompt.focusComponents) === JSON.stringify(expectation.primaryFocus);
    if (!focusMatch) {
      failedChecks.push(`Prompt focus expected ${expectation.primaryFocus.join(',')} but got ${prompt.focusComponents.join(',')}`);
    }
  }

  if (expectation.primaryPromptPattern && !expectation.primaryPromptPattern.test(prompt.primaryPrompt)) {
    failedChecks.push(`Primary prompt mismatch: ${prompt.primaryPrompt}`);
  }

  if (typeof expectation.followUpExpected === 'boolean') {
    const hasFollowUp = Boolean(prompt.followUpPrompt);
    if (hasFollowUp !== expectation.followUpExpected) {
      failedChecks.push(`Follow-up prompt expectation mismatch (expected ${expectation.followUpExpected ? 'present' : 'absent'}).`);
    }
  }

  const passed = failedChecks.length === 0;

  if (passed) {
    details.push('Scenario result: PASS');
  } else {
    details.push(`Scenario result: FAIL -> ${failedChecks.join('; ')}`);
  }

  return {
    name: scenario.name,
    passed,
    details,
  };
};

const outcomes = scenarios.map(evaluateScenario);

outcomes.forEach((outcome) => {
  console.log(`\n=== ${outcome.name} ===`);
  outcome.details.forEach((line) => console.log(line));
});

const passCount = outcomes.filter((outcome) => outcome.passed).length;

console.log('\n==========================================');
console.log(`Validation summary: ${passCount}/${outcomes.length} scenarios passed.`);
if (passCount === outcomes.length) {
  console.log('Overall result: ✅ PASS');
} else {
  console.log('Overall result: ❌ FAIL');
}
console.log('==========================================');
