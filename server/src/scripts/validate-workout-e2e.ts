import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'workout-e2e-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Workout Engine E2E Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Scenario 1: Optimal Workout Status ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=85&stress_score=35&joint_risk=low`,
    );

    if (response.data?.data?.workoutStatus === 'optimal') {
      console.log('✅ Optimal workout status detected');
      logs.push('Optimal status: high recovery, low stress, low joint risk');
    } else {
      errors.push('Expected optimal workout status');
      console.log('❌ Expected optimal workout status');
    }

    if (response.data?.data?.recommendation?.summary) {
      console.log('✅ Recommendation generated');
    } else {
      errors.push('Recommendation not generated');
      console.log('❌ Recommendation not generated');
    }
  } catch (error: any) {
    errors.push('Optimal scenario - request failed');
    console.log('❌ Optimal scenario - request failed');
  }

  console.log('\n--- Scenario 2: Moderate Workout Status ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=68&stress_score=48&joint_risk=low`,
    );

    if (response.data?.data?.workoutStatus === 'moderate') {
      console.log('✅ Moderate workout status detected');
      logs.push('Moderate status: moderate recovery and stress');
    } else {
      errors.push('Expected moderate workout status');
      console.log('❌ Expected moderate workout status');
    }

    if (response.data?.data?.recommendation?.actions?.length > 0) {
      console.log(`✅ Recommendation actions exist: ${response.data.data.recommendation.actions.length} actions`);
    } else {
      errors.push('Recommendation actions missing');
      console.log('❌ Recommendation actions missing');
    }
  } catch (error: any) {
    errors.push('Moderate scenario - request failed');
    console.log('❌ Moderate scenario - request failed');
  }

  console.log('\n--- Scenario 3: Constrained Workout Status ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=58&stress_score=65&joint_risk=moderate`,
    );

    if (response.data?.data?.workoutStatus === 'constrained') {
      console.log('✅ Constrained workout status detected');
      logs.push('Constrained status: low recovery, elevated stress, moderate joint risk');
    } else {
      errors.push('Expected constrained workout status');
      console.log('❌ Expected constrained workout status');
    }

    if (response.data?.data?.recommendation?.priority === 'important') {
      console.log('✅ Priority set to important');
    } else {
      console.log('⚠️  Priority not set to important (may be critical or optimization)');
    }
  } catch (error: any) {
    errors.push('Constrained scenario - request failed');
    console.log('❌ Constrained scenario - request failed');
  }

  console.log('\n--- Scenario 4: Deload Workout Status ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=42&stress_score=78&joint_risk=high`,
    );

    if (response.data?.data?.workoutStatus === 'deload') {
      console.log('✅ Deload workout status detected');
      logs.push('Deload status: very low recovery, high stress, high joint risk');
    } else {
      errors.push('Expected deload workout status');
      console.log('❌ Expected deload workout status');
    }

    if (response.data?.data?.recommendation?.priority === 'critical') {
      console.log('✅ Priority set to critical');
    } else {
      errors.push('Expected critical priority for deload');
      console.log('❌ Expected critical priority for deload');
    }
  } catch (error: any) {
    errors.push('Deload scenario - request failed');
    console.log('❌ Deload scenario - request failed');
  }

  console.log('\n--- Scenario 5: Evidence Structure ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=70&stress_score=50&joint_risk=low&adherence_score=85`,
    );

    if (response.data?.data?.evidence) {
      console.log('✅ Evidence object exists');
      
      if (response.data.data.evidence.signals?.length > 0) {
        console.log(`✅ Evidence signals exist: ${response.data.data.evidence.signals.length} signals`);
        logs.push(`Evidence signals: ${response.data.data.evidence.signals.length}`);
      } else {
        errors.push('Evidence signals missing');
        console.log('❌ Evidence signals missing');
      }

      if (response.data.data.evidence.summary) {
        console.log('✅ Evidence summary exists');
      } else {
        errors.push('Evidence summary missing');
        console.log('❌ Evidence summary missing');
      }
    } else {
      errors.push('Evidence object missing');
      console.log('❌ Evidence object missing');
    }
  } catch (error: any) {
    errors.push('Evidence structure test failed');
    console.log('❌ Evidence structure test failed');
  }

  console.log('\n--- Scenario 6: Today Retrieval ---');
  try {
    const response = await axios.get(`${BASE_URL}/workout-engine/${TEST_USER_ID}/today`);

    if (response.data?.data?.id) {
      console.log('✅ Today record retrieved');
    } else {
      errors.push('Today record not retrieved');
      console.log('❌ Today record not retrieved');
    }
  } catch (error: any) {
    errors.push('Today retrieval failed');
    console.log('❌ Today retrieval failed');
  }

  console.log('\n--- Scenario 7: History Retrieval ---');
  try {
    const response = await axios.get(`${BASE_URL}/workout-engine/${TEST_USER_ID}/history`);

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

  console.log('\n--- Scenario 8: Recommendation Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/workout-engine/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    const requiredFields = ['id', 'userId', 'date', 'workoutStatus', 'sourceInputs', 'recommendation'];
    const missingFields = requiredFields.filter(field => !(field in record));

    if (missingFields.length === 0) {
      console.log('✅ All required fields present');
    } else {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
    }

    if (record.recommendation?.type === 'workout') {
      console.log('✅ Recommendation type is "workout"');
    } else {
      errors.push('Recommendation type should be "workout"');
      console.log('❌ Recommendation type should be "workout"');
    }

    if (record.recommendation?.actions && Array.isArray(record.recommendation.actions)) {
      console.log('✅ Recommendation actions is array');
    } else {
      errors.push('Recommendation actions not array');
      console.log('❌ Recommendation actions not array');
    }
  } catch (error: any) {
    errors.push('Recommendation structure test failed');
    console.log('❌ Recommendation structure test failed');
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
