import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'adaptive-fallback-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Adaptive Intelligence Fallback Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Checking Environment ---');
  const aiEnabled = process.env.USE_AI_ENRICHMENT === 'true';
  const adaptiveAIEnabled = process.env.USE_AI_ENRICHMENT_ADAPTIVE === 'true';

  console.log(`USE_AI_ENRICHMENT: ${process.env.USE_AI_ENRICHMENT}`);
  console.log(`USE_AI_ENRICHMENT_ADAPTIVE: ${process.env.USE_AI_ENRICHMENT_ADAPTIVE}`);

  if (aiEnabled && adaptiveAIEnabled) {
    console.log('\n⚠️  WARNING: AI enrichment is enabled. For true fallback validation, set USE_AI_ENRICHMENT_ADAPTIVE=false');
    console.log('Continuing anyway - system should still work...\n');
  }

  console.log('\n--- Step 1: Call Adaptive Endpoint ---');

  let adaptiveResponse: any = null;

  try {
    logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

    const response = await axios.get(`${BASE_URL}/adaptive/${TEST_USER_ID}/today?regenerate=true`);
    adaptiveResponse = response.data;

    logs.push(`Adaptive endpoint response received: ${response.status}`);
    console.log('✅ Adaptive endpoint succeeded');
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    logs.push(`Adaptive endpoint error: ${JSON.stringify(errorMsg)}`);
    errors.push('Adaptive endpoint failed');
    console.log('❌ Adaptive endpoint failed');
  }

  console.log('\n--- Step 2: Validate Fallback Behavior ---');

  if (adaptiveResponse?.data?.recommendation) {
    const rec = adaptiveResponse.data.recommendation;

    if (rec.source === 'fallback' || !rec.source) {
      console.log(`✅ Recommendation source is fallback: ${rec.source || 'undefined'}`);
    } else if (rec.source === 'ai_enriched' && !adaptiveAIEnabled) {
      errors.push(`Expected fallback source, got 'ai_enriched' despite AI being disabled`);
      console.log(`❌ Expected fallback source, got 'ai_enriched' despite AI being disabled`);
    } else {
      console.log(`ℹ️  Source: ${rec.source} (AI may have succeeded despite being tested for fallback)`);
    }

    if (rec.summary && rec.summary.length > 0) {
      console.log('✅ Summary exists');
    } else {
      errors.push('Summary missing or empty');
      console.log('❌ Summary missing or empty');
    }

    if (Array.isArray(rec.actions) && rec.actions.length > 0) {
      console.log(`✅ Actions present: ${rec.actions.length}`);
    } else {
      errors.push('Actions missing or empty');
      console.log('❌ Actions missing or empty');
    }
  } else {
    errors.push('No recommendation in response');
    console.log('❌ No recommendation in response');
  }

  console.log('\n--- Step 3: Validate Response Structure ---');

  if (adaptiveResponse?.success === true) {
    console.log('✅ API response has success=true');
  } else {
    errors.push('API response missing success field or not true');
    console.log('❌ API response missing success field or not true');
  }

  if (adaptiveResponse?.data) {
    console.log('✅ API response has data field');
  } else {
    errors.push('API response missing data field');
    console.log('❌ API response missing data field');
  }

  if (Array.isArray(adaptiveResponse?.data?.effectiveness)) {
    console.log(`✅ Effectiveness scores present: ${adaptiveResponse.data.effectiveness.length}`);
  } else {
    errors.push('Effectiveness scores missing');
    console.log('❌ Effectiveness scores missing');
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'adaptive-fallback.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        success: errors.length === 0,
        timestamp: new Date().toISOString(),
        aiEnabled,
        adaptiveAIEnabled,
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
