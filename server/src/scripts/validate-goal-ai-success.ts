import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'goal-ai-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Goal-Driven Optimization AI Success Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Step 1: Set User Goals ---');

  try {
    const setGoalsResponse = await axios.post(`${BASE_URL}/goals/${TEST_USER_ID}`, {
      goals: [
        { type: 'muscle_gain', priority: 9 },
        { type: 'injury_prevention', priority: 7 },
      ],
    });

    if (setGoalsResponse.data?.success) {
      console.log('✅ Goals set successfully');
      logs.push('Goals set: muscle_gain (9), injury_prevention (7)');
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

  console.log('\n--- Step 3: Validate Goal-Driven Structure ---');

  if (goalResponse?.data?.plan) {
    const plan = goalResponse.data.plan;

    if (Array.isArray(plan.adjustments)) {
      console.log(`✅ Adjustments present: ${plan.adjustments.length}`);
      
      // Validate adjustment structure
      const validAdjustments = plan.adjustments.every((adj: any) => 
        adj.goal && adj.adjustment && adj.rationale && adj.priority && adj.impact
      );
      
      if (validAdjustments) {
        console.log('✅ All adjustments have valid structure');
      } else {
        errors.push('Some adjustments missing required fields');
        console.log('❌ Some adjustments missing required fields');
      }

      // Check for goal-specific adjustments
      const muscleGainAdj = plan.adjustments.some((adj: any) => adj.goal === 'muscle_gain');
      const injuryPrevAdj = plan.adjustments.some((adj: any) => adj.goal === 'injury_prevention');
      
      if (muscleGainAdj && injuryPrevAdj) {
        console.log('✅ Both goals have adjustments');
      } else {
        errors.push('Missing goal-specific adjustments');
        console.log('❌ Missing goal-specific adjustments');
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

    if (plan.primaryGoal) {
      console.log(`✅ Primary goal set: ${plan.primaryGoal}`);
    } else {
      errors.push('Primary goal not set');
      console.log('❌ Primary goal not set');
    }

    if (typeof plan.goalAlignment === 'number') {
      console.log(`✅ Goal alignment: ${plan.goalAlignment}%`);
    } else {
      errors.push('Goal alignment missing or invalid');
      console.log('❌ Goal alignment missing or invalid');
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

  console.log('\n--- Step 4: Validate Goals in Record ---');

  if (goalResponse?.data?.goals) {
    if (Array.isArray(goalResponse.data.goals) && goalResponse.data.goals.length === 2) {
      console.log(`✅ Goals stored in record: ${goalResponse.data.goals.length}`);
    } else {
      errors.push('Goals not properly stored in record');
      console.log('❌ Goals not properly stored in record');
    }
  }

  // Save results
  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'goal-ai-success.json');
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
