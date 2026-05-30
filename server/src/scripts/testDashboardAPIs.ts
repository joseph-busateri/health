/// <reference types="node" />
import 'dotenv/config';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3020';
const TEST_USER_ID = 'default-user';

async function testDashboardAPIs() {
  console.log('Testing Dashboard V13 API Endpoints');
  console.log('====================================\n');

  const endpoints = [
    { name: 'Control Tower', url: `/control-tower/overall-health?user_id=${TEST_USER_ID}` },
    { name: 'Recovery Engine', url: `/recovery-engine/today?user_id=${TEST_USER_ID}` },
    { name: 'Stress Engine', url: `/stress-engine/today?user_id=${TEST_USER_ID}` },
    { name: 'Joint Health Engine', url: `/joint-health-engine/today?user_id=${TEST_USER_ID}` },
    { name: 'Adherence Engine', url: `/adherence-engine/today?user_id=${TEST_USER_ID}` },
    { name: 'Supplement Engine', url: `/supplement-engine/recommendations?user_id=${TEST_USER_ID}` },
    { name: 'Workout Engine', url: `/workout-engine/today?user_id=${TEST_USER_ID}` },
    { name: 'Bloodwork Latest', url: `/bloodwork/results/latest?user_id=${TEST_USER_ID}` },
  ];

  let passCount = 0;
  let failCount = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.url}`);
      const data = await response.json();

      if (response.ok && data.success !== false) {
        console.log(`✅ ${endpoint.name}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Data: ${JSON.stringify(data).substring(0, 100)}...\n`);
        passCount++;
      } else {
        console.log(`❌ ${endpoint.name}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${JSON.stringify(data)}\n`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}`);
      console.log(`   Error: ${(error as Error).message}\n`);
      failCount++;
    }
  }

  console.log('====================================');
  console.log(`Results: ${passCount} passed, ${failCount} failed`);
  console.log('====================================\n');

  if (failCount === 0) {
    console.log('✅ All dashboard APIs are working!\n');
  } else {
    console.log('⚠️  Some dashboard APIs failed. Check the errors above.\n');
  }
}

testDashboardAPIs().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
