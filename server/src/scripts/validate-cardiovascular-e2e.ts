import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'cardiovascular-e2e-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Cardiovascular Engine E2E Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Scenario 1: Get Cardiovascular Today (Optimal) ---');
  try {
    const response = await axios.get(`${BASE_URL}/cardiovascular/${TEST_USER_ID}/today`);
    const cardiovascular = response.data?.data;

    logs.push(`Cardiovascular response received: ${response.status}`);

    if (cardiovascular) {
      console.log('✅ Cardiovascular record generated');
    } else {
      errors.push('Cardiovascular record not generated');
      console.log('❌ Cardiovascular record not generated');
    }

    if (cardiovascular.cardiovascularStatus) {
      console.log(`✅ Cardiovascular status: ${cardiovascular.cardiovascularStatus}`);
      logs.push(`Cardiovascular status: ${cardiovascular.cardiovascularStatus}`);
    } else {
      errors.push('Cardiovascular status missing');
      console.log('❌ Cardiovascular status missing');
    }

    if (cardiovascular.evidence) {
      console.log('✅ Evidence exists');
      console.log(`   Signals: ${cardiovascular.evidence.signals?.length || 0}`);
      logs.push(`Evidence signals: ${cardiovascular.evidence.signals?.length || 0}`);
    } else {
      errors.push('Evidence missing');
      console.log('❌ Evidence missing');
    }

    if (cardiovascular.recommendation) {
      console.log('✅ Recommendation exists');
      console.log(`   Priority: ${cardiovascular.recommendation.priority}`);
      console.log(`   Summary: ${cardiovascular.recommendation.summary}`);
      console.log(`   Actions: ${cardiovascular.recommendation.actions?.length || 0}`);
      logs.push(`Recommendation priority: ${cardiovascular.recommendation.priority}`);
      logs.push(`Recommendation source: ${cardiovascular.recommendation.source}`);
    } else {
      errors.push('Recommendation missing');
      console.log('❌ Recommendation missing');
    }
  } catch (error: any) {
    errors.push('Get cardiovascular today failed');
    console.log('❌ Get cardiovascular today failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 2: Cardiovascular Status Validation ---');
  try {
    const response = await axios.get(`${BASE_URL}/cardiovascular/${TEST_USER_ID}/today`);
    const cardiovascular = response.data?.data;

    const validStatuses = ['optimal', 'moderate', 'elevated_risk', 'high_risk'];
    if (validStatuses.includes(cardiovascular.cardiovascularStatus)) {
      console.log(`✅ Valid cardiovascular status: ${cardiovascular.cardiovascularStatus}`);
    } else {
      errors.push(`Invalid cardiovascular status: ${cardiovascular.cardiovascularStatus}`);
      console.log(`❌ Invalid cardiovascular status: ${cardiovascular.cardiovascularStatus}`);
    }
  } catch (error: any) {
    errors.push('Cardiovascular status validation failed');
    console.log('❌ Cardiovascular status validation failed');
  }

  console.log('\n--- Scenario 3: Evidence Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/cardiovascular/${TEST_USER_ID}/today`);
    const cardiovascular = response.data?.data;

    if (cardiovascular.evidence) {
      const requiredFields = ['cardiovascularStatus', 'signals', 'summary'];
      const missingFields = requiredFields.filter(field => !(field in cardiovascular.evidence));

      if (missingFields.length === 0) {
        console.log('✅ All evidence fields present');
      } else {
        errors.push(`Missing evidence fields: ${missingFields.join(', ')}`);
        console.log(`❌ Missing evidence fields: ${missingFields.join(', ')}`);
      }

      if (Array.isArray(cardiovascular.evidence.signals)) {
        console.log(`✅ Evidence signals is array: ${cardiovascular.evidence.signals.length} signals`);
        
        if (cardiovascular.evidence.signals.length > 0) {
          const signal = cardiovascular.evidence.signals[0];
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
    const response = await axios.get(`${BASE_URL}/cardiovascular/${TEST_USER_ID}/today`);
    const cardiovascular = response.data?.data;

    if (cardiovascular.recommendation) {
      const requiredFields = ['type', 'priority', 'summary', 'actions'];
      const missingFields = requiredFields.filter(field => !(field in cardiovascular.recommendation));

      if (missingFields.length === 0) {
        console.log('✅ All recommendation fields present');
      } else {
        errors.push(`Missing recommendation fields: ${missingFields.join(', ')}`);
        console.log(`❌ Missing recommendation fields: ${missingFields.join(', ')}`);
      }

      if (cardiovascular.recommendation.type === 'cardiovascular') {
        console.log('✅ Recommendation type is "cardiovascular"');
      } else {
        errors.push('Recommendation type should be "cardiovascular"');
        console.log('❌ Recommendation type should be "cardiovascular"');
      }

      const validPriorities = ['critical', 'important', 'optimization'];
      if (validPriorities.includes(cardiovascular.recommendation.priority)) {
        console.log(`✅ Valid priority: ${cardiovascular.recommendation.priority}`);
      } else {
        errors.push(`Invalid priority: ${cardiovascular.recommendation.priority}`);
        console.log(`❌ Invalid priority: ${cardiovascular.recommendation.priority}`);
      }

      if (Array.isArray(cardiovascular.recommendation.actions) && cardiovascular.recommendation.actions.length > 0) {
        console.log(`✅ Actions array with ${cardiovascular.recommendation.actions.length} items`);
      } else {
        errors.push('Actions array empty or invalid');
        console.log('❌ Actions array empty or invalid');
      }

      if (cardiovascular.recommendation.source) {
        console.log(`✅ Source: ${cardiovascular.recommendation.source}`);
        const validSources = ['deterministic', 'ai_enriched', 'fallback'];
        if (validSources.includes(cardiovascular.recommendation.source)) {
          console.log('✅ Valid source value');
        } else {
          errors.push(`Invalid source: ${cardiovascular.recommendation.source}`);
          console.log(`❌ Invalid source: ${cardiovascular.recommendation.source}`);
        }
      }
    }
  } catch (error: any) {
    errors.push('Recommendation structure validation failed');
    console.log('❌ Recommendation structure validation failed');
  }

  console.log('\n--- Scenario 5: Record Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/cardiovascular/${TEST_USER_ID}/today`);
    const cardiovascular = response.data?.data;

    const requiredFields = ['id', 'userId', 'date', 'cardiovascularStatus', 'recommendation', 'createdAt'];
    const missingFields = requiredFields.filter(field => !(field in cardiovascular));

    if (missingFields.length === 0) {
      console.log('✅ All required record fields present');
    } else {
      errors.push(`Missing record fields: ${missingFields.join(', ')}`);
      console.log(`❌ Missing record fields: ${missingFields.join(', ')}`);
    }

    if (cardiovascular.userId === TEST_USER_ID) {
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
    const response = await axios.get(`${BASE_URL}/cardiovascular/${TEST_USER_ID}/history`);

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

  console.log('\n--- Scenario 7: Blood Pressure Signals ---');
  try {
    const response = await axios.get(`${BASE_URL}/cardiovascular/${TEST_USER_ID}/today`);
    const cardiovascular = response.data?.data;

    if (cardiovascular.evidence?.signals) {
      const bpSignal = cardiovascular.evidence.signals.find((s: any) => s.name === 'Blood Pressure');
      if (bpSignal) {
        console.log('✅ Blood pressure signal present');
        console.log(`   Value: ${bpSignal.value}`);
        console.log(`   Interpretation: ${bpSignal.interpretation}`);
      } else {
        console.log('⚠️ Blood pressure signal not found (may be missing input data)');
      }
    }
  } catch (error: any) {
    errors.push('Blood pressure signal check failed');
    console.log('❌ Blood pressure signal check failed');
  }

  console.log('\n--- Scenario 8: Lipid Panel Signals ---');
  try {
    const response = await axios.get(`${BASE_URL}/cardiovascular/${TEST_USER_ID}/today`);
    const cardiovascular = response.data?.data;

    if (cardiovascular.evidence?.signals) {
      const lipidSignals = cardiovascular.evidence.signals.filter((s: any) => 
        s.name.includes('Cholesterol') || s.name.includes('Triglycerides')
      );
      if (lipidSignals.length > 0) {
        console.log(`✅ Lipid panel signals present: ${lipidSignals.length} signals`);
        lipidSignals.forEach((signal: any) => {
          console.log(`   ${signal.name}: ${signal.value} (${signal.interpretation})`);
        });
      } else {
        console.log('⚠️ Lipid panel signals not found (may be missing input data)');
      }
    }
  } catch (error: any) {
    errors.push('Lipid panel signal check failed');
    console.log('❌ Lipid panel signal check failed');
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
