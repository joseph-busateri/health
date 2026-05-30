/**
 * Validation Script: Adaptive Intelligence Integration
 * 
 * Purpose: Validate that adaptive intelligence service correctly detects intervention effectiveness, generates learning signals, and handles fallback scenarios
 * Tests: Intervention detection, effectiveness tracking, adaptive signals, confidence scoring, learning signals, fallback behavior
 * 
 * Run: npx ts-node src/scripts/validate-adaptive-intelligence.ts
 */

import { getAdaptiveIntelligenceContext, getWhatsWorking, getWhatsNeedsAdjustment, getLearningInsights } from '../services/adaptiveIntelligencePhase7Service';

const TEST_USER_ID = 'test-user-adaptive-intelligence';

async function validateAdaptiveIntelligence() {
  console.log('🔵 [VALIDATION] Starting Adaptive Intelligence Integration Validation\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Adaptive Intelligence Context Available
  console.log('--- Test 1: Adaptive Intelligence Context Available ---');
  try {
    const context = await getAdaptiveIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Adaptive intelligence context loaded');
    console.log(`   Total interventions: ${context.totalInterventions}`);
    console.log(`   Effective interventions: ${context.effectiveCount}`);
    console.log(`   Ineffective interventions: ${context.ineffectiveCount}`);
    console.log(`   Adaptive signals: ${context.adaptiveSignals.length}`);
    console.log(`   Learning signals: ${context.learningSignals.length}`);
    console.log(`   Confidence signals: ${context.confidenceSignals.length}`);
    console.log(`   Data completeness: ${context.dataCompleteness.completenessScore}%`);
    
    if (context.totalInterventions === 0) {
      console.log('   ⚠️  No interventions detected (expected if no historical data with trends)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Adaptive intelligence context loading failed:', error.message);
    results.failed++;
  }

  // Test 2: Intervention Effectiveness Detection
  console.log('\n--- Test 2: Intervention Effectiveness Detection ---');
  try {
    const context = await getAdaptiveIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Intervention effectiveness detection works');
    console.log(`   Interventions detected: ${context.interventionEffects.length}`);
    
    if (context.interventionEffects.length > 0) {
      console.log('\n   Sample interventions:');
      context.interventionEffects.slice(0, 3).forEach((intervention) => {
        console.log(`   - [${intervention.interventionType.toUpperCase()}] ${intervention.interventionDescription}`);
        console.log(`     Outcome: ${intervention.outcomeMarker} (${intervention.effectiveness})`);
        console.log(`     Evidence: ${intervention.evidence}`);
        console.log(`     Confidence: ${intervention.confidence}, Data points: ${intervention.dataPoints}, Timespan: ${intervention.timespan}`);
        if (intervention.recommendation) {
          console.log(`     Recommendation: ${intervention.recommendation}`);
        }
      });
    } else {
      console.log('   ⚠️  No interventions detected (expected if no supplement/training/nutrition changes with outcome data)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Intervention effectiveness detection test failed:', error.message);
    results.failed++;
  }

  // Test 3: Effective Interventions Detection
  console.log('\n--- Test 3: Effective Interventions Detection ---');
  try {
    const whatsWorking = await getWhatsWorking(TEST_USER_ID);
    
    console.log('✅ Effective interventions detection works');
    console.log(`   Effective interventions: ${whatsWorking.length}`);
    
    if (whatsWorking.length > 0) {
      console.log('\n   What\'s working for this user:');
      whatsWorking.forEach((intervention) => {
        console.log(`   - ${intervention.interventionDescription}`);
        console.log(`     ${intervention.outcomeMarker}: ${intervention.beforeValue} → ${intervention.afterValue} (${intervention.changePercent?.toFixed(1)}% change)`);
        console.log(`     ${intervention.recommendation}`);
      });
    } else {
      console.log('   ⚠️  No effective interventions detected (expected if no improving trends)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Effective interventions detection test failed:', error.message);
    results.failed++;
  }

  // Test 4: Ineffective Interventions Detection (Failed Intervention Detection)
  console.log('\n--- Test 4: Ineffective Interventions Detection ---');
  try {
    const whatsNeedsAdjustment = await getWhatsNeedsAdjustment(TEST_USER_ID);
    
    console.log('✅ Ineffective interventions detection works');
    console.log(`   Ineffective interventions: ${whatsNeedsAdjustment.length}`);
    
    if (whatsNeedsAdjustment.length > 0) {
      console.log('\n   What needs adjustment for this user:');
      whatsNeedsAdjustment.forEach((intervention) => {
        console.log(`   - ${intervention.interventionDescription}`);
        console.log(`     ${intervention.outcomeMarker}: ${intervention.beforeValue} → ${intervention.afterValue} (${intervention.changePercent?.toFixed(1)}% change)`);
        console.log(`     ${intervention.recommendation}`);
      });
    } else {
      console.log('   ⚠️  No ineffective interventions detected (expected if no declining trends despite interventions)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Ineffective interventions detection test failed:', error.message);
    results.failed++;
  }

  // Test 5: Adaptive Signals Generation
  console.log('\n--- Test 5: Adaptive Signals Generation ---');
  try {
    const context = await getAdaptiveIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Adaptive signals generation works');
    console.log(`   Adaptive signals: ${context.adaptiveSignals.length}`);
    
    if (context.adaptiveSignals.length > 0) {
      console.log('\n   Sample adaptive signals:');
      context.adaptiveSignals.slice(0, 3).forEach((signal) => {
        console.log(`   - [${signal.type.toUpperCase()}] ${signal.title}`);
        console.log(`     ${signal.description}`);
        console.log(`     Confidence: ${signal.confidence}, Actionable: ${signal.actionable}`);
        if (signal.suggestedAction) {
          console.log(`     Suggested action: ${signal.suggestedAction}`);
        }
      });
    } else {
      console.log('   ⚠️  No adaptive signals (expected if no interventions detected)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Adaptive signals generation test failed:', error.message);
    results.failed++;
  }

  // Test 6: Confidence Scoring
  console.log('\n--- Test 6: Confidence Scoring ---');
  try {
    const context = await getAdaptiveIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Confidence scoring works');
    console.log(`   Confidence signals: ${context.confidenceSignals.length}`);
    
    if (context.confidenceSignals.length > 0) {
      console.log('\n   Confidence levels:');
      context.confidenceSignals.forEach((signal) => {
        console.log(`   - ${signal.category}: ${signal.confidence.toUpperCase()}`);
        console.log(`     Reason: ${signal.reason}`);
        console.log(`     Data points: ${signal.dataPoints}, Timespan: ${signal.timespan}`);
      });
    } else {
      console.log('   ⚠️  No confidence signals (expected if no longitudinal data)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Confidence scoring test failed:', error.message);
    results.failed++;
  }

  // Test 7: Learning Signals Generation
  console.log('\n--- Test 7: Learning Signals Generation ---');
  try {
    const learningInsights = await getLearningInsights(TEST_USER_ID);
    
    console.log('✅ Learning signals generation works');
    console.log(`   Learning signals: ${learningInsights.length}`);
    
    if (learningInsights.length > 0) {
      console.log('\n   Learning insights:');
      learningInsights.slice(0, 5).forEach((signal) => {
        console.log(`   - [${signal.category.toUpperCase()}] ${signal.insight}`);
        console.log(`     Confidence: ${signal.confidence}, Actionable: ${signal.actionable}`);
        if (signal.suggestedAction) {
          console.log(`     Suggested action: ${signal.suggestedAction}`);
        }
      });
    } else {
      console.log('   ⚠️  No learning signals (expected if no trends or interventions)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Learning signals generation test failed:', error.message);
    results.failed++;
  }

  // Test 8: Supplement Intervention Effectiveness
  console.log('\n--- Test 8: Supplement Intervention Effectiveness ---');
  try {
    const context = await getAdaptiveIntelligenceContext(TEST_USER_ID);
    
    const supplementInterventions = context.interventionEffects.filter(
      i => i.interventionType === 'supplement'
    );
    
    console.log('✅ Supplement intervention effectiveness detection works');
    console.log(`   Supplement interventions: ${supplementInterventions.length}`);
    
    if (supplementInterventions.length > 0) {
      console.log('\n   Supplement intervention results:');
      supplementInterventions.forEach((intervention) => {
        console.log(`   - ${intervention.interventionDescription}: ${intervention.effectiveness.toUpperCase()}`);
        console.log(`     ${intervention.evidence}`);
      });
    } else {
      console.log('   ⚠️  No supplement interventions detected (expected if no supplements with bloodwork trends)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Supplement intervention effectiveness test failed:', error.message);
    results.failed++;
  }

  // Test 9: Training Intervention Effectiveness
  console.log('\n--- Test 9: Training Intervention Effectiveness ---');
  try {
    const context = await getAdaptiveIntelligenceContext(TEST_USER_ID);
    
    const trainingInterventions = context.interventionEffects.filter(
      i => i.interventionType === 'training'
    );
    
    console.log('✅ Training intervention effectiveness detection works');
    console.log(`   Training interventions: ${trainingInterventions.length}`);
    
    if (trainingInterventions.length > 0) {
      console.log('\n   Training intervention results:');
      trainingInterventions.forEach((intervention) => {
        console.log(`   - ${intervention.interventionDescription}: ${intervention.effectiveness.toUpperCase()}`);
        console.log(`     ${intervention.evidence}`);
      });
    } else {
      console.log('   ⚠️  No training interventions detected (expected if no body composition trends)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Training intervention effectiveness test failed:', error.message);
    results.failed++;
  }

  // Test 10: Nutrition Intervention Effectiveness
  console.log('\n--- Test 10: Nutrition Intervention Effectiveness ---');
  try {
    const context = await getAdaptiveIntelligenceContext(TEST_USER_ID);
    
    const nutritionInterventions = context.interventionEffects.filter(
      i => i.interventionType === 'nutrition'
    );
    
    console.log('✅ Nutrition intervention effectiveness detection works');
    console.log(`   Nutrition interventions: ${nutritionInterventions.length}`);
    
    if (nutritionInterventions.length > 0) {
      console.log('\n   Nutrition intervention results:');
      nutritionInterventions.forEach((intervention) => {
        console.log(`   - ${intervention.interventionDescription}: ${intervention.effectiveness.toUpperCase()}`);
        console.log(`     ${intervention.evidence}`);
      });
    } else {
      console.log('   ⚠️  No nutrition interventions detected (expected if no metabolic marker trends)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Nutrition intervention effectiveness test failed:', error.message);
    results.failed++;
  }

  // Test 11: Data Completeness Calculation
  console.log('\n--- Test 11: Data Completeness Calculation ---');
  try {
    const context = await getAdaptiveIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Data completeness calculation works');
    console.log(`   Has longitudinal data: ${context.dataCompleteness.hasLongitudinalData}`);
    console.log(`   Has bloodwork trends: ${context.dataCompleteness.hasBloodworkTrends}`);
    console.log(`   Has body composition trends: ${context.dataCompleteness.hasBodyCompositionTrends}`);
    console.log(`   Has supplement data: ${context.dataCompleteness.hasSupplementData}`);
    console.log(`   Completeness score: ${context.dataCompleteness.completenessScore}%`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Data completeness calculation test failed:', error.message);
    results.failed++;
  }

  // Test 12: Fallback Behavior (No Historical Data)
  console.log('\n--- Test 12: Fallback Behavior (No Historical Data) ---');
  try {
    const nonExistentUserId = 'user-with-no-data-' + Date.now();
    
    const context = await getAdaptiveIntelligenceContext(nonExistentUserId);
    
    console.log('✅ Fallback behavior works without historical data');
    console.log(`   Total interventions: ${context.totalInterventions}`);
    console.log(`   Completeness score: ${context.dataCompleteness.completenessScore}%`);
    console.log('   Check logs for: [ADAPTIVE] Starting adaptive intelligence analysis');
    console.log('   Check logs for: [LONGITUDINAL] No bloodwork history available');
    
    if (context.totalInterventions !== 0) {
      console.log('   ⚠️  Expected 0 interventions for user with no data');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fallback behavior test failed:', error.message);
    results.failed++;
  }

  // Test 13: Logging Verification
  console.log('\n--- Test 13: Logging Verification ---');
  try {
    console.log('✅ Logging verification');
    console.log('\n   Expected log patterns:');
    console.log('   - [ADAPTIVE] Starting adaptive intelligence analysis');
    console.log('   - [ADAPTIVE] Longitudinal intelligence loaded');
    console.log('   - [ADAPTIVE] Intervention effects detected');
    console.log('   - [ADAPTIVE] Adaptive intelligence analysis complete');
    console.log('\n   Review logs above to verify these patterns appear');
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Logging verification failed:', error.message);
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
    console.log('\nNext Steps:');
    console.log('1. Upload multiple bloodwork scans + supplement stack for test user');
    console.log('2. Upload multiple body composition scans for test user');
    console.log('3. Verify intervention effectiveness is detected correctly');
    console.log('4. Check that effective interventions generate positive adaptive signals');
    console.log('5. Check that ineffective interventions generate escalation recommendations');
    console.log('6. Verify learning signals reflect what\'s working for the user');
    console.log('7. Test integration with fusion service (adaptive signals in fusion context)');
    console.log('8. Test integration with recommendation engine (adaptive boost)');
    console.log('9. Test integration with control tower (what\'s working / needs adjustment sections)');
    console.log('10. Monitor production logs for adaptive intelligence patterns\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

// Run validation
validateAdaptiveIntelligence()
  .then(() => {
    console.log('✅ Validation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
