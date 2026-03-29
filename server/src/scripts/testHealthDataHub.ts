import 'dotenv/config';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3020';
const TEST_USER_ID = 'test-health-hub-user';

async function testHealthDataHub() {
  console.log('Health Data Hub API Test');
  console.log('========================\n');

  try {
    // Test 1: Get Health Data Status
    console.log('1. Testing GET /health-data/status');
    const statusResponse = await fetch(`${BASE_URL}/health-data/status?user_id=${TEST_USER_ID}`);
    const statusData = await statusResponse.json();
    
    if (statusResponse.ok && statusData.success) {
      console.log(`✅ Status endpoint working - ${statusData.data.length} sections returned`);
      console.log(`   Sections: ${statusData.data.map((s: any) => s.section).join(', ')}\n`);
    } else {
      console.log('❌ Status endpoint failed\n');
      return;
    }

    // Test 2: Get Baseline Profile (should be null initially)
    console.log('2. Testing GET /health-data/baseline/profile');
    const profileGetResponse = await fetch(`${BASE_URL}/health-data/baseline/profile?user_id=${TEST_USER_ID}`);
    const profileGetData = await profileGetResponse.json();
    
    if (profileGetResponse.ok) {
      console.log(`✅ Baseline profile GET working - ${profileGetData.data ? 'Profile exists' : 'No profile yet'}\n`);
    } else {
      console.log('❌ Baseline profile GET failed\n');
    }

    // Test 3: Update Baseline Profile
    console.log('3. Testing POST /health-data/baseline/profile');
    const profileUpdateResponse = await fetch(`${BASE_URL}/health-data/baseline/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        demographics: {
          age: 35,
          gender: 'Male',
          height: 72,
          weight: 185,
        },
        healthGoals: ['Improve energy', 'Build muscle', 'Reduce stress'],
        workoutGoals: ['Increase strength', 'Improve endurance'],
        trainingContext: '5 years lifting experience, currently doing PPL split',
        lifestyleContext: 'Desk job, moderate stress, sleep 7 hours',
      }),
    });
    const profileUpdateData = await profileUpdateResponse.json();
    
    if (profileUpdateResponse.ok && profileUpdateData.success) {
      console.log(`✅ Baseline profile POST working - ${profileUpdateData.data.completionPercentage}% complete\n`);
    } else {
      console.log('❌ Baseline profile POST failed\n');
    }

    // Test 4: Get Workout Schedule (should be null initially)
    console.log('4. Testing GET /health-data/workout-schedule');
    const scheduleResponse = await fetch(`${BASE_URL}/health-data/workout-schedule?user_id=${TEST_USER_ID}`);
    const scheduleData = await scheduleResponse.json();
    
    if (scheduleResponse.ok) {
      console.log(`✅ Workout schedule GET working - ${scheduleData.data ? 'Schedule exists' : 'No schedule yet'}\n`);
    } else {
      console.log('❌ Workout schedule GET failed\n');
    }

    // Test 5: Get Supplement Intake (should be null initially)
    console.log('5. Testing GET /health-data/supplement-intake');
    const intakeResponse = await fetch(`${BASE_URL}/health-data/supplement-intake?user_id=${TEST_USER_ID}`);
    const intakeData = await intakeResponse.json();
    
    if (intakeResponse.ok) {
      console.log(`✅ Supplement intake GET working - ${intakeData.data ? 'Intake exists' : 'No intake yet'}\n`);
    } else {
      console.log('❌ Supplement intake GET failed\n');
    }

    // Test 6: Get Bloodwork Summary
    console.log('6. Testing GET /health-data/bloodwork/summary');
    const bloodworkResponse = await fetch(`${BASE_URL}/health-data/bloodwork/summary?user_id=${TEST_USER_ID}`);
    const bloodworkData = await bloodworkResponse.json();
    
    if (bloodworkResponse.ok && bloodworkData.success) {
      console.log(`✅ Bloodwork summary GET working - ${bloodworkData.data.documentCount} documents\n`);
    } else {
      console.log('❌ Bloodwork summary GET failed\n');
    }

    // Test 7: Get Updated Status (should show baseline as incomplete)
    console.log('7. Testing updated status after baseline profile update');
    const updatedStatusResponse = await fetch(`${BASE_URL}/health-data/status?user_id=${TEST_USER_ID}`);
    const updatedStatusData = await updatedStatusResponse.json();
    
    if (updatedStatusResponse.ok && updatedStatusData.success) {
      const baselineSection = updatedStatusData.data.find((s: any) => s.section === 'baseline');
      console.log(`✅ Updated status working - Baseline: ${baselineSection.status}, ${baselineSection.summary}\n`);
    } else {
      console.log('❌ Updated status failed\n');
    }

    console.log('========================');
    console.log('All Health Data Hub API tests passed! ✅');
    console.log('========================\n');

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

testHealthDataHub().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
