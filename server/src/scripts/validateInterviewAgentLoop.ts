/// <reference types="node" />
import 'dotenv/config';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

type CheckResult = {
  name: string;
  success: boolean;
  detail: string;
};

const request = async <T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown
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

const printCheck = (result: CheckResult) => {
  console.log(`${result.success ? '✅' : '❌'} ${result.name} — ${result.detail}`);
};

async function main() {
  const userId = `agent-loop-${Date.now()}`;
  const checks: CheckResult[] = [];

  console.log('Interview Agent Loop Validation');
  console.log('===============================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${userId}\n`);

  const notify = await request<{ success: boolean; session?: { id: string; dynamicQuestions?: string[] } }>(
    'POST',
    `/agent/interview/notify/${userId}`,
  );

  const sessionId = notify.data?.session?.id;
  checks.push({
    name: 'POST /agent/interview/notify/:user_id',
    success: notify.ok && typeof sessionId === 'string',
    detail: notify.ok ? `Session: ${sessionId ?? 'missing'}` : notify.error ?? 'Request failed',
  });

  const todayBefore = await request<{ success: boolean; session?: { id: string; status: string } | null }>(
    'GET',
    `/agent/interview/today/${userId}`,
  );
  checks.push({
    name: 'GET /agent/interview/today/:user_id (before response)',
    success: todayBefore.ok && todayBefore.data?.session?.status === 'pending',
    detail: todayBefore.ok
      ? `Status: ${todayBefore.data?.session?.status ?? 'missing'}`
      : todayBefore.error ?? 'Request failed',
  });

  const submit = sessionId
    ? await request<{
        success: boolean;
        session?: { status: string };
        engineSnapshot?: {
          workout?: { adherenceScore: number };
          supplement?: { adherenceScore: number };
          recoveryCluster?: { riskLevel: string };
        };
      }>('POST', `/agent/interview/respond/${sessionId}`, {
        user_id: userId,
        primary_response: 'Rough day but staying on plan.',
        follow_up_response: 'Need better sleep routine.',
        workout: {
          plannedSessions: 5,
          completedSessions: 3,
          barriers: 'Late meetings',
          nextAction: 'Shift two sessions earlier in the day',
        },
        supplement: {
          missedItems: 1,
          timingConsistency: 78,
          sideEffects: 'None',
          nextAction: 'Set evening supplement reminder',
        },
        recovery_cluster: {
          sleepHours: 6.2,
          recoveryFeeling: 3,
          stressLevel: 4,
          jointPainLevel: 3,
          adherenceLevel: 7,
          notes: 'Knees stiff after long desk days',
        },
      })
    : ({ ok: false, status: 0, data: null, error: 'No session id from notify step' } as ApiResponse<any>);

  checks.push({
    name: 'POST /agent/interview/respond/:session_id',
    success:
      submit.ok &&
      submit.data?.session?.status === 'completed' &&
      typeof submit.data?.engineSnapshot?.workout?.adherenceScore === 'number' &&
      typeof submit.data?.engineSnapshot?.supplement?.adherenceScore === 'number' &&
      typeof submit.data?.engineSnapshot?.recoveryCluster?.riskLevel === 'string',
    detail: submit.ok
      ? `Session status: ${submit.data?.session?.status ?? 'missing'}`
      : submit.error ?? 'Request failed',
  });

  const todayAfter = await request<{
    success: boolean;
    session?: { status: string; completedAt?: string } | null;
    engineSnapshot?: {
      workout?: { adherenceScore: number };
      supplement?: { adherenceScore: number };
      recoveryCluster?: { riskLevel: string };
    };
  }>('GET', `/agent/interview/today/${userId}`);

  checks.push({
    name: 'GET /agent/interview/today/:user_id (after response)',
    success:
      todayAfter.ok &&
      todayAfter.data?.session?.status === 'completed' &&
      typeof todayAfter.data?.engineSnapshot?.workout?.adherenceScore === 'number' &&
      typeof todayAfter.data?.engineSnapshot?.supplement?.adherenceScore === 'number' &&
      typeof todayAfter.data?.engineSnapshot?.recoveryCluster?.riskLevel === 'string',
    detail: todayAfter.ok
      ? `Status: ${todayAfter.data?.session?.status ?? 'missing'}`
      : todayAfter.error ?? 'Request failed',
  });

  checks.forEach(printCheck);

  const allPassed = checks.every(check => check.success);
  console.log(`\nOverall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
  if (!allPassed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Interview loop validation failed unexpectedly:', error);
  process.exit(1);
});
