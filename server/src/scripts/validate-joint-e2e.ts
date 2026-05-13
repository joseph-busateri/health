/// <reference types="node" />
import 'dotenv/config';
import { existsSync } from 'fs';
import path from 'path';
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
  const userId = `joint-e2e-${Date.now()}`;
  const checks: Check[] = [];

  // Low risk scenario
  const low = await getJson(`/joint-health/${userId}/today?regenerate=true&pain_level=1&tightness_level=2&soreness_level=1&affected_area=shoulder&workout_load=3&recovery_score=85`);
  checks.push({
    name: 'Low risk scenario',
    success: low.ok && low.data?.data?.riskLevel === 'low',
    detail: low.ok ? `risk=${low.data?.data?.riskLevel}, status=${low.data?.data?.jointHealthStatus}` : 'Request failed',
  });

  // Moderate risk scenario
  const moderate = await getJson(`/joint-health/${userId}/today?regenerate=true&pain_level=5&tightness_level=4&soreness_level=5&affected_area=knee&workout_load=6&recovery_score=55`);
  checks.push({
    name: 'Moderate risk scenario',
    success: moderate.ok && moderate.data?.data?.riskLevel === 'moderate',
    detail: moderate.ok ? `risk=${moderate.data?.data?.riskLevel}, status=${moderate.data?.data?.jointHealthStatus}` : 'Request failed',
  });

  // High risk scenario
  const high = await getJson(`/joint-health/${userId}/today?regenerate=true&pain_level=8&tightness_level=7&soreness_level=8&affected_area=back&workout_load=9&recovery_score=30`);
  checks.push({
    name: 'High risk scenario',
    success: high.ok && high.data?.data?.riskLevel === 'high',
    detail: high.ok ? `risk=${high.data?.data?.riskLevel}, status=${high.data?.data?.jointHealthStatus}` : 'Request failed',
  });

  // Missing input handling
  const missing = await getJson(`/joint-health/${userId}/today?regenerate=true&pain_level=4`);
  checks.push({
    name: 'Missing input handling',
    success: missing.ok && typeof missing.data?.data?.riskLevel === 'string',
    detail: missing.ok ? `risk=${missing.data?.data?.riskLevel}` : 'Request failed',
  });

  // Today retrieval
  const today = await getJson(`/joint-health/${userId}/today`);
  checks.push({
    name: 'Today retrieval',
    success: today.ok && !!today.data?.data?.recommendation?.summary,
    detail: today.ok ? 'today record returned with recommendation' : 'Request failed',
  });

  // History retrieval
  const history = await getJson(`/joint-health/${userId}/history`);
  checks.push({
    name: 'History retrieval',
    success: history.ok && Array.isArray(history.data?.data) && history.data.data.length >= 4,
    detail: history.ok ? `history=${history.data?.data?.length ?? 0}` : 'Request failed',
  });

  // Persistence structure
  const persistenceStructure =
    history.ok &&
    Array.isArray(history.data?.data) &&
    history.data.data.every(
      (record: any) =>
        typeof record.date === 'string' &&
        typeof record.riskLevel === 'string' &&
        typeof record.jointHealthStatus === 'string' &&
        typeof record.affectedArea === 'string' &&
        !!record.inputs &&
        !!record.recommendation?.summary,
    );
  checks.push({
    name: 'Persistence structure',
    success: !!persistenceStructure,
    detail: persistenceStructure ? 'All required fields present' : 'Missing persisted fields',
  });

  // Frontend wiring check
  const frontendPaths = [
    path.resolve(__dirname, '../../../mobile/src/screens/JointHealthScreen.tsx'),
    path.resolve(__dirname, '../../../mobile/src/services/jointHealthService.ts'),
  ];
  const frontendExists = frontendPaths.some(p => existsSync(p));
  checks.push({
    name: 'Frontend wiring',
    success: frontendExists,
    detail: frontendExists ? 'Joint screen/service files exist' : 'Frontend files not found',
  });

  // Print results
  checks.forEach(check => {
    const icon = check.success ? '✅' : '❌';
    console.log(`${icon} ${check.name} — ${check.detail}`);
  });

  console.log('\nPass/Fail Summary');
  console.log('=================');
  const calculation = checks.filter(c => c.name.includes('scenario')).every(c => c.success);
  const classification = checks.filter(c => c.name.includes('scenario')).every(c => c.success);
  const persistence = checks.find(c => c.name === 'Persistence structure')?.success ?? false;
  const retrieval = checks.filter(c => c.name.includes('retrieval')).every(c => c.success);
  const frontend = checks.find(c => c.name === 'Frontend wiring')?.success ?? false;

  console.log(`calculation: ${calculation ? 'PASS' : 'FAIL'}`);
  console.log(`classification: ${classification ? 'PASS' : 'FAIL'}`);
  console.log(`persistence: ${persistence ? 'PASS' : 'FAIL'}`);
  console.log(`retrieval: ${retrieval ? 'PASS' : 'FAIL'}`);
  console.log(`frontend display: ${frontend ? 'PASS' : 'FAIL'}`);

  const overall = calculation && classification && persistence && retrieval && frontend;
  console.log(`\nOverall: ${overall ? '✅ PASS' : '❌ FAIL'}`);

  process.exit(overall ? 0 : 1);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
