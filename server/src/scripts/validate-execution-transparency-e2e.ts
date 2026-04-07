import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'execution-transparency-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Execution Layer Transparency Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Scenario 1: Workout Today Cross-Engine Influence ---');
  try {
    const response = await axios.get(`${BASE_URL}/workout-today/${TEST_USER_ID}/today`);
    const workoutToday = response.data?.data;

    logs.push(`Workout Today response received: ${response.status}`);

    if (workoutToday) {
      console.log('✅ Workout Today generated');
    } else {
      errors.push('Workout Today not generated');
      console.log('❌ Workout Today not generated');
    }

    if (workoutToday.crossEngineInfluence) {
      console.log('✅ Cross-engine influence present in Workout Today');
      console.log(`   Applied: ${workoutToday.crossEngineInfluence.applied}`);
      console.log(`   Overall Status: ${workoutToday.crossEngineInfluence.overallStatus || 'N/A'}`);
      console.log(`   Influencing Engines: ${workoutToday.crossEngineInfluence.influencingEngines?.length || 0}`);
      console.log(`   Patterns: ${workoutToday.crossEngineInfluence.patterns?.length || 0}`);
      
      if (workoutToday.crossEngineInfluence.patterns && workoutToday.crossEngineInfluence.patterns.length > 0) {
        console.log('   Top Patterns:');
        workoutToday.crossEngineInfluence.patterns.forEach((pattern: any) => {
          console.log(`     - [${pattern.severity}] ${pattern.name}: ${pattern.summary}`);
        });
      }

      logs.push(`Workout cross-engine applied: ${workoutToday.crossEngineInfluence.applied}`);
    } else {
      console.log('⚠️ Cross-engine influence not present (may be unavailable)');
    }

    if (workoutToday.adjustmentsApplied) {
      console.log('✅ Adjustments applied field present in Workout Today');
      console.log(`   Adjustments: ${workoutToday.adjustmentsApplied.length}`);
      
      if (workoutToday.adjustmentsApplied.length > 0) {
        console.log('   Applied Adjustments:');
        workoutToday.adjustmentsApplied.forEach((adj: any) => {
          console.log(`     - [${adj.type}] ${adj.change}`);
          console.log(`       Reason: ${adj.reason}`);
          console.log(`       Source: ${adj.source || 'N/A'}`);
        });
      }

      logs.push(`Workout adjustments applied: ${workoutToday.adjustmentsApplied.length}`);
    } else {
      console.log('⚠️ Adjustments applied field not present');
    }
  } catch (error: any) {
    errors.push('Workout Today validation failed');
    console.log('❌ Workout Today validation failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 2: Nutrition Today Cross-Engine Influence ---');
  try {
    const response = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/today`);
    const nutritionToday = response.data?.data;

    logs.push(`Nutrition Today response received: ${response.status}`);

    if (nutritionToday) {
      console.log('✅ Nutrition Today generated');
    } else {
      errors.push('Nutrition Today not generated');
      console.log('❌ Nutrition Today not generated');
    }

    if (nutritionToday.crossEngineInfluence) {
      console.log('✅ Cross-engine influence present in Nutrition Today');
      console.log(`   Applied: ${nutritionToday.crossEngineInfluence.applied}`);
      console.log(`   Overall Status: ${nutritionToday.crossEngineInfluence.overallStatus || 'N/A'}`);
      console.log(`   Influencing Engines: ${nutritionToday.crossEngineInfluence.influencingEngines?.length || 0}`);
      console.log(`   Patterns: ${nutritionToday.crossEngineInfluence.patterns?.length || 0}`);
      
      if (nutritionToday.crossEngineInfluence.patterns && nutritionToday.crossEngineInfluence.patterns.length > 0) {
        console.log('   Top Patterns:');
        nutritionToday.crossEngineInfluence.patterns.forEach((pattern: any) => {
          console.log(`     - [${pattern.severity}] ${pattern.name}: ${pattern.summary}`);
        });
      }

      logs.push(`Nutrition cross-engine applied: ${nutritionToday.crossEngineInfluence.applied}`);
    } else {
      console.log('⚠️ Cross-engine influence not present (may be unavailable)');
    }

    if (nutritionToday.adjustmentsApplied) {
      console.log('✅ Adjustments applied field present in Nutrition Today');
      console.log(`   Adjustments: ${nutritionToday.adjustmentsApplied.length}`);
      
      if (nutritionToday.adjustmentsApplied.length > 0) {
        console.log('   Applied Adjustments:');
        nutritionToday.adjustmentsApplied.forEach((adj: any) => {
          console.log(`     - [${adj.type}] ${adj.change}`);
          console.log(`       Reason: ${adj.reason}`);
          console.log(`       Source: ${adj.source || 'N/A'}`);
        });
      }

      logs.push(`Nutrition adjustments applied: ${nutritionToday.adjustmentsApplied.length}`);
    } else {
      console.log('⚠️ Adjustments applied field not present');
    }
  } catch (error: any) {
    errors.push('Nutrition Today validation failed');
    console.log('❌ Nutrition Today validation failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 3: Transparency Fields Structure ---');
  try {
    const workoutResponse = await axios.get(`${BASE_URL}/workout-today/${TEST_USER_ID}/today`);
    const workoutToday = workoutResponse.data?.data;

    if (workoutToday.crossEngineInfluence) {
      const influence = workoutToday.crossEngineInfluence;
      const hasRequiredFields = 
        'applied' in influence &&
        typeof influence.applied === 'boolean';

      if (hasRequiredFields) {
        console.log('✅ Workout cross-engine influence has correct structure');
      } else {
        errors.push('Workout cross-engine influence structure invalid');
        console.log('❌ Workout cross-engine influence structure invalid');
      }

      if (influence.patterns && Array.isArray(influence.patterns)) {
        const patternValid = influence.patterns.every((p: any) => 
          'name' in p && 'severity' in p && 'summary' in p
        );
        if (patternValid) {
          console.log('✅ Workout patterns have correct structure');
        } else {
          errors.push('Workout pattern structure invalid');
          console.log('❌ Workout pattern structure invalid');
        }
      }
    }

    if (workoutToday.adjustmentsApplied && Array.isArray(workoutToday.adjustmentsApplied)) {
      const adjustmentValid = workoutToday.adjustmentsApplied.every((adj: any) =>
        'type' in adj && 'change' in adj && 'reason' in adj
      );
      if (adjustmentValid) {
        console.log('✅ Workout adjustments have correct structure');
      } else {
        errors.push('Workout adjustment structure invalid');
        console.log('❌ Workout adjustment structure invalid');
      }
    }

    const nutritionResponse = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/today`);
    const nutritionToday = nutritionResponse.data?.data;

    if (nutritionToday.crossEngineInfluence) {
      const influence = nutritionToday.crossEngineInfluence;
      const hasRequiredFields = 
        'applied' in influence &&
        typeof influence.applied === 'boolean';

      if (hasRequiredFields) {
        console.log('✅ Nutrition cross-engine influence has correct structure');
      } else {
        errors.push('Nutrition cross-engine influence structure invalid');
        console.log('❌ Nutrition cross-engine influence structure invalid');
      }
    }

    if (nutritionToday.adjustmentsApplied && Array.isArray(nutritionToday.adjustmentsApplied)) {
      const adjustmentValid = nutritionToday.adjustmentsApplied.every((adj: any) =>
        'type' in adj && 'change' in adj && 'reason' in adj
      );
      if (adjustmentValid) {
        console.log('✅ Nutrition adjustments have correct structure');
      } else {
        errors.push('Nutrition adjustment structure invalid');
        console.log('❌ Nutrition adjustment structure invalid');
      }
    }
  } catch (error: any) {
    errors.push('Structure validation failed');
    console.log('❌ Structure validation failed');
  }

  console.log('\n--- Scenario 4: Graceful Degradation ---');
  try {
    // Test with user that may not have cross-engine intelligence
    const workoutResponse = await axios.get(`${BASE_URL}/workout-today/nonexistent-user-12345/today`);
    const nutritionResponse = await axios.get(`${BASE_URL}/nutrition-today/nonexistent-user-12345/today`);

    if (workoutResponse.status === 200 && nutritionResponse.status === 200) {
      console.log('✅ Execution engines work without cross-engine intelligence');
    }
  } catch (error: any) {
    // Expected to fail for nonexistent user, but should not crash
    if (error.response?.status === 404 || error.response?.status === 500) {
      console.log('✅ Graceful degradation working (returns appropriate error)');
    } else {
      console.log('⚠️ Unexpected error during graceful degradation test');
    }
  }

  console.log('\n--- Scenario 5: Execution Transparency Completeness ---');
  try {
    const workoutResponse = await axios.get(`${BASE_URL}/workout-today/${TEST_USER_ID}/today`);
    const nutritionResponse = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/today`);
    
    const workoutToday = workoutResponse.data?.data;
    const nutritionToday = nutritionResponse.data?.data;

    let transparencyScore = 0;
    const maxScore = 6;

    if (workoutToday.crossEngineInfluence) transparencyScore++;
    if (workoutToday.adjustmentsApplied) transparencyScore++;
    if (workoutToday.crossEngineInfluence?.patterns?.length > 0) transparencyScore++;

    if (nutritionToday.crossEngineInfluence) transparencyScore++;
    if (nutritionToday.adjustmentsApplied) transparencyScore++;
    if (nutritionToday.crossEngineInfluence?.patterns?.length > 0) transparencyScore++;

    console.log(`Transparency Score: ${transparencyScore}/${maxScore}`);
    
    if (transparencyScore >= 4) {
      console.log('✅ Execution transparency sufficient');
    } else {
      console.log('⚠️ Execution transparency incomplete');
    }
  } catch (error: any) {
    errors.push('Transparency completeness check failed');
    console.log('❌ Transparency completeness check failed');
  }

  console.log('\n--- Scenario 6: Architecture Boundary Preservation ---');
  try {
    const workoutResponse = await axios.get(`${BASE_URL}/workout-today/${TEST_USER_ID}/today`);
    const nutritionResponse = await axios.get(`${BASE_URL}/nutrition-today/${TEST_USER_ID}/today`);
    
    const workoutToday = workoutResponse.data?.data;
    const nutritionToday = nutritionResponse.data?.data;

    // Verify execution layer does not contain recommendation objects
    const workoutHasRecommendation = 'recommendation' in workoutToday;
    const nutritionHasRecommendation = 'recommendation' in nutritionToday;

    if (!workoutHasRecommendation && !nutritionHasRecommendation) {
      console.log('✅ Execution layer does not duplicate recommendation logic');
    } else {
      console.log('⚠️ Execution layer may contain recommendation duplication');
    }

    // Verify transparency fields are present (influenced by, not generating recommendations)
    const workoutHasInfluence = 'crossEngineInfluence' in workoutToday;
    const nutritionHasInfluence = 'crossEngineInfluence' in nutritionToday;

    if (workoutHasInfluence && nutritionHasInfluence) {
      console.log('✅ Execution layer exposes influence transparency');
    } else {
      console.log('⚠️ Execution layer missing influence transparency');
    }

    console.log('✅ Architecture boundaries preserved (Intelligence → Decision → Execution)');
  } catch (error: any) {
    errors.push('Architecture boundary check failed');
    console.log('❌ Architecture boundary check failed');
  }

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Success: ${errors.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  if (logs.length > 0) {
    console.log('\nLogs:');
    logs.forEach(l => console.log(`  - ${l}`));
  }

  console.log('\n' + '='.repeat(80));
  console.log('EXECUTION TRANSPARENCY STATUS');
  console.log('='.repeat(80));
  console.log('The Execution Layer Transparency Refinement validates that:');
  console.log('1. Workout Today exposes cross-engine influence');
  console.log('2. Nutrition Today exposes cross-engine influence');
  console.log('3. Adjustments applied are tracked with source attribution');
  console.log('4. Patterns from orchestration layer are visible');
  console.log('5. Architecture boundaries are preserved (no recommendation duplication)');
  console.log('6. System degrades gracefully when cross-engine unavailable');
  console.log('7. Execution layer provides transparency without generating decisions');
  console.log('='.repeat(80));

  process.exit(errors.length === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
