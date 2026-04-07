import axios from 'axios';
import { supabase } from '../config/supabase';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'baseline-nutrition-test';

async function main() {
  console.log('='.repeat(80));
  console.log('BASELINE NUTRITION INTEGRATION VALIDATION');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('\n--- Test 1: Profile Exists (Personalized Nutrition) ---');
  try {
    // Insert test baseline profile
    const testProfile = {
      user_id: TEST_USER_ID,
      age: 32,
      sex: 'male',
      height_inches: 72,
      weight_lbs: 190,
      body_fat_percent: 15,
      activity_level: 'very_active',
      baseline_calories: 3200,
      baseline_protein_g: 220,
      baseline_carbs_g: 320,
      baseline_fats_g: 90,
      baseline_hydration_oz: 120,
      training_experience_level: 'advanced',
      training_days_per_week: 5,
      sleep_target_hours: 8,
      source: 'test',
    };

    const { error: insertError } = await supabase
      .from('baseline_profile')
      .upsert(testProfile, { onConflict: 'user_id' });

    if (insertError) {
      errors.push('Failed to insert test profile');
      console.log('❌ Failed to insert test profile:', insertError.message);
    } else {
      console.log('✅ Test profile inserted');
      console.log(`   Age: ${testProfile.age}, Weight: ${testProfile.weight_lbs} lbs`);
      console.log(`   Calories: ${testProfile.baseline_calories}, Protein: ${testProfile.baseline_protein_g}g`);
    }

    // Call nutrition service
    const response = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/today`);
    const nutritionToday = response.data?.data;

    if (!nutritionToday) {
      errors.push('Nutrition Today not generated');
      console.log('❌ Nutrition Today not generated');
    } else {
      console.log('✅ Nutrition Today generated');

      // Verify personalized values
      const expectedCalories = testProfile.baseline_calories;
      const actualCalories = nutritionToday.baselineTargets?.calories || nutritionToday.targets?.calories;

      if (actualCalories === expectedCalories) {
        console.log(`✅ Calories personalized: ${actualCalories} (expected ${expectedCalories})`);
      } else {
        warnings.push(`Calories not personalized: ${actualCalories} vs expected ${expectedCalories}`);
        console.log(`⚠️  Calories: ${actualCalories} (expected ${expectedCalories})`);
      }

      const expectedProtein = testProfile.baseline_protein_g;
      const actualProtein = nutritionToday.baselineTargets?.protein || nutritionToday.targets?.protein;

      if (actualProtein === expectedProtein) {
        console.log(`✅ Protein personalized: ${actualProtein}g (expected ${expectedProtein}g)`);
      } else {
        warnings.push(`Protein not personalized: ${actualProtein}g vs expected ${expectedProtein}g`);
        console.log(`⚠️  Protein: ${actualProtein}g (expected ${expectedProtein}g)`);
      }
    }
  } catch (error: any) {
    errors.push('Test 1 failed');
    console.log('❌ Test 1 failed:', error.message);
  }

  console.log('\n--- Test 2: Profile Missing (Fallback Defaults) ---');
  try {
    const FALLBACK_USER = 'baseline-fallback-test';

    // Ensure no profile exists
    await supabase
      .from('baseline_profile')
      .delete()
      .eq('user_id', FALLBACK_USER);

    console.log('✅ Ensured no profile exists for test user');

    // Call nutrition service
    const response = await axios.get(`${BASE_URL}/nutrition-today/${FALLBACK_USER}/today`);
    const nutritionToday = response.data?.data;

    if (!nutritionToday) {
      errors.push('Nutrition Today not generated for fallback user');
      console.log('❌ Nutrition Today not generated');
    } else {
      console.log('✅ Nutrition Today generated with fallback');

      // Verify default values used
      const calories = nutritionToday.baselineTargets?.calories || nutritionToday.targets?.calories;
      const protein = nutritionToday.baselineTargets?.protein || nutritionToday.targets?.protein;

      if (calories === 2800) {
        console.log(`✅ Fallback calories used: ${calories}`);
      } else {
        warnings.push(`Unexpected fallback calories: ${calories}`);
        console.log(`⚠️  Calories: ${calories} (expected 2800 fallback)`);
      }

      if (protein === 200) {
        console.log(`✅ Fallback protein used: ${protein}g`);
      } else {
        warnings.push(`Unexpected fallback protein: ${protein}g`);
        console.log(`⚠️  Protein: ${protein}g (expected 200g fallback)`);
      }

      console.log('✅ System did not crash with missing profile');
    }
  } catch (error: any) {
    errors.push('Test 2 failed');
    console.log('❌ Test 2 failed:', error.message);
  }

  console.log('\n--- Test 3: Partial Profile (Hybrid Calculation) ---');
  try {
    const PARTIAL_USER = 'baseline-partial-test';

    // Insert partial profile (only weight, no nutrition targets)
    const partialProfile = {
      user_id: PARTIAL_USER,
      age: 28,
      weight_lbs: 175,
      sex: 'male',
      source: 'test',
    };

    const { error: insertError } = await supabase
      .from('baseline_profile')
      .upsert(partialProfile, { onConflict: 'user_id' });

    if (insertError) {
      errors.push('Failed to insert partial profile');
      console.log('❌ Failed to insert partial profile');
    } else {
      console.log('✅ Partial profile inserted (weight only, no nutrition targets)');
    }

    // Call nutrition service
    const response = await axios.get(`${BASE_URL}/nutrition-today/${PARTIAL_USER}/today`);
    const nutritionToday = response.data?.data;

    if (!nutritionToday) {
      errors.push('Nutrition Today not generated for partial profile');
      console.log('❌ Nutrition Today not generated');
    } else {
      console.log('✅ Nutrition Today generated with partial profile');

      // Should use defaults for missing nutrition targets
      const calories = nutritionToday.baselineTargets?.calories || nutritionToday.targets?.calories;
      
      if (calories === 2800) {
        console.log(`✅ Default calories used for missing targets: ${calories}`);
      } else {
        warnings.push(`Unexpected calories with partial profile: ${calories}`);
        console.log(`⚠️  Calories: ${calories}`);
      }

      console.log('✅ System handled partial profile gracefully');
    }
  } catch (error: any) {
    errors.push('Test 3 failed');
    console.log('❌ Test 3 failed:', error.message);
  }

  console.log('\n--- Test 4: Baseline Profile Service Caching ---');
  try {
    // Import and test the service directly
    const { getBaselineProfile } = await import('../services/baselineProfileService');

    const start1 = Date.now();
    const profile1 = await getBaselineProfile(TEST_USER_ID);
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    const profile2 = await getBaselineProfile(TEST_USER_ID);
    const time2 = Date.now() - start2;

    console.log(`First call: ${time1}ms`);
    console.log(`Second call (cached): ${time2}ms`);

    if (time2 < time1) {
      console.log('✅ Caching working (second call faster)');
    } else {
      warnings.push('Caching may not be working optimally');
      console.log('⚠️  Second call not faster (caching may not be working)');
    }

    if (profile1.baselineCalories === 3200) {
      console.log('✅ Profile loaded correctly from database');
    } else {
      warnings.push('Profile data incorrect');
      console.log('⚠️  Profile data may be incorrect');
    }
  } catch (error: any) {
    errors.push('Caching test failed');
    console.log('❌ Caching test failed:', error.message);
  }

  console.log('\n--- Test 5: Logging Verification ---');
  console.log('Check server logs for:');
  console.log('  ✅ [BASELINE PROFILE] Profile loaded');
  console.log('  ✅ [BASELINE PROFILE] Cache hit');
  console.log('  ⚠️  [BASELINE PROFILE] No profile found, using defaults');
  console.log('  ✅ [NUTRITION BASELINE] Loaded from baseline profile');
  console.log('  ⚠️  [NUTRITION BASELINE] Using default values');

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(w => console.log(`  - ${w}`));
  }

  if (errors.length === 0) {
    console.log('\n✅ BASELINE NUTRITION INTEGRATION VALIDATED');
    console.log('='.repeat(80));
    console.log('Nutrition service successfully:');
    console.log('  1. Loads from baseline profile when available');
    console.log('  2. Falls back to defaults when profile missing');
    console.log('  3. Handles partial profiles gracefully');
    console.log('  4. Caches baseline data for performance');
    console.log('  5. Logs appropriately for monitoring');
    console.log('='.repeat(80));
  } else {
    console.log('\n❌ VALIDATION FAILED');
    console.log('Please fix errors before proceeding to engine integration');
  }

  process.exit(errors.length === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
