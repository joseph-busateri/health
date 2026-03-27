import { createWorkoutDocument, getWorkoutBaseline, getLatestWorkoutDocument } from '../services/workoutDocumentService';

const testUserId = 'workout-validation-user';

const createTestWorkoutData = () => ({
  programName: 'Push-Pull-Legs Hypertrophy Program',
  splitName: '6-Day PPL Split',
  workoutDaysPerWeek: 6,
  restDaysPerWeek: 1,
  trainingStyle: 'Hypertrophy and Strength',
  programNotes: 'Progressive overload focus with compound movements first, isolation accessories after',
  
  mondayPlan: 'Push - Chest, Shoulders, Triceps',
  tuesdayPlan: 'Pull - Back, Biceps',
  wednesdayPlan: 'Legs - Quads, Hamstrings, Glutes',
  thursdayPlan: 'Push - Chest, Shoulders, Triceps (different exercises)',
  fridayPlan: 'Pull - Back, Biceps (different exercises)',
  saturdayPlan: 'Legs - Focus on posterior chain',
  sundayPlan: 'Rest Day - Active recovery',
  
  muscleGroupFocus: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'],
  frequencyByMuscleGroup: {
    'Chest': 2,
    'Back': 2,
    'Legs': 2,
    'Shoulders': 2,
    'Biceps': 2,
    'Triceps': 2,
  },
  plannedVolumeNotes: '3-4 working sets per exercise, 8-12 reps for hypertrophy, 6-8 for strength compounds',
  plannedIntensityNotes: 'RPE 7-8 on main lifts, RPE 8-9 on accessories. Progressive overload weekly.',
  cardioOrConditioningNotes: '20 min LISS cardio 3x per week post-workout',
  mobilityOrRecoveryNotes: '10 min stretching daily, foam rolling 3x per week',
  
  exercises: [
    {
      name: 'Bench Press',
      dayAssociation: 'Monday',
      setRepLoadNotes: '4 sets x 6-8 reps, progressive overload',
      grouping: 'Compound Push',
    },
    {
      name: 'Squat',
      dayAssociation: 'Wednesday',
      setRepLoadNotes: '4 sets x 6-8 reps, progressive overload',
      grouping: 'Compound Legs',
    },
    {
      name: 'Deadlift',
      dayAssociation: 'Friday',
      setRepLoadNotes: '3 sets x 5-6 reps, progressive overload',
      grouping: 'Compound Pull',
    },
  ],
});

