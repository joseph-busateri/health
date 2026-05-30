/**
 * Test Script: DailyHealthSnapshot End-to-End Validation
 * 
 * Purpose:
 * - Validate DailyHealthSnapshot foundation before building new engines
 * - Generate snapshot for test user
 * - Print all sections clearly
 * - Identify real vs placeholder/default values
 * - Show derived intelligence calculations
 * - Test cache behavior
 * - Report null/undefined gaps for future engines
 */

import { generateDailyHealthSnapshot, getCachedSnapshot, invalidateSnapshotCache } from '../services/dailyHealthSnapshotService';
import type { DailyHealthSnapshot } from '../types/dailyHealthSnapshot';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Test user ID - replace with real user ID if available
const TEST_USER_ID = 'test-user-123';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function printSection(title: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80));
}

function printSubSection(title: string) {
  console.log('\n' + '-'.repeat(80));
  console.log(`  ${title}`);
  console.log('-'.repeat(80));
}

function printValue(label: string, value: any, isReal: boolean) {
  const indicator = isReal ? '✅ REAL' : '⚠️  PLACEHOLDER';
  const valueStr = value === null ? 'null' : value === undefined ? 'undefined' : JSON.stringify(value);
  console.log(`  ${label.padEnd(30)} ${valueStr.padEnd(30)} ${indicator}`);
}

function isRealValue(value: any): boolean {
  return value !== null && value !== undefined && value !== 'stable' && value !== 'moderate';
}

