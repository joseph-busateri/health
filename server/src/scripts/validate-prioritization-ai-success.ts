import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'prioritization-ai-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Recommendation Prioritization AI Success Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

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

  console.log('\n--- Step 2: Validate Prioritization Structure ---');

  if (prioritizationResponse?.data) {
    const data = prioritizationResponse.data;

    if (Array.isArray(data.topPriorities)) {
      console.log(`✅ topPriorities is array: ${data.topPriorities.length} items`);
    } else {
      errors.push('topPriorities is not an array');
      console.log('❌ topPriorities is not an array');
    }

    if (Array.isArray(data.allRecommendations)) {
      console.log(`✅ allRecommendations is array: ${data.allRecommendations.length} items`);
    } else {
      errors.push('allRecommendations is not an array');
      console.log('❌ allRecommendations is not an array');
    }

    if (data.topPriorities && data.topPriorities.length > 0) {
      const topRec = data.topPriorities[0];

      if (topRec.id) {
        console.log('✅ Top priority has id');
      } else {
        errors.push('Top priority missing id');
        console.log('❌ Top priority missing id');
      }

      if (topRec.source) {
        console.log(`✅ Top priority has source: ${topRec.source}`);
      } else {
        errors.push('Top priority missing source');
        console.log('❌ Top priority missing source');
      }

      if (topRec.priority) {
        console.log(`✅ Top priority has priority: ${topRec.priority}`);
      } else {
        errors.push('Top priority missing priority');
        console.log('❌ Top priority missing priority');
      }

      if (topRec.summary) {
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

  console.log('\n--- Step 3: Validate Scoring and Sorting ---');

  if (prioritizationResponse?.data?.topPriorities) {
    const priorities = prioritizationResponse.data.topPriorities;

    const allHaveScores = priorities.every((rec: any) => typeof rec.score === 'number');
    if (allHaveScores) {
      console.log('✅ All priorities have numeric scores');
    } else {
      errors.push('Some priorities missing scores');
      console.log('❌ Some priorities missing scores');
    }

    const isSorted = priorities.every((rec: any, i: number, arr: any[]) => 
      i === 0 || arr[i - 1].score >= rec.score
    );
    if (isSorted) {
      console.log('✅ Priorities sorted by score descending');
    } else {
      errors.push('Priorities not properly sorted');
      console.log('❌ Priorities not properly sorted');
    }

    if (priorities.length > 0) {
      const scores = priorities.map((r: any) => r.score);
      console.log(`📊 Score range: ${Math.min(...scores)} - ${Math.max(...scores)}`);
    }
  }

  console.log('\n--- Step 4: Validate Deduplication and Conflict Resolution ---');

  if (prioritizationResponse?.data) {
    const { topPriorities, allRecommendations } = prioritizationResponse.data;

    if (topPriorities.length <= 3) {
      console.log(`✅ Top priorities limited to ${topPriorities.length} (≤ 3)`);
    } else {
      errors.push(`Too many top priorities: ${topPriorities.length}`);
      console.log(`❌ Too many top priorities: ${topPriorities.length}`);
    }

    const hasMergedSources = allRecommendations.some((rec: any) => 
      rec.source && rec.source.includes('+')
    );
    if (hasMergedSources) {
      console.log('✅ Found merged recommendations (deduplication working)');
    } else {
      console.log('ℹ️  No merged recommendations found (may be expected)');
    }
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'prioritization-ai-success.json');
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
