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
  const userId = `autonomous-e2e-${Date.now()}`;
  const checks: Check[] = [];

  console.log('='.repeat(80));
  console.log('Autonomous Optimization E2E Validation');
  console.log('='.repeat(80));

  // Scenario 1: Get autonomous optimization
  const autonomous = await getJson(`/autonomous/${userId}/today?regenerate=true`);
  checks.push({
    name: 'Autonomous endpoint',
    success: autonomous.ok && !!autonomous.data?.data,
    detail: autonomous.ok ? 'endpoint returned data' : 'Request failed',
  });

  // Scenario 2: Verify structure
  const hasPlan = autonomous.ok && autonomous.data?.data?.plan;
  const hasAdjustments = hasPlan && Array.isArray(autonomous.data.data.plan.adjustments);
  const hasSummary = hasPlan && autonomous.data.data.plan.summary;
  checks.push({
    name: 'Response structure',
    success: hasPlan && hasAdjustments && hasSummary,
    detail: hasPlan && hasAdjustments && hasSummary
      ? `adjustments=${autonomous.data.data.plan.adjustments.length}`
      : 'Missing required fields',
  });

  // Scenario 3: Verify plan priority
  const hasPriority = hasPlan && autonomous.data.data.plan.priority;
  checks.push({
    name: 'Plan priority',
    success: !!hasPriority,
    detail: hasPriority ? `priority=${autonomous.data.data.plan.priority}` : 'Missing priority',
  });

  // Scenario 4: Verify adjustments have categories
  if (hasAdjustments) {
    const allHaveCategories = autonomous.data.data.plan.adjustments.every(
      (adj: any) => adj.category && adj.adjustment && adj.rationale && adj.priority
    );
    checks.push({
      name: 'Adjustment structure',
      success: allHaveCategories,
      detail: allHaveCategories ? 'all adjustments valid' : 'some adjustments invalid',
    });
  }

  // Scenario 5: Today retrieval (cached)
  const todayCached = await getJson(`/autonomous/${userId}/today`);
  checks.push({
    name: 'Today retrieval (cached)',
    success: todayCached.ok && !!todayCached.data?.data,
    detail: todayCached.ok ? 'cached record returned' : 'Request failed',
  });

  // Scenario 6: History retrieval
  const history = await getJson(`/autonomous/${userId}/history`);
  checks.push({
    name: 'History retrieval',
    success: history.ok && Array.isArray(history.data?.data) && history.data.data.length >= 1,
    detail: history.ok ? `history=${history.data?.data?.length ?? 0}` : 'Request failed',
  });

  // Print results
  checks.forEach(check => {
    const icon = check.success ? '✅' : '❌';
    console.log(`${icon} ${check.name} — ${check.detail}`);
  });

  console.log('\nPass/Fail Summary');
  console.log('=================');
  const endpoint = checks.find(c => c.name === 'Autonomous endpoint')?.success ?? false;
  const structure = checks.find(c => c.name === 'Response structure')?.success ?? false;
  const priority = checks.find(c => c.name === 'Plan priority')?.success ?? false;
  const adjustments = checks.find(c => c.name === 'Adjustment structure')?.success ?? false;
  const retrieval = checks.filter(c => c.name.includes('retrieval')).every(c => c.success);

  console.log(`endpoint: ${endpoint ? 'PASS' : 'FAIL'}`);
  console.log(`structure: ${structure ? 'PASS' : 'FAIL'}`);
  console.log(`priority: ${priority ? 'PASS' : 'FAIL'}`);
  console.log(`adjustments: ${adjustments ? 'PASS' : 'FAIL'}`);
  console.log(`retrieval: ${retrieval ? 'PASS' : 'FAIL'}`);

  const overall = endpoint && structure && priority && adjustments && retrieval;
  console.log(`\nOverall: ${overall ? '✅ PASS' : '❌ FAIL'}`);

  process.exit(overall ? 0 : 1);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
