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
  const userId = `joint-e2e-${Date.now()}`;
  const checks: Check[] = [];

  const noPain = await getJson(`/joint-health/${userId}/today?regenerate=true&pain_level=0&tightness_level=1&soreness_level=1&affected_area=other&workout_load=3&recovery_score=88`);
  checks.push({
    name: 'No pain scenario',
    success:
      noPain.ok &&
      noPain.data?.data?.affectedArea === 'other' &&
      noPain.data?.data?.riskLevel === 'low',
    detail: noPain.ok
      ? `area=${noPain.data?.data?.affectedArea}, risk=${noPain.data?.data?.riskLevel}`
      : 'Request failed',
  });

  const mildSoreness = await getJson(`/joint-health/${userId}/today?regenerate=true&pain_level=2&tightness_level=3&soreness_level=4&affected_area=elbow&workout_load=4&recovery_score=74`);
  checks.push({
    name: 'Mild soreness scenario',
    success:
      mildSoreness.ok &&
      mildSoreness.data?.data?.affectedArea === 'elbow' &&
      mildSoreness.data?.data?.riskLevel === 'low',
    detail: mildSoreness.ok
      ? `area=${mildSoreness.data?.data?.affectedArea}, risk=${mildSoreness.data?.data?.riskLevel}`
      : 'Request failed',
  });

  const moderatePain = await getJson(`/joint-health/${userId}/today?regenerate=true&pain_level=5&tightness_level=5&soreness_level=4&affected_area=knee&workout_load=6&recovery_score=62`);
  checks.push({
    name: 'Moderate pain scenario',
    success:
      moderatePain.ok &&
      moderatePain.data?.data?.affectedArea === 'knee' &&
      moderatePain.data?.data?.riskLevel === 'moderate',
    detail: moderatePain.ok
      ? `area=${moderatePain.data?.data?.affectedArea}, risk=${moderatePain.data?.data?.riskLevel}`
      : 'Request failed',
  });

  const highRiskPain = await getJson(`/joint-health/${userId}/today?regenerate=true&pain_level=8&tightness_level=7&soreness_level=6&affected_area=shoulder&workout_load=8&recovery_score=48&notes=right shoulder pain`);
  checks.push({
    name: 'High-risk pain scenario',
    success:
      highRiskPain.ok &&
      highRiskPain.data?.data?.affectedArea === 'shoulder' &&
      highRiskPain.data?.data?.riskLevel === 'high',
    detail: highRiskPain.ok
      ? `area=${highRiskPain.data?.data?.affectedArea}, risk=${highRiskPain.data?.data?.riskLevel}`
      : 'Request failed',
  });

  const recommendationQuality =
    highRiskPain.ok &&
    typeof highRiskPain.data?.data?.recommendation?.summary === 'string' &&
    Array.isArray(highRiskPain.data?.data?.recommendation?.modifications) &&
    highRiskPain.data.data.recommendation.modifications.length > 0;
  checks.push({
    name: 'Recommendations generated',
    success: !!recommendationQuality,
    detail: recommendationQuality ? 'Summary and modification list generated' : 'Recommendation output missing',
  });

  const today = await getJson(`/joint-health/${userId}/today`);
  checks.push({
    name: 'Today retrieval',
    success: today.ok && !!today.data?.data?.recommendation?.summary,
    detail: today.ok ? 'today record returned with recommendation' : 'Request failed',
  });

  const history = await getJson(`/joint-health/${userId}/history`);
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
        typeof record.affectedArea === 'string' &&
        typeof record.jointHealthStatus === 'string' &&
        typeof record.riskLevel === 'string' &&
        !!record.inputs &&
        !!record.recommendation?.summary,
    );
  checks.push({
    name: 'Persistence structure',
    success: !!persistenceStructure,
    detail: persistenceStructure
      ? 'date/area/status/risk/inputs/recommendation present'
      : 'Missing persisted fields',
  });

  const frontendScreen = path.resolve(__dirname, '../../../mobile/src/screens/JointHealthStatusScreen.tsx');
  const frontendService = path.resolve(__dirname, '../../../mobile/src/services/jointHealthEngineService.ts');
  checks.push({
    name: 'Frontend wiring',
    success: existsSync(frontendScreen) && existsSync(frontendService),
    detail: 'Joint health screen/service files exist',
  });

  checks.forEach(check => {
    console.log(`${check.success ? '✅' : '❌'} ${check.name} — ${check.detail}`);
  });

  const categories = {
    riskClassification: checks
      .filter(c => ['No pain scenario', 'Mild soreness scenario', 'Moderate pain scenario', 'High-risk pain scenario'].includes(c.name))
      .every(c => c.success),
    recommendations: checks
      .filter(c => c.name === 'Recommendations generated')
      .every(c => c.success),
    persistence: checks
      .filter(c => ['Persistence structure', 'History retrieval'].includes(c.name))
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
  console.log(`risk classification: ${categories.riskClassification ? 'PASS' : 'FAIL'}`);
  console.log(`recommendations: ${categories.recommendations ? 'PASS' : 'FAIL'}`);
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
  console.error('Joint health E2E validation failed:', error);
  process.exit(1);
});
