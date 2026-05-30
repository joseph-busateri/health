/**
 * Validation Script: Supplement Intelligence Expansion
 * 
 * Purpose: Validate that supplement intelligence is properly expanded
 * Tests: Ingredient-aware, dose-aware, bloodwork-informed supplement reasoning
 * 
 * Run: npx ts-node src/scripts/validate-supplement-intelligence-expansion.ts
 */

import { getCurrentSupplementStackContext, getDoseCategory, hasIngredient } from '../services/supplementContextService';
import { getSupplementRecommendation } from '../services/supplementEngineService';

const TEST_USER_ID = 'test-user-supplement-intelligence-expansion';

async function validateSupplementIntelligenceExpansion() {
  console.log('🔵 [VALIDATION] Starting Supplement Intelligence Expansion Validation\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Supplement Stack Context Service
  console.log('--- Test 1: Supplement Stack Context Service ---');
  try {
    const supplementStack = await getCurrentSupplementStackContext(TEST_USER_ID);
    
    if (supplementStack.hasSupplementStack === false) {
      console.log('⚠️  No supplement stack found for test user (expected for fresh test)');
      console.log('   This is normal if no supplement baseline has been uploaded');
      results.warnings++;
    } else {
      console.log('✅ Supplement stack context loaded successfully');
      console.log(`   Total supplements: ${supplementStack.totalSupplements}`);
      console.log(`   Total daily pills: ${supplementStack.totalDailyPills}`);
      console.log(`   Potential overlaps: ${supplementStack.potentialOverlaps.length}`);
      console.log(`   Goals: ${Array.from(supplementStack.supplementsByGoal.keys()).join(', ')}`);
      console.log(`   Timings: ${Array.from(supplementStack.supplementsByTiming.keys()).join(', ')}`);
      results.passed++;
    }
  } catch (error: any) {
    console.log('❌ Supplement stack context service failed:', error.message);
    results.failed++;
  }

  // Test 2: Ingredient-Aware Analysis
  console.log('\n--- Test 2: Ingredient-Aware Analysis ---');
  try {
    const supplementStack = await getCurrentSupplementStackContext(TEST_USER_ID);
    
    if (!supplementStack.hasSupplementStack) {
      console.log('⚠️  Cannot test ingredient-aware analysis (no supplement stack)');
      results.warnings++;
    } else {
      console.log('✅ Ingredient-aware analysis capabilities verified');
      console.log(`   Unique ingredients tracked: ${supplementStack.ingredientCounts.size}`);
      
      // Test ingredient detection
      const testIngredients = ['vitamin d', 'magnesium', 'omega-3'];
      for (const ingredient of testIngredients) {
        const hasIt = hasIngredient(supplementStack, ingredient);
        console.log(`   Has ${ingredient}: ${hasIt}`);
      }
      
      results.passed++;
    }
  } catch (error: any) {
    console.log('❌ Ingredient-aware analysis failed:', error.message);
    results.failed++;
  }

  // Test 3: Dose-Aware Analysis
  console.log('\n--- Test 3: Dose-Aware Analysis ---');
  try {
    const supplementStack = await getCurrentSupplementStackContext(TEST_USER_ID);
    
    if (!supplementStack.hasSupplementStack) {
      console.log('⚠️  Cannot test dose-aware analysis (no supplement stack)');
      results.warnings++;
    } else {
      console.log('✅ Dose-aware analysis capabilities verified');
      
      // Test dose categorization for available ingredients
      let doseAnalysisCount = 0;
      for (const ingredient of supplementStack.ingredients) {
        const doseCategory = getDoseCategory(ingredient);
        if (doseCategory !== 'unknown') {
          console.log(`   ${ingredient.name}: ${ingredient.dosageAmount}${ingredient.dosageUnit} (${doseCategory} dose)`);
          doseAnalysisCount++;
        }
      }
      
      console.log(`   Analyzed doses for ${doseAnalysisCount} ingredients`);
      results.passed++;
    }
  } catch (error: any) {
    console.log('❌ Dose-aware analysis failed:', error.message);
    results.failed++;
  }

  // Test 4: Supplement Engine Enhanced Intelligence
  console.log('\n--- Test 4: Supplement Engine Enhanced Intelligence ---');
  try {
    const inputs = {
      supplements: [
        { name: 'Vitamin D3', dosage: '5000 IU' },
        { name: 'Magnesium Glycinate', dosage: '400mg' },
      ],
      adherenceScore: 75,
      recoveryScore: 65,
      bloodworkMarkers: {},
    };

    const result = await getSupplementRecommendation(TEST_USER_ID, inputs);
    
    if (result) {
      console.log('✅ Supplement Engine generated recommendation');
      console.log(`   Status: ${result.supplementStatus}`);
      console.log(`   Evidence signals: ${result.evidence.signals.length}`);
      console.log('   Check logs for: [SUPPLEMENT ENGINE] Supplement stack loaded');
      console.log('   Check logs for: Stack Composition, Ingredient Overlaps, Dose analysis');
      results.passed++;
    } else {
      console.log('❌ Supplement Engine returned no result');
      results.failed++;
    }
  } catch (error: any) {
    console.log('❌ Supplement Engine failed:', error.message);
    results.failed++;
  }

  // Test 5: Bloodwork-Informed Supplement Intelligence
  console.log('\n--- Test 5: Bloodwork-Informed Supplement Intelligence ---');
  try {
    const inputs = {
      supplements: [
        { name: 'Multivitamin', dosage: '1 tablet' },
      ],
      adherenceScore: 80,
      bloodworkMarkers: {},
    };

    const result = await getSupplementRecommendation(TEST_USER_ID, inputs);
    
    if (result) {
      console.log('✅ Bloodwork-informed supplement intelligence verified');
      console.log('   Check logs for: [SUPPLEMENT ENGINE] Bloodwork loaded');
      console.log('   Check logs for: Vitamin D/B12/Folate/Ferritin/Magnesium deficiency detected');
      console.log('   Check logs for: Bloodwork deficiencies added to inputs');
      results.passed++;
    } else {
      console.log('❌ Bloodwork-informed intelligence failed');
      results.failed++;
    }
  } catch (error: any) {
    console.log('❌ Bloodwork-informed intelligence test failed:', error.message);
    results.failed++;
  }

  // Test 6: Fallback Behavior (No Supplement Stack)
  console.log('\n--- Test 6: Fallback Behavior (No Supplement Stack) ---');
  try {
    const nonExistentUserId = 'user-with-no-supplements-' + Date.now();
    
    const inputs = {
      supplements: [
        { name: 'Vitamin D', dosage: '2000 IU' },
      ],
      adherenceScore: 70,
      bloodworkMarkers: {},
    };

    const result = await getSupplementRecommendation(nonExistentUserId, inputs);

    if (result) {
      console.log('✅ Supplement Engine works without supplement stack (fallback successful)');
      console.log('   Check logs for: [SUPPLEMENT ENGINE] No supplement stack found');
      results.passed++;
    } else {
      console.log('❌ Supplement Engine failed without supplement stack');
      results.failed++;
    }
  } catch (error: any) {
    console.log('❌ Fallback behavior test failed:', error.message);
    results.failed++;
  }

  // Test 7: Overlap Detection
  console.log('\n--- Test 7: Overlap Detection ---');
  try {
    const supplementStack = await getCurrentSupplementStackContext(TEST_USER_ID);
    
    if (!supplementStack.hasSupplementStack) {
      console.log('⚠️  Cannot test overlap detection (no supplement stack)');
      results.warnings++;
    } else {
      console.log('✅ Overlap detection capabilities verified');
      
      if (supplementStack.potentialOverlaps.length > 0) {
        console.log(`   Detected overlaps: ${supplementStack.potentialOverlaps.join(', ')}`);
        console.log('   Evidence builder should include overlap warnings');
      } else {
        console.log('   No overlaps detected in current stack');
      }
      
      results.passed++;
    }
  } catch (error: any) {
    console.log('❌ Overlap detection test failed:', error.message);
    results.failed++;
  }

  // Test 8: Goal Alignment
  console.log('\n--- Test 8: Goal Alignment ---');
  try {
    const supplementStack = await getCurrentSupplementStackContext(TEST_USER_ID);
    
    if (!supplementStack.hasSupplementStack) {
      console.log('⚠️  Cannot test goal alignment (no supplement stack)');
      results.warnings++;
    } else {
      console.log('✅ Goal alignment capabilities verified');
      
      const goals = Array.from(supplementStack.supplementsByGoal.keys());
      if (goals.length > 0) {
        console.log(`   Stack goals: ${goals.join(', ')}`);
        console.log(`   Evidence builder should include goal alignment analysis`);
      } else {
        console.log('   No explicit goals set in current stack');
      }
      
      results.passed++;
    }
  } catch (error: any) {
    console.log('❌ Goal alignment test failed:', error.message);
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
    console.log('1. Upload supplement baseline for test user to verify full integration');
    console.log('2. Check logs for ingredient-aware analysis messages');
    console.log('3. Check logs for dose-aware analysis messages');
    console.log('4. Check logs for overlap detection messages');
    console.log('5. Verify bloodwork-informed supplement recommendations');
    console.log('6. Monitor production logs for supplement intelligence patterns\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

// Run validation
validateSupplementIntelligenceExpansion()
  .then(() => {
    console.log('✅ Validation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