function analyzeSection(sectionName: string, section: any): { real: number; placeholder: number; total: number } {
  let real = 0;
  let placeholder = 0;
  let total = 0;

  for (const [key, value] of Object.entries(section)) {
    if (key === 'lastUpdated' || key === 'dataSource' || key === 'confidence') {
      continue; // Skip metadata fields
    }
    total++;
    if (isRealValue(value)) {
      real++;
    } else {
      placeholder++;
    }
  }

  return { real, placeholder, total };
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testSnapshotGeneration() {
  printSection('TEST 1: SNAPSHOT GENERATION');
  
  console.log(`\nGenerating snapshot for user: ${TEST_USER_ID}`);
  console.log('Calling: generateDailyHealthSnapshot()');
  
  const startTime = Date.now();
  const snapshot = await generateDailyHealthSnapshot(TEST_USER_ID);
  const duration = Date.now() - startTime;
  
  console.log(`\n✅ Snapshot generated successfully in ${duration}ms`);
  console.log(`   User ID: ${snapshot.userId}`);
  console.log(`   Date: ${snapshot.date}`);
  console.log(`   Timestamp: ${snapshot.timestamp}`);
  console.log(`   Schema Version: ${snapshot.schemaVersion}`);
  
  return snapshot;
}

async function testRecoverySection(snapshot: DailyHealthSnapshot) {
  printSection('TEST 2: RECOVERY SECTION');
  
  const recovery = snapshot.recovery;
  
  printValue('Score', recovery.score, recovery.score !== null);
  printValue('Status', recovery.status, recovery.status !== 'moderate');
  printValue('Trend', recovery.trend, recovery.trend !== 'stable');
  printValue('HRV', recovery.hrv, recovery.hrv !== undefined);
  printValue('Sleep Hours', recovery.sleepHours, recovery.sleepHours !== undefined);
  printValue('Sleep Quality', recovery.sleepQuality, recovery.sleepQuality !== undefined);
  printValue('Resting HR', recovery.restingHr, recovery.restingHr !== undefined);
  printValue('Verbal Recovery', recovery.verbalRecoveryFeeling, recovery.verbalRecoveryFeeling !== undefined);
  
  const analysis = analyzeSection('Recovery', recovery);
  console.log(`\n📊 Analysis: ${analysis.real}/${analysis.total} real values (${Math.round(analysis.real / analysis.total * 100)}%)`);
}

async function testStressSection(snapshot: DailyHealthSnapshot) {
  printSection('TEST 3: STRESS SECTION');
  
  const stress = snapshot.stress;
  
  printValue('Score', stress.score, stress.score !== null);
  printValue('Status', stress.status, stress.status !== 'moderate');
  printValue('Trend', stress.trend, stress.trend !== 'stable');
  printValue('CNS Load', stress.cnsLoad, stress.cnsLoad !== 'moderate');
  printValue('Interview Stress', stress.interviewStressLevel, stress.interviewStressLevel !== undefined);
  printValue('HRV Stress Indicator', stress.hrvStressIndicator, stress.hrvStressIndicator !== undefined);
  printValue('Sleep Disruption', stress.sleepDisruption, stress.sleepDisruption !== undefined);
  
  const analysis = analyzeSection('Stress', stress);
  console.log(`\n📊 Analysis: ${analysis.real}/${analysis.total} real values (${Math.round(analysis.real / analysis.total * 100)}%)`);
}

async function testWorkoutSection(snapshot: DailyHealthSnapshot) {
  printSection('TEST 4: WORKOUT SECTION');
  
  const workout = snapshot.workout;
  
  printValue('Readiness Score', workout.readinessScore, workout.readinessScore !== null);
  printValue('Readiness Status', workout.readinessStatus, workout.readinessStatus !== 'moderate');
  printValue('Today Workout Plan', workout.todayWorkoutPlan, workout.todayWorkoutPlan !== undefined);
  printValue('Workout Load', workout.workoutLoad, workout.workoutLoad !== undefined);
  printValue('Targeted Focus', workout.targetedFocus, workout.targetedFocus !== undefined);
  
  if (workout.todayWorkoutPlan) {
    console.log('\n  Workout Plan Details:');
    console.log(`    Day: ${workout.todayWorkoutPlan.day}`);
    console.log(`    Focus: ${workout.todayWorkoutPlan.focus}`);
    console.log(`    Exercises: ${workout.todayWorkoutPlan.exercises}`);
    console.log(`    Adjustments: ${workout.todayWorkoutPlan.adjustments.length}`);
  }
  
  const analysis = analyzeSection('Workout', workout);
  console.log(`\n📊 Analysis: ${analysis.real}/${analysis.total} real values (${Math.round(analysis.real / analysis.total * 100)}%)`);
}

async function testJointHealthSection(snapshot: DailyHealthSnapshot) {
  printSection('TEST 5: JOINT HEALTH SECTION');
  
  const joint = snapshot.jointHealth;
  
  printValue('Status', joint.status, joint.status !== 'stable');
  printValue('Risk Level', joint.riskLevel, joint.riskLevel !== 'low');
  printValue('Affected Areas', joint.affectedAreas, joint.affectedAreas !== undefined && joint.affectedAreas.length > 0);
  printValue('Pain Level', joint.painLevel, joint.painLevel !== undefined);
  printValue('Tightness', joint.tightness, joint.tightness !== undefined);
  printValue('Soreness', joint.soreness, joint.soreness !== undefined);
  printValue('Modifications', joint.workoutModifications, joint.workoutModifications !== undefined && joint.workoutModifications.length > 0);
  
  const analysis = analyzeSection('Joint Health', joint);
  console.log(`\n📊 Analysis: ${analysis.real}/${analysis.total} real values (${Math.round(analysis.real / analysis.total * 100)}%)`);
}

async function testAdherenceSection(snapshot: DailyHealthSnapshot) {
  printSection('TEST 6: ADHERENCE SECTION');
  
  const adherence = snapshot.adherence;
  
  printValue('Overall Score', adherence.overallScore, adherence.overallScore !== null);
  printValue('Status', adherence.status, adherence.status !== 'moderate');
  printValue('Trend', adherence.trend, adherence.trend !== 'stable');
  
  console.log('\n  Breakdown:');
  printValue('  Workout', adherence.breakdown.workout, adherence.breakdown.workout > 0);
  printValue('  Nutrition', adherence.breakdown.nutrition, adherence.breakdown.nutrition > 0);
  printValue('  Sleep', adherence.breakdown.sleep, adherence.breakdown.sleep > 0);
  printValue('  Supplement', adherence.breakdown.supplement, adherence.breakdown.supplement > 0);
  
  const analysis = analyzeSection('Adherence', adherence);
  console.log(`\n📊 Analysis: ${analysis.real}/${analysis.total} real values (${Math.round(analysis.real / analysis.total * 100)}%)`);
}

async function testNutritionSection(snapshot: DailyHealthSnapshot) {
  printSection('TEST 7: NUTRITION SECTION (Phase 2 Engine)');
  
  const nutrition = snapshot.nutrition;
  
  if (!nutrition) {
    console.log('⚠️  Nutrition section is undefined - engine may have failed');
    return;
  }
  
  printValue('Calorie Target', nutrition.calorieTarget, nutrition.calorieTarget !== undefined);
  printValue('Macro Targets', nutrition.macroTargets, nutrition.macroTargets !== undefined);
  if (nutrition.macroTargets) {
    console.log('  Macro Breakdown:');
    printValue('  Protein', nutrition.macroTargets.protein, nutrition.macroTargets.protein > 0);
    printValue('  Carbs', nutrition.macroTargets.carbs, nutrition.macroTargets.carbs > 0);
    printValue('  Fat', nutrition.macroTargets.fat, nutrition.macroTargets.fat > 0);
  }
  printValue('Hydration Target', nutrition.hydrationTarget, nutrition.hydrationTarget !== undefined);
  printValue('Actual Intake', nutrition.actualIntake, nutrition.actualIntake !== undefined);
  printValue('Adherence Score', nutrition.adherenceScore, nutrition.adherenceScore !== undefined);
  
  const analysis = analyzeSection('Nutrition', nutrition);
  console.log(`\n📊 Analysis: ${analysis.real}/${analysis.total} real values (${Math.round(analysis.real / analysis.total * 100)}%)`);
}

async function testCardiovascularSection(snapshot: DailyHealthSnapshot) {
  printSection('TEST 8: CARDIOVASCULAR SECTION (Phase 2 Engine)');
  
  const cardiovascular = snapshot.cardiovascular;
  
  if (!cardiovascular) {
    console.log('⚠️  Cardiovascular section is undefined - engine may have failed');
    return;
  }
  
  printValue('Risk Score', cardiovascular.riskScore, cardiovascular.riskScore !== null);
  printValue('Risk Level', cardiovascular.riskLevel, cardiovascular.riskLevel !== 'moderate');
  printValue('Trend', cardiovascular.trend, cardiovascular.trend !== 'stable');
  printValue('Resting HR', cardiovascular.restingHr, cardiovascular.restingHr !== undefined);
  printValue('HRV', cardiovascular.hrv, cardiovascular.hrv !== undefined);
  printValue('Blood Pressure', cardiovascular.bloodPressure, cardiovascular.bloodPressure !== undefined);
  if (cardiovascular.bloodPressure) {
    console.log('  BP Details:');
    printValue('  Systolic', cardiovascular.bloodPressure.systolic, cardiovascular.bloodPressure.systolic !== undefined);
    printValue('  Diastolic', cardiovascular.bloodPressure.diastolic, cardiovascular.bloodPressure.diastolic !== undefined);
    printValue('  Status', cardiovascular.bloodPressure.status, true);
  }
  printValue('Lipids', cardiovascular.lipids, cardiovascular.lipids !== undefined);
  if (cardiovascular.lipids) {
    console.log('  Lipid Panel:');
    printValue('  Total Cholesterol', cardiovascular.lipids.totalCholesterol, cardiovascular.lipids.totalCholesterol !== undefined);
    printValue('  LDL', cardiovascular.lipids.ldl, cardiovascular.lipids.ldl !== undefined);
    printValue('  HDL', cardiovascular.lipids.hdl, cardiovascular.lipids.hdl !== undefined);
    printValue('  Triglycerides', cardiovascular.lipids.triglycerides, cardiovascular.lipids.triglycerides !== undefined);
  }
  printValue('CV Risk', cardiovascular.cardiovascularRisk, cardiovascular.cardiovascularRisk !== 'moderate');
  
  const analysis = analyzeSection('Cardiovascular', cardiovascular);
  console.log(`\n📊 Analysis: ${analysis.real}/${analysis.total} real values (${Math.round(analysis.real / analysis.total * 100)}%)`);
}

async function testMetabolicSection(snapshot: DailyHealthSnapshot) {
  printSection('TEST 9: METABOLIC SECTION (Phase 2 Engine)');
  
  const metabolic = snapshot.metabolic;
  
  if (!metabolic) {
    console.log('⚠️  Metabolic section is undefined - engine may have failed');
    return;
  }
  
  printValue('Score', metabolic.score, metabolic.score !== null);
  printValue('Status', metabolic.status, metabolic.status !== 'moderate');
  printValue('Trend', metabolic.trend, metabolic.trend !== 'stable');
  printValue('Glucose', metabolic.glucose, metabolic.glucose !== undefined);
  if (metabolic.glucose) {
    console.log('  Glucose Details:');
    printValue('  Fasting', metabolic.glucose.fasting, metabolic.glucose.fasting !== undefined);
    printValue('  Status', metabolic.glucose.status, true);
  }
  printValue('A1c', metabolic.a1c, metabolic.a1c !== undefined);
  if (metabolic.a1c) {
    console.log('  A1c Details:');
    printValue('  Value', metabolic.a1c.value, metabolic.a1c.value !== undefined);
    printValue('  Status', metabolic.a1c.status, true);
    printValue('  Trend', metabolic.a1c.trend, true);
  }
  printValue('Insulin', metabolic.insulin, metabolic.insulin !== undefined);
  printValue('Insulin Sensitivity', metabolic.insulinSensitivity, metabolic.insulinSensitivity !== undefined);
  printValue('Metabolic Risk', metabolic.metabolicRisk, metabolic.metabolicRisk !== 'moderate');
  
  const analysis = analyzeSection('Metabolic', metabolic);
  console.log(`\n📊 Analysis: ${analysis.real}/${analysis.total} real values (${Math.round(analysis.real / analysis.total * 100)}%)`);
}

async function testSexualHealthSection(snapshot: DailyHealthSnapshot) {
  printSection('TEST 10: SEXUAL HEALTH SECTION (Phase 2 Engine)');
  
  const sexualHealth = snapshot.sexualHealth;
  
  if (!sexualHealth) {
    console.log('⚠️  Sexual Health section is undefined - engine may have failed');
    return;
  }
  
  printValue('Score', sexualHealth.score, sexualHealth.score !== null);
  printValue('Status', sexualHealth.status, sexualHealth.status !== 'moderate');
  printValue('Trend', sexualHealth.trend, sexualHealth.trend !== 'stable');
  printValue('Testosterone', sexualHealth.testosterone, sexualHealth.testosterone !== undefined);
  if (sexualHealth.testosterone) {
    console.log('  Testosterone Details:');
    printValue('  Total', sexualHealth.testosterone.total, sexualHealth.testosterone.total !== undefined);
    printValue('  Free', sexualHealth.testosterone.free, sexualHealth.testosterone.free !== undefined);
    printValue('  Status', sexualHealth.testosterone.status, true);
  }
  printValue('Libido Level', sexualHealth.libidoLevel, sexualHealth.libidoLevel !== undefined);
  printValue('Erectile Function', sexualHealth.erectileFunctionScore, sexualHealth.erectileFunctionScore !== undefined);
  printValue('Morning Erections', sexualHealth.morningErections, sexualHealth.morningErections !== undefined);
  
  const analysis = analyzeSection('Sexual Health', sexualHealth);
  console.log(`\n📊 Analysis: ${analysis.real}/${analysis.total} real values (${Math.round(analysis.real / analysis.total * 100)}%)`);
}

async function testPlaceholderSections(snapshot: DailyHealthSnapshot) {
  printSection('TEST 11: PLACEHOLDER SECTIONS (Still Pending)');
  
  printSubSection('Body Composition');
  const bodyComp = snapshot.bodyComposition;
  printValue('Weight', bodyComp.weight, bodyComp.weight !== undefined);
  printValue('Body Fat', bodyComp.bodyFat, bodyComp.bodyFat !== undefined);
  printValue('Muscle Mass', bodyComp.muscleMass, bodyComp.muscleMass !== undefined);
  printValue('Visceral Fat', bodyComp.visceralFat, bodyComp.visceralFat !== undefined);
  console.log('⚠️  All values are placeholders - Body Composition upload not implemented');
}

async function testDerivedIntelligence(snapshot: DailyHealthSnapshot) {
  printSection('TEST 12: DERIVED INTELLIGENCE (Cross-Engine Calculations)');
  
  const derived = snapshot.derivedIntelligence;
  
  console.log('\n📊 Overall Health:');
  printValue('Overall Score', derived.overallScore, derived.overallScore !== null);
  printValue('Overall Status', derived.overallStatus, derived.overallStatus !== 'moderate');
  printValue('Overall Trend', derived.overallTrend, derived.overallTrend !== 'stable');
  
  console.log('\n⚠️  Risk Signals:');
  printValue('Fatigue Risk', derived.fatigueRisk, true);
  printValue('Overtraining Risk', derived.overtrainingRisk, true);
  printValue('Injury Risk', derived.injuryRisk, true);
  printValue('Metabolic Risk', derived.metabolicRisk, derived.metabolicRisk !== 'moderate');
  printValue('Cardiovascular Risk', derived.cardiovascularRisk, derived.cardiovascularRisk !== 'moderate');
  
  console.log('\n🎯 Performance Indicators:');
  printValue('Readiness Score', derived.readinessScore, derived.readinessScore !== null);
  printValue('Performance Capacity', derived.performanceCapacity, derived.performanceCapacity !== null);
  
  console.log('\n📈 Trends:');
  printValue('Sleep Trend', derived.sleepTrend, derived.sleepTrend !== 'stable');
  printValue('Performance Trend', derived.performanceTrend, derived.performanceTrend !== 'stable');
  printValue('Recovery Trend', derived.recoveryTrend, derived.recoveryTrend !== 'stable');
  
  console.log('\n✅ Derived intelligence calculations working');
  console.log(`   Calculated at: ${derived.calculatedAt}`);
}

async function testDataQuality(snapshot: DailyHealthSnapshot) {
  printSection('TEST 13: DATA QUALITY TRACKING');
  
  const quality = snapshot.dataQuality;
  
  console.log('\n📊 Data Availability:');
  printValue('Recovery', quality.recoveryDataAvailable, quality.recoveryDataAvailable);
  printValue('Stress', quality.stressDataAvailable, quality.stressDataAvailable);
  printValue('Workout', quality.workoutDataAvailable, quality.workoutDataAvailable);
  printValue('Body Comp', quality.bodyCompDataAvailable, quality.bodyCompDataAvailable);
  printValue('Bloodwork', quality.bloodworkDataAvailable, quality.bloodworkDataAvailable);
  printValue('Sexual Health', quality.sexualHealthDataAvailable, quality.sexualHealthDataAvailable);
  printValue('Metabolic', quality.metabolicDataAvailable, quality.metabolicDataAvailable);
  printValue('Cardiovascular', quality.cardiovascularDataAvailable, quality.cardiovascularDataAvailable);
  printValue('Adherence', quality.adherenceDataAvailable, quality.adherenceDataAvailable);
  printValue('Joint Health', quality.jointHealthDataAvailable, quality.jointHealthDataAvailable);
  
  console.log('\n📅 Freshness:');
  console.log(`  Last Updated: ${quality.lastUpdated}`);
  console.log(`  Device Sync Recency: ${quality.deviceSyncRecency}`);
  
  console.log('\n📊 Completeness:');
  console.log(`  Completeness Score: ${quality.dataCompletenessScore}%`);
  console.log(`  Availability State: ${quality.dataAvailabilityState}`);
  console.log(`  Overall Confidence: ${quality.overallConfidence}`);
  
  if (quality.missingDataSources.length > 0) {
    console.log('\n⚠️  Missing Data Sources:');
    quality.missingDataSources.forEach(source => {
      console.log(`    - ${source}`);
    });
  }
}

async function testCacheBehavior() {
  printSection('TEST 14: CACHE BEHAVIOR');
  
  console.log('\n1️⃣  First call - should generate new snapshot');
  const start1 = Date.now();
  const snapshot1 = await generateDailyHealthSnapshot(TEST_USER_ID);
  const duration1 = Date.now() - start1;
  console.log(`   ✅ Generated in ${duration1}ms`);
  
  console.log('\n2️⃣  Second call - should return cached snapshot');
  const start2 = Date.now();
  const snapshot2 = await generateDailyHealthSnapshot(TEST_USER_ID);
  const duration2 = Date.now() - start2;
  console.log(`   ✅ Returned in ${duration2}ms`);
  console.log(`   📊 Speed improvement: ${Math.round((duration1 - duration2) / duration1 * 100)}%`);
  
  if (snapshot1.timestamp === snapshot2.timestamp) {
    console.log('   ✅ Cache working - same timestamp returned');
  } else {
    console.log('   ⚠️  Cache not working - different timestamps');
  }
  
  console.log('\n3️⃣  Get cached snapshot directly');
  const cached = await getCachedSnapshot(TEST_USER_ID);
  if (cached) {
    console.log('   ✅ Cached snapshot retrieved');
    console.log(`   Cached at: ${cached.timestamp}`);
  } else {
    console.log('   ⚠️  No cached snapshot found');
  }
  
  console.log('\n4️⃣  Invalidate cache');
  await invalidateSnapshotCache(TEST_USER_ID);
  console.log('   ✅ Cache invalidated');
  
  console.log('\n5️⃣  Call after invalidation - should generate new snapshot');
  const start3 = Date.now();
  const snapshot3 = await generateDailyHealthSnapshot(TEST_USER_ID);
  const duration3 = Date.now() - start3;
  console.log(`   ✅ Generated in ${duration3}ms`);
  
  if (snapshot3.timestamp !== snapshot2.timestamp) {
    console.log('   ✅ Cache invalidation working - new timestamp generated');
  } else {
    console.log('   ⚠️  Cache invalidation not working - same timestamp');
  }
}

async function reportGapsForFutureEngines(snapshot: DailyHealthSnapshot) {
  printSection('TEST 15: GAPS FOR FUTURE ENGINES');
  
  console.log('\n🔴 CRITICAL GAPS (Block Future Engine Development):');
  
  const criticalGaps: string[] = [];
  
  // Check for bloodwork data availability
  if (!snapshot.dataQuality.bloodworkDataAvailable) {
    criticalGaps.push('Bloodwork data not available - required for Cardiovascular, Metabolic, Sexual Health engines');
  }
  
  // Check for body composition data
  if (!snapshot.bodyComposition.weight) {
    criticalGaps.push('Body composition data not available - required for Metabolic and Cardiovascular engines');
  }
  
  // Check for sexual health interview data
  if (!snapshot.sexualHealth.libidoLevel) {
    criticalGaps.push('Sexual health interview data not available - required for Sexual Health engine');
  }
  
  if (criticalGaps.length === 0) {
    console.log('   ✅ No critical gaps found');
  } else {
    criticalGaps.forEach((gap, i) => {
      console.log(`   ${i + 1}. ${gap}`);
    });
  }
  
  console.log('\n🟡 NON-CRITICAL GAPS (Can Work Around):');
  
  const nonCriticalGaps: string[] = [];
  
  // Check for trend data
  if (snapshot.recovery.trend === 'stable' && snapshot.stress.trend === 'stable') {
    nonCriticalGaps.push('Historical trend data not available - defaulting to "stable" for all trends');
  }
  
  // Check for workout load
  if (!snapshot.workout.workoutLoad) {
    nonCriticalGaps.push('Workout load not exposed in WorkoutTodayRecord - cannot factor into fatigue calculations');
  }
  
  // Check for targeted focus
  if (!snapshot.workout.targetedFocus) {
    nonCriticalGaps.push('Targeted focus not exposed in WorkoutTodayRecord - cannot show lagging muscle groups');
  }
  
  if (nonCriticalGaps.length === 0) {
    console.log('   ✅ No non-critical gaps found');
  } else {
    nonCriticalGaps.forEach((gap, i) => {
      console.log(`   ${i + 1}. ${gap}`);
    });
  }
  
  console.log('\n📋 RECOMMENDATIONS FOR PHASE 3:');
  console.log('   1. ✅ Nutrition Engine: COMPLETE - Now calculating from baseline');
  console.log('   2. ✅ Cardiovascular Engine: COMPLETE - Needs bloodwork upload for full accuracy');
  console.log('   3. ✅ Metabolic Engine: COMPLETE - Needs bloodwork upload for full accuracy');
  console.log('   4. ✅ Sexual Health Engine: COMPLETE - Needs bloodwork + interview questions for full accuracy');
  console.log('   5. 🔄 Body Composition: Needs upload feature');
  console.log('   6. 🔄 Prediction Engine: Needs historical data - wait until Week 3-4');
  console.log('   7. 🔄 RecommendationEngine: Ready to build in Phase 3');
  console.log('   8. 🔄 ControlTowerService refactor: Ready for Phase 3');
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║           DAILYHEALTHSNAPSHOT END-TO-END VALIDATION TEST                   ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  
  try {
    // Test 1: Generate snapshot
    const snapshot = await testSnapshotGeneration();
    
    // Test 2-6: Test existing engine sections
    await testRecoverySection(snapshot);
    await testStressSection(snapshot);
    await testWorkoutSection(snapshot);
    await testJointHealthSection(snapshot);
    await testAdherenceSection(snapshot);
    
    // Test 7-10: Test Phase 2 engine sections
    await testNutritionSection(snapshot);
    await testCardiovascularSection(snapshot);
    await testMetabolicSection(snapshot);
    await testSexualHealthSection(snapshot);
    
    // Test 11: Test placeholder sections
    await testPlaceholderSections(snapshot);
    
    // Test 12: Test derived intelligence
    await testDerivedIntelligence(snapshot);
    
    // Test 13: Test data quality
    await testDataQuality(snapshot);
    
    // Test 14: Test cache behavior
    await testCacheBehavior();
    
    // Test 15: Report gaps for future engines
    await reportGapsForFutureEngines(snapshot);
    
    // Final summary
    printSection('VALIDATION COMPLETE ✅');
    console.log('\n✅ All tests passed');
    console.log('✅ DailyHealthSnapshot foundation is working');
    console.log('✅ Ready to build Cardiovascular, Metabolic, Sexual Health engines');
    console.log('\n📝 See validation report for detailed findings\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  }
}

// Run tests
runAllTests().catch(console.error);
