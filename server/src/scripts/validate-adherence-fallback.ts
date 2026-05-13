import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'adherence-fallback-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Adherence Engine Fallback Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Checking Environment ---');
  const aiEnabled = process.env.USE_AI_ENRICHMENT === 'true';
  const adherenceAIEnabled = process.env.USE_AI_ENRICHMENT_ADHERENCE === 'true';

  console.log(`USE_AI_ENRICHMENT: ${process.env.USE_AI_ENRICHMENT}`);
  console.log(`USE_AI_ENRICHMENT_ADHERENCE: ${process.env.USE_AI_ENRICHMENT_ADHERENCE}`);

  if (aiEnabled && adherenceAIEnabled) {
    console.log('\n⚠️  WARNING: AI enrichment is enabled. For true fallback validation, set USE_AI_ENRICHMENT_ADHERENCE=false');
    console.log('Continuing anyway - system should still work...\n');
  }

  console.log('\n--- Test 1: Low Adherence Fallback ---');
  try {
    logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

    const response = await axios.get(
      `${BASE_URL}/adherence/${TEST_USER_ID}/today?regenerate=true&workout_adherence=30&nutrition_adherence=35&sleep_adherence=32&supplement_adherence=38`,
    );

    const record = response.data?.data;
    logs.push(`Adherence response received: ${response.status}`);

    if (record.status === 'low') {
      console.log('✅ Low adherence status detected');
    } else {
      errors.push('Expected low adherence status');
      console.log('❌ Expected low adherence status');
    }

    if (record.recommendation?.summary && record.recommendation.summary.length > 0) {
      console.log('✅ Fallback recommendation summary exists');
    } else {
      errors.push('Fallback recommendation summary missing');
      console.log('❌ Fallback recommendation summary missing');
    }

    if (record.recommendation?.note && record.recommendation.note.length > 0) {
      console.log('✅ Fallback recommendation note exists');
    } else {
      errors.push('Fallback recommendation note missing');
      console.log('❌ Fallback recommendation note missing');
    }

    if (record.recommendation?.source === 'fallback' || !record.recommendation?.source) {
      console.log(`✅ Fallback source confirmed: ${record.recommendation?.source || 'undefined'}`);
    } else if (record.recommendation?.source === 'ai_enriched' && !adherenceAIEnabled) {
      errors.push('Expected fallback source, got ai_enriched despite AI being disabled');
      console.log('❌ Expected fallback source, got ai_enriched despite AI being disabled');
    } else {
      console.log(`ℹ️  Source: ${record.recommendation?.source} (AI may have succeeded)`);
    }

    if (record.recommendation?.priority) {
      console.log(`✅ Priority exists: ${record.recommendation.priority}`);
    } else {
      console.log('⚠️  Priority missing (may be legacy format)');
    }

    if (record.recommendation?.actions && Array.isArray(record.recommendation.actions)) {
      console.log(`✅ Actions exist: ${record.recommendation.actions.length} actions`);
    } else {
      console.log('⚠️  Actions missing (may be legacy format)');
    }
  } catch (error: any) {
    errors.push('Low adherence fallback test failed');
    console.log('❌ Low adherence fallback test failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Test 2: Moderate Adherence Fallback ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/adherence/${TEST_USER_ID}/today?regenerate=true&workout_adherence=65&nutrition_adherence=68&sleep_adherence=62&supplement_adherence=70`,
    );

    const record = response.data?.data;

    if (record.status === 'moderate') {
      console.log('✅ Moderate adherence status detected');
    } else {
      errors.push('Expected moderate adherence status');
      console.log('❌ Expected moderate adherence status');
    }

    if (record.recommendation?.summary) {
      console.log('✅ Recommendation generated');
    } else {
      errors.push('Recommendation not generated');
      console.log('❌ Recommendation not generated');
    }
  } catch (error: any) {
    errors.push('Moderate adherence fallback test failed');
    console.log('❌ Moderate adherence fallback test failed');
  }

  console.log('\n--- Test 3: High Adherence (No AI Enrichment) ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/adherence/${TEST_USER_ID}/today?regenerate=true&workout_adherence=88&nutrition_adherence=85&sleep_adherence=90&supplement_adherence=82`,
    );

    const record = response.data?.data;

    if (record.status === 'high') {
      console.log('✅ High adherence status detected');
    } else {
      errors.push('Expected high adherence status');
      console.log('❌ Expected high adherence status');
    }

    if (record.recommendation?.summary) {
      console.log('✅ Recommendation generated for high adherence');
    } else {
      errors.push('Recommendation not generated');
      console.log('❌ Recommendation not generated');
    }
  } catch (error: any) {
    errors.push('High adherence test failed');
    console.log('❌ High adherence test failed');
  }

  console.log('\n--- Test 4: Persistence and Retrieval ---');
  try {
    const todayResponse = await axios.get(`${BASE_URL}/adherence/${TEST_USER_ID}/today`);
    const todayRecord = todayResponse.data?.data;

    if (todayRecord?.id) {
      console.log('✅ Today record persisted and retrieved');
    } else {
      errors.push('Today record not persisted');
      console.log('❌ Today record not persisted');
    }

    const historyResponse = await axios.get(`${BASE_URL}/adherence/${TEST_USER_ID}/history`);
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

  console.log('\n--- Test 5: API Contract Compatibility ---');
  try {
    const response = await axios.get(`${BASE_URL}/adherence/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    const requiredFields = ['id', 'userId', 'date', 'adherenceScore', 'status', 'breakdown', 'recommendation', 'sourceInputs'];
    const missingFields = requiredFields.filter(field => !(field in record));

    if (missingFields.length === 0) {
      console.log('✅ All required fields present');
    } else {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
    }

    if (record.recommendation?.summary && record.recommendation?.note) {
      console.log('✅ Legacy recommendation fields preserved');
    } else {
      errors.push('Legacy recommendation fields missing');
      console.log('❌ Legacy recommendation fields missing');
    }
  } catch (error: any) {
    errors.push('API contract test failed');
    console.log('❌ API contract test failed');
  }

  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'adherence-fallback.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        success: errors.length === 0,
        timestamp: new Date().toISOString(),
        aiEnabled,
        adherenceAIEnabled,
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
