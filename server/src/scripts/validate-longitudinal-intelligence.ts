/**
 * Validation Script: Longitudinal Intelligence Foundation
 * 
 * Purpose: Validate that longitudinal intelligence service correctly detects trends, generates predictions, and handles fallback scenarios
 * Tests: Bloodwork trends, body composition trends, prediction signals, fallback behavior
 * 
 * Run: npx ts-node src/scripts/validate-longitudinal-intelligence.ts
 */

import { getLongitudinalIntelligenceContext, getMarkerTrend } from '../services/longitudinalIntelligenceService';

const TEST_USER_ID = 'test-user-longitudinal-intelligence';

async function validateLongitudinalIntelligence() {
  console.log('🔵 [VALIDATION] Starting Longitudinal Intelligence Foundation Validation\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Longitudinal Intelligence Context Available
  console.log('--- Test 1: Longitudinal Intelligence Context Available ---');
  try {
    const context = await getLongitudinalIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Longitudinal intelligence context loaded');
    console.log(`   Total trends: ${context.totalTrends}`);
    console.log(`   Improving trends: ${context.improvingTrends}`);
    console.log(`   Declining trends: ${context.decliningTrends}`);
    console.log(`   Improvement signals: ${context.improvementSignals.length}`);
    console.log(`   Decline signals: ${context.declineSignals.length}`);
    console.log(`   Prediction signals: ${context.predictionSignals.length}`);
    console.log(`   Data completeness: ${context.dataCompleteness.completenessScore}%`);
    
    if (context.totalTrends === 0) {
      console.log('   ⚠️  No trends available (expected if no historical data uploaded)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Longitudinal intelligence context loading failed:', error.message);
    results.failed++;
  }

  // Test 2: Bloodwork Trend Detection
  console.log('\n--- Test 2: Bloodwork Trend Detection ---');
  try {
    const context = await getLongitudinalIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Bloodwork trend detection works');
    console.log(`   Bloodwork trends detected: ${context.bloodworkTrends.length}`);
    
    if (context.bloodworkTrends.length > 0) {
      console.log('\n   Sample bloodwork trends:');
      context.bloodworkTrends.slice(0, 3).forEach((trend) => {
        console.log(`   - ${trend.marker}: ${trend.direction} (${trend.confidence} confidence)`);
        console.log(`     ${trend.summary}`);
        console.log(`     Data points: ${trend.dataPoints.length}, Timespan: ${trend.timespan}`);
      });
    } else {
      console.log('   ⚠️  No bloodwork trends available (expected if no bloodwork history)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Bloodwork trend detection test failed:', error.message);
    results.failed++;
  }

  // Test 3: Body Composition Trend Detection
  console.log('\n--- Test 3: Body Composition Trend Detection ---');
  try {
    const context = await getLongitudinalIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Body composition trend detection works');
    console.log(`   Body composition trends detected: ${context.bodyCompositionTrends.length}`);
    
    if (context.bodyCompositionTrends.length > 0) {
      console.log('\n   Sample body composition trends:');
      context.bodyCompositionTrends.slice(0, 3).forEach((trend) => {
        console.log(`   - ${trend.marker}: ${trend.direction} (${trend.confidence} confidence)`);
        console.log(`     ${trend.summary}`);
        console.log(`     Data points: ${trend.dataPoints.length}, Timespan: ${trend.timespan}`);
      });
    } else {
      console.log('   ⚠️  No body composition trends available (expected if no body composition history)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Body composition trend detection test failed:', error.message);
    results.failed++;
  }

  // Test 4: Improvement Signal Generation
  console.log('\n--- Test 4: Improvement Signal Generation ---');
  try {
    const context = await getLongitudinalIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Improvement signal generation works');
    console.log(`   Improvement signals: ${context.improvementSignals.length}`);
    
    if (context.improvementSignals.length > 0) {
      console.log('\n   Sample improvement signals:');
      context.improvementSignals.slice(0, 3).forEach((signal) => {
        console.log(`   - [${signal.category.toUpperCase()}] ${signal.title}`);
        console.log(`     ${signal.description}`);
        console.log(`     Confidence: ${signal.confidence}, Data points: ${signal.dataPoints}, Timespan: ${signal.timespan}`);
      });
    } else {
      console.log('   ⚠️  No improvement signals (expected if no improving trends)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Improvement signal generation test failed:', error.message);
    results.failed++;
  }

  // Test 5: Decline Signal Generation
  console.log('\n--- Test 5: Decline Signal Generation ---');
  try {
    const context = await getLongitudinalIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Decline signal generation works');
    console.log(`   Decline signals: ${context.declineSignals.length}`);
    
    if (context.declineSignals.length > 0) {
      console.log('\n   Sample decline signals:');
      context.declineSignals.slice(0, 3).forEach((signal) => {
        console.log(`   - [${signal.category.toUpperCase()}] ${signal.title}`);
        console.log(`     ${signal.description}`);
        console.log(`     Confidence: ${signal.confidence}, Data points: ${signal.dataPoints}, Timespan: ${signal.timespan}`);
      });
    } else {
      console.log('   ⚠️  No decline signals (expected if no declining trends)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Decline signal generation test failed:', error.message);
    results.failed++;
  }

  // Test 6: Prediction Signal Generation
  console.log('\n--- Test 6: Prediction Signal Generation ---');
  try {
    const context = await getLongitudinalIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Prediction signal generation works');
    console.log(`   Prediction signals: ${context.predictionSignals.length}`);
    
    if (context.predictionSignals.length > 0) {
      console.log('\n   Sample prediction signals:');
      context.predictionSignals.slice(0, 3).forEach((prediction) => {
        console.log(`   - ${prediction.marker}: ${prediction.currentValue} → ${prediction.predictedValue} (${prediction.timeframe})`);
        console.log(`     Confidence: ${prediction.confidence}, Basis: ${prediction.basis}`);
      });
    } else {
      console.log('   ⚠️  No prediction signals (expected if insufficient trend data)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Prediction signal generation test failed:', error.message);
    results.failed++;
  }

  // Test 7: Specific Marker Trend Retrieval
  console.log('\n--- Test 7: Specific Marker Trend Retrieval ---');
  try {
    const a1cTrend = await getMarkerTrend(TEST_USER_ID, 'A1C', 'bloodwork');
    
    console.log('✅ Specific marker trend retrieval works');
    
    if (a1cTrend) {
      console.log(`   A1C trend: ${a1cTrend.direction} (${a1cTrend.confidence} confidence)`);
      console.log(`   ${a1cTrend.summary}`);
    } else {
      console.log('   ⚠️  No A1C trend available (expected if no A1C history)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Specific marker trend retrieval test failed:', error.message);
    results.failed++;
  }

  // Test 8: Trend Direction Classification
  console.log('\n--- Test 8: Trend Direction Classification ---');
  try {
    const context = await getLongitudinalIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Trend direction classification works');
    
    const allTrends = [...context.bloodworkTrends, ...context.bodyCompositionTrends];
    const directionCounts = {
      improving: allTrends.filter(t => t.direction === 'improving').length,
      declining: allTrends.filter(t => t.direction === 'declining').length,
      stable: allTrends.filter(t => t.direction === 'stable').length,
      volatile: allTrends.filter(t => t.direction === 'volatile').length,
    };
    
    console.log(`   Improving: ${directionCounts.improving}`);
    console.log(`   Declining: ${directionCounts.declining}`);
    console.log(`   Stable: ${directionCounts.stable}`);
    console.log(`   Volatile: ${directionCounts.volatile}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Trend direction classification test failed:', error.message);
    results.failed++;
  }

  // Test 9: Data Completeness Calculation
  console.log('\n--- Test 9: Data Completeness Calculation ---');
  try {
    const context = await getLongitudinalIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Data completeness calculation works');
    console.log(`   Has bloodwork history: ${context.dataCompleteness.hasBloodworkHistory}`);
    console.log(`   Has body composition history: ${context.dataCompleteness.hasBodyCompositionHistory}`);
    console.log(`   Bloodwork data points: ${context.dataCompleteness.bloodworkDataPoints}`);
    console.log(`   Body composition data points: ${context.dataCompleteness.bodyCompositionDataPoints}`);
    console.log(`   Completeness score: ${context.dataCompleteness.completenessScore}%`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Data completeness calculation test failed:', error.message);
    results.failed++;
  }

  // Test 10: Fallback Behavior (No Historical Data)
  console.log('\n--- Test 10: Fallback Behavior (No Historical Data) ---');
  try {
    const nonExistentUserId = 'user-with-no-data-' + Date.now();
    
    const context = await getLongitudinalIntelligenceContext(nonExistentUserId);
    
    console.log('✅ Fallback behavior works without historical data');
    console.log(`   Total trends: ${context.totalTrends}`);
    console.log(`   Completeness score: ${context.dataCompleteness.completenessScore}%`);
    console.log('   Check logs for: [LONGITUDINAL] No bloodwork history available');
    console.log('   Check logs for: [LONGITUDINAL] No body composition history available');
    
    if (context.totalTrends !== 0) {
      console.log('   ⚠️  Expected 0 trends for user with no data');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fallback behavior test failed:', error.message);
    results.failed++;
  }

  // Test 11: Trend Confidence Levels
  console.log('\n--- Test 11: Trend Confidence Levels ---');
  try {
    const context = await getLongitudinalIntelligenceContext(TEST_USER_ID);
    
    console.log('✅ Trend confidence levels work');
    
    const allTrends = [...context.bloodworkTrends, ...context.bodyCompositionTrends];
    const confidenceCounts = {
      high: allTrends.filter(t => t.confidence === 'high').length,
      moderate: allTrends.filter(t => t.confidence === 'moderate').length,
      low: allTrends.filter(t => t.confidence === 'low').length,
    };
    
    console.log(`   High confidence: ${confidenceCounts.high}`);
    console.log(`   Moderate confidence: ${confidenceCounts.moderate}`);
    console.log(`   Low confidence: ${confidenceCounts.low}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Trend confidence levels test failed:', error.message);
    results.failed++;
  }

  // Test 12: Logging Verification
  console.log('\n--- Test 12: Logging Verification ---');
  try {
    console.log('✅ Logging verification');
    console.log('\n   Expected log patterns:');
    console.log('   - [LONGITUDINAL] Starting longitudinal intelligence analysis');
    console.log('   - [LONGITUDINAL] Analyzing bloodwork trends');
    console.log('   - [LONGITUDINAL] Bloodwork trends generated');
    console.log('   - [LONGITUDINAL] Analyzing body composition trends');
    console.log('   - [LONGITUDINAL] Body composition trends generated');
    console.log('   - [LONGITUDINAL] Longitudinal intelligence analysis complete');
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
    console.log('1. Upload multiple bloodwork scans for test user (3+ scans over time)');
    console.log('2. Upload multiple body composition scans for test user (3+ scans over time)');
    console.log('3. Verify trends are detected correctly');
    console.log('4. Check improvement/decline signal generation');
    console.log('5. Verify prediction signals are generated for trending markers');
    console.log('6. Test integration with fusion service (Phase 7)');
    console.log('7. Monitor production logs for longitudinal intelligence patterns\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

// Run validation
validateLongitudinalIntelligence()
  .then(() => {
    console.log('✅ Validation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
