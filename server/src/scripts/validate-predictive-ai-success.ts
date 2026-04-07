import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'predictive-ai-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Predictive Intelligence AI Success Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Step 1: Call Predictive Endpoint ---');

  let predictiveResponse: any = null;

  try {
    logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

    const response = await axios.get(`${BASE_URL}/predictive/${TEST_USER_ID}/today?regenerate=true`);
    predictiveResponse = response.data;

    logs.push(`Predictive endpoint response received: ${response.status}`);
    console.log('✅ Predictive endpoint succeeded');
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    logs.push(`Predictive endpoint error: ${JSON.stringify(errorMsg)}`);
    errors.push('Predictive endpoint failed');
    console.log('❌ Predictive endpoint failed');
  }

  console.log('\n--- Step 2: Validate Predictive Structure ---');

  if (predictiveResponse?.data) {
    const data = predictiveResponse.data;

    if (data.riskLevel) {
      console.log(`✅ riskLevel present: ${data.riskLevel}`);
    } else {
      errors.push('riskLevel missing');
      console.log('❌ riskLevel missing');
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

      if (rec.type === 'predictive') {
        console.log('✅ Recommendation type is predictive');
      } else {
        errors.push(`Expected type 'predictive', got '${rec.type}'`);
        console.log(`❌ Expected type 'predictive', got '${rec.type}'`);
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

  console.log('\n--- Step 3: Validate Trend Analysis ---');

  if (predictiveResponse?.data?.evidence?.signals) {
    const signals = predictiveResponse.data.evidence.signals;

    const hasRecoveryTrend = signals.some((s: any) => s.name === 'recoveryTrend');
    const hasStressTrend = signals.some((s: any) => s.name === 'stressTrend');
    const hasJointTrend = signals.some((s: any) => s.name === 'jointTrend');

    if (hasRecoveryTrend) {
      console.log('✅ Recovery trend signal present');
    } else {
      console.log('ℹ️  Recovery trend signal missing (may be insufficient data)');
    }

    if (hasStressTrend) {
      console.log('✅ Stress trend signal present');
    } else {
      console.log('ℹ️  Stress trend signal missing (may be insufficient data)');
    }

    if (hasJointTrend) {
      console.log('✅ Joint trend signal present');
    } else {
      console.log('ℹ️  Joint trend signal missing (may be insufficient data)');
    }
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'predictive-ai-success.json');
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
