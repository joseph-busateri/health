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
  const userId = `predictive-e2e-${Date.now()}`;
  const checks: Check[] = [];

  console.log('='.repeat(80));
  console.log('Predictive Intelligence E2E Validation');
  console.log('='.repeat(80));

  // Scenario 1: Get predictive intelligence
  const predictive = await getJson(`/predictive/${userId}/today?regenerate=true`);
  checks.push({
    name: 'Predictive endpoint',
    success: predictive.ok && !!predictive.data?.data,
    detail: predictive.ok ? 'endpoint returned data' : 'Request failed',
  });

  // Scenario 2: Verify structure
  const hasRiskLevel = predictive.ok && predictive.data?.data?.riskLevel;
  const hasEvidence = predictive.ok && predictive.data?.data?.evidence;
  const hasRecommendation = predictive.ok && predictive.data?.data?.recommendation;
  checks.push({
    name: 'Response structure',
    success: hasRiskLevel && hasEvidence && hasRecommendation,
    detail: hasRiskLevel && hasEvidence && hasRecommendation
      ? `riskLevel=${predictive.data.data.riskLevel}`
      : 'Missing required fields',
  });

  // Scenario 3: Verify evidence signals
  const hasSignals = hasEvidence && Array.isArray(predictive.data.data.evidence.signals);
  checks.push({
    name: 'Evidence signals',
    success: !!hasSignals,
    detail: hasSignals ? `signals=${predictive.data.data.evidence.signals.length}` : 'Missing signals',
  });

  // Scenario 4: Verify recommendation type
  const isCorrectType = hasRecommendation && predictive.data.data.recommendation.type === 'predictive';
  checks.push({
    name: 'Recommendation type',
    success: !!isCorrectType,
    detail: isCorrectType ? 'type=predictive' : 'Incorrect type',
  });

  // Scenario 5: Today retrieval (cached)
  const todayCached = await getJson(`/predictive/${userId}/today`);
  checks.push({
    name: 'Today retrieval (cached)',
    success: todayCached.ok && !!todayCached.data?.data,
    detail: todayCached.ok ? 'cached record returned' : 'Request failed',
  });

  // Scenario 6: History retrieval
  const history = await getJson(`/predictive/${userId}/history`);
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
  const endpoint = checks.find(c => c.name === 'Predictive endpoint')?.success ?? false;
  const structure = checks.find(c => c.name === 'Response structure')?.success ?? false;
  const signals = checks.find(c => c.name === 'Evidence signals')?.success ?? false;
  const type = checks.find(c => c.name === 'Recommendation type')?.success ?? false;
  const retrieval = checks.filter(c => c.name.includes('retrieval')).every(c => c.success);

  console.log(`endpoint: ${endpoint ? 'PASS' : 'FAIL'}`);
  console.log(`structure: ${structure ? 'PASS' : 'FAIL'}`);
  console.log(`signals: ${signals ? 'PASS' : 'FAIL'}`);
  console.log(`type: ${type ? 'PASS' : 'FAIL'}`);
  console.log(`retrieval: ${retrieval ? 'PASS' : 'FAIL'}`);

  const overall = endpoint && structure && signals && type && retrieval;
  console.log(`\nOverall: ${overall ? '✅ PASS' : '❌ FAIL'}`);

  process.exit(overall ? 0 : 1);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
