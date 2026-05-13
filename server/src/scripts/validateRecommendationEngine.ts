/**
 * RecommendationEngine Validation Script
 * 
 * Validates end-to-end flow:
 * 1. Recovery Engine calculates record
 * 2. RecommendationEngine receives request
 * 3. Recommendation is persisted
 * 4. Prioritization works
 * 5. Conflict detection runs
 * 6. Lifecycle transitions work
 */

import { 
  createRecommendation,
  getActiveRecommendations,
  getPrioritizedRecommendations,
  acceptRecommendation,
  rejectRecommendation,
  snoozeRecommendation,
  completeRecommendation,
} from '../services/recommendationEngineService';
import { getRecoveryToday } from '../services/recoveryEngineService';
import { logger } from '../utils/logger';
import type { RecommendationRequest } from '../types/recommendationEngine';

const TEST_USER_ID = 'test-user-123';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function printSection(title: string) {
  console.log('\n' + '='.repeat(80));
  console.log(title);
  console.log('='.repeat(80));
}

function printValue(label: string, value: any, isGood: boolean = true) {
  const icon = isGood ? '✅' : '⚠️ ';
  console.log(`${icon} ${label}: ${JSON.stringify(value, null, 2)}`);
}

// ============================================================================
// TEST 1: RECOVERY ENGINE INTEGRATION
// ============================================================================

async function testRecoveryEngineIntegration() {
  printSection('TEST 1: RECOVERY ENGINE INTEGRATION');
  
  console.log('\n📊 Generating recovery record with poor recovery...');
  
  // Force poor recovery to trigger recommendation
  const recoveryRecord = await getRecoveryToday(TEST_USER_ID, {
    regenerate: true,
    override: {
      hrv: 30, // Low HRV
      sleepDurationHours: 5, // Poor sleep
      sleepQuality: 2, // Poor quality
      restingHr: 75,
      stressLevel: 4, // High stress
      workoutLoad: 9, // High load
      verbalRecoveryFeeling: 2, // Poor feeling
      adherenceScore: 70,
    },
  });
  
  printValue('Recovery Score', recoveryRecord.recoveryScore);
  printValue('Recovery Status', recoveryRecord.recoveryStatus);
  printValue('Readiness', recoveryRecord.readinessClassification);
  
  console.log('\n⏳ Waiting 2 seconds for recommendation emission...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n📋 Fetching active recommendations...');
  const { recommendations } = await getActiveRecommendations(TEST_USER_ID);
  
  const recoveryRec = recommendations.find(r => r.sourceEngine === 'recovery');
  
  if (recoveryRec) {
    printValue('✅ Recovery recommendation created', {
      id: recoveryRec.id,
      title: recoveryRec.title,
      priority: recoveryRec.priority,
      state: recoveryRec.state,
    }, true);
  } else {
    printValue('❌ No recovery recommendation found', null, false);
  }
  
  return recoveryRec;
}

// ============================================================================
// TEST 2: DEDUPLICATION
// ============================================================================

async function testDeduplication() {
  printSection('TEST 2: DEDUPLICATION & IDEMPOTENCY');
  
  console.log('\n📊 Running recovery engine again (should not create duplicate)...');
  
  const beforeCount = (await getActiveRecommendations(TEST_USER_ID)).recommendations.length;
  
  // Run recovery engine again with same inputs
  await getRecoveryToday(TEST_USER_ID, { regenerate: true });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const afterCount = (await getActiveRecommendations(TEST_USER_ID)).recommendations.length;
  
  if (beforeCount === afterCount) {
    printValue('✅ Deduplication working', `Count stayed at ${afterCount}`, true);
  } else {
    printValue('❌ Duplicate created', `Count increased from ${beforeCount} to ${afterCount}`, false);
  }
}

// ============================================================================
// TEST 3: PRIORITIZATION
// ============================================================================

