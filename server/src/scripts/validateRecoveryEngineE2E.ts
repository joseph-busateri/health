/// <reference types="node" />
import 'dotenv/config';
import path from 'path';
import { existsSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';
console.log(`Using BASE_URL: ${BASE_URL}`);

type Check = { name: string; success: boolean; detail: string };

type RecoveryHistoryRecord = {
  date: string;
  recoveryScore: number;
  recoveryStatus: string;
  sourceInputs?: unknown;
  recommendation?: {
    summary?: string;
  };
};

const execFileAsync = promisify(execFile);

const getJson = async (route: string): Promise<{ ok: boolean; data: any; status: number }> => {
  const url = `${BASE_URL}${route}`;
  console.log(`\nCalling: ${url}`);

  try {
    const { stdout } = await execFileAsync('curl.exe', [
      '-s',
      '-w',
      '\n__STATUS__:%{http_code}',
      url,
    ]);

    const marker = '\n__STATUS__:';
    const markerIndex = stdout.lastIndexOf(marker);

    const body = markerIndex >= 0 ? stdout.slice(0, markerIndex) : stdout;
    const statusText = markerIndex >= 0 ? stdout.slice(markerIndex + marker.length).trim() : '0';
    const status = Number(statusText) || 0;

    let data: any = {};
    try {
      data = body ? JSON.parse(body) : {};
    } catch {
      data = { raw: body };
    }

    console.log(`Status: ${status} (via curl.exe)`);
    console.log('Response:', JSON.stringify(data, null, 2));

    return {
      ok: status >= 200 && status < 300 && data?.success === true,
      data,
      status,
    };
  } catch (error: any) {
    console.log('Status: request failed');
    console.log('Response:', error?.message ?? error);

    return {
      ok: false,
      data: { error: error?.message ?? 'curl failed' },
      status: 0,
    };
  }
};

async function main() {
  const userId = `recovery-e2e-${Date.now()}`;
  console.log(`Test userId: ${userId}`);

  const checks: Check[] = [];

  const low = await getJson(
    `/recovery/${userId}/today?regenerate=true&hrv=28&sleep_hours=4.9&sleep_quality=2&resting_hr=84&stress_level=5&workout_load=9&verbal_recovery=2&adherence_score=45`
  );
  checks.push({
    name: 'Poor recovery scenario',
    success: low.ok && low.data?.data?.recoveryStatus === 'poor_recovery',
    detail: low.ok ? `Status: ${low.data?.data?.recoveryStatus}` : `Request failed (${low.status})`,
  });

  const moderate = await getJson(
    `/recovery/${userId}/today?regenerate=true&hrv=45&sleep_hours=6.4&sleep_quality=3&resting_hr=70&stress_level=3&workout_load=6&verbal_recovery=3&adherence_score=70`
  );
  checks.push({
    name: 'Moderate recovery scenario',
    success: moderate.ok && moderate.data?.data?.recoveryStatus === 'moderate_recovery',
    detail: moderate.ok ? `Status: ${moderate.data?.data?.recoveryStatus}` : `Request failed (${moderate.status})`,
  });

  const high = await getJson(
    `/recovery/${userId}/today?regenerate=true&hrv=76&sleep_hours=8.1&sleep_quality=5&resting_hr=54&stress_level=1&workout_load=3&verbal_recovery=5&adherence_score=92`
  );
  checks.push({
    name: 'Fully recovered scenario',
    success: high.ok && high.data?.data?.recoveryStatus === 'fully_recovered',
    detail: high.ok ? `Status: ${high.data?.data?.recoveryStatus}` : `Request failed (${high.status})`,
  });

  const missingInput = await getJson(
    `/recovery/${userId}/today?regenerate=true&sleep_hours=6.8&stress_level=3`
  );
  checks.push({
    name: 'Missing input scenario',
    success:
      missingInput.ok &&
      typeof missingInput.data?.data?.recoveryScore === 'number' &&
      typeof missingInput.data?.data?.recoveryStatus === 'string',
    detail: missingInput.ok
      ? `Status: ${missingInput.data?.data?.recoveryStatus}, Score: ${missingInput.data?.data?.recoveryScore}`
      : `Request failed (${missingInput.status})`,
  });

  const today = await getJson(`/recovery/${userId}/today`);
  checks.push({
    name: 'GET today endpoint',
    success: today.ok && typeof today.data?.data?.recoveryScore === 'number',
    detail: today.ok ? `Score: ${today.data?.data?.recoveryScore}` : `Request failed (${today.status})`,
  });

  const history = await getJson(`/recovery/${userId}/history`);
  checks.push({
    name: 'GET history endpoint',
    success: history.ok && Array.isArray(history.data?.data) && history.data.data.length >= 3,
    detail: history.ok ? `History records: ${history.data?.data?.length ?? 0}` : `Request failed (${history.status})`,
  });

  checks.push({
    name: 'Persistence record structure',
    success:
      history.ok &&
      Array.isArray(history.data?.data) &&
      history.data.data.every(
        (record: RecoveryHistoryRecord) =>
          typeof record.date === 'string' &&
          typeof record.recoveryScore === 'number' &&
          typeof record.recoveryStatus === 'string' &&
          !!record.sourceInputs &&
          !!record.recommendation?.summary,
      ),
    detail: history.ok
      ? 'History records include date/score/status/source inputs/recommendation'
      : 'History unavailable',
  });

  const frontendScreen = path.resolve(__dirname, '../../../mobile/src/screens/RecoveryStatusScreen.tsx');
  const frontendService = path.resolve(__dirname, '../../../mobile/src/services/recoveryEngineService.ts');
  const frontendDisplayOk = existsSync(frontendScreen) && existsSync(frontendService);
  checks.push({
    name: 'Frontend display wiring',
    success: frontendDisplayOk,
    detail: frontendDisplayOk
      ? 'Recovery screen and service exist for score/status/recommendation display'
      : 'Recovery frontend files missing',
  });

  checks.forEach((check) => {
    console.log(`${check.success ? '✅' : '❌'} ${check.name} — ${check.detail}`);
  });

  const categories = {
    calculation: checks
      .filter((check) =>
        ['Poor recovery scenario', 'Moderate recovery scenario', 'Fully recovered scenario', 'Missing input scenario'].includes(check.name)
      )
      .every((check) => check.success),
    classification: checks
      .filter((check) =>
        ['Poor recovery scenario', 'Moderate recovery scenario', 'Fully recovered scenario'].includes(check.name)
      )
      .every((check) => check.success),
    persistence: checks
      .filter((check) => ['GET history endpoint', 'Persistence record structure'].includes(check.name))
      .every((check) => check.success),
    retrieval: checks
      .filter((check) => ['GET today endpoint', 'GET history endpoint'].includes(check.name))
      .every((check) => check.success),
    frontendDisplay: checks
      .filter((check) => check.name === 'Frontend display wiring')
      .every((check) => check.success),
  };

  console.log('\nPass/Fail Summary');
  console.log('=================');
  console.log(`calculation: ${categories.calculation ? 'PASS' : 'FAIL'}`);
  console.log(`classification: ${categories.classification ? 'PASS' : 'FAIL'}`);
  console.log(`persistence: ${categories.persistence ? 'PASS' : 'FAIL'}`);
  console.log(`retrieval: ${categories.retrieval ? 'PASS' : 'FAIL'}`);
  console.log(`frontend display: ${categories.frontendDisplay ? 'PASS' : 'FAIL'}`);

  const passed = Object.values(categories).every(Boolean);
  console.log(`\nOverall: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  if (!passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Recovery E2E validation failed:', error);
  process.exit(1);
});