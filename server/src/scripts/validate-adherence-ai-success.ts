import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'adherence-ai-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Adherence Engine AI Success Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Checking Environment ---');
  const aiEnabled = process.env.USE_AI_ENRICHMENT === 'true';
  const adherenceAIEnabled = process.env.USE_AI_ENRICHMENT_ADHERENCE === 'true';

  console.log(`USE_AI_ENRICHMENT: ${process.env.USE_AI_ENRICHMENT}`);
  console.log(`USE_AI_ENRICHMENT_ADHERENCE: ${process.env.USE_AI_ENRICHMENT_ADHERENCE}`);

  if (!aiEnabled || !adherenceAIEnabled) {
    console.log('\n⚠️  WARNING: AI enrichment not fully enabled');
    console.log('Set USE_AI_ENRICHMENT=true and USE_AI_ENRICHMENT_ADHERENCE=true');
    errors.push('AI enrichment not enabled');
  }

  console.log('\n--- Test 1: Low Adherence AI Enrichment ---');
  try {
    logs.push(`Using TEST_USER_ID: ${TEST_USER_ID}`);

    const response = await axios.get(
      `${BASE_URL}/adherence/${TEST_USER_ID}/today?regenerate=true&workout_adherence=35&nutrition_adherence=40&sleep_adherence=38&supplement_adherence=42`,
    );

    const record = response.data?.data;
    logs.push(`Adherence response received: ${response.status}`);

    if (record.status === 'low') {
      console.log('✅ Low adherence status detected');
    } else {
      errors.push('Expected low adherence status');
      console.log('❌ Expected low adherence status');
    }

    if (record.recommendation?.type === 'adherence') {
      console.log('✅ Recommendation type is "adherence"');
    } else {
      errors.push('Recommendation type should be "adherence"');
      console.log('❌ Recommendation type should be "adherence"');
    }

    if (record.recommendation?.priority) {
      console.log(`✅ Recommendation priority exists: ${record.recommendation.priority}`);
      logs.push(`Priority: ${record.recommendation.priority}`);
    } else {
      errors.push('Recommendation priority missing');
      console.log('❌ Recommendation priority missing');
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
    errors.push('Low adherence test failed');
    console.log('❌ Low adherence test failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Test 2: Moderate Adherence AI Enrichment ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/adherence/${TEST_USER_ID}/today?regenerate=true&workout_adherence=68&nutrition_adherence=65&sleep_adherence=62&supplement_adherence=70`,
    );

    const record = response.data?.data;

    if (record.status === 'moderate') {
      console.log('✅ Moderate adherence status detected');
    } else {
      errors.push('Expected moderate adherence status');
      console.log('❌ Expected moderate adherence status');
    }

    if (record.recommendation?.source === 'ai_enriched' || record.recommendation?.source === 'fallback') {
      console.log(`✅ Recommendation generated with source: ${record.recommendation.source}`);
    } else {
      errors.push('Recommendation source invalid');
      console.log('❌ Recommendation source invalid');
    }
  } catch (error: any) {
    errors.push('Moderate adherence test failed');
    console.log('❌ Moderate adherence test failed');
  }

  console.log('\n--- Test 3: Persistence and Retrieval ---');
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

  console.log('\n--- Test 4: Backward Compatibility ---');
  try {
    const response = await axios.get(`${BASE_URL}/adherence/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    if (record.recommendation?.summary && record.recommendation?.note) {
      console.log('✅ Legacy fields (summary, note) preserved');
    } else {
      errors.push('Legacy fields missing');
      console.log('❌ Legacy fields missing');
    }

    if (record.breakdown) {
      console.log('✅ Breakdown structure preserved');
    } else {
      errors.push('Breakdown structure missing');
      console.log('❌ Breakdown structure missing');
    }
  } catch (error: any) {
    errors.push('Backward compatibility test failed');
    console.log('❌ Backward compatibility test failed');
  }

  const outputDir = path.resolve(__dirname, '../../validation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'adherence-ai-success.json');
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
