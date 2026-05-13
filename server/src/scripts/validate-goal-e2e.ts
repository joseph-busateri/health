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

const postJson = async (endpoint: string, body: any) => {
  try {
    const response = await axios.post(`${BASE_URL}${endpoint}`, body);
    return { ok: response.status === 200, data: response.data };
  } catch (error: any) {
    console.error(`Request failed for ${endpoint}:`, error.message);
    return { ok: false, data: {} };
  }
};

async function main() {
  const userId = `goal-e2e-${Date.now()}`;
  const checks: Check[] = [];

  console.log('='.repeat(80));
  console.log('Goal-Driven Optimization E2E Validation');
  console.log('='.repeat(80));

  // Scenario 1: Set goals
  const setGoals = await postJson(`/goals/${userId}`, {
    goals: [
      { type: 'muscle_gain', priority: 9 },
      { type: 'injury_prevention', priority: 7 },
    ],
  });
  checks.push({
    name: 'Set goals endpoint',
    success: setGoals.ok && setGoals.data?.success,
    detail: setGoals.ok ? 'goals set successfully' : 'Request failed',
  });

  // Scenario 2: Get goals
  const getGoals = await getJson(`/goals/${userId}`);
  checks.push({
    name: 'Get goals endpoint',
    success: getGoals.ok && Array.isArray(getGoals.data?.data?.goals) && getGoals.data.data.goals.length === 2,
    detail: getGoals.ok ? `goals=${getGoals.data?.data?.goals?.length ?? 0}` : 'Request failed',
  });

  // Scenario 3: Get goal-driven optimization
  const goalDriven = await getJson(`/goals/${userId}/today?regenerate=true`);
  checks.push({
    name: 'Goal-driven endpoint',
    success: goalDriven.ok && !!goalDriven.data?.data,
    detail: goalDriven.ok ? 'endpoint returned data' : 'Request failed',
  });

  // Scenario 4: Verify structure
  const hasPlan = goalDriven.ok && goalDriven.data?.data?.plan;
  const hasAdjustments = hasPlan && Array.isArray(goalDriven.data.data.plan.adjustments);
  const hasSummary = hasPlan && goalDriven.data.data.plan.summary;
  const hasGoalAlignment = hasPlan && typeof goalDriven.data.data.plan.goalAlignment === 'number';
  checks.push({
    name: 'Response structure',
    success: hasPlan && hasAdjustments && hasSummary && hasGoalAlignment,
    detail: hasPlan && hasAdjustments && hasSummary && hasGoalAlignment
      ? `adjustments=${goalDriven.data.data.plan.adjustments.length}, alignment=${goalDriven.data.data.plan.goalAlignment}%`
      : 'Missing required fields',
  });

  // Scenario 5: Verify goal-specific adjustments
  if (hasAdjustments) {
    const muscleGainAdj = goalDriven.data.data.plan.adjustments.some((adj: any) => adj.goal === 'muscle_gain');
    const injuryPrevAdj = goalDriven.data.data.plan.adjustments.some((adj: any) => adj.goal === 'injury_prevention');
    checks.push({
      name: 'Goal-specific adjustments',
      success: muscleGainAdj && injuryPrevAdj,
      detail: muscleGainAdj && injuryPrevAdj ? 'both goals have adjustments' : 'missing goal adjustments',
    });
  }

  // Scenario 6: Today retrieval (cached)
  const todayCached = await getJson(`/goals/${userId}/today`);
  checks.push({
    name: 'Today retrieval (cached)',
    success: todayCached.ok && !!todayCached.data?.data,
    detail: todayCached.ok ? 'cached record returned' : 'Request failed',
  });

  // Scenario 7: History retrieval
  const history = await getJson(`/goals/${userId}/history`);
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
  const setGoalsCheck = checks.find(c => c.name === 'Set goals endpoint')?.success ?? false;
  const getGoalsCheck = checks.find(c => c.name === 'Get goals endpoint')?.success ?? false;
  const endpoint = checks.find(c => c.name === 'Goal-driven endpoint')?.success ?? false;
  const structure = checks.find(c => c.name === 'Response structure')?.success ?? false;
  const goalAdj = checks.find(c => c.name === 'Goal-specific adjustments')?.success ?? false;
  const retrieval = checks.filter(c => c.name.includes('retrieval')).every(c => c.success);

  console.log(`set goals: ${setGoalsCheck ? 'PASS' : 'FAIL'}`);
  console.log(`get goals: ${getGoalsCheck ? 'PASS' : 'FAIL'}`);
  console.log(`endpoint: ${endpoint ? 'PASS' : 'FAIL'}`);
  console.log(`structure: ${structure ? 'PASS' : 'FAIL'}`);
  console.log(`goal adjustments: ${goalAdj ? 'PASS' : 'FAIL'}`);
  console.log(`retrieval: ${retrieval ? 'PASS' : 'FAIL'}`);

  const overall = setGoalsCheck && getGoalsCheck && endpoint && structure && goalAdj && retrieval;
  console.log(`\nOverall: ${overall ? '✅ PASS' : '❌ FAIL'}`);

  process.exit(overall ? 0 : 1);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
