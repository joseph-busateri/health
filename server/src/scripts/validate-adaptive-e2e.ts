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
  const userId = `adaptive-e2e-${Date.now()}`;
  const checks: Check[] = [];

  console.log('='.repeat(80));
  console.log('Adaptive Intelligence E2E Validation');
  console.log('='.repeat(80));

  // Scenario 1: Get adaptive intelligence
  const adaptive = await getJson(`/adaptive/${userId}/today?regenerate=true`);
  checks.push({
    name: 'Adaptive endpoint',
    success: adaptive.ok && !!adaptive.data?.data,
    detail: adaptive.ok ? 'endpoint returned data' : 'Request failed',
  });

  // Scenario 2: Verify structure
  const hasEffectiveness = adaptive.ok && Array.isArray(adaptive.data?.data?.effectiveness);
  const hasPatterns = adaptive.ok && Array.isArray(adaptive.data?.data?.userPatterns);
  const hasRecommendation = adaptive.ok && adaptive.data?.data?.recommendation;
  checks.push({
    name: 'Response structure',
    success: hasEffectiveness && hasPatterns && hasRecommendation,
    detail: hasEffectiveness && hasPatterns && hasRecommendation
      ? `effectiveness=${adaptive.data.data.effectiveness.length}, patterns=${adaptive.data.data.userPatterns.length}`
      : 'Missing required fields',
  });

  // Scenario 3: Verify recommendation type
  const isCorrectType = hasRecommendation && adaptive.data.data.recommendation.type === 'adaptive';
  checks.push({
    name: 'Recommendation type',
    success: !!isCorrectType,
    detail: isCorrectType ? 'type=adaptive' : 'Incorrect type',
  });

  // Scenario 4: Get insights
  const insights = await getJson(`/adaptive/${userId}/insights`);
  checks.push({
    name: 'Insights endpoint',
    success: insights.ok && !!insights.data?.data,
    detail: insights.ok ? 'insights returned' : 'Request failed',
  });

  // Scenario 5: Today retrieval (cached)
  const todayCached = await getJson(`/adaptive/${userId}/today`);
  checks.push({
    name: 'Today retrieval (cached)',
    success: todayCached.ok && !!todayCached.data?.data,
    detail: todayCached.ok ? 'cached record returned' : 'Request failed',
  });

  // Scenario 6: History retrieval
  const history = await getJson(`/adaptive/${userId}/history`);
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
  const endpoint = checks.find(c => c.name === 'Adaptive endpoint')?.success ?? false;
  const structure = checks.find(c => c.name === 'Response structure')?.success ?? false;
  const type = checks.find(c => c.name === 'Recommendation type')?.success ?? false;
  const insightsCheck = checks.find(c => c.name === 'Insights endpoint')?.success ?? false;
  const retrieval = checks.filter(c => c.name.includes('retrieval')).every(c => c.success);

  console.log(`endpoint: ${endpoint ? 'PASS' : 'FAIL'}`);
  console.log(`structure: ${structure ? 'PASS' : 'FAIL'}`);
  console.log(`type: ${type ? 'PASS' : 'FAIL'}`);
  console.log(`insights: ${insightsCheck ? 'PASS' : 'FAIL'}`);
  console.log(`retrieval: ${retrieval ? 'PASS' : 'FAIL'}`);

  const overall = endpoint && structure && type && insightsCheck && retrieval;
  console.log(`\nOverall: ${overall ? '✅ PASS' : '❌ FAIL'}`);

  process.exit(overall ? 0 : 1);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
