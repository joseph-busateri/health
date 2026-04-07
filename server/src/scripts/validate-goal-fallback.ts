import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'goal-fallback-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Goal-Driven Optimization Fallback Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Checking Environment ---');
  const aiEnabled = process.env.USE_AI_ENRICHMENT === 'true';
  const goalAIEnabled = process.env.USE_AI_ENRICHMENT_GOALS === 'true';

  console.log(`USE_AI_ENRICHMENT: ${process.env.USE_AI_ENRICHMENT}`);
  console.log(`USE_AI_ENRICHMENT_GOALS: ${process.env.USE_AI_ENRICHMENT_GOALS}`);

  if (aiEnabled && goalAIEnabled) {
    console.log('\n⚠️  WARNING: AI enrichment is enabled. For true fallback validation, set USE_AI_ENRICHMENT_GOALS=false');
    console.log('Continuing anyway - system should still work...\n');
  }

  console.log('\n--- Step 1: Set User Goals ---');

  try {
    const setGoalsResponse = await axios.post(`${BASE_URL}/goals/${TEST_USER_ID}`, {
      goals: [
        { type: 'fat_loss', priority: 8 },
        { type: 'cardiovascular', priority: 6 },
      ],
    });

    if (setGoalsResponse.data?.success) {
      console.log('✅ Goals set successfully');
      logs.push('Goals set: fat_loss (8), cardiovascular (6)');
    } else {
      errors.push('Failed to set goals');
      console.log('❌ Failed to set goals');
    }
  } catch (error: any) {
    errors.push('Set goals endpoint failed');
    console.log('❌ Set goals endpoint failed');
  }

  console.log('\n--- Step 2: Call Goal-Driven Endpoint ---');

  let goalResponse: any = null;

  try {
    logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

    const response = await axios.get(`${BASE_URL}/goals/${TEST_USER_ID}/today?regenerate=true`);
    goalResponse = response.data;

    logs.push(`Goal-driven endpoint response received: ${response.status}`);
    console.log('✅ Goal-driven endpoint succeeded');
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    logs.push(`Goal-driven endpoint error: ${JSON.stringify(errorMsg)}`);
    errors.push('Goal-driven endpoint failed');
    console.log('❌ Goal-driven endpoint failed');
  }

  console.log('\n--- Step 3: Validate Fallback Behavior ---');

  if (goalResponse?.data?.plan) {
    const plan = goalResponse.data.plan;

    if (plan.source === 'fallback' || !plan.source) {
      console.log(`✅ Plan source is fallback: ${plan.source || 'undefined'}`);
    } else if (plan.source === 'ai_enriched' && !goalAIEnabled) {
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

    if (typeof plan.goalAlignment === 'number') {
      console.log(`✅ Goal alignment present: ${plan.goalAlignment}%`);
    } else {
      errors.push('Goal alignment missing');
      console.log('❌ Goal alignment missing');
    }
  } else {
    errors.push('No plan in response');
    console.log('❌ No plan in response');
  }

  console.log('\n--- Step 4: Validate Response Structure ---');

  if (goalResponse?.success === true) {
    console.log('✅ API response has success=true');
  } else {
    errors.push('API response missing success field or not true');
    console.log('❌ API response missing success field or not true');
  }

  if (goalResponse?.data) {
    console.log('✅ API response has data field');
  } else {
    errors.push('API response missing data field');
    console.log('❌ API response missing data field');
  }

  if (goalResponse?.data?.goals && Array.isArray(goalResponse.data.goals)) {
    console.log(`✅ Goals stored in record: ${goalResponse.data.goals.length}`);
  } else {
    errors.push('Goals not stored in record');
    console.log('❌ Goals not stored in record');
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'goal-fallback.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        success: errors.length === 0,
        timestamp: new Date().toISOString(),
        aiEnabled,
        goalAIEnabled,
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
