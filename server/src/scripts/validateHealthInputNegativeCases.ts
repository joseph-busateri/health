/// <reference types="node" />
import 'dotenv/config';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

interface NegativeCase {
  name: string;
  method: 'POST';
  path: string;
  body: Record<string, unknown>;
  expectedStatus: number;
  expectedErrorIncludes?: string;
}

type CheckResult = {
  name: string;
  success: boolean;
  detail: string;
};

async function request<TResponse>(
  method: 'POST',
  path: string,
  body: Record<string, unknown>,
): Promise<ApiResponse<TResponse>> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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

function printResult(result: CheckResult) {
  console.log(`${result.success ? '✅' : '❌'} ${result.name} — ${result.detail}`);
}

async function main() {
  const userId = `health-inputs-neg-${Date.now()}`;

  const cases: NegativeCase[] = [
    {
      name: 'Body composition missing user_id',
      method: 'POST',
      path: '/body-composition/upload',
      body: { weight_kg: 80 },
      expectedStatus: 400,
      expectedErrorIncludes: 'user_id',
    },
    {
      name: 'Body composition missing file_uri and metrics',
      method: 'POST',
      path: '/body-composition/upload',
      body: { user_id: userId },
      expectedStatus: 400,
      expectedErrorIncludes: 'Either file_uri or at least one metric',
    },
    {
      name: 'Strength session missing entries',
      method: 'POST',
      path: '/strength/session',
      body: { user_id: userId },
      expectedStatus: 400,
      expectedErrorIncludes: 'entries is required',
    },
    {
      name: 'Strength session invalid entries payload',
      method: 'POST',
      path: '/strength/session',
      body: {
        user_id: userId,
        entries: [{ exercise_name: 'Bench Press', sets: [{ load_kg: 100 }] }],
      },
      expectedStatus: 400,
      expectedErrorIncludes: 'No valid strength entries',
    },
    {
      name: 'Tape measurement without any fields',
      method: 'POST',
      path: '/tape-measurement',
      body: { user_id: userId, notes: 'no measurements present' },
      expectedStatus: 400,
      expectedErrorIncludes: 'At least one tape measurement field is required',
    },
    {
      name: 'Nutrition extraction missing raw_text',
      method: 'POST',
      path: '/nutrition/extract',
      body: { user_id: userId },
      expectedStatus: 400,
      expectedErrorIncludes: 'raw_text',
    },
    {
      name: 'Nutrition extraction missing user_id',
      method: 'POST',
      path: '/nutrition/extract',
      body: { raw_text: 'Calories 300 Protein 20g' },
      expectedStatus: 400,
      expectedErrorIncludes: 'user_id',
    },
  ];

  const results: CheckResult[] = [];

  console.log('Health Input Negative Validation');
  console.log('==============================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${userId}\n`);

  for (const testCase of cases) {
    const response = await request<{ success?: boolean; error?: string }>(
      testCase.method,
      testCase.path,
      testCase.body,
    );

    const matchesStatus = response.status === testCase.expectedStatus;
    const errorText = (response.data && 'error' in response.data ? String(response.data.error ?? '') : response.error ?? '').toLowerCase();
    const matchesError = testCase.expectedErrorIncludes
      ? errorText.includes(testCase.expectedErrorIncludes.toLowerCase())
      : true;

    const success = matchesStatus && matchesError;

    results.push({
      name: `${testCase.method} ${testCase.path} (${testCase.name})`,
      success,
      detail: success
        ? `Received expected ${testCase.expectedStatus}`
        : `Expected ${testCase.expectedStatus}${testCase.expectedErrorIncludes ? ` with "${testCase.expectedErrorIncludes}"` : ''}, got ${response.status} and error "${errorText}"`,
    });
  }

  results.forEach(printResult);

  const allPassed = results.every(result => result.success);
  console.log(`\nOverall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);

  if (!allPassed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Negative validation script failed unexpectedly:', error);
  process.exit(1);
});