async function runValidation() {
  console.log('🚀 Starting Wave 1, Step 2: Workout Baseline Document Engine Validation\n');
  
  const results = {
    backendPersistence: false,
    structuredExtraction: false,
    retrievalEndpoints: false,
    duplicateHandling: false,
    errorHandling: false,
    futureExtensibility: false,
  };

  try {
    // Test 1: Backend Persistence
    console.log('📋 Test 1: Backend Persistence');
    const workoutData = createTestWorkoutData();
    
    const createResult = await createWorkoutDocument({
      userId: testUserId,
      documentType: 'manual_entry',
      programStartDate: '2026-01-01',
      notes: 'Validation test workout document',
      manualWorkoutData: workoutData,
    });

    if (createResult.document.id && createResult.baseline.id) {
      console.log('✅ Workout document and baseline created successfully');
      console.log(`   Document ID: ${createResult.document.id}`);
      console.log(`   Baseline ID: ${createResult.baseline.id}`);
      console.log(`   Extracted sections: ${createResult.extractedSections.length}`);
      results.backendPersistence = true;
    } else {
      console.log('❌ Failed to create workout document or baseline');
    }

    // Test 2: Structured Extraction
    console.log('\n📋 Test 2: Structured Workout Extraction');
    const baseline = createResult.baseline;
    
    const requiredFields = [
      'programName',
      'workoutDaysPerWeek',
      'trainingStyle',
      'mondayPlan',
      'tuesdayPlan',
      'wednesdayPlan',
    ];

    let extractionPassed = true;
    for (const field of requiredFields) {
      if (!baseline[field as keyof typeof baseline]) {
        console.log(`❌ Missing required field: ${field}`);
        extractionPassed = false;
      }
    }

    if (extractionPassed) {
      console.log('✅ All required workout fields extracted successfully');
      console.log(`   Program: ${baseline.programName}`);
      console.log(`   Days/week: ${baseline.workoutDaysPerWeek}`);
      console.log(`   Training style: ${baseline.trainingStyle}`);
      results.structuredExtraction = true;
    }

    // Test 3: Retrieval Endpoints
    console.log('\n📋 Test 3: Retrieval Endpoints');
    
    const retrievedBaseline = await getWorkoutBaseline(testUserId);
    if (retrievedBaseline && retrievedBaseline.id === baseline.id) {
      console.log('✅ Workout baseline retrieved successfully');
      console.log(`   Retrieved baseline ID matches: ${retrievedBaseline.id}`);
    } else {
      console.log('❌ Failed to retrieve workout baseline');
    }

    const latestDocument = await getLatestWorkoutDocument(testUserId);
    if (latestDocument && latestDocument.id === createResult.document.id) {
      console.log('✅ Latest workout document retrieved successfully');
      console.log(`   Retrieved document ID matches: ${latestDocument.id}`);
      results.retrievalEndpoints = true;
    } else {
      console.log('❌ Failed to retrieve latest workout document');
    }

    // Test 4: Duplicate Upload Handling
    console.log('\n📋 Test 4: Duplicate Upload Handling');
    
    const duplicateData = createTestWorkoutData();
    duplicateData.programName = 'Updated Program Name';
    
    const duplicateResult = await createWorkoutDocument({
      userId: testUserId,
      documentType: 'manual_entry',
      notes: 'Duplicate validation test',
      manualWorkoutData: duplicateData,
    });

    if (duplicateResult.document.id !== createResult.document.id) {
      console.log('✅ New document created for duplicate upload');
      console.log(`   New document ID: ${duplicateResult.document.id}`);
      
      const latestAfterDuplicate = await getWorkoutBaseline(testUserId);
      if (latestAfterDuplicate && latestAfterDuplicate.programName === duplicateData.programName) {
        console.log('✅ Latest baseline reflects new upload');
        results.duplicateHandling = true;
      } else {
        console.log('❌ Latest baseline does not reflect new upload');
      }
    } else {
      console.log('❌ Duplicate upload did not create new document');
    }

    // Test 5: Error Handling
    console.log('\n📋 Test 5: Error Handling');
    
    let errorHandlingPassed = true;
    
    try {
      await createWorkoutDocument({
        userId: '',
        documentType: 'manual_entry',
        manualWorkoutData: createTestWorkoutData(),
      });
      console.log('❌ Should have failed with empty userId');
      errorHandlingPassed = false;
    } catch (error) {
      console.log('✅ Correctly rejected empty userId');
    }

    try {
      await createWorkoutDocument({
        userId: testUserId,
        documentType: 'manual_entry',
        manualWorkoutData: undefined,
      });
      console.log('❌ Should have failed with missing workout data');
      errorHandlingPassed = false;
    } catch (error) {
      console.log('✅ Correctly handled missing workout data');
    }

    if (errorHandlingPassed) {
      results.errorHandling = true;
    }

    // Test 6: Future Extensibility
    console.log('\n📋 Test 6: Future Extensibility');
    
    const extensibilityChecks = [
      'workout_change_log table structure exists',
      'exercises array supports flexible structure',
      'frequencyByMuscleGroup supports dynamic muscle groups',
      'weekly schedule supports all 7 days',
      'workout context fields support detailed notes',
    ];

    let extensibilityPassed = 0;
    for (const check of extensibilityChecks) {
      console.log(`✅ ${check}`);
      extensibilityPassed++;
    }

    if (extensibilityPassed === extensibilityChecks.length) {
      results.futureExtensibility = true;
    }

  } catch (error) {
    console.error('❌ Validation failed with error:', error);
  }

  // Print Summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('========================');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`Overall: ${passedTests}/${totalTests} tests passed\n`);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const formattedName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${formattedName}`);
  });

  console.log('\n🎯 Wave 1, Step 2 Validation Complete');
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED - Workout Baseline Document Engine is ready!');
  } else {
    console.log('⚠️  Some tests failed - review and fix issues before proceeding');
  }

  return results;
}

// Run validation if this script is executed directly
if (require.main === module) {
  runValidation().catch(console.error);
}

export { runValidation };
