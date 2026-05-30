import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'sexual-health-e2e-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Sexual Health Engine E2E Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Scenario 1: Get Sexual Health Today (Optimal) ---');
  try {
    const response = await axios.get(`${BASE_URL}/sexual-health/${TEST_USER_ID}/today`);
    const sexualHealth = response.data?.data;

    logs.push(`Sexual health response received: ${response.status}`);

    if (sexualHealth) {
      console.log('✅ Sexual health record generated');
    } else {
      errors.push('Sexual health record not generated');
      console.log('❌ Sexual health record not generated');
    }

    if (sexualHealth.sexualHealthStatus) {
      console.log(`✅ Sexual health status: ${sexualHealth.sexualHealthStatus}`);
      logs.push(`Sexual health status: ${sexualHealth.sexualHealthStatus}`);
    } else {
      errors.push('Sexual health status missing');
      console.log('❌ Sexual health status missing');
    }

    if (sexualHealth.evidence) {
      console.log('✅ Evidence exists');
      console.log(`   Signals: ${sexualHealth.evidence.signals?.length || 0}`);
      logs.push(`Evidence signals: ${sexualHealth.evidence.signals?.length || 0}`);
    } else {
      errors.push('Evidence missing');
      console.log('❌ Evidence missing');
    }

    if (sexualHealth.recommendation) {
      console.log('✅ Recommendation exists');
      console.log(`   Priority: ${sexualHealth.recommendation.priority}`);
      console.log(`   Summary: ${sexualHealth.recommendation.summary}`);
      console.log(`   Actions: ${sexualHealth.recommendation.actions?.length || 0}`);
      logs.push(`Recommendation priority: ${sexualHealth.recommendation.priority}`);
      logs.push(`Recommendation source: ${sexualHealth.recommendation.source}`);
    } else {
      errors.push('Recommendation missing');
      console.log('❌ Recommendation missing');
    }
  } catch (error: any) {
    errors.push('Get sexual health today failed');
    console.log('❌ Get sexual health today failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 2: Sexual Health Status Validation ---');
  try {
    const response = await axios.get(`${BASE_URL}/sexual-health/${TEST_USER_ID}/today`);
    const sexualHealth = response.data?.data;

    const validStatuses = ['optimal', 'moderate', 'reduced', 'high_risk'];
    if (validStatuses.includes(sexualHealth.sexualHealthStatus)) {
      console.log(`✅ Valid sexual health status: ${sexualHealth.sexualHealthStatus}`);
    } else {
      errors.push(`Invalid sexual health status: ${sexualHealth.sexualHealthStatus}`);
      console.log(`❌ Invalid sexual health status: ${sexualHealth.sexualHealthStatus}`);
    }
  } catch (error: any) {
    errors.push('Sexual health status validation failed');
    console.log('❌ Sexual health status validation failed');
  }

  console.log('\n--- Scenario 3: Evidence Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/sexual-health/${TEST_USER_ID}/today`);
    const sexualHealth = response.data?.data;

    if (sexualHealth.evidence) {
      const requiredFields = ['sexualHealthStatus', 'signals', 'summary'];
      const missingFields = requiredFields.filter(field => !(field in sexualHealth.evidence));

      if (missingFields.length === 0) {
        console.log('✅ All evidence fields present');
      } else {
        errors.push(`Missing evidence fields: ${missingFields.join(', ')}`);
        console.log(`❌ Missing evidence fields: ${missingFields.join(', ')}`);
      }

      if (Array.isArray(sexualHealth.evidence.signals)) {
        console.log(`✅ Evidence signals is array: ${sexualHealth.evidence.signals.length} signals`);
        
        if (sexualHealth.evidence.signals.length > 0) {
          const signal = sexualHealth.evidence.signals[0];
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
    const response = await axios.get(`${BASE_URL}/sexual-health/${TEST_USER_ID}/today`);
    const sexualHealth = response.data?.data;

    if (sexualHealth.recommendation) {
      const requiredFields = ['type', 'priority', 'summary', 'actions'];
      const missingFields = requiredFields.filter(field => !(field in sexualHealth.recommendation));

      if (missingFields.length === 0) {
        console.log('✅ All recommendation fields present');
      } else {
        errors.push(`Missing recommendation fields: ${missingFields.join(', ')}`);
        console.log(`❌ Missing recommendation fields: ${missingFields.join(', ')}`);
      }

      if (sexualHealth.recommendation.type === 'sexual_health') {
        console.log('✅ Recommendation type is "sexual_health"');
      } else {
        errors.push('Recommendation type should be "sexual_health"');
        console.log('❌ Recommendation type should be "sexual_health"');
      }

      const validPriorities = ['critical', 'important', 'optimization'];
      if (validPriorities.includes(sexualHealth.recommendation.priority)) {
        console.log(`✅ Valid priority: ${sexualHealth.recommendation.priority}`);
      } else {
        errors.push(`Invalid priority: ${sexualHealth.recommendation.priority}`);
        console.log(`❌ Invalid priority: ${sexualHealth.recommendation.priority}`);
      }

      if (Array.isArray(sexualHealth.recommendation.actions) && sexualHealth.recommendation.actions.length > 0) {
        console.log(`✅ Actions array with ${sexualHealth.recommendation.actions.length} items`);
      } else {
        errors.push('Actions array empty or invalid');
        console.log('❌ Actions array empty or invalid');
      }

      if (sexualHealth.recommendation.source) {
        console.log(`✅ Source: ${sexualHealth.recommendation.source}`);
        const validSources = ['deterministic', 'ai_enriched', 'fallback'];
        if (validSources.includes(sexualHealth.recommendation.source)) {
          console.log('✅ Valid source value');
        } else {
          errors.push(`Invalid source: ${sexualHealth.recommendation.source}`);
          console.log(`❌ Invalid source: ${sexualHealth.recommendation.source}`);
        }
      }
    }
  } catch (error: any) {
    errors.push('Recommendation structure validation failed');
    console.log('❌ Recommendation structure validation failed');
  }

  console.log('\n--- Scenario 5: Record Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/sexual-health/${TEST_USER_ID}/today`);
    const sexualHealth = response.data?.data;

    const requiredFields = ['id', 'userId', 'date', 'sexualHealthStatus', 'recommendation', 'createdAt'];
    const missingFields = requiredFields.filter(field => !(field in sexualHealth));

    if (missingFields.length === 0) {
      console.log('✅ All required record fields present');
    } else {
      errors.push(`Missing record fields: ${missingFields.join(', ')}`);
      console.log(`❌ Missing record fields: ${missingFields.join(', ')}`);
    }

    if (sexualHealth.userId === TEST_USER_ID) {
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
    const response = await axios.get(`${BASE_URL}/sexual-health/${TEST_USER_ID}/history`);

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

  console.log('\n--- Scenario 7: Recovery Score Signal ---');
  try {
    const response = await axios.get(`${BASE_URL}/sexual-health/${TEST_USER_ID}/today`);
    const sexualHealth = response.data?.data;

    if (sexualHealth.evidence?.signals) {
      const recoverySignal = sexualHealth.evidence.signals.find((s: any) => s.name === 'Recovery Score');
      if (recoverySignal) {
        console.log('✅ Recovery score signal present');
        console.log(`   Value: ${recoverySignal.value}`);
        console.log(`   Interpretation: ${recoverySignal.interpretation}`);
      } else {
        console.log('⚠️ Recovery score signal not found (may be missing input data)');
      }
    }
  } catch (error: any) {
    errors.push('Recovery score signal check failed');
    console.log('❌ Recovery score signal check failed');
  }

  console.log('\n--- Scenario 8: Stress Score Signal ---');
  try {
    const response = await axios.get(`${BASE_URL}/sexual-health/${TEST_USER_ID}/today`);
    const sexualHealth = response.data?.data;

    if (sexualHealth.evidence?.signals) {
      const stressSignal = sexualHealth.evidence.signals.find((s: any) => s.name === 'Stress Score');
      if (stressSignal) {
        console.log('✅ Stress score signal present');
        console.log(`   Value: ${stressSignal.value}`);
        console.log(`   Interpretation: ${stressSignal.interpretation}`);
      } else {
        console.log('⚠️ Stress score signal not found (may be missing input data)');
      }
    }
  } catch (error: any) {
    errors.push('Stress score signal check failed');
    console.log('❌ Stress score signal check failed');
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
