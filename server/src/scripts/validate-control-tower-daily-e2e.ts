import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'control-tower-daily-e2e-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Control Tower Daily Intelligence API E2E Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Scenario 1: Standard Daily Flow ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/control-tower/${TEST_USER_ID}/today?regenerate=true`,
    );

    const ct = response.data?.data;
    logs.push(`Control Tower response received: ${response.status}`);

    if (ct) {
      console.log('✅ Control Tower response generated');
    } else {
      errors.push('Control Tower response not generated');
      console.log('❌ Control Tower response not generated');
    }

    if (ct.overallStatus) {
      console.log(`✅ Overall status: ${ct.overallStatus}`);
      logs.push(`Overall status: ${ct.overallStatus}`);
    } else {
      errors.push('Overall status missing');
      console.log('❌ Overall status missing');
    }

    if (ct.headline) {
      console.log(`✅ Headline: ${ct.headline}`);
    } else {
      errors.push('Headline missing');
      console.log('❌ Headline missing');
    }

    if (ct.reasoning) {
      console.log('✅ Reasoning exists');
    } else {
      errors.push('Reasoning missing');
      console.log('❌ Reasoning missing');
    }

    if (ct.trust) {
      console.log('✅ Trust metadata exists');
      console.log(`   Data availability: ${ct.trust.dataAvailabilityState}`);
      logs.push(`Data availability: ${ct.trust.dataAvailabilityState}`);
    } else {
      errors.push('Trust metadata missing');
      console.log('❌ Trust metadata missing');
    }

    if (ct.workout) {
      console.log('✅ Workout card exists');
      console.log(`   Title: ${ct.workout.title}`);
      console.log(`   Summary: ${ct.workout.summary}`);
    } else {
      errors.push('Workout card missing');
      console.log('❌ Workout card missing');
    }

    if (ct.nutrition) {
      console.log('✅ Nutrition card exists');
      console.log(`   Title: ${ct.nutrition.title}`);
      console.log(`   Summary: ${ct.nutrition.summary}`);
    } else {
      errors.push('Nutrition card missing');
      console.log('❌ Nutrition card missing');
    }

    if (Array.isArray(ct.priorities)) {
      console.log(`✅ Priorities exist: ${ct.priorities.length} priorities`);
      logs.push(`Priority count: ${ct.priorities.length}`);
    } else {
      errors.push('Priorities not an array');
      console.log('❌ Priorities not an array');
    }

    if (Array.isArray(ct.predictiveAlerts)) {
      console.log(`✅ Predictive alerts exist: ${ct.predictiveAlerts.length} alerts`);
      logs.push(`Alert count: ${ct.predictiveAlerts.length}`);
    } else {
      errors.push('Predictive alerts not an array');
      console.log('❌ Predictive alerts not an array');
    }

    if (ct.quickActions) {
      console.log('✅ Quick actions exist');
    } else {
      errors.push('Quick actions missing');
      console.log('❌ Quick actions missing');
    }

    if (ct.source === 'control_tower_daily') {
      console.log('✅ Source is "control_tower_daily"');
    } else {
      errors.push('Source should be "control_tower_daily"');
      console.log('❌ Source should be "control_tower_daily"');
    }
  } catch (error: any) {
    errors.push('Standard daily flow failed');
    console.log('❌ Standard daily flow failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 2: Trust Metadata Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const ct = response.data?.data;

    if (ct.trust) {
      const requiredFields = ['dataAvailabilityState'];
      const missingFields = requiredFields.filter(field => !(field in ct.trust));

      if (missingFields.length === 0) {
        console.log('✅ Required trust fields present');
      } else {
        errors.push(`Missing trust fields: ${missingFields.join(', ')}`);
        console.log(`❌ Missing trust fields: ${missingFields.join(', ')}`);
      }

      const validStates = ['complete', 'partial', 'minimal'];
      if (validStates.includes(ct.trust.dataAvailabilityState)) {
        console.log(`✅ Valid data availability state: ${ct.trust.dataAvailabilityState}`);
      } else {
        errors.push(`Invalid data availability state: ${ct.trust.dataAvailabilityState}`);
        console.log(`❌ Invalid data availability state: ${ct.trust.dataAvailabilityState}`);
      }

      if (ct.trust.lastUpdated) {
        console.log('✅ Last updated timestamp exists');
      }

      if (ct.trust.missingDataSources) {
        console.log(`   Missing data sources: ${ct.trust.missingDataSources.join(', ')}`);
      }
    }
  } catch (error: any) {
    errors.push('Trust metadata validation failed');
    console.log('❌ Trust metadata validation failed');
  }

  console.log('\n--- Scenario 3: Priority Cards Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const ct = response.data?.data;

    if (ct.priorities && ct.priorities.length > 0) {
      const priority = ct.priorities[0];

      if (priority.priority) {
        console.log(`✅ Priority has priority level: ${priority.priority}`);
      } else {
        errors.push('Priority level missing');
        console.log('❌ Priority level missing');
      }

      if (priority.title) {
        console.log('✅ Priority has title');
      } else {
        errors.push('Priority title missing');
        console.log('❌ Priority title missing');
      }

      if (priority.source) {
        console.log(`✅ Priority has source: ${priority.source}`);
      } else {
        errors.push('Priority source missing');
        console.log('❌ Priority source missing');
      }

      if (ct.priorities.length <= 3) {
        console.log(`✅ Priority count capped at 3: ${ct.priorities.length}`);
      } else {
        errors.push('Too many priorities (should be max 3)');
        console.log('❌ Too many priorities (should be max 3)');
      }
    } else {
      console.log('ℹ️  No priorities available (acceptable if no priority data)');
    }
  } catch (error: any) {
    errors.push('Priority cards validation failed');
    console.log('❌ Priority cards validation failed');
  }

  console.log('\n--- Scenario 4: Workout Card Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const ct = response.data?.data;

    if (ct.workout) {
      if (ct.workout.title) {
        console.log(`✅ Workout card has title: ${ct.workout.title}`);
      } else {
        errors.push('Workout card title missing');
        console.log('❌ Workout card title missing');
      }

      if (ct.workout.summary) {
        console.log('✅ Workout card has summary');
      } else {
        errors.push('Workout card summary missing');
        console.log('❌ Workout card summary missing');
      }

      if (ct.workout.workoutType) {
        console.log(`   Workout type: ${ct.workout.workoutType}`);
      }

      if (ct.workout.topAdjustments) {
        console.log(`   Top adjustments: ${ct.workout.topAdjustments.length}`);
        if (ct.workout.topAdjustments.length <= 3) {
          console.log('✅ Adjustments capped at 3');
        } else {
          errors.push('Too many workout adjustments (should be max 3)');
          console.log('❌ Too many workout adjustments (should be max 3)');
        }
      }
    }
  } catch (error: any) {
    errors.push('Workout card validation failed');
    console.log('❌ Workout card validation failed');
  }

  console.log('\n--- Scenario 5: Nutrition Card Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const ct = response.data?.data;

    if (ct.nutrition) {
      if (ct.nutrition.title) {
        console.log(`✅ Nutrition card has title: ${ct.nutrition.title}`);
      } else {
        errors.push('Nutrition card title missing');
        console.log('❌ Nutrition card title missing');
      }

      if (ct.nutrition.summary) {
        console.log('✅ Nutrition card has summary');
      } else {
        errors.push('Nutrition card summary missing');
        console.log('❌ Nutrition card summary missing');
      }

      if (ct.nutrition.calories != null) {
        console.log(`   Calories: ${ct.nutrition.calories}`);
      }

      if (ct.nutrition.protein != null) {
        console.log(`   Protein: ${ct.nutrition.protein}g`);
      }

      if (ct.nutrition.topAdjustments) {
        console.log(`   Top adjustments: ${ct.nutrition.topAdjustments.length}`);
        if (ct.nutrition.topAdjustments.length <= 3) {
          console.log('✅ Adjustments capped at 3');
        } else {
          errors.push('Too many nutrition adjustments (should be max 3)');
          console.log('❌ Too many nutrition adjustments (should be max 3)');
        }
      }
    }
  } catch (error: any) {
    errors.push('Nutrition card validation failed');
    console.log('❌ Nutrition card validation failed');
  }

  console.log('\n--- Scenario 6: Quick Actions Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const ct = response.data?.data;

    if (ct.quickActions) {
      console.log('✅ Quick actions exist');
      
      const actionKeys = Object.keys(ct.quickActions);
      console.log(`   Available actions: ${actionKeys.join(', ')}`);

      if (ct.quickActions.viewWorkout !== undefined) {
        console.log('✅ viewWorkout action defined');
      }

      if (ct.quickActions.viewNutrition !== undefined) {
        console.log('✅ viewNutrition action defined');
      }
    }
  } catch (error: any) {
    errors.push('Quick actions validation failed');
    console.log('❌ Quick actions validation failed');
  }

  console.log('\n--- Scenario 7: Record Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const ct = response.data?.data;

    const requiredFields = [
      'id',
      'userId',
      'date',
      'overallStatus',
      'headline',
      'reasoning',
      'trust',
      'priorities',
      'predictiveAlerts',
      'workout',
      'nutrition',
      'quickActions',
      'source',
    ];
    const missingFields = requiredFields.filter(field => !(field in ct));

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

  console.log('\n--- Scenario 8: Today Retrieval (Cached) ---');
  try {
    const response = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);

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

  console.log('\n--- Scenario 9: Metabolic Card ---');
  try {
    const response = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const ct = response.data?.data;

    if (ct.metabolic) {
      console.log('✅ Metabolic card exists');
      console.log(`   Title: ${ct.metabolic.title}`);
      console.log(`   Summary: ${ct.metabolic.summary}`);
      console.log(`   Status: ${ct.metabolic.status}`);
      
      if (ct.metabolic.actions && ct.metabolic.actions.length > 0) {
        console.log(`   Actions: ${ct.metabolic.actions.length}`);
      }
      
      logs.push(`Metabolic status: ${ct.metabolic.status}`);
    } else {
      console.log('ℹ️  Metabolic card not present (acceptable if no metabolic data)');
    }
  } catch (error: any) {
    errors.push('Metabolic card validation failed');
    console.log('❌ Metabolic card validation failed');
  }

  console.log('\n--- Scenario 10: Cardiovascular Card ---');
  try {
    const response = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const ct = response.data?.data;

    if (ct.cardiovascular) {
      console.log('✅ Cardiovascular card exists');
      console.log(`   Title: ${ct.cardiovascular.title}`);
      console.log(`   Summary: ${ct.cardiovascular.summary}`);
      console.log(`   Status: ${ct.cardiovascular.status}`);
      
      if (ct.cardiovascular.actions && ct.cardiovascular.actions.length > 0) {
        console.log(`   Actions: ${ct.cardiovascular.actions.length}`);
      }
      
      logs.push(`Cardiovascular status: ${ct.cardiovascular.status}`);
    } else {
      console.log('ℹ️  Cardiovascular card not present (acceptable if no cardiovascular data)');
    }
  } catch (error: any) {
    errors.push('Cardiovascular card validation failed');
    console.log('❌ Cardiovascular card validation failed');
  }

  console.log('\n--- Scenario 11: Sexual Health Card ---');
  try {
    const response = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const ct = response.data?.data;

    if (ct.sexualHealth) {
      console.log('✅ Sexual Health card exists');
      console.log(`   Title: ${ct.sexualHealth.title}`);
      console.log(`   Summary: ${ct.sexualHealth.summary}`);
      console.log(`   Status: ${ct.sexualHealth.status}`);
      
      if (ct.sexualHealth.actions && ct.sexualHealth.actions.length > 0) {
        console.log(`   Actions: ${ct.sexualHealth.actions.length}`);
      }
      
      logs.push(`Sexual Health status: ${ct.sexualHealth.status}`);
    } else {
      console.log('ℹ️  Sexual Health card not present (acceptable if no sexual health data)');
    }
  } catch (error: any) {
    errors.push('Sexual Health card validation failed');
    console.log('❌ Sexual Health card validation failed');
  }

  console.log('\n--- Scenario 12: History Retrieval ---');
  try {
    const response = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/history`);

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