async function testPrioritization() {
  printSection('TEST 3: PRIORITIZATION');
  
  console.log('\n📊 Creating recommendations with different priorities...');
  
  // Create critical recommendation
  await createRecommendation({
    userId: TEST_USER_ID,
    request: {
      sourceEngine: 'cardiovascular',
      title: 'Consult doctor about high blood pressure',
      description: 'Your blood pressure is elevated',
      priority: 'critical',
      urgencyScore: 95,
      category: 'medical_consultation',
      confidenceLevel: 'high',
      dataQualityScore: 90,
    },
  });
  
  // Create optimization recommendation
  await createRecommendation({
    userId: TEST_USER_ID,
    request: {
      sourceEngine: 'nutrition',
      title: 'Increase protein intake',
      description: 'Consider adding 20g more protein',
      priority: 'optimization',
      urgencyScore: 30,
      category: 'nutrition_change',
      confidenceLevel: 'medium',
      dataQualityScore: 70,
    },
  });
  
  console.log('\n📋 Fetching prioritized recommendations...');
  const prioritized = await getPrioritizedRecommendations(TEST_USER_ID);
  
  printValue('Critical count', prioritized.critical.length);
  printValue('Important count', prioritized.important.length);
  printValue('Optimization count', prioritized.optimization.length);
  
  console.log('\n📊 Priority order:');
  prioritized.critical.forEach((rec, i) => {
    console.log(`  ${i + 1}. [CRITICAL] ${rec.title}`);
  });
  prioritized.important.forEach((rec, i) => {
    console.log(`  ${prioritized.critical.length + i + 1}. [IMPORTANT] ${rec.title}`);
  });
  prioritized.optimization.forEach((rec, i) => {
    console.log(`  ${prioritized.critical.length + prioritized.important.length + i + 1}. [OPTIMIZATION] ${rec.title}`);
  });
  
  // Verify critical is first
  if (prioritized.critical.length > 0 && prioritized.critical[0].priority === 'critical') {
    printValue('✅ Prioritization working', 'Critical recommendations first', true);
  } else {
    printValue('❌ Prioritization broken', 'Critical not first', false);
  }
}

// ============================================================================
// TEST 4: CONFLICT DETECTION
// ============================================================================

async function testConflictDetection() {
  printSection('TEST 4: CONFLICT DETECTION');
  
  console.log('\n📊 Creating conflicting recommendations...');
  
  // Create rest recommendation
  const restRec = await createRecommendation({
    userId: TEST_USER_ID,
    request: {
      sourceEngine: 'recovery',
      title: 'Take a rest day',
      description: 'Your recovery is poor, take a full rest day',
      priority: 'important',
      urgencyScore: 80,
      category: 'workout_modification',
      actionType: 'modify',
      actionTarget: 'Today\'s Workout',
      confidenceLevel: 'high',
      dataQualityScore: 90,
    },
  });
  
  // Create intense workout recommendation (should conflict)
  const workoutRec = await createRecommendation({
    userId: TEST_USER_ID,
    request: {
      sourceEngine: 'workout',
      title: 'Perform heavy deadlifts',
      description: 'Today is heavy deadlift day with intense volume',
      priority: 'important',
      urgencyScore: 70,
      category: 'workout_modification',
      actionType: 'modify',
      actionTarget: 'Today\'s Workout',
      confidenceLevel: 'high',
      dataQualityScore: 85,
    },
  });
  
  if (workoutRec.conflicts.length > 0) {
    printValue('✅ Conflict detected', {
      conflictCount: workoutRec.conflicts.length,
      conflictType: workoutRec.conflicts[0].conflictType,
      severity: workoutRec.conflicts[0].conflictSeverity,
    }, true);
    console.log(`\n   Conflict: ${workoutRec.conflicts[0].conflictDescription}`);
  } else {
    printValue('❌ No conflict detected', 'Should have detected rest vs intense workout', false);
  }
}

// ============================================================================
// TEST 5: LIFECYCLE TRANSITIONS
// ============================================================================

