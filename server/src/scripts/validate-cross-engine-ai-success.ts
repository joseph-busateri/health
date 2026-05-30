import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'cross-engine-ai-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Cross-Engine AI Success Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  const { getActiveRecommendations } = await import('../services/recommendationEngineService');

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

  console.log('\n--- Step 2: Query Persisted Recommendation ---');

  let persistedRecommendations: any[] = [];

  try {
    const result = await getActiveRecommendations(TEST_USER_ID);
    persistedRecommendations = result.recommendations || [];
    logs.push(`Active recommendations fetched: ${persistedRecommendations.length}`);

    const crossEngineRec = persistedRecommendations.find(r => r.sourceEngine === 'holistic');
    if (crossEngineRec) {
      console.log('✅ Cross-Engine recommendation found in persisted records');
    } else {
      errors.push('No cross-engine recommendation found in persisted records');
      console.log('❌ No cross-engine recommendation found in persisted records');
    }
  } catch (error: any) {
    logs.push(`Failed to fetch active recommendations: ${error.message}`);
    errors.push('Failed to query persisted recommendations');
    console.log('❌ Failed to query persisted recommendations');
  }

  console.log('\n--- Step 3: Validate Cross-Engine Synthesis ---');

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

    if (data.evidence?.signals && Array.isArray(data.evidence.signals)) {
      console.log(`✅ Evidence signals present: ${data.evidence.signals.length}`);
    } else {
      errors.push('Evidence signals missing');
      console.log('❌ Evidence signals missing');
    }

    if (data.recommendation) {
      const rec = data.recommendation;

      if (rec.type === 'cross_engine') {
        console.log('✅ Recommendation type is cross_engine');
      } else {
        errors.push(`Expected type 'cross_engine', got '${rec.type}'`);
        console.log(`❌ Expected type 'cross_engine', got '${rec.type}'`);
      }

      if (rec.priority) {
        console.log(`✅ Priority set: ${rec.priority}`);
      } else {
        errors.push('Priority not set');
        console.log('❌ Priority not set');
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

      if (rec.source) {
        console.log(`✅ Source: ${rec.source}`);
      } else {
        errors.push('Source missing');
        console.log('❌ Source missing');
      }
    } else {
      errors.push('No recommendation in response');
      console.log('❌ No recommendation in response');
    }
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'cross-engine-ai-success.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        success: errors.length === 0,
        timestamp: new Date().toISOString(),
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
