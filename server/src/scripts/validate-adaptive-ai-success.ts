import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'adaptive-ai-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Adaptive Intelligence AI Success Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

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

  console.log('\n--- Step 2: Validate Adaptive Structure ---');

  if (adaptiveResponse?.data) {
    const data = adaptiveResponse.data;

    if (Array.isArray(data.effectiveness)) {
      console.log(`✅ Effectiveness scores present: ${data.effectiveness.length}`);
    } else {
      errors.push('Effectiveness scores missing');
      console.log('❌ Effectiveness scores missing');
    }

    if (Array.isArray(data.userPatterns)) {
      console.log(`✅ User patterns present: ${data.userPatterns.length}`);
    } else {
      errors.push('User patterns missing');
      console.log('❌ User patterns missing');
    }

    if (data.recommendation) {
      const rec = data.recommendation;

      if (rec.type === 'adaptive') {
        console.log('✅ Recommendation type is adaptive');
      } else {
        errors.push(`Expected type 'adaptive', got '${rec.type}'`);
        console.log(`❌ Expected type 'adaptive', got '${rec.type}'`);
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

  console.log('\n--- Step 3: Validate Insights Endpoint ---');

  try {
    const insightsResponse = await axios.get(`${BASE_URL}/adaptive/${TEST_USER_ID}/insights`);
    
    if (insightsResponse.data?.data) {
      console.log('✅ Insights endpoint working');
      
      const insights = insightsResponse.data.data;
      console.log(`   - Adherence rate: ${Math.round(insights.adherenceRate)}%`);
      console.log(`   - Total outcomes: ${insights.totalOutcomes}`);
      console.log(`   - Top effective: ${insights.topEffective?.length ?? 0}`);
    } else {
      errors.push('Insights endpoint returned no data');
      console.log('❌ Insights endpoint returned no data');
    }
  } catch (error: any) {
    errors.push('Insights endpoint failed');
    console.log('❌ Insights endpoint failed');
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'adaptive-ai-success.json');
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
