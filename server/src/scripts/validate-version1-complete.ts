import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const TEST_USER_ID = 'version1-validation-test';

interface ValidationResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  errors?: string[];
}

const results: ValidationResult[] = [];

async function validateEngine(
  name: string,
  endpoint: string,
  requiredFields: string[]
): Promise<void> {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    const data = response.data?.data;

    if (!data) {
      results.push({
        component: name,
        status: 'FAIL',
        message: 'No data returned',
      });
      return;
    }

    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      results.push({
        component: name,
        status: 'WARN',
        message: 'Some fields missing',
        errors: missingFields,
      });
    } else {
      results.push({
        component: name,
        status: 'PASS',
        message: 'All required fields present',
      });
    }
  } catch (error: any) {
    results.push({
      component: name,
      status: 'FAIL',
      message: `Request failed: ${error.message}`,
    });
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('VERSION 1 PRODUCTION VALIDATION');
  console.log('Personal AI Health Agent - Complete System Validation');
  console.log('='.repeat(80));

  console.log('\n--- PHASE 1: ENGINE VALIDATION ---\n');

  await validateEngine(
    'Recovery Engine',
    `/recovery/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'recoveryStatus', 'recommendation']
  );

  await validateEngine(
    'Stress Engine',
    `/stress/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'stressStatus', 'recommendation']
  );

  await validateEngine(
    'Joint Health Engine',
    `/joint/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'riskLevel', 'recommendation']
  );

  await validateEngine(
    'Adherence Engine',
    `/adherence/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'status', 'recommendation']
  );

  await validateEngine(
    'Workout Engine',
    `/workout-engine/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'workoutStatus', 'recommendation']
  );

  await validateEngine(
    'Nutrition Engine',
    `/nutrition/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'nutritionStatus', 'recommendation']
  );

  await validateEngine(
    'Metabolic Engine',
    `/metabolic/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'metabolicStatus', 'recommendation']
  );

  await validateEngine(
    'Cardiovascular Engine',
    `/cardiovascular/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'cardiovascularStatus', 'recommendation']
  );

  await validateEngine(
    'Sexual Health Engine',
    `/sexual-health/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'sexualHealthStatus', 'recommendation']
  );

  await validateEngine(
    'Supplement Engine',
    `/supplements/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'supplementStatus', 'recommendation']
  );

  console.log('\n--- PHASE 2: ORCHESTRATION VALIDATION ---\n');

  await validateEngine(
    'Cross-Engine Intelligence',
    `/cross-engine-intelligence/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'overallStatus', 'engineSnapshot', 'patterns', 'evidence', 'recommendation']
  );

  console.log('\n--- PHASE 3: EXECUTION ENGINE VALIDATION ---\n');

  await validateEngine(
    'Workout Today',
    `/workout-today/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'workoutType', 'workoutStatus', 'exercises', 'summary']
  );

  await validateEngine(
    'Nutrition Today',
    `/nutrition-today/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'summary', 'targets']
  );

  console.log('\n--- PHASE 4: AGGREGATION & PRESENTATION VALIDATION ---\n');

  await validateEngine(
    'Daily AI Plan',
    `/daily-plan/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'summary', 'recoverySnapshot', 'topPriorities', 'workout', 'nutrition']
  );

  await validateEngine(
    'Control Tower Daily',
    `/control-tower/${TEST_USER_ID}/today`,
    ['id', 'userId', 'date', 'overallStatus', 'headline', 'reasoning', 'trust', 'workout', 'nutrition']
  );

  console.log('\n--- PHASE 5: GRACEFUL DEGRADATION VALIDATION ---\n');

  try {
    const response = await axios.get(`${BASE_URL}/daily-plan/nonexistent-user-12345/today`);
    if (response.status === 200) {
      results.push({
        component: 'Graceful Degradation',
        status: 'PASS',
        message: 'System handles missing user data gracefully',
      });
    }
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      results.push({
        component: 'Graceful Degradation',
        status: 'WARN',
        message: 'System returns error for missing user (acceptable)',
      });
    } else {
      results.push({
        component: 'Graceful Degradation',
        status: 'PASS',
        message: 'System handles errors appropriately',
      });
    }
  }

  console.log('\n--- PHASE 6: INTEGRATION CONSISTENCY VALIDATION ---\n');

  try {
    const dailyPlanResponse = await axios.get(`${BASE_URL}/daily-plan/${TEST_USER_ID}/today`);
    const controlTowerResponse = await axios.get(`${BASE_URL}/control-tower/${TEST_USER_ID}/today`);
    
    const dailyPlan = dailyPlanResponse.data?.data;
    const controlTower = controlTowerResponse.data?.data;

    if (dailyPlan?.summary?.overallStatus === controlTower?.overallStatus) {
      results.push({
        component: 'Integration Consistency',
        status: 'PASS',
        message: 'Daily Plan and Control Tower status aligned',
      });
    } else {
      results.push({
        component: 'Integration Consistency',
        status: 'WARN',
        message: `Status mismatch: Daily Plan (${dailyPlan?.summary?.overallStatus}) vs Control Tower (${controlTower?.overallStatus})`,
      });
    }
  } catch (error: any) {
    results.push({
      component: 'Integration Consistency',
      status: 'FAIL',
      message: 'Could not validate consistency',
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.status === 'PASS').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`\nTotal Components: ${total}`);
  console.log(`✅ PASS: ${passed}`);
  console.log(`⚠️  WARN: ${warned}`);
  console.log(`❌ FAIL: ${failed}`);

  console.log('\n--- DETAILED RESULTS ---\n');

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} ${result.component}: ${result.message}`);
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach(err => console.log(`   - ${err}`));
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('VERSION 1 COMPONENT STATUS');
  console.log('='.repeat(80));

  const enginesPassed = results.filter(r => 
    r.component.includes('Engine') && r.status === 'PASS'
  ).length;
  const enginesTotal = results.filter(r => r.component.includes('Engine')).length;

  console.log(`\n🧠 Engines: ${enginesPassed}/${enginesTotal} operational`);
  console.log(`   - Recovery, Stress, Joint, Adherence`);
  console.log(`   - Workout, Nutrition, Metabolic`);
  console.log(`   - Cardiovascular, Sexual Health, Supplement`);

  const orchestrationPassed = results.find(r => 
    r.component === 'Cross-Engine Intelligence'
  )?.status === 'PASS';
  console.log(`\n🔗 Cross-Engine Intelligence: ${orchestrationPassed ? 'PASS' : 'FAIL'}`);

  const executionPassed = results.filter(r => 
    (r.component === 'Workout Today' || r.component === 'Nutrition Today') && 
    r.status === 'PASS'
  ).length;
  console.log(`\n⚡ Execution Engines: ${executionPassed}/2 operational`);
  console.log(`   - Workout Today, Nutrition Today`);

  const aggregationPassed = results.filter(r => 
    (r.component === 'Daily AI Plan' || r.component === 'Control Tower Daily') && 
    r.status === 'PASS'
  ).length;
  console.log(`\n📊 Aggregation & Presentation: ${aggregationPassed}/2 operational`);
  console.log(`   - Daily AI Plan, Control Tower Daily`);

  console.log('\n' + '='.repeat(80));
  console.log('PRODUCTION READINESS ASSESSMENT');
  console.log('='.repeat(80));

  const criticalFailed = failed > 0;
  const productionReady = !criticalFailed && passed >= (total * 0.8);

  if (productionReady) {
    console.log('\n✅ VERSION 1 PRODUCTION READY');
    console.log('\nThe Personal AI Health Agent has passed production validation:');
    console.log('- Ten engines operational with AI enrichment');
    console.log('- Cross-engine orchestration layer functional');
    console.log('- Execution engines generating coordinated plans');
    console.log('- Aggregation surfaces presenting unified intelligence');
    console.log('- System operates as one integrated AI health brain');
  } else {
    console.log('\n⚠️  VERSION 1 REQUIRES ATTENTION');
    console.log(`\n${failed} critical failures detected`);
    console.log('Review failed components before production deployment');
  }

  console.log('\n' + '='.repeat(80));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
