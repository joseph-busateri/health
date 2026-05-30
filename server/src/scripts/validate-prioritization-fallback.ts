import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'prioritization-fallback-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Recommendation Prioritization Fallback Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Checking Environment ---');
  const aiEnabled = process.env.USE_AI_ENRICHMENT === 'true';
  const prioritizationAIEnabled = process.env.USE_AI_PRIORITIZATION === 'true';

  console.log(`USE_AI_ENRICHMENT: ${process.env.USE_AI_ENRICHMENT}`);
  console.log(`USE_AI_PRIORITIZATION: ${process.env.USE_AI_PRIORITIZATION}`);

  if (aiEnabled && prioritizationAIEnabled) {
    console.log('\n⚠️  WARNING: AI prioritization is enabled. For true fallback validation, set USE_AI_PRIORITIZATION=false');
    console.log('Continuing anyway - system should still work...\n');
  }

  console.log('\n--- Step 1: Call Prioritization Endpoint ---');

  let prioritizationResponse: any = null;

  try {
    logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

    const response = await axios.get(`${BASE_URL}/priorities/${TEST_USER_ID}/today?regenerate=true`);
    prioritizationResponse = response.data;

    logs.push(`Prioritization endpoint response received: ${response.status}`);
    console.log('✅ Prioritization endpoint succeeded');
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    logs.push(`Prioritization endpoint error: ${JSON.stringify(errorMsg)}`);
    errors.push('Prioritization endpoint failed');
    console.log('❌ Prioritization endpoint failed');
  }

  console.log('\n--- Step 2: Validate Fallback Behavior ---');

  if (prioritizationResponse?.data) {
    const data = prioritizationResponse.data;

    if (Array.isArray(data.topPriorities)) {
      console.log(`✅ topPriorities array present: ${data.topPriorities.length} items`);
    } else {
      errors.push('topPriorities missing or not array');
      console.log('❌ topPriorities missing or not array');
    }

    if (Array.isArray(data.allRecommendations)) {
      console.log(`✅ allRecommendations array present: ${data.allRecommendations.length} items`);
    } else {
      errors.push('allRecommendations missing or not array');
      console.log('❌ allRecommendations missing or not array');
    }

    if (data.topPriorities && data.topPriorities.length > 0) {
      const topRec = data.topPriorities[0];

      if (topRec.summary && topRec.summary.length > 0) {
        console.log('✅ Top priority has summary');
      } else {
        errors.push('Top priority missing summary');
        console.log('❌ Top priority missing summary');
      }

      if (Array.isArray(topRec.actions) && topRec.actions.length > 0) {
        console.log(`✅ Top priority has actions: ${topRec.actions.length}`);
      } else {
        errors.push('Top priority missing or empty actions');
        console.log('❌ Top priority missing or empty actions');
      }

      if (typeof topRec.score === 'number') {
        console.log(`✅ Top priority has score: ${topRec.score}`);
      } else {
        errors.push('Top priority missing score');
        console.log('❌ Top priority missing score');
      }
    }
  }

  console.log('\n--- Step 3: Validate Response Structure ---');

  if (prioritizationResponse?.success === true) {
    console.log('✅ API response has success=true');
  } else {
    errors.push('API response missing success field or not true');
    console.log('❌ API response missing success field or not true');
  }

  if (prioritizationResponse?.data) {
    console.log('✅ API response has data field');
  } else {
    errors.push('API response missing data field');
    console.log('❌ API response missing data field');
  }

  console.log('\n--- Step 4: Validate Core Functionality ---');

  if (prioritizationResponse?.data?.topPriorities) {
    const priorities = prioritizationResponse.data.topPriorities;

    const isSorted = priorities.every((rec: any, i: number, arr: any[]) => 
      i === 0 || arr[i - 1].score >= rec.score
    );
    if (isSorted) {
      console.log('✅ Priorities sorted correctly');
    } else {
      errors.push('Priorities not sorted correctly');
      console.log('❌ Priorities not sorted correctly');
    }

    if (priorities.length <= 3) {
      console.log(`✅ Top priorities limited to ${priorities.length}`);
    } else {
      errors.push(`Too many top priorities: ${priorities.length}`);
      console.log(`❌ Too many top priorities: ${priorities.length}`);
    }
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'prioritization-fallback.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        success: errors.length === 0,
        timestamp: new Date().toISOString(),
        aiEnabled,
        prioritizationAIEnabled,
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
