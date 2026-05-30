import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'autonomous-fallback-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Autonomous Optimization Fallback Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Checking Environment ---');
  const aiEnabled = process.env.USE_AI_ENRICHMENT === 'true';
  const autonomousAIEnabled = process.env.USE_AI_ENRICHMENT_AUTONOMOUS === 'true';

  console.log(`USE_AI_ENRICHMENT: ${process.env.USE_AI_ENRICHMENT}`);
  console.log(`USE_AI_ENRICHMENT_AUTONOMOUS: ${process.env.USE_AI_ENRICHMENT_AUTONOMOUS}`);

  if (aiEnabled && autonomousAIEnabled) {
    console.log('\n⚠️  WARNING: AI enrichment is enabled. For true fallback validation, set USE_AI_ENRICHMENT_AUTONOMOUS=false');
    console.log('Continuing anyway - system should still work...\n');
  }

  console.log('\n--- Step 1: Call Autonomous Endpoint ---');

  let autonomousResponse: any = null;

  try {
    logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

    const response = await axios.get(`${BASE_URL}/autonomous/${TEST_USER_ID}/today?regenerate=true`);
    autonomousResponse = response.data;

    logs.push(`Autonomous endpoint response received: ${response.status}`);
    console.log('✅ Autonomous endpoint succeeded');
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    logs.push(`Autonomous endpoint error: ${JSON.stringify(errorMsg)}`);
    errors.push('Autonomous endpoint failed');
    console.log('❌ Autonomous endpoint failed');
  }

  console.log('\n--- Step 2: Validate Fallback Behavior ---');

  if (autonomousResponse?.data?.plan) {
    const plan = autonomousResponse.data.plan;

    if (plan.source === 'fallback' || !plan.source) {
      console.log(`✅ Plan source is fallback: ${plan.source || 'undefined'}`);
    } else if (plan.source === 'ai_enriched' && !autonomousAIEnabled) {
      errors.push(`Expected fallback source, got 'ai_enriched' despite AI being disabled`);
      console.log(`❌ Expected fallback source, got 'ai_enriched' despite AI being disabled`);
    } else {
      console.log(`ℹ️  Source: ${plan.source} (AI may have succeeded despite being tested for fallback)`);
    }

    if (plan.summary && plan.summary.length > 0) {
      console.log('✅ Summary exists');
    } else {
      errors.push('Summary missing or empty');
      console.log('❌ Summary missing or empty');
    }

    if (Array.isArray(plan.adjustments) && plan.adjustments.length > 0) {
      console.log(`✅ Adjustments present: ${plan.adjustments.length}`);
    } else {
      errors.push('Adjustments missing or empty');
      console.log('❌ Adjustments missing or empty');
    }
  } else {
    errors.push('No plan in response');
    console.log('❌ No plan in response');
  }

  console.log('\n--- Step 3: Validate Response Structure ---');

  if (autonomousResponse?.success === true) {
    console.log('✅ API response has success=true');
  } else {
    errors.push('API response missing success field or not true');
    console.log('❌ API response missing success field or not true');
  }

  if (autonomousResponse?.data) {
    console.log('✅ API response has data field');
  } else {
    errors.push('API response missing data field');
    console.log('❌ API response missing data field');
  }

  if (autonomousResponse?.data?.plan?.priority) {
    console.log(`✅ Plan priority present: ${autonomousResponse.data.plan.priority}`);
  } else {
    errors.push('Plan priority missing');
    console.log('❌ Plan priority missing');
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'autonomous-fallback.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        success: errors.length === 0,
        timestamp: new Date().toISOString(),
        aiEnabled,
        autonomousAIEnabled,
        logs,
        errors,
      },
      null,
      2,
    ),
  );

  console.log(`\n✅ Results saved to: ${outputPath}`);

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Success: ${errors.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  process.exit(errors.length === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
