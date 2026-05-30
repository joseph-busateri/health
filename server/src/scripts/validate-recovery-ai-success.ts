/**
 * Recovery AI Success Validation Script
 *
 * Tests Recovery Engine AI enrichment with canonical scenario.
 * Validates that AI enrichment succeeds and recommendation is persisted.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const execFileAsync = promisify(execFile);
const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';
const TEST_USER_ID = '09e208b8-ff5c-4397-b289-4b019b149b2f';

interface RecoveryScenario {
  sleepHours: number;
  sleepQuality: string;
  soreness: number;
  fatigue: number;
  readiness: number;
  recentTrainingLoad: string;
  recoveryTrend: string;
}

interface ValidationResult {
  scenario: RecoveryScenario;
  response: any;
  persisted_record: any;
  retrieval_result: any;
  logs: string[];
  timestamp: string;
  success: boolean;
  errors: string[];
}

async function makeRequest(url: string): Promise<{ ok: boolean; data: any; status: number }> {
  console.log(`\nCalling: ${url}`);

  try {
    const { stdout } = await execFileAsync('curl.exe', [
      '-s',
      '-w',
      '\n__STATUS__:%{http_code}',
      url,
    ]);

    const marker = '\n__STATUS__:';
    const markerIndex = stdout.lastIndexOf(marker);

    const body = markerIndex >= 0 ? stdout.slice(0, markerIndex) : stdout;
    const statusText = markerIndex >= 0 ? stdout.slice(markerIndex + marker.length).trim() : '0';
    const status = Number(statusText) || 0;

    let data: any = {};
    try {
      data = body ? JSON.parse(body) : {};
    } catch {
      data = { raw: body };
    }

    console.log(`Status: ${status}`);

    return {
      ok: status >= 200 && status < 300,
      data,
      status,
    };
  } catch (error: any) {
    console.log('Status: request failed');
    console.log('Response:', error?.message ?? error);

    return {
      ok: false,
      data: { error: error?.message ?? 'curl failed' },
      status: 0,
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

function getLatestRecoveryRecommendation(recommendations: any[]): any | null {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return null;
  }

  const recoveryRecommendations = recommendations.filter((r: any) => r?.sourceEngine === 'recovery');

  if (recoveryRecommendations.length === 0) {
    return null;
  }

  return recoveryRecommendations.sort((a: any, b: any) => {
    const aTime = new Date(a?.createdAt ?? a?.generatedAt ?? 0).getTime();
    const bTime = new Date(b?.createdAt ?? b?.generatedAt ?? 0).getTime();
    return bTime - aTime;
  })[0];
}

async function main() {
  console.log('='.repeat(80));
  console.log('Recovery AI Success Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  const { getActiveRecommendations } = await import('../services/recommendationEngineService');

  const scenarioPath = path.resolve(__dirname, '../../tests/recovery-ai-scenario.json');
  if (!fs.existsSync(scenarioPath)) {
    console.error(`Scenario file not found: ${scenarioPath}`);
    process.exit(1);
  }

  const scenario: RecoveryScenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));
  console.log('\nCanonical Scenario:');
  console.log(JSON.stringify(scenario, null, 2));

  logs.push(`Scenario loaded from ${scenarioPath}`);
  logs.push(`Scenario payload: ${JSON.stringify(scenario)}`);
  logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

  const queryParams = new URLSearchParams({
    regenerate: 'true',
    sleep_hours: scenario.sleepHours.toString(),
    sleep_quality: scenario.sleepQuality === 'poor' ? '2' : '3',
    hrv: '28',
    resting_hr: '84',
    stress_level: '5',
    workout_load: '9',
    verbal_recovery: '2',
    adherence_score: '45',
  });

  console.log('\n--- Step 1: Call Recovery Endpoint ---');
  const recoveryUrl = `${BASE_URL}/recovery/${TEST_USER_ID}/today?${queryParams}`;
  const recoveryResponse = await makeRequest(recoveryUrl);

  if (!recoveryResponse.ok) {
    errors.push(`Recovery endpoint failed: ${recoveryResponse.status}`);
    logs.push(`Recovery endpoint error: ${JSON.stringify(recoveryResponse.data)}`);
  } else {
    logs.push(`Recovery endpoint success: ${JSON.stringify(recoveryResponse.data)}`);
    console.log('Recovery Response:', JSON.stringify(recoveryResponse.data, null, 2));
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

    persistedRecord = getLatestRecoveryRecommendation(recommendations);

    if (persistedRecord) {
      logs.push(`Persisted recommendation found: ${persistedRecord.id}`);
      console.log('Persisted Recommendation:', JSON.stringify(persistedRecord, null, 2));
    } else {
      errors.push('No recovery recommendation found in persisted records');
      logs.push('No recovery recommendation found in active recommendations');
    }
  } catch (error: any) {
    errors.push(`Failed to query persisted recommendations: ${error.message}`);
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

    retrievalResult = getLatestRecoveryRecommendation(recommendations);

    if (retrievalResult) {
      logs.push(`Retrieval successful: ${retrievalResult.id}`);
      console.log('Retrieved Recommendation:', JSON.stringify(retrievalResult, null, 2));
    } else {
      errors.push('No recovery recommendation found in retrieval');
      logs.push('No recovery recommendation found during retrieval');
    }
  } catch (error: any) {
    errors.push(`Retrieval failed: ${error.message}`);
    logs.push(`Retrieval error: ${error.message}`);
  }

  console.log('\n--- Step 4: Validate AI Enrichment ---');

  if (persistedRecord) {
    const title = String(persistedRecord.title ?? '').trim();
    const description = String(persistedRecord.description ?? '').trim();
    const sourceEngine = String(persistedRecord.sourceEngine ?? '').trim();

    const looksLikeFallback =
      title.toLowerCase() === 'take a recovery day';

    const hasRichAITitle =
      title.length >= 15 && !looksLikeFallback;

    const hasRichAIDescription =
      description.length >= 80;

    const aiIndicatorsPresent =
      sourceEngine === 'recovery' &&
      hasRichAITitle &&
      hasRichAIDescription;

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

    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
      logs.push(`Missing required fields: ${missingFields.join(', ')}`);
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
    } else {
      logs.push('All required fields present');
      console.log('✅ All required fields present');
    }

    const optionalAIFields = [
      'reasonCodes',
      'recommendationGroup',
      'supportingMetrics',
      'isInsightOnly',
      'requiresUserDecision',
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

  const result: ValidationResult = {
    scenario,
    response: recoveryResponse.data,
    persisted_record: persistedRecord,
    retrieval_result: retrievalResult,
    logs,
    timestamp: new Date().toISOString(),
    success: errors.length === 0,
    errors,
  };

  const outputPath = path.resolve(__dirname, '../../validation/recovery-ai-success.json');
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

  if (!result.success) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Validation failed:', error);
  process.exit(1);
});