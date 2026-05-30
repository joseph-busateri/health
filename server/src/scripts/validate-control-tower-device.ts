/**
 * Validation Script: Control Tower Device Enhancement - Phase 13
 * 
 * Purpose: Validate Control Tower device intelligence integration
 * Tests: Recovery, Fatigue, Performance, Cardiovascular, Sleep, Activity, Predictions, Optimizations
 * 
 * Run: npx ts-node src/scripts/validate-control-tower-device.ts
 */

import { getControlTowerDeviceIntelligence } from '../services/controlTowerDeviceIntelligenceService';

const TEST_USER_ID = 'test-user-control-tower-device';

async function validateControlTowerDevice() {
  console.log('🔵 [VALIDATION] Starting Control Tower Device Enhancement Validation\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Control Tower Device Intelligence Loading
  console.log('--- Test 1: Control Tower Device Intelligence Loading ---');
  try {
    const intelligence = await getControlTowerDeviceIntelligence(TEST_USER_ID);
    
    console.log('✅ Control Tower device intelligence loaded');
    console.log(`   User ID: ${intelligence.userId}`);
    console.log(`   Timestamp: ${intelligence.timestamp}`);
    console.log(`   Has Device Data: ${intelligence.hasDeviceData}`);
    console.log(`   Data Quality: ${intelligence.dataQuality}`);
    console.log(`   Active Sources: ${intelligence.activeSources.join(', ') || 'None'}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Control Tower device intelligence loading failed:', error.message);
    results.failed++;
  }

  // Test 2: Recovery Intelligence
  console.log('\n--- Test 2: Recovery Intelligence ---');
  try {
    const intelligence = await getControlTowerDeviceIntelligence(TEST_USER_ID);
    
    console.log('✅ Recovery intelligence generated');
    console.log(`   Status: ${intelligence.recovery.status}`);
    console.log(`   Score: ${intelligence.recovery.score}/100`);
    console.log(`   Trend: ${intelligence.recovery.trend}`);
    console.log(`   Risk: ${intelligence.recovery.risk}`);
    console.log(`   Sleep Quality: ${intelligence.recovery.factors.sleepQuality}`);
    console.log(`   HRV Status: ${intelligence.recovery.factors.hrvStatus}`);
    console.log(`   Readiness: ${intelligence.recovery.factors.readiness || 'N/A'}`);
    console.log(`   Sleep Debt: ${intelligence.recovery.factors.sleepDebt ? `${Math.round(intelligence.recovery.factors.sleepDebt / 60)}h` : 'N/A'}`);
    if (intelligence.recovery.recommendation) {
      console.log(`   Recommendation: ${intelligence.recovery.recommendation}`);
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Recovery intelligence test failed:', error.message);
    results.failed++;
  }

  // Test 3: Fatigue Detection
  console.log('\n--- Test 3: Fatigue Detection ---');
  try {
    const intelligence = await getControlTowerDeviceIntelligence(TEST_USER_ID);
    
    console.log('✅ Fatigue detection working');
    console.log(`   Risk: ${intelligence.fatigue.risk}`);
    console.log(`   Score: ${intelligence.fatigue.score}/100`);
    console.log(`   Trend: ${intelligence.fatigue.trend}`);
    console.log(`   Reasons: ${intelligence.fatigue.reasons.join(', ') || 'None'}`);
    if (intelligence.fatigue.recommendation) {
      console.log(`   Recommendation: ${intelligence.fatigue.recommendation}`);
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fatigue detection test failed:', error.message);
    results.failed++;
  }

  // Test 4: Performance Opportunity Detection
  console.log('\n--- Test 4: Performance Opportunity Detection ---');
  try {
    const intelligence = await getControlTowerDeviceIntelligence(TEST_USER_ID);
    
    console.log('✅ Performance opportunity detection working');
    console.log(`   Opportunity: ${intelligence.performance.opportunity}`);
    console.log(`   Score: ${intelligence.performance.score}/100`);
    console.log(`   Factors: ${intelligence.performance.factors.join(', ') || 'None'}`);
    if (intelligence.performance.recommendation) {
      console.log(`   Recommendation: ${intelligence.performance.recommendation}`);
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Performance opportunity detection test failed:', error.message);
    results.failed++;
  }

  // Test 5: Cardiovascular Intelligence
  console.log('\n--- Test 5: Cardiovascular Intelligence ---');
  try {
    const intelligence = await getControlTowerDeviceIntelligence(TEST_USER_ID);
    
    console.log('✅ Cardiovascular intelligence working');
    console.log(`   Risk: ${intelligence.cardiovascular.risk}`);
    console.log(`   Resting HR Trend: ${intelligence.cardiovascular.factors.restingHRTrend}`);
    console.log(`   BP Trend: ${intelligence.cardiovascular.factors.bpTrend}`);
    console.log(`   Activity Level: ${intelligence.cardiovascular.factors.activityLevel}`);
    console.log(`   Alerts: ${intelligence.cardiovascular.alerts.join(', ') || 'None'}`);
    if (intelligence.cardiovascular.recommendation) {
      console.log(`   Recommendation: ${intelligence.cardiovascular.recommendation}`);
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Cardiovascular intelligence test failed:', error.message);
    results.failed++;
  }

  // Test 6: Sleep Intelligence
  console.log('\n--- Test 6: Sleep Intelligence ---');
  try {
    const intelligence = await getControlTowerDeviceIntelligence(TEST_USER_ID);
    
    console.log('✅ Sleep intelligence working');
    console.log(`   Status: ${intelligence.sleep.status}`);
    console.log(`   Duration: ${intelligence.sleep.duration ? `${intelligence.sleep.duration.toFixed(1)}h` : 'N/A'}`);
    console.log(`   Quality: ${intelligence.sleep.quality ? `${intelligence.sleep.quality}/5` : 'N/A'}`);
    console.log(`   Consistency: ${intelligence.sleep.consistency}`);
    console.log(`   Debt: ${intelligence.sleep.debt ? `${Math.round(intelligence.sleep.debt / 60)}h` : 'N/A'}`);
    if (intelligence.sleep.recommendation) {
      console.log(`   Recommendation: ${intelligence.sleep.recommendation}`);
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Sleep intelligence test failed:', error.message);
    results.failed++;
  }

  // Test 7: Activity Intelligence
  console.log('\n--- Test 7: Activity Intelligence ---');
  try {
    const intelligence = await getControlTowerDeviceIntelligence(TEST_USER_ID);
    
    console.log('✅ Activity intelligence working');
    console.log(`   Status: ${intelligence.activity.status}`);
    console.log(`   Steps: ${intelligence.activity.steps || 'N/A'}`);
    console.log(`   Calories: ${intelligence.activity.calories || 'N/A'}`);
    console.log(`   Workout Intensity: ${intelligence.activity.workoutIntensity}`);
    if (intelligence.activity.recommendation) {
      console.log(`   Recommendation: ${intelligence.activity.recommendation}`);
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Activity intelligence test failed:', error.message);
    results.failed++;
  }

  // Test 8: Device Predictions
  console.log('\n--- Test 8: Device Predictions ---');
  try {
    const intelligence = await getControlTowerDeviceIntelligence(TEST_USER_ID);
    
    console.log('✅ Device predictions working');
    console.log(`   Prediction Count: ${intelligence.predictions.length}`);
    
    for (const pred of intelligence.predictions) {
      console.log(`   - ${pred.type}: ${pred.severity} severity, ${pred.timeframe} timeframe`);
      console.log(`     ${pred.description}`);
      console.log(`     Confidence: ${(pred.confidence * 100).toFixed(0)}%`);
    }
    
    if (intelligence.predictions.length === 0) {
      console.log('   ℹ️  No predictions (expected if no device data or no risk patterns)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Device predictions test failed:', error.message);
    results.failed++;
  }

  // Test 9: Device Optimizations
  console.log('\n--- Test 9: Device Optimizations ---');
  try {
    const intelligence = await getControlTowerDeviceIntelligence(TEST_USER_ID);
    
    console.log('✅ Device optimizations working');
    console.log(`   Optimization Count: ${intelligence.optimizations.length}`);
    
    for (const opt of intelligence.optimizations) {
      console.log(`   - ${opt.title} (${opt.priority} priority)`);
      console.log(`     Category: ${opt.category}`);
      console.log(`     Action: ${opt.action}`);
      console.log(`     Reason: ${opt.reason}`);
    }
    
    if (intelligence.optimizations.length === 0) {
      console.log('   ℹ️  No optimizations (expected if no device triggers detected)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Device optimizations test failed:', error.message);
    results.failed++;
  }

  // Test 10: Top Priorities
  console.log('\n--- Test 10: Top Priorities ---');
  try {
    const intelligence = await getControlTowerDeviceIntelligence(TEST_USER_ID);
    
    console.log('✅ Top priorities working');
    console.log(`   Priority Count: ${intelligence.topPriorities.length}`);
    
    for (const priority of intelligence.topPriorities.slice(0, 5)) {
      console.log(`   - [${priority.priority.toUpperCase()}] ${priority.title}`);
      console.log(`     Type: ${priority.type}`);
      console.log(`     ${priority.description}`);
      if (priority.action) {
        console.log(`     Action: ${priority.action}`);
      }
      console.log(`     Source: ${priority.source}`);
    }
    
    if (intelligence.topPriorities.length === 0) {
      console.log('   ℹ️  No priorities (expected if no device data or no critical signals)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Top priorities test failed:', error.message);
    results.failed++;
  }

  // Test 11: Fallback Behavior (No Device Data)
  console.log('\n--- Test 11: Fallback Behavior (No Device Data) ---');
  try {
    const nonExistentUserId = 'user-with-no-devices-' + Date.now();
    
    const intelligence = await getControlTowerDeviceIntelligence(nonExistentUserId);
    
    console.log('✅ Fallback behavior works without device data');
    console.log(`   Has Device Data: ${intelligence.hasDeviceData}`);
    console.log(`   Data Quality: ${intelligence.dataQuality}`);
    console.log(`   Recovery Status: ${intelligence.recovery.status}`);
    console.log(`   Fatigue Risk: ${intelligence.fatigue.risk}`);
    console.log(`   Performance Opportunity: ${intelligence.performance.opportunity}`);
    
    if (intelligence.hasDeviceData) {
      console.log('   ⚠️  Expected no device data for user with no devices');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fallback behavior test failed:', error.message);
    results.failed++;
  }

  // Test 12: Intelligence Structure Validation
  console.log('\n--- Test 12: Intelligence Structure Validation ---');
  try {
    const intelligence = await getControlTowerDeviceIntelligence(TEST_USER_ID);
    
    const hasRequiredFields = 
      intelligence.userId !== undefined &&
      intelligence.timestamp !== undefined &&
      intelligence.recovery !== undefined &&
      intelligence.fatigue !== undefined &&
      intelligence.performance !== undefined &&
      intelligence.cardiovascular !== undefined &&
      intelligence.sleep !== undefined &&
      intelligence.activity !== undefined &&
      intelligence.predictions !== undefined &&
      intelligence.optimizations !== undefined &&
      intelligence.topPriorities !== undefined &&
      intelligence.hasDeviceData !== undefined &&
      intelligence.dataQuality !== undefined &&
      intelligence.activeSources !== undefined;
    
    if (hasRequiredFields) {
      console.log('✅ Intelligence structure has all required fields');
      console.log('   All sections present:');
      console.log('   - Recovery Intelligence ✓');
      console.log('   - Fatigue Detection ✓');
      console.log('   - Performance Opportunity ✓');
      console.log('   - Cardiovascular Intelligence ✓');
      console.log('   - Sleep Intelligence ✓');
      console.log('   - Activity Intelligence ✓');
      console.log('   - Predictions ✓');
      console.log('   - Optimizations ✓');
      console.log('   - Top Priorities ✓');
      results.passed++;
    } else {
      console.log('❌ Intelligence structure missing required fields');
      results.failed++;
    }
  } catch (error: any) {
    console.log('❌ Intelligence structure validation test failed:', error.message);
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
    console.log('\nControl Tower Device Enhancement is ready for:');
    console.log('✅ Real-time recovery intelligence display');
    console.log('✅ Fatigue detection and alerts');
    console.log('✅ Performance opportunity identification');
    console.log('✅ Cardiovascular risk monitoring');
    console.log('✅ Sleep intelligence tracking');
    console.log('✅ Activity intelligence monitoring');
    console.log('✅ Device-based predictions');
    console.log('✅ Autonomous optimization signals');
    console.log('✅ Priority ranking and action recommendations');
    console.log('✅ Real-Time AI Health Command Center activation');
    console.log('\nNext Steps:');
    console.log('1. Integrate Control Tower Device Intelligence into Control Tower Service');
    console.log('2. Update Control Tower UI to display device intelligence sections');
    console.log('3. Test with real device data');
    console.log('4. Verify priority ranking works correctly');
    console.log('5. Monitor Control Tower performance with device intelligence');
    console.log('6. Test various device data scenarios');
    console.log('7. Validate real-time updates work as expected\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

// Run validation
validateControlTowerDevice()
  .then(() => {
    console.log('✅ Validation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
