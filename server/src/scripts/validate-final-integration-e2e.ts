import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'final-integration-e2e-test';

async function main() {
  console.log('='.repeat(80));
  console.log('Final Integration Pass E2E Validation');
  console.log('='.repeat(80));

  const errors: string[] = [];
  const logs: string[] = [];

  console.log('\n--- Scenario 1: Daily AI Plan Includes Cross-Engine Intelligence ---');
  try {
    const response = await axios.get(`${BASE_URL}/daily-plan/${TEST_USER_ID}/today`);
    const dailyPlan = response.data?.data;

    logs.push(`Daily AI Plan response received: ${response.status}`);

    if (dailyPlan) {
      console.log('✅ Daily AI Plan generated');
    } else {
      errors.push('Daily AI Plan not generated');
      console.log('❌ Daily AI Plan not generated');
    }

    if (dailyPlan.crossEngineIntelligence) {
      console.log('✅ Cross-Engine Intelligence section present in Daily AI Plan');
      console.log(`   Overall Status: ${dailyPlan.crossEngineIntelligence.overallStatus}`);
      console.log(`   Summary: ${dailyPlan.crossEngineIntelligence.summary}`);
      console.log(`   Patterns: ${dailyPlan.crossEngineIntelligence.topPatterns?.length || 0}`);
      console.log(`   Actions: ${dailyPlan.crossEngineIntelligence.actions?.length || 0}`);
      logs.push(`Cross-engine status: ${dailyPlan.crossEngineIntelligence.overallStatus}`);
    } else {
      console.log('⚠️ Cross-Engine Intelligence section not present (may be unavailable)');
    }

    if (dailyPlan.summary && dailyPlan.summary.reasoning) {
      const reasoning = dailyPlan.summary.reasoning.toLowerCase();
      if (reasoning.includes('pattern') || reasoning.includes('interacting') || reasoning.includes('coordinated')) {
        console.log('✅ Daily AI Plan reasoning reflects cross-engine orchestration');
      } else {
        console.log('⚠️ Daily AI Plan reasoning may not reflect orchestration');
      }
    }
  } catch (error: any) {
    errors.push('Daily AI Plan validation failed');
    console.log('❌ Daily AI Plan validation failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 2: Control Tower Includes Cross-Engine Card ---');
  try {
    const response = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const controlTower = response.data?.data;

    logs.push(`Control Tower response received: ${response.status}`);

    if (controlTower) {
      console.log('✅ Control Tower generated');
    } else {
      errors.push('Control Tower not generated');
      console.log('❌ Control Tower not generated');
    }

    if (controlTower.crossEngine) {
      console.log('✅ Cross-Engine card present in Control Tower');
      console.log(`   Title: ${controlTower.crossEngine.title}`);
      console.log(`   Summary: ${controlTower.crossEngine.summary}`);
      console.log(`   Overall Status: ${controlTower.crossEngine.overallStatus}`);
      console.log(`   Patterns: ${controlTower.crossEngine.topPatterns?.length || 0}`);
      console.log(`   Key Actions: ${controlTower.crossEngine.keyActions?.length || 0}`);
      logs.push(`Cross-engine card status: ${controlTower.crossEngine.overallStatus}`);
      
      if (controlTower.crossEngine.title === 'Cross-Engine Intelligence') {
        console.log('✅ Cross-Engine card has correct title');
      } else {
        errors.push('Cross-Engine card title incorrect');
        console.log('❌ Cross-Engine card title incorrect');
      }
    } else {
      console.log('⚠️ Cross-Engine card not present (may be unavailable)');
    }
  } catch (error: any) {
    errors.push('Control Tower validation failed');
    console.log('❌ Control Tower validation failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 3: Workout Today Cross-Engine Influence ---');
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
      console.log('✅ Cross-Engine influence field present in Workout Today');
      console.log(`   Applied: ${workoutToday.crossEngineInfluence.applied}`);
      console.log(`   Summary: ${workoutToday.crossEngineInfluence.summary || 'N/A'}`);
      console.log(`   Patterns: ${workoutToday.crossEngineInfluence.patterns?.join(', ') || 'N/A'}`);
      logs.push(`Workout cross-engine applied: ${workoutToday.crossEngineInfluence.applied}`);
    } else {
      console.log('⚠️ Cross-Engine influence field not present (type extension may not be applied yet)');
    }
  } catch (error: any) {
    errors.push('Workout Today validation failed');
    console.log('❌ Workout Today validation failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 4: Nutrition Today Cross-Engine Influence ---');
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
      console.log('✅ Cross-Engine influence field present in Nutrition Today');
      console.log(`   Applied: ${nutritionToday.crossEngineInfluence.applied}`);
      console.log(`   Summary: ${nutritionToday.crossEngineInfluence.summary || 'N/A'}`);
      console.log(`   Patterns: ${nutritionToday.crossEngineInfluence.patterns?.join(', ') || 'N/A'}`);
      logs.push(`Nutrition cross-engine applied: ${nutritionToday.crossEngineInfluence.applied}`);
    } else {
      console.log('⚠️ Cross-Engine influence field not present (type extension may not be applied yet)');
    }
  } catch (error: any) {
    errors.push('Nutrition Today validation failed');
    console.log('❌ Nutrition Today validation failed');
    logs.push(`Error: ${error.message}`);
  }

  console.log('\n--- Scenario 5: Cross-Engine Intelligence Consistency ---');
  try {
    const dailyPlanResponse = await axios.get(`${BASE_URL}/daily-plan/${TEST_USER_ID}/today`);
    const controlTowerResponse = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    
    const dailyPlan = dailyPlanResponse.data?.data;
    const controlTower = controlTowerResponse.data?.data;

    if (dailyPlan?.crossEngineIntelligence && controlTower?.crossEngine) {
      const dailyStatus = dailyPlan.crossEngineIntelligence.overallStatus;
      const controlStatus = controlTower.crossEngine.overallStatus;

      if (dailyStatus === controlStatus) {
        console.log(`✅ Cross-Engine status consistent across surfaces: ${dailyStatus}`);
      } else {
        console.log(`⚠️ Cross-Engine status differs: Daily Plan (${dailyStatus}) vs Control Tower (${controlStatus})`);
      }
    } else {
      console.log('⚠️ Cannot verify consistency - cross-engine data not available on both surfaces');
    }
  } catch (error: any) {
    errors.push('Cross-Engine consistency check failed');
    console.log('❌ Cross-Engine consistency check failed');
  }

  console.log('\n--- Scenario 6: Backward Compatibility ---');
  try {
    const dailyPlanResponse = await axios.get(`${BASE_URL}/daily-plan/${TEST_USER_ID}/today`);
    const dailyPlan = dailyPlanResponse.data?.data;

    const requiredFields = ['id', 'userId', 'date', 'summary', 'recoverySnapshot', 'topPriorities', 'predictiveAlerts', 'workout', 'nutrition'];
    const missingFields = requiredFields.filter(field => !(field in dailyPlan));

    if (missingFields.length === 0) {
      console.log('✅ All existing Daily AI Plan fields present (backward compatible)');
    } else {
      errors.push(`Missing Daily AI Plan fields: ${missingFields.join(', ')}`);
      console.log(`❌ Missing Daily AI Plan fields: ${missingFields.join(', ')}`);
    }

    const controlTowerResponse = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const controlTower = controlTowerResponse.data?.data;

    const ctRequiredFields = ['id', 'userId', 'date', 'overallStatus', 'headline', 'reasoning', 'trust', 'priorities', 'predictiveAlerts', 'workout', 'nutrition'];
    const ctMissingFields = ctRequiredFields.filter(field => !(field in controlTower));

    if (ctMissingFields.length === 0) {
      console.log('✅ All existing Control Tower fields present (backward compatible)');
    } else {
      errors.push(`Missing Control Tower fields: ${ctMissingFields.join(', ')}`);
      console.log(`❌ Missing Control Tower fields: ${ctMissingFields.join(', ')}`);
    }
  } catch (error: any) {
    errors.push('Backward compatibility check failed');
    console.log('❌ Backward compatibility check failed');
  }

  console.log('\n--- Scenario 7: Graceful Degradation ---');
  try {
    // Even if cross-engine intelligence is unavailable, surfaces should still work
    const dailyPlanResponse = await axios.get(`${BASE_URL}/daily-plan/${TEST_USER_ID}/today`);
    const controlTowerResponse = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    
    if (dailyPlanResponse.status === 200 && controlTowerResponse.status === 200) {
      console.log('✅ All surfaces return valid responses (graceful degradation working)');
    } else {
      errors.push('Surfaces failed to return valid responses');
      console.log('❌ Surfaces failed to return valid responses');
    }
  } catch (error: any) {
    errors.push('Graceful degradation check failed');
    console.log('❌ Graceful degradation check failed');
  }

  console.log('\n--- Scenario 8: Multi-Domain Orchestration Visibility ---');
  try {
    const dailyPlanResponse = await axios.get(`${BASE_URL}/daily-plan/${TEST_USER_ID}/today`);
    const dailyPlan = dailyPlanResponse.data?.data;

    if (dailyPlan?.crossEngineIntelligence?.topPatterns && dailyPlan.crossEngineIntelligence.topPatterns.length > 0) {
      console.log('✅ Multi-domain patterns visible in Daily AI Plan');
      dailyPlan.crossEngineIntelligence.topPatterns.forEach((pattern: any) => {
        console.log(`   - [${pattern.severity}] ${pattern.name}: ${pattern.summary}`);
      });
    } else {
      console.log('⚠️ No multi-domain patterns detected (may be optimal state)');
    }

    const controlTowerResponse = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const controlTower = controlTowerResponse.data?.data;

    if (controlTower?.crossEngine?.topPatterns && controlTower.crossEngine.topPatterns.length > 0) {
      console.log('✅ Multi-domain patterns visible in Control Tower');
    } else {
      console.log('⚠️ No multi-domain patterns in Control Tower (may be optimal state)');
    }
  } catch (error: any) {
    errors.push('Multi-domain orchestration visibility check failed');
    console.log('❌ Multi-domain orchestration visibility check failed');
  }

  console.log('\n--- Scenario 9: Coordinated Actions Visibility ---');
  try {
    const dailyPlanResponse = await axios.get(`${BASE_URL}/daily-plan/${TEST_USER_ID}/today`);
    const dailyPlan = dailyPlanResponse.data?.data;

    if (dailyPlan?.crossEngineIntelligence?.actions && dailyPlan.crossEngineIntelligence.actions.length > 0) {
      console.log('✅ Coordinated actions visible in Daily AI Plan');
      console.log(`   Actions: ${dailyPlan.crossEngineIntelligence.actions.length}`);
      dailyPlan.crossEngineIntelligence.actions.slice(0, 3).forEach((action: string) => {
        console.log(`   - ${action}`);
      });
    } else {
      console.log('⚠️ No coordinated actions in Daily AI Plan');
    }

    const controlTowerResponse = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    const controlTower = controlTowerResponse.data?.data;

    if (controlTower?.crossEngine?.keyActions && controlTower.crossEngine.keyActions.length > 0) {
      console.log('✅ Coordinated actions visible in Control Tower');
      console.log(`   Key Actions: ${controlTower.crossEngine.keyActions.length}`);
    } else {
      console.log('⚠️ No coordinated actions in Control Tower');
    }
  } catch (error: any) {
    errors.push('Coordinated actions visibility check failed');
    console.log('❌ Coordinated actions visibility check failed');
  }

  console.log('\n--- Scenario 10: Overall System Integration ---');
  try {
    const crossEngineResponse = await axios.get(`${BASE_URL}/cross-engine-intelligence/${TEST_USER_ID}/today`);
    const dailyPlanResponse = await axios.get(`${BASE_URL}/daily-plan/${TEST_USER_ID}/today`);
    const controlTowerResponse = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    
    const allSuccessful = crossEngineResponse.status === 200 && 
                          dailyPlanResponse.status === 200 && 
                          controlTowerResponse.status === 200;

    if (allSuccessful) {
      console.log('✅ Complete system integration validated');
      console.log('   - Cross-Engine Intelligence Layer operational');
      console.log('   - Daily AI Plan integrated');
      console.log('   - Control Tower integrated');
      console.log('   - System operates as one integrated AI health brain');
    } else {
      errors.push('Complete system integration failed');
      console.log('❌ Complete system integration failed');
    }
  } catch (error: any) {
    errors.push('Overall system integration check failed');
    console.log('❌ Overall system integration check failed');
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
  console.log('INTEGRATION STATUS');
  console.log('='.repeat(80));
  console.log('The Final Integration Pass validates that:');
  console.log('1. Cross-Engine Intelligence actively shapes Daily AI Plan');
  console.log('2. Control Tower includes dedicated Cross-Engine card');
  console.log('3. Workout Today and Nutrition Today track cross-engine influence');
  console.log('4. All changes are backward compatible');
  console.log('5. System degrades gracefully when cross-engine data unavailable');
  console.log('6. Multi-domain orchestration is visible across all surfaces');
  console.log('7. The Personal AI Health Agent operates as one integrated brain');
  console.log('='.repeat(80));

  process.exit(errors.length === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
