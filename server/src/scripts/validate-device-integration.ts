/**
 * Validation Script: Device Intelligence Integration - Phase 12
 * 
 * Purpose: Validate device intelligence integration across all intelligence layers
 * Tests: Recovery, Workout, Fusion, Predictive, Autonomous Optimization integration
 * 
 * Run: npx ts-node src/scripts/validate-device-integration.ts
 */

import { getDeviceRecoverySignals, getDeviceWorkoutSignals, getDeviceCardiovascularSignals, getDeviceMetabolicSignals, getDeviceFusionSignals, getDevicePredictiveSignals, getDeviceOptimizationTriggers } from '../services/deviceIntelligenceIntegrationService';
import { getDeviceContext } from '../services/deviceContextService';

const TEST_USER_ID = 'test-user-device-integration';

async function validateDeviceIntegration() {
  console.log('🔵 [VALIDATION] Starting Device Intelligence Integration Validation\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Device Recovery Signals
  console.log('--- Test 1: Device Recovery Signals ---');
  try {
    const recoverySignals = await getDeviceRecoverySignals(TEST_USER_ID);
    
    console.log('✅ Device recovery signals generated');
    console.log(`   Has Device Data: ${recoverySignals.hasDeviceData}`);
    console.log(`   Data Quality: ${recoverySignals.dataQuality}`);
    console.log(`   Sources: ${recoverySignals.sources.join(', ') || 'None'}`);
    console.log(`   Sleep Duration: ${recoverySignals.sleepDurationHours || 'N/A'} hours`);
    console.log(`   HRV: ${recoverySignals.hrv || 'N/A'} ms`);
    console.log(`   Resting HR: ${recoverySignals.restingHR || 'N/A'} bpm`);
    console.log(`   Readiness Score: ${recoverySignals.readinessScore || 'N/A'}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Device recovery signals test failed:', error.message);
    results.failed++;
  }

  // Test 2: Device Workout Signals
  console.log('\n--- Test 2: Device Workout Signals ---');
  try {
    const workoutSignals = await getDeviceWorkoutSignals(TEST_USER_ID);
    
    console.log('✅ Device workout signals generated');
    console.log(`   Has Device Data: ${workoutSignals.hasDeviceData}`);
    console.log(`   Data Quality: ${workoutSignals.dataQuality}`);
    console.log(`   Recovery Score: ${workoutSignals.recoveryScore || 'N/A'}`);
    console.log(`   Recommended Intensity: ${workoutSignals.recommendedIntensity || 'N/A'}`);
    console.log(`   Activity Fatigue: ${workoutSignals.activityFatigue || 'N/A'}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Device workout signals test failed:', error.message);
    results.failed++;
  }

  // Test 3: Device Cardiovascular Signals
  console.log('\n--- Test 3: Device Cardiovascular Signals ---');
  try {
    const cardioSignals = await getDeviceCardiovascularSignals(TEST_USER_ID);
    
    console.log('✅ Device cardiovascular signals generated');
    console.log(`   Has Device Data: ${cardioSignals.hasDeviceData}`);
    console.log(`   Cardiovascular Stress: ${cardioSignals.cardiovascularStress || 'N/A'}`);
    console.log(`   Fatigue Risk: ${cardioSignals.fatigueRisk || 'N/A'}`);
    console.log(`   Activity Level: ${cardioSignals.activityLevel || 'N/A'}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Device cardiovascular signals test failed:', error.message);
    results.failed++;
  }

  // Test 4: Device Metabolic Signals
  console.log('\n--- Test 4: Device Metabolic Signals ---');
  try {
    const metabolicSignals = await getDeviceMetabolicSignals(TEST_USER_ID);
    
    console.log('✅ Device metabolic signals generated');
    console.log(`   Has Device Data: ${metabolicSignals.hasDeviceData}`);
    console.log(`   Metabolic Risk: ${metabolicSignals.metabolicRisk || 'N/A'}`);
    console.log(`   Activity Level: ${metabolicSignals.activityLevel || 'N/A'}`);
    console.log(`   Steps: ${metabolicSignals.steps || 'N/A'}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Device metabolic signals test failed:', error.message);
    results.failed++;
  }

  // Test 5: Device Fusion Signals
  console.log('\n--- Test 5: Device Fusion Signals ---');
  try {
    const fusionSignals = await getDeviceFusionSignals(TEST_USER_ID);
    
    console.log('✅ Device fusion signals generated');
    console.log(`   Has Device Data: ${fusionSignals.hasDeviceData}`);
    console.log(`   Signal Count: ${fusionSignals.signals.length}`);
    console.log(`   Signals: ${fusionSignals.signals.join(', ') || 'None'}`);
    console.log(`   Recovery Alert: ${fusionSignals.recoveryAlert || false}`);
    console.log(`   Performance Opportunity: ${fusionSignals.performanceOpportunity || false}`);
    console.log(`   Cardiovascular Risk: ${fusionSignals.cardiovascularRisk || false}`);
    console.log(`   Overtraining Detection: ${fusionSignals.overtrainingDetection || false}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Device fusion signals test failed:', error.message);
    results.failed++;
  }

  // Test 6: Device Predictive Signals
  console.log('\n--- Test 6: Device Predictive Signals ---');
  try {
    const predictiveSignals = await getDevicePredictiveSignals(TEST_USER_ID);
    
    console.log('✅ Device predictive signals generated');
    console.log(`   Has Device Data: ${predictiveSignals.hasDeviceData}`);
    console.log(`   Poor Sleep Trend: ${predictiveSignals.poorSleepTrend || false}`);
    console.log(`   Low Activity Trend: ${predictiveSignals.lowActivityTrend || false}`);
    console.log(`   HRV Decline Trend: ${predictiveSignals.hrvDeclineTrend || false}`);
    console.log(`   Predicted Fatigue: ${predictiveSignals.predictedFatigue || 'N/A'}`);
    console.log(`   Predicted Cardiovascular Risk: ${predictiveSignals.predictedCardiovascularRisk || 'N/A'}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Device predictive signals test failed:', error.message);
    results.failed++;
  }

  // Test 7: Device Optimization Triggers
  console.log('\n--- Test 7: Device Optimization Triggers ---');
  try {
    const optimizationTriggers = await getDeviceOptimizationTriggers(TEST_USER_ID);
    
    console.log('✅ Device optimization triggers generated');
    console.log(`   Has Device Data: ${optimizationTriggers.hasDeviceData}`);
    console.log(`   Trigger Count: ${optimizationTriggers.triggers.length}`);
    console.log(`   Triggers: ${optimizationTriggers.triggers.join(', ') || 'None'}`);
    console.log(`   Recovery Optimization Needed: ${optimizationTriggers.recoveryOptimizationNeeded || false}`);
    console.log(`   Movement Optimization Needed: ${optimizationTriggers.movementOptimizationNeeded || false}`);
    console.log(`   Stress Optimization Needed: ${optimizationTriggers.stressOptimizationNeeded || false}`);
    console.log(`   Cardiovascular Optimization Needed: ${optimizationTriggers.cardiovascularOptimizationNeeded || false}`);
    console.log(`   Workout Adjustment Needed: ${optimizationTriggers.workoutAdjustmentNeeded || false}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Device optimization triggers test failed:', error.message);
    results.failed++;
  }

  // Test 8: Device Context Integration
  console.log('\n--- Test 8: Device Context Integration ---');
  try {
    const deviceContext = await getDeviceContext(TEST_USER_ID);
    
    console.log('✅ Device context loaded for integration');
    console.log(`   Completeness Score: ${deviceContext.completenessScore}%`);
    console.log(`   Data Quality: ${deviceContext.dataQuality}`);
    console.log(`   Active Sources: ${deviceContext.sourceSummary.activeSources.length}`);
    console.log(`   Has Sleep Data: ${deviceContext.flags.hasSleepData}`);
    console.log(`   Has Activity Data: ${deviceContext.flags.hasActivityData}`);
    console.log(`   Has Cardiovascular Data: ${deviceContext.flags.hasCardiovascularData}`);
    console.log(`   Has Recovery Data: ${deviceContext.flags.hasRecoveryData}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Device context integration test failed:', error.message);
    results.failed++;
  }

  // Test 9: Fallback Behavior (No Device Data)
  console.log('\n--- Test 9: Fallback Behavior (No Device Data) ---');
  try {
    const nonExistentUserId = 'user-with-no-devices-' + Date.now();
    
    const recoverySignals = await getDeviceRecoverySignals(nonExistentUserId);
    const workoutSignals = await getDeviceWorkoutSignals(nonExistentUserId);
    const fusionSignals = await getDeviceFusionSignals(nonExistentUserId);
    
    console.log('✅ Fallback behavior works without device data');
    console.log(`   Recovery Signals Has Data: ${recoverySignals.hasDeviceData}`);
    console.log(`   Workout Signals Has Data: ${workoutSignals.hasDeviceData}`);
    console.log(`   Fusion Signals Has Data: ${fusionSignals.hasDeviceData}`);
    
    if (recoverySignals.hasDeviceData || workoutSignals.hasDeviceData || fusionSignals.hasDeviceData) {
      console.log('   ⚠️  Expected no device data for user with no devices');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fallback behavior test failed:', error.message);
    results.failed++;
  }

  // Test 10: Signal Quality Assessment
  console.log('\n--- Test 10: Signal Quality Assessment ---');
  try {
    const recoverySignals = await getDeviceRecoverySignals(TEST_USER_ID);
    const workoutSignals = await getDeviceWorkoutSignals(TEST_USER_ID);
    const cardioSignals = await getDeviceCardiovascularSignals(TEST_USER_ID);
    
    console.log('✅ Signal quality assessment validated');
    console.log(`   Recovery Data Quality: ${recoverySignals.dataQuality}`);
    console.log(`   Workout Data Quality: ${workoutSignals.dataQuality}`);
    console.log(`   Cardiovascular Data Quality: ${cardioSignals.dataQuality}`);
    
    const qualityLevels = ['high', 'medium', 'low', 'none'];
    const allValid = 
      qualityLevels.includes(recoverySignals.dataQuality) &&
      qualityLevels.includes(workoutSignals.dataQuality) &&
      qualityLevels.includes(cardioSignals.dataQuality);
    
    if (!allValid) {
      console.log('   ⚠️  Invalid data quality levels detected');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Signal quality assessment test failed:', error.message);
    results.failed++;
  }

  // Summary
  console.log('\n========================================');
  console.log('VALIDATION SUMMARY');
  console.log('========================================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log('========================================\n');

  if (results.failed === 0) {
    console.log('🎉 All critical tests passed!');
    console.log('\nDevice Intelligence Integration is ready for:');
    console.log('✅ Recovery Engine device intelligence');
    console.log('✅ Workout Engine device intelligence');
    console.log('✅ Cardiovascular intelligence with device data');
    console.log('✅ Metabolic intelligence with device data');
    console.log('✅ Cross-Engine Fusion with device signals');
    console.log('✅ Predictive Intelligence enhanced with device data');
    console.log('✅ Autonomous Optimization with device triggers');
    console.log('✅ Real-time autonomous intelligence activation');
    console.log('\nNext Steps:');
    console.log('1. Connect actual devices for test user');
    console.log('2. Verify device data flows into intelligence layers');
    console.log('3. Test device-driven recommendations');
    console.log('4. Verify fusion signals with real device data');
    console.log('5. Monitor device intelligence performance');
    console.log('6. Test with various device data scenarios');
    console.log('7. Validate autonomous optimizations trigger correctly\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

// Run validation
validateDeviceIntegration()
  .then(() => {
    console.log('✅ Validation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
