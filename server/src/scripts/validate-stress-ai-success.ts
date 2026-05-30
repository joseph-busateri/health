import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { promisify } from 'util';
import { execFile } from 'child_process';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const execFileAsync = promisify(execFile);
const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = '09e208b8-ff5c-4397-b289-4b019b149b2f';

interface StressScenario {
  interviewStressLevel: number;
  hrv: number;
  sleepHours: number;
  workoutLoad: number;
  recoveryScore: number;
}

async function makeRequest(url: string) {
  try {
    const response = await axios.get(url);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

function summarizeRecommendations(recommendations: any[]): Array<{
  id: string;
  sourceEngine: string;
  title: string;
  createdAt: string;
  state: string;
}> {
  if (!Array.isArray(recommendations)) return [];

  return recommendations.map((r: any) => ({
    id: r?.id ?? '',
    sourceEngine: r?.sourceEngine ?? '',
    title: r?.title ?? '',
    createdAt: r?.createdAt ?? r?.generatedAt ?? '',
    state: r?.state ?? '',
  }));
}

function getLatestStressRecommendation(recommendations: any[]): any | null {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return null;
  }

  const stressRecommendations = recommendations.filter(
    (r: any) => r?.sourceEngine === 'stress'
  );

  if (stressRecommendations.length === 0) {
    return null;
  }

  return stressRecommendations.sort((a: any, b: any) => {
    const aTime = new Date(a?.createdAt ?? a?.generatedAt ?? 0).getTime();
    const bTime = new Date(b?.createdAt ?? b?.generatedAt ?? 0).getTime();
    return bTime - aTime;
  })[0];
}

async function main() {
  console.log('='.repeat(80));
  console.log('Stress AI Success Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  const { getActiveRecommendations } = await import('../services/recommendationEngineService');

  const scenarioPath = path.resolve(__dirname, '../../../tests/stress-ai-scenario.json');
  if (!fs.existsSync(scenarioPath)) {
    console.error(`Scenario file not found: ${scenarioPath}`);
    process.exit(1);
  }

  const scenario: StressScenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));

  console.log('\nCanonical Scenario:');
  console.log(JSON.stringify(scenario, null, 2));

  logs.push(`Scenario loaded from ${scenarioPath}`);
  logs.push(`Scenario payload: ${JSON.stringify(scenario)}`);
  logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

  const queryParams = new URLSearchParams({
    regenerate: 'true',
    interview_stress_level: scenario.interviewStressLevel.toString(),
    hrv: scenario.hrv.toString(),
    sleep_hours: scenario.sleepHours.toString(),
    workout_load: scenario.workoutLoad.toString(),
    recovery_score: scenario.recoveryScore.toString(),
  });

  console.log('\n--- Step 1: Call Stress Endpoint ---');
  const stressUrl = `${BASE_URL}/stress/${TEST_USER_ID}/today?${queryParams}`;
  const stressResponse = await makeRequest(stressUrl);

  if (!stressResponse.success) {
    errors.push('Stress endpoint failed');
    logs.push(`Stress endpoint error: ${JSON.stringify(stressResponse.error)}`);
    console.log('❌ Stress endpoint failed');
  } else {
    logs.push('Stress endpoint succeeded');
    console.log('✅ Stress endpoint succeeded');
    console.log('Stress Response:', JSON.stringify(stressResponse.data, null, 2));
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log('\n--- Step 2: Query Persisted Recommendation ---');

  let persistedRecord: any = null;

  try {
    const { recommendations } = await getActiveRecommendations(TEST_USER_ID);
    const recommendationSummary = summarizeRecommendations(recommendations);

    console.log('Active Recommendations:', JSON.stringify(recommendationSummary, null, 2));
    logs.push(`Active recommendations fetched for persistence check: ${recommendations.length}`);
    logs.push(`Active recommendations summary: ${JSON.stringify(recommendationSummary)}`);

    persistedRecord = getLatestStressRecommendation(recommendations);

    if (persistedRecord) {
      logs.push(`Stress recommendation found in persisted records: ${persistedRecord.id}`);
      console.log('✅ Stress recommendation found in persisted records');
    } else {
      errors.push('No stress recommendation found in persisted records');
      logs.push('No stress recommendation found in persisted records');
      console.log('❌ No stress recommendation found in persisted records');
    }
  } catch (error: any) {
    errors.push('Persisted query failed');
    logs.push(`Persisted query error: ${error.message}`);
  }

  console.log('\n--- Step 3: Query Retrieval Path ---');

  let retrievalResult: any = null;

  try {
    const { recommendations } = await getActiveRecommendations(TEST_USER_ID);
    const recommendationSummary = summarizeRecommendations(recommendations);

    console.log('Retrieved Active Recommendations:', JSON.stringify(recommendationSummary, null, 2));
    logs.push(`Active recommendations fetched for retrieval check: ${recommendations.length}`);
    logs.push(`Retrieval recommendations summary: ${JSON.stringify(recommendationSummary)}`);

    retrievalResult = getLatestStressRecommendation(recommendations);

    if (retrievalResult) {
      logs.push(`Stress recommendation found in retrieval: ${retrievalResult.id}`);
      console.log('✅ Stress recommendation found in retrieval');
    } else {
      errors.push('No stress recommendation found in retrieval');
      logs.push('No stress recommendation found in retrieval');
      console.log('❌ No stress recommendation found in retrieval');
    }
  } catch (error: any) {
    errors.push('Retrieval failed');
    logs.push(`Retrieval error: ${error.message}`);
  }

  console.log('\n--- Step 4: Validate AI Enrichment ---');

  if (persistedRecord) {
    const title = String(persistedRecord.title ?? '').trim();
    const description = String(persistedRecord.description ?? '').trim();
    const sourceEngine = String(persistedRecord.sourceEngine ?? '').trim();

    const looksLikeFallback =
      title.toLowerCase() === 'reduce load and prioritize recovery today';

    const hasRichAITitle = title.length >= 15 && !looksLikeFallback;

    const hasRichAIDescription = description.length >= 80;

    const aiIndicatorsPresent =
      sourceEngine === 'stress' && hasRichAITitle && hasRichAIDescription;

    if (aiIndicatorsPresent) {
      logs.push('AI enrichment indicators present in persisted recommendation');
      console.log('✅ AI enrichment indicators present');
    } else {
      errors.push('AI enrichment indicators missing or incomplete');
      logs.push(
        `AI enrichment indicators incomplete: ${JSON.stringify({
          sourceEngine,
          title,
          descriptionLength: description.length,
          looksLikeFallback,
          hasRichAITitle,
          hasRichAIDescription,
        })}`
      );
      console.log('❌ AI enrichment indicators missing or incomplete');
    }
  } else {
    errors.push('Cannot validate AI enrichment - no persisted record');
    logs.push('Cannot validate AI enrichment - no persisted record');
  }

  console.log('\n--- Step 5: Validate Persistence Shape ---');

  if (persistedRecord) {
    const requiredFields = [
      'id',
      'sourceEngine',
      'title',
      'description',
      'priority',
      'urgencyScore',
      'category',
      'state',
    ];

    const missingFields = requiredFields.filter((field) => !(field in persistedRecord));

    if (missingFields.length === 0) {
      logs.push('All required fields present');
      console.log('✅ All required fields present');
    } else {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
      logs.push(`Missing required fields: ${missingFields.join(', ')}`);
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
    }

    const optionalAIFields = [
      'reasonCodes',
      'recommendationGroup',
      'supportingMetrics',
      'rationale',
      'confidenceLevel',
      'dataQualityScore',
    ];

    const presentOptionalAIFields = optionalAIFields.filter((field) => field in persistedRecord);

    logs.push(`Optional AI fields present in retrieval shape: ${presentOptionalAIFields.join(', ')}`);
    console.log(
      `ℹ️ Optional AI fields present in retrieval shape: ${
        presentOptionalAIFields.length > 0 ? presentOptionalAIFields.join(', ') : 'none exposed by retrieval mapper'
      }`
    );
  }

  console.log('\n--- Step 6: Validate Retrieval Matches Persistence ---');

  if (persistedRecord && retrievalResult) {
    if (persistedRecord.id === retrievalResult.id) {
      logs.push('Retrieval matches persisted record');
      console.log('✅ Retrieval matches persisted record');
    } else {
      errors.push('Retrieval does not match persisted record');
      logs.push(
        `Retrieval mismatch: persisted=${persistedRecord.id}, retrieval=${retrievalResult.id}`
      );
      console.log('❌ Retrieval does not match persisted record');
    }
  }

  const result = {
    success: errors.length === 0,
    timestamp: new Date().toISOString(),
    scenario,
    logs,
    errors,
  };

  const outputPath = path.resolve(__dirname, '../../validation/stress-ai-success.json');
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n✅ Results saved to: ${outputPath}`);

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Success: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach((error) => console.log(`  - ${error}`));
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Validation failed:', error);
  process.exit(1);
});
