import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'supplement-e2e-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Supplement Engine E2E Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Scenario 1: Get Supplement Today (Optimal) ---');
  try {
    const response = await axios.get(`${BASE_URL}/supplements/${TEST_USER_ID}/today`);
    const supplement = response.data?.data;

    logs.push(`Supplement response received: ${response.status}`);

    if (supplement) {
      console.log('✅ Supplement record generated');
    } else {
      errors.push('Supplement record not generated');
      console.log('❌ Supplement record not generated');
    }

    if (supplement.supplementStatus) {
      console.log(`✅ Supplement status: ${supplement.supplementStatus}`);
      logs.push(`Supplement status: ${supplement.supplementStatus}`);
    } else {
      errors.push('Supplement status missing');
      console.log('❌ Supplement status missing');
    }

    if (supplement.evidence) {
      console.log('✅ Evidence exists');
      console.log(`   Signals: ${supplement.evidence.signals?.length || 0}`);
      logs.push(`Evidence signals: ${supplement.evidence.signals?.length || 0}`);
    } else {
      errors.push('Evidence missing');
      console.log('❌ Evidence missing');
    }

    if (supplement.recommendation) {
      console.log('✅ Recommendation exists');
      console.log(`   Priority: ${supplement.recommendation.priority}`);
      console.log(`   Summary: ${supplement.recommendation.summary}`);
      console.log(`   Actions: ${supplement.recommendation.actions?.length || 0}`);
      logs.push(`Recommendation priority: ${supplement.recommendation.priority}`);
      logs.push(`Recommendation source: ${supplement.recommendation.source}`);
    } else {
      errors.push('Recommendation missing');
      console.log('❌ Recommendation missing');
    }
  } catch (error: any) {
    errors.push('Get supplement today failed');
    console.log('❌ Get supplement today failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 2: Supplement Status Validation ---');
  try {
    const response = await axios.get(`${BASE_URL}/supplements/${TEST_USER_ID}/today`);
    const supplement = response.data?.data;

    const validStatuses = ['optimal', 'suboptimal', 'inefficient', 'conflicted'];
    if (validStatuses.includes(supplement.supplementStatus)) {
      console.log(`✅ Valid supplement status: ${supplement.supplementStatus}`);
    } else {
      errors.push(`Invalid supplement status: ${supplement.supplementStatus}`);
      console.log(`❌ Invalid supplement status: ${supplement.supplementStatus}`);
    }
  } catch (error: any) {
    errors.push('Supplement status validation failed');
    console.log('❌ Supplement status validation failed');
  }

  console.log('\n--- Scenario 3: Evidence Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/supplements/${TEST_USER_ID}/today`);
    const supplement = response.data?.data;

    if (supplement.evidence) {
      const requiredFields = ['supplementStatus', 'signals', 'summary'];
      const missingFields = requiredFields.filter(field => !(field in supplement.evidence));

      if (missingFields.length === 0) {
        console.log('✅ All evidence fields present');
      } else {
        errors.push(`Missing evidence fields: ${missingFields.join(', ')}`);
        console.log(`❌ Missing evidence fields: ${missingFields.join(', ')}`);
      }

      if (Array.isArray(supplement.evidence.signals)) {
        console.log(`✅ Evidence signals is array: ${supplement.evidence.signals.length} signals`);
        
        if (supplement.evidence.signals.length > 0) {
          const signal = supplement.evidence.signals[0];
          if (signal.name && signal.interpretation) {
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
    const response = await axios.get(`${BASE_URL}/supplements/${TEST_USER_ID}/today`);
    const supplement = response.data?.data;

    if (supplement.recommendation) {
      const requiredFields = ['type', 'priority', 'summary', 'actions'];
      const missingFields = requiredFields.filter(field => !(field in supplement.recommendation));

      if (missingFields.length === 0) {
        console.log('✅ All recommendation fields present');
      } else {
        errors.push(`Missing recommendation fields: ${missingFields.join(', ')}`);
        console.log(`❌ Missing recommendation fields: ${missingFields.join(', ')}`);
      }

      if (supplement.recommendation.type === 'supplement') {
        console.log('✅ Recommendation type is "supplement"');
      } else {
        errors.push('Recommendation type should be "supplement"');
        console.log('❌ Recommendation type should be "supplement"');
      }

      const validPriorities = ['critical', 'important', 'optimization'];
      if (validPriorities.includes(supplement.recommendation.priority)) {
        console.log(`✅ Valid priority: ${supplement.recommendation.priority}`);
      } else {
        errors.push(`Invalid priority: ${supplement.recommendation.priority}`);
        console.log(`❌ Invalid priority: ${supplement.recommendation.priority}`);
      }

      if (Array.isArray(supplement.recommendation.actions) && supplement.recommendation.actions.length > 0) {
        console.log(`✅ Actions array with ${supplement.recommendation.actions.length} items`);
      } else {
        errors.push('Actions array empty or invalid');
        console.log('❌ Actions array empty or invalid');
      }

      if (supplement.recommendation.source) {
        console.log(`✅ Source: ${supplement.recommendation.source}`);
        const validSources = ['deterministic', 'ai_enriched', 'fallback'];
        if (validSources.includes(supplement.recommendation.source)) {
          console.log('✅ Valid source value');
        } else {
          errors.push(`Invalid source: ${supplement.recommendation.source}`);
          console.log(`❌ Invalid source: ${supplement.recommendation.source}`);
        }
      }
    }
  } catch (error: any) {
    errors.push('Recommendation structure validation failed');
    console.log('❌ Recommendation structure validation failed');
  }

  console.log('\n--- Scenario 5: Record Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/supplements/${TEST_USER_ID}/today`);
    const supplement = response.data?.data;

    const requiredFields = ['id', 'userId', 'date', 'supplementStatus', 'recommendation', 'createdAt'];
    const missingFields = requiredFields.filter(field => !(field in supplement));

    if (missingFields.length === 0) {
      console.log('✅ All required record fields present');
    } else {
      errors.push(`Missing record fields: ${missingFields.join(', ')}`);
      console.log(`❌ Missing record fields: ${missingFields.join(', ')}`);
    }

    if (supplement.userId === TEST_USER_ID) {
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
    const response = await axios.get(`${BASE_URL}/supplements/${TEST_USER_ID}/history`);

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

  console.log('\n--- Scenario 7: Stack Size Signal ---');
  try {
    const response = await axios.get(`${BASE_URL}/supplements/${TEST_USER_ID}/today`);
    const supplement = response.data?.data;

    if (supplement.evidence?.signals) {
      const stackSizeSignal = supplement.evidence.signals.find((s: any) => s.name === 'Stack Size');
      if (stackSizeSignal) {
        console.log('✅ Stack size signal present');
        console.log(`   Value: ${stackSizeSignal.value}`);
        console.log(`   Interpretation: ${stackSizeSignal.interpretation}`);
      } else {
        console.log('⚠️ Stack size signal not found');
      }
    }
  } catch (error: any) {
    errors.push('Stack size signal check failed');
    console.log('❌ Stack size signal check failed');
  }

  console.log('\n--- Scenario 8: Adherence Signal ---');
  try {
    const response = await axios.get(`${BASE_URL}/supplements/${TEST_USER_ID}/today`);
    const supplement = response.data?.data;

    if (supplement.evidence?.signals) {
      const adherenceSignal = supplement.evidence.signals.find((s: any) => s.name === 'Adherence Score');
      if (adherenceSignal) {
        console.log('✅ Adherence score signal present');
        console.log(`   Value: ${adherenceSignal.value}`);
        console.log(`   Interpretation: ${adherenceSignal.interpretation}`);
      } else {
        console.log('⚠️ Adherence score signal not found (may be missing input data)');
      }
    }
  } catch (error: any) {
    errors.push('Adherence signal check failed');
    console.log('❌ Adherence signal check failed');
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
