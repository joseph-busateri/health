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
  const userId = `adherence-e2e-${Date.now()}`;
  const checks: Check[] = [];

  const low = await getJson(`/adherence/${userId}/today?regenerate=true&workout_adherence=40&nutrition_adherence=45&sleep_adherence=38&supplement_adherence=42&notes=off plan and inconsistent`);
  checks.push({
    name: 'Low adherence scenario',
    success: low.ok && low.data?.data?.status === 'low',
    detail: low.ok ? `score=${low.data?.data?.adherenceScore}, status=${low.data?.data?.status}` : 'Request failed',
  });

  const moderate = await getJson(`/adherence/${userId}/today?regenerate=true&workout_adherence=68&nutrition_adherence=62&sleep_adherence=66&supplement_adherence=60&notes=mostly consistent`);
  checks.push({
    name: 'Moderate adherence scenario',
    success: moderate.ok && moderate.data?.data?.status === 'moderate',
    detail: moderate.ok ? `score=${moderate.data?.data?.adherenceScore}, status=${moderate.data?.data?.status}` : 'Request failed',
  });

  const high = await getJson(`/adherence/${userId}/today?regenerate=true&workout_adherence=90&nutrition_adherence=85&sleep_adherence=88&supplement_adherence=92&notes=on plan and consistent`);
  checks.push({
    name: 'High adherence scenario',
    success: high.ok && high.data?.data?.status === 'high',
    detail: high.ok ? `score=${high.data?.data?.adherenceScore}, status=${high.data?.data?.status}` : 'Request failed',
  });

  const missing = await getJson(`/adherence/${userId}/today?regenerate=true&workout_adherence=75`);
  checks.push({
    name: 'Missing input handling',
    success: missing.ok && typeof missing.data?.data?.adherenceScore === 'number',
    detail: missing.ok ? `score=${missing.data?.data?.adherenceScore}` : 'Request failed',
  });

  const today = await getJson(`/adherence/${userId}/today`);
  checks.push({
    name: 'Today retrieval',
    success: today.ok && !!today.data?.data?.breakdown && !!today.data?.data?.recommendation,
    detail: today.ok ? 'today record returned with breakdown/recommendation' : 'Request failed',
  });

  const history = await getJson(`/adherence/${userId}/history`);
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
        typeof record.adherenceScore === 'number' &&
        !!record.breakdown &&
        typeof record.trend === 'string' &&
        !!record.recommendation?.summary,
    );
  checks.push({
    name: 'Persistence structure',
    success: !!persistenceStructure,
    detail: persistenceStructure ? 'date/score/breakdown/trend/recommendation present' : 'Missing persisted fields',
  });

  const frontendScreen = path.resolve(__dirname, '../../../mobile/src/screens/AdherenceStatusScreen.tsx');
  const frontendService = path.resolve(__dirname, '../../../mobile/src/services/adherenceEngineService.ts');
  checks.push({
    name: 'Frontend wiring',
    success: existsSync(frontendScreen) && existsSync(frontendService),
    detail: 'Adherence screen/service files exist',
  });

  checks.forEach(check => {
    console.log(`${check.success ? '✅' : '❌'} ${check.name} — ${check.detail}`);
  });

  const categories = {
    scoring: checks
      .filter(c => ['Low adherence scenario', 'Moderate adherence scenario', 'High adherence scenario', 'Missing input handling'].includes(c.name))
      .every(c => c.success),
    trendAndBreakdown: checks
      .filter(c => ['Today retrieval', 'History retrieval'].includes(c.name))
      .every(c => c.success),
    persistence: checks
      .filter(c => c.name === 'Persistence structure')
      .every(c => c.success),
    retrieval: checks
      .filter(c => ['Today retrieval', 'History retrieval'].includes(c.name))
      .every(c => c.success),
    frontendDisplay: checks
      .filter(c => c.name === 'Frontend wiring')
      .every(c => c.success),
  };

  console.log('\nPass/Fail Summary');
  console.log('=================');
  console.log(`scoring: ${categories.scoring ? 'PASS' : 'FAIL'}`);
  console.log(`trend+breakdown: ${categories.trendAndBreakdown ? 'PASS' : 'FAIL'}`);
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
  console.error('Adherence E2E validation failed:', error);
  process.exit(1);
});
