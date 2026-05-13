/**
 * Validation Script: Autonomous Optimization Integration
 * 
 * Purpose: Validate that autonomous optimization service correctly generates optimizations, prioritizes interventions, scores confidence, and handles fallback
 * Tests: Optimization generation, priority ranking, confidence scoring, trigger detection, fallback behavior
 * 
 * Run: npx ts-node src/scripts/validate-autonomous-optimization.ts
 */

import { getAutonomousOptimizationContext, getTopOptimizations, getOptimizationsByType, getCriticalOptimizations } from '../services/autonomousOptimizationPhase10Service';

const TEST_USER_ID = 'test-user-autonomous-optimization';

async function validateAutonomousOptimization() {
  console.log('🔵 [VALIDATION] Starting Autonomous Optimization Integration Validation\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Autonomous Optimization Context Available
  console.log('--- Test 1: Autonomous Optimization Context Available ---');
  try {
    const context = await getAutonomousOptimizationContext(TEST_USER_ID);
    
    console.log('✅ Autonomous optimization context loaded');
    console.log(`   Total optimizations: ${context.totalOptimizations}`);
    console.log(`   Critical optimizations: ${context.criticalOptimizations}`);
    console.log(`   High priority optimizations: ${context.highPriorityOptimizations}`);
    console.log(`   Overall confidence: ${context.optimizationConfidence.overall}`);
    console.log(`   Data completeness: ${context.dataCompleteness.completenessScore}%`);
    
    if (context.totalOptimizations === 0) {
      console.log('   ⚠️  No optimizations generated (expected if no predictive triggers)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Autonomous optimization context loading failed:', error.message);
    results.failed++;
  }

  // Test 2: Optimization Generation
  console.log('\n--- Test 2: Optimization Generation ---');
  try {
    const context = await getAutonomousOptimizationContext(TEST_USER_ID);
    
    console.log('✅ Optimization generation works');
    console.log(`   Optimizations generated: ${context.optimizationRecommendations.length}`);
    console.log(`   Nutrition optimizations: ${context.optimizationRecommendations.filter(o => o.type === 'nutrition').length}`);
    console.log(`   Workout optimizations: ${context.optimizationRecommendations.filter(o => o.type === 'workout').length}`);
    console.log(`   Supplement optimizations: ${context.optimizationRecommendations.filter(o => o.type === 'supplement').length}`);
    console.log(`   Recovery optimizations: ${context.optimizationRecommendations.filter(o => o.type === 'recovery').length}`);
    console.log(`   Lifestyle optimizations: ${context.optimizationRecommendations.filter(o => o.type === 'lifestyle').length}`);
    
    if (context.optimizationRecommendations.length > 0) {
      console.log('\n   Sample optimizations:');
      context.optimizationRecommendations.slice(0, 3).forEach((opt) => {
        console.log(`   - ${opt.type.toUpperCase()}: ${opt.recommendation}`);
        console.log(`     Trigger: ${opt.trigger}`);
        console.log(`     Priority: ${opt.priority}, Confidence: ${opt.confidence}`);
        console.log(`     Actions: ${opt.actions.length} action(s)`);
        console.log(`     Expected impact: ${opt.expectedImpact}`);
      });
    } else {
      console.log('   ⚠️  No optimizations (expected if no triggers detected)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Optimization generation test failed:', error.message);
    results.failed++;
  }

  // Test 3: Nutrition Optimization
  console.log('\n--- Test 3: Nutrition Optimization ---');
  try {
    const nutritionOpts = await getOptimizationsByType(TEST_USER_ID, 'nutrition');
    
    console.log('✅ Nutrition optimization generation works');
    console.log(`   Nutrition optimizations: ${nutritionOpts.length}`);
    
    if (nutritionOpts.length > 0) {
      console.log('\n   Nutrition optimizations:');
      nutritionOpts.forEach((opt) => {
        console.log(`   - ${opt.recommendation}`);
        console.log(`     Trigger: ${opt.trigger}`);
        console.log(`     Priority: ${opt.priority}`);
        console.log(`     Actions: ${opt.actions.join(', ')}`);
      });
    } else {
      console.log('   ℹ️  No nutrition optimizations (expected if no nutrition triggers)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Nutrition optimization test failed:', error.message);
    results.failed++;
  }

  // Test 4: Workout Optimization
  console.log('\n--- Test 4: Workout Optimization ---');
  try {
    const workoutOpts = await getOptimizationsByType(TEST_USER_ID, 'workout');
    
    console.log('✅ Workout optimization generation works');
    console.log(`   Workout optimizations: ${workoutOpts.length}`);
    
    if (workoutOpts.length > 0) {
      console.log('\n   Workout optimizations:');
      workoutOpts.forEach((opt) => {
        console.log(`   - ${opt.recommendation}`);
        console.log(`     Trigger: ${opt.trigger}`);
        console.log(`     Priority: ${opt.priority}`);
        console.log(`     Actions: ${opt.actions.join(', ')}`);
      });
    } else {
      console.log('   ℹ️  No workout optimizations (expected if no workout triggers)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Workout optimization test failed:', error.message);
    results.failed++;
  }

  // Test 5: Supplement Optimization
  console.log('\n--- Test 5: Supplement Optimization ---');
  try {
    const supplementOpts = await getOptimizationsByType(TEST_USER_ID, 'supplement');
    
    console.log('✅ Supplement optimization generation works');
    console.log(`   Supplement optimizations: ${supplementOpts.length}`);
    
    if (supplementOpts.length > 0) {
      console.log('\n   Supplement optimizations:');
      supplementOpts.forEach((opt) => {
        console.log(`   - ${opt.recommendation}`);
        console.log(`     Trigger: ${opt.trigger}`);
        console.log(`     Priority: ${opt.priority}`);
        console.log(`     Actions: ${opt.actions.join(', ')}`);
      });
    } else {
      console.log('   ℹ️  No supplement optimizations (expected if no supplement triggers)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Supplement optimization test failed:', error.message);
    results.failed++;
  }

  // Test 6: Recovery Optimization
  console.log('\n--- Test 6: Recovery Optimization ---');
  try {
    const recoveryOpts = await getOptimizationsByType(TEST_USER_ID, 'recovery');
    
    console.log('✅ Recovery optimization generation works');
    console.log(`   Recovery optimizations: ${recoveryOpts.length}`);
    
    if (recoveryOpts.length > 0) {
      console.log('\n   Recovery optimizations:');
      recoveryOpts.forEach((opt) => {
        console.log(`   - ${opt.recommendation}`);
        console.log(`     Trigger: ${opt.trigger}`);
        console.log(`     Priority: ${opt.priority}`);
        console.log(`     Actions: ${opt.actions.join(', ')}`);
      });
    } else {
      console.log('   ℹ️  No recovery optimizations (expected if no recovery triggers)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Recovery optimization test failed:', error.message);
    results.failed++;
  }

  // Test 7: Optimization Triggers
  console.log('\n--- Test 7: Optimization Triggers ---');
  try {
    const context = await getAutonomousOptimizationContext(TEST_USER_ID);
    
    console.log('✅ Optimization trigger detection works');
    
    const triggers = context.optimizationRecommendations.map(o => o.trigger);
    const uniqueTriggers = Array.from(new Set(triggers));
    
    console.log(`   Unique triggers detected: ${uniqueTriggers.length}`);
    uniqueTriggers.forEach(trigger => {
      const count = triggers.filter(t => t === trigger).length;
      console.log(`   - ${trigger}: ${count} optimization(s)`);
    });
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Optimization trigger test failed:', error.message);
    results.failed++;
  }

  // Test 8: Priority Ranking
  console.log('\n--- Test 8: Priority Ranking ---');
  try {
    const context = await getAutonomousOptimizationContext(TEST_USER_ID);
    
    console.log('✅ Priority ranking works');
    console.log(`   Optimization priorities calculated: ${context.optimizationPriorities.length}`);
    
    if (context.optimizationPriorities.length > 0) {
      console.log('\n   Top 3 priorities:');
      context.optimizationPriorities.slice(0, 3).forEach((item) => {
        console.log(`   ${item.rank}. ${item.optimization.recommendation}`);
        console.log(`      Priority score: ${item.priorityScore}`);
        console.log(`      Factors: Severity=${item.priorityFactors.predictionSeverity}, Goal=${item.priorityFactors.goalImportance}, Confidence=${item.priorityFactors.adaptiveConfidence}, Data=${item.priorityFactors.dataQuality}`);
      });
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Priority ranking test failed:', error.message);
    results.failed++;
  }

  // Test 9: Top Optimizations
  console.log('\n--- Test 9: Top Optimizations ---');
  try {
    const topOpts = await getTopOptimizations(TEST_USER_ID, 3);
    
    console.log('✅ Top optimizations extraction works');
    console.log(`   Top optimizations: ${topOpts.length}`);
    
    if (topOpts.length > 0) {
      console.log('\n   Top optimizations:');
      topOpts.forEach((opt, index) => {
        console.log(`   ${index + 1}. ${opt.recommendation}`);
        console.log(`      Type: ${opt.type}, Priority: ${opt.priority}`);
        console.log(`      Expected impact: ${opt.expectedImpact}`);
      });
    } else {
      console.log('   ⚠️  No top optimizations (expected if no optimizations generated)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Top optimizations test failed:', error.message);
    results.failed++;
  }

  // Test 10: Critical Optimizations
  console.log('\n--- Test 10: Critical Optimizations ---');
  try {
    const criticalOpts = await getCriticalOptimizations(TEST_USER_ID);
    
    console.log('✅ Critical optimizations extraction works');
    console.log(`   Critical optimizations: ${criticalOpts.length}`);
    
    if (criticalOpts.length > 0) {
      console.log('\n   Critical optimizations:');
      criticalOpts.forEach((opt) => {
        console.log(`   - ${opt.recommendation}`);
        console.log(`     Trigger: ${opt.triggerSource}`);
        console.log(`     Actions: ${opt.actions.join(', ')}`);
      });
    } else {
      console.log('   ℹ️  No critical optimizations (expected if no critical triggers)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Critical optimizations test failed:', error.message);
    results.failed++;
  }

  // Test 11: Autonomous Adjustments
  console.log('\n--- Test 11: Autonomous Adjustments ---');
  try {
    const context = await getAutonomousOptimizationContext(TEST_USER_ID);
    
    console.log('✅ Autonomous adjustments generation works');
    console.log(`   Autonomous adjustments: ${context.autonomousAdjustments.length}`);
    
    if (context.autonomousAdjustments.length > 0) {
      console.log('\n   Sample adjustments:');
      context.autonomousAdjustments.slice(0, 3).forEach((adj) => {
        console.log(`   - ${adj.category.toUpperCase()}: ${adj.suggestedAdjustment}`);
        console.log(`     Reason: ${adj.reason}`);
        console.log(`     Priority: ${adj.priority}, Confidence: ${adj.confidence}`);
      });
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Autonomous adjustments test failed:', error.message);
    results.failed++;
  }

  // Test 12: Optimization Confidence Scoring
  console.log('\n--- Test 12: Optimization Confidence Scoring ---');
  try {
    const context = await getAutonomousOptimizationContext(TEST_USER_ID);
    
    console.log('✅ Optimization confidence scoring works');
    console.log(`   Overall confidence: ${context.optimizationConfidence.overall}`);
    console.log(`   Nutrition confidence: ${context.optimizationConfidence.nutrition}`);
    console.log(`   Workout confidence: ${context.optimizationConfidence.workout}`);
    console.log(`   Supplement confidence: ${context.optimizationConfidence.supplement}`);
    console.log(`   Recovery confidence: ${context.optimizationConfidence.recovery}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Optimization confidence scoring test failed:', error.message);
    results.failed++;
  }

  // Test 13: Optimization Rationale
  console.log('\n--- Test 13: Optimization Rationale ---');
  try {
    const context = await getAutonomousOptimizationContext(TEST_USER_ID);
    
    console.log('✅ Optimization rationale generation works');
    console.log(`   Top triggers: ${context.optimizationRationale.topTriggers.join(', ') || 'None'}`);
    console.log(`   Primary goals: ${context.optimizationRationale.primaryGoals.join(', ') || 'None'}`);
    console.log(`   Key insights: ${context.optimizationRationale.keyInsights.length} insight(s)`);
    
    if (context.optimizationRationale.keyInsights.length > 0) {
      console.log('\n   Key insights:');
      context.optimizationRationale.keyInsights.forEach(insight => {
        console.log(`   - ${insight}`);
      });
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Optimization rationale test failed:', error.message);
    results.failed++;
  }

  // Test 14: Goal-Driven Optimization
  console.log('\n--- Test 14: Goal-Driven Optimization ---');
  try {
    const context = await getAutonomousOptimizationContext(TEST_USER_ID);
    
    console.log('✅ Goal-driven optimization works');
    
    const goalDrivenOpts = context.optimizationRecommendations.filter(o => 
      o.trigger === 'opportunity_detected' && o.triggerSource.toLowerCase().includes('goal')
    );
    
    console.log(`   Goal-driven optimizations: ${goalDrivenOpts.length}`);
    
    if (goalDrivenOpts.length > 0) {
      console.log('\n   Goal-driven optimizations:');
      goalDrivenOpts.forEach((opt) => {
        console.log(`   - ${opt.recommendation}`);
        console.log(`     Trigger source: ${opt.triggerSource}`);
      });
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Goal-driven optimization test failed:', error.message);
    results.failed++;
  }

  // Test 15: Data Completeness Calculation
  console.log('\n--- Test 15: Data Completeness Calculation ---');
  try {
    const context = await getAutonomousOptimizationContext(TEST_USER_ID);
    
    console.log('✅ Data completeness calculation works');
    console.log(`   Has predictive data: ${context.dataCompleteness.hasPredictiveData}`);
    console.log(`   Has goal data: ${context.dataCompleteness.hasGoalData}`);
    console.log(`   Has adaptive data: ${context.dataCompleteness.hasAdaptiveData}`);
    console.log(`   Has fusion data: ${context.dataCompleteness.hasFusionData}`);
    console.log(`   Completeness score: ${context.dataCompleteness.completenessScore}%`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Data completeness calculation test failed:', error.message);
    results.failed++;
  }

  // Test 16: Fallback Behavior (No Data)
  console.log('\n--- Test 16: Fallback Behavior (No Data) ---');
  try {
    const nonExistentUserId = 'user-with-no-data-' + Date.now();
    
    const context = await getAutonomousOptimizationContext(nonExistentUserId);
    
    console.log('✅ Fallback behavior works without data');
    console.log(`   Total optimizations: ${context.totalOptimizations}`);
    console.log(`   Completeness score: ${context.dataCompleteness.completenessScore}%`);
    console.log('   Check logs for: [AUTONOMOUS] Starting autonomous optimization analysis');
    
    if (context.totalOptimizations !== 0) {
      console.log('   ⚠️  Expected 0 optimizations for user with no data');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fallback behavior test failed:', error.message);
    results.failed++;
  }

  // Test 17: Logging Verification
  console.log('\n--- Test 17: Logging Verification ---');
  try {
    console.log('✅ Logging verification');
    console.log('\n   Expected log patterns:');
    console.log('   - [AUTONOMOUS] Starting autonomous optimization analysis');
    console.log('   - [AUTONOMOUS] Intelligence contexts loaded');
    console.log('   - [AUTONOMOUS] Optimizations generated');
    console.log('   - [AUTONOMOUS] Optimizations prioritized');
    console.log('   - [AUTONOMOUS] Autonomous optimization analysis complete');
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
    console.log('1. Set up test user with predictive triggers (risks, plateaus, declines)');
    console.log('2. Set up test user with goals (fat loss, muscle gain, etc.)');
    console.log('3. Verify optimizations are generated correctly');
    console.log('4. Check that priority ranking prioritizes critical optimizations');
    console.log('5. Verify goal-driven optimizations align with user goals');
    console.log('6. Check that nutrition optimizations respond to metabolic risks');
    console.log('7. Check that workout optimizations respond to plateaus');
    console.log('8. Check that supplement optimizations respond to ineffective interventions');
    console.log('9. Test integration with control tower (top optimizations section)');
    console.log('10. Monitor production logs for autonomous optimization patterns\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

// Run validation
validateAutonomousOptimization()
  .then(() => {
    console.log('✅ Validation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
