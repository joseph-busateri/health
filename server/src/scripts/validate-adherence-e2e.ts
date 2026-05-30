import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'adherence-e2e-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Adherence Engine E2E Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Scenario 1: High Adherence ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/adherence/${TEST_USER_ID}/today?regenerate=true&workout_adherence=90&nutrition_adherence=85&sleep_adherence=88&supplement_adherence=82`,
    );

    if (response.data?.data?.adherenceScore >= 80) {
      console.log('✅ High adherence scenario - score calculated correctly');
      logs.push('High adherence: score >= 80');
    } else {
      errors.push('High adherence scenario - score too low');
      console.log('❌ High adherence scenario - score too low');
    }

    if (response.data?.data?.status === 'high') {
      console.log('✅ High adherence scenario - status correct');
    } else {
      errors.push('High adherence scenario - status incorrect');
      console.log('❌ High adherence scenario - status incorrect');
    }
  } catch (error: any) {
    errors.push('High adherence scenario - request failed');
    console.log('❌ High adherence scenario - request failed');
  }

  console.log('\n--- Scenario 2: Moderate Adherence ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/adherence/${TEST_USER_ID}/today?regenerate=true&workout_adherence=70&nutrition_adherence=65&sleep_adherence=60&supplement_adherence=68`,
    );

    if (response.data?.data?.adherenceScore >= 60 && response.data?.data?.adherenceScore < 80) {
      console.log('✅ Moderate adherence scenario - score calculated correctly');
      logs.push('Moderate adherence: 60 <= score < 80');
    } else {
      errors.push('Moderate adherence scenario - score out of range');
      console.log('❌ Moderate adherence scenario - score out of range');
    }

    if (response.data?.data?.status === 'moderate') {
      console.log('✅ Moderate adherence scenario - status correct');
    } else {
      errors.push('Moderate adherence scenario - status incorrect');
      console.log('❌ Moderate adherence scenario - status incorrect');
    }
  } catch (error: any) {
    errors.push('Moderate adherence scenario - request failed');
    console.log('❌ Moderate adherence scenario - request failed');
  }

  console.log('\n--- Scenario 3: Low Adherence ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/adherence/${TEST_USER_ID}/today?regenerate=true&workout_adherence=40&nutrition_adherence=35&sleep_adherence=45&supplement_adherence=38`,
    );

    if (response.data?.data?.adherenceScore < 60) {
      console.log('✅ Low adherence scenario - score calculated correctly');
      logs.push('Low adherence: score < 60');
    } else {
      errors.push('Low adherence scenario - score too high');
      console.log('❌ Low adherence scenario - score too high');
    }

    if (response.data?.data?.status === 'low') {
      console.log('✅ Low adherence scenario - status correct');
    } else {
      errors.push('Low adherence scenario - status incorrect');
      console.log('❌ Low adherence scenario - status incorrect');
    }
  } catch (error: any) {
    errors.push('Low adherence scenario - request failed');
    console.log('❌ Low adherence scenario - request failed');
  }

  console.log('\n--- Scenario 4: Missing Input Handling ---');
  try {
    const response = await axios.get(`${BASE_URL}/adherence/${TEST_USER_ID}/today?regenerate=true`);

    if (response.data?.data?.adherenceScore != null) {
      console.log('✅ Missing input handling - score calculated with defaults');
    } else {
      errors.push('Missing input handling - no score returned');
      console.log('❌ Missing input handling - no score returned');
    }

    if (response.data?.data?.recommendation?.summary) {
      console.log('✅ Missing input handling - recommendation generated');
    } else {
      errors.push('Missing input handling - no recommendation');
      console.log('❌ Missing input handling - no recommendation');
    }
  } catch (error: any) {
    errors.push('Missing input handling - request failed');
    console.log('❌ Missing input handling - request failed');
  }

  console.log('\n--- Scenario 5: Today Retrieval ---');
  try {
    const response = await axios.get(`${BASE_URL}/adherence/${TEST_USER_ID}/today`);

    if (response.data?.data?.id) {
      console.log('✅ Today retrieval - record returned');
    } else {
      errors.push('Today retrieval - no record');
      console.log('❌ Today retrieval - no record');
    }
  } catch (error: any) {
    errors.push('Today retrieval - request failed');
    console.log('❌ Today retrieval - request failed');
  }

  console.log('\n--- Scenario 6: History Retrieval ---');
  try {
    const response = await axios.get(`${BASE_URL}/adherence/${TEST_USER_ID}/history`);

    if (Array.isArray(response.data?.data)) {
      console.log('✅ History retrieval - array returned');
      logs.push(`History count: ${response.data.data.length}`);
    } else {
      errors.push('History retrieval - not an array');
      console.log('❌ History retrieval - not an array');
    }
  } catch (error: any) {
    errors.push('History retrieval - request failed');
    console.log('❌ History retrieval - request failed');
  }

  console.log('\n--- Scenario 7: Persistence Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/adherence/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    const requiredFields = ['id', 'userId', 'date', 'adherenceScore', 'status', 'breakdown', 'recommendation', 'sourceInputs'];
    const missingFields = requiredFields.filter(field => !(field in record));

    if (missingFields.length === 0) {
      console.log('✅ Persistence structure - all required fields present');
    } else {
      errors.push(`Persistence structure - missing fields: ${missingFields.join(', ')}`);
      console.log(`❌ Persistence structure - missing fields: ${missingFields.join(', ')}`);
    }

    if (record.recommendation?.summary && record.recommendation?.note) {
      console.log('✅ Persistence structure - recommendation has summary and note');
    } else {
      errors.push('Persistence structure - recommendation incomplete');
      console.log('❌ Persistence structure - recommendation incomplete');
    }
  } catch (error: any) {
    errors.push('Persistence structure - request failed');
    console.log('❌ Persistence structure - request failed');
  }

  console.log('\n--- Scenario 8: Backward Compatibility ---');
  try {
    const response = await axios.get(`${BASE_URL}/adherence/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    if (record.recommendation?.summary && record.recommendation?.note) {
      console.log('✅ Backward compatibility - legacy fields preserved');
    } else {
      errors.push('Backward compatibility - legacy fields missing');
      console.log('❌ Backward compatibility - legacy fields missing');
    }

    if (record.breakdown?.workout != null && record.breakdown?.nutrition != null) {
      console.log('✅ Backward compatibility - breakdown structure preserved');
    } else {
      errors.push('Backward compatibility - breakdown structure changed');
      console.log('❌ Backward compatibility - breakdown structure changed');
    }
  } catch (error: any) {
    errors.push('Backward compatibility - request failed');
    console.log('❌ Backward compatibility - request failed');
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
