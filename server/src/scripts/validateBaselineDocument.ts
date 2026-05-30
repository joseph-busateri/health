import { createBaselineDocument, getBaselineProfile, getLatestBaselineDocument } from '../services/baselineDocumentService';
import type { CreateBaselineDocumentRequest } from '../services/baselineDocumentService';
import { logger } from '../utils/logger';

interface ValidationResult {
  step: string;
  passed: boolean;
  message: string;
  details?: any;
}

const testUserId = 'validation-test-user';

const createTestBaselineData = (): CreateBaselineDocumentRequest['manualProfileData'] => ({
  demographics: {
    birthDate: '1990-01-15',
    height: 180,
    weightStartingReference: 85,
    gender: 'male',
    activityLevel: 'moderately_active',
  },
  trainingContext: {
    workoutFrequency: '4-5 times per week',
    trainingStyle: ['strength training', 'cardio', 'yoga'],
    athleticBackground: 'Former collegiate athlete',
    injuryHistory: 'Minor knee sprain in 2021',
  },
  lifestyleContext: {
    sleepHabits: '7-8 hours nightly, consistent schedule',
    travelFrequency: 'Monthly for work',
    stressContext: 'Moderate work stress, good stress management',
  },
  overallHealthGoals: {
    bodyFatGoal: '12-15%',
    weightGoal: '82kg',
    a1cGoal: '5.4%',
    restingHeartRateGoal: 60,
    bloodPressureSystolicGoal: 120,
    bloodPressureDiastolicGoal: 80,
    sleepHoursGoal: 8,
  },
  sexualPerformanceGoals: {
    erectileFunctionGoal: 'Optimal performance',
    libidoGoal: 'High healthy libido',
  },
  workoutGoals: {
    chestGoal: '42 inches',
    bicepLeftGoal: '16 inches',
    bicepRightGoal: '16 inches',
    forearmLeftGoal: '13 inches',
    forearmRightGoal: '13 inches',
    neckGoal: '16 inches',
    shouldersGoal: '50 inches',
    benchPressGoal: '315 lbs',
    squatGoal: '405 lbs',
    pushupsGoal: '50 consecutive',
    gripStrengthLeftGoal: '120 lbs',
    gripStrengthRightGoal: '120 lbs',
  },
  secondaryGoals: {
    dailyWaterGoal: 4000,
    dailyProteinGoal: 180,
    dailyCaloriesGoal: 2800,
    longevityGoalNotes: 'Focus on mobility and cardiovascular health',
  },
  priorityOrder: {
    priority1: 'Strength and muscle development',
    priority2: 'Cardiovascular health',
    priority3: 'Body composition',
    priority4: 'Recovery and sleep',
    priority5: 'Longevity and injury prevention',
  },
});

