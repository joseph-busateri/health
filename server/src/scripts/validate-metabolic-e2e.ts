import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'metabolic-e2e-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Metabolic Engine E2E Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Scenario 1: Get Metabolic Today ---');
  try {
    const response = await axios.get(`${BASE_URL}/metabolic/${TEST_USER_ID}/today`);
    const metabolic = response.data?.data;

    logs.push(`Metabolic response received: ${response.status}`);

    if (metabolic) {
      console.log('✅ Metabolic record generated');
    } else {
      errors.push('Metabolic record not generated');
      console.log('❌ Metabolic record not generated');
    }

    if (metabolic.metabolicStatus) {
      console.log(`✅ Metabolic status: ${metabolic.metabolicStatus}`);
      logs.push(`Metabolic status: ${metabolic.metabolicStatus}`);
    } else {
      errors.push('Metabolic status missing');
      console.log('❌ Metabolic status missing');
    }

    if (metabolic.evidence) {
      console.log('✅ Evidence exists');
      console.log(`   Signals: ${metabolic.evidence.signals?.length || 0}`);
      logs.push(`Evidence signals: ${metabolic.evidence.signals?.length || 0}`);
    } else {
      errors.push('Evidence missing');
      console.log('❌ Evidence missing');
    }

    if (metabolic.recommendation) {
      console.log('✅ Recommendation exists');
      console.log(`   Priority: ${metabolic.recommendation.priority}`);
      console.log(`   Summary: ${metabolic.recommendation.summary}`);
      console.log(`   Actions: ${metabolic.recommendation.actions?.length || 0}`);
      logs.push(`Recommendation priority: ${metabolic.recommendation.priority}`);
      logs.push(`Recommendation source: ${metabolic.recommendation.source}`);
    } else {
      errors.push('Recommendation missing');
      console.log('❌ Recommendation missing');
    }
  } catch (error: any) {
    errors.push('Get metabolic today failed');
    console.log('❌ Get metabolic today failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 2: Metabolic Status Validation ---');
  try {
    const response = await axios.get(`${BASE_URL}/metabolic/${TEST_USER_ID}/today`);
    const metabolic = response.data?.data;

    const validStatuses = ['optimal', 'moderate', 'elevated_risk', 'high_risk'];
    if (validStatuses.includes(metabolic.metabolicStatus)) {
      console.log(`✅ Valid metabolic status: ${metabolic.metabolicStatus}`);
    } else {
      errors.push(`Invalid metabolic status: ${metabolic.metabolicStatus}`);
      console.log(`❌ Invalid metabolic status: ${metabolic.metabolicStatus}`);
    }
  } catch (error: any) {
    errors.push('Metabolic status validation failed');
    console.log('❌ Metabolic status validation failed');
  }

  console.log('\n--- Scenario 3: Evidence Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/metabolic/${TEST_USER_ID}/today`);
    const metabolic = response.data?.data;

    if (metabolic.evidence) {
      const requiredFields = ['metabolicStatus', 'signals', 'summary'];
      const missingFields = requiredFields.filter(field => !(field in metabolic.evidence));

      if (missingFields.length === 0) {
        console.log('✅ All evidence fields present');
      } else {
        errors.push(`Missing evidence fields: ${missingFields.join(', ')}`);
        console.log(`❌ Missing evidence fields: ${missingFields.join(', ')}`);
      }

      if (Array.isArray(metabolic.evidence.signals)) {
        console.log(`✅ Evidence signals is array: ${metabolic.evidence.signals.length} signals`);
        
        if (metabolic.evidence.signals.length > 0) {
          const signal = metabolic.evidence.signals[0];
          if (signal.name && signal.value != null && signal.interpretation) {
            console.log('✅ Signal structure valid');
          } else {
            errors.push('Signal structure invalid');
            console.log('❌ Signal structure invalid');
          }
        }
      } else {
        errors.push('Evidence signals not an array');
        console.log('❌ Evidence signals not an array');
      }
    }
  } catch (error: any) {
    errors.push('Evidence structure validation failed');
    console.log('❌ Evidence structure validation failed');
  }

  console.log('\n--- Scenario 4: Recommendation Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/metabolic/${TEST_USER_ID}/today`);
    const metabolic = response.data?.data;

    if (metabolic.recommendation) {
      const requiredFields = ['type', 'priority', 'summary', 'actions'];
      const missingFields = requiredFields.filter(field => !(field in metabolic.recommendation));

      if (missingFields.length === 0) {
        console.log('✅ All recommendation fields present');
      } else {
        errors.push(`Missing recommendation fields: ${missingFields.join(', ')}`);
        console.log(`❌ Missing recommendation fields: ${missingFields.join(', ')}`);
      }

      if (metabolic.recommendation.type === 'metabolic') {
        console.log('✅ Recommendation type is "metabolic"');
      } else {
        errors.push('Recommendation type should be "metabolic"');
        console.log('❌ Recommendation type should be "metabolic"');
      }

      const validPriorities = ['critical', 'important', 'optimization'];
      if (validPriorities.includes(metabolic.recommendation.priority)) {
        console.log(`✅ Valid priority: ${metabolic.recommendation.priority}`);
      } else {
        errors.push(`Invalid priority: ${metabolic.recommendation.priority}`);
        console.log(`❌ Invalid priority: ${metabolic.recommendation.priority}`);
      }

      if (Array.isArray(metabolic.recommendation.actions) && metabolic.recommendation.actions.length > 0) {
        console.log(`✅ Actions array with ${metabolic.recommendation.actions.length} items`);
      } else {
        errors.push('Actions array empty or invalid');
        console.log('❌ Actions array empty or invalid');
      }

      if (metabolic.recommendation.source) {
        console.log(`✅ Source: ${metabolic.recommendation.source}`);
        const validSources = ['deterministic', 'ai_enriched', 'fallback'];
        if (validSources.includes(metabolic.recommendation.source)) {
          console.log('✅ Valid source value');
        } else {
          errors.push(`Invalid source: ${metabolic.recommendation.source}`);
          console.log(`❌ Invalid source: ${metabolic.recommendation.source}`);
        }
      }
    }
  } catch (error: any) {
    errors.push('Recommendation structure validation failed');
    console.log('❌ Recommendation structure validation failed');
  }

  console.log('\n--- Scenario 5: Record Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/metabolic/${TEST_USER_ID}/today`);
    const metabolic = response.data?.data;

    const requiredFields = ['id', 'userId', 'date', 'metabolicStatus', 'recommendation', 'createdAt'];
    const missingFields = requiredFields.filter(field => !(field in metabolic));

    if (missingFields.length === 0) {
      console.log('✅ All required record fields present');
    } else {
      errors.push(`Missing record fields: ${missingFields.join(', ')}`);
      console.log(`❌ Missing record fields: ${missingFields.join(', ')}`);
    }

    if (metabolic.userId === TEST_USER_ID) {
      console.log('✅ User ID matches');
    } else {
      errors.push('User ID mismatch');
      console.log('❌ User ID mismatch');
    }
  } catch (error: any) {
    errors.push('Record structure validation failed');
    console.log('❌ Record structure validation failed');
  }

  console.log('\n--- Scenario 6: History Retrieval ---');
  try {
    const response = await axios.get(`${BASE_URL}/metabolic/${TEST_USER_ID}/history`);

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
