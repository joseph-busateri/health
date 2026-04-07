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
  const userId = `prioritization-e2e-${Date.now()}`;
  const checks: Check[] = [];

  console.log('='.repeat(80));
  console.log('Recommendation Prioritization E2E Validation');
  console.log('='.repeat(80));

  // Scenario 1: Get prioritized recommendations
  const priorities = await getJson(`/priorities/${userId}/today?regenerate=true`);
  checks.push({
    name: 'Priorities endpoint',
    success: priorities.ok && !!priorities.data?.data,
    detail: priorities.ok ? 'endpoint returned data' : 'Request failed',
  });

  // Scenario 2: Verify structure
  const hasTopPriorities = priorities.ok && Array.isArray(priorities.data?.data?.topPriorities);
  const hasAllRecommendations = priorities.ok && Array.isArray(priorities.data?.data?.allRecommendations);
  checks.push({
    name: 'Response structure',
    success: hasTopPriorities && hasAllRecommendations,
    detail: hasTopPriorities && hasAllRecommendations 
      ? `topPriorities=${priorities.data.data.topPriorities.length}, all=${priorities.data.data.allRecommendations.length}`
      : 'Missing required fields',
  });

  // Scenario 3: Verify top priorities are scored
  const topPrioritiesScored = 
    hasTopPriorities &&
    priorities.data.data.topPriorities.every((rec: any) => typeof rec.score === 'number');
  checks.push({
    name: 'Top priorities scored',
    success: !!topPrioritiesScored,
    detail: topPrioritiesScored ? 'All top priorities have scores' : 'Missing scores',
  });

  // Scenario 4: Verify sorting (descending by score)
  const isSorted = 
    hasTopPriorities &&
    priorities.data.data.topPriorities.every((rec: any, i: number, arr: any[]) => 
      i === 0 || arr[i - 1].score >= rec.score
    );
  checks.push({
    name: 'Priorities sorted',
    success: !!isSorted,
    detail: isSorted ? 'Priorities sorted by score descending' : 'Not properly sorted',
  });

  // Scenario 5: Today retrieval (cached)
  const todayCached = await getJson(`/priorities/${userId}/today`);
  checks.push({
    name: 'Today retrieval (cached)',
    success: todayCached.ok && !!todayCached.data?.data,
    detail: todayCached.ok ? 'cached record returned' : 'Request failed',
  });

  // Scenario 6: History retrieval
  const history = await getJson(`/priorities/${userId}/history`);
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
  const endpoint = checks.find(c => c.name === 'Priorities endpoint')?.success ?? false;
  const structure = checks.find(c => c.name === 'Response structure')?.success ?? false;
  const scoring = checks.find(c => c.name === 'Top priorities scored')?.success ?? false;
  const sorting = checks.find(c => c.name === 'Priorities sorted')?.success ?? false;
  const retrieval = checks.filter(c => c.name.includes('retrieval')).every(c => c.success);

  console.log(`endpoint: ${endpoint ? 'PASS' : 'FAIL'}`);
  console.log(`structure: ${structure ? 'PASS' : 'FAIL'}`);
  console.log(`scoring: ${scoring ? 'PASS' : 'FAIL'}`);
  console.log(`sorting: ${sorting ? 'PASS' : 'FAIL'}`);
  console.log(`retrieval: ${retrieval ? 'PASS' : 'FAIL'}`);

  const overall = endpoint && structure && scoring && sorting && retrieval;
  console.log(`\nOverall: ${overall ? '✅ PASS' : '❌ FAIL'}`);

  process.exit(overall ? 0 : 1);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
