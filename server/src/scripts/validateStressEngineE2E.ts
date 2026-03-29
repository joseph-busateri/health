/// <reference types="node" />
import 'dotenv/config';
import { existsSync } from 'fs';
import path from 'path';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

type Check = { name: string; success: boolean; detail: string };

const getJson = async (endpoint: string) => {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
};

async function main() {
  const userId = `stress-e2e-${Date.now()}`;
  const checks: Check[] = [];

  const low = await getJson(`/stress/${userId}/today?regenerate=true&stress_level=1&hrv=80&sleep_hours=8.2&workout_load=3&recovery_score=88`);
  checks.push({
    name: 'Low stress scenario',
    success: low.ok && low.data?.data?.stressStatus === 'low',
    detail: low.ok ? `stress=${low.data?.data?.stressStatus}, cns=${low.data?.data?.cnsLoadStatus}` : 'Request failed',
  });

  const moderate = await getJson(`/stress/${userId}/today?regenerate=true&stress_level=3&hrv=50&sleep_hours=6.6&workout_load=6&recovery_score=62`);
  checks.push({
    name: 'Moderate stress scenario',
    success: moderate.ok && moderate.data?.data?.stressStatus === 'moderate',
    detail: moderate.ok ? `stress=${moderate.data?.data?.stressStatus}, cns=${moderate.data?.data?.cnsLoadStatus}` : 'Request failed',
  });

  const high = await getJson(`/stress/${userId}/today?regenerate=true&stress_level=5&hrv=30&sleep_hours=4.8&workout_load=9&recovery_score=35`);
  checks.push({
    name: 'High stress scenario',
    success: high.ok && high.data?.data?.stressStatus === 'high',
    detail: high.ok ? `stress=${high.data?.data?.stressStatus}, cns=${high.data?.data?.cnsLoadStatus}` : 'Request failed',
  });

  const missing = await getJson(`/stress/${userId}/today?regenerate=true&stress_level=3`);
  checks.push({
    name: 'Missing input handling',
    success: missing.ok && typeof missing.data?.data?.stressScore === 'number',
    detail: missing.ok ? `score=${missing.data?.data?.stressScore}` : 'Request failed',
  });

  const today = await getJson(`/stress/${userId}/today`);
  checks.push({
    name: 'Today retrieval',
    success: today.ok && !!today.data?.data?.recommendation?.summary,
    detail: today.ok ? 'today record returned with recommendation' : 'Request failed',
  });

  const history = await getJson(`/stress/${userId}/history`);
  checks.push({
    name: 'History retrieval',
    success: history.ok && Array.isArray(history.data?.data) && history.data.data.length >= 4,
    detail: history.ok ? `history=${history.data?.data?.length ?? 0}` : 'Request failed',
  });

  const persistenceStructure =
    history.ok &&
    Array.isArray(history.data?.data) &&
    history.data.data.every(
      (record: any) =>
        typeof record.date === 'string' &&
        typeof record.stressScore === 'number' &&
        typeof record.stressStatus === 'string' &&
        typeof record.cnsLoadStatus === 'string' &&
        !!record.sourceInputs &&
        !!record.recommendation?.summary,
    );
  checks.push({
    name: 'Persistence structure',
    success: !!persistenceStructure,
    detail: persistenceStructure ? 'date/score/status/cns/sourceInputs/recommendation present' : 'Missing persisted fields',
  });

  const frontendScreen = path.resolve(__dirname, '../../../mobile/src/screens/StressStatusScreen.tsx');
  const frontendService = path.resolve(__dirname, '../../../mobile/src/services/stressEngineService.ts');
  checks.push({
    name: 'Frontend wiring',
    success: existsSync(frontendScreen) && existsSync(frontendService),
    detail: 'Stress screen/service files exist',
  });

  checks.forEach(check => {
    console.log(`${check.success ? '✅' : '❌'} ${check.name} — ${check.detail}`);
  });

  const categories = {
    calculation: checks.filter(c => ['Low stress scenario', 'Moderate stress scenario', 'High stress scenario', 'Missing input handling'].includes(c.name)).every(c => c.success),
    classification: checks.filter(c => ['Low stress scenario', 'Moderate stress scenario', 'High stress scenario'].includes(c.name)).every(c => c.success),
    persistence: checks.filter(c => ['Persistence structure', 'History retrieval'].includes(c.name)).every(c => c.success),
    retrieval: checks.filter(c => ['Today retrieval', 'History retrieval'].includes(c.name)).every(c => c.success),
    frontendDisplay: checks.filter(c => c.name === 'Frontend wiring').every(c => c.success),
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
  console.error('Stress E2E validation failed:', error);
  process.exit(1);
});