const validateBaselineDocumentEngine = async (): Promise<ValidationResult[]> => {
  const results: ValidationResult[] = [];

  // Step 1: Upload baseline document
  try {
    const testData = createTestBaselineData();
    const uploadResult = await createBaselineDocument({
      userId: testUserId,
      documentType: 'manual_entry',
      notes: 'Validation test baseline document',
      manualProfileData: testData,
    });

    results.push({
      step: 'POST /baseline-document',
      passed: true,
      message: 'Baseline document uploaded successfully',
      details: {
        documentId: uploadResult.document.id,
        profileId: uploadResult.profile.id,
        extractedSectionsCount: uploadResult.extractedSections.length,
      },
    });

    // Step 2: Validate baseline document record
    const document = uploadResult.document;
    const documentValidation = {
      hasFileReference: !!document.fileReference,
      hasUploadDate: !!document.uploadDate,
      hasDocumentType: !!document.documentType,
      hasParseStatus: !!document.parseStatus,
      hasExtractionConfidence: document.extractionConfidence !== undefined,
      correctParseStatus: document.parseStatus === 'completed',
      correctDocumentType: document.documentType === 'manual_entry',
      correctExtractionConfidence: document.extractionConfidence === 1.0,
    };

    results.push({
      step: 'baseline_documents record validation',
      passed: Object.values(documentValidation).every(Boolean),
      message: documentValidation.hasFileReference && 
               documentValidation.hasUploadDate && 
               documentValidation.hasDocumentType &&
               documentValidation.hasParseStatus &&
               documentValidation.hasExtractionConfidence
        ? 'All required fields present and correct'
        : 'Missing or incorrect fields',
      details: documentValidation,
    });

    // Step 3: Validate baseline profile record
    const profile = uploadResult.profile;
    const profileSections = {
      demographics: !!profile.demographics,
      trainingContext: !!profile.trainingContext,
      lifestyleContext: !!profile.lifestyleContext,
      overallHealthGoals: !!profile.overallHealthGoals,
      sexualPerformanceGoals: !!profile.sexualPerformanceGoals,
      workoutGoals: !!profile.workoutGoals,
      secondaryGoals: !!profile.secondaryGoals,
      priorityOrder: !!profile.priorityOrder,
    };

    // Validate specific demographics fields
    const demographicsFields = {
      birthDate: !!profile.demographics?.birthDate,
      height: !!profile.demographics?.height,
      weightStartingReference: !!profile.demographics?.weightStartingReference,
      gender: !!profile.demographics?.gender,
      activityLevel: !!profile.demographics?.activityLevel,
    };

    // Validate training context fields
    const trainingFields = {
      workoutFrequency: !!profile.trainingContext?.workoutFrequency,
      trainingStyle: !!profile.trainingContext?.trainingStyle?.length,
      athleticBackground: !!profile.trainingContext?.athleticBackground,
      injuryHistory: !!profile.trainingContext?.injuryHistory,
    };

    // Validate lifestyle context fields
    const lifestyleFields = {
      sleepHabits: !!profile.lifestyleContext?.sleepHabits,
      travelFrequency: !!profile.lifestyleContext?.travelFrequency,
      stressContext: !!profile.lifestyleContext?.stressContext,
    };

    // Validate goal framework fields
    const goalFields = {
      overallHealthGoals: !!profile.overallHealthGoals,
      sexualPerformanceGoals: !!profile.sexualPerformanceGoals,
      workoutGoals: !!profile.workoutGoals,
      secondaryGoals: !!profile.secondaryGoals,
      priorityOrder: !!profile.priorityOrder,
    };

    results.push({
      step: 'baseline_profile record validation',
      passed: Object.values(profileSections).every(Boolean) &&
              Object.values(demographicsFields).every(Boolean) &&
              Object.values(trainingFields).every(Boolean) &&
              Object.values(lifestyleFields).every(Boolean) &&
              Object.values(goalFields).every(Boolean),
      message: 'All profile sections and required fields present',
      details: {
        sections: profileSections,
        demographicsFields,
        trainingFields,
        lifestyleFields,
        goalFields,
      },
    });

    // Step 4: Validate extracted sections
    const extractedSectionsValidation = {
      hasSections: uploadResult.extractedSections.length > 0,
      correctCount: uploadResult.extractedSections.length === 8, // All sections should be extracted
      allLinkedToDocument: uploadResult.extractedSections.every(section => section.documentId === document.id),
      allHaveConfidence: uploadResult.extractedSections.every(section => section.extractionConfidence > 0),
      allHaveNormalizedNames: uploadResult.extractedSections.every(section => section.normalizedName),
    };

    results.push({
      step: 'baseline_extracted_sections validation',
      passed: Object.values(extractedSectionsValidation).every(Boolean),
      message: extractedSectionsValidation.hasSections &&
               extractedSectionsValidation.correctCount &&
               extractedSectionsValidation.allLinkedToDocument &&
               extractedSectionsValidation.allHaveConfidence &&
               extractedSectionsValidation.allHaveNormalizedNames
        ? 'All extracted sections created correctly'
        : 'Issues with extracted sections',
      details: extractedSectionsValidation,
    });

    // Step 5: Test GET /baseline-profile/:user_id
    const retrievedProfile = await getBaselineProfile(testUserId);
    const profileRetrievalValidation = {
      profileFound: !!retrievedProfile,
      correctId: retrievedProfile?.id === profile.id,
      correctUserId: retrievedProfile?.userId === testUserId,
      allSectionsPresent: retrievedProfile ? Object.values({
        demographics: !!retrievedProfile.demographics,
        trainingContext: !!retrievedProfile.trainingContext,
        lifestyleContext: !!retrievedProfile.lifestyleContext,
        overallHealthGoals: !!retrievedProfile.overallHealthGoals,
        sexualPerformanceGoals: !!retrievedProfile.sexualPerformanceGoals,
        workoutGoals: !!retrievedProfile.workoutGoals,
        secondaryGoals: !!retrievedProfile.secondaryGoals,
        priorityOrder: !!retrievedProfile.priorityOrder,
      }).every(Boolean) : false,
    };

    results.push({
      step: 'GET /baseline-profile/:user_id',
      passed: Object.values(profileRetrievalValidation).every(Boolean),
      message: profileRetrievalValidation.profileFound &&
               profileRetrievalValidation.correctId &&
               profileRetrievalValidation.correctUserId &&
               profileRetrievalValidation.allSectionsPresent
        ? 'Profile retrieved successfully'
        : 'Profile retrieval failed',
      details: profileRetrievalValidation,
    });

    // Step 6: Test GET /baseline-document/:user_id/latest
    const latestDocument = await getLatestBaselineDocument(testUserId);
    const documentRetrievalValidation = {
      documentFound: !!latestDocument,
      correctId: latestDocument?.id === document.id,
      correctUserId: latestDocument?.userId === testUserId,
      correctDocumentType: latestDocument?.documentType === 'manual_entry',
    };

    results.push({
      step: 'GET /baseline-document/:user_id/latest',
      passed: Object.values(documentRetrievalValidation).every(Boolean),
      message: documentRetrievalValidation.documentFound &&
               documentRetrievalValidation.correctId &&
               documentRetrievalValidation.correctUserId &&
               documentRetrievalValidation.correctDocumentType
        ? 'Latest document retrieved successfully'
        : 'Latest document retrieval failed',
      details: documentRetrievalValidation,
    });

    // Step 7: Test duplicate upload
    const duplicateResult = await createBaselineDocument({
      userId: testUserId,
      documentType: 'manual_entry',
      notes: 'Duplicate validation test',
      manualProfileData: {
        demographics: {
          birthDate: '1990-01-15',
          height: 182, // Different height
          weightStartingReference: 83,
          gender: 'male',
          activityLevel: 'very_active',
        },
      },
    });

    const latestAfterDuplicate = await getLatestBaselineDocument(testUserId);
    const duplicateValidation = {
      duplicateCreated: !!duplicateResult,
      latestIsNewDocument: latestAfterDuplicate?.id !== document.id,
      latestHasCorrectData: latestAfterDuplicate?.documentType === 'manual_entry',
    };

    results.push({
      step: 'duplicate upload handling',
      passed: Object.values(duplicateValidation).every(Boolean),
      message: 'Duplicate uploads handled correctly, latest retrieval works',
      details: duplicateValidation,
    });

    // Step 8: Test error handling - missing required fields
    try {
      await createBaselineDocument({
        userId: testUserId,
        documentType: 'manual_entry',
        // Missing manualProfileData for manual_entry type
      });
      results.push({
        step: 'error handling - missing required fields',
        passed: false,
        message: 'Should have failed with missing required fields',
      });
    } catch (error) {
      results.push({
        step: 'error handling - missing required fields',
        passed: true,
        message: 'Correctly rejected invalid payload',
        details: { error: (error as Error).message },
      });
    }

    // Step 9: Test error handling - missing user_id
    try {
      await createBaselineDocument({
        userId: '',
        documentType: 'manual_entry',
        manualProfileData: createTestBaselineData(),
      });
      results.push({
        step: 'error handling - missing user_id',
        passed: false,
        message: 'Should have failed with empty user_id',
      });
    } catch (error) {
      results.push({
        step: 'error handling - missing user_id',
        passed: true,
        message: 'Correctly rejected missing user_id',
        details: { error: (error as Error).message },
      });
    }

    // Step 10: Test persistence - simulate session reload
    const persistenceTest = await getBaselineProfile(testUserId);
    const persistenceValidation = {
      profileStillExists: !!persistenceTest,
      dataIntact: !!persistenceTest?.demographics?.birthDate &&
                  !!persistenceTest?.trainingContext?.workoutFrequency &&
                  !!persistenceTest?.lifestyleContext?.sleepHabits &&
                  !!persistenceTest?.overallHealthGoals?.weightGoal,
    };

    results.push({
      step: 'persistence validation',
      passed: Object.values(persistenceValidation).every(Boolean),
      message: 'Data persists correctly after session reload simulation',
      details: persistenceValidation,
    });

  } catch (error) {
    results.push({
      step: 'baseline document upload',
      passed: false,
      message: 'Failed to upload baseline document',
      details: { error: (error as Error).message },
    });
  }

  return results;
};

const main = async () => {
  console.log('=== Wave 1, Step 1: Baseline Document Engine Validation ===\n');

  const results = await validateBaselineDocumentEngine();
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${result.step}: ${status}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    console.log('');
  });

  console.log('=== Validation Summary ===');
  console.log(`Overall result: ${passedCount === totalCount ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Passed: ${passedCount}/${totalCount} tests`);
  
  if (passedCount === totalCount) {
    console.log('\n🎉 Wave 1, Step 1 baseline document engine is fully validated!');
  } else {
    console.log('\n⚠️  Some validation tests failed. Review the details above.');
  }
};

if (require.main === module) {
  main().catch(console.error);
}
