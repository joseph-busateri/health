import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

async function main() {
  console.log('='.repeat(80));
  console.log('Stress Fallback Validation (AI Disabled)');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  const scenarioPath = path.resolve(__dirname, '../../../tests/stress-ai-scenario.json');
  if (!fs.existsSync(scenarioPath)) {
    console.error(`Scenario file not found: ${scenarioPath}`);
    process.exit(1);
  }

  const scenario: StressScenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));

  console.log('\nCanonical Scenario:');
  console.log(JSON.stringify(scenario, null, 2));

  logs.push(`Scenario loaded from ${scenarioPath}`);
  logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);
  logs.push('AI enrichment disabled for this test');

  const queryParams = new URLSearchParams({
    regenerate: 'true',
    interview_stress_level: scenario.interviewStressLevel.toString(),
    hrv: scenario.hrv.toString(),
    sleep_hours: scenario.sleepHours.toString(),
    workout_load: scenario.workoutLoad.toString(),
    recovery_score: scenario.recoveryScore.toString(),
  });

  console.log('\n--- Step 1: Call Stress Endpoint (AI Disabled) ---');
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

  console.log('\n--- Step 2: Validate Fallback Recommendation ---');

  if (stressResponse.success && stressResponse.data.recommendation) {
    const rec = stressResponse.data.recommendation;

    if (rec.summary && typeof rec.summary === 'string') {
      logs.push('Fallback recommendation has summary');
      console.log('✅ Fallback recommendation has summary');
    } else {
      errors.push('Fallback recommendation missing summary');
      console.log('❌ Fallback recommendation missing summary');
    }

    if (Array.isArray(rec.actions) && rec.actions.length > 0) {
      logs.push(`Fallback recommendation has ${rec.actions.length} actions`);
      console.log(`✅ Fallback recommendation has ${rec.actions.length} actions`);
    } else {
      errors.push('Fallback recommendation missing actions');
      console.log('❌ Fallback recommendation missing actions');
    }

    if (rec.source === 'fallback' || rec.source === undefined) {
      logs.push('Fallback source correctly identified');
      console.log('✅ Fallback source correctly identified');
    } else {
      errors.push(`Unexpected source: ${rec.source}`);
      console.log(`❌ Unexpected source: ${rec.source}`);
    }
  } else {
    errors.push('No recommendation in response');
    console.log('❌ No recommendation in response');
  }

  const result = {
    success: errors.length === 0,
    timestamp: new Date().toISOString(),
    scenario,
    logs,
    errors,
  };

  const outputPath = path.resolve(__dirname, '../../validation/stress-fallback.json');
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
