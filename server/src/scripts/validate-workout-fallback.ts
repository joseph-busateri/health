import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'workout-fallback-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Workout Engine Fallback Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Checking Environment ---');
  const aiEnabled = process.env.USE_AI_ENRICHMENT === 'true';
  const workoutAIEnabled = process.env.USE_AI_ENRICHMENT_WORKOUT === 'true';

  console.log(`USE_AI_ENRICHMENT: ${process.env.USE_AI_ENRICHMENT}`);
  console.log(`USE_AI_ENRICHMENT_WORKOUT: ${process.env.USE_AI_ENRICHMENT_WORKOUT}`);

  if (aiEnabled && workoutAIEnabled) {
    console.log('\n⚠️  WARNING: AI enrichment is enabled. For true fallback validation, set USE_AI_ENRICHMENT_WORKOUT=false');
    console.log('Continuing anyway - system should still work...\n');
  }

  console.log('\n--- Test 1: Deload Fallback ---');
  try {
    logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=40&stress_score=80&joint_risk=high`,
    );

    const record = response.data?.data;
    logs.push(`Workout response received: ${response.status}`);

    if (record.workoutStatus === 'deload') {
      console.log('✅ Deload status detected');
    } else {
      errors.push('Expected deload status');
      console.log('❌ Expected deload status');
    }

    if (record.recommendation?.summary && record.recommendation.summary.length > 0) {
      console.log('✅ Fallback recommendation summary exists');
    } else {
      errors.push('Fallback recommendation summary missing');
      console.log('❌ Fallback recommendation summary missing');
    }

    if (record.recommendation?.actions && Array.isArray(record.recommendation.actions)) {
      console.log(`✅ Fallback recommendation actions exist: ${record.recommendation.actions.length}`);
    } else {
      errors.push('Fallback recommendation actions missing');
      console.log('❌ Fallback recommendation actions missing');
    }

    if (record.recommendation?.source === 'fallback' || !record.recommendation?.source) {
      console.log(`✅ Fallback source confirmed: ${record.recommendation?.source || 'undefined'}`);
    } else if (record.recommendation?.source === 'ai_enriched' && !workoutAIEnabled) {
      errors.push('Expected fallback source, got ai_enriched despite AI being disabled');
      console.log('❌ Expected fallback source, got ai_enriched despite AI being disabled');
    } else {
      console.log(`ℹ️  Source: ${record.recommendation?.source} (AI may have succeeded)`);
    }

    if (record.recommendation?.priority === 'critical') {
      console.log('✅ Priority is critical');
    } else {
      errors.push('Expected critical priority for deload');
      console.log('❌ Expected critical priority for deload');
    }
  } catch (error: any) {
    errors.push('Deload fallback test failed');
    console.log('❌ Deload fallback test failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Test 2: Constrained Fallback ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=58&stress_score=68&joint_risk=moderate`,
    );

    const record = response.data?.data;

    if (record.workoutStatus === 'constrained') {
      console.log('✅ Constrained status detected');
    } else {
      errors.push('Expected constrained status');
      console.log('❌ Expected constrained status');
    }

    if (record.recommendation?.summary) {
      console.log('✅ Recommendation generated');
    } else {
      errors.push('Recommendation not generated');
      console.log('❌ Recommendation not generated');
    }

    if (record.recommendation?.priority === 'important') {
      console.log('✅ Priority is important');
    } else {
      console.log(`⚠️  Priority is ${record.recommendation?.priority} (expected important)`);
    }
  } catch (error: any) {
    errors.push('Constrained fallback test failed');
    console.log('❌ Constrained fallback test failed');
  }

  console.log('\n--- Test 3: Moderate Fallback ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=70&stress_score=50&joint_risk=low`,
    );

    const record = response.data?.data;

    if (record.workoutStatus === 'moderate') {
      console.log('✅ Moderate status detected');
    } else {
      errors.push('Expected moderate status');
      console.log('❌ Expected moderate status');
    }

    if (record.recommendation?.summary) {
      console.log('✅ Recommendation generated');
    } else {
      errors.push('Recommendation not generated');
      console.log('❌ Recommendation not generated');
    }
  } catch (error: any) {
    errors.push('Moderate fallback test failed');
    console.log('❌ Moderate fallback test failed');
  }

  console.log('\n--- Test 4: Optimal (No AI Enrichment) ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=88&stress_score=32&joint_risk=low`,
    );

    const record = response.data?.data;

    if (record.workoutStatus === 'optimal') {
      console.log('✅ Optimal status detected');
    } else {
      errors.push('Expected optimal status');
      console.log('❌ Expected optimal status');
    }

    if (record.recommendation?.summary) {
      console.log('✅ Recommendation generated for optimal status');
    } else {
      errors.push('Recommendation not generated');
      console.log('❌ Recommendation not generated');
    }

    if (record.recommendation?.priority === 'optimization') {
      console.log('✅ Priority is optimization');
    } else {
      console.log(`⚠️  Priority is ${record.recommendation?.priority} (expected optimization)`);
    }
  } catch (error: any) {
    errors.push('Optimal test failed');
    console.log('❌ Optimal test failed');
  }

  console.log('\n--- Test 5: Persistence and Retrieval ---');
  try {
    const todayResponse = await axios.get(`${BASE_URL}/workout-engine/${TEST_USER_ID}/today`);
    const todayRecord = todayResponse.data?.data;

    if (todayRecord?.id) {
      console.log('✅ Today record persisted and retrieved');
    } else {
      errors.push('Today record not persisted');
      console.log('❌ Today record not persisted');
    }

    const historyResponse = await axios.get(`${BASE_URL}/workout-engine/${TEST_USER_ID}/history`);
    const historyRecords = historyResponse.data?.data;

    if (Array.isArray(historyRecords) && historyRecords.length > 0) {
      console.log(`✅ History retrieved: ${historyRecords.length} records`);
      logs.push(`History count: ${historyRecords.length}`);
    } else {
      errors.push('History not retrieved');
      console.log('❌ History not retrieved');
    }
  } catch (error: any) {
    errors.push('Persistence test failed');
    console.log('❌ Persistence test failed');
  }

  console.log('\n--- Test 6: Record Structure ---');
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
    errors.push('Record structure test failed');
    console.log('❌ Record structure test failed');
  }

  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'workout-fallback.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        success: errors.length === 0,
        timestamp: new Date().toISOString(),
        aiEnabled,
        workoutAIEnabled,
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
