import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'daily-plan-e2e-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Daily AI Plan Aggregator E2E Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Scenario 1: Daily Plan Generation ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/daily-plan/${TEST_USER_ID}/today?regenerate=true`,
    );

    const plan = response.data?.data;
    logs.push(`Daily plan response received: ${response.status}`);

    if (plan) {
      console.log('✅ Daily plan generated');
    } else {
      errors.push('Daily plan not generated');
      console.log('❌ Daily plan not generated');
    }

    if (plan.summary) {
      console.log('✅ Summary exists');
      console.log(`   Overall status: ${plan.summary.overallStatus}`);
      console.log(`   Headline: ${plan.summary.headline}`);
      logs.push(`Overall status: ${plan.summary.overallStatus}`);
    } else {
      errors.push('Summary missing');
      console.log('❌ Summary missing');
    }

    if (plan.recoverySnapshot) {
      console.log('✅ Recovery snapshot exists');
      if (plan.recoverySnapshot.recoveryScore != null) {
        console.log(`   Recovery score: ${plan.recoverySnapshot.recoveryScore}`);
      }
      if (plan.recoverySnapshot.stressScore != null) {
        console.log(`   Stress score: ${plan.recoverySnapshot.stressScore}`);
      }
    } else {
      errors.push('Recovery snapshot missing');
      console.log('❌ Recovery snapshot missing');
    }

    if (plan.workout) {
      console.log('✅ Workout section exists');
      console.log(`   Summary: ${plan.workout.summary}`);
    } else {
      errors.push('Workout section missing');
      console.log('❌ Workout section missing');
    }

    if (plan.nutrition) {
      console.log('✅ Nutrition section exists');
      console.log(`   Summary: ${plan.nutrition.summary}`);
    } else {
      errors.push('Nutrition section missing');
      console.log('❌ Nutrition section missing');
    }

    if (Array.isArray(plan.topPriorities)) {
      console.log(`✅ Top priorities exist: ${plan.topPriorities.length} priorities`);
      logs.push(`Priority count: ${plan.topPriorities.length}`);
    } else {
      errors.push('Top priorities not an array');
      console.log('❌ Top priorities not an array');
    }

    if (Array.isArray(plan.predictiveAlerts)) {
      console.log(`✅ Predictive alerts exist: ${plan.predictiveAlerts.length} alerts`);
      logs.push(`Alert count: ${plan.predictiveAlerts.length}`);
    } else {
      errors.push('Predictive alerts not an array');
      console.log('❌ Predictive alerts not an array');
    }
  } catch (error: any) {
    errors.push('Daily plan generation failed');
    console.log('❌ Daily plan generation failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 2: Summary Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/daily-plan/${TEST_USER_ID}/today`);
    const plan = response.data?.data;

    if (plan.summary) {
      const requiredFields = ['overallStatus', 'headline', 'reasoning'];
      const missingFields = requiredFields.filter(field => !(field in plan.summary));

      if (missingFields.length === 0) {
        console.log('✅ All summary fields present');
      } else {
        errors.push(`Missing summary fields: ${missingFields.join(', ')}`);
        console.log(`❌ Missing summary fields: ${missingFields.join(', ')}`);
      }

      const validStatuses = ['optimal', 'moderate', 'constrained', 'high_risk'];
      if (validStatuses.includes(plan.summary.overallStatus)) {
        console.log(`✅ Valid overall status: ${plan.summary.overallStatus}`);
      } else {
        errors.push(`Invalid overall status: ${plan.summary.overallStatus}`);
        console.log(`❌ Invalid overall status: ${plan.summary.overallStatus}`);
      }

      if (plan.summary.headline && plan.summary.headline.length > 0) {
        console.log('✅ Headline is non-empty');
      } else {
        errors.push('Headline is empty');
        console.log('❌ Headline is empty');
      }

      if (plan.summary.reasoning && plan.summary.reasoning.length > 0) {
        console.log('✅ Reasoning is non-empty');
      } else {
        errors.push('Reasoning is empty');
        console.log('❌ Reasoning is empty');
      }
    }
  } catch (error: any) {
    errors.push('Summary structure validation failed');
    console.log('❌ Summary structure validation failed');
  }

  console.log('\n--- Scenario 3: Record Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/daily-plan/${TEST_USER_ID}/today`);
    const plan = response.data?.data;

    const requiredFields = [
      'id',
      'userId',
      'date',
      'summary',
      'recoverySnapshot',
      'topPriorities',
      'predictiveAlerts',
      'workout',
      'nutrition',
      'source',
    ];
    const missingFields = requiredFields.filter(field => !(field in plan));

    if (missingFields.length === 0) {
      console.log('✅ All required fields present');
    } else {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
    }

    if (plan.source === 'aggregated') {
      console.log('✅ Source is "aggregated"');
    } else {
      errors.push('Source should be "aggregated"');
      console.log('❌ Source should be "aggregated"');
    }
  } catch (error: any) {
    errors.push('Record structure test failed');
    console.log('❌ Record structure test failed');
  }

  console.log('\n--- Scenario 4: Today Retrieval (Cached) ---');
  try {
    const response = await axios.get(`${BASE_URL}/daily-plan/${TEST_USER_ID}/today`);

    if (response.data?.data?.id) {
      console.log('✅ Today record retrieved (cached)');
    } else {
      errors.push('Today record not retrieved');
      console.log('❌ Today record not retrieved');
    }
  } catch (error: any) {
    errors.push('Today retrieval failed');
    console.log('❌ Today retrieval failed');
  }

  console.log('\n--- Scenario 5: History Retrieval ---');
  try {
    const response = await axios.get(`${BASE_URL}/daily-plan/${TEST_USER_ID}/history`);

    if (Array.isArray(response.data?.data)) {
      console.log(`✅ History retrieved: ${response.data.data.length} records`);
      logs.push(`History count: ${response.data.data.length}`);
    } else {
      errors.push('History not an array');
      console.log('❌ History not an array');
    }
  } catch (error: any) {
    errors.push('History retrieval failed');
    console.log('❌ History retrieval failed');
  }

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Success: ${errors.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  if (logs.length > 0) {
    console.log('\nLogs:');
    logs.forEach(l => console.log(`  - ${l}`));
  }

  process.exit(errors.length === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
