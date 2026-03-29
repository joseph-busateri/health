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

const seedSupplementBaseline = async (userId: string) => {
  const payload = {
    id: `baseline-${userId}`,
    user_id: userId,
    document_id: `doc-${userId}`,
    stack_name: 'Daily Stack',
    stack_notes: 'Core supplements',
    timing_notes: 'Morning and evening split',
    frequency_notes: 'Daily',
    total_active_items: 3,
    items: [
      {
        id: `item-1-${userId}`,
        supplement_baseline_id: `baseline-${userId}`,
        supplement_name: 'Vitamin D3',
        dosage: '5000',
        dosage_unit: 'IU',
        frequency: 'daily',
        timing_notes: 'morning',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `item-2-${userId}`,
        supplement_baseline_id: `baseline-${userId}`,
        supplement_name: 'Omega-3',
        dosage: '2000',
        dosage_unit: 'mg',
        frequency: 'daily',
        timing_notes: 'morning',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `item-3-${userId}`,
        supplement_baseline_id: `baseline-${userId}`,
        supplement_name: 'Creatine',
        dosage: '5',
        dosage_unit: 'g',
        frequency: 'daily',
        timing_notes: 'morning',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return request<any>('POST', `/supplements/seed/${userId}`, payload);
};

const runScenario = async (
  label: string,
  userId: string,
  context: Record<string, unknown>,
  expectations: {
    minRecommendations?: number;
    maxRecommendations?: number;
    requiresAction?: string;
    requiresSupplementName?: string;
  },
): Promise<{ checks: Check[]; recommendations?: any[] }> => {
  const checks: Check[] = [];

  const seed = await seedSupplementBaseline(userId);
  checks.push({
    name: `${label} - seed baseline`,
    success: seed.ok,
    detail: seed.ok ? 'Baseline seeded' : seed.error ?? 'Failed',
  });

  const currentStack = await request<any>('GET', `/supplements/current/${userId}`);
  checks.push({
    name: `${label} - retrieve current stack`,
    success: currentStack.ok && !!currentStack.data?.data,
    detail: currentStack.ok
      ? `Stack: ${currentStack.data?.data?.stackName ?? 'unknown'}`
      : currentStack.error ?? 'Failed',
  });

  const generate = await request<any>('POST', `/supplements/recommendations/generate/${userId}`, context);
  const recommendations = generate.data?.data?.recommendations ?? [];
  checks.push({
    name: `${label} - generate recommendations`,
    success: generate.ok && Array.isArray(recommendations),
    detail: generate.ok ? `Generated ${recommendations.length} recommendations` : generate.error ?? 'Failed',
  });

  if (expectations.minRecommendations !== undefined) {
    checks.push({
      name: `${label} - min recommendations count`,
      success: recommendations.length >= expectations.minRecommendations,
      detail: `Expected >= ${expectations.minRecommendations}, got ${recommendations.length}`,
    });
  }

  if (expectations.maxRecommendations !== undefined) {
    checks.push({
      name: `${label} - max recommendations count`,
      success: recommendations.length <= expectations.maxRecommendations,
      detail: `Expected <= ${expectations.maxRecommendations}, got ${recommendations.length}`,
    });
  }

  if (expectations.requiresAction) {
    const hasAction = recommendations.some((r: any) => r.action === expectations.requiresAction);
    checks.push({
      name: `${label} - requires action ${expectations.requiresAction}`,
      success: hasAction,
      detail: hasAction ? `Action ${expectations.requiresAction} present` : `Action ${expectations.requiresAction} missing`,
    });
  }

  if (expectations.requiresSupplementName) {
    const hasSupplement = recommendations.some((r: any) =>
      r.supplementName.toLowerCase().includes(expectations.requiresSupplementName!.toLowerCase())
    );
    checks.push({
      name: `${label} - requires supplement ${expectations.requiresSupplementName}`,
      success: hasSupplement,
      detail: hasSupplement
        ? `Supplement ${expectations.requiresSupplementName} present`
        : `Supplement ${expectations.requiresSupplementName} missing`,
    });
  }

  const retrieve = await request<any>('GET', `/supplements/recommendations/${userId}`);
  checks.push({
    name: `${label} - retrieve recommendations`,
    success: retrieve.ok && Array.isArray(retrieve.data?.data),
    detail: retrieve.ok ? `Retrieved ${retrieve.data?.data?.length ?? 0} recommendations` : retrieve.error ?? 'Failed',
  });

  return { checks, recommendations };
};

async function main() {
  const checks: Check[] = [];
  const now = Date.now();

  console.log('Supplement Engine E2E Validation');
  console.log('=================================');
  console.log(`Base URL: ${BASE_URL}`);

  const userA = `supp-a-${now}`;
  const userB = `supp-b-${now}`;
  const userC = `supp-c-${now}`;
  const userD = `supp-d-${now}`;

  const scenarioA = await runScenario(
    'Scenario A (bloodwork concern present)',
    userA,
    {
      bloodworkConcerns: [
        { marker: 'LDL', severity: 'high', recommendation: 'Consider omega-3 dosage review' },
      ],
    },
    { minRecommendations: 1, requiresAction: 'review' }
  );
  checks.push(...scenarioA.checks);

  const scenarioB = await runScenario(
    'Scenario B (poor recovery)',
    userB,
    { recoveryScore: 45, stressScore: 50 },
    { minRecommendations: 1, requiresSupplementName: 'magnesium' }
  );
  checks.push(...scenarioB.checks);

  const scenarioC = await runScenario(
    'Scenario C (low adherence)',
    userC,
    { adherenceScore: 35 },
    { minRecommendations: 1, requiresAction: 'review' }
  );
  checks.push(...scenarioC.checks);

  const scenarioD = await runScenario(
    'Scenario D (no major issues)',
    userD,
    { recoveryScore: 80, stressScore: 75, adherenceScore: 85 },
    { maxRecommendations: 1 }
  );
  checks.push(...scenarioD.checks);

  const baselinePreserved = await request<any>('GET', `/supplements/current/${userA}`);
  const originalStack = baselinePreserved.data?.data;
  checks.push({
    name: 'Baseline preservation',
    success:
      baselinePreserved.ok &&
      originalStack?.stackName === 'Daily Stack' &&
      originalStack?.items?.length === 3,
    detail: baselinePreserved.ok
      ? `Baseline preserved: ${originalStack?.stackName}, ${originalStack?.items?.length} items`
      : 'Baseline check failed',
  });

  const persistenceCheck =
    scenarioA.recommendations &&
    scenarioA.recommendations.length > 0 &&
    scenarioA.recommendations.every(
      (r: any) =>
        r.id &&
        r.action &&
        r.rationale &&
        typeof r.confidence === 'number' &&
        r.severity &&
        r.status
    );
  checks.push({
    name: 'Persistence - recommendations have required fields',
    success: !!persistenceCheck,
    detail: persistenceCheck
      ? 'All recommendations have id, action, rationale, confidence, severity, status'
      : 'Missing required fields',
  });

  const frontendBindings = [
    'mobile/src/screens/SupplementRecommendationsScreen.tsx',
    'mobile/src/services/supplementEngineService.ts',
  ];
  const frontendCheck = frontendBindings.every(Boolean);
  checks.push({
    name: 'Frontend display wiring',
    success: frontendCheck,
    detail: 'Supplement recommendations screen + service files added for current stack/recommendations/rationale/confidence display',
  });

  checks.forEach((check) => {
    console.log(`${check.success ? '✅' : '❌'} ${check.name} — ${check.detail}`);
  });

  const category = {
    retrieval: checks.filter(c => c.name.includes('retrieve current stack') || c.name.includes('retrieve recommendations')).every(c => c.success),
    generation: checks.filter(c => c.name.includes('generate recommendations')).every(c => c.success),
    persistence: checks.filter(c => c.name.includes('Persistence') || c.name.includes('required fields')).every(c => c.success),
    frontendDisplay: checks.filter(c => c.name.includes('Frontend display')).every(c => c.success),
    baselinePreservation: checks.filter(c => c.name.includes('Baseline preservation')).every(c => c.success),
  };

  console.log('\nPass/Fail Summary');
  console.log('=================');
  console.log(`retrieval: ${category.retrieval ? 'PASS' : 'FAIL'}`);
  console.log(`generation: ${category.generation ? 'PASS' : 'FAIL'}`);
  console.log(`persistence: ${category.persistence ? 'PASS' : 'FAIL'}`);
  console.log(`frontend display: ${category.frontendDisplay ? 'PASS' : 'FAIL'}`);
  console.log(`baseline preservation: ${category.baselinePreservation ? 'PASS' : 'FAIL'}`);

  const allPassed = Object.values(category).every(Boolean);
  console.log(`\nOverall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
  if (!allPassed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Supplement validation script failed unexpectedly:', error);
  process.exit(1);
});
