/// <reference types="node" />
import 'dotenv/config';
import axios from 'axios';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';

type Check = { name: string; success: boolean; detail: string };

const getJson = async (endpoint: string) => {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    return { ok: response.status === 200, data: response.data };
  } catch (error: any) {
    console.error(`Request failed for ${endpoint}:`, error.message);
    return { ok: false, data: {} };
  }
};

async function main() {
  const userId = `cross-engine-e2e-${Date.now()}`;
  const checks: Check[] = [];

  console.log('='.repeat(80));
  console.log('Cross-Engine E2E Validation');
  console.log('='.repeat(80));

  // Scenario 1: All Systems Good (Optimal)
  const optimal = await getJson(`/cross-engine/${userId}/today?regenerate=true`);
  checks.push({
    name: 'Optimal scenario',
    success: optimal.ok && optimal.data?.data?.overallStatus === 'optimal',
    detail: optimal.ok ? `status=${optimal.data?.data?.overallStatus}` : 'Request failed',
  });

  // Scenario 2: Today retrieval
  const today = await getJson(`/cross-engine/${userId}/today`);
  checks.push({
    name: 'Today retrieval',
    success: today.ok && !!today.data?.data?.recommendation?.summary,
    detail: today.ok ? 'today record returned with recommendation' : 'Request failed',
  });

  // Scenario 3: History retrieval
  const history = await getJson(`/cross-engine/${userId}/history`);
  checks.push({
    name: 'History retrieval',
    success: history.ok && Array.isArray(history.data?.data) && history.data.data.length >= 1,
    detail: history.ok ? `history=${history.data?.data?.length ?? 0}` : 'Request failed',
  });

  // Scenario 4: Persistence structure
  const persistenceStructure =
    history.ok &&
    Array.isArray(history.data?.data) &&
    history.data.data.every(
      (record: any) =>
        typeof record.date === 'string' &&
        typeof record.overallStatus === 'string' &&
        !!record.evidence &&
        !!record.recommendation?.summary &&
        Array.isArray(record.recommendation?.actions),
    );
  checks.push({
    name: 'Persistence structure',
    success: !!persistenceStructure,
    detail: persistenceStructure ? 'All required fields present' : 'Missing persisted fields',
  });

  // Print results
  checks.forEach(check => {
    const icon = check.success ? '✅' : '❌';
    console.log(`${icon} ${check.name} — ${check.detail}`);
  });

  console.log('\nPass/Fail Summary');
  console.log('=================');
  const synthesis = checks.find(c => c.name === 'Optimal scenario')?.success ?? false;
  const persistence = checks.find(c => c.name === 'Persistence structure')?.success ?? false;
  const retrieval = checks.filter(c => c.name.includes('retrieval')).every(c => c.success);

  console.log(`synthesis: ${synthesis ? 'PASS' : 'FAIL'}`);
  console.log(`persistence: ${persistence ? 'PASS' : 'FAIL'}`);
  console.log(`retrieval: ${retrieval ? 'PASS' : 'FAIL'}`);

  const overall = synthesis && persistence && retrieval;
  console.log(`\nOverall: ${overall ? '✅ PASS' : '❌ FAIL'}`);

  process.exit(overall ? 0 : 1);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
