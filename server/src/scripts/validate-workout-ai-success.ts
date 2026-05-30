import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'workout-ai-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Workout Engine AI Success Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Checking Environment ---');
  const aiEnabled = process.env.USE_AI_ENRICHMENT === 'true';
  const workoutAIEnabled = process.env.USE_AI_ENRICHMENT_WORKOUT === 'true';

  console.log(`USE_AI_ENRICHMENT: ${process.env.USE_AI_ENRICHMENT}`);
  console.log(`USE_AI_ENRICHMENT_WORKOUT: ${process.env.USE_AI_ENRICHMENT_WORKOUT}`);

  if (!aiEnabled || !workoutAIEnabled) {
    console.log('\n⚠️  WARNING: AI enrichment not fully enabled');
    console.log('Set USE_AI_ENRICHMENT=true and USE_AI_ENRICHMENT_WORKOUT=true');
    errors.push('AI enrichment not enabled');
  }

  console.log('\n--- Test 1: Deload Status AI Enrichment ---');
  try {
    logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=45&stress_score=76&joint_risk=high`,
    );

    const record = response.data?.data;
    logs.push(`Workout response received: ${response.status}`);

    if (record.workoutStatus === 'deload') {
      console.log('✅ Deload status detected');
    } else {
      errors.push('Expected deload status');
      console.log('❌ Expected deload status');
    }

    if (record.recommendation?.type === 'workout') {
      console.log('✅ Recommendation type is "workout"');
    } else {
      errors.push('Recommendation type should be "workout"');
      console.log('❌ Recommendation type should be "workout"');
    }

    if (record.recommendation?.priority === 'critical') {
      console.log('✅ Recommendation priority is critical');
      logs.push('Priority: critical');
    } else {
      errors.push('Expected critical priority for deload');
      console.log('❌ Expected critical priority for deload');
    }

    if (record.recommendation?.summary && record.recommendation.summary.length > 0) {
      console.log('✅ Recommendation summary exists');
      logs.push(`Summary length: ${record.recommendation.summary.length}`);
    } else {
      errors.push('Recommendation summary missing');
      console.log('❌ Recommendation summary missing');
    }

    if (record.recommendation?.rationale && record.recommendation.rationale.length > 0) {
      console.log('✅ Recommendation rationale exists (AI enrichment)');
      logs.push(`Rationale length: ${record.recommendation.rationale.length}`);
    } else {
      console.log('⚠️  Recommendation rationale missing (may be fallback)');
    }

    if (record.recommendation?.actions && Array.isArray(record.recommendation.actions)) {
      console.log(`✅ Recommendation actions exist: ${record.recommendation.actions.length} actions`);
      logs.push(`Actions count: ${record.recommendation.actions.length}`);
    } else {
      errors.push('Recommendation actions missing or not array');
      console.log('❌ Recommendation actions missing or not array');
    }

    if (record.recommendation?.source) {
      console.log(`✅ Recommendation source: ${record.recommendation.source}`);
      logs.push(`Source: ${record.recommendation.source}`);

      if (record.recommendation.source === 'ai_enriched') {
        console.log('✅ AI enrichment succeeded');
      } else if (record.recommendation.source === 'fallback') {
        console.log('⚠️  Using fallback (AI may have failed or been disabled)');
      }
    } else {
      errors.push('Recommendation source missing');
      console.log('❌ Recommendation source missing');
    }

    if (record.evidence) {
      console.log('✅ Evidence object exists');
      logs.push(`Evidence signals: ${record.evidence.signals?.length || 0}`);
    } else {
      errors.push('Evidence object missing');
      console.log('❌ Evidence object missing');
    }
  } catch (error: any) {
    errors.push('Deload test failed');
    console.log('❌ Deload test failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Test 2: Constrained Status AI Enrichment ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=60&stress_score=62&joint_risk=moderate`,
    );

    const record = response.data?.data;

    if (record.workoutStatus === 'constrained') {
      console.log('✅ Constrained status detected');
    } else {
      errors.push('Expected constrained status');
      console.log('❌ Expected constrained status');
    }

    if (record.recommendation?.source === 'ai_enriched' || record.recommendation?.source === 'fallback') {
      console.log(`✅ Recommendation generated with source: ${record.recommendation.source}`);
    } else {
      errors.push('Recommendation source invalid');
      console.log('❌ Recommendation source invalid');
    }

    if (record.recommendation?.actions?.length >= 3) {
      console.log(`✅ Multiple actions provided: ${record.recommendation.actions.length}`);
    } else {
      console.log('⚠️  Less than 3 actions provided');
    }
  } catch (error: any) {
    errors.push('Constrained test failed');
    console.log('❌ Constrained test failed');
  }

  console.log('\n--- Test 3: Moderate Status AI Enrichment ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=72&stress_score=48&joint_risk=low`,
    );

    const record = response.data?.data;

    if (record.workoutStatus === 'moderate') {
      console.log('✅ Moderate status detected');
    } else {
      errors.push('Expected moderate status');
      console.log('❌ Expected moderate status');
    }

    if (record.recommendation?.priority === 'important') {
      console.log('✅ Priority is important');
    } else {
      console.log(`⚠️  Priority is ${record.recommendation?.priority} (expected important)`);
    }
  } catch (error: any) {
    errors.push('Moderate test failed');
    console.log('❌ Moderate test failed');
  }

  console.log('\n--- Test 4: Persistence and Retrieval ---');
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

  console.log('\n--- Test 5: Action Quality Check ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/workout-engine/${TEST_USER_ID}/today?regenerate=true&recovery_score=48&stress_score=72&joint_risk=moderate`,
    );

    const record = response.data?.data;

    if (record.recommendation?.actions) {
      const hasVolumeAction = record.recommendation.actions.some((a: string) => 
        a.toLowerCase().includes('volume') || a.toLowerCase().includes('sets')
      );
      const hasIntensityAction = record.recommendation.actions.some((a: string) => 
        a.toLowerCase().includes('intensity') || a.toLowerCase().includes('rpe') || a.toLowerCase().includes('%')
      );

      if (hasVolumeAction) {
        console.log('✅ Volume-related action found');
      } else {
        console.log('⚠️  No volume-related action found');
      }

      if (hasIntensityAction) {
        console.log('✅ Intensity-related action found');
      } else {
        console.log('⚠️  No intensity-related action found');
      }
    }
  } catch (error: any) {
    errors.push('Action quality check failed');
    console.log('❌ Action quality check failed');
  }

  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'workout-ai-success.json');
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
