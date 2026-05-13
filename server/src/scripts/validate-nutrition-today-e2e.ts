import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'nutrition-today-e2e-test';

async function seedNutritionBaseline() {
  console.log('📋 Seeding nutrition baseline for test user...');
  
  const baseline = {
    userId: TEST_USER_ID,
    calories: 2800,
    protein: 200,
    carbs: 280,
    fats: 80,
    hydrationOz: 100,
    bodyWeight: 180,
  };

  try {
    await axios.post(`${BASE_URL}/nutrition-today/seed`, baseline);
    console.log('✅ Nutrition baseline seeded');
  } catch (error) {
    console.log('⚠️  Baseline seed failed (may already exist)');
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('Nutrition Today Integrated E2E Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  await seedNutritionBaseline();

  console.log('\n--- Scenario 1: Baseline Nutrition Plan ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/nutrition-today/${TEST_USER_ID}/today?regenerate=true`,
    );

    const record = response.data?.data;
    logs.push(`Nutrition today response received: ${response.status}`);

    if (record.targets) {
      console.log(`✅ Nutrition targets generated`);
      console.log(`   Calories: ${record.targets.calories}`);
      console.log(`   Protein: ${record.targets.protein}g`);
      console.log(`   Carbs: ${record.targets.carbs}g`);
      console.log(`   Fats: ${record.targets.fats}g`);
      console.log(`   Hydration: ${record.targets.hydrationOz}oz`);
      logs.push(`Targets: ${JSON.stringify(record.targets)}`);
    } else {
      errors.push('Nutrition targets not generated');
      console.log('❌ Nutrition targets not generated');
    }

    if (record.mealTiming) {
      console.log(`✅ Meal timing generated`);
      logs.push(`Meal timing keys: ${Object.keys(record.mealTiming).join(', ')}`);
    } else {
      errors.push('Meal timing not generated');
      console.log('❌ Meal timing not generated');
    }

    if (record.summary) {
      console.log('✅ Summary exists');
    } else {
      errors.push('Summary missing');
      console.log('❌ Summary missing');
    }

    if (record.source) {
      console.log(`✅ Source: ${record.source}`);
      logs.push(`Source: ${record.source}`);
    } else {
      errors.push('Source missing');
      console.log('❌ Source missing');
    }
  } catch (error: any) {
    errors.push('Baseline scenario - request failed');
    console.log('❌ Baseline scenario - request failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 2: Nutrition Targets Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    if (record.targets) {
      const requiredFields = ['calories', 'protein', 'carbs', 'fats', 'hydrationOz'];
      const missingFields = requiredFields.filter(field => !(field in record.targets));

      if (missingFields.length === 0) {
        console.log('✅ All nutrition target fields present');
      } else {
        errors.push(`Missing target fields: ${missingFields.join(', ')}`);
        console.log(`❌ Missing target fields: ${missingFields.join(', ')}`);
      }

      if (record.targets.calories > 0) {
        console.log(`✅ Calories is positive: ${record.targets.calories}`);
      } else {
        errors.push('Calories should be positive');
        console.log('❌ Calories should be positive');
      }

      if (record.targets.protein > 0) {
        console.log(`✅ Protein is positive: ${record.targets.protein}g`);
      } else {
        errors.push('Protein should be positive');
        console.log('❌ Protein should be positive');
      }
    }
  } catch (error: any) {
    errors.push('Targets structure validation failed');
    console.log('❌ Targets structure validation failed');
  }

  console.log('\n--- Scenario 3: Meal Timing Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    if (record.mealTiming) {
      console.log('✅ Meal timing exists');
      
      const mealKeys = Object.keys(record.mealTiming);
      console.log(`   Meal timing includes: ${mealKeys.join(', ')}`);
      
      if (mealKeys.length > 0) {
        console.log('✅ At least one meal timing entry exists');
      } else {
        errors.push('No meal timing entries');
        console.log('❌ No meal timing entries');
      }
    } else {
      errors.push('Meal timing missing');
      console.log('❌ Meal timing missing');
    }
  } catch (error: any) {
    errors.push('Meal timing validation failed');
    console.log('❌ Meal timing validation failed');
  }

  console.log('\n--- Scenario 4: Adjustments Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    if (record.adjustments && Array.isArray(record.adjustments)) {
      console.log(`✅ Adjustments array exists: ${record.adjustments.length} adjustments`);
      logs.push(`Adjustment count: ${record.adjustments.length}`);

      if (record.adjustments.length > 0) {
        const adjustment = record.adjustments[0];
        
        if (adjustment.type) {
          console.log(`✅ Adjustment has type: ${adjustment.type}`);
        } else {
          errors.push('Adjustment type missing');
          console.log('❌ Adjustment type missing');
        }

        if (adjustment.reason) {
          console.log('✅ Adjustment has reason');
        } else {
          errors.push('Adjustment reason missing');
          console.log('❌ Adjustment reason missing');
        }

        if (adjustment.adjustment) {
          console.log('✅ Adjustment has description');
        } else {
          errors.push('Adjustment description missing');
          console.log('❌ Adjustment description missing');
        }
      }
    } else {
      errors.push('Adjustments not an array');
      console.log('❌ Adjustments not an array');
    }
  } catch (error: any) {
    errors.push('Adjustments validation failed');
    console.log('❌ Adjustments validation failed');
  }

  console.log('\n--- Scenario 5: Source Signals ---');
  try {
    const response = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    if (record.sourceSignals) {
      console.log('✅ Source signals exist');
      
      const signals = record.sourceSignals;
      if (signals.recoveryScore != null) {
        console.log(`   Recovery score: ${signals.recoveryScore}`);
      }
      if (signals.stressScore != null) {
        console.log(`   Stress score: ${signals.stressScore}`);
      }
      if (signals.workoutStatus) {
        console.log(`   Workout status: ${signals.workoutStatus}`);
      }
      if (signals.goalType) {
        console.log(`   Goal type: ${signals.goalType}`);
      }
    } else {
      errors.push('Source signals missing');
      console.log('❌ Source signals missing');
    }
  } catch (error: any) {
    errors.push('Source signals validation failed');
    console.log('❌ Source signals validation failed');
  }

  console.log('\n--- Scenario 6: Baseline Targets Preservation ---');
  try {
    const response = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    if (record.baselineTargets) {
      console.log('✅ Baseline targets preserved');
      console.log(`   Baseline calories: ${record.baselineTargets.calories}`);
      console.log(`   Current calories: ${record.targets.calories}`);
      
      if (record.baselineTargets.calories !== record.targets.calories) {
        console.log('✅ Adjustments were applied (targets differ from baseline)');
      } else {
        console.log('ℹ️  No adjustments applied (targets match baseline)');
      }
    } else {
      console.log('⚠️  Baseline targets not preserved (may be optional)');
    }
  } catch (error: any) {
    errors.push('Baseline preservation check failed');
    console.log('❌ Baseline preservation check failed');
  }

  console.log('\n--- Scenario 7: Today Retrieval (Cached) ---');
  try {
    const response = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/today`);

    if (response.data?.data?.id) {
      console.log('✅ Today record retrieved (cached)');
    } else {
      errors.push('Today record not retrieved');
      console.log('❌ Today record not retrieved');
    }
  } catch (error: any) {
    errors.push('Today retrieval failed');
    console.log('❌ Today retrieval failed');
  }

  console.log('\n--- Scenario 8: History Retrieval ---');
  try {
    const response = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/history`);

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

  console.log('\n--- Scenario 9: Record Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    const requiredFields = [
      'id',
      'userId',
      'date',
      'targets',
      'mealTiming',
      'adjustments',
      'summary',
      'source',
      'sourceSignals',
    ];
    const missingFields = requiredFields.filter(field => !(field in record));

    if (missingFields.length === 0) {
      console.log('✅ All required fields present');
    } else {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
    }
  } catch (error: any) {
    errors.push('Record structure test failed');
    console.log('❌ Record structure test failed');
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
