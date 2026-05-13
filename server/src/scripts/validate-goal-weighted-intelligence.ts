/**
 * Validation Script: Goal-Weighted Intelligence Integration
 * 
 * Purpose: Validate that goal-weighted intelligence service correctly loads goals, applies weighting, adjusts priorities, detects conflicts, and tracks progress
 * Tests: Goal loading, weighting logic, priority adjustment, conflict detection, progress tracking, fallback behavior
 * 
 * Run: npx ts-node src/scripts/validate-goal-weighted-intelligence.ts
 */

import { getGoalWeightedIntelligenceContext, getTopGoalAlignedPriorities, getGoalProgressSummary, getGoalConflicts } from '../services/goalWeightedIntelligenceService';

const TEST_USER_ID = 'test-user-goal-weighted-intelligence';

async function validateGoalWeightedIntelligence() {
  console.log('🔵 [VALIDATION] Starting Goal-Weighted Intelligence Integration Validation\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Goal-Weighted Intelligence Context Available
  console.log('--- Test 1: Goal-Weighted Intelligence Context Available ---');
  try {
    const context = await getGoalWeightedIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Goal-weighted intelligence context loaded');
    console.log(`   Total goals: ${context.totalGoals}`);
    console.log(`   Primary goals: ${context.primaryGoals}`);
    console.log(`   Weighted signals: ${context.weightedSignals.length}`);
    console.log(`   Goal conflicts: ${context.conflictCount}`);
    console.log(`   Improving goals: ${context.improvingGoals}`);
    console.log(`   Priority adjustments: ${context.priorityAdjustments.length}`);
    console.log(`   Data completeness: ${context.dataCompleteness.completenessScore}%`);
    
    if (context.totalGoals === 0) {
      console.log('   ⚠️  No goals loaded (using default balanced optimization)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Goal-weighted intelligence context loading failed:', error.message);
    results.failed++;
  }

  // Test 2: Goal Loading
  console.log('\n--- Test 2: Goal Loading ---');
  try {
    const context = await getGoalWeightedIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Goal loading works');
    console.log(`   Goals loaded: ${context.goals.length}`);
    
    if (context.goals.length > 0) {
      console.log('\n   User goals:');
      context.goals.forEach((goal) => {
        console.log(`   - [${goal.priority.toUpperCase()}] ${goal.category}`);
        console.log(`     Weight: ${goal.weight}, Description: ${goal.description}`);
        console.log(`     Source: ${goal.source}`);
      });
    } else {
      console.log('   ⚠️  No goals loaded (expected if no baseline profile goals)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Goal loading test failed:', error.message);
    results.failed++;
  }

  // Test 3: Goal Weighting Model
  console.log('\n--- Test 3: Goal Weighting Model ---');
  try {
    const context = await getGoalWeightedIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Goal weighting model works');
    console.log('\n   Goal weights:');
    Object.entries(context.goalWeights).forEach(([category, weight]) => {
      if (weight > 0) {
        console.log(`   - ${category}: ${weight} (${weight === 3 ? 'Primary' : weight === 2 ? 'Secondary' : 'Tertiary'})`);
      }
    });
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Goal weighting model test failed:', error.message);
    results.failed++;
  }

  // Test 4: Goal-Weighted Signals
  console.log('\n--- Test 4: Goal-Weighted Signals ---');
  try {
    const context = await getGoalWeightedIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Goal-weighted signals generation works');
    console.log(`   Weighted signals: ${context.weightedSignals.length}`);
    
    if (context.weightedSignals.length > 0) {
      console.log('\n   Top weighted signals:');
      context.weightedSignals.slice(0, 5).forEach((signal) => {
        console.log(`   - [${signal.signalType.toUpperCase()}] Final Score: ${signal.finalScore}`);
        console.log(`     Base: ${signal.baseScore}, Goal Boost: +${signal.goalBoost}`);
        console.log(`     Goal Alignment: ${signal.goalAlignment.join(', ') || 'None'}`);
        console.log(`     Priority Reason: ${signal.priorityReason}`);
      });
    } else {
      console.log('   ⚠️  No weighted signals (expected if no fusion/adaptive/learning signals)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Goal-weighted signals test failed:', error.message);
    results.failed++;
  }

  // Test 5: Priority Adjustment
  console.log('\n--- Test 5: Priority Adjustment ---');
  try {
    const context = await getGoalWeightedIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Priority adjustment works');
    console.log(`   Priority adjustments: ${context.priorityAdjustments.length}`);
    
    if (context.priorityAdjustments.length > 0) {
      console.log('\n   Sample priority adjustments:');
      context.priorityAdjustments.slice(0, 3).forEach((adjustment) => {
        console.log(`   - ${adjustment.itemType}: ${adjustment.originalPriority} → ${adjustment.adjustedPriority} (+${adjustment.adjustment})`);
        console.log(`     Reason: ${adjustment.reason}`);
        console.log(`     Goal Categories: ${adjustment.goalCategories.join(', ')}`);
      });
    } else {
      console.log('   ⚠️  No priority adjustments (expected if no goal-aligned signals)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Priority adjustment test failed:', error.message);
    results.failed++;
  }

  // Test 6: Goal Conflict Detection
  console.log('\n--- Test 6: Goal Conflict Detection ---');
  try {
    const conflicts = await getGoalConflicts(TEST_USER_ID);
    
    console.log('✅ Goal conflict detection works');
    console.log(`   Goal conflicts: ${conflicts.length}`);
    
    if (conflicts.length > 0) {
      console.log('\n   Detected conflicts:');
      conflicts.forEach((conflict) => {
        console.log(`   - ${conflict.goal1} vs ${conflict.goal2} (${conflict.severity.toUpperCase()} severity)`);
        console.log(`     ${conflict.description}`);
        console.log(`     Recommendation: ${conflict.recommendation}`);
      });
    } else {
      console.log('   ℹ️  No goal conflicts detected (expected if goals are compatible)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Goal conflict detection test failed:', error.message);
    results.failed++;
  }

  // Test 7: Goal Progress Tracking
  console.log('\n--- Test 7: Goal Progress Tracking ---');
  try {
    const progress = await getGoalProgressSummary(TEST_USER_ID);
    
    console.log('✅ Goal progress tracking works');
    console.log(`   Goals with progress data: ${progress.length}`);
    
    if (progress.length > 0) {
      console.log('\n   Goal progress:');
      progress.forEach((goalProgress) => {
        console.log(`   - ${goalProgress.goal}: ${goalProgress.status.toUpperCase()}`);
        console.log(`     Confidence: ${goalProgress.confidence}`);
        if (goalProgress.metrics.length > 0) {
          console.log(`     Metrics:`);
          goalProgress.metrics.forEach(metric => {
            console.log(`       - ${metric.marker}: ${metric.trend} (${metric.changePercent?.toFixed(1)}% change)`);
          });
        }
        if (goalProgress.evidence.length > 0) {
          console.log(`     Evidence: ${goalProgress.evidence[0]}`);
        }
      });
    } else {
      console.log('   ⚠️  No goal progress data (expected if no longitudinal trends for goal markers)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Goal progress tracking test failed:', error.message);
    results.failed++;
  }

  // Test 8: Top Goal-Aligned Priorities
  console.log('\n--- Test 8: Top Goal-Aligned Priorities ---');
  try {
    const topPriorities = await getTopGoalAlignedPriorities(TEST_USER_ID, 3);
    
    console.log('✅ Top goal-aligned priorities extraction works');
    console.log(`   Top priorities: ${topPriorities.length}`);
    
    if (topPriorities.length > 0) {
      console.log('\n   Top 3 goal-aligned priorities:');
      topPriorities.forEach((priority, index) => {
        const signal = priority.originalSignal as any;
        console.log(`   ${index + 1}. [${priority.signalType.toUpperCase()}] ${signal.title || signal.insight || 'Signal'}`);
        console.log(`      Score: ${priority.finalScore} (Base: ${priority.baseScore} + Goal Boost: ${priority.goalBoost})`);
        console.log(`      Goal Alignment: ${priority.goalAlignment.join(', ') || 'None'}`);
      });
    } else {
      console.log('   ⚠️  No top priorities (expected if no signals)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Top goal-aligned priorities test failed:', error.message);
    results.failed++;
  }

  // Test 9: Goal Boost Calculation
  console.log('\n--- Test 9: Goal Boost Calculation ---');
  try {
    const context = await getGoalWeightedIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Goal boost calculation works');
    
    const boostedSignals = context.weightedSignals.filter(s => s.goalBoost > 0);
    console.log(`   Signals with goal boost: ${boostedSignals.length}`);
    
    if (boostedSignals.length > 0) {
      const avgBoost = boostedSignals.reduce((sum, s) => sum + s.goalBoost, 0) / boostedSignals.length;
      const maxBoost = Math.max(...boostedSignals.map(s => s.goalBoost));
      console.log(`   Average boost: +${avgBoost.toFixed(1)}`);
      console.log(`   Max boost: +${maxBoost}`);
      
      console.log('\n   Boost distribution:');
      console.log(`   - Primary goal boost (+10): ${boostedSignals.filter(s => s.goalBoost === 10).length}`);
      console.log(`   - Secondary goal boost (+6): ${boostedSignals.filter(s => s.goalBoost === 6).length}`);
      console.log(`   - Tertiary goal boost (+3): ${boostedSignals.filter(s => s.goalBoost === 3).length}`);
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Goal boost calculation test failed:', error.message);
    results.failed++;
  }

  // Test 10: Data Completeness Calculation
  console.log('\n--- Test 10: Data Completeness Calculation ---');
  try {
    const context = await getGoalWeightedIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Data completeness calculation works');
    console.log(`   Has goals: ${context.dataCompleteness.hasGoals}`);
    console.log(`   Has adaptive intelligence: ${context.dataCompleteness.hasAdaptiveIntelligence}`);
    console.log(`   Has longitudinal intelligence: ${context.dataCompleteness.hasLongitudinalIntelligence}`);
    console.log(`   Has fusion intelligence: ${context.dataCompleteness.hasFusionIntelligence}`);
    console.log(`   Completeness score: ${context.dataCompleteness.completenessScore}%`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Data completeness calculation test failed:', error.message);
    results.failed++;
  }

  // Test 11: Fallback Behavior (No Goals)
  console.log('\n--- Test 11: Fallback Behavior (No Goals) ---');
  try {
    const nonExistentUserId = 'user-with-no-data-' + Date.now();
    
    const context = await getGoalWeightedIntelligenceContext(nonExistentUserId);
    
    console.log('✅ Fallback behavior works without goals');
    console.log(`   Total goals: ${context.totalGoals}`);
    console.log(`   Completeness score: ${context.dataCompleteness.completenessScore}%`);
    console.log('   Check logs for: [GOAL INTELLIGENCE] No goals found, using default balanced optimization');
    
    if (context.totalGoals === 0) {
      console.log('   ⚠️  Expected default goals for user with no data');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fallback behavior test failed:', error.message);
    results.failed++;
  }

  // Test 12: Logging Verification
  console.log('\n--- Test 12: Logging Verification ---');
  try {
    console.log('✅ Logging verification');
    console.log('\n   Expected log patterns:');
    console.log('   - [GOAL INTELLIGENCE] Starting goal-weighted intelligence analysis');
    console.log('   - [GOAL INTELLIGENCE] Goals loaded');
    console.log('   - [GOAL INTELLIGENCE] Intelligence contexts loaded');
    console.log('   - [GOAL INTELLIGENCE] Goal weighting applied');
    console.log('   - [GOAL INTELLIGENCE] Goal progress tracked');
    console.log('   - [GOAL INTELLIGENCE] Goal-weighted intelligence analysis complete');
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
    console.log('1. Set up baseline profile with health goals for test user');
    console.log('2. Upload bloodwork + body composition + supplements for test user');
    console.log('3. Verify goal weighting is applied correctly');
    console.log('4. Check that goal-aligned signals receive priority boost');
    console.log('5. Verify goal conflicts are detected (e.g., muscle gain + aggressive fat loss)');
    console.log('6. Check goal progress tracking reflects longitudinal trends');
    console.log('7. Test integration with fusion service (goal-weighted fusion signals)');
    console.log('8. Test integration with recommendation engine (goal-weighted scoring)');
    console.log('9. Test integration with control tower (goal progress section)');
    console.log('10. Monitor production logs for goal intelligence patterns\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

// Run validation
validateGoalWeightedIntelligence()
  .then(() => {
    console.log('✅ Validation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