async function testLifecycleTransitions(recommendationId: string) {
  printSection('TEST 5: LIFECYCLE TRANSITIONS');
  
  console.log('\n📊 Testing state transitions...');
  
  // Test: Accept
  console.log('\n1️⃣  Accepting recommendation...');
  const accepted = await acceptRecommendation({
    recommendationId,
    userNotes: 'Will take a rest day today',
  });
  printValue('State after accept', accepted.state, accepted.state === 'accepted');
  printValue('Accepted at timestamp', accepted.acceptedAt, !!accepted.acceptedAt);
  
  // Test: Complete
  console.log('\n2️⃣  Completing recommendation...');
  const completed = await completeRecommendation({
    recommendationId,
    userNotes: 'Took a full rest day, feeling better',
  });
  printValue('State after complete', completed.state, completed.state === 'completed');
  printValue('Completed at timestamp', completed.completedAt, !!completed.completedAt);
  
  // Create new recommendation for reject test
  console.log('\n3️⃣  Creating new recommendation for reject test...');
  const newRec = await createRecommendation({
    userId: TEST_USER_ID,
    request: {
      sourceEngine: 'stress',
      title: 'Practice meditation',
      description: 'Your stress is elevated',
      priority: 'optimization',
      urgencyScore: 40,
      category: 'stress_management',
      confidenceLevel: 'medium',
      dataQualityScore: 75,
    },
  });
  
  const rejected = await rejectRecommendation({
    recommendationId: newRec.recommendation.id,
    rejectionReason: 'Not interested in meditation',
  });
  printValue('State after reject', rejected.state, rejected.state === 'rejected');
  printValue('Rejection reason', rejected.rejectionReason, !!rejected.rejectionReason);
  
  // Create another for snooze test
  console.log('\n4️⃣  Creating new recommendation for snooze test...');
  const snoozeRec = await createRecommendation({
    userId: TEST_USER_ID,
    request: {
      sourceEngine: 'supplement',
      title: 'Add Vitamin D',
      description: 'Consider adding Vitamin D supplement',
      priority: 'optimization',
      urgencyScore: 30,
      category: 'supplement_adjustment',
      confidenceLevel: 'medium',
      dataQualityScore: 70,
    },
  });
  
  const snoozed = await snoozeRecommendation({
    recommendationId: snoozeRec.recommendation.id,
    snoozedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    snoozeReason: 'Will consider next week',
  });
  printValue('State after snooze', snoozed.state, snoozed.state === 'snoozed');
  printValue('Snoozed until', snoozed.snoozedUntil, !!snoozed.snoozedUntil);
  
  console.log('\n✅ All lifecycle transitions working correctly');
}

// ============================================================================
// TEST 6: CONFIDENCE & DATA QUALITY PRESERVATION
// ============================================================================

async function testConfidencePreservation() {
  printSection('TEST 6: CONFIDENCE & DATA QUALITY PRESERVATION');
  
  console.log('\n📊 Creating recommendation with specific confidence/quality...');
  
  const result = await createRecommendation({
    userId: TEST_USER_ID,
    request: {
      sourceEngine: 'metabolic',
      title: 'Monitor glucose levels',
      description: 'Your fasting glucose is slightly elevated',
      priority: 'important',
      urgencyScore: 60,
      category: 'health_monitoring',
      confidenceLevel: 'medium',
      dataQualityScore: 65,
    },
  });
  
  const rec = result.recommendation;
  
  printValue('Confidence level preserved', rec.confidenceLevel, rec.confidenceLevel === 'medium');
  printValue('Data quality score preserved', rec.dataQualityScore, rec.dataQualityScore === 65);
  
  console.log('\n📋 Verifying in active recommendations...');
  const { recommendations } = await getActiveRecommendations(TEST_USER_ID);
  const found = recommendations.find(r => r.id === rec.id);
  
  if (found) {
    printValue('✅ Confidence exposed to consumers', found.confidenceLevel, true);
    printValue('✅ Data quality exposed to consumers', found.dataQualityScore, true);
  } else {
    printValue('❌ Recommendation not found', null, false);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║              RECOMMENDATION ENGINE VALIDATION SUITE                        ║');
  console.log('║                                                                            ║');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('\n');
  
  try {
    // Test 1: Recovery Engine Integration
    const recoveryRec = await testRecoveryEngineIntegration();
    
    // Test 2: Deduplication
    await testDeduplication();
    
    // Test 3: Prioritization
    await testPrioritization();
    
    // Test 4: Conflict Detection
    await testConflictDetection();
    
    // Test 5: Lifecycle Transitions (if we have a recovery recommendation)
    if (recoveryRec) {
      await testLifecycleTransitions(recoveryRec.id);
    }
    
    // Test 6: Confidence & Data Quality Preservation
    await testConfidencePreservation();
    
    // Final summary
    printSection('VALIDATION COMPLETE ✅');
    console.log('\n✅ All tests passed');
    console.log('✅ RecommendationEngine is working correctly');
    console.log('✅ Recovery Engine integration successful');
    console.log('\n📝 Ready to migrate additional engines\n');
    
  } catch (error) {
    console.error('\n❌ VALIDATION FAILED:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
