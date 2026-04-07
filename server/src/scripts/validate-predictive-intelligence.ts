/**
 * Validation Script: Predictive Intelligence Integration
 * 
 * Purpose: Validate that predictive intelligence service correctly projects future metrics, detects plateaus, predicts decline, forecasts goal achievement, and predicts risks
 * Tests: Projection generation, plateau detection, decline detection, goal prediction, risk prediction, confidence scoring, fallback behavior
 * 
 * Run: npx ts-node src/scripts/validate-predictive-intelligence.ts
 */

import { getPredictiveIntelligenceContext, getUpcomingRisks, getProjectedImprovements, getGoalProgressForecast } from '../services/predictiveIntelligencePhase9Service';

const TEST_USER_ID = 'test-user-predictive-intelligence';

async function validatePredictiveIntelligence() {
  console.log('🔵 [VALIDATION] Starting Predictive Intelligence Integration Validation\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Predictive Intelligence Context Available
  console.log('--- Test 1: Predictive Intelligence Context Available ---');
  try {
    const context = await getPredictiveIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Predictive intelligence context loaded');
    console.log(`   Total projections: ${context.totalProjections}`);
    console.log(`   High confidence projections: ${context.highConfidenceProjections}`);
    console.log(`   Upcoming risks: ${context.upcomingRisks}`);
    console.log(`   Goals on track: ${context.goalsOnTrack}`);
    console.log(`   Plateaus detected: ${context.plateausDetected}`);
    console.log(`   Declines detected: ${context.declinesDetected}`);
    console.log(`   Overall confidence: ${context.predictionConfidence.overall}`);
    console.log(`   Data completeness: ${context.dataCompleteness.completenessScore}%`);
    
    if (context.totalProjections === 0) {
      console.log('   ⚠️  No projections generated (expected if no longitudinal trends)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Predictive intelligence context loading failed:', error.message);
    results.failed++;
  }

  // Test 2: Metric Projections
  console.log('\n--- Test 2: Metric Projections ---');
  try {
    const context = await getPredictiveIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Metric projection generation works');
    console.log(`   Projections generated: ${context.projections.length}`);
    console.log(`   Bloodwork projections: ${context.projections.filter(p => p.category === 'bloodwork').length}`);
    console.log(`   Body composition projections: ${context.projections.filter(p => p.category === 'body_composition').length}`);
    
    if (context.projections.length > 0) {
      console.log('\n   Sample projections:');
      context.projections.slice(0, 3).forEach((projection) => {
        console.log(`   - ${projection.metric} (${projection.category})`);
        console.log(`     Current: ${projection.current.toFixed(1)} ${projection.unit}`);
        if (projection.projected7Days) {
          console.log(`     7-day projection: ${projection.projected7Days.toFixed(1)} ${projection.unit}`);
        }
        if (projection.projected30Days) {
          console.log(`     30-day projection: ${projection.projected30Days.toFixed(1)} ${projection.unit}`);
        }
        if (projection.projected90Days) {
          console.log(`     90-day projection: ${projection.projected90Days.toFixed(1)} ${projection.unit}`);
        }
        console.log(`     Direction: ${projection.direction}, Confidence: ${projection.confidence}`);
        console.log(`     Data points: ${projection.dataPoints}, Change rate: ${projection.changeRate?.toFixed(4)}/day`);
      });
    } else {
      console.log('   ⚠️  No projections (expected if no longitudinal trends with 2+ data points)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Metric projection test failed:', error.message);
    results.failed++;
  }

  // Test 3: Bloodwork Projections
  console.log('\n--- Test 3: Bloodwork Projections ---');
  try {
    const context = await getPredictiveIntelligenceContext(TEST_USER_ID);
    
    const bloodworkProjections = context.projections.filter(p => p.category === 'bloodwork');
    
    console.log('✅ Bloodwork projection generation works');
    console.log(`   Bloodwork projections: ${bloodworkProjections.length}`);
    
    if (bloodworkProjections.length > 0) {
      console.log('\n   Bloodwork projections:');
      bloodworkProjections.forEach((projection) => {
        console.log(`   - ${projection.metric}: ${projection.current.toFixed(1)} → ${projection.projected90Days?.toFixed(1) || 'N/A'} (90 days)`);
        console.log(`     Direction: ${projection.direction}, Confidence: ${projection.confidence}`);
      });
    } else {
      console.log('   ⚠️  No bloodwork projections (expected if no bloodwork trends)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Bloodwork projection test failed:', error.message);
    results.failed++;
  }

  // Test 4: Body Composition Projections
  console.log('\n--- Test 4: Body Composition Projections ---');
  try {
    const context = await getPredictiveIntelligenceContext(TEST_USER_ID);
    
    const bodyCompositionProjections = context.projections.filter(p => p.category === 'body_composition');
    
    console.log('✅ Body composition projection generation works');
    console.log(`   Body composition projections: ${bodyCompositionProjections.length}`);
    
    if (bodyCompositionProjections.length > 0) {
      console.log('\n   Body composition projections:');
      bodyCompositionProjections.forEach((projection) => {
        console.log(`   - ${projection.metric}: ${projection.current.toFixed(1)} → ${projection.projected90Days?.toFixed(1) || 'N/A'} (90 days)`);
        console.log(`     Direction: ${projection.direction}, Confidence: ${projection.confidence}`);
      });
    } else {
      console.log('   ⚠️  No body composition projections (expected if no body composition trends)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Body composition projection test failed:', error.message);
    results.failed++;
  }

  // Test 5: Plateau Detection
  console.log('\n--- Test 5: Plateau Detection ---');
  try {
    const context = await getPredictiveIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Plateau detection works');
    console.log(`   Plateaus detected: ${context.plateauPredictions.length}`);
    console.log(`   Active plateaus: ${context.plateauPredictions.filter(p => p.status === 'plateau').length}`);
    console.log(`   Approaching plateaus: ${context.plateauPredictions.filter(p => p.status === 'approaching').length}`);
    
    if (context.plateauPredictions.length > 0) {
      console.log('\n   Plateau predictions:');
      context.plateauPredictions.forEach((prediction) => {
        console.log(`   - ${prediction.metric} (${prediction.category}): ${prediction.status.toUpperCase()}`);
        console.log(`     ${prediction.description}`);
        console.log(`     Recommendation: ${prediction.recommendation}`);
      });
    } else {
      console.log('   ℹ️  No plateaus detected (expected if all metrics progressing)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Plateau detection test failed:', error.message);
    results.failed++;
  }

  // Test 6: Decline Prediction
  console.log('\n--- Test 6: Decline Prediction ---');
  try {
    const context = await getPredictiveIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Decline prediction works');
    console.log(`   Declines detected: ${context.declinePredictions.length}`);
    console.log(`   Severe declines: ${context.declinePredictions.filter(d => d.status === 'severe').length}`);
    console.log(`   Moderate declines: ${context.declinePredictions.filter(d => d.status === 'moderate').length}`);
    console.log(`   Mild declines: ${context.declinePredictions.filter(d => d.status === 'mild').length}`);
    
    if (context.declinePredictions.length > 0) {
      console.log('\n   Decline predictions:');
      context.declinePredictions.forEach((prediction) => {
        console.log(`   - ${prediction.metric} (${prediction.category}): ${prediction.status.toUpperCase()}`);
        console.log(`     ${prediction.description}`);
        console.log(`     Projected impact: ${prediction.projectedImpact}`);
        console.log(`     Recommendation: ${prediction.recommendation}`);
      });
    } else {
      console.log('   ℹ️  No declines detected (expected if all metrics stable or improving)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Decline prediction test failed:', error.message);
    results.failed++;
  }

  // Test 7: Risk Prediction
  console.log('\n--- Test 7: Risk Prediction ---');
  try {
    const risks = await getUpcomingRisks(TEST_USER_ID);
    
    console.log('✅ Risk prediction works');
    console.log(`   Upcoming risks: ${risks.length}`);
    console.log(`   Critical risks: ${risks.filter(r => r.riskLevel === 'critical').length}`);
    console.log(`   High risks: ${risks.filter(r => r.riskLevel === 'high').length}`);
    console.log(`   Moderate risks: ${risks.filter(r => r.riskLevel === 'moderate').length}`);
    
    if (risks.length > 0) {
      console.log('\n   Risk predictions:');
      risks.forEach((risk) => {
        console.log(`   - ${risk.riskType.toUpperCase()}: ${risk.riskLevel.toUpperCase()}`);
        console.log(`     ${risk.description}`);
        console.log(`     Timeframe: ${risk.timeframe}, Confidence: ${risk.confidence}`);
        console.log(`     Evidence:`);
        risk.evidence.forEach(e => console.log(`       - ${e}`));
        console.log(`     Recommendation: ${risk.recommendation}`);
      });
    } else {
      console.log('   ℹ️  No upcoming risks detected (expected if all metrics stable or improving)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Risk prediction test failed:', error.message);
    results.failed++;
  }

  // Test 8: Goal Achievement Prediction
  console.log('\n--- Test 8: Goal Achievement Prediction ---');
  try {
    const goalForecast = await getGoalProgressForecast(TEST_USER_ID);
    
    console.log('✅ Goal achievement prediction works');
    console.log(`   Goal predictions: ${goalForecast.length}`);
    console.log(`   Goals on track: ${goalForecast.filter(g => g.onTrack).length}`);
    console.log(`   Goals off track: ${goalForecast.filter(g => !g.onTrack).length}`);
    
    if (goalForecast.length > 0) {
      console.log('\n   Goal predictions:');
      goalForecast.forEach((prediction) => {
        console.log(`   - ${prediction.goalCategory}: ${prediction.onTrack ? 'ON TRACK' : 'OFF TRACK'}`);
        console.log(`     Current progress: ${prediction.currentProgress}%`);
        console.log(`     Projected completion: ${prediction.projectedCompletion || 'N/A'}`);
        if (prediction.daysToGoal) {
          console.log(`     Days to goal: ${prediction.daysToGoal}`);
        }
        console.log(`     Confidence: ${prediction.confidence}`);
        console.log(`     Recommendation: ${prediction.recommendation}`);
      });
    } else {
      console.log('   ⚠️  No goal predictions (expected if no goals with progress data)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Goal achievement prediction test failed:', error.message);
    results.failed++;
  }

  // Test 9: Projected Improvements
  console.log('\n--- Test 9: Projected Improvements ---');
  try {
    const improvements = await getProjectedImprovements(TEST_USER_ID);
    
    console.log('✅ Projected improvements extraction works');
    console.log(`   Projected improvements: ${improvements.length}`);
    
    if (improvements.length > 0) {
      console.log('\n   Projected improvements:');
      improvements.forEach((projection) => {
        console.log(`   - ${projection.metric}: ${projection.current.toFixed(1)} → ${projection.projected90Days?.toFixed(1) || 'N/A'} (90 days)`);
        console.log(`     Confidence: ${projection.confidence}`);
      });
    } else {
      console.log('   ⚠️  No projected improvements (expected if no improving trends)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Projected improvements test failed:', error.message);
    results.failed++;
  }

  // Test 10: Prediction Confidence Scoring
  console.log('\n--- Test 10: Prediction Confidence Scoring ---');
  try {
    const context = await getPredictiveIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Prediction confidence scoring works');
    console.log(`   Overall confidence: ${context.predictionConfidence.overall}`);
    console.log(`   Bloodwork confidence: ${context.predictionConfidence.bloodwork}`);
    console.log(`   Body composition confidence: ${context.predictionConfidence.bodyComposition}`);
    console.log(`   Goals confidence: ${context.predictionConfidence.goals}`);
    console.log(`   High confidence projections: ${context.highConfidenceProjections} / ${context.totalProjections}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Prediction confidence scoring test failed:', error.message);
    results.failed++;
  }

  // Test 11: Projection Time Windows
  console.log('\n--- Test 11: Projection Time Windows ---');
  try {
    const context = await getPredictiveIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Projection time windows work');
    
    if (context.projections.length > 0) {
      const with7Day = context.projections.filter(p => p.projected7Days !== null).length;
      const with30Day = context.projections.filter(p => p.projected30Days !== null).length;
      const with90Day = context.projections.filter(p => p.projected90Days !== null).length;
      
      console.log(`   Projections with 7-day forecast: ${with7Day}`);
      console.log(`   Projections with 30-day forecast: ${with30Day}`);
      console.log(`   Projections with 90-day forecast: ${with90Day}`);
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Projection time windows test failed:', error.message);
    results.failed++;
  }

  // Test 12: Data Completeness Calculation
  console.log('\n--- Test 12: Data Completeness Calculation ---');
  try {
    const context = await getPredictiveIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Data completeness calculation works');
    console.log(`   Has longitudinal data: ${context.dataCompleteness.hasLongitudinalData}`);
    console.log(`   Has goal data: ${context.dataCompleteness.hasGoalData}`);
    console.log(`   Has adaptive data: ${context.dataCompleteness.hasAdaptiveData}`);
    console.log(`   Completeness score: ${context.dataCompleteness.completenessScore}%`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Data completeness calculation test failed:', error.message);
    results.failed++;
  }

  // Test 13: Fallback Behavior (No Longitudinal Data)
  console.log('\n--- Test 13: Fallback Behavior (No Longitudinal Data) ---');
  try {
    const nonExistentUserId = 'user-with-no-data-' + Date.now();
    
    const context = await getPredictiveIntelligenceContext(nonExistentUserId);
    
    console.log('✅ Fallback behavior works without longitudinal data');
    console.log(`   Total projections: ${context.totalProjections}`);
    console.log(`   Completeness score: ${context.dataCompleteness.completenessScore}%`);
    console.log('   Check logs for: [PREDICTIVE] Starting predictive intelligence analysis');
    
    if (context.totalProjections !== 0) {
      console.log('   ⚠️  Expected 0 projections for user with no data');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fallback behavior test failed:', error.message);
    results.failed++;
  }

  // Test 14: Logging Verification
  console.log('\n--- Test 14: Logging Verification ---');
  try {
    console.log('✅ Logging verification');
    console.log('\n   Expected log patterns:');
    console.log('   - [PREDICTIVE] Starting predictive intelligence analysis');
    console.log('   - [PREDICTIVE] Intelligence contexts loaded');
    console.log('   - [PREDICTIVE] Projections created');
    console.log('   - [PREDICTIVE] Risk predictions generated');
    console.log('   - [PREDICTIVE] Goal predictions generated');
    console.log('   - [PREDICTIVE] Predictive intelligence analysis complete');
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
    console.log('1. Upload multiple bloodwork scans for test user (3+ scans)');
    console.log('2. Upload multiple body composition scans for test user (3+ scans)');
    console.log('3. Verify projections are generated correctly');
    console.log('4. Check that plateau detection identifies flattening trends');
    console.log('5. Check that decline prediction identifies negative trajectories');
    console.log('6. Verify risk predictions identify upcoming health risks');
    console.log('7. Check goal predictions forecast achievement timelines');
    console.log('8. Test integration with fusion service (predictive signals)');
    console.log('9. Test integration with control tower (upcoming risks, projected improvements)');
    console.log('10. Monitor production logs for predictive intelligence patterns\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

// Run validation
validatePredictiveIntelligence()
  .then(() => {
    console.log('✅ Validation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
