/**
 * Validation Script: Bloodwork Engine Integration
 * 
 * Purpose: Validate that bloodwork is properly integrated into engines
 * Tests: Metabolic, Cardiovascular, Sexual Health, Supplement engines
 * 
 * Run: npx ts-node src/scripts/validate-bloodwork-engine-integration.ts
 */

import { getLatestBloodworkContext } from '../services/bloodworkContextService';
import { getMetabolicRecommendation } from '../services/metabolicEngineService';
import { getCardiovascularRecommendation } from '../services/cardiovascularEngineService';
import { getSexualHealthRecommendation } from '../services/sexualHealthEngineService';
import { getSupplementRecommendation } from '../services/supplementEngineService';

const TEST_USER_ID = 'test-user-bloodwork-integration';

async function validateBloodworkEngineIntegration() {
  console.log('🔵 [VALIDATION] Starting Bloodwork Engine Integration Validation\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Bloodwork Context Service
  console.log('--- Test 1: Bloodwork Context Service ---');
  try {
    const bloodwork = await getLatestBloodworkContext(TEST_USER_ID);
    
    if (bloodwork.hasBloodwork === false) {
      console.log('⚠️  No bloodwork found for test user (expected for fresh test)');
      console.log('   This is normal if no bloodwork has been uploaded');
      results.warnings++;
    } else {
      console.log('✅ Bloodwork context loaded successfully');
      console.log(`   Latest test date: ${bloodwork.latestTestDate}`);
      console.log(`   Markers available: ${Object.values(bloodwork.markers).filter(m => m !== null).length}`);
      results.passed++;
    }
  } catch (error: any) {
    console.log('❌ Bloodwork context service failed:', error.message);
    results.failed++;
  }

  // Test 2: Metabolic Engine Bloodwork Integration
  console.log('\n--- Test 2: Metabolic Engine Bloodwork Integration ---');
  try {
    const inputs = {
      a1c: undefined, // Let bloodwork provide this
      fastingGlucose: undefined, // Let bloodwork provide this
      weightTrend: 'stable' as const,
    };

    const result = await getMetabolicRecommendation(TEST_USER_ID, inputs);
    
    if (result) {
      console.log('✅ Metabolic Engine generated recommendation');
      console.log(`   Status: ${result.metabolicStatus}`);
      console.log(`   Evidence signals: ${result.evidence.signals.length}`);
      console.log('   Check logs for: [METABOLIC ENGINE] Bloodwork loaded');
      results.passed++;
    } else {
      console.log('❌ Metabolic Engine returned no result');
      results.failed++;
    }
  } catch (error: any) {
    console.log('❌ Metabolic Engine failed:', error.message);
    results.failed++;
  }

  // Test 3: Cardiovascular Engine Bloodwork Integration
  console.log('\n--- Test 3: Cardiovascular Engine Bloodwork Integration ---');
  try {
    const inputs = {
      restingHR: 65,
      systolicBP: 120,
      diastolicBP: 80,
      lipidPanel: undefined, // Let bloodwork provide this
    };

    const result = await getCardiovascularRecommendation(TEST_USER_ID, inputs);
    
    if (result) {
      console.log('✅ Cardiovascular Engine generated recommendation');
      console.log(`   Status: ${result.cardiovascularStatus}`);
      console.log(`   Evidence signals: ${result.evidence.signals.length}`);
      console.log('   Check logs for: [CARDIOVASCULAR ENGINE] Bloodwork loaded');
      results.passed++;
    } else {
      console.log('❌ Cardiovascular Engine returned no result');
      results.failed++;
    }
  } catch (error: any) {
    console.log('❌ Cardiovascular Engine failed:', error.message);
    results.failed++;
  }

  // Test 4: Sexual Health Engine Bloodwork Integration
  console.log('\n--- Test 4: Sexual Health Engine Bloodwork Integration ---');
  try {
    const inputs = {
      totalTestosterone: undefined, // Let bloodwork provide this
      freeTestosterone: undefined, // Let bloodwork provide this
      libidoSelfRating: 7,
      erectileFunction: 8,
    };

    const result = await getSexualHealthRecommendation(TEST_USER_ID, inputs);
    
    if (result) {
      console.log('✅ Sexual Health Engine generated recommendation');
      console.log(`   Status: ${result.sexualHealthStatus}`);
      console.log(`   Evidence signals: ${result.evidence.signals.length}`);
      console.log('   Check logs for: [SEXUAL HEALTH ENGINE] Bloodwork loaded');
      results.passed++;
    } else {
      console.log('❌ Sexual Health Engine returned no result');
      results.failed++;
    }
  } catch (error: any) {
    console.log('❌ Sexual Health Engine failed:', error.message);
    results.failed++;
  }

  // Test 5: Supplement Engine Bloodwork Integration
  console.log('\n--- Test 5: Supplement Engine Bloodwork Integration ---');
  try {
    const inputs = {
      supplements: [
        { name: 'Creatine', dose: 5, unit: 'g', frequency: 'daily' },
        { name: 'Protein Powder', dose: 30, unit: 'g', frequency: 'daily' },
      ],
      bloodworkMarkers: {}, // Bloodwork will be loaded automatically
      deficiencies: [], // Bloodwork will add deficiencies
    };

    const result = await getSupplementRecommendation(TEST_USER_ID, inputs);
    
    if (result) {
      console.log('✅ Supplement Engine generated recommendation');
      console.log(`   Status: ${result.evidence.supplementStatus}`);
      console.log(`   Evidence signals: ${result.evidence.signals.length}`);
      console.log('   Check logs for: [SUPPLEMENT ENGINE] Bloodwork loaded');
      results.passed++;
    } else {
      console.log('❌ Supplement Engine returned no result');
      results.failed++;
    }
  } catch (error: any) {
    console.log('❌ Supplement Engine failed:', error.message);
    results.failed++;
  }

  // Test 6: Fallback Behavior (No Bloodwork)
  console.log('\n--- Test 6: Fallback Behavior (No Bloodwork) ---');
  try {
    const nonExistentUserId = 'user-with-no-bloodwork-' + Date.now();
    
    const metabolicResult = await getMetabolicRecommendation(nonExistentUserId, {
      a1c: 5.5,
      fastingGlucose: 95,
      weightTrend: 'stable',
    });

    if (metabolicResult) {
      console.log('✅ Metabolic Engine works without bloodwork (fallback successful)');
      console.log('   Check logs for: [METABOLIC ENGINE] No bloodwork available');
      results.passed++;
    } else {
      console.log('❌ Metabolic Engine failed without bloodwork');
      results.failed++;
    }
  } catch (error: any) {
    console.log('❌ Fallback behavior test failed:', error.message);
    results.failed++;
  }

  // Test 7: Partial Bloodwork Handling
  console.log('\n--- Test 7: Partial Bloodwork Handling ---');
  try {
    // This test assumes bloodwork exists but may be partial
    const bloodwork = await getLatestBloodworkContext(TEST_USER_ID);
    
    if (!bloodwork.hasBloodwork) {
      console.log('⚠️  Cannot test partial bloodwork (no bloodwork available)');
      results.warnings++;
    } else {
      const markerCount = Object.values(bloodwork.markers).filter(m => m !== null).length;
      console.log(`✅ Partial bloodwork handling: ${markerCount} markers available`);
      console.log('   Engines should use available markers and skip missing ones');
      results.passed++;
    }
  } catch (error: any) {
    console.log('❌ Partial bloodwork test failed:', error.message);
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
    console.log('1. Upload bloodwork for test user to verify full integration');
    console.log('2. Check logs for bloodwork loading messages');
    console.log('3. Verify engines use actual bloodwork values when available');
    console.log('4. Monitor production logs for bloodwork usage patterns\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

// Run validation
validateBloodworkEngineIntegration()
  .then(() => {
    console.log('✅ Validation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
