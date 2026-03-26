import 'dotenv/config';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

interface RequestOptions<TBody> {
  method: 'GET' | 'POST';
  path: string;
  body?: TBody;
}

interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

type ValidationResult = {
  step: string;
  success: boolean;
  details: string;
};

type DailyLogPayload = {
  user_id: string;
  date: string;
  sleep_hours: number;
  recovery_feeling: number;
  stress_level: number;
  workout_adherence: number;
  notes?: string;
};

type ScenarioPayload = Omit<DailyLogPayload, 'user_id' | 'date'>;

type ScenarioExpectations = {
  recoveryScore: 'low' | 'moderate' | 'high';
  overallHealthScore: number;
  status: 'Optimal' | 'Stable' | 'At Risk';
  recommendation: string;
  trendSummary: string;
};

type ScenarioDefinition = {
  name: string;
  payload: ScenarioPayload;
  expectations: ScenarioExpectations;
};

type ScenarioOutcome = {
  scenario: string;
  steps: ValidationResult[];
  mismatches: string[];
  overallSuccess: boolean;
};

async function apiRequest<TResponse, TBody = unknown>(
  options: RequestOptions<TBody>,
): Promise<ApiResponse<TResponse>> {
  const url = `${BASE_URL}${options.path}`;
  try {
    const response = await fetch(url, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json') ?? false;
    const data = (isJson ? await response.json() : null) as TResponse | null;

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
}

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const scenarios: ScenarioDefinition[] = [
  {
    name: 'Low sleep / high stress',
    payload: {
      sleep_hours: 5,
      recovery_feeling: 2,
      stress_level: 5,
      workout_adherence: 40,
      notes: 'Low sleep and high stress scenario.',
    },
    expectations: {
      recoveryScore: 'low',
      overallHealthScore: 40,
      status: 'At Risk',
      recommendation: 'Reduce workout intensity by 20% and prioritize recovery',
      trendSummary: 'Sleep trending low, Stress increasing, Recovery trending low',
    },
  },
  {
    name: 'Moderate recovery',
    payload: {
      sleep_hours: 6.5,
      recovery_feeling: 3,
      stress_level: 3,
      workout_adherence: 70,
      notes: 'Moderate recovery scenario.',
    },
    expectations: {
      recoveryScore: 'moderate',
      overallHealthScore: 100,
      status: 'Optimal',
      recommendation: 'Maintain normal workout and monitor recovery',
      trendSummary: 'Sleep stable, Stress steady, Recovery stable',
    },
  },
  {
    name: 'Good recovery',
    payload: {
      sleep_hours: 8,
      recovery_feeling: 5,
      stress_level: 1,
      workout_adherence: 95,
      notes: 'Good recovery scenario.',
    },
    expectations: {
      recoveryScore: 'high',
      overallHealthScore: 100,
      status: 'Optimal',
      recommendation: 'Push intensity today',
      trendSummary: 'Sleep trending high, Stress easing, Recovery strong',
    },
  },
];

async function runScenario(
  scenario: ScenarioDefinition,
  date: string,
  uniqueSuffix: string,
): Promise<ScenarioOutcome> {
  const userId = `step3-${slugify(scenario.name)}-${uniqueSuffix}`;
  const payload: DailyLogPayload = {
    user_id: userId,
    date,
    ...scenario.payload,
  };

  const steps: ValidationResult[] = [];
  const mismatches: string[] = [];

  const postResponse = await apiRequest<{
    success: boolean;
    logSaved: boolean;
    embeddingSaved: boolean;
    warning?: string;
    log: { id: string };
  }, DailyLogPayload>({
    method: 'POST',
    path: '/daily-log',
    body: payload,
  });

  let insertedLogId: string | null = null;

  if (postResponse.ok && postResponse.data && 'log' in postResponse.data) {
    insertedLogId = (postResponse.data as any).log.id;
    steps.push({
      step: 'POST /daily-log',
      success: Boolean(insertedLogId),
      details: insertedLogId ? `Inserted log with id ${insertedLogId}` : 'Response missing log id',
    });
  } else {
    steps.push({
      step: 'POST /daily-log',
      success: false,
      details: `Request failed: ${postResponse.error ?? 'Unknown error'}`,
    });
  }

  const logsResponse = await apiRequest<{ log: any }>({
    method: 'GET',
    path: `/daily-log/${userId}`,
  });

  const latestLog = logsResponse.ok && logsResponse.data ? (logsResponse.data as any).log : null;
  const matchesInsertedLog = Boolean(latestLog && insertedLogId && latestLog.id === insertedLogId);

  steps.push({
    step: 'GET /daily-log/:user_id',
    success: logsResponse.ok && matchesInsertedLog,
    details: logsResponse.ok
      ? matchesInsertedLog
        ? 'Retrieved latest log matching inserted id.'
        : 'Latest log does not match inserted id.'
      : `Request failed: ${logsResponse.error ?? 'No log returned.'}`,
  });

  const dashboardResponse = await apiRequest<{
    latestLog: any;
    recoveryScore: string | null;
    overallHealthScore: number | null;
    status: string;
    dailyRecommendation: string;
    trendSummary: unknown;
  }>({
    method: 'GET',
    path: `/dashboard/${userId}`,
  });

  const dashboard = dashboardResponse.data;
  const dashboardHasRequiredFields = Boolean(
    dashboard &&
      typeof dashboard.latestLog === 'object' && dashboard.latestLog !== null &&
      'recoveryScore' in dashboard &&
      'overallHealthScore' in dashboard &&
      'status' in dashboard &&
      'dailyRecommendation' in dashboard &&
      'trendSummary' in dashboard,
  );

  steps.push({
    step: 'GET /dashboard/:user_id',
    success: dashboardResponse.ok && dashboardHasRequiredFields,
    details: dashboardResponse.ok
      ? dashboardHasRequiredFields
        ? 'Dashboard returned expected structure.'
        : 'Dashboard missing required fields.'
      : `Request failed: ${dashboardResponse.error ?? 'Unknown error'}`,
  });

  const canValidateDashboard = dashboardResponse.ok && dashboardHasRequiredFields;

  if (!canValidateDashboard) {
    mismatches.push('Dashboard response invalid; skipping value checks.');
  } else {
    if (!insertedLogId) {
      mismatches.push('No inserted log id available for comparison.');
    } else if (!dashboard?.latestLog || dashboard.latestLog.id !== insertedLogId) {
      mismatches.push('Dashboard latestLog does not match inserted log id.');
    }

    if (dashboard?.recoveryScore !== scenario.expectations.recoveryScore) {
      mismatches.push(
        `Expected recoveryScore ${scenario.expectations.recoveryScore}, received ${dashboard?.recoveryScore}.`,
      );
    }

    if (dashboard?.overallHealthScore !== scenario.expectations.overallHealthScore) {
      mismatches.push(
        `Expected overallHealthScore ${scenario.expectations.overallHealthScore}, received ${dashboard?.overallHealthScore}.`,
      );
    }

    if (dashboard?.status !== scenario.expectations.status) {
      mismatches.push(`Expected status ${scenario.expectations.status}, received ${dashboard?.status}.`);
    }

    if (dashboard?.dailyRecommendation !== scenario.expectations.recommendation) {
      mismatches.push(
        `Expected dailyRecommendation "${scenario.expectations.recommendation}", received "${dashboard?.dailyRecommendation}".`,
      );
    }

    const trendSummary = typeof dashboard?.trendSummary === 'string' ? dashboard?.trendSummary : null;
    if (!trendSummary) {
      mismatches.push('Trend summary is missing or not a string.');
    } else if (trendSummary !== scenario.expectations.trendSummary) {
      mismatches.push(
        `Expected trendSummary "${scenario.expectations.trendSummary}", received "${trendSummary}".`,
      );
    }
  }

  const verifySuccess = canValidateDashboard && mismatches.length === 0;

  steps.push({
    step: 'Verify dashboard fields',
    success: verifySuccess,
    details: verifySuccess
      ? 'Dashboard includes expected latest log and summary values.'
      : `Dashboard validation issues: ${mismatches.join('; ')}`,
  });

  return {
    scenario: scenario.name,
    steps,
    mismatches,
    overallSuccess: steps.every((step) => step.success),
  };
}

async function main() {
  const today = new Date();
  const formattedDate = today.toISOString().slice(0, 10);

  const outcomes: ScenarioOutcome[] = [];

  for (let index = 0; index < scenarios.length; index += 1) {
    const scenario = scenarios[index];
    const suffix = `${Date.now()}-${index}`;
    outcomes.push(await runScenario(scenario, formattedDate, suffix));
  }

  console.log('\nStep 3 Validation Summary');
  console.log('===========================');

  outcomes.forEach((outcome) => {
    console.log(`\nScenario: ${outcome.scenario}`);
    outcome.steps.forEach((step) => {
      console.log(`${step.success ? '✅' : '❌'} ${step.step} — ${step.details}`);
    });

    if (outcome.mismatches.length > 0) {
      console.log('⚠️  Mismatches detected:');
      outcome.mismatches.forEach((issue) => console.log(`   • ${issue}`));
    } else {
      console.log('✅ All expectations matched for this scenario.');
    }

    console.log(`Scenario Result: ${outcome.overallSuccess ? 'PASS' : 'FAIL'}`);
  });

  const allPassed = outcomes.every((outcome) => outcome.overallSuccess);

  console.log('\nOverall Result:');
  console.log(allPassed ? '✅ ALL SCENARIOS PASSED' : '❌ ONE OR MORE SCENARIOS FAILED');

  if (!allPassed) {
    const failing = outcomes.filter((outcome) => !outcome.overallSuccess).map((outcome) => outcome.scenario);
    console.log('Failing Scenarios:', failing.join(', '));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Validation script encountered an unexpected error:', error);
  process.exit(1);
});
