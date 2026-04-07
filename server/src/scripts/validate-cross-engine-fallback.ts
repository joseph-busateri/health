import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'cross-engine-fallback-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Cross-Engine Fallback Validation (AI Disabled)');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Checking Environment ---');
  const aiEnabled = process.env.USE_AI_ENRICHMENT === 'true';
  const crossEngineAIEnabled = process.env.USE_AI_ENRICHMENT_CROSS_ENGINE === 'true';

  console.log(`USE_AI_ENRICHMENT: ${process.env.USE_AI_ENRICHMENT}`);
  console.log(`USE_AI_ENRICHMENT_CROSS_ENGINE: ${process.env.USE_AI_ENRICHMENT_CROSS_ENGINE}`);

  if (aiEnabled && crossEngineAIEnabled) {
    console.log('\n⚠️  WARNING: AI enrichment is enabled. For true fallback validation, set USE_AI_ENRICHMENT_CROSS_ENGINE=false');
    console.log('Continuing anyway - fallback should still trigger on AI failure...\n');
  }

  console.log('\n--- Step 1: Call Cross-Engine Endpoint ---');

  let crossEngineResponse: any = null;

  try {
    logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

    const response = await axios.get(`${BASE_URL}/cross-engine/${TEST_USER_ID}/today?regenerate=true`);
    crossEngineResponse = response.data;

    logs.push(`Cross-Engine endpoint response received: ${response.status}`);
    console.log('✅ Cross-Engine endpoint succeeded');
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    logs.push(`Cross-Engine endpoint error: ${JSON.stringify(errorMsg)}`);
    errors.push('Cross-Engine endpoint failed');
    console.log('❌ Cross-Engine endpoint failed');
  }

  console.log('\n--- Step 2: Validate Fallback Behavior ---');

  if (crossEngineResponse?.data?.recommendation) {
    const rec = crossEngineResponse.data.recommendation;

    // In fallback mode, source should be 'fallback'
    if (rec.source === 'fallback' || !rec.source) {
      console.log(`✅ Recommendation source is fallback: ${rec.source || 'undefined'}`);
    } else if (rec.source === 'ai_enriched' && !crossEngineAIEnabled) {
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

    // Fallback may not have rationale (that's an AI-enriched field)
    if (!rec.rationale) {
      console.log('✅ No rationale (expected for fallback)');
    } else {
      console.log(`ℹ️  Rationale present (AI enrichment may have succeeded): ${rec.rationale.substring(0, 50)}...`);
    }
  } else {
    errors.push('No recommendation in response');
    console.log('❌ No recommendation in response');
  }

  console.log('\n--- Step 3: Validate Response Structure ---');

  if (crossEngineResponse?.data) {
    const data = crossEngineResponse.data;

    if (typeof data.overallStatus === 'string') {
      console.log(`✅ overallStatus present: ${data.overallStatus}`);
    } else {
      errors.push('overallStatus missing');
      console.log('❌ overallStatus missing');
    }

    if (data.evidence) {
      console.log('✅ Evidence field present');
    } else {
      errors.push('Evidence field missing');
      console.log('❌ Evidence field missing');
    }
  }

  console.log('\n--- Step 4: Validate No API Contract Break ---');

  if (crossEngineResponse?.success === true) {
    console.log('✅ API response has success=true');
  } else {
    errors.push('API response missing success field or not true');
    console.log('❌ API response missing success field or not true');
  }

  if (crossEngineResponse?.data) {
    console.log('✅ API response has data field');
  } else {
    errors.push('API response missing data field');
    console.log('❌ API response missing data field');
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'cross-engine-fallback.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        success: errors.length === 0,
        timestamp: new Date().toISOString(),
        aiEnabled,
        crossEngineAIEnabled,
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
