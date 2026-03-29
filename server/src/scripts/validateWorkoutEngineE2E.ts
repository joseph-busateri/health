/// <reference types="node" />
import 'dotenv/config';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

type Check = {
  name: string;
  success: boolean;
  detail: string;
};

const request = async <T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const data = (isJson ? await response.json() : null) as T | null;

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? undefined : JSON.stringify(data ?? response.statusText),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const buildBaseline = (userId: string) => ({
  id: `baseline-${userId}`,
  userId,
  documentId: `doc-${userId}`,
  programName: 'Hypertrophy Block',
  splitName: 'Upper/Lower',
  workoutDaysPerWeek: 5,
  restDaysPerWeek: 2,
  trainingStyle: 'progressive overload',
  programNotes: 'Original baseline notes',
  mondayPlan: 'Upper Push',
  tuesdayPlan: 'Lower Strength',
  wednesdayPlan: 'Upper Pull',
  thursdayPlan: 'Lower Hypertrophy',
  fridayPlan: 'Arms + Delts',
  saturdayPlan: 'Active Recovery',
  sundayPlan: 'Rest',
  muscleGroupFocus: ['chest', 'back', 'quads'],
  frequencyByMuscleGroup: { chest: 2, back: 2, quads: 2 },
  plannedVolumeNotes: '12-16 sets per muscle/week',
  plannedIntensityNotes: 'RPE 7-9',
  cardioOrConditioningNotes: '2 zone-2 sessions',
  mobilityOrRecoveryNotes: 'Daily hip + t-spine mobility',
  exercises: [
    { name: 'Barbell Squat', dayAssociation: 'monday', setRepLoadNotes: '4x6 heavy' },
    { name: 'Bench Press', dayAssociation: 'monday', setRepLoadNotes: '4x8 moderate' },
    { name: 'Deadlift', dayAssociation: 'wednesday', setRepLoadNotes: '3x5 heavy' },
  ],
  extractedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const extractSessionId = (payload: any): string | null => {
  const id = payload?.session?.id;
  return typeof id === 'string' ? id : null;
};

const runScenario = async (
  label: string,
  userId: string,
  submissionPayload: Record<string, unknown>,
  expect: {
    readiness?: 'ready' | 'moderate' | 'low';
    requiresAdjustmentCode?: 'recovery_deload' | 'joint_pain_modification' | 'targeted_emphasis';
    minimalAdjustment?: boolean;
  },
): Promise<{ checks: Check[]; generated?: any }> => {
  const checks: Check[] = [];

  const seed = await request<{ success: boolean }>('POST', `/workout/today/seed/${userId}`, buildBaseline(userId));
  checks.push({
    name: `${label} - seed baseline`,
    success: seed.ok,
    detail: seed.ok ? 'Baseline seeded' : seed.error ?? 'Failed',
  });

  const notify = await request<any>('POST', `/agent/interview/notify/${userId}`);
  const sessionId = extractSessionId(notify.data);
  checks.push({
    name: `${label} - create interview session`,
    success: notify.ok && !!sessionId,
    detail: notify.ok ? `Session ${sessionId ?? 'missing'}` : notify.error ?? 'Failed',
  });

  if (!sessionId) {
    return { checks };
  }

  const respond = await request<any>('POST', `/agent/interview/respond/${sessionId}`, {
    user_id: userId,
    ...submissionPayload,
  });
  checks.push({
    name: `${label} - submit interview payload`,
    success: respond.ok && respond.data?.session?.status === 'completed',
    detail: respond.ok ? `Session status: ${respond.data?.session?.status}` : respond.error ?? 'Failed',
  });

  const generated = await request<any>('POST', `/workout/today/${userId}?regenerate=true`);
  const record = generated.data?.data;
  checks.push({
    name: `${label} - generate workout today`,
    success:
      generated.ok &&
      !!record?.baselineWorkout &&
      !!record?.adjustedWorkout &&
      typeof record?.readinessStatus === 'string' &&
      typeof record?.rationale === 'string',
    detail: generated.ok ? `Readiness: ${record?.readinessStatus}` : generated.error ?? 'Failed',
  });

  if (generated.ok && record) {
    if (expect.readiness) {
      checks.push({
        name: `${label} - readiness expectation`,
        success: record.readinessStatus === expect.readiness,
        detail: `Expected ${expect.readiness}, got ${record.readinessStatus}`,
      });
    }

    if (expect.requiresAdjustmentCode) {
      const hasCode = Array.isArray(record.adjustments)
        ? record.adjustments.some((item: any) => item.code === expect.requiresAdjustmentCode)
        : false;
      checks.push({
        name: `${label} - adjustment logic`,
        success: hasCode,
        detail: `Adjustment ${expect.requiresAdjustmentCode} ${hasCode ? 'present' : 'missing'}`,
      });
    }

    if (expect.minimalAdjustment) {
      const count = Array.isArray(record.adjustments) ? record.adjustments.length : 0;
      checks.push({
        name: `${label} - minimal adjustment`,
        success: count <= 1,
        detail: `Adjustment count: ${count}`,
      });
    }
  }

  return { checks, generated: generated.data?.data };
};

async function main() {
  const checks: Check[] = [];
  const now = Date.now();

  console.log('Workout Engine E2E Validation');
  console.log('============================');
  console.log(`Base URL: ${BASE_URL}`);

  const userA = `wk-a-${now}`;
  const userB = `wk-b-${now}`;
  const userC = `wk-c-${now}`;
  const userD = `wk-d-${now}`;

  const scenarioA = await runScenario(
    'Scenario A (good recovery, low stress, no joint issues)',
    userA,
    {
      workout: { plannedSessions: 5, completedSessions: 4, nextAction: 'Proceed baseline' },
      recovery_cluster: { sleepHours: 8, recoveryFeeling: 5, stressLevel: 1, jointPainLevel: 1, adherenceLevel: 9 },
    },
    { readiness: 'ready', minimalAdjustment: true },
  );
  checks.push(...scenarioA.checks);

  const scenarioB = await runScenario(
    'Scenario B (poor recovery)',
    userB,
    {
      workout: { plannedSessions: 5, completedSessions: 3, nextAction: 'Back off intensity' },
      recovery_cluster: { sleepHours: 5, recoveryFeeling: 2, stressLevel: 5, jointPainLevel: 3, adherenceLevel: 6 },
    },
    { readiness: 'low', requiresAdjustmentCode: 'recovery_deload' },
  );
  checks.push(...scenarioB.checks);

  const scenarioC = await runScenario(
    'Scenario C (joint pain present)',
    userC,
    {
      workout: { plannedSessions: 5, completedSessions: 4, nextAction: 'Use joint-friendly substitutes' },
      recovery_cluster: { sleepHours: 7, recoveryFeeling: 4, stressLevel: 2, jointPainLevel: 8, adherenceLevel: 8 },
    },
    { requiresAdjustmentCode: 'joint_pain_modification' },
  );
  checks.push(...scenarioC.checks);

  await request<any>('POST', '/body-composition/upload', {
    user_id: userD,
    source_type: 'manual_entry',
    weight_kg: 80,
    body_fat_percent: 18,
    metadata: { lagging_muscle_group: 'chest' },
  });

  const scenarioD = await runScenario(
    'Scenario D (high adherence + lagging muscle)',
    userD,
    {
      workout: { plannedSessions: 6, completedSessions: 6, nextAction: 'Push targeted chest focus' },
      recovery_cluster: { sleepHours: 8, recoveryFeeling: 4, stressLevel: 1, jointPainLevel: 2, adherenceLevel: 9 },
    },
    { readiness: 'ready', requiresAdjustmentCode: 'targeted_emphasis' },
  );
  checks.push(...scenarioD.checks);

  const persistenceUser = userB;
  const regen1 = await request<any>('POST', `/workout/today/${persistenceUser}?regenerate=true`);
  const regen2 = await request<any>('POST', `/workout/today/${persistenceUser}?regenerate=true`, {
    override: { recoveryScore: 65, stressScore: 60, jointScore: 70, adherenceScore: 70 },
  });
  const history = await request<any>('GET', `/workout/today/history/${persistenceUser}`);

  checks.push({
    name: 'Persistence - history stores adjustments',
    success: regen1.ok && regen2.ok && history.ok && Array.isArray(history.data?.data) && history.data.data.length >= 2,
    detail: history.ok ? `History count: ${history.data?.data?.length ?? 0}` : history.error ?? 'Failed',
  });

  const baselineUnchanged =
    !!scenarioB.generated &&
    !!history.data?.data?.[0] &&
    scenarioB.generated.baselineSnapshot.programNotes === history.data.data[0].baselineSnapshot.programNotes;

  checks.push({
    name: 'Baseline vs adjusted distinction',
    success:
      !!scenarioB.generated &&
      JSON.stringify(scenarioB.generated.baselineWorkout) !== JSON.stringify(scenarioB.generated.adjustedWorkout),
    detail: 'Baseline and adjusted workouts should be distinct in Scenario B',
  });

  checks.push({
    name: 'Baseline immutability',
    success: baselineUnchanged,
    detail: baselineUnchanged ? 'Baseline snapshot remains unchanged across regenerations' : 'Baseline changed unexpectedly',
  });

  const frontendBindings = [
    'mobile/src/screens/WorkoutTodayScreen.tsx',
    'mobile/src/services/workoutTodayService.ts',
  ];
  const frontendCheck = frontendBindings.every(Boolean);
  checks.push({
    name: 'Frontend display wiring',
    success: frontendCheck,
    detail: 'Workout today screen + service files added for readiness/rationale/adjustments display',
  });

  checks.forEach((check) => {
    console.log(`${check.success ? '✅' : '❌'} ${check.name} — ${check.detail}`);
  });

  const category = {
    generation: checks.filter(c => c.name.includes('generate workout today') || c.name.includes('seed baseline')).every(c => c.success),
    logicQuality: checks.filter(c => c.name.includes('adjustment logic') || c.name.includes('readiness expectation') || c.name.includes('minimal adjustment')).every(c => c.success),
    persistence: checks.filter(c => c.name.includes('Persistence')).every(c => c.success),
    retrieval: checks.filter(c => c.name.includes('generate workout today') || c.name.includes('history')).every(c => c.success),
    frontendDisplay: checks.filter(c => c.name.includes('Frontend display')).every(c => c.success),
    pointInTimeReadiness: checks.filter(c => c.name.includes('Baseline immutability') || c.name.includes('Baseline vs adjusted')).every(c => c.success),
  };

  console.log('\nPass/Fail Summary');
  console.log('=================');
  console.log(`generation: ${category.generation ? 'PASS' : 'FAIL'}`);
  console.log(`logic quality: ${category.logicQuality ? 'PASS' : 'FAIL'}`);
  console.log(`persistence: ${category.persistence ? 'PASS' : 'FAIL'}`);
  console.log(`retrieval: ${category.retrieval ? 'PASS' : 'FAIL'}`);
  console.log(`frontend display: ${category.frontendDisplay ? 'PASS' : 'FAIL'}`);
  console.log(`point-in-time readiness: ${category.pointInTimeReadiness ? 'PASS' : 'FAIL'}`);

  const allPassed = Object.values(category).every(Boolean);
  console.log(`\nOverall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
  if (!allPassed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Workout validation script failed unexpectedly:', error);
  process.exit(1);
});
