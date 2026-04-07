/**
 * Recovery AI Fallback Validation Script
 * 
 * Tests Recovery Engine with AI enrichment DISABLED.
 * Validates that fallback to direct emission works correctly.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const execFileAsync = promisify(execFile);
const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';
const TEST_USER_ID = 'test-user-recovery-fallback';

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
  ai_disabled: boolean;
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

async function main() {
  console.log('='.repeat(80));
  console.log('Recovery AI Fallback Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  // Verify AI enrichment is disabled
  const aiEnrichmentEnabled = process.env.USE_AI_ENRICHMENT === 'true';
  
  if (aiEnrichmentEnabled) {
    console.error('\n❌ ERROR: USE_AI_ENRICHMENT is enabled');
    console.error('This script requires USE_AI_ENRICHMENT=false in .env');
    console.error('Please disable AI enrichment and re-run this script.');
    process.exit(1);
  }

  console.log('\n✅ AI enrichment is disabled (USE_AI_ENRICHMENT=false)');
  logs.push('AI enrichment disabled');

  // Load canonical scenario
  const scenarioPath = path.resolve(__dirname, '../../tests/recovery-ai-scenario.json');
  if (!fs.existsSync(scenarioPath)) {
    console.error(`Scenario file not found: ${scenarioPath}`);
    process.exit(1);
  }

  const scenario: RecoveryScenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));
  console.log('\nCanonical Scenario:');
  console.log(JSON.stringify(scenario, null, 2));

  // Map scenario to Recovery Engine parameters
  const queryParams = new URLSearchParams({
    regenerate: 'true',
    sleep_hours: scenario.sleepHours.toString(),
    sleep_quality: scenario.sleepQuality === 'poor' ? '2' : '3',
    hrv: '28', // Low HRV for poor recovery
    resting_hr: '84', // Elevated resting HR
    stress_level: '5', // High stress
    workout_load: '9', // High workout load
    verbal_recovery: '2', // Poor verbal recovery
    adherence_score: '45', // Low adherence
  });

  logs.push(`Scenario loaded: ${JSON.stringify(scenario)}`);

  // Step 1: Call Recovery endpoint
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

  // Wait for async processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: Query persisted recommendation from database
  console.log('\n--- Step 2: Query Persisted Recommendation ---');
  
  const recommendationsUrl = `${BASE_URL}/recommendations/${TEST_USER_ID}/active`;
  const persistedResponse = await makeRequest(recommendationsUrl);

  let persistedRecord = null;
  if (persistedResponse.ok && persistedResponse.data?.data) {
    const recommendations = Array.isArray(persistedResponse.data.data) 
      ? persistedResponse.data.data 
      : [persistedResponse.data.data];
    
    persistedRecord = recommendations
      .filter((r: any) => r.sourceEngine === 'recovery')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    if (persistedRecord) {
      logs.push(`Persisted recommendation found: ${persistedRecord.id}`);
      console.log('Persisted Recommendation:', JSON.stringify(persistedRecord, null, 2));
    } else {
      // With AI disabled, recommendation might use direct emission (old flow)
      // This is expected - fallback doesn't go through RecommendationEngine
      logs.push('No recovery recommendation found in RecommendationEngine (expected with fallback)');
      console.log('ℹ️  No recommendation in RecommendationEngine (fallback uses direct emission)');
    }
  } else {
    logs.push(`Persisted query returned: ${persistedResponse.status}`);
  }

  // Step 3: Query retrieval endpoint
  console.log('\n--- Step 3: Query Retrieval Endpoint ---');
  const retrievalResponse = await makeRequest(recommendationsUrl);

  let retrievalResult = null;
  if (retrievalResponse.ok && retrievalResponse.data?.data) {
    const recommendations = Array.isArray(retrievalResponse.data.data) 
      ? retrievalResponse.data.data 
      : [retrievalResponse.data.data];
    
    retrievalResult = recommendations
      .filter((r: any) => r.sourceEngine === 'recovery')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    if (retrievalResult) {
      logs.push(`Retrieval successful: ${retrievalResult.id}`);
      console.log('Retrieved Recommendation:', JSON.stringify(retrievalResult, null, 2));
    } else {
      logs.push('No recovery recommendation in retrieval (expected with fallback)');
      console.log('ℹ️  No recommendation in retrieval (fallback uses direct emission)');
    }
  } else {
    logs.push(`Retrieval returned: ${retrievalResponse.status}`);
  }

  // Step 4: Validate fallback behavior
  console.log('\n--- Step 4: Validate Fallback Behavior ---');
  
  // With AI disabled, the system should use direct emission
  // This means recommendations won't go through RecommendationEngine
  // This is the expected fallback behavior
  
  if (recoveryResponse.ok) {
    logs.push('Recovery endpoint responded successfully');
    console.log('✅ Recovery endpoint responded successfully');
    
    // Validate recovery response structure
    if (recoveryResponse.data?.data) {
      const data = recoveryResponse.data.data;
      
      if (data.recoveryScore !== undefined && data.recoveryStatus) {
        logs.push('Recovery calculation successful');
        console.log('✅ Recovery calculation successful');
      } else {
        errors.push('Recovery calculation incomplete');
      }
      
      if (data.recommendation) {
        logs.push('Deterministic recommendation generated');
        console.log('✅ Deterministic recommendation generated');
      } else {
        errors.push('No recommendation in recovery response');
      }
    }
  } else {
    errors.push('Recovery endpoint failed');
  }

  // Step 5: Validate NO AI enrichment occurred
  console.log('\n--- Step 5: Validate NO AI Enrichment ---');
  
  if (persistedRecord) {
    // If a record exists in RecommendationEngine, it should NOT have AI fields
    // (This would indicate AI enrichment occurred when it shouldn't have)
    const hasAIFields = 
      persistedRecord.reasonCodes || 
      persistedRecord.recommendationGroup;
    
    if (hasAIFields) {
      errors.push('AI enrichment fields present when AI is disabled');
      logs.push('Unexpected AI enrichment fields found');
      console.log('❌ AI enrichment fields present (should not be)');
    } else {
      logs.push('No AI enrichment fields (correct)');
      console.log('✅ No AI enrichment fields (correct)');
    }
  } else {
    // No record in RecommendationEngine is expected with fallback
    logs.push('No RecommendationEngine record (expected with fallback)');
    console.log('✅ No RecommendationEngine record (expected with fallback)');
  }

  // Step 6: Validate deterministic recommendation
  console.log('\n--- Step 6: Validate Deterministic Recommendation ---');
  
  if (recoveryResponse.data?.data?.recommendation) {
    const rec = recoveryResponse.data.data.recommendation;
    
    if (rec.summary && rec.actions) {
      logs.push('Deterministic recommendation has summary and actions');
      console.log('✅ Deterministic recommendation structure valid');
    } else {
      errors.push('Deterministic recommendation incomplete');
    }
  }

  // Build validation result
  const result: ValidationResult = {
    scenario,
    response: recoveryResponse.data,
    persisted_record: persistedRecord,
    retrieval_result: retrievalResult,
    logs,
    timestamp: new Date().toISOString(),
    success: errors.length === 0,
    errors,
    ai_disabled: true,
  };

  // Save result
  const outputPath = path.resolve(__dirname, '../../validation/recovery-ai-fallback.json');
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n✅ Results saved to: ${outputPath}`);

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Success: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  if (!result.success) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Validation failed:', error);
  process.exit(1);
});
