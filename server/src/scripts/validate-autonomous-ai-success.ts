import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'autonomous-ai-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Autonomous Optimization AI Success Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

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

  console.log('\n--- Step 2: Validate Autonomous Structure ---');

  if (autonomousResponse?.data?.plan) {
    const plan = autonomousResponse.data.plan;

    if (Array.isArray(plan.adjustments)) {
      console.log(`✅ Adjustments present: ${plan.adjustments.length}`);
      
      // Validate adjustment structure
      const validAdjustments = plan.adjustments.every((adj: any) => 
        adj.category && adj.adjustment && adj.rationale && adj.priority
      );
      
      if (validAdjustments) {
        console.log('✅ All adjustments have valid structure');
      } else {
        errors.push('Some adjustments missing required fields');
        console.log('❌ Some adjustments missing required fields');
      }
    } else {
      errors.push('Adjustments missing or not an array');
      console.log('❌ Adjustments missing or not an array');
    }

    if (plan.summary && plan.summary.length > 0) {
      console.log('✅ Summary exists');
    } else {
      errors.push('Summary missing or empty');
      console.log('❌ Summary missing or empty');
    }

    if (plan.priority) {
      console.log(`✅ Priority set: ${plan.priority}`);
    } else {
      errors.push('Priority not set');
      console.log('❌ Priority not set');
    }

    if (plan.source) {
      console.log(`✅ Source: ${plan.source}`);
    } else {
      errors.push('Source missing');
      console.log('❌ Source missing');
    }
  } else {
    errors.push('No plan in response');
    console.log('❌ No plan in response');
  }

  console.log('\n--- Step 3: Validate Adjustment Categories ---');

  if (autonomousResponse?.data?.plan?.adjustments) {
    const categories = new Set(autonomousResponse.data.plan.adjustments.map((a: any) => a.category));
    console.log(`✅ Adjustment categories: ${Array.from(categories).join(', ')}`);
    
    const validCategories = ['workout', 'recovery', 'stress', 'joint', 'nutrition'];
    const allValid = Array.from(categories).every(cat => validCategories.includes(cat as string));
    
    if (allValid) {
      console.log('✅ All categories are valid');
    } else {
      errors.push('Some categories are invalid');
      console.log('❌ Some categories are invalid');
    }
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'autonomous-ai-success.json');
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
