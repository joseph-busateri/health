/// <reference types="node" />
import 'dotenv/config';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

const makeUserId = () => `health-inputs-${Date.now()}`;

async function request<TResponse>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<ApiResponse<TResponse>> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
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

type CheckResult = {
  name: string;
  success: boolean;
  detail: string;
};

function printResult(result: CheckResult) {
  console.log(`${result.success ? '✅' : '❌'} ${result.name} — ${result.detail}`);
}

async function main() {
  const userId = makeUserId();
  const checks: CheckResult[] = [];

  console.log('Health Input Endpoint Validation');
  console.log('===============================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${userId}\n`);

  const bodyCompositionPost = await request<{ success: boolean; bodyComposition?: { id: string } }>(
    'POST',
    '/body-composition/upload',
    {
      user_id: userId,
      taken_at: new Date().toISOString(),
      source_type: 'manual_entry',
      weight_kg: 82.4,
      body_fat_percent: 15.6,
      lean_mass_kg: 69.5,
      visceral_fat_rating: 7,
      notes: 'Smoke test upload',
    },
  );

  checks.push({
    name: 'POST /body-composition/upload',
    success: bodyCompositionPost.ok && Boolean(bodyCompositionPost.data?.bodyComposition?.id),
    detail: bodyCompositionPost.ok
      ? `Created record ${bodyCompositionPost.data?.bodyComposition?.id ?? 'unknown'}`
      : bodyCompositionPost.error ?? 'Request failed',
  });

  const bodyCompositionHistory = await request<{ success: boolean; bodyCompositions?: Array<{ id: string }> }>(
    'GET',
    `/body-composition/${userId}`,
  );
  checks.push({
    name: 'GET /body-composition/:user_id',
    success: bodyCompositionHistory.ok && Array.isArray(bodyCompositionHistory.data?.bodyCompositions),
    detail: bodyCompositionHistory.ok
      ? `Returned ${(bodyCompositionHistory.data?.bodyCompositions ?? []).length} records`
      : bodyCompositionHistory.error ?? 'Request failed',
  });

  const strengthPost = await request<{ success: boolean; session?: { id: string; summaries?: unknown[] } }>(
    'POST',
    '/strength/session',
    {
      user_id: userId,
      session_date: new Date().toISOString(),
      program_name: 'Upper A',
      entries: [
        {
          exercise_name: 'Bench Press',
          sets: [
            { set_number: 1, reps: 8, load_kg: 60 },
            { set_number: 2, reps: 6, load_kg: 65 },
          ],
        },
      ],
    },
  );
  checks.push({
    name: 'POST /strength/session',
    success: strengthPost.ok && Boolean(strengthPost.data?.session?.id),
    detail: strengthPost.ok
      ? `Created session ${strengthPost.data?.session?.id ?? 'unknown'}`
      : strengthPost.error ?? 'Request failed',
  });

  const strengthLatest = await request<{ success: boolean; session?: { id: string } | null }>(
    'GET',
    `/strength/session/latest/${userId}`,
  );
  checks.push({
    name: 'GET /strength/session/latest/:user_id',
    success: strengthLatest.ok,
    detail: strengthLatest.ok
      ? `Latest session: ${strengthLatest.data?.session?.id ?? 'none'}`
      : strengthLatest.error ?? 'Request failed',
  });

  const tapePost = await request<{ success: boolean; measurement?: { id: string } }>(
    'POST',
    '/tape-measurement',
    {
      user_id: userId,
      unit: 'cm',
      waist: 83,
      chest: 101,
      neck: 38,
      right_arm: 35.2,
    },
  );
  checks.push({
    name: 'POST /tape-measurement',
    success: tapePost.ok && Boolean(tapePost.data?.measurement?.id),
    detail: tapePost.ok
      ? `Created measurement ${tapePost.data?.measurement?.id ?? 'unknown'}`
      : tapePost.error ?? 'Request failed',
  });

  const tapeHistory = await request<{ success: boolean; measurements?: Array<{ id: string }> }>(
    'GET',
    `/tape-measurements/${userId}`,
  );
  checks.push({
    name: 'GET /tape-measurements/:user_id',
    success: tapeHistory.ok && Array.isArray(tapeHistory.data?.measurements),
    detail: tapeHistory.ok
      ? `Returned ${(tapeHistory.data?.measurements ?? []).length} measurements`
      : tapeHistory.error ?? 'Request failed',
  });

  const nutritionPost = await request<{ success: boolean; extraction?: { id: string; foods?: string[] } }>(
    'POST',
    '/nutrition/extract',
    {
      user_id: userId,
      meal_label: 'Lunch',
      raw_text: 'Chicken breast, rice, olive oil. Calories 620 Protein 45g Carbs 58g Fat 19g Fiber 6g Sodium 520mg',
      notes: 'Smoke test nutrition entry',
    },
  );
  checks.push({
    name: 'POST /nutrition/extract',
    success: nutritionPost.ok && Boolean(nutritionPost.data?.extraction?.id),
    detail: nutritionPost.ok
      ? `Created extraction ${nutritionPost.data?.extraction?.id ?? 'unknown'}`
      : nutritionPost.error ?? 'Request failed',
  });

  const nutritionLatest = await request<{ success: boolean; extraction?: { id: string } | null }>(
    'GET',
    `/nutrition/entry/latest/${userId}`,
  );
  checks.push({
    name: 'GET /nutrition/entry/latest/:user_id',
    success: nutritionLatest.ok,
    detail: nutritionLatest.ok
      ? `Latest extraction: ${nutritionLatest.data?.extraction?.id ?? 'none'}`
      : nutritionLatest.error ?? 'Request failed',
  });

  checks.forEach(printResult);

  const allPassed = checks.every(check => check.success);
  console.log(`\nOverall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);

  if (!allPassed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Validation script failed unexpectedly:', error);
  process.exit(1);
});
