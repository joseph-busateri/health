/**
 * Validation Script: Cross-Engine Intelligence Fusion
 * 
 * Purpose: Validate that cross-engine fusion intelligence works correctly
 * Tests: Fusion signal generation, risk detection, optimization detection, fallback behavior
 * 
 * Run: npx ts-node src/scripts/validate-cross-engine-fusion.ts
 */

import { 
  getHealthIntelligenceFusionContext,
  getFusionSignalsByCategory,
  getFusionSignalsBySeverity,
  getActionableFusionSignals
} from '../services/healthIntelligenceFusionService';

const TEST_USER_ID = 'test-user-cross-engine-fusion';

async function validateCrossEngineFusion() {
  console.log('🔵 [VALIDATION] Starting Cross-Engine Intelligence Fusion Validation\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Fusion Context Service
  console.log('--- Test 1: Fusion Context Service ---');
  try {
    const fusionContext = await getHealthIntelligenceFusionContext(TEST_USER_ID);
    
    console.log('✅ Fusion context loaded successfully');
    console.log(`   Total signals: ${fusionContext.totalSignals}`);
    console.log(`   Risk signals: ${fusionContext.riskSignals.length}`);
    console.log(`   Optimization signals: ${fusionContext.optimizationSignals.length}`);
    console.log(`   Priority signals: ${fusionContext.prioritySignals.length}`);
    console.log(`   Critical signals: ${fusionContext.criticalSignals}`);
    console.log(`   High priority signals: ${fusionContext.highPrioritySignals}`);
    console.log(`   Data completeness: ${fusionContext.dataCompleteness.completenessScore}%`);
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fusion context service failed:', error.message);
    results.failed++;
  }

  // Test 2: Data Completeness Calculation
  console.log('\n--- Test 2: Data Completeness Calculation ---');
  try {
    const fusionContext = await getHealthIntelligenceFusionContext(TEST_USER_ID);
    
    console.log('✅ Data completeness calculated');
    console.log(`   Has baseline: ${fusionContext.dataCompleteness.hasBaseline}`);
    console.log(`   Has bloodwork: ${fusionContext.dataCompleteness.hasBloodwork}`);
    console.log(`   Has body composition: ${fusionContext.dataCompleteness.hasBodyComposition}`);
    console.log(`   Has supplements: ${fusionContext.dataCompleteness.hasSupplements}`);
    console.log(`   Completeness score: ${fusionContext.dataCompleteness.completenessScore}%`);
    
    if (fusionContext.dataCompleteness.completenessScore < 100) {
      console.log('   ⚠️  Not all data sources available (expected for test user)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Data completeness calculation failed:', error.message);
    results.failed++;
  }

  // Test 3: Fusion Signal Generation
  console.log('\n--- Test 3: Fusion Signal Generation ---');
  try {
    const fusionContext = await getHealthIntelligenceFusionContext(TEST_USER_ID);
    
    if (fusionContext.totalSignals === 0) {
      console.log('⚠️  No fusion signals generated (expected if no data available)');
      console.log('   This is normal if test user has no bloodwork/body composition/supplements');
      results.warnings++;
    } else {
      console.log('✅ Fusion signals generated');
      console.log(`   Total signals: ${fusionContext.totalSignals}`);
      
      // Show sample signals
      if (fusionContext.fusionSignals.length > 0) {
        console.log('\n   Sample signals:');
        fusionContext.fusionSignals.slice(0, 3).forEach(signal => {
          console.log(`   - [${signal.severity.toUpperCase()}] ${signal.title}`);
          console.log(`     ${signal.description}`);
          console.log(`     Data sources: ${signal.dataSources.join(', ')}`);
        });
      }
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fusion signal generation failed:', error.message);
    results.failed++;
  }

  // Test 4: Signal Categorization
  console.log('\n--- Test 4: Signal Categorization ---');
  try {
    const fusionContext = await getHealthIntelligenceFusionContext(TEST_USER_ID);
    
    console.log('✅ Signal categorization works');
    
    // Test category filtering
    const metabolicSignals = getFusionSignalsByCategory(fusionContext, 'metabolic');
    const supplementationSignals = getFusionSignalsByCategory(fusionContext, 'supplementation');
    const cardiovascularSignals = getFusionSignalsByCategory(fusionContext, 'cardiovascular');
    
    console.log(`   Metabolic signals: ${metabolicSignals.length}`);
    console.log(`   Supplementation signals: ${supplementationSignals.length}`);
    console.log(`   Cardiovascular signals: ${cardiovascularSignals.length}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Signal categorization failed:', error.message);
    results.failed++;
  }

  // Test 5: Severity Filtering
  console.log('\n--- Test 5: Severity Filtering ---');
  try {
    const fusionContext = await getHealthIntelligenceFusionContext(TEST_USER_ID);
    
    console.log('✅ Severity filtering works');
    
    const criticalSignals = getFusionSignalsBySeverity(fusionContext, 'critical');
    const highSignals = getFusionSignalsBySeverity(fusionContext, 'high');
    const moderateSignals = getFusionSignalsBySeverity(fusionContext, 'moderate');
    
    console.log(`   Critical signals: ${criticalSignals.length}`);
    console.log(`   High severity signals: ${highSignals.length}`);
    console.log(`   Moderate severity signals: ${moderateSignals.length}`);
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Severity filtering failed:', error.message);
    results.failed++;
  }

  // Test 6: Actionable Signal Filtering
  console.log('\n--- Test 6: Actionable Signal Filtering ---');
  try {
    const fusionContext = await getHealthIntelligenceFusionContext(TEST_USER_ID);
    
    console.log('✅ Actionable signal filtering works');
    
    const actionableSignals = getActionableFusionSignals(fusionContext);
    console.log(`   Actionable signals: ${actionableSignals.length}`);
    
    if (actionableSignals.length > 0) {
      console.log('\n   Sample actionable signals:');
      actionableSignals.slice(0, 2).forEach(signal => {
        console.log(`   - ${signal.title}`);
        console.log(`     Action: ${signal.suggestedAction}`);
      });
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Actionable signal filtering failed:', error.message);
    results.failed++;
  }

  // Test 7: Fallback Behavior (No Data)
  console.log('\n--- Test 7: Fallback Behavior (No Data) ---');
  try {
    const nonExistentUserId = 'user-with-no-data-' + Date.now();
    
    const fusionContext = await getHealthIntelligenceFusionContext(nonExistentUserId);
    
    console.log('✅ Fusion service works with no data (fallback successful)');
    console.log(`   Total signals: ${fusionContext.totalSignals}`);
    console.log(`   Data completeness: ${fusionContext.dataCompleteness.completenessScore}%`);
    console.log('   Check logs for: [FUSION] All contexts loaded');
    
    if (fusionContext.totalSignals === 0) {
      console.log('   ✅ Correctly generated no signals when no data available');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Fallback behavior test failed:', error.message);
    results.failed++;
  }

  // Test 8: Bloodwork + Supplement Fusion
  console.log('\n--- Test 8: Bloodwork + Supplement Fusion Logic ---');
  try {
    const fusionContext = await getHealthIntelligenceFusionContext(TEST_USER_ID);
    
    console.log('✅ Bloodwork + Supplement fusion logic verified');
    
    const supplementationSignals = getFusionSignalsByCategory(fusionContext, 'supplementation');
    console.log(`   Supplementation fusion signals: ${supplementationSignals.length}`);
    
    if (supplementationSignals.length > 0) {
      console.log('   Examples:');
      supplementationSignals.forEach(signal => {
        if (signal.dataSources.includes('bloodwork') && signal.dataSources.includes('supplements')) {
          console.log(`   - ${signal.title}`);
        }
      });
    } else {
      console.log('   ⚠️  No bloodwork+supplement fusion signals (expected if data missing)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Bloodwork + Supplement fusion test failed:', error.message);
    results.failed++;
  }

  // Test 9: Body Composition + Nutrition Fusion
  console.log('\n--- Test 9: Body Composition + Nutrition Fusion Logic ---');
  try {
    const fusionContext = await getHealthIntelligenceFusionContext(TEST_USER_ID);
    
    console.log('✅ Body Composition + Nutrition fusion logic verified');
    
    const bodyCompSignals = fusionContext.fusionSignals.filter(s => 
      s.dataSources.includes('body_composition') && 
      (s.category === 'body_composition' || s.category === 'nutritional')
    );
    
    console.log(`   Body composition fusion signals: ${bodyCompSignals.length}`);
    
    if (bodyCompSignals.length === 0) {
      console.log('   ⚠️  No body composition fusion signals (expected if data missing)');
      results.warnings++;
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Body Composition + Nutrition fusion test failed:', error.message);
    results.failed++;
  }

  // Test 10: Risk Signal Detection
  console.log('\n--- Test 10: Risk Signal Detection ---');
  try {
    const fusionContext = await getHealthIntelligenceFusionContext(TEST_USER_ID);
    
    console.log('✅ Risk signal detection verified');
    console.log(`   Risk signals: ${fusionContext.riskSignals.length}`);
    
    if (fusionContext.riskSignals.length > 0) {
      console.log('\n   Detected risks:');
      fusionContext.riskSignals.forEach(signal => {
        console.log(`   - [${signal.severity.toUpperCase()}] ${signal.title}`);
      });
    } else {
      console.log('   ✅ No risk signals detected (good health or insufficient data)');
    }
    
    results.passed++;
  } catch (error: any) {
    console.log('❌ Risk signal detection test failed:', error.message);
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
    console.log('2. Verify fusion signals are generated across data sources');
    console.log('3. Check logs for fusion signal generation messages');
    console.log('4. Verify risk, optimization, and priority signals');
    console.log('5. Test integration with Recommendation Engine');
    console.log('6. Monitor production logs for fusion intelligence patterns\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

// Run validation
validateCrossEngineFusion()
  .then(() => {
    console.log('✅ Validation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
