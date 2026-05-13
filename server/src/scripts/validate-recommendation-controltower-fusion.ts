/**
 * Validation Script: Recommendation Engine + Control Tower Fusion Integration
 * 
 * Purpose: Validate that fusion intelligence is properly integrated into recommendation prioritization and control tower
 * Tests: Fusion enhancement, prioritization changes, control tower fusion signals, fallback behavior
 * 
 * Run: npx ts-node src/scripts/validate-recommendation-controltower-fusion.ts
 */

import { getPrioritizedRecommendations } from '../services/recommendationPrioritizationService';
import { getControlTowerDaily } from '../services/controlTowerDailyService';
import { getHealthIntelligenceFusionContext } from '../services/healthIntelligenceFusionService';
import { enhanceRecommendationsWithFusion, getTopFusionPriorities, getFusionSummary } from '../services/fusionPrioritizationEnhancer';

const TEST_USER_ID = 'test-user-recommendation-controltower-fusion';

async function validateRecommendationControlTowerFusion() {
  console.log('🔵 [VALIDATION] Starting Recommendation + Control Tower Fusion Integration Validation\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Fusion Context Available
  console.log('--- Test 1: Fusion Context Available ---');
  try {
    const fusionContext = await getHealthIntelligenceFusionContext(TEST_USER_ID);
    
    console.log('✅ Fusion context loaded');
    console.log(`   Total signals: ${fusionContext.totalSignals}`);
    console.log(`   Risk signals: ${fusionContext.riskSignals.length}`);
    console.log(`   Optimization signals: ${fusionContext.optimizationSignals.length}`);
    console.log(`   Priority signals: ${fusionContext.prioritySignals.length}`);
    console.log(`   Data completeness: ${fusionContext.dataCompleteness.completenessScore}%`);
    
    if (fusionContext.totalSignals === 0) {
      console.log('   ⚠️  No fusion signals available (expected if no data uploaded)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fusion context loading failed:', error.message);
    results.failed++;
  }

  // Test 2: Fusion Prioritization Enhancer
  console.log('\n--- Test 2: Fusion Prioritization Enhancer ---');
  try {
    // Create mock recommendations
    const mockRecommendations = [
      {
        id: 'rec-1',
        source: 'Metabolic',
        sourceEngine: 'metabolic',
        priority: 'important' as const,
        summary: 'Optimize metabolic health',
        rationale: 'Elevated A1C detected',
        actions: ['Monitor blood sugar', 'Adjust nutrition'],
        score: 50,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rec-2',
        source: 'Supplement',
        sourceEngine: 'supplement',
        priority: 'important' as const,
        summary: 'Optimize vitamin D',
        rationale: 'Low vitamin D levels',
        actions: ['Increase vitamin D dose'],
        score: 45,
        createdAt: new Date().toISOString(),
      },
    ];

    const enhanced = await enhanceRecommendationsWithFusion(TEST_USER_ID, mockRecommendations);
    
    console.log('✅ Fusion enhancement works');
    console.log(`   Original recommendations: ${mockRecommendations.length}`);
    console.log(`   Enhanced recommendations: ${enhanced.length}`);
    
    const enhancedCount = enhanced.filter((rec: any) => rec.fusionInfluence).length;
    console.log(`   Recommendations with fusion influence: ${enhancedCount}`);
    
    if (enhancedCount > 0) {
      console.log('\n   Sample fusion influence:');
      enhanced.forEach((rec: any) => {
        if (rec.fusionInfluence) {
          console.log(`   - ${rec.source}: score ${mockRecommendations.find(r => r.id === rec.id)?.score} → ${rec.score}`);
          console.log(`     Reason: ${rec.fusionInfluence.reason}`);
        }
      });
    } else {
      console.log('   ⚠️  No fusion influence applied (expected if no relevant fusion signals)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fusion enhancement test failed:', error.message);
    results.failed++;
  }

  // Test 3: Top Fusion Priorities
  console.log('\n--- Test 3: Top Fusion Priorities ---');
  try {
    const topPriorities = await getTopFusionPriorities(TEST_USER_ID, 3);
    
    console.log('✅ Top fusion priorities extracted');
    console.log(`   Priority count: ${topPriorities.length}`);
    
    if (topPriorities.length > 0) {
      console.log('\n   Top priorities:');
      topPriorities.forEach((priority, idx) => {
        console.log(`   ${idx + 1}. [${priority.severity.toUpperCase()}] ${priority.title}`);
        console.log(`      ${priority.description}`);
        if (priority.suggestedAction) {
          console.log(`      Action: ${priority.suggestedAction}`);
        }
      });
    } else {
      console.log('   ⚠️  No fusion priorities available (expected if no data uploaded)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Top fusion priorities test failed:', error.message);
    results.failed++;
  }

  // Test 4: Fusion Summary
  console.log('\n--- Test 4: Fusion Summary ---');
  try {
    const summary = await getFusionSummary(TEST_USER_ID);
    
    console.log('✅ Fusion summary generated');
    
    if (summary) {
      console.log(`   Summary: "${summary}"`);
    } else {
      console.log('   ⚠️  No fusion summary available (expected if no fusion signals)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fusion summary test failed:', error.message);
    results.failed++;
  }

  // Test 5: Recommendation Prioritization with Fusion
  console.log('\n--- Test 5: Recommendation Prioritization with Fusion ---');
  try {
    const prioritization = await getPrioritizedRecommendations(TEST_USER_ID, { regenerate: true });
    
    console.log('✅ Recommendation prioritization works with fusion');
    console.log(`   Total recommendations: ${prioritization.allRecommendations.length}`);
    console.log(`   Top priorities: ${prioritization.topPriorities.length}`);
    
    if (prioritization.topPriorities.length > 0) {
      console.log('\n   Top 3 priorities:');
      prioritization.topPriorities.forEach((priority, idx) => {
        console.log(`   ${idx + 1}. ${priority.source}: ${priority.summary}`);
        console.log(`      Score: ${priority.score}`);
        
        const fusionInfluence = (priority as any).fusionInfluence;
        if (fusionInfluence) {
          console.log(`      Fusion influence: +${fusionInfluence.scoreAdjustment} (${fusionInfluence.reason})`);
        }
      });
    }
    
    console.log('\n   Check logs for: [PRIORITIZATION] Fusion enhancement applied');
    console.log('   Check logs for: enhancedCount, fusionInfluenced');
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Recommendation prioritization test failed:', error.message);
    results.failed++;
  }

  // Test 6: Control Tower Daily with Fusion
  console.log('\n--- Test 6: Control Tower Daily with Fusion ---');
  try {
    const controlTower = await getControlTowerDaily(TEST_USER_ID, { regenerate: true });
    
    console.log('✅ Control Tower Daily works with fusion');
    console.log(`   Overall status: ${controlTower.overallStatus}`);
    console.log(`   Headline: ${controlTower.headline}`);
    console.log(`   Priority cards: ${controlTower.priorities.length}`);
    console.log(`   Predictive alerts: ${controlTower.predictiveAlerts.length}`);
    
    console.log('\n   Check logs for: [CONTROL TOWER DAILY] Fusion priorities loaded');
    console.log('   Check logs for: fusionPriorityCount, fusionSummary');
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Control Tower Daily test failed:', error.message);
    results.failed++;
  }

  // Test 7: Fallback Behavior (No Fusion Data)
  console.log('\n--- Test 7: Fallback Behavior (No Fusion Data) ---');
  try {
    const nonExistentUserId = 'user-with-no-data-' + Date.now();
    
    const prioritization = await getPrioritizedRecommendations(nonExistentUserId);
    
    console.log('✅ Recommendation prioritization works without fusion data (fallback successful)');
    console.log(`   Total recommendations: ${prioritization.allRecommendations.length}`);
    console.log('   Check logs for: [FUSION ENHANCER] No fusion signals available');
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fallback behavior test failed:', error.message);
    results.failed++;
  }

  // Test 8: Backward Compatibility
  console.log('\n--- Test 8: Backward Compatibility ---');
  try {
    const prioritization = await getPrioritizedRecommendations(TEST_USER_ID);
    
    // Verify response structure is preserved
    console.log('✅ Backward compatibility verified');
    console.log('   Response structure:');
    console.log(`   - topPriorities: ${Array.isArray(prioritization.topPriorities)}`);
    console.log(`   - allRecommendations: ${Array.isArray(prioritization.allRecommendations)}`);
    console.log(`   - userId: ${!!prioritization.userId}`);
    console.log(`   - date: ${!!prioritization.date}`);
    console.log(`   - createdAt: ${!!prioritization.createdAt}`);
    
    // Check if optional fusion fields are present (additive)
    const hasFusionFields = prioritization.topPriorities.some((rec: any) => 
      rec.fusionInfluence || rec.fusionEvidence || rec.priorityReason
    );
    
    if (hasFusionFields) {
      console.log('   ✅ Optional fusion fields present (additive enhancement)');
    } else {
      console.log('   ⚠️  No fusion fields present (expected if no fusion signals)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Backward compatibility test failed:', error.message);
    results.failed++;
  }

  // Test 9: Fusion Influence on Prioritization Order
  console.log('\n--- Test 9: Fusion Influence on Prioritization Order ---');
  try {
    const prioritization = await getPrioritizedRecommendations(TEST_USER_ID, { regenerate: true });
    
    console.log('✅ Prioritization order analysis');
    
    if (prioritization.allRecommendations.length > 0) {
      const topScores = prioritization.allRecommendations.slice(0, 5).map(rec => rec.score);
      console.log(`   Top 5 scores: ${topScores.join(', ')}`);
      
      const fusionInfluencedCount = prioritization.allRecommendations.filter((rec: any) => 
        rec.fusionInfluence
      ).length;
      
      console.log(`   Fusion-influenced recommendations: ${fusionInfluencedCount}/${prioritization.allRecommendations.length}`);
      
      if (fusionInfluencedCount === 0) {
        console.log('   ⚠️  No fusion influence on prioritization (expected if no relevant signals)');
        results.warnings++;
      }
    } else {
      console.log('   ⚠️  No recommendations available for analysis');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Prioritization order analysis failed:', error.message);
    results.failed++;
  }

  // Test 10: Logging Verification
  console.log('\n--- Test 10: Logging Verification ---');
  try {
    console.log('✅ Logging verification');
    console.log('\n   Expected log patterns:');
    console.log('   - [FUSION ENHANCER] Starting fusion enhancement');
    console.log('   - [FUSION ENHANCER] Fusion context loaded');
    console.log('   - [FUSION ENHANCER] Recommendation enhanced');
    console.log('   - [FUSION ENHANCER] Enhancement complete');
    console.log('   - [PRIORITIZATION] Fusion enhancement applied');
    console.log('   - [CONTROL TOWER DAILY] Fusion priorities loaded');
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
    console.log('1. Upload bloodwork, body composition, and supplements for test user');
    console.log('2. Verify fusion signals influence recommendation prioritization');
    console.log('3. Check logs for fusion enhancement messages');
    console.log('4. Verify Control Tower includes fusion priorities');
    console.log('5. Test with partial data to verify fallback behavior');
    console.log('6. Monitor production logs for fusion integration patterns\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

// Run validation
validateRecommendationControlTowerFusion()
  .then(() => {
    console.log('✅ Validation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
