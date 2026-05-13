import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'workout-today-e2e-test';

async function seedWorkoutBaseline() {
  console.log('📋 Seeding workout baseline for test user...');
  
  const baseline = {
    userId: TEST_USER_ID,
    mondayPlan: 'Chest / Shoulders',
    tuesdayPlan: 'Back / Biceps',
    wednesdayPlan: 'Legs',
    thursdayPlan: 'Chest / Triceps',
    fridayPlan: 'Shoulders / Arms',
    saturdayPlan: 'Rest',
    sundayPlan: 'Rest',
    exercises: [
      {
        name: 'Incline Barbell Press',
        dayAssociation: 'mon',
        setRepLoadNotes: '4 sets, 8-10 reps',
        grouping: 'chest',
      },
      {
        name: 'Overhead Press',
        dayAssociation: 'mon',
        setRepLoadNotes: '3 sets, 10-12 reps',
        grouping: 'shoulders',
      },
      {
        name: 'Cable Fly',
        dayAssociation: 'mon',
        setRepLoadNotes: '3 sets, 12-15 reps',
        grouping: 'chest',
      },
      {
        name: 'Lateral Raise',
        dayAssociation: 'mon',
        setRepLoadNotes: '3 sets, 15 reps',
        grouping: 'shoulders',
      },
    ],
  };

  try {
    await axios.post(`${BASE_URL}/workout-baseline/seed`, baseline);
    console.log('✅ Workout baseline seeded');
  } catch (error) {
    console.log('⚠️  Baseline seed failed (may already exist)');
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('Workout Today Integrated E2E Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  await seedWorkoutBaseline();

  console.log('\n--- Scenario 1: Optimal Workout (Progressive Overload) ---');
  try {
    const response = await axios.get(
      `${BASE_URL}/workout-today/${TEST_USER_ID}/today?regenerate=true`,
    );

    const record = response.data?.data;
    logs.push(`Workout today response received: ${response.status}`);

    if (record.exercises && Array.isArray(record.exercises)) {
      console.log(`✅ Exercises generated: ${record.exercises.length} exercises`);
      logs.push(`Exercise count: ${record.exercises.length}`);
    } else {
      errors.push('Exercises not generated');
      console.log('❌ Exercises not generated');
    }

    if (record.adjustments && Array.isArray(record.adjustments)) {
      console.log(`✅ Adjustments applied: ${record.adjustments.length} adjustments`);
      logs.push(`Adjustment count: ${record.adjustments.length}`);
    } else {
      console.log('⚠️  No adjustments applied (may be baseline)');
    }

    if (record.workoutStatus) {
      console.log(`✅ Workout status: ${record.workoutStatus}`);
      logs.push(`Workout status: ${record.workoutStatus}`);
    } else {
      errors.push('Workout status missing');
      console.log('❌ Workout status missing');
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
    errors.push('Optimal scenario - request failed');
    console.log('❌ Optimal scenario - request failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 2: Exercise Structure Validation ---');
  try {
    const response = await axios.get(`${BASE_URL}/workout-today/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    if (record.exercises && record.exercises.length > 0) {
      const firstExercise = record.exercises[0];
      
      if (firstExercise.name) {
        console.log('✅ Exercise has name');
      } else {
        errors.push('Exercise name missing');
        console.log('❌ Exercise name missing');
      }

      if (firstExercise.sets != null) {
        console.log(`✅ Exercise has sets: ${firstExercise.sets}`);
      } else {
        errors.push('Exercise sets missing');
        console.log('❌ Exercise sets missing');
      }

      if (firstExercise.reps) {
        console.log(`✅ Exercise has reps: ${firstExercise.reps}`);
      } else {
        errors.push('Exercise reps missing');
        console.log('❌ Exercise reps missing');
      }

      if (firstExercise.intensity) {
        console.log(`✅ Exercise has intensity guidance: ${firstExercise.intensity}`);
      } else {
        console.log('⚠️  Exercise intensity guidance missing (may be optional)');
      }

      if (firstExercise.rest) {
        console.log(`✅ Exercise has rest period: ${firstExercise.rest}`);
      } else {
        console.log('⚠️  Exercise rest period missing (may be optional)');
      }
    }
  } catch (error: any) {
    errors.push('Exercise structure validation failed');
    console.log('❌ Exercise structure validation failed');
  }

  console.log('\n--- Scenario 3: Adjustment Types Validation ---');
  try {
    const response = await axios.get(`${BASE_URL}/workout-today/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    if (record.adjustments && record.adjustments.length > 0) {
      const adjustment = record.adjustments[0];
      
      if (adjustment.type) {
        console.log(`✅ Adjustment has type: ${adjustment.type}`);
      } else {
        errors.push('Adjustment type missing');
        console.log('❌ Adjustment type missing');
      }

      if (adjustment.description) {
        console.log('✅ Adjustment has description');
      } else {
        errors.push('Adjustment description missing');
        console.log('❌ Adjustment description missing');
      }

      if (adjustment.reason) {
        console.log('✅ Adjustment has reason');
      } else {
        errors.push('Adjustment reason missing');
        console.log('❌ Adjustment reason missing');
      }
    }
  } catch (error: any) {
    errors.push('Adjustment validation failed');
    console.log('❌ Adjustment validation failed');
  }

  console.log('\n--- Scenario 4: Source Signals Validation ---');
  try {
    const response = await axios.get(`${BASE_URL}/workout-today/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    if (record.sourceSignals) {
      console.log('✅ Source signals exist');
      
      const signals = record.sourceSignals;
      if (signals.recoveryScore != null) {
        console.log(`✅ Recovery score: ${signals.recoveryScore}`);
      }
      if (signals.stressScore != null) {
        console.log(`✅ Stress score: ${signals.stressScore}`);
      }
      if (signals.jointRisk) {
        console.log(`✅ Joint risk: ${signals.jointRisk}`);
      }
      if (signals.adherenceScore != null) {
        console.log(`✅ Adherence score: ${signals.adherenceScore}`);
      }
    } else {
      errors.push('Source signals missing');
      console.log('❌ Source signals missing');
    }
  } catch (error: any) {
    errors.push('Source signals validation failed');
    console.log('❌ Source signals validation failed');
  }

  console.log('\n--- Scenario 5: Today Retrieval (Cached) ---');
  try {
    const response = await axios.get(`${BASE_URL}/workout-today/${TEST_USER_ID}/today`);

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

  console.log('\n--- Scenario 6: History Retrieval ---');
  try {
    const response = await axios.get(`${BASE_URL}/workout-today/${TEST_USER_ID}/history`);

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

  console.log('\n--- Scenario 7: Record Structure ---');
  try {
    const response = await axios.get(`${BASE_URL}/workout-today/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    const requiredFields = [
      'id',
      'userId',
      'date',
      'workoutType',
      'workoutStatus',
      'adjustments',
      'exercises',
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

  console.log('\n--- Scenario 8: Workout Type Validation ---');
  try {
    const response = await axios.get(`${BASE_URL}/workout-today/${TEST_USER_ID}/today`);
    const record = response.data?.data;

    if (record.workoutType && record.workoutType.length > 0) {
      console.log(`✅ Workout type: ${record.workoutType}`);
      logs.push(`Workout type: ${record.workoutType}`);
    } else {
      errors.push('Workout type missing or empty');
      console.log('❌ Workout type missing or empty');
    }
  } catch (error: any) {
    errors.push('Workout type validation failed');
    console.log('❌ Workout type validation failed');
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
